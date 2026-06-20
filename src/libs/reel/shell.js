import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as r from "./core.js";
import supabase from "../supabase.js";
import { timer } from "./timer.js";
import { Workboard } from "./workboard.js";

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

export function isPresent(pos, max){
  return _.isNumber(pos) && max === pos;
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
  const $scratch = $.atom({});
  const $wip = $.cursor($scratch, function(){
    return path(self);
  });
  const $make = $.atom(null);
  const $error = $.atom(null);
  const $queue = $.atom({});
  const $ready = $.map(isReady, $queue);
  const $working = $.map(isWorking, $queue);

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

  const $act = $.map(function(timeline, table, ready){
    if (!table || !ready) return false;
    const {cursor, perspectives} = timeline;
    const {at, pos, max} = cursor;
    const {status} = table;
    const started = status === "started";
    const present = isPresent(pos, max);
    const perspective = _.maybe(at, _.get(perspectives, _));
    if (!perspective) return false;
    const {actionable} = perspective;
    return present && actionable && ready && started;
  }, $timeline, $table, $ready);
  const $up = $.map(_.pipe(_.get(_, "up"), _.includes(_, seat)), $table);
  const $seated = $.fromPromise(getSeated(tableId, accessToken));   //seated is everyone's info.
  const $seats = $.fromPromise(getSeats(tableId, accessToken)); //seats answers which seats are yours? (1 seat per player, except at dummy tables)
  const $fundamentals = $.pipe($.then(async function(table, seated, seats){
    const { id, release, game_id } = table;
    const { slug, make } = await supabase
      .from('games')
      .select('slug')
      .eq('id', table.game_id)
      .then(_.getIn(_, ["data", 0]))
      .then(async function({slug}){
        const url = `../../games/${slug}/table/${table.release}/core.js`;
        const { make } = await import(url);
        return { slug, make };
      });
    return { id, slug, release, game_id, make, seated, seats };
  }, $table, $seated, $seats), _.filter(_.isSome));

  const $undoable = $.map(function({undoables, cursor}){
    const {at} = cursor;
    return _.maybe(at, at => undoThru(undoables, at));
  }, $timeline);
  const $base = $.pipe($.map(function(table, error, seated, seats, up, undoable, scratch, make, ready, act, timeline){
    const perspective = r.perspective(timeline);
    return {...timeline, perspective, table, error, seated, seats, up, undoable, scratch, make, ready, act};
  }, $table, $error, $seated, $seats, $up, $undoable, $scratch, $.pipe($make, _.compact()), $ready, $act, $timeline), _.filter(_.and(_.getIn(_, ["cursor", "at"]), _.get(_, "make"), _.get(_, "table"))));
  const $timer = timer(1000);

  seat === null || $.sub($seats, _.filter(_.isSome), _.once(function(seats){
    if (!_.includes(seats, seat)) {
      throw new Error(`You are not authorized for seat ${seat}.`);
    }
  }));

  $.sub($timer, function(){
    const {cursor: {pos, max}} = _.deref($timeline);
    if (pos !== null) {
      const present = isPresent(pos, max);
      if (present) {
        $timer.stop();
      } else {
        $.swap($timeline, r.forward);
      }
    }
  });

  $.sub($table, _.once(function(table){
    supabase
      .from('games')
      .select('slug')
      .eq('id', table.game_id)
      .then(_.getIn(_, ["data", 0]))
      .then(function({slug}){
        const url = `../../games/${slug}/table/${table.release}/core.js`;
        _.fmap(import(url), ({make}) => $.reset($make, make));
      })
  }));

  $.sub($touch, function(touch){
    const {cursor} = _.deref($timeline);
    const {pos, max} = cursor || {};
    const present = isPresent(pos, max);
    _.fmap(wb.request("getTouches", tableId, accessToken),
      _.pipe(r.addTouches, $.swap($timeline, _)),
      present ? () => $timer.start() : _.noop); //if already in the present when the game is touched, catch things up.
  });

  const $hist = $.hist($base);

  //perspective caching anticipates next step
  $.sub($hist, _.filter(_.isSome), function([curr, prior]){
    const {table, make, seat, seated, cursor, cursor: {pos, at, direction, max}, touches, perspectives} = curr;
    if (!table || !make || !_.seq(seated) || at === prior?.cursor?.at) return;
    const nextAt = _.maybe(pos + direction, _.clamp(_, 0, max), _.get(touches, _));
    const player = seat;
    const seatId = _.getIn(seated, [seat, "seat_id"]);
    _.chain([at, nextAt], _.compact, _.unique, _.remove(_.get(perspectives, _), _), _.seq, $.each(function(at){
      _.fmap(wb.request("getPerspective", tableId, at, seat, seatId, accessToken), function(perspective){
        const {up, may, event, event: {seat}, state} = perspective;
        const actionable = _.includes(up, player) || _.includes(may, player);
        const game = make(seated, table.config, [event], state);
        const actor = _.get(seated, seat);
        $.swap($timeline, r.addPerspective(at, _.assoc(perspective, "actionable", actionable, "game", game, "actor", actor)));
      });
    }, _));
  });

  const $state = $.pipe($hist, _.comp(_.filter(_.isSome), _.filter(function([curr, prior]){
    return curr.perspectives !== prior?.perspectives
      || curr.touches !== prior?.touches
      || curr.undoables !== prior?.undoables
      || curr.undoable !== prior?.undoable
      || curr.cursor !== prior?.cursor
      || curr.table !== prior?.table
      || curr.working !== prior?.working;
  }), _.map(([curr]) => curr)));

  const self = new Reel($timeline, $fundamentals, $table, $touch, $cursor, $error, $make, $ready, $act, $up, $seated, $seats, $undoable, $state, $hist, $working, $timer, $scratch, $wip, $queue, wb, accessToken);

  $.sub($state, function(state){ //TODO fix this workaround
    self.state = state; //keep the latest
  });

  return self;
}

function Reel($timeline, $fundamentals, $table, $touch, $cursor, $error, $make, $ready, $act, $up, $seated, $seats, $undoable, $state, $hist, $working, $timer, $scratch, $wip, $queue, workboard, accessToken){
  this.$timeline = $timeline;
  this.$fundamentals = $fundamentals;
  this.$table = $table;
  this.$touch = $touch;
  this.$cursor = $cursor;
  this.$error = $error;
  this.$make = $make;
  this.$ready = $ready;
  this.$act = $act;
  this.$up = $up;
  this.$seated = $seated;
  this.$seats = $seats;
  this.$undoable = $undoable;
  this.$state = $state;
  this.$hist = $hist;
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
  return self.state;
}

$.doto(Reel,
  _.implement($.IEvented, {on, chan}),
  _.implement($.IDispatch, {dispatch}),
  _.implement($.ISubscribe, {sub}),
  _.implement(_.IDeref, {deref}));
