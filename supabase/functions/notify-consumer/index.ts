// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const conditional = {};
const queue_name = "notifications";
const vt = 30;                 // seconds; keep > your max job time
const qty = 32;                // batch size per read
const TAIL_WAIT_MS = 1500;     // tiny grace to catch tail arrivals
const MAX_SEC = 55;            // timebox the invocation

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

Deno.serve(async function(req){
  // optional doorbell auth; include WAKE_SECRET only if you want it
  const WAKE_SECRET = Deno.env.get("WAKE_SECRET");
  if (WAKE_SECRET && req.headers.get("x-wake-secret") !== WAKE_SECRET) {
    return new Response("unauthorized", { status: 409 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

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
    } else {
      console.log("$ msgs", msgs);
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
      for (const m of tail) {
        await supabase.schema("pgmq").rpc("archive", { queue_name, msg_id: m.msg_id });
        drained++;
      }
      continue;
    }

    for (const m of msgs) {
      // do nothing with it… just remove it
      await supabase.schema("pgmq").rpc("archive", { queue_name, msg_id: m.msg_id });
      drained++;
    }
  }

  return drained
    ? new Response(`drained:${drained}`, { status: 200 })
    : new Response(null, { status: 204 });
});
