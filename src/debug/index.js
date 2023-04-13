import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import g from "/lib/game_.js";
import supabase from "/lib/supabase.js";

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id'),
      hash = document.location.hash.substr(1),
      split  = params.get('split') || null,
      options = params.get('options')?.split(',') || [],
      monitor = !_.includes(options, "nomonitor");

//=> exec(commands) // on a blank game
Promise.all([
  supabase.from("tables").select('*,game_id(fn,slug)').eq("id", tableId),
  supabase.rpc('seated', {_table_id: tableId}),
  supabase.rpc('evented', {_table_id: tableId})
]).then(function([tables, seated, evented]){
  const table = tables.data[0],
        slug = table.game_id.slug,
        config = table.config;

  Promise.all([
    import(`/games/${slug}/core.js`),
    fetch(`./data/${slug}.json`).then(function(resp){
      return resp.json();
    })
  ]).then(function([{make}, commands]){
    const count = hash ? _.maybe(evented.data, _.keepIndexed(function(idx, event){
      return event.id === hash ? idx : null;
    }, _), _.first, _.inc) : _.count(evented.data);

    const seats = _.count(seated.data) || 4,
          events = count == null ?  evented.data : _.chain(evented.data, _.take(count, _), _.toArray),
          $game = $.cell(make(_.repeat(seats, {}), config));

    _.log($game)

    $.sub($.hist($game), t.map(monitor ? g.summarize : _.identity), _.log);

    g.batch($game, g.load, events);

    const exec = g.batch($game, g.run, _);

    Object.assign(window, {$game, exec, commands});

  });
});


