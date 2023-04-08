import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import g from "/lib/game_.js";
import supabase from "/lib/supabase.js";
import mexica, {districts, waterways, boats} from "../core.js";

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id'),
      hash = document.location.hash.substr(1),
      split  = params.get('split') || null,
      options = params.get('options')?.split(',') || [],
      monitor = !_.includes(options, "nomonitor");

const capulli = [
  [
    {size: 13, at: null},
    {size: 11, at: null},
    {size: 9, at: null},
    {size: 6, at: null},
    {size: 5, at: null},
    {size: 4, at: null},
    {size: 4, at: null},
    {size: 3, at: null}
  ],[
    {size: 12, at: null},
    {size: 10, at: null},
    {size: 8, at: null},
    {size: 7, at: null},
    {size: 6, at: null},
    {size: 5, at: null},
    {size: 3, at: null}
  ]
];

Promise.all([
  supabase.rpc('seated', {_table_id: tableId}),
  supabase.rpc('evented', {_table_id: tableId}),
  fetch("../data/commands.json").then(function(resp){
    return resp.json();
  })
]).then(function([seated, evented, commands]){
  const count = hash ? _.maybe(evented.data, _.keepIndexed(function(idx, event){
    return event.id === hash ? idx : null;
  }, _), _.first, _.inc) : _.count(evented.data);
  const seats = _.count(seated.data) || 4,
        events = count == null ?  evented.data : _.chain(evented.data, _.take(count, _), _.toArray),
        $game = $.cell(mexica(_.repeat(seats, {}), {dealCapulli: _.constantly(capulli)}));

  _.log($game)

  $.sub($.hist($game), t.map(monitor ? g.summarize : _.identity), _.log);

  g.batch($game, g.load, events);

  const exec = g.batch($game, g.run, _);

  Object.assign(window, {$game, exec, commands});

  //=> exec(commands) // on a blank game
});
