import _ from "/libs/atomic_/core.js";
import $ from "/libs/atomic_/shell.js";
import dom from "/libs/atomic_/dom.js";
import g from "/libs/game_.js";
import supabase from "/libs/supabase.js";
import {reg} from "/libs/cmd.js";

reg({supabase, g});

const params = new URLSearchParams(document.location.search),
      _table_id = params.get('id'),
      options = params.get('options')?.split(',') || [];

try {
  const {data, error, status} = await supabase.rpc('shell', {_table_id});

  if (error) {
    alert(error.message);
  } else {
    const {table, seated, evented} = data,
          {slug, release, config} = table,
          {make} = await import(`/games/${slug}/table/${release}/core.js`);

    const seats = _.toArray(_.repeat(_.count(seated) || 4, {})),
          seen = _.toArray(_.range(0, _.count(seats))),
          simulate = g.simulate(make),
          effects = _.comp(g.effects, simulate);

    function init({seats, config, seen, evented, hash}){
      const at = hash ? hash.replace("#", "") : _.last(evented)?.id;
      const [seed] = simulate({seats, config, seen});
      const frames = _.fold(function(memo, event){
        const {game, loaded} = _.last(memo) || {game: seed, loaded: []};
        const snapshot = _.deref(game);
        const result = _.chain({seats, config, events: [event], loaded, commands: [], seen, snapshot}, simulate);
        const [curr] = result;
        const effs = g.effects(result);
        return _.conj(memo, {game: curr, loaded: _.conj(loaded, event), ...effs});
      },[], evented);
      const idx = at ? _.detectIndex(function({event}){
        return event.id == at;
      }, frames) : _.count(frames) - 1;
      const init = {seed, frames, idx, at};
      return {...init, init};
    }

    function issue(cmd = {type: null}){
      return function(memo){
        const {type} = cmd;
        const {seed, frames, idx, at, init} = memo;
        const max = _.count(frames) - 1;
        switch(type) {
          case "reset": {
            return {...init, init};
          }

          case "undo": {
            const min = 0;
            const _idx = _.max(0, idx - 1);
            const at = frames[_idx]?.event?.id;
            return idx <= min ? memo : {seed, frames, idx: _idx, at, init};
          }

          case "redo": {
            const max = _.count(frames) - 1;
            const _idx = _.min(idx + 1, max);
            const at = frames[_idx]?.event?.id;
            return idx >= max ? memo : {seed, frames, idx: _idx, at, init};
          }

          case "flush": {
            return flush(memo);
          }

          case "at": {
            const {id} = cmd;
            const idx = _.detectIndex(function(frame){
              return frame?.event?.id == id;
            }, frames);
            return {seed, frames, idx, at, init};
          }

          case "run": {
            const {seed, frames, idx} = flush(memo);
            const frame = _.last(frames);
            const {seat, commands} = cmd;
            if (seat == null) {
              throw Error("Must specify seat with commands.");
            }
            const {added} = effects({seats, config, loaded: frame.loaded, events: [], commands, seen: [seat], snapshot: frame.state});
            const addframes = _.toArray(_.drop(1, _.fold(function(memo, event){
              const {game, loaded} = _.last(memo);
              const snapshot = _.deref(game);
              const result = _.chain({seats, config, events: [event], loaded, commands: [], seen, snapshot}, simulate);
              const [curr] = result;
              const effs = g.effects(result);
              return _.conj(memo, {game: curr, loaded: _.conj(loaded, event), ...effs});
            },[{game: frame.game, loaded: frame.loaded}], tempIds(added))));
            const _frames = _.toArray(_.concat(frames, addframes));
            const at = _.chain(_frames, _.last, _.getIn(_, ["event", "id"]));
            return {seed, frames: _frames, idx: _.count(_frames) - 1, at, init};
          }
        }
      }
    }

    function flush({seed, frames, idx, at, init}){
      return {seed, frames: _.toArray(_.take(idx + 1, frames)), idx, at, init};
    }

    function tempIds(added){
      return _.mapa(function(event){
        const id = _.uident(3) + '!';
        return {id, ...event};
      }, added);
    }

    const li = dom.tag('li'), pre = dom.tag('pre'), details = dom.tag("details"), summary = dom.tag("summary");
    const $state = $.atom(init({seats, config, seen, evented, hash: location.hash}));
    const state = _.deref($state);
    const at = _.get(state, "at") ||_.chain(state, _.get(_, "frames"), _.last, _.getIn(_, ["event", "id"]));
    const $hist = $.hist($state);

    if (at) {
      location.hash = `#${at}`;
    }

    function exec(cmd){
      $.swap($state, issue(cmd));
    }

    function when(i, idx){
      return i < idx ? "past" : i == idx ? "present" : "future";
    }

    function formatEvent({event, state, may, up}, klass = ""){
      return li({id: event.id, class: klass},
        details(summary(pre(JSON.stringify(event))),
          pre({class: "facts"}, JSON.stringify({up, may})),
          pre({class: "state"}, JSON.stringify(state, null, 2))));
    }

    $.sub($hist, function([curr, prior]){
      const {frames, idx} = curr;
      if (prior) {
        const cf = _.count(curr.frames);
        const pf = _.count(prior.frames);
        const increase = cf > pf ? cf - pf : 0;
        const decrease = cf < pf ? pf - cf : 0;
        if (increase) {
          dom.append(dom.sel1("#events"),
            _.mapa(formatEvent, _.drop(pf, curr.frames)));
        }
        if (decrease) {
          const subtracted = _.mapa(_.getIn(_, ["event", "id"]), _.drop(cf, prior.frames));
          $.each(function(id){
            const el = document.getElementById(id);
            el.remove();
          }, subtracted);
        }
        $.eachIndexed(function(i, {event}){
        _.maybe(document.getElementById(event.id),
          _.does(
          dom.removeClass(_, "past"),
          dom.removeClass(_, "present"),
          dom.removeClass(_, "future"),
          dom.addClass(_, when(i, idx))));
        }, curr.frames);
        if (curr.at) {
          location.hash = `#${curr.at}`;
        }
      } else {
        const els = _.mapIndexed(function(i, frame){
          return formatEvent(frame, when(i, idx));
        }, frames);
        dom.append(dom.sel1("#events"), els);
      }
      const id = frames[idx].event.id;
      const head = document.getElementById(id);
      head.scrollIntoView({behavior: "smooth", block: "center"});
    });

    const $hash = dom.hash(document);
    $.sub($hash, function(hash){
      const id = _.replace(hash, "#", "");
      $.swap($state, issue({type: "at", id}));
    });

    function command(){
      const text = dom.value(dom.sel1("#move"));
      const command = JSON.parse(text);
      const seat = _.maybe(dom.value(dom.sel1("#seat")), _.blot, parseInt);
      return {type: "run", commands: [command], seat};
    }

    $.on(document, "click", "li[id] summary pre", function(e){
      if (e.metaKey) {
        e.preventDefault();
        const el = _.closest(this, "li[id]"),
              id = dom.attr(el, "id");
        exec({type: "at", id});
      }
    })

    $.on(dom.sel1("#commands"), "keydown", "textarea", function(e){
      if (e.key == "Enter") {
        e.preventDefault();
        try {
          exec(command());
        } catch (ex){
          $.log("error", ex);
          alert(ex?.message || "There was an error.");
        }
      }
    });

    $.on(document, "keydown", function(e){
      if (e.metaKey) {
        switch(e.key) {
          case "r":
            e.preventDefault();
            exec({type: "reset"});
            break;

          case "ArrowLeft":
          case "ArrowUp":
            e.preventDefault();
            exec({type: "undo"});
            break;

          case "ArrowRight":
          case "ArrowDown":
            e.preventDefault();
            exec({type: "redo"});
            break;

          case "f":
            e.preventDefault();
            exec({type: "flush"});
            break;

        }
      }
    });

    $.log("example:");
    $.log(`  exec({type: "run", commands: [{type: "pass"},{type: "commit"}], seat: 1})`);
    $.log(`  exec({type: "flush"})`);

    reg({$state, exec, issue, simulate, effects});
  }
} catch (ex) {
}
