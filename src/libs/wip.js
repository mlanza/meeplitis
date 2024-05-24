import _ from "/libs/atomic_/core.js";
import $ from "/libs/atomic_/shell.js";

function WorkInProgress($data, $head, $at, $ctx, $wip){
  Object.assign(this, {$data, $head, $at, $ctx, $wip});
}

function sub(self, ...args){
  return $.sub(self.$wip, ...args);
}

function deref(self){
  const at = _.deref(self.$at);
  return _.chain(self.$data, _.deref, _.get(_, at)) || null;
}

function reset(self, value){
  const at = _.deref(self.$at);
  return $.swap(self.$data, _.assoc(_, at, value));
}

function swap(self, f){
  const at = _.deref(self.$at);
  return $.swap(self.$data, _.update(_, at, f));
}

_.doto(WorkInProgress,
  _.implement(_.IDeref, {deref}),
  _.implement($.IResettable, {reset}),
  _.implement($.ISwappable, {swap}),
  _.implement($.ISubscribe, {sub}));

export function save(self, command){
  $.reset(self, command);
}

export function clear(self){
  $.reset(self.$data, {});
}

export function wip($story){
  const $data  = $.cell({}),
        $head  = $.pipe($story, _.map(_.comp(_.last, _.get(_, "touches"))), _.filter(_.isSome)),
        $at    = $.pipe($story, _.map(function({at, touches}){
          return _.get(touches, at);
        }), _.filter(_.isSome)),
        $ctx   = $.map(function(data, head, at){
          return head == at ? _.get(data, at, {}) : null;
        }, $data, $head, $at),
        $wip   = $.hist($ctx);

  return new WorkInProgress($data, $head, $at, $ctx, $wip);
}
