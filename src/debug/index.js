import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import g from "/lib/game_.js";
import supabase from "/lib/supabase.js";

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id'),
      eventId = document.location.hash.substr(1),
      options = params.get('options')?.split(',') || [],
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
      snapshot = null, // cache ? _.getIn(moments.data, [0, "moment", "snapshot"]) : null,
      events = evented.data || [],
      seats = _.toArray(_.repeat(_.count(seated.data) || 4, {})),
      seen = _.toArray(_.range(0, _.count(seats))),
      commands = [],
      slug = table.game_id.slug,
      config = table.config,
      source = local ? "http://0.0.0.0:8090" : "https://yourmove.fly.dev";

const payload = {seats, events, commands, config, seen, snapshot};

if (!monitor) {
  const start = _.date();
  const resp = await fetch(`${source}/mind/${slug}?foo=bar`, {
    method: "POST",
    mode: "cors", // no-cors, *cors, same-origin,
    credentials: "omit", // include, *same-origin, omit
    headers: {
      'Accept': 'application/json',
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const results = await resp.json();
  const stop = _.date();
  const ms = _.elapsed(_.period(start, stop)).valueOf();
  _.log(ms, results);
} else {
  const {make} = await import(`/games/${slug}/core.js`);

  const simulate = g.simulate(make),
        [curr, prior] = simulate(seats, config, monitor ? [] : events, [], seen, snapshot),
        $game = $.cell(curr);

  _.log($game, "seen", seen);

  $.sub($.hist($game), t.map(g.summarize), _.log);

  g.batch($game, g.fold, monitor ? events : []);

  _.swap($game, _.compact);

  const exec = g.batch($game, g.execute, _);

  Object.assign(window, {$game, exec, commands, supabase});
}
