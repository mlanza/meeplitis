import lume from "lume/mod.ts";
import date from "lume/plugins/date.ts";
import relative_urls from "lume/plugins/relative_urls.ts";

export default lume({
  location: new URL("https://yourmove.cc"),
  prettyUrls: true,
  src: "./src",
  dest: "./public",
  server: {
    port: 8080
  }
})
  .ignore("README.md")
  .ignore("db")
  .ignore("cf")
  .copy([".ico", ".js", ".css", ".jpg", ".png", ".webp"])
  .use(date())
  .use(relative_urls());
