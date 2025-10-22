// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createDrainHandler } from "./queue-drainer.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      WAKE_SECRET = Deno.env.get("WAKE_SECRET");

async function handle(msg) {
  console.log({step: `handling ${msg.message.type}`, msg});

  const msg_id = msg.msg_id;
  if (msg.read_ct > 5) {
    console.error(`Message ${msg_id} exceeded retry threshold.`);
    return "archive";
  }
  switch (msg.message.type) {
    case "up": {
      return "archive";
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
      return "delete";
  }
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

const drain = createDrainHandler(supabase, "notifications", handle);

console.log("Ready");

Deno.serve(async function(req){
  // optional doorbell auth; include WAKE_SECRET only if you want it
  if (WAKE_SECRET && req.headers.get("x-wake-secret") !== WAKE_SECRET) {
    return new Response("unauthorized", { status: 409 });
  }
  return drain(req);
});
