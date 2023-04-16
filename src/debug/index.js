import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import g from "/lib/game_.js";
import supabase from "/lib/supabase.js";

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id'),
      eventId = document.location.hash.substr(1),
      options = params.get('options')?.split(',') || [],
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
      moment = cache ? _.getIn(moments.data, [0, "moment"]) : null,
      commands = [],
      slug = table.game_id.slug,
      config = table.config;

const {make} = await import(`/games/${slug}/core.js`);

const count = eventId ? _.maybe(evented.data, g.detectIndex(_.pipe(_.get(_, "id"), _.eq(_, eventId)), _), _.inc) : null,
      seats = _.repeat(_.count(seated.data) || 4, {}),
      seen = _.toArray(_.range(0, _.count(seats))),
      events = count == null ?  evented.data : _.chain(evented.data, _.take(count, _), _.toArray),
      [preEvents, postEvents] = monitor && !cache ? [[], events] : [events, []],
      simulate = g.simulate(make),
      [curr, prior] = simulate(seats, config, preEvents, commands, seen, moment),
      $game = $.cell(curr);

_.log($game, "seen", seen);

$.sub($.hist($game), t.map(g.summarize), _.log);

g.batch($game, g.fold, postEvents);

const exec = g.batch($game, g.execute, _);

Object.assign(window, {$game, exec, commands, supabase});
