// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// env (outside Deno.serve)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

// minimal CORS
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS"
};

const pickBearer = (req) => {
  const u = req.headers.get("x-supabase-authorization")?.trim();
  const a = req.headers.get("authorization")?.trim();
  const l = req.headers.get("accesstoken")?.trim();
  const cand = [u, a, l && `Bearer ${l}`].filter(Boolean);
  for (const c of cand) {
    const v = c.replace(/^Bearer\s+/i, "Bearer ").replace(/["']/g, "").trim();
    const t = v.startsWith("Bearer ") ? v.slice(7) : v;
    const parts = t.split(".");
    if (parts.length === 3 && parts.every(p => p.length > 0)) return v;
  }
  return null;
};

function paramsFromQuery(url) {
  const sp = new URL(url).searchParams;
  const out = {};
  for (const [k, v] of sp.entries()) {
    if (Object.prototype.hasOwnProperty.call(out, k)) {
      const curr = out[k];
      out[k] = Array.isArray(curr) ? [...curr, v] : [curr, v];
    } else {
      out[k] = v == null ? null : v;
    }
  }
  return out;
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers: CORS });
  if (req.method !== "GET") return new Response("Method Not Allowed", { status: 405, headers: CORS });

  const bearer = pickBearer(req);

  console.log("req", req.url, "bearer", bearer);

  try {
    const params = paramsFromQuery(req.url);
    const table_id = params.table_id,
          event_id = params.event_id,
          seat = params.seat == null ? null : params.seat;
    console.log("params", params)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: bearer ? { Authorization: bearer } : {} }
    });

    let userId = null;
    if (bearer) {
      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id ?? null;
    }

    console.log("seat", seat, "userId", userId);

    if (seat != null && userId) {
      const { data: seats, error } = await supabase.rpc("seats", { _player_id: userId, _table_id: table_id });
      if (error) {
        return new Response(JSON.stringify({ error: "Seat lookup failed", detail: error.message }), {
          status: 500, headers: { ...CORS, "content-type": "application/json" }
        });
      }
      if (!Array.isArray(seats) || !seats.includes(seat)) {
        return new Response(JSON.stringify({ error: "You are not permitted to see the game from this seat" }), {
          status: 403, headers: { ...CORS, "content-type": "application/json" }
        });
      }
    }

    const { data, error } = await supabase.rpc("simulate", {
      _table_id: table_id,
      _event_id: event_id,
      _commands: [],
      _seat: seat
    });
    if (error) {
      return new Response(JSON.stringify({ error: "Simulation failed", detail: error.message }), {
        status: 500, headers: { ...CORS, "content-type": "application/json" }
      });
    }

    const cacheClass = seat == null ? "public" : "private";
    return new Response(JSON.stringify(data ?? null), {
      status: 200,
      headers: {
        ...CORS,
        "content-type": "application/json",
        "cache-control": `${cacheClass}, max-age=2500000, immutable`
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500, headers: { ...CORS, "content-type": "application/json" }
    });
  }
});
