import * as c from "./core.js";
import _ from "../../lib/atomic_/core.js";

function styled(styles){
  return _.pipe(
    _.join(", \n", _),
    _.str(_, " {", _.rtrim(styles), "\n}\n"));
}

function style(spots, f, style){
  _.chain(spots,
    _.map(f, _),
    styled(style),
    _.log);
}

style(c.viableSpots, spot => `#table.act:not([data-command-type])[data-found-at~='${spot}'] div[data-spot='${spot}']:hover div.propose`, `
  background-image: url(./images/capulli.png);
`);
style(c.viableSpots, spot => `#table.act[data-command-type='move'][data-command-from][data-command-destinations~='${spot}'] div[data-spot='${spot}']:hover div.propose`, `
  background-image: url(./images/pilli.svg);
  animation: flare 1s infinite;
`);
style(c.viableSpots, spot => `#table.act[data-command-type='move'][data-command-from][data-command-to~='${spot}'] div[data-spot='${spot}']:hover div.propose`, `
  background-image: url(./images/pilli.svg);
  animation: none;
`);
style(c.viableSpots, spot => `#table.act[data-command-type='move'][data-command-from='${spot}'] div[data-spot='${spot}'] svg[data-piece='pilli']`, `
  animation: heartbeat 1s infinite;
`);
style(c.viableSpots, spot => `#table.act[data-command-type='relocate-bridge'][data-command-from='${spot}'] div[data-spot='${spot}'] img[data-piece='bridge']`, `
  animation: heartbeat 1s infinite;
`);
style(c.viableSpots, spot => `#table.act[data-command-type='construct-canal'][data-command-at~='${spot}'] div[data-spot='${spot}'] div.propose`, `
  visibility: visible;
  background-image: url(./images/spot.svg);
`);
style(c.viableSpots, spot => `#table.act[data-command-horizontal-spots~='${spot}'] div[data-spot='${spot}'] div.propose`, `
  background-image: url(./images/bridge.svg);
`);
style(c.viableSpots, spot => `#table.act[data-command-vertical-spots~='${spot}'] div[data-spot='${spot}'] div.propose`, `
  background-image: url(./images/bridge.svg);
  rotate: 90deg;
`);
style(c.viableSpots, spot => `#table.act:not([data-command-type]):is([data-pilli-at='${spot}'],[data-bridges-at~='${spot}']) div[data-spot='${spot}']:hover div.propose`, `
  cursor: pointer;
`);
