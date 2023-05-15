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
return simulate1(_payload);

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
