
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabaseUrl = "https://miwfiwpgvfhggfnqtfso.supabase.co",
      supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODUwMzIzMywiZXhwIjoxOTU0MDc5MjMzfQ.i1l7NNGYF7mChifi8X-Cn_tis-us1Zq1ntyVW-Amdf8",
      options = {
        "schema": "public",
        "headers": {
          "x-my-custom-header": "meeplitis"
        },
        "autoRefreshToken": true,
        "persistSession": true,
        "detectSessionInUrl": true
      };
export default createClient(supabaseUrl, supabaseKey, options);
