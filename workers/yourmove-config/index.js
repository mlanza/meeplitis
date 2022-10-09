addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
});

async function handleRequest(request) {
  if (request.method === "OPTIONS") {
    return Promise.resolve(new Response("", {
      status: 200,
      headers: {
        "access-control-allow-origin": '*',
        'access-control-allow-headers': 'Apikey,Accept,Content-Type,Authorization',
        'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
        'access-control-max-age': '86400',
        'cache-control': 'max-age=3600'
      }
    }));
  } else {
    return Promise.resolve(new Response(JSON.stringify({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_KEY,
      options: {
        schema: 'public',
        headers: { 'x-my-custom-header': 'yourmove' },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      }
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": '*',
        'access-control-allow-headers': 'Apikey,Accept,Content-Type,Authorization',
        'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
        'access-control-max-age': '86400',
        'cache-control': 'max-age=3600'
      }
    }));
  }
}
