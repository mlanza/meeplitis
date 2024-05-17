import $ from "/libs/atomic_/reactives.js";

function queryToggle(key, value){
  const params = new URLSearchParams(document.location.search);
  if (params.get(key) == value) {
    params.delete(key);
  } else {
    params.set(key, value);
  }
  location.href = `${location.origin}${location.pathname}?${params.toString()}${location.hash}`;
}

$.on(document, "keydown", function(e){
  if (e.metaKey && e.key == "d") {
    e.preventDefault();
    queryToggle("listed", "dummy");
  }
});
