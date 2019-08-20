function init(size, tileFactory) {
  // Initialize the tiles object
  const tiles = {};

  // Return methods for accessing and updating the tiles
  return {
    retrieve: (zxy) => getTileOrParent(zxy[0], zxy[1], zxy[2], 0, 0, size),
    prune,
    unrender,
    hideGroup,
    showGroup,
  };

  function getTileOrParent(
      z, x, y,     // Coordinates of the requested tile
      sx, sy, sw   // Cropping parameters--which part of the tile to use
      ) {

    // Retrieve the specified tile from the tiles object, add cropping info
    let id = z + "/" + x + "/" + y;
    let tile = tiles[id];
    let tilebox = { tile, sx, sy, sw };

    // If the tile exists and is ready, return it (along with the wrapped info)
    if (tile && tile.rendered) return tilebox;

    // Looks like the tile wasn't ready. Try using the parent tile
    if (z > 0 && sw > 1) { // Don't look too far back
      // Get coordinates and cropping parameters of the parent
      let pz = z - 1;
      let px = Math.floor(x / 2);
      let py = Math.floor(y / 2);
      let psx = sx / 2 + (x / 2 - px) * size;
      let psy = sy / 2 + (y / 2 - py) * size;
      let psw = sw / 2;

      tilebox = getTileOrParent(pz, px, py, psx, psy, psw); // recursive call!
    }

    // If the requested tile didn't exist, we need to order it from the factory
    // NOTE: orders are placed AFTER the recursive call for the parent tile,
    // so missing parents will be ordered first
    if (!tiles[id]) { 
      let newTile = tileFactory.create(z, x, y);
      if (newTile) tiles[id] = newTile;
    } else if (tile.loaded && !tile.rendered && !tile.rendering) { 
      // Tile exists but isn't rendered and is not in the middle of rendering
      // We now start redrawing it. Probably won't finish till later, BUT
      // what if it finishes right away? (i.e., just a recomposite or similar)
      tileFactory.redraw(tile);
    }

    return (tilebox && tilebox.tile && tilebox.tile.rendered)
      ? tilebox
      : undefined;
  }

  function prune(metric, threshold) {
    // Remove tiles far from current view (as measured by metric)
    var numTiles = 0;

    for ( let id in tiles ) {
      let tile = tiles[id];
      tile.priority = metric(tile.z, tile.x, tile.y);
      if (tile.priority < threshold) {
        numTiles ++;
        if (tile.rendering) tileFactory.priorities[tile.id] = tile.priority;
        continue;
      }

      // Tile is too far away. Cancel any ongoing work and delete it
      if (!tile.loaded) {
        console.log("rastermap cache: canceling load for tile " + id);
        tile.cancelLoad();
      }
      tile.canceled = true;
      delete tileFactory.priorities[tile.id];
      delete tiles[id];
    }
    return numTiles;
  }

  function unrender(group) {
    var groups = tileFactory.groups;

    var invalidate = 
      (groups.length <= 1)       ? invalidateTile
      : (group === undefined)    ? (tile, group) => invalidateAll(tile, groups)
      : (groups.includes(group)) ? invalidateGroup
      : () => true; // Bad group name. Do nothing

    Object.values(tiles).forEach( tile => invalidate(tile, group) );
  }

  function invalidateTile(tile, group) {
    tile.rendered = false;
  }

  function invalidateAll(tile, groups) {
    groups.forEach(group => tile.laminae[group].rendered = false);
    tile.rendered = false;
  }

  function invalidateGroup(tile, group) {
    tile.laminae[group].rendered = false;
    tile.rendered = false;
  }

  function hideGroup(group) {
    tileFactory.hideGroup(group);
    Object.values(tiles).forEach( tile => { tile.rendered = false; } );
  }

  function showGroup(group) {
    tileFactory.showGroup(group);
    Object.values(tiles).forEach( tile => { tile.rendered = false; } );
  }
}

export { init };
