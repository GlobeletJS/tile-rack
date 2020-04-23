export function initCache({ create, size = 512 }) {
  const tiles = {};
  const dzmax = Math.log2(size);

  function getOrCreateTile(zxy) {
    let id = zxy.join("/");
    if (tiles[id]) return tiles[id];

    let tile = create(...zxy); // TODO: review create signature
    if (tile) tiles[id] = tile;
    return tile;
  }

  return { retrieve, process, drop };

  function retrieve(zxy, condition) {
    if (!condition) condition = pzxy => {
      let pz = pzxy[0];
      let dz = zxy[0] - pz;
      return pz < 0 || dz > dzmax;
    };

    return getTileOrParent(zxy, condition, 0, 0, size);
  }

  function getTileOrParent(
    zxy,        // Coordinates of the requested tile (could be more than 3D)
    condition,  // Stopping criterion for recursion
    sx, sy, sw  // Cropping parameters--which part of the tile to use
  ) {

    let tile = getOrCreateTile(zxy);
    if (!tile) return; // can't create tile for this zxy
    if (tile.ready) return { tile, sx, sy, sw };

    // Get coordinates of the parent tile
    let [z, x, y] = zxy;
    let pz = z - 1;
    let px = Math.floor(x / 2);
    let py = Math.floor(y / 2);
    let pzxy = [pz, px, py, ...zxy.slice(3)]; // Include extra coords, if any

    if (condition(pzxy)) return;

    // Compute cropping parameters for the parent
    let psx = sx / 2 + (x / 2 - px) * size;
    let psy = sy / 2 + (y / 2 - py) * size;
    let psw = sw / 2;

    return getTileOrParent(pzxy, psx, psy, psw);
  }

  function process(func) {
    Object.values(tiles).forEach( tile => func(tile) );
  }

  function drop(condition) {
    var numTiles = 0;
    for (let id in tiles) {
      if (condition(tiles[id])) {
        tiles[id].cancel();
        delete tiles[id];
      } else {
        numTiles ++;
      }
    }
    return numTiles;
  }
}
