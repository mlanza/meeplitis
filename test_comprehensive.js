import _ from "./src/libs/atomic_/core.js";
import $ from "./src/libs/atomic_/shell.js";
import {reel} from "./src/libs/reel/shell.js";

console.log("\n=== Comprehensive Event Test ===\n");

const r = reel("QDaitfgARpk", 0);

let eventLog = [];

// Subscribe to all event types
$.on(r, "materialized:table", function(event){
  eventLog.push({event: "materialized:table", curr: event.details.hist[0] != null, prior: event.details.hist[1] != null});
  console.log("✓ materialized:table");
});

$.on(r, "materialized:perspective", function(event){
  eventLog.push({event: "materialized:perspective", curr: event.details.hist[0] != null, prior: event.details.hist[1] != null});
  console.log("✓ materialized:perspective");
});

$.on(r, "changed:cursor.pos", function(event){
  eventLog.push({event: "changed:cursor.pos", curr: event.details.hist[0], prior: event.details.hist[1]});
  console.log(`✓ changed:cursor.pos (${event.details.hist[1]} -> ${event.details.hist[0]})`);
});

$.on(r, "changed:perspective.up", function(event){
  eventLog.push({event: "changed:perspective.up", curr: event.details.hist[0], prior: event.details.hist[1]});
  console.log("✓ changed:perspective.up");
});

$.on(r, "changed:table.status", function(event){
  eventLog.push({event: "changed:table.status", curr: event.details.hist[0], prior: event.details.hist[1]});
  console.log(`✓ changed:table.status (${event.details.hist[1]} -> ${event.details.hist[0]})`);
});

$.on(r, "dematerialized:perspective", function(event){
  eventLog.push({event: "dematerialized:perspective", curr: event.details.hist[0] != null, prior: event.details.hist[1] != null});
  console.log("✓ dematerialized:perspective");
});

console.log("Subscriptions set up. Waiting for events...\n");

setTimeout(() => {
  console.log("\n=== Event Summary ===");
  console.log(`Total events fired: ${eventLog.length}`);

  const materialized = eventLog.filter(e => e.event.startsWith("materialized:"));
  const dematerialized = eventLog.filter(e => e.event.startsWith("dematerialized:"));
  const changed = eventLog.filter(e => e.event.startsWith("changed:"));

  console.log(`- Materialized events: ${materialized.length}`);
  materialized.forEach(e => console.log(`  • ${e.event}`));

  console.log(`- Dematerialized events: ${dematerialized.length}`);
  dematerialized.forEach(e => console.log(`  • ${e.event}`));

  console.log(`- Changed events: ${changed.length}`);
  changed.forEach(e => console.log(`  • ${e.event}`));

  console.log("\n=== Test Complete ===\n");
  process.exit(0);
}, 8000);
