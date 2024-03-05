import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import supabase from "/lib/supabase.js";
import {session} from "/lib/session.js";
import {manageTables} from "/components/table/index.js";

const {div, span, img, a, p, button, submit, form, label, input} = dom.tags(['div', 'span', 'img', 'a', 'p', 'button', 'submit', 'form', 'label', 'input']),
      radio = dom.tag('input', {type: "radio"});

manageTables(function(open, game){
  const el = form({id: "creates"},
    label(span("Players"), _.map(function(value){
      return label(value, radio({name: "players", value}, value === 2 ? {checked: "checked"} : null));
    }, _.range(2, 5))),
    label(span("Remark"), input({type: "text", name: "remark", maxlength: 100, placeholder: "x moves/day, learning game"})),
    input({type: "submit", value: "Open Table"}));
  el.addEventListener('submit', function(e){
    e.preventDefault();
    const seats = _.maybe(el.elements["players"], _.detect(function(el){
      return el.checked;
    }, _), dom.attr(_, "value"), parseInt);
    const variant = _.maybe(el.elements["variant"], _.detect(function(el){
      return el.checked;
    }, _), dom.attr(_, "value"));
    const remark = el.elements["remark"].value;
    const config = {}; //_.get({"up-down": {start: 1, end: 7}, "down-up": {start: 7, end: 1}}, variant);
    open({seats, config, remark});
  });
  return el;
});
