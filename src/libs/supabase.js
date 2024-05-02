
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = "https://miwfiwpgvfhggfnqtfso.supabase.co",
      supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODUwMzIzMywiZXhwIjoxOTU0MDc5MjMzfQ.i1l7NNGYF7mChifi8X-Cn_tis-us1Zq1ntyVW-Amdf8";
export default createClient(supabaseUrl, supabaseKey, {
  "schema": "public",
  "headers": {
    "x-my-custom-header": "meeplitis"
  },
  "autoRefreshToken": true,
  "persistSession": true,
  "detectSessionInUrl": true
});
