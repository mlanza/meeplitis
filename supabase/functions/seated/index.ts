// @ts-nocheck
import { makeRpcHandler } from "../rpc-handler.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL"),
      SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");

Deno.serve(makeRpcHandler("seated", { SUPABASE_URL, SUPABASE_KEY }, {
  "cache-control": "public, max-age=2500000, immutable" //about a month
}));
