import lume from "lume/mod.ts";
import "https://cdn.jsdelivr.net/npm/terser/dist/bundle.min.js";

async function maxify(code){
  return {code};
}

const minify = globalThis.Terser.minify;

async function simulation(pages){
  const opts = {
    module: true,
    compress: true,
    mangle: false
  }
  for (const page of pages) {
    let content = page.content.replace("<!DOCTYPE html>","");
    let output = (await minify(content, opts)).code.replace("export{simulate};","");
    page.data.filename = page.src.path + page.src.ext;
    page.data.url = page.data.filename;
    const named = page.data.url.replace("/","").replace(".js","");
    page.content =
`create or replace function ${named}(_payload jsonb) returns jsonb as
$$
${output}
return simulate(_payload);
$$ language plv8 immutable;`;
  }
  return true;
}

export default lume({
  src: "./sim/bundle",
  dest: "./sim/dist",
  prettyUrls: false
})
  .loadPages([".js"])
  .process([".js"], simulation);
