 // @ts-nocheck
import {fail, succeed, handlePipe, pipeP, headers} from "../pipeline.js";

console.log("Agent ready.");

Deno.serve(
  handlePipe(
    pipeP(
      completes(Deno.env.get("OPENROUTER_API_KEY")),
      extractMove)));

function completes(apiKey){
  return async function getCompletion(req){
    try {
      const {
        prompt: content,
        model = "google/gemini-2.5-flash-preview-09-2025",  // google/gemini-2.5-flash-preview-09-2025; openai/gpt-5-pro; mistralai/mistral-7b-instruct:free
        seed = Math.floor(Math.random() * 1_000_000),
        temperature = 0,
        top_p = 1
      } = req;

      const body = {
        model,
        seed,
        temperature,
        top_p,
        messages: [{ role: "user", content }],
      };

      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { ...headers, "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const info = await resp.text().catch(() => "");
        throw new Error(`OpenRouter ${resp.status}: ${info}`);
      }

      return await resp.json();

    } catch (ex) {
      return fail(ex, "getCompletion", 422);
    }
  }
}

function extractMove(completion){
  try {
    const reply = completion?.choices?.[0]?.message?.content;
    console.log({ reply });

    const digested = reply.trim()
      .replace(/^```json\s*/i, '')
      .replace(/```[\s]*$/, '');
    console.log({ digested });

    const { move, rationale } = JSON.parse(digested);
    console.log({ move, rationale });

    return succeed({ move, rationale });
  } catch (ex) {
    return fail(ex, "extractMove");
  }
}
