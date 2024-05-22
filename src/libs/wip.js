import _ from "/libs/atomic_/core.js";
import $ from "/libs/atomic_/reactives.js";

function WorkInProgress($data, $head, $at, $ctx, $wip){
  Object.assign(this, {$data, $head, $at, $ctx, $wip});
}

function sub(self, ...args){
  return $.sub(self.$wip, ...args);
}

_.doto(WorkInProgress,
  _.implement($.ISubscribe, {sub}));

export function save(self, command){
  _.swap(self.$data, _.assoc(_, _.deref(self.$at), command));
}

export function clear(self){
  _.reset(self.$data, {});
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
