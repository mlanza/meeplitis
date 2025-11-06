import supabase from "./supabase.js";
import * as o from "./online.js";
import $ from "./atomic_/shell.js";
import {toggleHost} from "./links.js";
import {reg} from "./cmd.js";

reg({supabase});

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

if (typeof Deno !== 'undefined' && Deno?.env) {
  $.log("Recalling session")
  await supabase.auth.setSession({
    "access_token": Deno.env.get("SUPABASE_SESSION_ACCESS_TOKEN"),
    "refresh_token": Deno.env.get("SUPABASE_SESSION_REFRESH_TOKEN")
  });
}

const {data: {session: sess}} = await supabase.auth.getSession();
export const session = sess ? await registered(sess) : null;
export const $online = o.online(session?.username);
export default session;

const accessToken = session?.accessToken;
const apikey = supabase.supabaseKey;
const headers = {
  apikey,
  authorization: `Bearer ${accessToken ?? apikey}`,
  accept: 'application/json'
}

export function getfn(name, params = null){
  const qs = params ? new URLSearchParams(params).toString() : null;
  return fetch(`${supabase.functionsUrl.href}/${name}?${qs}`, {
    method: 'GET',
    headers
  }).then(resp => resp.json());
}

reg({$online, session});

if (globalThis.document) {
  const dom = await import("./atomic_/dom.js");
  const img = dom.tag("img");
  const you = dom.sel1("#you");

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
}

