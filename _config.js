import lume from "lume/mod.ts";
import date from "lume/plugins/date.ts";
import relative_urls from "lume/plugins/relative_urls.ts";
import nunjucks from "lume/plugins/nunjucks.ts";

export default lume({
  location: new URL("https://meeplitis.com"),
  prettyUrls: true,
  src: "./src",
  dest: "./public",
  server: {
    port: 8080
  }
})
  .ignore("README.md")
  .ignore("cf")
  .copy([".html", ".css", ".js", ".pdf", ".gif", ".jpg", ".png", ".webp", ".ico", ".svg", ".json"])
  .use(nunjucks())
  .use(date())
  .use(relative_urls());
