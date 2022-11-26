import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import supabase from "/lib/supabase.js";
import {session} from "/lib/session.js";
import {table, seated, ready, onUpdate} from "/components/table/index.js";

const params = new URLSearchParams(document.location.search),
      username = params.get('username'),
      you = session?.username === username;

const {data: [profile]} =
  await supabase
    .from("profiles")
    .select("id,username,headline,description,avatar_url")
    .eq("username", username);

_.chain(you, dom.attr(document.body, "data-you", _));
_.chain(profile.username, _.str(_, " | ", "Your Move"), dom.text(dom.sel1("head title"), _));
_.chain(profile.username, dom.text(dom.sel1(".banner h1"), _));
_.chain(profile.headline || "Mysteriously quiet", dom.text(dom.sel1(".banner .headline"), _));
_.chain(profile.description || "Has not chosen to share any details.", dom.html(dom.sel1(".about > p"), _));
_.chain(profile.avatar_url, _.str(_, "?s=200"), dom.attr(dom.sel1(".banner img"), "src", _));

async function refreshTables(){
  const {data: tables, error, status} =
    await supabase
      .from("tables")
      .select(`
      *,
      seated:seats!inner(
        *
      ),
      seats!inner (
        id,
        seat,
        joined_at,
        player_id,
        player:player_id(
          id,
          username,
          avatar_url
        )
      ),
      game:game_id (
        id,
        title,
        slug,
        seats,
        thumbnail_url
      )`)
      .neq('status', "finished")
      .neq('status', "vacant")
      .eq('seated.player_id', profile.id)
      .order('created_at', {ascending: false});

  _.chain(tables, _.see("tables"), _.map(table, _), dom.html(dom.sel1(".open > p"), _));
}

refreshTables();
onUpdate(refreshTables);
