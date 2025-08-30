import _ from "/libs/atomic_/core.js";
import dom from "/libs/atomic_/dom.js";
import $ from "/libs/atomic_/shell.js";
import {session} from "/libs/session.js";
import {manageTables} from "/components/table/ui.js";

const {div, span, img, a, p, button, submit, form, label, input} = dom.tags(['div', 'span', 'img', 'a', 'p', 'button', 'submit', 'form', 'label', 'input']);
const radio = dom.tag('input', {type: "radio"});

manageTables(function(open, game){
  const el = form({id: "creates"},
    label(span("Players"), _.map(function(value){
      return label(value, radio({name: "players", value}, value === 2 ? {checked: "checked"} : null));
    }, [2, 3])),
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
    const config = {};
    open({seats, config, remark});
  });
  return el;
});
