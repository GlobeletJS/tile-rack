# tile-rack

A simple memory cache for map tiles

## Initialization
tileRack.init requires two parameters:
- size: pixel size at which tiles will be displayed
- tileFactory: a [tilekiln](https://github.com/jjhembd/tilekiln) instance for
  - creating new tiles and requesting source data
  - starting, prioritizing, and reporting render-related tasks
  - deleting tiles, and canceling associated requests or rendering tasks

## API
Initialization returns an object with the following methods:
- retrieve(zxy): Inputs an array containing the [z, x, y] coordinates of
  a requested tile, and returns either the tile, or a parent tile. Tiles are
  returned in a "box" along with sx, sy, sw parameters, indicating the
  cropping and scaling required to match a parent tile to the requested
  coordinates
- prune(metric, threshold): Removes tiles where metric(tile.z, tile.x, tile.y)
  is larger than threshold. Return value is the number of tiles in the cache.
- unrender(group): Sets .rendered flags to false for the specified tilekiln 
  layer group. Also sets the main tile.rendered flag to false, even if no
  group is specified.
- hideGroup(group), showGroup(group): Sets the .visible flag for the specified
  tilekiln layer group.
