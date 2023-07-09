import supabase from "./supabase.js";
import * as o from "./online.js";
import dom from "/lib/atomic_/dom.js";
import "/lib/cmd.js";

const img = dom.tag("img");
const you = dom.sel1("#you");
const data = {session: null, user: null};

function Session(userId, username, avatar_url, accessToken){
  Object.assign(this, {userId, username, avatar_url, accessToken});
}

const {data: {session: sess}} = await supabase.auth.getSession();

if (sess){
  let {data: {user}} = await supabase.auth.getUser();
  data.user = user;
  const {data: [profile], error} = await supabase.from("profiles").select("username,avatar_url").eq("id", user.id);
  const {username, avatar_url} = profile ?? {username: null, avatar_url: null};
  dom.attr(you, "href", username ? `/profiles/?username=${username}` : '/profiles/edit');
  data.session = new Session(user.id, username, avatar_url, sess?.access_token);
}

const user = data.user;
export const session = data.session;
export const $online = o.online(session?.username);

dom.toggleClass(document.body, "anon", !user);
session && dom.html(you, img({src: `${session?.avatar_url}?s=50`}));

Object.assign(window, {$online, session});
