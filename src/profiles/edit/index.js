import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import supabase from "/lib/supabase.js";
import {session} from "/lib/session.js";

const username = dom.sel1("#username"),
      headline = dom.sel1("#headline"),
      description = dom.sel1("#description"),
      form = dom.sel1("form"),
      pattern = new RegExp(dom.attr(username, "pattern"));

form.addEventListener("submit", process);

const { data: [profile], error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.userId);

_.maybe(profile, _.get(_, "username"), _.str(_, " | ", "Your Move"), dom.text(dom.sel1("head title"), _));
_.maybe(profile, _.get(_, "username"), dom.text(dom.sel1(".banner h1"), _));
_.maybe(profile, _.get(_, "username"), function(username){
  username && dom.attr(form, "data-mode", "update");
});
_.chain(profile, _.get(_, "headline"), _.either(_, "Mysteriously quiet"), dom.text(dom.sel1(".banner .headline"), _));
_.chain(profile, _.get(_, "avatar_url"), _.collapse(_, "?s=200"), _.either(_, "/images/anon.svg"), dom.attr(dom.sel1(".banner img"), "src", _));
_.maybe(profile, _.get(_, "username"), dom.value(username, _));
_.maybe(profile, _.get(_, "headline"), dom.value(headline, _));
_.maybe(profile, _.get(_, "description"), dom.value(description, _));

if (!profile) {
  dom.prop(username, "disabled", "");
  username.focus();
}

async function process(e) {
  e.preventDefault();
  if (username.validity.valid && headline.validity.valid) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: session.userId,
        username: dom.value(username),
        headline: dom.value(headline) || null,
        description: dom.value(description) || null
      })
      .select();
      location.reload();
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
