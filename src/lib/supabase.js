import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

function toJSON(resp){
  return resp.json();
}

const {supabaseUrl, supabaseKey, options} = await fetch("https://config.workers.yourmove.cc", {
  mode: "cors",
  headers: {
    "accept": "application/json",
    "content-type": "application/json; charset=UTF-8"
  }
}).then(toJSON);

export default createClient(supabaseUrl, supabaseKey, options);
