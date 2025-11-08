import _ from "./atomic_/core.js";
import $ from "./atomic_/shell.js";
import supabase from "./supabase.js";
import flick from "./flick.js";
import { flicker } from "./flicker.js";

// Create the single, global Flicker instance
const app = flicker(flick.initialState);

// --- Effect Handlers (reused from old shell) ---

function getfn(name, params, accessToken) {
  const apikey = supabase.supabaseKey;
  const headers = { apikey, authorization: `Bearer ${accessToken ?? apikey}`, accept: 'application/json' };
  const qs = params ? new URLSearchParams(params).toString() : "";
  const url = `${supabase.functionsUrl.href}/${name}${qs ? `?${qs}` : ''}`;
  return fetch(url, { method: 'GET', headers }).then(resp => resp.json());
}

function digest(result) {
  const code = result?.code, error = code == null ? null : result, data = code == null ? result : null;
  return { error, data };
}

function getPerspective(table_id, event_id, seat, seat_id, accessToken) {
  const perspective = getfn("perspective", _.compact({ table_id, event_id, seat }), accessToken).then(digest);
  const last_move = supabase.rpc('last_move', { _table_id: table_id, _event_id: event_id, _seat_id: seat_id }).then(_.get(_, "data"));
  return Promise.all([perspective, last_move]).then(([{ data, error }, last_move]) => {
    return Object.assign({}, error || data, { last_move });
  });
}

function subscribeToTableChannel(tableId) {
  const channel = supabase.channel(`db-messages-flicker-${tableId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tables', filter: `id=eq.${tableId}` },
      (payload) => $.dispatch(app, { type: "TableUpdated", payload: { table: payload.new } })
    )
    .subscribe((status, err) => {
      const topic = "Subscription";
      if (status === 'SUBSCRIBED') {
        $.dispatch(app, { type: "Log", payload: { topic, data: { status: "Subscribed", tableId } } });
      } else {
        $.dispatch(app, { type: "Log", payload: { topic, data: { status, error: err, tableId } } });
      }
    });
  return channel;
}

async function handleEffect(effect) {
  const state = _.deref(app);
  const { session, seat, table, seated, game } = state;

  switch (effect.type) {
    case "Log":
      console.log(Deno.inspect(effect.payload, { colors: true, compact: true, depth: Infinity }));
      break;
    case "FetchTable":
      const { data: tableData } = await supabase.from('tables').select('*').eq('id', effect.payload.tableId).single();
      if (tableData) $.dispatch(app, { type: "TableLoaded", payload: { table: tableData } });
      break;
    case "SubscribeToTableChannel":
      subscribeToTableChannel(effect.payload.tableId);
      break;
    case "FetchTouches":
      const touches = await getfn('touches', { _table_id: effect.payload.tableId }, session.accessToken);
      $.dispatch(app, { type: "TouchesLoaded", payload: { touches } });
      break;
    case "FetchSeated":
      const seatedData = await getfn('seated', { _table_id: effect.payload.tableId });
      $.dispatch(app, { type: "SeatedLoaded", payload: { seated: seatedData } });
      break;
    case "FetchGame":
      const { data: gameData } = await supabase.from('games').select('*').eq('id', effect.payload.gameId).single();
      $.dispatch(app, { type: "GameLoaded", payload: { game: gameData } });
      break;
    case "FetchGameModule":
      const { release } = table;
      const { slug } = game;
      const url = `../games/${slug}/table/${release}/core.js`;
      const { make } = await import(url);
      $.dispatch(app, { type: "GameModuleLoaded", payload: { make } });
      break;
    case "FetchPerspective":
      const { tableId, eventId } = effect.payload;
      const seatId = _.getIn(seated, [seat, "seat_id"]);
      const perspective = await getPerspective(tableId, eventId, seat, seatId, session.accessToken);
      $.dispatch(app, { type: "PerspectiveLoaded", payload: { eventId, perspective } });
      break;
  }
}

// --- Main Effect Loop ---

// Subscribe to the app's state atom
$.sub(app, function(newState, oldState) {
  if (newState.effects.length > 0) {
    // Run all effects
    newState.effects.forEach(handleEffect);
    // After running effects, dispatch a message to clear them
    $.dispatch(app, { type: "ClearEffects" });
  }
});

// The run function now just dispatches the Init message
function run(options) {
  $.dispatch(app, { type: "Init", payload: options });
}

// Export the global app instance and the run function
export default {
  app,
  run
};
