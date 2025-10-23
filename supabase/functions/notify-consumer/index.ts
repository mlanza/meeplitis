// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createDrainHandler } from "./queue-drainer.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      WAKE_SECRET = Deno.env.get("WAKE_SECRET");

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

const noop = function(){ return null };

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
      const f = prompts[slug] || noop;
      for (const seat of up) {
        const delegate_id = seated[seat]?.delegate_id;
        if (delegate_id) {
          try {
            const {error, data} = await supabase.rpc('action_perspective', {_table_id: table_id, _seat: seat});
            const prompt = data ? f(data) : null;
            if (prompt) {
              console.log({step: "deciding", msg_id, delegate_id, prompt});
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

function backgammon(payload) {
  return `
You are an expert Backgammon player.

## Task
Choose exactly one move from **moves**.

## Strict Output Contract
Reply with exactly TWO fenced code blocks, in this order:

1\) \`js\` — contains exactly the chosen move object copied verbatim from \`moves\`. No extra keys.
2\) \`md\` — your rationale (not too wordy) for humans (any formatting allowed).

If there is no legal move, the first block must be:

\`\`\`js
{"error":"no legal move"}
\`\`\`

## Your Perspective

The \`up\` and/or \`may\` attributes indicate you're ready to act.
The \`state\` attribute represents the current state of the game as data.
The checkers are counted as various \`points\` on the board or on the \`bar\` or \`off\` the board.
The \`moves\` attribute lists what moves are available to you.
The \`event\` attribute tells you what just happened, what immediate effect brought things to the current game state.

\`\`\`js
${JSON.stringify(payload, null, 2)}
\`\`\`
`;
}

const prompts = {
  backgammon
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


