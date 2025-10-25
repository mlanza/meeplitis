// @ts-nocheck
import _ from "https://meeplitis.com/libs/atomic_/core.js";

console.log("Agent ready.");

const apiKey = Deno.env.get("OPENROUTER_API_KEY");

const headers = { "Content-Type": "application/json" };

Deno.serve(async function(req){

  const {
    prompt: content,
    model = "google/gemini-2.5-flash-preview-09-2025",  //google/gemini-2.5-flash-preview-09-2025; openai/gpt-5-pro; mistralai/mistral-7b-instruct:free
    seed = Math.floor(Math.random() * 1_000_000),
    temperature = 0,
    top_p = 1
  } = await req.json();

  const body = {
    model,
    seed,
    temperature,
    top_p,
    messages: [{ role: "user", content }],
  };

  //console.log({body});

  const completion = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {...headers, "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  }).then(resp => resp.json());

  console.log({completion});

  try {
    const reply = _.chain(completion, _.getIn(_, ["choices", 0, "message", "content"]));
    console.log({reply});

    const digested = reply.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
    console.log({digested});

    const {move, rationale} = JSON.parse(digested);
    console.log({move, rationale});

    return new Response(JSON.stringify(move), { headers, status: 200 });
  } catch (ex) {
    console.error("Move extraction failed:", ex);
    return new Response(JSON.stringify({
      error: "InvalidMove",
      message: "Failed to extract a valid move from model output."
    }), { status: 422, headers });
  }
});
