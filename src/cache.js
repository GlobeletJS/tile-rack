export function initCache(size, tileFactory) {
  const tiles = {};
  const getID = tileFactory.getID || ( zxy => zxy.join("/") );

  return {
    retrieve: (zxy) => getTileOrParent(zxy, 0, 0, size),
    process,
    trim,
  };

  function getOrCreateTile(zxy) {
    let id = getID(zxy);
    if (tiles[id]) return tiles[id];

    let tile = tileFactory.create(...zxy); // TODO: review .create signature
    if (tile) tiles[id] = tile;
    return tile;
  }

  function getTileOrParent(
      zxy,        // Coordinates of the requested tile (could be more than 3D)
      sx, sy, sw  // Cropping parameters--which part of the tile to use
      ) {

    let tile = getOrCreateTile(zxy);
    if (!tile) return; // can't create tile for this zxy
    if (tile.ready) return { tile, sx, sy, sw };

    // Tile is not ready. Check the parent tile
    let [z, x, y] = zxy; // Safari has no ...rest in array destructuring
    if (z < 1 || sw < 2) return; // Don't look too far back

    // Get coordinates of the parent tile
    let pz = z - 1;
    let px = Math.floor(x / 2);
    let py = Math.floor(y / 2);
    let pzxy = [pz, px, py, ...zxy.slice(3)];

    // Compute cropping parameters for the parent
    let psx = sx / 2 + (x / 2 - px) * size;
    let psy = sy / 2 + (y / 2 - py) * size;
    let psw = sw / 2;

    return getTileOrParent(pzxy, psx, psy, psw);
  }

  function process(func) {
    Object.values(tiles).forEach( tile => func(tile) );
  }

  function trim(metric, threshold) {
    process(tile => { tile.priority = metric(tile); });
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
