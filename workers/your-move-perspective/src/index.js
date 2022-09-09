import _ from "../../../src/lib/@atomic/core.js";
import $ from "../../../src/lib/@atomic/reactives.js";
import * as g from "../../../src/lib/game.js";
import * as oh from "../../../src/lib/ohhell.js";

function play(self){
  const card = _.first(g.moves(self, _.chain(self, _.deref, _.get(_, "up")))).details.card;
  return _.chain(self, oh.play(card));
}

function commit(self){
  return g.commit(_.chain(self, _.deref, _.get(_, "up")))(self);
}

const $state = _.chain(["Ava", "Zoe", "Jennabel", "Mario"], oh.ohHell, _.journal, $.cell);

function dispatch(...commands){
  _.each(function(command){
    _.swap($state, _.fmap(_, command));
  }, _.flatten(commands));
}
$.sub($state, function(j){
  const [curr, prior] = _.revision(j);
  const added = prior ? _.chain(curr.events, _.last(_.count(curr.events) - _.count(prior.events), _), _.toArray) : [];
  const perspectives = _.chain(curr.seated, _.mapIndexed(g.perspective(curr, _), _), _.toArray);
  _.log(added, "→", curr, perspectives);
});

export default {
	async fetch(request) {

		dispatch(
			g.start({}),
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

		return new Response(_.chain($state, _.deref, _.deref, JSON.stringify), {
			headers: {
        'content-type': 'application/json;charset=UTF-8'
			}
		});
	},
};
