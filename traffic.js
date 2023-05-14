import _ from "./src/lib/atomic_/core.js";
import $ from "./src/lib/atomic_/reactives.js";
import t from "./src/lib/atomic_/transducers.js";
import g from "./src/lib/game_.js";
import supabase from "./src/lib/supabase.js";

const tableId = Deno.args[0],
      limit   = Deno.args[1] || 1000;

const [tables, seated, evented] = await Promise.all([
  supabase.from("tables").select('*,game_id(slug)').eq("id", tableId),
  supabase.rpc('seated', {_table_id: tableId}),
  supabase.rpc('evented', {_table_id: tableId})
]);

const table = tables.data[0],
      events = _.chain(evented.data || [], _.take(limit, _), _.toArray),
      seats = _.toArray(_.repeat(_.count(seated.data) || 4, {})),
      seen = _.toArray(_.range(0, _.count(seats))),
      commands = [],
      slug = table.game_id.slug,
      config = table.config,
      {make} = await import(`./src/games/${slug}/core.js`),
      simulate = g.simulate(make);

let snapshot = null;

for(const event of events){
  const [curr, prior] = simulate(seats, config, [event], commands, seen, snapshot);
  const data = {seats, config, events: [event], commands, seen, snapshot};
  _.log(`time curl -i --location --request POST $site/mind/${slug} --header 'Content-Type: application/json' --data '${JSON.stringify(data)}'`);
  snapshot = _.deref(curr);
}
