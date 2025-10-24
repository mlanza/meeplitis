// @ts-nocheck
import { makeRpcHandler } from "../rpc-handler.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL"),
      SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");

Deno.serve(makeRpcHandler("touching", { SUPABASE_URL, SUPABASE_KEY }, {}));
