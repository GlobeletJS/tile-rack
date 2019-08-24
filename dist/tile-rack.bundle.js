function initCache(size, tileFactory) {
  // Initialize the tiles object
  const tiles = {};

  // Return methods for accessing and updating the tiles
  return {
    retrieve: (zxy) => getTileOrParent(zxy[0], zxy[1], zxy[2], 0, 0, size),
    process: (func) => Object.values(tiles).forEach( tile => func(tile) ),
    prune,
    getPriority: (id) => (tiles[id]) ? tiles[id].priority : undefined,
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
    if (!tile) { 
      let newTile = tileFactory.create(z, x, y);
      if (newTile) tiles[id] = newTile;
    } else if (tileFactory.redraw) {
      // Tile exists but isn't ready. Make sure it is rendering
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
      if (tile.priority > threshold) {
        tile.cancel();  // Cancels ongoing data loads or rendering tasks
        delete tiles[id];
        continue;
      }
      numTiles ++;
    }
    return numTiles;
  }
}

function init(size, tileFactory) {
  const cache = initCache(size, tileFactory);

  return {
    retrieve: cache.retrieve,
    prune: cache.prune,
    getPriority: cache.getPriority,

    hideGroup,
    showGroup,
    unrender,
  }

  function hideGroup(group) {
    tileFactory.hideGroup(group);
    cache.process( (tile) => { tile.rendered = false; } );
  }

  function showGroup(group) {
    tileFactory.showGroup(group);
    cache.process( (tile) => { tile.rendered = false; } );
  }

  function unrender(group) {
    var groups = tileFactory.groups;

    var invalidate =
      (groups.length <= 1)       ? (tile) => { tile.rendered = false; }
      : (group === undefined)    ? (tile) => invalidateAll(tile, groups)
      : (groups.includes(group)) ? (tile) => invalidateGroup(tile, group)
      : () => true; // Bad group name. Do nothing

    cache.process(invalidate);
  }

  function invalidateAll(tile, groups) {
    groups.forEach(group => tile.laminae[group].rendered = false);
    tile.rendered = false;
  }

  function invalidateGroup(tile, group) {
    tile.laminae[group].rendered = false;
    tile.rendered = false;
  }
}

export { init };
