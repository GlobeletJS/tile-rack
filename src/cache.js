export function initCache(size, tileFactory) {
  // Initialize the tiles object
  const tiles = {};
  const getID = tileFactory.getID || ( zxy => zxy.join("/") );

  // Return methods for accessing and updating the tiles
  return {
    retrieve: (zxy) => getTileOrParent(zxy, 0, 0, size),
    process,
    prune,
    trim,
    getPriority: (id) => (tiles[id]) ? tiles[id].priority : undefined,
  };

  function getTileOrParent(
      zxy,        // Coordinates of the requested tile (could be more than 3D)
      sx, sy, sw  // Cropping parameters--which part of the tile to use
      ) {

    // Retrieve the specified tile from the tiles object, add cropping info
    let id = getID(zxy);
    let tile = tiles[id];
    let tilebox = { tile, sx, sy, sw };

    // If the tile exists and is ready, return it (along with the wrapped info)
    if (tile && tile.rendered) return tilebox;

    // Looks like the tile wasn't ready. Try using the parent tile
    if (zxy[0] > 0 && sw > 1) { // Don't look too far back
      let [z, x, y] = zxy;

      // Get coordinates of the parent tile
      let pz = z - 1;
      let px = Math.floor(x / 2);
      let py = Math.floor(y / 2);
      // Copy any additional coordinates beyond the first 3
      let pzxy = [pz, px, py, ...zxy.slice(3)];

      // Compute cropping parameters for the parent
      let psx = sx / 2 + (x / 2 - px) * size;
      let psy = sy / 2 + (y / 2 - py) * size;
      let psw = sw / 2;

      // Get the parent tile. Recursive!
      tilebox = getTileOrParent(pzxy, psx, psy, psw);
    }

    // If the requested tile didn't exist, we need to order it from the factory
    // NOTE: orders are placed AFTER the recursive call for the parent tile,
    // so missing parents will be ordered first
    if (!tile) {
      // For backwards compatibility, assume tileFactory.create still takes
      // a list of coordinates as arguments
      let newTile = tileFactory.create(...zxy);
      if (newTile) tiles[id] = newTile;
    } else if (tileFactory.redraw) {
      // Tile exists but isn't ready. Make sure it is rendering
      tileFactory.redraw(tile);
    }

    return (tilebox && tilebox.tile && tilebox.tile.rendered)
      ? tilebox
      : undefined;
  }

  function process(func) {
    Object.values(tiles).forEach( tile => func(tile) );
  }

  function prune(metric, threshold) {
    // Update tile priorities using the supplied metric. ASSUMES 3 args!
    process(tile => { tile.priority = metric(tile.z, tile.x, tile.y); });
    // Remove tiles where priority is above the threshold
    return drop(threshold);
  }

  function trim(metric, threshold) {
    // Update tile priorities using the supplied metric
    process(tile => { tile.priority = metric(tile); });
    // Remove tiles where priority is above the threshold
    return drop(threshold);
  }

  function drop(threshold) {
    var numTiles = 0;
    for (let id in tiles) {
      if (tiles[id].priority > threshold) {
        tiles[id].cancel();
        delete tiles[id];
      } else {
        numTiles ++;
      }
    }
    return numTiles;
  }
}
