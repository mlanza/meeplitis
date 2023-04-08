import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import g from "/lib/game_.js";
import mexica, {districts, waterways, boats} from "../core.js";

const params = new URLSearchParams(document.location.search),
      split  = params.get('split') || null,
      options = params.get('options')?.split(',') || [],
      monitor = !_.includes(options, "nomonitor");

const capulli = [
  [
    {size: 13, at: null},
    {size: 11, at: null},
    {size: 9, at: null},
    {size: 6, at: null},
    {size: 5, at: null},
    {size: 4, at: null},
    {size: 4, at: null},
    {size: 3, at: null}
  ],[
    {size: 12, at: null},
    {size: 10, at: null},
    {size: 8, at: null},
    {size: 7, at: null},
    {size: 6, at: null},
    {size: 5, at: null},
    {size: 3, at: null}
  ]
];

const $game = $.cell(mexica(_.repeat(4, {}), {dealCapulli: _.constantly(capulli)}));

$.sub($.hist($game), t.map(monitor ? g.summarize : _.identity), _.log);

const commands = [
  {type: "start"},
  {type: "place-pilli", details: {at: "H6"}, seat: 0},
  {type: "commit", seat: 0},
  {type: "place-pilli", details: {at: "H8"}, seat: 1},
  {type: "commit", seat: 1},
  {type: "place-pilli", details: {at: "G7"}, seat: 2},
  {type: "commit", seat: 2},
  {type: "place-pilli", details: {at: "I7"}, seat: 3},
  {type: "commit", seat: 3},
  {type: "bank", seat: 0},
  {type: "bank", seat: 0},
  {type: "build-temple", details: {level: 4, at: "K7"}, seat: 0},
  {type: "commit", seat: 0},
  {type: "construct-canal", details: {at: ["I1","I2"]}, seat: 1},
  {type: "construct-canal", details: {at: ["I3","I4"]}, seat: 1},
  {type: "construct-canal", details: {at: ["I5","I6"]}, seat: 1},
  {type: "construct-canal", details: {at: ["H5","G5"]}, seat: 1},
  {type: "construct-canal", details: {at: ["E5","F5"]}, seat: 1},
  {type: "construct-canal", details: {at: ["C5","D5"]}, seat: 1},
  {type: "commit", seat: 1},
  {type: "construct-canal", details: {at: ["B5"]}, seat: 2},
  {type: "construct-bridge", details: {at: "O7"}, seat: 2},
  {type: "construct-bridge", details: {at: "O8"}, seat: 2},
  {type: "construct-canal", details: {at: ["O5"]}, seat: 2},
  {type: "bank", seat: 2},
  {type: "bank", seat: 2},
  {type: "commit", seat: 2},
  {type: "construct-bridge", details: {at: "O5"}, seat: 3},
  {type: "construct-bridge", details: {at: "B9"}, seat: 3},
  {type: "move", details: {by: "foot", from: "I7", to: "J7"}, seat: 3},
  {type: "bank", seat: 3},
  {type: "bank", seat: 3},
  {type: "commit", seat: 3},
  {type: "move", details: {by: "foot", from: "H6", to: "G6"}, seat: 0}
];

g.batch($game, g.run, commands);

_.log($game)

Object.assign(window, {$game});
