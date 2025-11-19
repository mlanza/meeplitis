import _ from "./src/libs/atomic_/core.js";
import $ from "./src/libs/atomic_/shell.js";
import {reel} from "./src/libs/reel/shell.js";

// Create a reel instance
const r = reel("QDaitfgARpk", 0);

console.log("\n=== Testing Event Subscriptions ===\n");

// Test 1: Subscribe to materialized:perspective
console.log("1. Subscribing to 'materialized:perspective'...");
$.on(r, "materialized:perspective", function(event){
  console.log("  ✓ materialized:perspective fired:", {
    type: event.type,
    curr: event.details.hist[0] ? "object" : "null",
    prior: event.details.hist[1] ? "object" : "null"
  });
});

// Test 2: Subscribe to dematerialized:perspective
console.log("2. Subscribing to 'dematerialized:perspective'...");
$.on(r, "dematerialized:perspective", function(event){
  console.log("  ✓ dematerialized:perspective fired:", {
    type: event.type,
    curr: event.details.hist[0] ? "object" : "null",
    prior: event.details.hist[1] ? "object" : "null"
  });
});

// Test 3: Subscribe to changed:perspective (root level)
console.log("3. Subscribing to 'changed:perspective'...");
$.on(r, "changed:perspective", function(event){
  console.log("  ✓ changed:perspective fired:", {
    type: event.type,
    hasValue: event.details.hist[0] != null
  });
});

// Test 4: Subscribe to nested changed event
console.log("4. Subscribing to 'changed:perspective.up'...");
$.on(r, "changed:perspective.up", function(event){
  console.log("  ✓ changed:perspective.up fired:", {
    type: event.type,
    curr: event.details.hist[0],
    prior: event.details.hist[1]
  });
});

// Test 5: Subscribe to another nested property
console.log("5. Subscribing to 'changed:perspective.actionable'...");
$.on(r, "changed:perspective.actionable", function(event){
  console.log("  ✓ changed:perspective.actionable fired:", {
    type: event.type,
    curr: event.details.hist[0],
    prior: event.details.hist[1]
  });
});

// Test 6: Subscribe to materialized:table
console.log("6. Subscribing to 'materialized:table'...");
$.on(r, "materialized:table", function(event){
  console.log("  ✓ materialized:table fired:", {
    type: event.type,
    hasTable: event.details.hist[0] != null
  });
});

// Test 7: Subscribe to changed:cursor.pos
console.log("7. Subscribing to 'changed:cursor.pos'...");
$.on(r, "changed:cursor.pos", function(event){
  console.log("  ✓ changed:cursor.pos fired:", {
    type: event.type,
    curr: event.details.hist[0],
    prior: event.details.hist[1]
  });
});

console.log("\n=== Waiting for events... ===\n");

// Keep the process alive for a bit to see events
setTimeout(() => {
  console.log("\n=== Test Complete ===\n");
  process.exit(0);
}, 10000);
