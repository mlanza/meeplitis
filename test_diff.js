import _ from "./src/libs/atomic_/core.js";

// Copy the updated diff function for testing
function diff(hist = [], max = 0, depth = 0, address = []) {
  const [curr, prior] = hist || [];

  // Check if either value is null - if so, report only this path without drilling down
  const currIsNullish = curr == null;
  const priorIsNullish = prior == null;

  // If transitioning from/to null, report this path only (don't drill into sub-paths)
  if (currIsNullish || priorIsNullish) {
    return _.eq(curr, prior) ? [] : [address];
  }

  // If both are objects/arrays and we haven't exceeded max depth, drill down
  if (depth <= max && (_.isObject(curr) || _.isObject(prior) || _.isArray(curr) || _.isArray(prior))) {
    const cks = _.maybe(curr, _.keys, _.toArray),
          pks = _.maybe(prior, _.keys, _.toArray);
    const childChanges = _.chain(
      _.union(cks, pks),
      _.map(function(key){
        return {address: _.conj(address, key), hist: [_.get(curr, key), _.get(prior, key)]};
      }, _),
      _.filter(function({hist}){
        return _.apply(_.notEq, hist);
      }, _),
      _.mapcat(function({address, hist}){
        return diff(hist, max, depth + 1, address);
      }, _),
      _.toArray);
    // If there are child changes, include this address as a parent
    return _.seq(childChanges) ? _.cons(address, childChanges) : [];
  } else {
    return _.eq(curr, prior) ? [] : [address];
  }
}

console.log("\n=== Testing diff with Parent Path Inclusion ===\n");

// Test 1: Nested change should include parent paths
console.log("Test 1: Nested change includes parent paths");
const result1 = diff([{a: {b: {c: 3}}}, {a: {b: {c: 2}}}], 10);
const arr1 = _.toArray(result1);
console.log("Result:", JSON.stringify(arr1, null, 2));
console.log("Expected: [], [a], [a,b], [a,b,c]");
const has1Root = _.some(p => _.eq(p, []), arr1);
const has1A = _.some(p => _.eq(p, ["a"]), arr1);
const has1AB = _.some(p => _.eq(p, ["a", "b"]), arr1);
const has1ABC = _.some(p => _.eq(p, ["a", "b", "c"]), arr1);
console.log("✓ Pass:", has1Root && has1A && has1AB && has1ABC);

// Test 2: Multiple nested changes with shared parents
console.log("\nTest 2: Multiple nested changes with shared parents");
const result2 = diff([
  {perspective: {event: {id: 1}, state: {dice: 3}}},
  {perspective: {event: {id: 2}, state: {dice: 2}}}
], 10);
const arr2 = _.toArray(result2);
console.log("Result:", JSON.stringify(arr2, null, 2));
const has2Root = _.some(p => _.eq(p, []), arr2);
const has2Perspective = _.some(p => _.eq(p, ["perspective"]), arr2);
const has2Event = _.some(p => _.eq(p, ["perspective", "event"]), arr2);
const has2State = _.some(p => _.eq(p, ["perspective", "state"]), arr2);
console.log("Expected: includes [], [perspective], [perspective,event], [perspective,state]");
console.log("✓ Pass:", has2Root && has2Perspective && has2Event && has2State);

// Test 3: Null transition includes parent (root changed because child changed to null)
console.log("\nTest 3: Null transition includes root parent");
const result3 = diff([{a: {b: 1}}, {a: null}], 10);
const arr3 = _.toArray(result3);
console.log("Result:", JSON.stringify(arr3, null, 2));
console.log("Expected: [], [a] (root changed because a changed to null)");
const has3Root = _.some(p => _.eq(p, []), arr3);
const has3A = _.some(p => _.eq(p, ["a"]), arr3);
const hasNo3AB = !_.some(p => _.eq(p, ["a", "b"]), arr3);
console.log("✓ Pass:", has3Root && has3A && hasNo3AB);

// Test 4: Root materialization
console.log("\nTest 4: Root materialization");
const result4 = diff([{a: 1}, null], 10);
const arr4 = _.toArray(result4);
console.log("Result:", JSON.stringify(arr4, null, 2));
console.log("Expected: [] only");
const has4Root = _.some(p => _.eq(p, []), arr4);
console.log("✓ Pass:", has4Root && arr4.length === 1);

console.log("\n=== All tests complete ===\n");
