import { initCache } from "./cache.js";

export function initRasterCache(tileSize, getURL) {
  return initCache( tileSize, initRasterFactory(getURL) );
}

export function initRasterFactory(getURL) {
  // Basic tile factory for raster data
  // Input getURL returns a tile URL for given indices z, x, y, t  (t optional)

  return { create };

  function create(z, x, y, t) { // t may be undefined, for 3D tile services
    const tileHref = getURL(z, x, y, t);
    const img = loadImage(tileHref, checkData);

    const tile = { z, x, y, t, img };

    function checkData(err) {
      if (tile.canceled) return;
      if (err) return console.log(err);
      tile.ready = true;
    }

    tile.cancel = () => {
      img.src = "";
      tile.canceled = true;
    }

    return tile;
  }
}

function loadImage(href, callback) {
  const errMsg = "ERROR in loadImage for href " + href;

  const img = new Image();
  img.onerror = () => callback(errMsg);
  img.onload = checkImg;
  img.crossOrigin = "anonymous";
  img.src = href;

  return img;

  function checkImg() {
    return (img.complete && img.naturalWidth !== 0)
      ? callback(null)
      : callback(errMsg);
  }
}
