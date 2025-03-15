import _ from "/libs/atomic_/core.js";
import $ from "/libs/atomic_/shell.js";
import dom from "/libs/atomic_/dom.js";
import g from "/libs/game_.js";
import supabase from "/libs/supabase.js";
import {reg} from "/libs/cmd.js";

const params = new URLSearchParams(document.location.search),
      _table_id = params.get('id'),
      options = params.get('options')?.split(',') || [];

const moves = _.pipe(_.deref, _.get(_, "frames"), _.last, _.get(_, "game"), g.moves, _.compact, _.toArray);

reg({supabase, g, moves});

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

    function exec(commands = [], seat = null){
      return function(memo){
        const {init} = memo;
        const {seed, frames, idx} = flush()(memo);
        const frame = _.last(frames);
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

    function reset(){
      return function({init}){
        return {...init, init};
      }
    }

    function flush(){
      return function({seed, frames, idx, at, init}){
        return {seed, frames: _.toArray(_.take(idx + 1, frames)), idx, at, init};
      }
    }

    function undo(){
      return function(memo){
        const {seed, frames, idx, init} = memo;
        const min = 0;
        const _idx = _.max(0, idx - 1);
        const at = frames[_idx]?.event?.id;
        return idx <= min ? memo : {seed, frames, idx: _idx, at, init};
      }
    }

    function redo(){
      return function(memo){
        const {seed, frames, idx, init} = memo;
        const max = _.count(frames) - 1;
        const _idx = _.min(idx + 1, max);
        const at = frames[_idx]?.event?.id;
        return idx >= max ? memo : {seed, frames, idx: _idx, at, init};
      }
    }

    function at(id){
      return function({seed, frames, at, init}){
        const idx = _.detectIndex(function(frame){
          return frame?.event?.id == id;
        }, frames);
        return {seed, frames, idx, at, init};
      }
    }

    function help(){
      $.log(`From the commands pane or the console \`$.swap($state, ...)\`:
  exec([{type: "pass"},{type: "commit"}], 1))
  flush()
  reset()
  undo()
  redo()
  at(id)
  help()`);
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
    const pos = _.get(state, "at") ||_.chain(state, _.get(_, "frames"), _.last, _.getIn(_, ["event", "id"]));
    const $hist = $.hist($state);

    if (pos) {
      location.hash = `#${pos}`;
    }

    function when(i, idx){
      return i < idx ? "past" : i == idx ? "present" : "future";
    }

    function compactJSON(obj) {
      const vals = [];
      for(const key in obj){
        const val = obj[key];
        vals.push(`  "${key}": ${JSON.stringify(val)}`);
      }
      return _.str("{\n", _.join(",\n", vals), "\n}");
    }

    function formatEvent({event, state, may, up}, klass = ""){
      return li({id: event.id, class: klass},
        details(summary(pre(JSON.stringify(event))),
          pre({class: "facts"}, JSON.stringify({up, may})),
          pre({class: "state"}, compactJSON(state))));
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
      $.swap($state, at(id));
    });

    function commands(){
      const commands = _.chain(dom.sel1("#commands"), dom.value, _.split(_, "\n"), _.mapa(_.trim, _), _.join(", ", _), _.str("_.pipe(", _, ")"));
      return eval(commands);
    }

    $.on(document, "click", "li[id] summary pre", function(e){
      if (e.metaKey) {
        e.preventDefault();
        const el = _.closest(this, "li[id]"),
              id = dom.attr(el, "id");
        $.swap($state, at(id));
      }
    })

    $.on(dom.sel1("#commands"), "keydown", function(e){
      if (e.key == "Enter") {
        e.preventDefault();
        try {
          $.swap($state, commands());
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
            $.swap($state, reset());
            break;

          case "ArrowLeft":
          case "ArrowUp":
            e.preventDefault();
            $.swap($state, undo());
            break;

          case "ArrowRight":
          case "ArrowDown":
            e.preventDefault();
            $.swap($state, redo());
            break;

          case "f":
            e.preventDefault();
            $.swap($state, flush());
            break;

        }
      }
    });

    help();

    reg({$state, exec, flush, reset, undo, redo, at, help, simulate, effects});
  }
} catch (ex) {
}
