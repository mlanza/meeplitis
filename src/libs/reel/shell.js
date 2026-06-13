import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as r from "./core.js";
import supabase from "../supabase.js";
import {timer} from "./timer.js";
import * as d from  "./diff.js";

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

function move(table_id, seat, commands, accessToken){ //TODO send access token, move should otherwise be barred
  const body = {table_id, seat, commands};
  return supabase.functions.invoke("move", {body}).then(_.get(_, "data"));
}

function undoThru(undoables, touch){
  return _.some(function([key, vals]){
    return _.includes(vals, touch) ? key : null;
  }, undoables);
}

export const path = _.pipe(_.deref, _.getIn(_, ["cursor", "at"]), _.otherwise(_, "^^^^^"), _.array);

export function ports(self){
  const {$wip, $error, $hist, $diff} = self;
  return {$wip, $error, $hist, $diff};
}

function settled(state){
  const {make, table, cursor, perspective} = state || {};
  const eventId = perspective?.event?.id;
  const {at} = cursor || {}
  return make && table && at && eventId === at;
}

export function reel(tableId, seat = null, accessToken = null){
  const $timeline = $.atom(r.init(tableId, seat));
  const $table = table(tableId);
  const $scratch = $.atom({});
  const $wip = $.cursor($scratch, function(){
    return path(self);
  });
  const $make = $.atom(null);
  const $ready = $.atom(true);
  const $error = $(null);
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
  const $undoable = $.map(function({undoables, cursor}){
    const {at} = cursor;
    return _.maybe(at, at => undoThru(undoables, at));
  }, $timeline);
  const $base = $.pipe($.map(function(table, error, seated, seats, up, undoable, scratch, make, ready, act, timeline){
    const perspective = r.perspective(timeline);
    return {...timeline, perspective, table, error, seated, seats, up, undoable, scratch, make, ready, act};
  }, $table, $error, $seated, $seats, $up, $undoable, $scratch, $.pipe($make, _.compact()), $ready, $act, $timeline), _.filter(_.and(_.get(_, "make"), _.get(_, "table"))));
  const $timer = timer(1000, Date.now);

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

  $.sub($table, function(table){
    const {cursor} = _.deref($timeline);
    const {pos, max} = cursor || {};
    const present = isPresent(pos, max);
    _.fmap(getTouches(table.id, accessToken),
      _.pipe(r.addTouches, $.swap($timeline, _)),
      present ? () => $timer.start() : _.noop); //if already in the present when the game is touched, catch things up.
  });

  //perspective caching; includes anticipated next step
  $.sub($base, function(state){
    const {table, make, seat, seated, cursor, touches, perspectives} = state;
    const {pos, at, direction, max} = cursor;
    const nextAt = _.maybe(pos + direction, _.clamp(_, 0, max), _.get(touches, _));
    const player = seat;
    const ats = _.chain([at, nextAt], _.compact, _.remove(_.get(perspectives, _), _), _.toArray);
    if (table && _.seq(ats) && make && _.seq(seated)) {
      const seatId = _.getIn(seated, [seat, "seat_id"]);
      $.each(function(at){
        _.fmap(getPerspective(table.id, at, seat, seatId, accessToken), function(perspective){
          const {up, may, event, state} = perspective;
          const {seat} = event;
          const actionable = _.includes(up, player) || _.includes(may, player);
          const game = make(seated, table.config, [event], state);
          const actor = _.get(seated, seat);
          $.swap($timeline, r.addPerspective(at, _.assoc(perspective, "actionable", actionable, "game", game, "actor", actor)));
        });
      }, ats);
    }
  });

  const $hist = $.hist($base);
  const $diff = $.map(function(hist){
    const [curr, prior] = hist ?? [];
    const diff = d.diff(curr, prior);
    return {diff, hist};
  }, $hist);

  const $state = $.pipe($diff, _.comp(_.filter(function({diff}){ //regulate visibility of internal change events to the outside world
    return _.reduce(function(memo, {path: [prop]}){
      const suppress = _.includes(["perspectives", "touches", "undoables", "cursor", "table", "undoable"], prop);
      return memo || !suppress;
    }, false, diff);
  }), _.map(function({hist: [curr]}){
    return curr;
  })));

  const self = new Reel($timeline, $table, $error, $make, $ready, $act, $up, $seated, $seats, $undoable, $state, $hist, $diff, $timer, $scratch, $wip, accessToken);
  return self;
}

function Reel($timeline, $table, $error, $make, $ready, $act, $up, $seated, $seats, $undoable, $state, $hist, $diff, $timer, $scratch, $wip, accessToken){
  this.$timeline = $timeline;
  this.$table = $table;
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
  this.$diff = $diff,
  this.$timer = $timer;
  this.$scratch = $scratch;
  this.$wip = $wip;
  this.accessToken = accessToken;
}

function chan(self, key){
  return self[`$${key}`];
}

function on(self, key, callback){
  return $.sub($.chan(self, key), callback);
}

function can(self, f){
  try {
    const ready = _.deref(self.$ready);
    const state = _.deref(self);
    const {seat} = state;
    if (seat == null || self.accessToken == null) {
      throw new Error("Spectators cannot participate");
    }
    if (!ready) {
      throw new Error("Back end still processing; please wait.");
    }
    $.reset(self.$ready, false);
    f(state);
  } finally {
    $.reset(self.$ready, true);
  }
}

function dispatch(self, command){
  const {type, details} = command;

  //whenever the user acts, the timer stops
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

    case "do-over": //TODO test
      can(self, async function({id: _table_id, undoable: _event_id, cursor: {at}}){
        if (!_event_id) return;
        console.log("do-over", {at, _table_id, _event_id});
        const {data, error, status} = await supabase.rpc('undo', {_table_id, _event_id});
        console.log({type, data, error, status});
        //TODO $.swap(self.$state, _.update(_, "history", _.pipe(_.take(at -1, _), _.toArray)));
      });
      break;

    default:
      can(self, async function({id, seat}){
        const {data, error, status} = await move(id, seat, [command], self.accessToken);
        console.log({type, data, error, status});
      });
      break;
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
