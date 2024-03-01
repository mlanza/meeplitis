import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import supabase from "/lib/supabase.js";
import {session} from "/lib/session.js";

const tags = dom.tags(['div', 'span', 'img', 'a', 'p', 'button', 'table', 'tbody', 'thead', 'tr', 'th', 'td']);
const {div, span, img, a, p, button} = tags;

function ohhell(config){
  const descriptors = [];
  if (config.start === 7 && config.end === 1) {
    descriptors.push("Down and Up Variant");
  }
  return descriptors;
}

function mexica(config){
  return [];
}

const games = {
  "8Mj1": ohhell,
  "SopC": mexica
};

export const selection = `
*,
seat:seats!inner(*),
seated:seats(*),
seats (
  id,
  seat,
  joined_at,
  place,
  player:player_id(
    id,
    username,
    avatar_url
  )
),
game:game_id (
  id,
  title,
  seats,
  status,
  slug,
  thumbnail_url
)`;

export function promised(request){
  return new Promise(function(resolve, reject){
    request.then(function({data, error}){
      if (error) {
        reject(error);
      } else if (data) {
        resolve(data);
      }
    });
  });
}

export function mount(el, none, request, op = _.identity){
  _.fmap(promised(request),
    op,
    _.see("mounting"),
    _.map(table, _),
    _.seq,
    _.either(_, none),
    dom.html(el, _));
}

export function managing(key, id, op = _.identity){
  async function open({config, seats, remark}){
    const {data, error} = await supabase.rpc('open_table', {
      _game_id: id,
      _config: config,
      _remark: remark,
      _seats: seats
    });
    refreshTables();
  }
  function refreshTables(){
    mount(dom.sel1(".open-tables > p"), "None open",
      supabase
        .from('tables')
        .select(selection)
        .eq(key, id)
        .eq('status', 'open')
        .order('created_at', {ascending: false}));
    mount(dom.sel1(".started-tables > p"), "None started",
      supabase
        .from('tables')
        .select(selection)
        .eq(key, id)
        .eq('status', 'started')
        .order('touched_at', {ascending: false})
        .order('started_at', {ascending: false})
        .order('created_at', {ascending: false}), op);
    mount(dom.sel1(".finished-tables > p"), "None finished",
      supabase
        .from('tables')
        .select(selection)
        .limit(10)
        .eq(key, id)
        .eq('status', 'finished')
        .order('finished_at', {ascending: false}));
  }
  return {open, refreshTables};
}

function manageCreation(game, f){
  const g = game.status == "up" ? f : function(game){
    return div("Cannot create new tables.  ", game.status == "capacity" ? "No more may be opened at this time." : "Down for maintenance.");
  }
  session?.username && _.chain(game, _.see("game"), g, dom.html(dom.sel1(".create > p"), _));
}

export async function spawnTables(creates){
  const id = dom.attr(dom.sel1("#identity"), "data-id");
  const game = await getGame(id);
  const {open, refreshTables} = managing('game_id', id);
  manageCreation(game, _.partial(creates, open));
  refreshTables();
  onUpdate(refreshTables);
}

export async function getGame(game_id){
  const {data: [game]} =
    await supabase
      .from('games')
      .select(`
        id,
        title,
        seats,
        status,
        thumbnail_url`)
      .eq('id', game_id);
  return game;
}

export async function getProfile(username){
  const {data: [profile]} =
    await supabase
      .from("profiles_with_activity")
      .select("id,username,headline,description,avatar_url,last_sign_in_at,last_moved_at")
      .eq("username", username);
  return profile;
}

export function seated(seats){
  return _.detect(function(seat){
    return session && seat.player && seat.player.username === session.username;
  }, seats);
}

export function ready(item, seat) {
  return _.includes(item.up, seat?.seat);
}

export function describe(table){
  return _.seq(_.compact(_.cons(table.remark, games[table.game_id](table.config))));
}

function daylightSavings(dt) {
  return dt.getTimezoneOffset() < stdTimezoneOffset(dt);
}

function stdTimezoneOffset(dt){
  const jan = new Date(dt.getFullYear(), 0, 1),
        jul = new Date(dt.getFullYear(), 6, 1);
  return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

function fromUTCDate(now, utcDt){
  const offset = stdTimezoneOffset(now) + (daylightSavings(now) ? -60 : 0);
  return _.add(utcDt, _.minutes(-offset));
}

function aged(dt, asof){
  function diff(dt1, dt2, units){
    return Math.ceil(Math.abs(dt2 - dt1) / units);
  }
  function lessThan(units){
    return _.subtract(asof, units) < dt;
  }
  if (lessThan(_.minutes(1))) {
    return [diff(dt, asof, 1000), "s"];
  } else if (lessThan(_.hours(1))) {
    return [diff(dt, asof, 1000 * 60), "m"];
  } else if (lessThan(_.days(1))) {
    return [diff(dt, asof, 1000 * 60 * 60), "h"];
  } else {
    return [diff(dt, asof, 1000 * 60 * 60 * 24), "d"];
  }
}

const rankings = (function(){
  const {table, tbody, thead, tr, td, th} = tags;
  return function rankings({seated, seats}){
    const ranks = _.sort(_.asc(_.get(_, "place")), _.map(_.merge, seated, seats));
    const rows = _.map(function({place, player, brief}){
      return tr(td({class: "player"}, a({href: `/profiles/?username=${player.username}`}, player.username)), td({class: "place"}, place), td({class: "brief"}, brief));
    }, ranks);
    return table({class: "rankings"},
      thead(tr(th({class: "player"}, "player"), th({class: "place"}, "#"), th({class: "brief"}, "score"))),
      tbody(rows)
    )
  }
})();

function avatar(player){
  const src = player?.avatar_url;
  return player ? a({href: `/profiles/?username=${player.username}`}, img({src, title: player.username})) : img({src: "/images/chair.jpg", title: "Vacant Seat"});
}

//TODO extract user timezone adjustment
export function table(item, now = new Date()){
  const seat = seated(item.seats);
  const open = item.status === "open";
  const {game} = item;
  const link = open ? span : a;
  const thinned = item.thinned_at ? img({class: "thinned", src: "/images/broom.png", title: "move history purged"}) : null;
  const stamp = item.finished_at ? "finished" : item.touched_at ? "touched" : null;
  const ranked = stamp == 'finished' ? rankings(item) : null;
  const age = _.maybe(item.finished_at || item.touched_at, _.date, _.partial(fromUTCDate, now), dt => aged(dt, now));
  return div({
      "class": "table",
      "data-table": item.id,
      "data-table-status": item.status,
      "data-seated": seat?.seat,
      "data-up": `${ _.join(" ", item.up) }`
    },
      span({class: "id"},
        link(thinned ? null : {href: `/games/${game.slug}/table/?id=${item.id}`}, game.title, " - ", item.id), " ",
        span({class: stamp}, _.maybe(age, _.join("", _), _.str(stamp || "", " ", _, " ago"))), " ", thinned),
      div({class: "game"},
        a({href: `/games/${game.slug}`}, img({src: game.thumbnail_url, alt: game.title})),
        !seat && open && session?.username ? button({value: "join"}, game.status == "down" ? {disabled: "disabled"} : {}, "Join") : null,
         seat && open && session?.username ? button({value: "leave"}, "Leave") : null),
      div({class: "seats"}, _.map(function(seat){
        const won = seat.place === 1;
        return span({"class": "seat avatar", "data-username": seat?.player?.username || "", "data-seat": seat.seat, "data-place": seat.place},
          img({class: "pawn", src: "/images/pawn.svg"}),
          won ? img({class: "won", title: "Winner", alt: "Winner", src: "/images/star.svg"}) : null,
          avatar(seat.player));
      }, _.sort(_.asc(_.get(_, "seat")), item.seats)),
      _.map(p, describe(item))), ranked);
}

export function onUpdate(callback){
  $.on(document.body, "click", "button", async function(e){
    dom.prop(this, "disabled", true);
    dom.addClass(document.body, "blocked");
    const action = `${this.value}_table`,
          table = _.closest(this, "[data-table]"),
          _table_id = dom.attr(table, "data-table");
    try {
      const {data, error} = await supabase.rpc(action, {
        _table_id
      });
      callback(data);
    } finally {
      dom.removeClass(document.body, "blocked");
    }
  });
}
