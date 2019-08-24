import { initCache } from "./cache.js";

export function init(size, tileFactory) {
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
