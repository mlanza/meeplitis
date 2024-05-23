import supabase from "./supabase.js";
import * as o from "./online.js";
import dom from "/libs/atomic_/dom.js";
import $ from "/libs/atomic_/reactives.js";
import {toggleHost} from "/libs/links.js";
import {reg} from "/libs/cmd.js";

reg({supabase});

const img = dom.tag("img");
const you = dom.sel1("#you");

function Session(user, username, avatar_url, accessToken){
  Object.assign(this, {user, username, avatar_url, accessToken});
}

async function registered(sess){
  const {data: {user}} = await supabase.auth.getUser();
  if (user) {
    const {data: [profile], error} = await supabase.from("profiles").select("username,avatar_url").eq("id", user.id);
    const {username, avatar_url} = profile ?? {username: null, avatar_url: null};
    return new Session(user, username, avatar_url, sess?.access_token);
  } else {
    return null;
  }
}

const {data: {session: sess}} = await supabase.auth.getSession();
export const session = sess ? await registered(sess) : null;
export const $online = o.online(session?.username);
export default session;

reg({$online, session});

dom.toggleClass(document.body, "anon", !session);

$.on(document, "keydown", function(e){
  if (e.metaKey && e.key == "l") {
    e.preventDefault();
    location.href = toggleHost("https://meeplitis.com");
  }
});

if (session) {
  if (!session.username) {
    const el = dom.sel1("#unidentified-user");
    el && dom.addClass(el, "reveal");
  }
  dom.html(you, img({src: session.avatar_url}))
  dom.attr(you, "href", session.username ? `/profiles/?username=${session.username}` : '/profiles/edit');
  $.on(document, "keydown", function(e){
    if (e.shiftKey && e.key === "Escape") {
      e.preventDefault();
      window.location = "/signout";
    } else if (e.shiftKey && e.key === " " && session.username) {
      e.preventDefault();
      window.location = `/profiles/?username=${session.username}`;
    }
  });
}
