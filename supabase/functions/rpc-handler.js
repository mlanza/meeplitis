// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,OPTIONS"
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

const paramsFromQuery = (url) => {
  const sp = new URL(url).searchParams;
  const out = {};
  for (const [k, v] of sp.entries()) {
    if (Object.prototype.hasOwnProperty.call(out, k)) {
      const curr = out[k];
      out[k] = Array.isArray(curr) ? [...curr, v] : [curr, v];
    } else {
      out[k] = v;
    }
  }
  return out;
};

/**
 * makeRpcHandler
 * @param {string} rpcName
 * @param {{ SUPABASE_URL: string, SUPABASE_KEY: string }} env
 * @param {{ permanent?: boolean }} [options]
 * @returns {(req: Request) => Promise<Response>}
 */
export function makeRpcHandler(rpcName, env, { permanent = false } = {}) {
  const { SUPABASE_URL, SUPABASE_KEY } = env;

  return async (req) => {
    if (req.method === "OPTIONS") {
      return new Response("", { headers: corsHeaders });
    }

    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "content-type": "application/json; charset=UTF-8" }
      });
    }

    try {
      const bearer = pickBearer(req);
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        global: { headers: bearer ? { Authorization: bearer } : {} },
        auth: { persistSession: false, autoRefreshToken: false }
      });

      const params = paramsFromQuery(req.url);
      const { data, error } = await supabase.rpc(rpcName, params);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json; charset=UTF-8" }
        });
      }

      const responseHeaders = {
        ...corsHeaders,
        "content-type": "application/json; charset=UTF-8"
      };

      if (permanent) {
        responseHeaders["cache-control"] = "public, max-age=31536000, immutable";
        responseHeaders["Vary"] = "origin, accept-encoding";
      } else {
        responseHeaders["cache-control"] = "no-cache, no-store, must-revalidate";
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: responseHeaders
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json; charset=UTF-8" }
      });
    }
  };
}
