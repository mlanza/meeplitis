import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import supabase from "/lib/supabase.js";
import {session} from "/lib/session.js";
import {table, seated, onUpdate} from "/components/table/index.js";

const profile = dom.sel1("#profile"),
      username = dom.sel1("#username"),
      headline = dom.sel1("#headline"),
      form = dom.sel1("form"),
      taken = dom.sel1("#taken"),
      available = dom.sel1("#available"),
      pattern = new RegExp(dom.attr(username, "pattern"));

form.addEventListener("submit", process);

function process(e) {
  e.preventDefault();
  if (username.validity.valid && headline.validity.valid) {
    _.log("process");
  } else {
    _.log("fail");
  }
  return false; //returning false prevents default behavior
}

$.on(username, "input", async function(e){
  const username = dom.value(this);
  if (username) {
    const {data: [found], error} = await supabase.from("profiles").select('id').eq("username", username);
    dom.attr(profile, "data-availability", found ? "taken" : "available");
    this.setCustomValidity(found ? "Username taken" : "");
  } else {
    dom.attr(profile, "data-availability", "unknown");
  }
});

$.on(username, "keydown", function(e){
  this.setCustomValidity(pattern.test(e.key) ? "" : "Format invalid");
});
