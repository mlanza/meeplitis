import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import supabase from "/lib/supabase.js";
import {session} from "/lib/session.js";
import {managing, getProfile, onUpdate} from "/components/table/index.js";

const params = new URLSearchParams(document.location.search),
      username = params.get('username'),
      you = session?.username === username;

const profile = await getProfile(username);
const {refreshTables} = managing('seated.player_id', profile.id, _.sort(_.desc(yourTurn), _.asc(_.get(_, "touched_at")), _));

_.chain(you, dom.attr(document.body, "data-you", _));
_.chain(profile.username, _.str(_, " | ", "Your Move"), dom.text(dom.sel1("head title"), _));
_.chain(profile.username, dom.text(dom.sel1(".banner h1"), _));
_.chain(profile.headline || "Mysteriously quiet", dom.text(dom.sel1(".banner .headline"), _));
_.chain(profile.description || "Has not shared any details.", dom.html(dom.sel1(".about > p"), _));
_.chain(profile.avatar_url, _.str(_, "?s=200"), dom.attr(dom.sel1(".banner img"), "src", _));

function yourTurn(table){
  const seated = _.first(table.seated)?.seat;
  return _.includes(table.up, seated);
}

refreshTables();
onUpdate(refreshTables);
