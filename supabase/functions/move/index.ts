// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2'

// Define CORS headers (allow all origins and needed headers)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-delegate-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

Deno.serve(async function(req){
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Preflight request received");
    return new Response("ok", { headers: corsHeaders });
  }

  // Log invocation and parse request body
  console.log("Edge function invoked!", new Date().toISOString());
  const request = await req.json().catch(e => {
    console.error("No JSON payload or failed to parse JSON", e)
    return null
  });

  const {table_id, seat} = request;
  const commands = JSON.parse(request.commands || "null");

  const authHeader = req.headers.get("Authorization") || "";

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } }
  });
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) {
    console.error("Error fetching user info:", error.message);
  } else {
    console.log("User fetched:", user);
  }
  const seats = user
    ? (await supabase.rpc('seats', { _table_id: table_id })).data
    : [];

  if (!seats.includes(seat)) {
    throw new Error("You are not permitted to issue a move from this seat");
  }

  const resp = await supabase.rpc('move', {
    _table_id: table_id,
    _seat: seat,
    _commands: commands
  });

  //const resp = {data: { seats, user }, error: null, status: 200};

  return new Response(JSON.stringify(resp), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
    status: resp.error ? (resp.error.code === "XX000" ? 409 : resp.status || 400) : 200
  });
});
