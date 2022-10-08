import lume from "lume/mod.ts";
import date from "lume/plugins/date.ts";
import relative_urls from "lume/plugins/relative_urls.ts";

function simulation(page){
  page.dest.ext = ".js"
  const named = page.src.path.replace("/","");
  const contents = page.content.split("\n").filter(function(line){
    return !line.startsWith("//") && !line.startsWith("export");
  });
  page.content = `create or replace function ${named}(_seats jsonb, _config jsonb, _events jsonb, _commands jsonb, _seen int[])
returns jsonb as $$
  ${contents.join("\n")}
return simulate1(_seats, _config || {}, _events || [], _commands || [], _seen || []);

$$ language plv8 immutable;`;

  return true;
}

export default lume({
  src: "./sim/src",
  dest: "./sim/dist",
  prettyUrls: false
})
  .loadPages([".js"])
  .process([".js"], simulation);
