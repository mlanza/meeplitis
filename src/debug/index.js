import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import g from "/lib/game_.js";
import supabase from "/lib/supabase.js";

function timing(f){
  return async function(...args){
    const start = _.date();
    const results = await f(...args);
    const stop = _.date();
    const ms = _.elapsed(_.period(start, stop)).valueOf();
    return [ms, results];
  }
}

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id'),
      eventId = document.location.hash.substr(1),
      options = params.get('options')?.split(',') || [],
      cut = _.maybe(params.get('cut'), parseInt),
      server = params.get("server") || "browser", //local, remote, browser
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
      events = evented.data || [],
      seats = _.toArray(_.repeat(_.count(seated.data) || 4, {})),
      seen = _.toArray(_.range(0, _.count(seats))),
      commands = [],
      slug = table.game_id.slug,
      config = table.config,
      source = server == "local" ? "http://0.0.0.0:8090" : "https://yourmove.fly.dev",
      url = `${source}/mind/${slug}`,
      {make} = await import(`/games/${slug}/core.js`),
      simulate = g.simulate(make);

function remote(seats, config, events, commands, seen, snapshot){
  return fetch(url, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    headers: {
      'Accept': 'application/json',
      "Content-Type": "application/json"
    },
    body: JSON.stringify({seats, events, commands, config, seen, snapshot})
  }).then(function(resp){
    return resp.json();
  });
}

const sim = timing(server == "browser" ? simulate : remote);

const loaded = cut ? _.chain(events, _.take(cut, _), _.toArray) : events,
      added  = cut ? _.chain(events, _.drop(cut, _), _.toArray) : [],
      loadedUnseen = monitor ? [] : loaded,
      loadedSeen = monitor ? loaded : [];

const [curr, prior] = simulate(seats, config, loadedUnseen, [], seen, null),
      $game = $.cell(curr),
      exec = g.batch($game, g.execute, _);

$.sub($.hist($game), t.map(g.summarize), _.log);

g.batch($game, g.fold, loadedSeen);

const snapshot = _.chain($game, _.deref, _.deref);

_.log(...await sim(seats, config, added, commands, seen, snapshot));

_.swap($game, _.compact);

Object.assign(window, {$game, exec, commands, supabase});
