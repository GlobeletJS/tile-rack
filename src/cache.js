export function initCache({ create, size = 512 }) {
  const tiles = {};
  const dzmax = Math.log2(size);

  function getOrCreateTile(zxy) {
    const id = zxy.join("/");
    if (tiles[id]) return tiles[id];

    const tile = create(...zxy); // TODO: review create signature
    if (tile) tiles[id] = tile;
    return tile;
  }

  return { retrieve, process, drop };

  function retrieve(zxy, condition) {
    const z = zxy[0];
    if (!condition) condition = ([pz]) => (pz < 0 || (z - pz) > dzmax);

    return getTileOrParent(zxy, 0, 0, size, condition);
  }

  function getTileOrParent(
    zxy,        // Coordinates of the requested tile (could be more than 3D)
    sx, sy, sw, // Cropping parameters--which part of the tile to use
    condition   // Stopping criterion for recursion
  ) {
    if (condition(zxy)) return;

    const tile = getOrCreateTile(zxy);
    if (!tile) return; // can't create tile for this zxy
    if (tile.ready) return { tile, sx, sy, sw };

    // Get coordinates of the parent tile
    const [z, x, y] = zxy;
    const pz = z - 1;
    const px = Math.floor(x / 2);
    const py = Math.floor(y / 2);
    const pzxy = [pz, px, py, ...zxy.slice(3)]; // Include extra coords, if any

    // Compute cropping parameters for the parent
    const psx = sx / 2 + (x / 2 - px) * size;
    const psy = sy / 2 + (y / 2 - py) * size;
    const psw = sw / 2;

    return getTileOrParent(pzxy, psx, psy, psw, condition);
  }

  function process(func) {
    Object.values(tiles).forEach( tile => func(tile) );
  }

  function drop(condition) {
    let numTiles = 0;
    for (const id in tiles) {
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
