import _ from "/libs/atomic_/core.js";
import $ from "/libs/atomic_/reactives.js";
import g from "/libs/game_.js";
import supabase from "/libs/supabase.js";
import {session, $online} from "/libs/session.js";

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id'),
      userId = session?.user?.id,
      eventId = document.location.hash.substr(1),
      options = params.get('options')?.split(',') || [];


try {
  const {data, error, status} = await supabase.rpc('moment', {_table_id: tableId, _user_id: userId});

  if (error) {
    console.error(error.message);
  } else {
    const {table, seated, evented} = data,
          {slug, release, config} = table,
          {make} = await import(`/games/${slug}/table/${release}/core.js`);
    const seats = _.toArray(_.repeat(_.count(seated) || 4, {})),
          seen = _.toArray(_.range(0, _.count(seats))),
          simulate = g.simulate(make),
          effects = _.comp(g.effects, simulate);

    const thru = eventId ? _.maybe(evented, _.detectIndex(function({id}){
      return id === eventId;
    }, _), _.inc) : null;

    const events = thru == null ? evented : _.chain(evented, _.take(thru, _), _.toArray),
          held = thru == null ? [] : _.chain(evented, _.drop(thru, _), _.toArray);

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
    Object.assign(window, {$game, $online, session, effects, g, sim, run, held, flush, supabase});
  }
} catch (ex) {
  Object.assign(window, {$online, session, supabase});
}
