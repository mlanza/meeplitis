import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import supabase from "/lib/supabase.js";
import {session} from "/lib/session.js";

const profile = dom.sel1("#profile"),
      username = dom.sel1("#username"),
      headline = dom.sel1("#headline"),
      form = dom.sel1("form"),
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
  if (dom.value(this)) {
    const {data: [found], error} = await supabase.from("profiles").select('id').eq("username", dom.value(this));
    this.setCustomValidity(found ? "Username taken" : "");
  } else {
    this.setCustomValidity();
  }
});

$.on(username, "keydown", function(e){
  this.setCustomValidity(pattern.test(e.key) ? "" : "Format invalid");
});
