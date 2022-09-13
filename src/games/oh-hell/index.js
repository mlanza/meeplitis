import _ from "/lib/@atomic/core.js";
import $ from "/lib/@atomic/reactives.js";
import * as g from "/lib/game.js";
import * as oh from "./lib/index.js";

const game = oh.ohHell([{
  username: "brielle",
  id: "8cb76dc4-4338-42d4-a324-b61fcb889bd1"
}, {
  username: "jazz",
  id: "4c2e10da-a868-4098-aa0d-030644b4e4d7"
}, {
  username: "todd",
  id: "c8619345-0c1a-44c4-bdfe-e6e1de11c6bd"
}, {
  username: "mario",
  id: "5e6b12f5-f24c-4fd3-8812-f537778dc5c2"
}], {});

function play(self){
  const card = _.first(g.moves(self, _.chain(self, _.deref, _.get(_, "up")))).details.card;
  return _.chain(self, oh.play(card));
}

function commit(self){
  return g.commit(_.chain(self, _.deref, _.get(_, "up")))(self);
}

function record($state, ...fs){
  _.each(_.swap($state, _), fs);
  return _.chain($state, _.deref, _.get(_, "events"), function(events){
    return JSON.stringify(events, null, "  ");
  });
}

function simulate(game){
  return record($.cell(game),
    g.start,
    oh.bid(0, 1), oh.bid(1, 0), oh.bid(2, 0), oh.bid(3, 1),
    play, g.undo(0), g.redo(0), commit,
    play, commit,
    play, commit,
    play, commit,
    oh.bid(0, 1), oh.bid(1, 0), oh.bid(2, 0), oh.bid(3, 1),
    play, commit,
    play, commit,
    play, commit,
    play, commit,
    play, commit,
    play, commit,
    play, commit,
    play, commit,
    oh.bid(0, 1), oh.bid(1, 0), oh.bid(2, 0), oh.bid(3, 1),
    play, commit,
    play, commit,
    play, commit,
    play, commit);
}

// _.chain(game, simulate, _.log);

fetch("./data/events.json").
  then(function(resp){
    return resp.json();
  }).
  then(_.butlast).
  then(g.aggregate(game, _, g.inspect)).
  then(_.invoke(_, [{type: "finish"}], null)). //no new commands
  then(_.see("aggregate"));

//Object.assign(window, {_, oh, g});
