// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const conditional = {};
const queue_name = "notifications";
const vt = 30;                 // seconds; keep > your max *per-message* handling time
const qty = 32;                // batch size per read
const TAIL_WAIT_MS = 1500;     // tiny grace to catch tail arrivals
const MAX_SEC = 55;            // timebox the invocation
const SUPABASE_URL = Deno.env.get("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      WAKE_SECRET = Deno.env.get("WAKE_SECRET");

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

console.log("Ready");

async function handle(msg, ctx) {
  //console.log({step: `dispose ${msg.message.type}`, msg});
  console.log({step: `handling ${msg.message.type}`, msg});
  const msg_id = msg.msg_id;
  if (msg.read_ct > 5) {
    console.error(`Message ${msg_id} exceeded retry threshold.`);
    return 1;
  }
  switch (msg.message.type) {
    case "up": {
      const {type, up, table_id, title, slug, thumbnail_url, seated, prompts} = msg.message;
      for (const seat of up) {
        const prompt = prompts?.[seat];
        if (prompt) {
          try {
            console.log({step: "deciding", msg_id, prompt});
            const move = await fetch(`${SUPABASE_URL}/functions/v1/decide-move`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              },
              body: JSON.stringify({prompt})
            }).then(resp => resp.json());
            const commands = [move];
            const decided = {
              _table_id: table_id,
              _seat: seat,
              _commands: commands
            };
            console.log({step: "moving", msg_id, decided});
            const {data, error, status} = await supabase.rpc('move', decided);
            if (error) {
              console.error({step: "moved", msg_id, status, error});
              return 1;
            } else {
              console.log({step: "moved", msg_id, status, data});
            }
          } catch (ex) {
            console.error({msg_id, ex});
            return 1;
          }
        }
      }
      return 0;
    }
    default:
      return 1;
  }
}

Deno.serve(async function(req){
  // optional doorbell auth; include WAKE_SECRET only if you want it
  if (WAKE_SECRET && req.headers.get("x-wake-secret") !== WAKE_SECRET) {
    return new Response("unauthorized", { status: 409 });
  }

  const started = Date.now();
  let drained = 0;

  while ((Date.now() - started) / 1000 < MAX_SEC) {
    // DIRECT call to the extension (no public wrappers)
    const { data: msgs, error } = await supabase
      .schema("pgmq")
      .rpc("read", { queue_name, vt, qty , conditional});

    if (error) {
      console.log("$ error", error);
      return new Response(`read error: ${error.message}`, { status: 500 });
    }

    if (!msgs?.length) {
      // brief wait to catch just-enqueued work during this wake
      await sleep(TAIL_WAIT_MS);
      const { data: tail, error: tailErr } = await supabase
        .schema("pgmq")
        .rpc("read", { queue_name, vt, qty, conditional });

      if (tailErr) {
        console.log("$ tail-error", tailErr);
        return new Response(`read error: ${tailErr.message}`, { status: 500 });
      }

      if (!tail?.length) break;
      for (const msg of tail) {
        const ok = await handle(msg, { supabase, req }).catch(e => {
          console.log("$ handle-error (tail)", e);
          return false;
        });
        if (ok) {
          await supabase.schema("pgmq").rpc("archive", { queue_name, msg_id: m.msg_id });
          drained++;
        }
      }
      continue;
    }

    for (const msg of msgs) {
      const result = await handle(msg, { supabase, req }).catch(e => {
        console.log("$ handle-error", e);
        return false;
      });
      switch (result) {
        case 0: //done, delete!
          await supabase.schema("pgmq").rpc("archive", { queue_name, msg_id: msg.msg_id });
          drained++;
          break;

        case 1: //probable issues, archive
          await supabase.schema("pgmq").rpc("archive", { queue_name, msg_id: msg.msg_id });
          drained++;
          break;

        default: //anything else: leave it in-flight; it will become visible again after vt
          console.error("handled", msg, result);
          break;
      }
    }
  }

  return drained
    ? new Response(`drained:${drained}`, { status: 200 })
    : new Response(null, { status: 204 });
});
