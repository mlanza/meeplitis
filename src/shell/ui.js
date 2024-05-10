import _ from "/libs/atomic_/core.js";
import $ from "/libs/atomic_/reactives.js";
import dom from "/libs/atomic_/dom.js";
import g from "/libs/game_.js";
import supabase from "/libs/supabase.js";
import {keeping} from "/libs/profiles.js";
import {session, $online} from "/libs/session.js";

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id'),
      chopped = _.maybe(params.get("chopped"), parseInt) || 0,
      ctx = _.maybe(params.get("ctx"), parseInt) || 3,
      userId = session?.user?.id,
      eventId = document.location.hash.substr(1),
      options = params.get('options')?.split(',') || [];

const els = {
  before: dom.sel1("#before span"),
  after: dom.sel1("#after span"),
  events: dom.sel1("#events"),
  held: dom.sel1("#held"),
  chop: dom.sel1("#chop"),
  chopped: dom.sel1("#chopped"),
  permalink: dom.sel1("#permalink"),
  head: dom.sel1("#head")
}

try {
  const {data, error, status} = await supabase.rpc('inspect', {_table_id: tableId, _user_id: userId});

  if (error) {
    console.error(error.message);
  } else {
    const {table, seated, evented} = data,
          {slug, release, config} = table,
          {make} = await import(`/games/${slug}/table/${release}/core.js`);

    const seats = _.toArray(_.repeat(_.count(seated) || 4, {})),
          seen = _.toArray(_.range(0, _.count(seats))),
          num = _.count(evented),
          thruId = chopped ? _.chain(evented, _.take(_.count(evented) - chopped, _), _.last, _.get(_, "id")) : eventId || _.chain(evented, _.last, _.get(_, "id")),
          simulate = g.simulate(make),
          effects = _.comp(g.effects, simulate);

    const relink = keeping("id", "seat", "chopped", "listed"),
          link = relink("./", {chopped: chopped + 1}),
          headlink = relink("./", {chopped: null}),
          permalink = relink("./", {chopped: null}, thruId);

    dom.attr(els.permalink, "href", permalink);
    dom.text(els.permalink, '#' + thruId);
    dom.attr(els.head, "href", headlink);
    dom.attr(els.chop, "href", link);
    dom.text(els.chopped, chopped);

    const thru = thruId ? _.maybe(evented, _.detectIndex(function({id}){
      return id === thruId;
    }, _), _.inc) : null;

    const events = thru == null ? evented : _.chain(evented, _.take(thru, _), _.toArray),
          held = thru == null ? [] : _.chain(evented, _.drop(thru, _), _.toArray);

    const before = _.count(events),
          after = _.count(held);

    function numbered(n){
      return n ? ` ${n}` : null;
    }

    function formatEvent(e){
      return li({id: e.id}, pre(JSON.stringify(e)));
    }

    const li = dom.tag('li'), pre = dom.tag('pre');
    dom.append(els.events, _.map(formatEvent, events));
    dom.append(els.held, _.map(formatEvent, held));
    dom.text(els.before, numbered(before));
    dom.text(els.after, numbered(after));
    dom.attr(_.parent(els.before), "num", before);
    dom.attr(_.parent(els.after), "num", after);

    const head = document.getElementById(thruId);
    setTimeout(function(){
      dom.addClass(head, "head");
      head.scrollIntoView({behavior: "smooth", block: "center"});
    }, 300);

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

    _.log("example:");
    _.log(`run({commands: [{type: "pass"},{type: "commit"}], seat: 1})`);
    Object.assign(window, {$game, $online, session, effects, g, sim, run, held, flush, supabase});
  }
} catch (ex) {
  Object.assign(window, {$online, session, supabase});
}
