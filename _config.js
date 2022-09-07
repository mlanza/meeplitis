import lume from "lume/mod.ts";
import date from "lume/plugins/date.ts";
import relative_urls from "lume/plugins/relative_urls.ts";

const site = lume({
  location: new URL("https://yourmove.cc"),
  prettyUrls: true,
  src: "./src",
  dest: "./public"
});

site
  .ignore("README.md")
  .copy("favicon.ico")
  .copy("index.css")
  .copy("lib")
  .copy("data")
  .copy("images")
  .copy("signin")
  .copy("testing")
  .use(date())
  .use(relative_urls());

export default site;
