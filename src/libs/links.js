export function keeping(...keys){
  return function(url, override = {}, _hash = location.hash){
    const hash = (_hash ? _hash.includes("#") ? _hash : `#${_hash}` : null) || "";
    const params = new URLSearchParams(location.search);
    for (let key of params.keys()) {
      if (keys.length > 0 && !keys.includes(key)) {
        params.delete(key);
      }
    }
    for (let [key, value] of Object.entries(override)) {
      if (value == null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    return `${url}?${params}${hash}`;
  }
}

export const relink = keeping("id", "listed", "monitor");

export function toggleHost(host, localhost = "http://localhost:8080"){
  const origin = location.origin == localhost ? host : localhost;
  return relink(`${origin}${location.pathname}`);
}
