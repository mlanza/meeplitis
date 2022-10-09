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
      const url = new URL(request.url);
      const _table_id = url.searchParams.get("table_id");

      console.log("url", request.url, "table", _table_id);

      const resp = await fetch(`https://${HOSTKEY}.supabase.co/rest/v1/rpc/seated`, {
        method: "POST",
        body: JSON.stringify({_table_id}),
        headers: {
          "content-type": "application/json; charset=UTF-8",
          "accept": 'application/json',
          "apiKey": APIKEY,
          "authorization": `Bearer ${APIKEY}`
        }
      }).then(function(resp){
        return resp.json();
      });

      return new Response(JSON.stringify(resp), {
        status: 200,
        headers: {
          "cache-control": "public, max-age=2500000, immutable", //about a month
          "Content-type": "application/json; charset=UTF-8",
          'access-control-allow-headers': 'accessToken,Apikey,Accept,Content-Type,Authorization',
          "Access-Control-Allow-Origin": '*',
          'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
          'Access-Control-Max-Age': '86400'
        }
      });

  }
}
