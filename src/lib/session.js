import supabase from "./supabase.js";
import * as o from "./online.js";
import dom from "/lib/atomic_/dom.js";
import "/lib/cmd.js";

const img = dom.tag("img");
const you = dom.sel1("#you");
const data = {session: null, user: null};

function Session(userId, username, avatar, accessToken){
  Object.assign(this, {userId, username, avatar, accessToken});
}

const {data: {session: sess}} = await supabase.auth.getSession();

if (sess){
  let {data: {user}} = await supabase.auth.getUser();
  data.user = user;
  const {data: [{username, avatar}], error} = await supabase.rpc("userinfo", {_id: user.id});
  dom.attr(you, "href", `/profiles/?username=${username}`);
  data.session = new Session(user.id, username, avatar, sess?.access_token);
}

const user = data.user;
export const session = data.session;
export const $online = o.online(session?.username);

dom.attr(document.body, "data-anonymous", !user);
session && dom.html(you, img({src: `${session?.avatar}?s=50`}));

Object.assign(window, {$online, session});
