// @ts-nocheck
import _ from "https://meeplitis.com/libs/atomic_/core.js";

console.log("Agent ready.");

const apiKey = Deno.env.get("OPENROUTER_API_KEY");

function extractFencedBlocks(markdown) {
  const blocks = {};
  const regex = /```(\w+)?\s*([\s\S]*?)\s*```/g;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    const label = match[1] || 'plain';
    const content = match[2].trim();
    blocks[label] = content;
  }

  return blocks;
}

Deno.serve(async function (req){

  const {
    prompt: content,
    model = "google/gemini-2.5-flash-preview-09-2025",  //google/gemini-2.5-flash-preview-09-2025; openai/gpt-5-pro; mistralai/mistral-7b-instruct:free
    seed = Math.floor(Math.random() * 1_000_000),
    temperature = 0,
    top_p = 1
  } = await req.json();

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      seed,
      temperature,
      top_p,
      messages: [{ role: "user", content }],
    }),
  });

  const data = await resp.json();

  console.log({data});

  try {
    const {js, md} = _.chain(data, _.getIn(_, ["choices", 0, "message", "content"]), extractFencedBlocks);
    const move = JSON.parse(js);
    return new Response(JSON.stringify(move), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (ex) {
    console.error("Move extraction failed:", ex);
    return new Response(JSON.stringify({
      error: "InvalidMove",
      message: "Failed to extract a valid move from model output."
    }), { status: 422, headers: { "Content-Type": "application/json" } });
  }
});
