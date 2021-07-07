# tile-rack

![tests](https://github.com/GlobeletJS/tile-rack/actions/workflows/node.js.yml/badge.svg)

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
```javascript
const cache = initCache(create, size);
```

The supplied parameters are:
- create: a function that creates tiles
- size: pixel size at which the (square) tiles will be displayed

### Syntax of tile create function
The supplied create function must have the following signature:
```javascript
const newTile = create(...coords);
```
which will return a new tile object at the specified integer coordinates. The
object must be returned synchronously, even though the actual image data may
not yet be ready. The first 3 elements of coords MUST be z, x, y.

The returned tile object must have the following properties:
- `.ready`: A (Boolean) flag indicating whether the tile is ready to use
- `.cancel()`: A method to cancel any ongoing data loads or other factory tasks

## API
The cache function returned by `initCache` has three methods: `retrieve`, 
`process`, and `drop`.

### retrieve
```javascript
const tileBox = cache.retrieve(zxy, condition);
```

The supplied parameters are:
- `zxy`: An array containing the coordinates of the requested tile
- `condition`: Stopping condition for the recursion for parent tiles
  (see below)

The returned `tileBox` is a wrapper object with the following properties:
- `.tile`: The tile itself: either the one requested, or one of its parents
- `.sx`: The x-coordinate of the top left corner of the portion of the tile to
  be used, in units of tile pixels
- `.sy`: The y-coordinate of the top left corner of the portion of the tile to
  be used, in units of tile pixels
- `.sw`: The width of the (square) portion of the tile to be used, in units of
  tile pixels

If the returned tile is a parent tile, then `sw < size`, and `sx`, `sy`, and
`sw` can be used to crop and scale the tile to match the area of a tile at
the requested `zxy`

When the tile at the requested `zxy` is not ready, the cache will recursively
check for a parent tile at the next lower zoom level. The extent of this
recursion is limited by the supplied condition. If `condition(zxy) === true`
for the current tile, `.retrieve` will stop the recursion through parent tiles
and return undefined.

If a condition is not supplied, recursion will stop when the parent tile zoom
`pz` meets the following condition:
```javascript
pz < 0 || (zxy[0] - pz) > Math.log2(size)
```

### process
```javascript
cache.process(func);
```
Executes `func(tile)` for every tile in the cache

### drop
```javascript
var numTiles = drop(condition);
```
Deletes tiles from the cache for which `condition(tile) === true`.
Return value is the number of tiles remaining in the cache

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
