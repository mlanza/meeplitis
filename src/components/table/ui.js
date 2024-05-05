import _ from "/libs/atomic_/core.js";
import dom from "/libs/atomic_/dom.js";
import $ from "/libs/atomic_/reactives.js";
import supabase from "/libs/supabase.js";
import {session} from "/libs/session.js";

const tags = dom.tags(['div', 'span', 'img', 'a', 'p', 'button', 'article', 'table', 'tbody', 'thead', 'tr', 'th', 'td']);
const {div, span, img, a, p, button, article} = tags;
const profile = session?.username ? await getProfile(session?.username) : null;
const capacity = profile ? profile.capacity != null && (profile.open_tables + profile.started_tables) >= profile.capacity : null;

const params = new URLSearchParams(document.location.search),
      listed = params.get('listed'),
      release = params.get('release') || null,
      dummy = listed == "all" ? [true, false] : listed == "dummy" ? [true] : [false];

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
    _.mapa(table, _),
    Promise.all.bind(Promise),
    _.seq,
    _.either(_, none),
    dom.html(el, _));
}

export function managing(key, id, op = _.identity){
  async function open({config, seats, remark}){
    const {data, error} = await supabase.rpc('open_table', {
      _game_id: id,
      _release: release,
      _config: config,
      _remark: remark,
      _dummy:  listed == "dummy",
      _seats: seats
    });
    if (error) {
      const {message} = error;
      alert(message);
      return;
    }
    refreshTables();
  }
  function refreshTables(){
    mount(dom.sel1(".open-tables > p"), "None open",
      supabase
        .from('tables')
        .select(selection)
        .eq(key, id)
        .in('dummy', dummy)
        .eq('status', 'open')
        .order('created_at', {ascending: false}));
    mount(dom.sel1(".started-tables > p"), "None started",
      supabase
        .from('tables')
        .select(selection)
        .eq(key, id)
        .eq('status', 'started')
        .in('dummy', dummy)
        .order('touched_at', {ascending: false})
        .order('started_at', {ascending: false})
        .order('created_at', {ascending: false}), op);
    mount(dom.sel1(".finished-tables > p"), "None finished",
      supabase
        .from('tables')
        .select(selection)
        .limit(10)
        .eq(key, id)
        .in('dummy', dummy)
        .eq('status', 'finished')
        .order('finished_at', {ascending: false}));
  }
  return {open, refreshTables};
}

function restrictOpen(game, f){
  const g = game.status == "up" ? function(game){
    return capacity ? div("Cannot open new tables.  You are already at capacity.") : f(game);
  } : function(game){
    return div("Cannot open new tables.  ", game.status == "capacity" ? "No more may be opened at this time." : "Down for maintenance.");
  }
  session?.username && _.chain(game, _.see("game"), g, dom.html(dom.sel1(".create > p"), _));
}

export function dummyToggle(){
  const params = new URLSearchParams(document.location.search);
  $.on(document, "keydown", function(e){
    if (e.ctrlKey && e.key == "d") {
      if (params.get("listed") == "dummy") {
        params.delete("listed");
      } else {
        params.set("listed", "dummy");
      }
      location.href = `${location.origin}${location.pathname}?${params.toString()}` ;
    }
  });
}

export async function manageTables(creates){
  const id = dom.attr(dom.sel1("#identity"), "data-id");
  const game = await getGame(id);
  const {open, refreshTables} = managing('game_id', id);
  restrictOpen(game, _.partial(creates, open));
  refreshTables();
  onUpdate(refreshTables);
}

async function getRelease(tableId){
  const {data: [table]} = await supabase.
    from("tables").
    select('release').
    eq("id", tableId);

  return table?.release;
}

export async function chooseRelease(){
  const params = new URLSearchParams(document.location.search),
        tableId = params.get('id');

  if (tableId) {
    const release = await getRelease(tableId);
    location.href = location.href.replace("/table/", `/table/${release}/`);
  }
}

export async function getGame(gameId){
  const {data: [game]} =
    await supabase
      .from('games')
      .select(`
        id,
        title,
        seats,
        status,
        thumbnail_url`)
      .eq('id', gameId);
  return game;
}

export async function getProfile(username){
  const {data: [profile]} =
    await supabase
      .from("profiles_with_activity")
      .select("id,username,headline,description,avatar_url,last_sign_in_at,last_moved_at,capacity,all_tables,open_tables,started_tables")
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

export const rankings = (function(){
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
export async function table(item, now = new Date()){
  const {describe} = await import(`/games/${item.game.slug}/table/${item.release}/ancillary.js`);
  const seat = seated(item.seats);
  const open = item.status === "open";
  const {game, remark, config} = item;
  const link = open ? span : a;
  const stamp = item.finished_at ? "finished" : item.touched_at ? "touched" : null;
  const ranked = stamp == 'finished' ? rankings(item) : null;
  const age = _.maybe(item.finished_at || item.touched_at, _.date, _.partial(fromUTCDate, now), dt => aged(dt, now));
  const remarks = remark ? p(img({src: "/images/remarks.png"}), remark) : null;
  const remarked = remarks ? img({class: "flag", src: "/images/remarks.png", title: "see remarks"}) : null;
  const dummy = item.dummy ? img({class: "flag", title: "dummy table - for testing, eventually disposed", src: "/images/trash.png"}) : null;
  const desc = _.join(", ", describe(config)) || null;
  const options = desc ? p(img({src: "/images/gear.png"}), desc) : null;
  const optioned = options ? img({class: "flag", src: "/images/gear.png", title: "see options"}) : null;
  const shredded = item.shredded_at ? img({class: "flag", src: "/images/broom.png", title: "shredded move history"}) : null;
  return div({
      "class": `table ${item.dummy ? ' dummy' : ''}`,
      "data-table": item.id,
      "data-table-status": item.status,
      "data-seated": seat?.seat,
      "data-up": `${ _.join(" ", item.up) }`
    },
      span({class: "id"},
        link(shredded ? null : {href: `/games/${game.slug}/table/?id=${item.id}`}, game.title, " - ", item.id), " ",
        span({class: stamp}, _.maybe(age, _.join("", _), _.str(stamp || "", " ", _, " ago"))), " ",
          dummy,
          optioned,
          remarked,
          shredded),
      div({class: "game"},
        a({href: `/games/${game.slug}`}, img({src: game.thumbnail_url, alt: game.title})),
        !seat && open && session?.username ? button({value: "join"}, game.status == "down" ? {disabled: "disabled"} : {}, "Join") : null,
         seat && open && session?.username ? button({value: "leave"}, "Leave") : null),
      article(
        div({class: "seats"}, _.map(function(seat){
          const won = seat.place === 1;
          return span({"class": "seat avatar", "data-username": seat?.player?.username || "", "data-seat": seat.seat, "data-place": seat.place},
            img({class: "pawn", src: "/images/pawn.svg"}),
            won ? img({class: "won", title: "Winner", alt: "Winner", src: "/images/star.svg"}) : null,
            avatar(seat.player));
        }, _.sort(_.asc(_.get(_, "seat")), item.seats)),
        options,
        remarks,

        )),
      ranked);
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
      if (error) {
        const {message} = error;
        alert(message);
      } else {
        callback(data);
      }
    } finally {
      dom.prop(this, "disabled", false);
      dom.removeClass(document.body, "blocked");
    }
  });
}
