import _ from "../atomic_/core.js";

function uniteKeys(curr, prior) {
  const keys = new Set([
    ...Object.keys(prior || {}),
    ...Object.keys(curr || {})
  ]);
  return [...keys];
}

export function diff(curr, prior, path = [], eq = _.eq) {
  if (eq(curr, prior)) {
    return [];
  }

  if (!_.isObject(curr) || !_.isObject(prior)) {
    return [{ hist: [curr, prior], path }];
  }

  const keys = uniteKeys(curr, prior);

  return [...keys].flatMap(key =>
    diff(curr[key], prior[key], [...path, key])
  );
}

export function changed(curr, prior, eq = _.eq) {
  const keys = uniteKeys(curr, prior);
  return _.chain(keys, _.reduce(function(memo, key){
    const c = _.get(curr, key),
          p = _.get(prior, key);
    return eq(c, p) ? memo : _.assoc(memo, key, [c, p]);
  }, {}, _), _.blot);
}
