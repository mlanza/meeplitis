import _ from "../atomic_/core.js";

export function diff(curr, prior, path = [], eq = _.eq) {
  if (eq(curr, prior)) {
    return [];
  }

  if (!_.isObject(curr) || !_.isObject(prior)) {
    return [{ hist: [curr, prior], path }];
  }

  const keys = new Set([
    ...Object.keys(prior),
    ...Object.keys(curr)
  ]);

  return [...keys].flatMap(key =>
    diff(curr[key], prior[key], [...path, key])
  );
}

export default diff;
