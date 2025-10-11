#!/usr/bin/env -S deno run --allow-read
import supabase from "./src/libs/supabase.js";
import { readLines } from "https://deno.land/std@0.224.0/io/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import { Select } from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/mod.ts";
import _ from "./src/libs/atomic_/core.js";
import $ from "./src/libs/atomic_/shell.js";
import g from "./src/libs/game_.js";

const $state = $.atom(null);
const demo = _.str(_.uids(12)());

function log(obj){
  $.log(Deno.inspect(obj, { colors: true, compact: true, depth: Infinity, iterableLimit: Infinity }));
}

function logs(arr){
  for(const obj of arr) {
    _.isArray(obj) ? logs(obj) : log(obj);
  }
}

async function load(table_id, filename, cache){
  try {
    await Deno.stat(filename); // throws if not found
    const text = await Deno.readTextFile(filename);
    const [table, seated, config, evented] = JSON.parse(text);
    return [table, seated, config, evented];
  } catch (err) {
    const resp = await supabase.rpc('shell', {_table_id: table_id});
    if (resp.error) {
      console.error(error);
      Deno.exit(1);
    }
    const text = resp.data;
    const {evented, seated, table} = text;
    const {id, slug, game_id, release, config} = table;
    const data = [{id, slug, game_id, release}, seated, config, evented];
    if (cache) {
      await Deno.writeTextFile(filename, JSON.stringify(data));
    }
    return data;
  }
}

function component({slug, release}){
  return import(`./src/games/${slug}/table/${release}/core.js`);
}

function asCount(v, n = 1) {
  if (v === true) return n;
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") return Number(v);
  return undefined;
}

function parseJsLikeObject(txt) {
  try {
    return Function(`"use strict"; return (${txt});`)();
  } catch (err) {
    console.error("Failed to parse --cmd object:", err.message);
    Deno.exit(2);
  }
}

async function loadCmdsFile(path) {
  try {
    const text = await Deno.readTextFile(path);
    return text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .map(parseJsLikeObject);
  } catch (err) {
    console.error(`Failed to read --cmds file "${path}":`, err.message);
    Deno.exit(2);
  }
}

function normalizeList(vs) {
  if (!vs) return [];
  const arr = Array.isArray(vs) ? vs : [vs];
  return arr
    .flatMap(s => String(s).split(","))
    .map(s => s.trim())
    .filter(Boolean);
}

const LENS_ALLOWED = new Set(["event", "up", "may", "state", "moves"]);

function resolveLens(withList, withoutList) {
  const lens = new Set(["event"]); // defaults
  for (const w of withList) if (LENS_ALLOWED.has(w)) lens.add(w);
  for (const wo of withoutList) lens.delete(wo);
  return Array.from(lens);
}

function init(simulate, {seats, config, seen, evented, hash}){
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

function tempIds(added){
  return _.mapa(function(event){
    const id = _.uident(3) + '!';
    return {id, ...event};
  }, added);
}

function play(simulate, effects, seats, seat, seen, config) {
  return function exec(...commands){
    return function(memo){
      const {init} = memo;
      const {seed, frames, idx} = flush()(memo);
      const frame = _.last(frames);
      if (seat == null) {
        throw Error("Must specify seat with commands.");
      }
      const {added} = effects({seats, config, loaded: frame?.loaded, events: [], commands, seen: [seat], snapshot: frame?.state});
      const addframes = _.toArray(_.drop(1, _.fold(function(memo, event){
        const {game, loaded} = _.last(memo);
        const snapshot = _.maybe(game, _.deref);
        const result = _.chain({seats, config, events: [event], loaded, commands: [], seen, snapshot}, simulate);
        const [curr] = result;
        const effs = g.effects(result);
        return _.conj(memo, {game: curr, loaded: _.conj(loaded, event), ...effs});
      }, [{game: frame?.game, loaded: frame?.loaded}], tempIds(added))));
      const _frames = _.toArray(_.concat(frames, addframes));
      const at = _.chain(_frames, _.last, _.getIn(_, ["event", "id"]));
      return {seed, frames: _frames, idx: _.count(_frames) - 1, at, init};
    }
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

function to(id){
  return function({seed, frames, init}){
    const idx = _.detectIndex(function(frame){
      return frame?.event?.id == id;
    }, frames);
    const frame = _.nth(frames, idx);
    const at = frame?.event?.id;
    return {seed, frames, idx, at, init};
  }
}

function chooseEvent({frames, idx}){
  return Select.prompt({
    message: "Choose an event",
    options: _.toArray(_.concat([{name: "None", value: -1}], _.mapIndexed(function(i, {event}){
      const {id} = event;
      return {name: JSON.stringify(event), value: id};
    }, frames)))
  });
}

function head(){
  return function(memo){
    const {frames} = memo;
    return to(_.last(frames)?.event.id)(memo);
  }
}

function tail(){
  return function(memo){
    const {frames} = memo;
    return to(_.first(frames)?.event.id)(memo);
  }
}

function listMoves({frames, idx}){
  return _.chain(frames[idx], _.get(_, "game"), g.moves, _.compact, _.toArray);
}

function chooseMove(state){
  const choices = listMoves(state);
  return _.fmap(Select.prompt({
    message: "Choose a move",
    options: _.toArray(_.concat([{name: "None", value: -1}], _.mapIndexed(function(idx, cmd){
      return {name: JSON.stringify(cmd), value: idx};
    }, choices)))
  }), _.nth(choices, _));
}

function look({lookback, lookahead, lens}){
  return function({frames, idx, at}){
    function peek(idx){
      const frame = frames[idx];
      const {event, added, loaded, may, metrics, seen, up} = frame;
      return _.reduce(function(memo, key){
        return _.assoc(memo, key, _.get(frame, key));
      }, {idx}, lens);
    }

    const total = _.count(frames);
    const past = _.chain(_.range(0, total), _.takeWhile(function(i){
      return i <= idx;
    }, _), _.reverse, _.take(lookback + 1, _), _.reverse, _.mapa(peek, _));
    const future = _.chain(_.range(0, total), _.dropWhile(function(i){
      return i <= idx;
    }, _), _.take(lookahead, _), _.mapa(peek, _));

    return {past, future, total};
  }
}

function state({idx, frames}){
  return frames[idx]?.state;
}

function frame({idx, frames}){
  return frames[idx];
}

async function command(params, run){
  await requestCommand();

  for await (const line of readLines(Deno.stdin)) {
    try {
      switch (line.trim()) {
        case "move":
        case "m":
          const cmd = await chooseMove(_.deref($state));
          _.maybe(cmd, run);
          break;

        case "reset":
          $.swap($state, reset());
          break;

        case "undo":
        case "u":
          $.swap($state, undo());
          break;

        case "redo":
        case "r":
          $.swap($state, redo());
          break;

        case "flush":
          $.swap($state, flush());
          break;

        case "head":
        case "h":
          $.swap($state, head());
          break;

        case "tail":
        case "t":
          $.swap($state, tail());
          break;

        case "moves":
          _.chain($state, _.deref, listMoves, logs);
          break;

        case "state":
        case "s":
          _.chain($state, _.deref, state, log);
          await requestCommand();
          continue;
          break;

        case "frame":
        case "f":
          _.chain($state, _.deref, frame, log);
          await requestCommand();
          continue;
          break;

        case "at":
          const id = await chooseEvent(_.deref($state));
          if (id) {
            $.swap($state, _.pipe(to(id), flush()));
          }
          break;

        case "exit":
        case "quit":
        case "q":
          return;

        default:
          run(line.trim()); //everything else is a command for the game
          break;
      }

    } catch (ex) {
      $.error(ex.message);

    } finally {
      _.chain($state, _.deref, look(params), log);
      await requestCommand();
    }
  }
}

async function requestCommand(){
  log({commands: "f/rame, s/state, m/ove, moves, u/ndo, r/edo, flush, h/ead, t/ail, moves, at, reset, exit"});
  const encoder = new TextEncoder();
  await Deno.stdout.write(encoder.encode("> "));  // prompt again after output
}

await new Command()
  .name("tablejam")
  .version("0.7.0")
  .description("Boot table state and simulate a game.")
  .arguments("<table:string>")
  .option("--seen <value:string>", "Repeatable or comma-separated list.", { collect: true })
  .option("--seat <number:number>", "Seat index (int).", { default: null })
  .option("--at [id:string]", "Operate at a specific id.")
  .option("--cache", "Cache fetched table state to <table>.json.")
  .option("--drop [count:number]", "Drop last N entries (bare flag = 1).")
  .option("--moves", "Show available moves.")
  .option("--move", "Prompt to choose and execute a move.")
  .option("--cmd <object:string>", "Execute a move from a command object, e.g. '{type:\"commit\"}'.")
  .option("--cmds <file:string>", "Execute moves (one command object per line) from a file.")
  .option("--with <value:string>", "Add to lens (repeatable or CSV).", { collect: true })
  .option("--without <value:string>", "Remove from lens (repeatable or CSV).", { collect: true })
  .option("--lookback, -b <count:number>", "How many past items to include (default = Infinity).", { default: Infinity })
  .option("--lookahead, -a <count:number>", "How many future items to include (default = 1).", { default: 1 })
  .option("--silent", "Suppress initial output.")
  .option("-i, --interactive", "Keep the program open for further input.")
  .action(async function(opts, table_id) {
    const drop = asCount(opts.drop);
    const atProvided = "at" in opts;
    const at = opts.at === true ? null : opts.at ?? null;
    const seat = opts.seat == null ? null : Number(opts.seat);
    const silent = !!opts.silent;
    const interactive = !!opts.interactive;
    const cache = !!opts.cache;
    const moves = !!opts.moves;
    const move = asCount(opts.move, 0);
    const seen = normalizeList(opts.seen);
    const withList = normalizeList(opts.with);
    const withoutList = normalizeList(opts.without);
    const lens = resolveLens(withList, withoutList);
    const filename = `table-${table_id}.json`;

    const cmds = [
      ...(opts.cmd ? [parseJsLikeObject(opts.cmd)] : []),
      ...(opts.cmds ? await loadCmdsFile(opts.cmds) : [])
    ];

    const lookback = opts.lookback === Infinity ? Infinity : Number(opts.lookback);
    const lookahead = Number(opts.lookahead);

    _.chain({table_id, filename, at, atProvided, drop, cmds, seen, seat, lens, lookback, lookahead, cache, moves, move, silent, interactive},
      //$.see("payload"),
      main);
  })
  .example("Defaults", `tablejam ${demo}`)
  .example("Lens add/remove", `tablejam ${demo} --with state,moves --without event`)
  .example("Temporal scope", `tablejam ${demo} -b 5 -a 2`)
  .example("Commands", `tablejam ${demo} --cmd '{type:\"commit\"}' --seen 0,1 --seen 0`)
  .parse(Deno.args);

async function main({table_id, filename, at, atProvided, cmds, drop, seen, seat, lens, lookback, lookahead, cache, moves, move, silent, interactive}) {
  const [table, seated, config, evented] = await load(table_id, filename, cache);
  const {make} = await component(table);
  const simulate = g.simulate(make),
        effects = _.comp(g.effects, simulate);
  const seats = _.toArray(_.repeat(_.count(seated) || 4, {}));
  const _seen = _.seq(seen) ? seen :_.toArray(_.range(0, _.count(seats)));
  const hash = at;
  const exec = play(simulate, effects, seats, seat, seen, config);
  const run = _.comp($.swap($state, _), exec);
  const params = {lens, lookback, lookahead};
  $.log(`\x1b]0;tablejam:${table.slug} @ ${table_id}\x07`);

  $.reset($state, init(simulate, {seats, config, seen: _seen, evented, hash}));

  if (atProvided) {
    const id = at == null ? await chooseEvent(_.deref($state)) : at;
    if (id) {
      $.swap($state, _.pipe(to(id), flush()));
    }
  }

  if (drop) {
    $.each(function(){
      $.swap($state, undo());
    }, _.range(0, drop));
    $.swap($state, flush());
  }

  $.each(run, cmds);

  if (move != null) {
    const cmd = await chooseMove(_.deref($state));
    _.maybe(cmd, run);
  } else if (moves) {
    _.chain($state, _.deref, listMoves, log);
  }

  silent || _.chain($state, _.deref, look(params), log);

  if (interactive) {
    await command(params, run);
  }
}
