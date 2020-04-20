# tile-rack

A simple memory cache for map tiles

Returns tiles *synchronously*. If the tile at the requested z/x/y indices
is not yet in memory, tile-rack will:
1. Return a *parent* tile, along with cropping and scaling info so you can
   stretch it to cover the area of your requested tile
2. Request the correct tile (from the supplied API), so it will be ready for
   later calls to tile-rack

## Installation
tile-rack is provided as an ESM module import.
```javascript
import { initCache } from 'tile-rack';
```

## Initialization
initCache requires two parameters:
- size: pixel size at which the (square) tiles will be displayed
- tileFactory: a function that creates tiles

The supplied tileFactory function must have a method with the following
signature:
```javascript
newTile = tileFactory.create(...coords)
```
which will return a new tile object at the specified integer coordinates. The
object must be returned synchronously, even though the actual image data may
not yet be ready. The first 3 elements of coords MUST be z, x, y.

The returned tile object must have the following properties:
- `.ready`: A (Boolean) flag indicating whether the tile is ready to use
- `.cancel()`: A method to cancel any ongoing data loads or other factory tasks

### Optional tileFactory methods
- `tileFactory.getID(coords)`: A method to generate a unique ID from a given 
  coordinates array. Note that this ID is needed as the argument to the 
  getPriority method. If a .getID method is not present, default IDs will be 
  generated as follows: `id = coords.join("/")`

## API
Initialization returns an object with the following methods:
- `retrieve(zxy)`: Inputs an array containing the coordinates of a
  requested tile, and returns either the tile, or a parent tile. Tiles are
  returned in a "box" object with sx, sy, sw properties, indicating the
  cropping and scaling required to match a parent tile to the requested
  coordinates. The tile itself can be accessed via the `box.tile` property
- `process(func)`: Calls `func(tile)` for every tile in the cache
- `trim(metric, threshold)`: Calls `metric` method on every tile in the cache,
  and writes the returned metric value to a `tile.priority` property. Tiles 
  where `metric(tile) > threshold` are deleted from the cache.
  Return value is the number of tiles in the cache

## Default tile factory
For basic raster tile services, you can use the included wrapper:
```javascript
import { initRasterCache } from 'tile-rack';
```
initRasterCache requires two parameters:
- tileSize: pixel size at which the (square) tiles will be displayed
- getURL(z, x, y[, t]): A function that returns a tile URL for given indices
  z, x, y, t (t is optional)

A default tile factory function will be created, and used to initialize a tile
cache. The returned object is the same as that returned by `initCache`.
