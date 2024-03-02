addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
});

function joined(names){
  const copy = [...names].map(name => `<em>${name}</em>`);
  const last = copy.pop();
  return copy.length > 0 ? `${copy.join(', ')} and ${last}` : last;
}

function template(subject, body){
  const message = `<!DOCTYPE html>
  <html>
  <head>
    <title>Your Move</title>
    <style type="text/css">
      @import url(https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&family=Racing+Sans+One&family=Viga&family=Anonymous+Pro&display=swap);
      h1 {
        font-style: italic;
        font-family: "Racing Sans One", "Arial Black", Impact;
      }
      table {
        margin: .5em 0;
        font-family: monospace;
        border-collapse: collapse;
      }
      th {
        font-weight: 500;
        text-decoration: underline;
      }
      th, td {
        padding: .25em 1em;
      }
      p {
        font-size: 1.2em;
        font-family: Montserrat, Arial, Verdana;
      }
      img {
        margin: 1em;
        height: 9em;
        border-radius: 1em;
        border: solid 3px gray;
      }
    </style>
    <link href="https://fonts.googleapis.com/css?family=Montserrat&family=Racing+Sans+One&display=swap" rel="stylesheet" type='text/css'>
  </head>
  ${body}
</html>`;
  return {subject, message};
}

function up({title, table_id, table_url, icon_url, recipients}){
  const seated = joined(recipients.map(r => r.name));
  return template(`${title} awaits your move - ${table_id}`, `
  <body>
    <h1>Your Move</h1>
    <p>It's your move in <strong>${title}</strong> involving ${seated} at table <a href="${table_url}">${table_id}</a>.</p>
    <img src="${icon_url}">
  </body>
`);
}

function started({title, table_id, table_url, icon_url, recipients}){
  const seated = joined(recipients.map(r => r.name));
  return template(`${title} started - ${table_id}`, `
  <body>
    <h1>Your Move</h1>
    <p><strong>${title}</strong> has begun at table <a href="${table_url}">${table_id}</a> involving ${seated}.  You will be notified when it's your turn.</p>
    <img src="${icon_url}">
  </body>
`);
}

function finished({title, table_id, table_url, icon_url, recipients, outcome}){
  const seated = joined(recipients.map(r => r.name));
  const ranked = outcome.sort(function(a, b){
    return a.place - b.place;
  }).map(function({place, username, brief}){
    return `<tr><td>${place}</td><td>${username}</td><td>${brief}</td></tr>`;
  }).join('')
  return template(`${title} finished - ${table_id}`, `
  <body>
    <h1>Your Move</h1>
    <p>The game of <strong>${title}</strong> involving ${seated} finished at table <a href="${table_url}">${table_id}</a>.</p>
    <img src="${icon_url}">
    <table>
      <thead><tr><th>Rank</th><th>Player</th><th>Score</th></tr></thead>
      <tbody>${ranked}</tbody>
    </table>
  </body>
`);
}

function composes(type){
  switch(type){
    case "up":
      return up;
    case "started":
      return started;
    case "finished":
      return finished;
    default:
      throw new Error(`Unknown message type ${type}`);
  }
}

async function handleRequest(request) {
  const details = await request.json();
  const {type, table_id, title, slug, recipients} = details;
  const personalizations = recipients.map(function(recipient){
      return {to: [recipient]};
  });
  const compose = composes(type);
  const table_url = `https://yourmove.cc/games/${slug}/table/?id=${table_id}`,
        icon_url  = `https://yourmove.cc/images/games/${slug}.png`,
        {subject, message} = compose(Object.assign({table_url, icon_url}, details));
  const resp = await fetch(new Request("https://api.mailchannels.net/tx/v1/send", {
          "method": "POST",
          "headers": {
            "content-type": "application/json",
          },
          "body": JSON.stringify({
            "from": {
              "email": "donotreply@yourmove.cc",
              "name": "Your Move",
            },
            subject,
            personalizations,
            "content": [{
              "type": "text/html",
              "value": message,
            }],
          }),
        })),
        text = await resp.text();

  return new Response(JSON.stringify({status: resp.status, statusText: resp.statusText, text, num: recipients.length}), {
    headers: { "content-type": "application/json" },
  });
}
