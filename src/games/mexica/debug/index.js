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
    {rank: 13, at: null},
    {rank: 11, at: null},
    {rank: 9, at: null},
    {rank: 6, at: null},
    {rank: 5, at: null},
    {rank: 4, at: null},
    {rank: 4, at: null},
    {rank: 3, at: null}
  ],[
    {rank: 12, at: null},
    {rank: 10, at: null},
    {rank: 8, at: null},
    {rank: 7, at: null},
    {rank: 6, at: null},
    {rank: 5, at: null},
    {rank: 3, at: null}
  ]
];

const $game = $.cell(mexica(_.repeat(4, {}), {dealCapulli: _.constantly(capulli)}));

$.sub($.hist($game), t.map(monitor ? g.summarize : _.identity), _.log);

const commands = [
  {type: "start"},
  {type: "place-pilli", details: {at: "I7"}, seat: 0},
  {type: "commit", seat: 0},
  {type: "place-pilli", details: {at: "I9"}, seat: 1},
  {type: "commit", seat: 1},
  {type: "place-pilli", details: {at: "H8"}, seat: 2},
  {type: "commit", seat: 2},
  {type: "place-pilli", details: {at: "J8"}, seat: 3},
  {type: "commit", seat: 3},
  {type: "bank", seat: 0},
  {type: "bank", seat: 0},
  {type: "build-temple", details: {level: 4, at: "L8"}, seat: 0},
  {type: "commit", seat: 0},
  {type: "construct-canal", details: {at: ["J2","J3"]}, seat: 1},
  {type: "construct-canal", details: {at: ["J4","J5"]}, seat: 1},
  {type: "construct-canal", details: {at: ["J6","J7"]}, seat: 1},
  {type: "construct-canal", details: {at: ["I6","H6"]}, seat: 1},
  {type: "construct-canal", details: {at: ["F6","G6"]}, seat: 1},
  {type: "construct-canal", details: {at: ["D6","E6"]}, seat: 1},
  {type: "commit", seat: 1},
  {type: "construct-canal", details: {at: ["C6"]}, seat: 2},
  {type: "construct-bridge", details: {at: "P8"}, seat: 2},
  {type: "construct-bridge", details: {at: "P9"}, seat: 2},
  {type: "construct-bridge", details: {at: "I6"}, seat: 2},
  {type: "bank", seat: 2},
  {type: "bank", seat: 2},
  {type: "commit", seat: 2},
  {type: "construct-canal", details: {at: ["P6"]}, seat: 3},
  {type: "construct-bridge", details: {at: "P6"}, seat: 3},
  {type: "construct-bridge", details: {at: "C10"}, seat: 3},
  {type: "move", details: {by: "foot", from: "J8", to: "K8"}, seat: 3},
  {type: "bank", seat: 3},
  {type: "bank", seat: 3},
  {type: "commit", seat: 3},
  {type: "move", details: {by: "foot", from: "I7", to: "I6"}, seat: 0}
];

g.batch($game, g.run, commands);

_.log($game)

Object.assign(window, {$game});
