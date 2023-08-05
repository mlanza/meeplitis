import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import supabase from "/lib/supabase.js";
import {session} from "/lib/session.js";
import {table, seated, onUpdate} from "/components/table/index.js";

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
_.chain(profile.description || "Has not shared any details.", dom.html(dom.sel1(".about > p"), _));
_.chain(profile.avatar_url, _.str(_, "?s=200"), dom.attr(dom.sel1(".banner img"), "src", _));

function getTables(statuses, ops, el, none){
  return supabase
    .from("tables")
    .select(`
    *,
    seated:seats!inner(*),
    seats!inner (
      id,
      seat,
      place,
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
    .in('status', statuses)
    .eq('seated.player_id', profile.id)
    .order('created_at', {ascending: false})
    .then(function({data, error}){
      return data;
    })
    .then(_.see("tables"))
    .then(ops)
    .then(_.map(table, _))
    .then(_.seq)
    .then(_.either(_, none))
    .then(dom.html(el, _));
  }

function yourTurn(table){
  const seated = _.first(table.seated)?.seat;
  return _.includes(table.up, seated);
}

function refreshTables(){
  getTables(
    ["open", "started"],
    _.sort(_.desc(_.get(_, "status")), _.desc(yourTurn), _.asc(_.get(_, "touched_at")), _.asc(_.get(_, "started_at")), _.asc(_.get(_, "created_at")), _),
    dom.sel1(".unfinished-tables > p"),
    "None open or started");
  getTables(
    ["finished"],
    _.sort(_.desc(_.get(_, "finished_at")), _),
    dom.sel1(".finished-tables > p"),
    "None finished");
}

refreshTables();
onUpdate(refreshTables);
