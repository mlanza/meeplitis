import supabase from "./supabase.js";
import * as o from "./online.js";

function Session(userId, username, accessToken){
  Object.assign(this, {userId, username, accessToken});
}

let _session = null;

let {data: {user}} = await supabase.auth.getUser();

if (user){
  const {data: [profile]} = await supabase
    .from('profiles')
    .select('username')
    .eq("id", user.id);
  const {data: {session: sess}} = await supabase.auth.getSession();
  _session = new Session(user.id, profile.username, sess?.access_token);
}

export const session = _session;
export const $online = o.online(session?.username);
