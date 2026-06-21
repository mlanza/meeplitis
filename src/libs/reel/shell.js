import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as r from "./core.js";
import supabase from "../supabase.js";
import { timer } from "./timer.js";
import * as d from  "./diff.js";
import { Workboard } from "./workboard.js";

function throttledOn(source, pred, ms = 1000){
  const initial = _.deref(source);
  const sink = $.atom(initial);

  let id = null;
  let current = initial;
  let pending = null;

  function clear(){
    if (id != null) {
      clearTimeout(id);
      id = null;
    }
  }

  function release(){
    id = null;

    if (_.eq(pending, current) && pred(current)) {
      $.reset(sink, pending);
    }

    pending = null;
  }

  const unsub = $.sub(source, function(value){
    current = value;

    if (pred(value)) {
      pending = value;

      clear();

      id = setTimeout(release, ms);
    } else {
      clear();

      pending = null;

      $.reset(sink, value);
    }
  });

  return _.doto(sink, _.specify(_.IDisposable, {
    dispose: function(){
      clear();
      unsub();
      _.dispose(sink);
    }
  }));
}

const throttedBool = s => throttledOn(s, value => value === true);

export function getfn(name, params, accessToken){
  const apikey = supabase.supabaseKey;
  const headers = {
    apikey,
    authorization: `Bearer ${accessToken ?? apikey}`,
    accept: 'application/json'
  }
  const qs = params ? new URLSearchParams(params).toString() : null;
  return fetch(`${supabase.functionsUrl.href}/${name}?${qs}`, {
    method: 'GET',
    headers
  }).then(resp => resp.json());
}

export function getSeated(_table_id, accessToken = null){
  return getfn("seated", {_table_id}, accessToken);
}

export function getSeats(_table_id, accessToken){ //user can hold multiple seats in dummy games or, as a spectator, none at all
  return accessToken ? getfn("seats", {_table_id}, accessToken) : Promise.resolve([]);
}

function getTouches(_table_id, accessToken){
  return getfn('touches', {_table_id}, accessToken);
}

function digest(result){
  const code  = result?.code,
        error = code == null ? null : result,
        data  = code == null ? result : null;
  return {error, data};
}

function getPerspective(table_id, event_id, seat, seat_id, accessToken){
  const perspective = getfn("perspective", _.compact({table_id, event_id, seat}), accessToken).then(digest);
  const last_move = getLastMove(table_id, event_id, seat_id);
  return Promise.all([perspective, last_move]).then(function([{data, error}, last_move]){
    return Object.assign({}, error || data, last_move);
  });
}

function getLastMove(_table_id, _event_id, _seat_id){ //TODO send access token
  return supabase.rpc('last_move', {
    _table_id,
    _event_id,
    _seat_id
  }).then(function({data}){
    return {last_move: data};
  });
}

function isWorking(queue){
  return Object.keys(queue || {}).length > 0;
}

function isReady(queue){
  return _.reducekv(function(memo, ticketId, ticket){
    return memo && !ticket.blocking;
  }, true, queue);
}


function table(tableId){
  const $t = $.atom(null);

  supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .then(_.getIn(_, ["data", 0]))
    .then($.reset($t, _));

  supabase
    .channel('db-messages')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'tables',
      filter: `id=eq.${tableId}`,
    }, function(payload){
      $.reset($t, payload.new);
    })
    .subscribe();

  return $.pipe($t, _.compact());
}

function move(table_id, seat, cmds){ //TODO send access token, move should otherwise be barred
  const commands = _.mapa(_.assoc(_, "seat", seat), cmds);
  const body = {table_id, seat, commands};
  return supabase.functions.invoke("move", {body}).then(_.get(_, "data"));
}

function undoMove(_table_id, _event_id){
  return supabase.rpc('undo', {
    _table_id,
    _event_id
  });
}

function undoThru(undoables, touch){
  return _.some(function([key, vals]){
    return _.includes(vals, touch) ? key : null;
  }, undoables);
}

export const path = _.pipe(_.deref, _.getIn(_, ["cursor", "at"]), _.otherwise(_, "^^^^^"), _.array);

export function reel(tableId, seat = null, accessToken = null){
  const $timeline = $.atom(r.init(tableId, seat));
  const $cursor = $.map(_.get(_, "cursor"), $timeline);
  const $table = table(tableId);
  const $touch = $.pipe($.map(_.get(_, "last_touch_id"), $table), _.filter(_.isSome));
  const $started = $.map(({status}) => status === "started", $table);
  const $scratch = $.atom({});
  const $sink = $.atom(null);
  const $wip = $.cursor($scratch, function(){
    return path($sink);
  });
  const $error = $.atom(null);
  const $queue = $.atom({});
  const $ready = $.map(isReady, $queue);
  const $working = $.map(isWorking, $queue);
  const $blockers = $.atom(null);

  function spectator(){
    const {seat} = _.deref(self) || {};
    return seat == null || self.accessToken == null;
  }

  function ready(){
    return _.deref($ready);
  }

  function reject(error){
    $.reset($error, error);
  }

  const wb = new Workboard(spectator, ready, reject, $queue);
  wb.register("getTouches", getTouches);
  wb.register("getPerspective", getPerspective);
  wb.register("move", move, true);
  wb.register("do-over", undoMove, true);

  const $up = $.map(_.pipe(_.get(_, "up"), _.includes(_, seat)), $table);
  const $seated = $.fromPromise(getSeated(tableId, accessToken));   //seated is everyone's info.
  const $seats = $.fromPromise(getSeats(tableId, accessToken)); //seats answers which seats are yours? (1 seat per player, except at dummy tables)
  const $setting = $.pipe($.then(async function({ id, release, game_id, config }, seated, seats){
    const { slug, make } = await supabase
      .from('games')
      .select('slug')
      .eq('id', game_id)
      .then(_.getIn(_, ["data", 0]))
      .then(async function({slug}){
        const url = `../../games/${slug}/table/${release}/core.js`;
        const { make } = await import(url);
        return { slug, make };
      });
    return { id, slug, release, config, game_id, make, seated, seats };
  }, $.pipe($.map(_.selectKeys(_, ["id", "release", "config", "game_id"]), $table), _.filter(_.isSome)), $seated, $seats), _.filter(_.isSome));
  const $undoable = $.map(function({undoables, cursor}){
    const {at} = cursor;
    return _.maybe(at, at => undoThru(undoables, at));
  }, $timeline);
  const $perspective = $.map(r.perspective, $timeline);
  const $tl = $.map(_.merge, $timeline, $.pipe($perspective, _.map(_.assoc(null, "perspective", _))));
  const $inner = $.pipe($.map(function(error, seated, seats, up, undoable, setting, wip, timeline){
    return $.doto({...setting, ...timeline, error, seated, seats, up, undoable, wip}, fetchPerspectives);
  }, $error, $seated, $seats, $up, $undoable, $setting, $wip, $tl), _.filter(_.isSome));
  const $base = $.map(function(state){
    const {cursor} = state;
    const resolved = isResolved(state);
    return {...state, resolved};
  }, $inner);

  const $act = $.map(function(ready, started, {perspective, cursor: {present}, resolved}){
    return ready && resolved && present && started && perspective?.actionable;
  }, $ready, $started, $base);

  const $feed = $.pipe($base, _.filter(_.and(_.isSome, function({resolved, cursor}){
    return resolved || !cursor.at;
  })), _.map(_.pipe(
    _.dissoc(_, "perspectives"),
    _.dissoc(_, "touches"),
    _.dissoc(_, "undoables"))));

  const $timer = timer(1000);

  seat === null || $.sub($seats, _.filter(_.isSome), _.once(function(seats){
    if (!_.includes(seats, seat)) {
      throw new Error(`You are not authorized for seat ${seat}.`);
    }
  }));

  $.sub($timer, function(){
    const {cursor: {pos, max, present}} = _.deref($timeline);
    if (pos !== null) {
      if (present) {
        $timer.stop();
      } else {
        $.swap($timeline, r.forward);
      }
    }
  });

  $.sub($touch, function(touch){
    const {cursor} = _.deref($timeline);
    const {present} = cursor || {};
    _.fmap(wb.request("getTouches", tableId, accessToken),
      _.pipe(r.addTouches, $.swap($timeline, _)),
      present ? () => $timer.start() : _.noop); //if already in the present when the game is touched, catch things up.
  });

  function fetchPerspectives({make, seat, seated, config, cursor, cursor: {pos, at, direction, max}, touches, perspectives}){
    const nextAt = _.maybe(pos + direction, _.clamp(_, 0, max), _.get(touches, _));
    const player = seat;
    const seatId = _.getIn(seated, [seat, "seat_id"]);
    _.chain([at, nextAt], _.compact, _.unique, _.remove(_.get(perspectives, _), _), _.seq, $.each(function(at){
      _.fmap(wb.request("getPerspective", tableId, at, seat, seatId, accessToken), function(perspective){
        const {up, may, event, event: {seat}, state} = perspective;
        const actionable = _.includes(up, player) || _.includes(may, player);
        const game = make(seated, config, [event], state);
        const actor = _.get(seated, seat);
        $.swap($timeline, r.addPerspective(at, _.assoc(perspective, "actionable", actionable, "game", game, "actor", actor)));
      });
    }, _));
  }

  function isResolved({cursor, perspective}){
    return !!(cursor && perspective && cursor.at && cursor.at === perspective?.event?.id);
  }

  function toGui(now, past){
    const curr = now?.perspective ?? null;
    const prior = past?.perspective ?? null;
    const frame = now;
    const motion = curr && prior && now?.cursor?.pos !== past?.cursor?.pos;
    const step = motion ? now?.cursor?.pos - past?.cursor?.pos : 0;
    const offset = now?.cursor ? now?.cursor?.pos - now?.cursor?.max : null;
    const touch = now?.cursor?.at;
    const last_acting_seat = now?.last_acting_seat;
    const seated = now?.seated;
    const seat = now?.seat; //TODO
    const undoable = now?.undoable;
    const undoer = seat === _.detectIndex(_.comp(_.eq(last_acting_seat, _), _.get(_, "seat_id")), seated);
    const player = curr?.actor;
    const game = curr?.game;
    const { cursor } = now ?? {};
    const { max, pos, present } = cursor ?? {};
    const which = now?.wip === past?.wip ? 0 : 1;
    const wip = now?.wip;
    const bwd =  now?.cursor?.direction <= 0;
    const time = {
      bwd,
      touch,
      step,
      offset,
      motion,
      present
    }
    return {wip, which, game, seat, undoable, undoer, player, time};
  }

  const $hist = $.hist($feed);
  const $diff = $.pipe($.map(function(h){
    const hist = h ?? [];
    const [curr, prior] = hist;
    const diff = _.seq(d.diff(...hist));
    const props = _.chain(diff, _.map(_.pipe(_.get(_, "path"), _.first), _), _.unique, _.compact, _.toArray);
    const gui = toGui(curr, prior);
    return {hist, diff, props, gui};
  }, $hist));
  const $updated = $.map(_.pipe(_.get(_, "diff"), _.mapa(_.get(_, "path"), _)), $diff);

  const $change = $.pipe($diff,
    _.filter(_.get(_, "diff")),
    _.filter(function({diff, props}){
      return !_.eq(props, []) && !_.eq(props, ["cursor"]) && _.reduce(function(memo, {path}){
        const [prop] = path;
        const suppress = _.eq(path, ["perspective", "game"]) || _.includes(["perspectives", "touches", "undoables", "undoable"], prop);
        return memo || !suppress;
      }, false, diff);
    }),
    _.dedupe());

  $.sub($change, _.map(({hist: [curr]}) => curr), $.reset($sink, _));
  const $state = $.map(_.identity, $sink);

  const self = new Reel($timeline, $setting, $table, $touch, $cursor, $error, $ready, $act, $up, $seated, $seats, $undoable, $state, $hist, $diff, $change, $updated, $working, $timer, $scratch, $wip, $queue, wb, accessToken);

  return self;
}

function Reel($timeline, $setting, $table, $touch, $cursor, $error, $ready, $act, $up, $seated, $seats, $undoable, $state, $hist, $diff, $change, $updated, $working, $timer, $scratch, $wip, $queue, workboard, accessToken){
  this.$timeline = $timeline;
  this.$setting = $setting;
  this.$table = $table;
  this.$touch = $touch;
  this.$cursor = $cursor;
  this.$error = $error;
  this.$ready = $ready;
  this.$act = $act;
  this.$up = $up;
  this.$seated = $seated;
  this.$seats = $seats;
  this.$undoable = $undoable;
  this.$state = $state;
  this.$hist = $hist;
  this.$diff = $diff,
  this.$change = $change;
  this.$updated = $updated;
  this.$timer = $timer;
  this.$scratch = $scratch;
  this.$working = $working;
  this.$wip = $wip;
  this.$queue = $queue;
  this.workboard = workboard;
  this.accessToken = accessToken;
}

function chan(self, key){
  return self[`$${key}`];
}

function on(self, key, callback){
  return $.sub($.chan(self, key), callback);
}

function dispatch(self, command){
  const {type, details} = command;

  //whenever direct action is taken, the timer stops
  self.$timer.stop();

  switch (type) {
    case "at":
      $.swap(self.$timeline, r.at(details.touch));
      break;

    case "backward":
    case "back":
      $.swap(self.$timeline, r.backward);
      break;

    case "forward":
      $.swap(self.$timeline, r.forward);
      break;

    case "inception":
      $.swap(self.$timeline, r.inception);
      break;

    case "present":
      $.swap(self.$timeline, r.present);
      break;

    case "last-move":
      $.swap(self.$timeline, r.toLastMove);
      break;

    case "ffwd":
      self.$timer.start();
      break;

    case "do-over": {
      const {id: _table_id, undoable: _event_id, cursor: {at}} = _.deref(self);
      if (!_event_id) return;
      _.fmap(self.workboard.request("do-over", _table_id, _event_id), function({data, error, status}) {
        error && $.reset($.chan(self, "error"), new Error(`Do over failed.`));
        console.log({status, data, error});
      });
      break;
    }

    default: {
      const {id, seat} = _.deref(self); //TODO diagnose Observable deref workaround
      _.fmap(self.workboard.request("move", id, seat, [command], self.accessToken), function({data, error, status}) {
        error && $.reset($.chan(self, "error"), new Error(`Move failed.`));
        console.log({status, data, error});
      });
      break;
    }
  }
}

function sub(self, callback){
  return $.sub(self.$state, callback);
}

function deref(self){
  return _.deref(self.$state);
}

$.doto(Reel,
  _.implement($.IEvented, {on, chan}),
  _.implement($.IDispatch, {dispatch}),
  _.implement($.ISubscribe, {sub}),
  _.implement(_.IDeref, {deref}));
