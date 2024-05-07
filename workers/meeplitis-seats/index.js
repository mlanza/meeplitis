addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request).catch(
      (err) => new Response(err.stack, { status: 500 })
    )
  );
});

async function handleRequest(request) {
  switch (request.method) {
      case "OPTIONS":
          return Promise.resolve(new Response("", {
              status: 200,
              headers: {
                  "access-control-allow-origin": '*',
                  'access-control-allow-headers': 'accessToken,Apikey,Accept,Content-Type,Authorization',
                  'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
                  'access-control-max-age': '86400'
              }
          }));
          break;

      case "POST":
      case "GET":
          const accessToken = request.headers.get('accessToken');
          const url = new URL(request.url);
          const _table_id = url.searchParams.get("table_id");

          const {sub} = await fetch("https://verify.workers.meeplitis.com", {
              headers: {
                  accessToken
              }
          }).then(function(resp){
              return resp.json();
          });

          const _player_id = sub;

          console.log("url", request.url, "table", _table_id, "player_id", _player_id, "accessToken", accessToken);

          const seats = await fetch(`${SUPABASE_URL}/rest/v1/rpc/seats`, {
              method: "POST",
              body: JSON.stringify({_table_id, _player_id}),
              headers: {
                  "content-type": "application/json; charset=UTF-8",
                  "accept": 'application/json',
                  "apiKey": APIKEY,
                  "authorization": `Bearer ${APIKEY}`
              }
          }).then(function(resp){
              return resp.json();
          });

          return new Response(JSON.stringify(seats), {
              status: 200,
              headers: {
                  "cache-control": "no-cache, no-store, must-revalidate",
                  "Pragma": "no-cache",
                  "Expires": "0",
                  "Content-type": "application/json; charset=UTF-8",
                  'access-control-allow-headers': 'accessToken,Apikey,Accept,Content-Type,Authorization',
                  "Access-Control-Allow-Origin": '*',
                  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
                  'Access-Control-Max-Age': '86400'
              }
          });

  }
}
