import _ from "/libs/atomic_/core.js";
import $ from "/libs/atomic_/shell.js";
import dom from "/libs/atomic_/dom.js";
import {session} from "/libs/session.js";
import {fmttime} from "/libs/dates.js";
import {managing, getProfile, onUpdate} from "/components/table/ui.js";
import {profiles, render} from "/libs/profiles.js";
import {reg} from "/libs/cmd.js";
import "/libs/dummy.js";

const params = new URLSearchParams(document.location.search),
      username = params.get('username'),
      you = session?.username === username;

if (username) {
  dom.attr(document.body, "data-view", "profile");
  dom.removeClass(document.body, "borderless-img");

  const profile = await getProfile(username);
  const {refreshTables} = managing('seat.player_id', profile.id, _.sort(_.desc(yourTurn), _.asc(_.get(_, "touched_at")), _));

  _.chain(you, dom.attr(document.body, "data-you", _));
  _.maybe(profile.last_sign_in_at, fmttime, dom.text(dom.sel1("#last-sign-in"), _));
  _.maybe(profile.last_moved_at, fmttime, dom.text(dom.sel1("#last-moved"), _));
  _.chain(profile.username, _.str(_, " | ", "Meeplitis"), dom.text(dom.sel1("head title"), _));
  _.chain(profile.username, dom.text(dom.sel1(".banner h1"), _));
  _.chain(profile.headline || "Mysteriously quiet", dom.text(dom.sel1(".banner .headline"), _));
  _.chain(profile.description || "Has not shared any details.", dom.html(dom.sel1(".about > p"), _));
  _.chain(profile.avatar_url, dom.attr(dom.sel1(".banner img"), "src", _));

  function yourTurn(table){
    const seated = _.first(table.seated)?.seat;
    return _.includes(table.up, seated);
  }

  refreshTables();
  onUpdate(refreshTables);

} else {
  dom.attr(document.body, "data-view", "profiles");

  _.fmap(profiles(),
    $.tee(_.plug(reg, "profiles", _)),
    _.map(_.pipe(render, dom.tag('li')), _),
    dom.html(dom.sel1(".profiles ul"), _));
}
