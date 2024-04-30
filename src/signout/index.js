import supabase from "/libs/supabase.js";

const {data, error} = await supabase.auth
  .signOut();

location.href = "/signin";
