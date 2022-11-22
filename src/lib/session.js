import supabase from "./supabase.js";
import * as o from "./online.js";
import dom from "/lib/atomic_/dom.js";
import "/lib/cmd.js";

const img = dom.tag("img");
const you = dom.sel1("#you");

function Session(userId, username, avatar, accessToken){
  Object.assign(this, {userId, username, avatar, accessToken});
}

let _session = null;

let {data: {user}} = await supabase.auth.getUser();

if (user){
  const {data: [{username, avatar}], error} = await supabase.rpc("userinfo", {_id: user.id});
  const {data: {session: sess}} = await supabase.auth.getSession();
  dom.attr(you, "href", `/profiles/?username=${username}`);
  _session = new Session(user.id, username, avatar, sess?.access_token);
}

export const session = _session;
export const $online = o.online(session?.username);

dom.attr(document.body, "data-anonymous", !user);
dom.html(you, img({src: `${session?.avatar}?s=50`}));

Object.assign(window, {$online, session});
