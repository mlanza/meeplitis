import lume from "lume/mod.ts";
import terser from "lume/plugins/terser.ts";

function simulation(page){
  page.dest.ext = ".js"
  const named = page.src.path.replace("/","");
  const contents = page.content.split("\n").filter(function(line){
    return !line.startsWith("//") && !line.startsWith("export");
  }).join("\n").replace("export{simulate1 as simulate};", "");

  page.content = `create or replace function ${named}(_payload jsonb)
returns jsonb as $$
  const simulate1 = (function(){
    ${contents}
    return simulate1;
  })();
  const seats = _payload.seats,
        config = _payload.config || {},
        events = _payload.events || [],
        commands = _payload.commands || [],
        seen = _payload.seen || [],
        snapshot = _payload.snapshot || null;
return simulate1(seats, config, events, commands, seen, snapshot);

$$ language plv8 immutable;`;

  return true;
}

export default lume({
  src: "./sim/src",
  dest: "./sim/dist",
  prettyUrls: false
}).
  use(terser({
    options: {
      module: false
    }
  }))
  .loadPages([".js"])
  .process([".js"], simulation);
