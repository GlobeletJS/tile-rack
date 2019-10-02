// Basic tile factory for raster data
export function initRasterFactory(getURL) {
  // Input getURL returns a tile URL for given indices z, x, y, t  (t optional)

  return { create };

  function create(z,x, y, t) {
    const tileHref = getURL(z, x, y, t);
    const img = loadImage(tileHref, checkData);

    const tile = { 
      z, x, y, t,  // t may be undefined, for 3D tile services
      img,
      cancel,
      canceled: false,
      rendered: false,
    };

    function checkData(err) {
      if (tile.canceled) return;
      if (err) return console.log(err);
      tile.rendered = true;
    }

    function cancel() {
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
