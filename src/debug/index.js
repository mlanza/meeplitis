import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import g from "/lib/game_.js";
import supabase from "/lib/supabase.js";

//triggers on discrete updates, like reduce but with side effects for each item
function batch($state, f, xs){
  _.each(function(x){
    _.swap($state, function(state){
      return f(state, x);
    });
  }, xs);
}

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id'),
      hash = document.location.hash.substr(1),
      split  = params.get('split') || null,
      options = params.get('options')?.split(',') || [],
      monitor = !_.includes(options, "nomonitor");

//=> exec(commands) // on a blank game
const [tables, seated, evented] = await Promise.all([
  supabase.from("tables").select('*,game_id(slug)').eq("id", tableId),
  supabase.rpc('seated', {_table_id: tableId}),
  supabase.rpc('evented', {_table_id: tableId})
]);

const table = tables.data[0],
      slug = table.game_id.slug,
      config = table.config;

const [{make}, commands] = await Promise.all([
  import(`/games/${slug}/core.js`),
  fetch(`./data/${slug}.json`).then(function(resp){
    return resp.json();
  })
]);

const count = hash ? _.maybe(evented.data, _.keepIndexed(function(idx, event){
  return event.id === hash ? idx : null;
}, _), _.first, _.inc) : _.count(evented.data);

const seats = _.count(seated.data) || 4,
      events = count == null ?  evented.data : _.chain(evented.data, _.take(count, _), _.toArray),
      $game = $.cell(make(_.repeat(seats, {}), config));

_.log($game);

$.sub($.hist($game), t.map(monitor ? g.summarize : _.identity), _.log);

batch($game, g.fold, events);

const exec = _.partly(batch, $game, g.execute);

Object.assign(window, {$game, exec, commands});
