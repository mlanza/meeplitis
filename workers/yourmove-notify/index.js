addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

function composes(type){
  switch(type){
    case "up:notice":
      return up;
    case "started:notice":
      return started;
    case "finished:notice":
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

function up({title, table_id, table_url, icon_url}){
  const subject = `${title} awaits your move - ${table_id}`;
  const message = `<html>
  <head>
    <title>Your Move: You're Up</title>
    <style type="text/css">
      @import url(https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&family=Racing+Sans+One&family=Viga&family=Anonymous+Pro&display=swap);
      div {
          font-family: Montserrat, Arial, Verdana;
      }
      h1 {
          font-family: "Racing Sans One", "Arial Black", Impact;
      }
    </style>
    <link href="https://fonts.googleapis.com/css?family=Montserrat&family=Racing+Sans+One&display=swap" rel="stylesheet" type='text/css'>
  </head>
  <body style='background-image: url(https://yourmove.cc/images/backgrounds/boardgames-seamless.jpg); padding: 1em;'>
      <div style='font-size: 1.2em; min-height: 12em; margin: 2em; padding: 2em; border-radius: 1em; background-color: rgba(255, 255, 255, .9);'>
          <img src="${icon_url}" height="9em" style="float: right; margin: 1em; height: 9em; border-radius: 1em; border: solid 3px white;">
          <h1 style='padding: 0; margin: 0;'>Your Move</h1>
          <p>It's your move in <strong>${title}</strong> at table <a href="${table_url}">${table_id}</a>.</p>
      </div>
  </body>
</html>
`;
  return {subject, message};
}

function started({title, table_id, table_url, icon_url}){
  const subject = `${title} started - ${table_id}`;
  const message = `<html>
  <head>
    <title>Your Move: Started</title>
    <style type="text/css">
      @import url(https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&family=Racing+Sans+One&family=Viga&family=Anonymous+Pro&display=swap);
      div {
          font-family: Montserrat, Arial, Verdana;
      }
      h1 {
          font-family: "Racing Sans One", "Arial Black", Impact;
      }
    </style>
    <link href="https://fonts.googleapis.com/css?family=Montserrat&family=Racing+Sans+One&display=swap" rel="stylesheet" type='text/css'>
  </head>
  <body style='background-image: url(https://yourmove.cc/images/backgrounds/boardgames-seamless.jpg); padding: 1em;'>
      <div style='font-size: 1.2em; min-height: 12em; margin: 2em; padding: 2em; border-radius: 1em; background-color: rgba(255, 255, 255, .9);'>
          <img src="${icon_url}" height="9em" style="float: right; margin: 1em; height: 9em; border-radius: 1em; border: solid 3px white;">
          <h1 style='padding: 0; margin: 0;'>Your Move</h1>
          <p>Your game of <strong>${title}</strong> has begun at table <a href="${table_url}">${table_id}</a>.</p>
          <p>You will be notified when it's your turn.</p>
      </div>
  </body>
</html>
`;
  return {subject, message};
}

function finished({title, table_id, url}){
  const subject = `${title} finished - ${table_id}`;
  const message = `<html>
  <head>
    <title>Your Move: Finished</title>
    <style type="text/css">
      @import url(https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&family=Racing+Sans+One&family=Viga&family=Anonymous+Pro&display=swap);
      div {
          font-family: Montserrat, Arial, Verdana;
      }
      h1 {
          font-family: "Racing Sans One", "Arial Black", Impact;
      }
    </style>
    <link href="https://fonts.googleapis.com/css?family=Montserrat&family=Racing+Sans+One&display=swap" rel="stylesheet" type='text/css'>
  </head>
  <body style='background-image: url(https://yourmove.cc/images/backgrounds/boardgames-seamless.jpg); padding: 1em;'>
      <div style='font-size: 1.2em; min-height: 12em; margin: 2em; padding: 2em; border-radius: 1em; background-color: rgba(255, 255, 255, .9);'>
          <img src="${icon_url}" height="9em" style="float: right; margin: 1em; height: 9em; border-radius: 1em; border: solid 3px white;">
          <h1 style='padding: 0; margin: 0;'>Your Move</h1>
          <p>Your game of <strong>${title}</strong> finished at table <a href="${table_url}">${table_id}</a>.</p>
      </div>
  </body>
</html>
`;
  return {subject, message};
}
