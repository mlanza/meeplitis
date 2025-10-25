// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createDrainHandler } from "../queue-drainer.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      WAKE_SECRET = Deno.env.get("WAKE_SECRET");

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

async function handle(msg) {
  console.log({step: `handling ${msg.message.type}`, msg});
  const msg_id = msg.msg_id;
  if (msg.read_ct > 5) {
    console.error(`Message ${msg_id} exceeded retry threshold.`);
    return "archive";
  }
  switch (msg.message.type) {
    case "up": {
      const {type, up, table_id, title, slug, thumbnail_url, seated} = msg.message;
      for (const seat of up) {
        const delegate_id = seated[seat]?.delegate_id;
        if (delegate_id) {
          try {
            const {error, data} = await supabase.rpc('move_prompt', {_table_id: table_id, _seat: seat});
            const prompt = data ? createPrompt(data) : null;
            if (prompt) {
              console.log({step: "deciding", msg_id, delegate_id, prompt});
              const {move, rationale} = await fetch(`${SUPABASE_URL}/functions/v1/decide-move`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                },
                body: JSON.stringify({prompt})
              }).then(resp => resp.json());

              console.log("move selected", move, "rationale", rationale);

              const commands = [move];
              const moving = {
                _table_id: table_id,
                _seat: seat,
                _commands: commands
              };
              console.log({step: "moving", msg_id, moving});
              const {data, error, status} = await supabase.rpc('move', moving);
              if (error) {
                console.error({step: "moved", msg_id, status, error});
                return null;
              }
              console.log({step: "moved", msg_id, status, data});
            }
            return "delete";
          } catch (ex) {
            console.error({msg_id, ex});
            return "archive";
          }
        }
      }
      return "delete";
    }
    default:
      return "delete";
  }
}

function createPrompt(payload){
  const {prompt} = payload;
  const content = {...payload};
  delete content.prompt;
  return prompt + "\n\n" + "```js\n" + JSON.stringify(content) + "\n```\n";
}

const drain = createDrainHandler(supabase, "notifications", handle);

console.log("Ready");

Deno.serve(async function(req){
  // optional doorbell auth; include WAKE_SECRET only if you want it
  if (WAKE_SECRET && req.headers.get("x-wake-secret") !== WAKE_SECRET) {
    return new Response("unauthorized", { status: 409 });
  }
  return drain(req);
});


