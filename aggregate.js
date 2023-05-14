import _ from "./src/lib/atomic_/core.js";
import $ from "./src/lib/atomic_/reactives.js";
import t from "./src/lib/atomic_/transducers.js";
import g from "./src/lib/game_.js";
import supabase from "./src/lib/supabase.js";

const tableId = Deno.args[0],
      limit   = Deno.args[1] || 10000;

const [_tables, _seated, _events] = await Promise.all([
  supabase.from("tables").select('*,game_id(slug)').eq("id", tableId),
  supabase.rpc('seated', {_table_id: tableId}),
  supabase.from("events").select('*').eq("table_id", tableId).order("seq").limit(limit)
]);

const table = _tables.data[0],
      seated = _.mapa(_.get(_, "seat_id"), _seated.data),
      events = _.mapa(function({id, type, details, seat_id}){
        const seat = _.maybe(seat_id, _.indexOf(seated, _));
        return _.compact({id, type, details, seat});
      }, _events.data),
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
  _.log(`time curl -i --location --request POST $site/simulate/${slug} --header 'Content-Type: application/json' --data '${JSON.stringify(data)}'`);
  snapshot = _.deref(curr);
}
