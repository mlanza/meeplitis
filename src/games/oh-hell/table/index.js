import _ from "/lib/@atomic/core.js";
import $ from "/lib/@atomic/reactives.js";
import t from "/lib/@atomic/transducers.js";
import * as g from "../../../lib/game.js";
import ohHell from "../lib/index.js";
import supabase from "../../../lib/supabase.js";

function mount(tableId, el){
  const $table = $.cell(null);
  const $state = $.cell(null);
  const $touch = $.map(_.get(_, "last_touch_id"), $table);
  $.sub($touch, _.see("touch"));
  $.sub($touch, t.filter(_.identity), function(last_touch_id){
    _.log("perpective is based on touch", last_touch_id);
    supabase.rpc('perspective', {
      _table_id: tableId
    })
    .then(function(resp){
      return resp.body;
    })
    .then(_.reset($state, _));
  });
  $.sub($.hist($state), function([curr, prior]){

  });
  $.sub($state, _.see("state"));

  supabase.from('tables')
    .select('*')
    .eq('id', tableId)
    .then(function(resp){
      return resp.body[0];
    })
    .then(_.reset($table, _));

  supabase.from('tables')
    .on('*',function(payload){
      switch (payload.eventType) {
        case "UPDATE":
          _.reset($table, payload.new);
          break;
        default:
          _.log("payload", payload);
          break;
      }
    })
    .subscribe();
}

const params = new URLSearchParams(document.location.search);
const id = params.get('id');
if (id) {
  mount(id);
} else {
  document.location.href = "../";
}

Object.assign(window, {supabase});
