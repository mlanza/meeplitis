addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request).catch(
      (err) => new Response(err.stack, { status: 500 })
    )
  );
});

//perspective
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

      case "PATCH":
          return await request.json().then(function(payload){
              console.log("payload", payload)
              return new Response("", {
                  status: 201,
                  headers: {
                      "access-control-allow-origin": '*',
                      'access-control-allow-headers': 'accessToken,Apikey,Accept,Content-Type,Authorization',
                      'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
                      'access-control-max-age': '86400'
                  }
              })
          });
          break;

      case "POST":
      case "GET":
          const accessToken = request.headers.get('accessToken');
          const url = new URL(request.url);
          const _table_id = url.searchParams.get("table_id"),
                _event_id = url.searchParams.get("event_id"),
                _seat = url.searchParams.get('seat'),
                _commands = [];
          let seat = null;

          console.log("url", request.url, "table", _table_id, "event_id", _event_id, "accessToken", accessToken);

          if (accessToken) {
              const {sub, email} = await fetch("https://yourmove-verify.mlanza.workers.dev", {
                  headers: {
                      accessToken
                  }
              }).then(function(resp){
                  return resp.json();
              });

              console.log("sub", sub, "email", email);

              const _player_id = sub;

              let seat = await fetch(`https://${HOSTKEY}.supabase.co/rest/v1/rpc/seat`, {
                  method: "POST",
                  body: JSON.stringify({_player_id, _table_id}),
                  headers: {
                      "content-type": "application/json; charset=UTF-8",
                      "accept": 'application/json',
                      "apiKey": APIKEY,
                      "authorization": `Bearer ${APIKEY}`
                  }
              }).then(function(resp){
                  return resp.json();
              });

              console.log("seat", _seat);

              if (seat != _seat) {
                  throw new Error("You are not permitted to see the game from this seat");
              }
          }

          const resp = await fetch(`https://${HOSTKEY}.supabase.co/rest/v1/rpc/simulate`, {
              method: "POST",
              body: JSON.stringify(_event_id ? {_table_id, _event_id, _commands, _seat} : {_table_id, _commands, _seat}),
              headers: {
                  "content-type": "application/json; charset=UTF-8",
                  "accept": 'application/json',
                  "apiKey": APIKEY,
                  "authorization": `Bearer ${APIKEY}`
              }
          }).then(function(resp){
              return resp.json();
          });

          const cc = seat == null ? "public" : "private";

          return new Response(JSON.stringify(resp), {
              status: 200,
              headers: {
                  "cache-control": `${cc}, max-age=2500000, immutable`, //about a month
                  "Content-type": "application/json; charset=UTF-8",
                  'access-control-allow-headers': 'accessToken,Apikey,Accept,Content-Type,Authorization',
                  "Access-Control-Allow-Origin": '*',
                  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
                  'Access-Control-Max-Age': '86400'
              }
          });

  }
}
