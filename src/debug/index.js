import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import g from "/lib/game_.js";
import supabase from "/lib/supabase.js";

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id'),
      eventId = document.location.hash.substr(1),
      options = params.get('options')?.split(',') || [],
      cut = _.maybe(params.get('cut'), parseInt),
      local = _.includes(options, "local"),
      monitor = !_.includes(options, "nomonitor"),
      cache = !_.includes(options, "nocache");

//=> exec(commands) // on a blank game
const [tables, moments, seated, evented] = await Promise.all([
  supabase.from("tables").select('*,game_id(slug)').eq("id", tableId),
  supabase.from("moments").select('moment').eq("table_id", tableId).limit(1),
  supabase.rpc('seated', {_table_id: tableId}),
  supabase.rpc('evented', {_table_id: tableId})
]);

const table = tables.data[0],
      //snapshot = null, // cache ? _.getIn(moments.data, [0, "moment", "snapshot"]) : null,
      events = evented.data || [],
      seats = _.toArray(_.repeat(_.count(seated.data) || 4, {})),
      seen = _.toArray(_.range(0, _.count(seats))),
      commands = [],
      slug = table.game_id.slug,
      config = table.config,
      source = local ? "http://0.0.0.0:8090" : "https://yourmove.fly.dev",
      url = `${source}/mind/${slug}`,
      {make} = await import(`/games/${slug}/core.js`),
      simulate = g.simulate(make);

async function remote(url, seats, events, commands, config, seen, snapshot){
  const start = _.date();
  const resp = await fetch(url, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    headers: {
      'Accept': 'application/json',
      "Content-Type": "application/json"
    },
    body: JSON.stringify({seats, events, commands, config, seen, snapshot})
  });
  const results = await resp.json();
  const stop = _.date();
  const ms = _.elapsed(_.period(start, stop)).valueOf();
  _.log(ms, results);
  return results;
}

const front = cut ? _.chain(events, _.take(cut, _), _.toArray) : events,
      back  = cut ? _.chain(events, _.drop(cut, _), _.toArray) : [];

const [curr, prior] = simulate(seats, config, front, [], seen, null),
      $game = $.cell(curr),
      exec = g.batch($game, g.execute, _);

$.sub($.hist($game), t.map(g.summarize), _.log);
//g.batch($game, g.fold, front);

const snapshot = _.deref(curr);

//const [next, n1, n2] = simulate(seats, config, back, [], seen, snapshot);
const results = await remote(url, seats, back, [], config, seen, snapshot);

//g.batch($game, g.fold, monitor ? events : []);

//_.swap($game, _.compact);

Object.assign(window, {$game, exec, commands, supabase});
