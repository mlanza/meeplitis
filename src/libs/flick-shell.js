import _ from "./atomic_/core.js";
import $ from "./atomic_/shell.js";
import supabase from "./supabase.js";
import flick from "./flick.js";

// --- Helper for calling Supabase functions ---
function getfn(name, params, accessToken) {
  const apikey = supabase.supabaseKey;
  const headers = {
    apikey,
    authorization: `Bearer ${accessToken ?? apikey}`,
    accept: 'application/json'
  };
  const qs = params ? new URLSearchParams(params).toString() : "";
  const url = `${supabase.functionsUrl.href}/${name}${qs ? `?${qs}` : ''}`;
  return fetch(url, { method: 'GET', headers }).then(resp => resp.json());
}

function digest(result) {
  const code = result?.code,
    error = code == null ? null : result,
    data = code == null ? result : null;
  return { error, data };
}

function getPerspective(table_id, event_id, seat, seat_id, accessToken) {
  const perspective = getfn("perspective", _.compact({ table_id, event_id, seat }), accessToken).then(digest);
  const last_move = supabase.rpc('last_move', { _table_id: table_id, _event_id: event_id, _seat_id: seat_id }).then(_.get(_, "data"));
  return Promise.all([perspective, last_move]).then(([{ data, error }, last_move]) => {
    return Object.assign({}, error || data, { last_move });
  });
}
// --------------------------------------------

function log(obj) {
  console.log(Deno.inspect(obj, { colors: true, compact: true, depth: Infinity }));
}

const store = $.atom(flick.initialState);
const messages = [];
let processing = false;

function dispatch(msg) {
  messages.push(msg);
  if (!processing) {
    processing = true;
    setTimeout(processMessages, 0);
  }
}

function processMessages() {
  while (messages.length > 0) {
    const msg = messages.shift();
    const currentState = _.deref(store);
    const { state: nextState, effects } = flick.reducer(currentState, msg);
    $.reset(store, nextState);
    handleEffects(effects);
  }
  processing = false;
}

async function handleEffects(effects) {
  const state = _.deref(store);
  const { session, seat, table, seated, game } = state;

  for (const effect of effects) {
    switch (effect.type) {
      case "Log":
        log(effect.payload);
        break;

      case "FetchTable":
        const { data: tableData } = await supabase.from('tables').select('*').eq('id', effect.payload.tableId).single();
        if (tableData) {
          dispatch({ type: "TableLoaded", payload: { table: tableData } });
        }
        break;

      case "SubscribeToTableChannel":
        subscribeToTableChannel(effect.payload.tableId);
        break;

      case "FetchTouches":
        const touches = await getfn('touches', { _table_id: effect.payload.tableId }, session.accessToken);
        dispatch({ type: "TouchesLoaded", payload: { touches } });
        break;

      case "FetchSeated":
        const seatedData = await getfn('seated', { _table_id: effect.payload.tableId });
        dispatch({ type: "SeatedLoaded", payload: { seated: seatedData } });
        break;

      case "FetchGame":
        const { data: gameData } = await supabase.from('games').select('*').eq('id', effect.payload.gameId).single();
        dispatch({ type: "GameLoaded", payload: { game: gameData } });
        break;

      case "FetchGameModule":
        const { release } = table;
        const { slug } = game;
        const url = `../games/${slug}/table/${release}/core.js`;
        const { make } = await import(url);
        dispatch({ type: "GameModuleLoaded", payload: { make } });
        break;

      case "FetchPerspective":
        const { tableId, eventId } = effect.payload;
        const seatId = _.getIn(seated, [seat, "seat_id"]);
        const perspective = await getPerspective(tableId, eventId, seat, seatId, session.accessToken);
        dispatch({ type: "PerspectiveLoaded", payload: { eventId, perspective } });
        break;
    }
  }
}

function subscribeToTableChannel(tableId) {
  const channel = supabase.channel(`db-messages-flick-${tableId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'tables',
      filter: `id=eq.${tableId}`,
    }, (payload) => {
      dispatch({ type: "TableUpdated", payload: { table: payload.new } });
    })
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        log({ topic: "Subscription", data: { status: "Subscribed", tableId } });
      } else {
        log({ topic: "Subscription", data: { status, error: err, tableId } });
      }
    });
  return channel;
}

function run({ tableId, seat, session, noCache, noStore }) {
  dispatch({ type: "Init", payload: { tableId, seat, session, noCache, noStore } });
}

export default {
  run,
  dispatch,
  store
};