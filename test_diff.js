import _ from "./src/libs/atomic_/core.js";

// Copy the diff function for testing
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
    const cks = _.maybe(curr, _.keys),
          pks = _.maybe(prior, _.keys);
    return _.chain(
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
  } else {
    return _.eq(curr, prior) ? [] : [address];
  }
}

console.log("\n=== Testing Simplified diff function ===\n");

// Test 1: Materialization (null -> object) - should only report root
console.log("Test 1: Materialization (null -> object)");
const test1 = diff([{a: 1, b: {c: 2}}, null], 10);
console.log("Result:", JSON.stringify(test1, null, 2));
console.log("Expected: Only root path []");
console.log("✓ Pass:", test1.length === 1 && test1[0].length === 0);

// Test 2: Dematerialization (object -> null) - should only report root
console.log("\nTest 2: Dematerialization (object -> null)");
const test2 = diff([null, {a: 1, b: {c: 2}}], 10);
console.log("Result:", JSON.stringify(test2, null, 2));
console.log("Expected: Only root path []");
console.log("✓ Pass:", test2.length === 1 && test2[0].length === 0);

// Test 3: Nested property change (both non-null) - should drill down
console.log("\nTest 3: Nested property change (both non-null)");
const test3 = diff([{a: 1, b: {c: 3}}, {a: 1, b: {c: 2}}], 10);
console.log("Result:", JSON.stringify(test3, null, 2));
console.log("Expected: Drilled down to ['b', 'c']");
console.log("✓ Pass:", test3.length === 1 && _.eq(test3[0], ["b", "c"]));

// Test 4: Multiple nested changes (both non-null) - should drill down
console.log("\nTest 4: Multiple nested changes (both non-null)");
const test4 = diff([{a: 2, b: {c: 3}}, {a: 1, b: {c: 2}}], 10);
console.log("Result:", JSON.stringify(test4, null, 2));
console.log("Expected: Two paths: ['a'] and ['b', 'c']");
console.log("✓ Pass:", test4.length === 2);

// Test 5: Nested object materialization (null -> object at nested level)
console.log("\nTest 5: Nested object materialization (null -> object at nested level)");
const test5 = diff([{a: 1, b: {c: 2}}, {a: 1, b: null}], 10);
console.log("Result:", JSON.stringify(test5, null, 2));
console.log("Expected: Only ['b'] (no drill down into c)");
console.log("✓ Pass:", test5.length === 1 && _.eq(test5[0], ["b"]));

// Test 6: Nested object dematerialization (object -> null at nested level)
console.log("\nTest 6: Nested object dematerialization (object -> null at nested level)");
const test6 = diff([{a: 1, b: null}, {a: 1, b: {c: 2}}], 10);
console.log("Result:", JSON.stringify(test6, null, 2));
console.log("Expected: Only ['b'] (no drill down into c)");
console.log("✓ Pass:", test6.length === 1 && _.eq(test6[0], ["b"]));

// Test 7: Root level primitive change
console.log("\nTest 7: Root level primitive change");
const test7 = diff([5, 3], 10);
console.log("Result:", JSON.stringify(test7, null, 2));
console.log("Expected: Root path []");
console.log("✓ Pass:", test7.length === 1 && test7[0].length === 0);

// Test 8: No change
console.log("\nTest 8: No change");
const test8 = diff([{a: 1, b: {c: 2}}, {a: 1, b: {c: 2}}], 10);
console.log("Result:", JSON.stringify(test8, null, 2));
console.log("Expected: Empty array");
console.log("✓ Pass:", test8.length === 0);

console.log("\n=== All tests complete ===\n");
