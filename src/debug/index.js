import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import g from "/lib/game_.js";
import supabase from "/lib/supabase.js";

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id'),
      eventId = document.location.hash.substr(1),
      options = params.get('options')?.split(',') || [];

const [tables, seated, evented] = await Promise.all([
  supabase.from("tables").select('*,game_id(slug)').eq("id", tableId),
  supabase.rpc('seated', {_table_id: tableId}),
  supabase.rpc('evented', {_table_id: tableId})
]);

const table = tables.data[0],
      seats = _.toArray(_.repeat(_.count(seated.data) || 4, {})),
      seen = _.toArray(_.range(0, _.count(seats))),
      slug = table.game_id.slug,
      config = table.config,
      {make} = await import(`/games/${slug}/core.js`),
      simulate = g.simulate(make),
      effects = _.comp(g.effects, simulate);

const thru = eventId ? _.maybe(evented.data, _.detectIndex(function({id}){
  return id === eventId;
}, _), _.inc) : null;

const events = thru == null ? evented.data : _.chain(evented.data, _.take(thru, _), _.toArray),
      held = thru == null ? [] : _.chain(evented.data, _.drop(thru, _), _.toArray);

const [curr, prior] = simulate({seats, config, seen}),
      $game = $.cell(curr);

$.sub($.hist($game), _.map(g.effects), _.log);

function sim({events = [], commands = [], seat = null} = {}){
  const snapshot = _.chain($game, _.deref, _.deref);
  if (_.seq(commands)){
    if (seat == null) {
      throw Error("Must specify seat with commands.");
    }
    return effects({seats, config, events, commands, seen: [seat], snapshot});
  } else {
    return effects({seats, config, events, commands, seen, snapshot});
  }
}

function run({events = [], commands = [], seat = null} = {}){
  if (_.seq(events)){
    g.batch($game, g.fold, events);
    _.log("digested", {events});
  }
  if (_.seq(commands)) {
    const result = sim({commands, seat});
    _.log("issued", {commands, seat, result});
    run({events: result.added});
  }
}

function flush(){
  _.swap($game, _.compact);
  _.log("flushed");
}

run({events});

//example: run({commands: [{type: "pass"},{type: "commit"}], seat: 1});
Object.assign(window, {$game, effects, g, sim, run, held, flush, supabase});
