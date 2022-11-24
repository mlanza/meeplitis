import supabase from "/lib/supabase.js";

const {data, error} = await supabase.auth
  .signOut();

location.href = "/signin";
