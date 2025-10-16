import supabase from "./src/libs/supabase.js";
import _ from "./src/libs/atomic_/core.js";
import $ from "./src/libs/atomic_/shell.js";
import g from "./src/libs/game_.js";

const table_id = Deno.args[0];

function log(obj){
  $.log(Deno.inspect(obj, { colors: true, compact: true, depth: Infinity, iterableLimit: Infinity }));
}


/*
const {data, error} = await supabase.rpc('shell', {_table_id: table_id});
const {table, seated, evented} = data;
const {slug, release} = table;

const {make} = await import(`./src/games/${slug}/table/${release}/core.js`);

const simulate = g.simulate(make);


function persp1(seated, evented){
  const loaded = [];
  const config = {};
  const events = evented;
  const commands = [];
  const seen = [1];
  const seats = seated;
  return simulate({seats, config, loaded, events, commands, seen});
}

function cmd1(seated, evented){ //undo 1
  const loaded = [];
  const config = {};
  const events = _.chain(evented, _.butlast, _.toArray);
  const commands = [{type: "commit"}];
  const seen = [1];
  const seats = seated;
  return simulate({seats, config, loaded, events, commands, seen});
}

function cmd2(seated, evented){ //move!
  const loaded = [];
  const config = {};
  const events = [];
  const commands = [{type: "start"}];
  const seen = [null];
  const seats = seated;
  return simulate({seats, config, loaded, events, commands, seen});
}
const resp = cmd2(seated, evented);
const [curr, prior, seen, commands] = resp;
const effects = g.effects(resp);

//const {added} = effs;
//const resp2 = await supabase.rpc('addable_events', {_events: added});

//log(resp2)

//const sim = await supabase.rpc('simulate', {_table_id: table_id, _event_id: 'fnx4k', _commands: [], _seat: null});
//log({sim});

//[curr, prior, seen, commands]
*/

const {data, error} = await supabase.rpc('stuff', {p_table_id: table_id});


log(data, error)


//log({table, evented});//, effects, seen, commands});
//log({seats, config, loaded, events, commands, seen, table, resp, effs});
