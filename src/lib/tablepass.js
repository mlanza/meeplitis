import _ from "/lib/atomic_/core.js";
import {getPerspective} from "/lib/table.js";

function TablePass(session, tableId, seat, seated, state){
  Object.assign(this, {session, tableId, seat, seated, state});
}

function assoc(self, key, value){
  return new TablePass(self.session, self.tableId, self.seat, self.seated, _.assoc(self.state, key, value));
}

function lookup(self, key){ //TODO eliminate?
  return _.get(self.state, key);
}

function deref(self){
  const {history, at} =  self.state;
  return _.nth(history, at);
}

_.doto(TablePass,
  _.implement(_.IDeref, {deref}),
  _.implement(_.IAssociative, {assoc}),
  _.implement(_.ILookup, {lookup}));

export function tablePass(session, tableId, seat, seated){
  return new TablePass(session, tableId, seat, seated, {
    touches: null,
    history: null,
    at: null
  });
}

function expand(idx){
  return function(xs){
    const more = idx + 1 - _.count(xs);
    return more > 0 ? _.chain(xs, _.concat(_, _.repeat(more, null)), _.toArray) : xs;
  }
}

export function setAt($state, _at){
  const {tableId, session, seat, state: {at, history, touches}} = _.deref($state);
  const pos = _.isNumber(_at) ? _at : _.indexOf(touches, _at);

  function loaded(offset){
    const p = pos + offset,
          touch = _.nth(touches, p),
          frame = _.nth(history, p);
    return [offset, p, touch, frame];
  }

  if (pos !== at) {
    _.chain([0, 1, -1], _.mapa(loaded, _), _.tee(_.pipe(_.first, function([offset, pos, touch, frame]){
      if (frame) {
        _.swap($state, _.assoc(_, "at", pos));
      }
    })), _.filter(function([offset, pos, touch, frame]){
      return touch && !frame;
    }, _), _.mapa(function([offset, pos, touch]){
      return _.fmap(getPerspective(tableId, session, touch, seat), _.array(pos, _));
    }, _), Promise.all.bind(Promise), _.fmap(_, function(results){
      _.swap($state, _.pipe(_.reduce(function(state, [pos, frame]){
        return _.update(state, "history", _.pipe(expand(pos), _.assoc(_, pos, frame)));
      }, _, results), _.assoc(_, "at", pos)));
    }));
  }
}
