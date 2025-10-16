import supabase from "./src/libs/supabase.js";
import _ from "./src/libs/atomic_/core.js";
import $ from "./src/libs/atomic_/shell.js";
import g from "./src/libs/game_.js";
import {make} from "./src/games/backgammon/table/uJl/core.js";

const simulate = g.simulate(make),
      effects = _.comp(g.effects, simulate);
const table_id = Deno.args[0];
const {data, error} = await supabase.rpc('shell', {_table_id: table_id});
const {table, seated, evented} = data;
const loaded = [];
const config = {};
const events = []; //evented;
const commands = [{type: "start"}];
const seen = [null];
const seats = seated;

const resp = simulate({seats, config, loaded, events, commands, seen});
const effs = g.effects(resp);

function log(obj){
  $.log(Deno.inspect(obj, { colors: true, compact: true, depth: Infinity, iterableLimit: Infinity }));
}

const sim = await supabase.rpc('simulate', {_table_id: table_id, _event_id: 'fnx4k', _commands: [], _seat: null});
log({sim});


//log({table, seats, events, resp, effs});
//log({seats, config, loaded, events, commands, seen, table, resp, effs});
