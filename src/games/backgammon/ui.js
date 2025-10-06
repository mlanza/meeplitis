import _ from "/libs/atomic_/core.js";
import dom from "/libs/atomic_/dom.js";
import $ from "/libs/atomic_/shell.js";
import {session} from "/libs/session.js";
import {manageTables} from "/components/table/ui.js";

const {div, span, img, a, p, button, submit, form, label, input} = dom.tags(['div', 'span', 'img', 'a', 'p', 'button', 'submit', 'form', 'label', 'input']);
const radio = dom.tag('input', {type: "radio"});
const checkbox = dom.tag('input', {type: "checkbox"});

manageTables(function(open, game){
  const el = form({id: "creates"},
    label(span("Cube?"), checkbox({name: "raise-stakes"}), " Raise stakes with doubling cube"),
    label(span("Remark"), input({type: "text", name: "remark", maxlength: 100, placeholder: "x moves/day, learning game"})),
    input({type: "submit", value: "Open Table"}));
  el.addEventListener('submit', function(e){
    e.preventDefault();
    const seats = 2;
    const raiseStakes = el.elements["raise-stakes"].checked;
    const remark = el.elements["remark"].value;
    const config = {raiseStakes};
    open({seats, config, remark});
  });
  return el;
});
