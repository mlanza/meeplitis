addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const {type, table_id, title, slug, recipients} = await request.json();
  const personalizations = recipients.map(function(recipient){
      return {to: [recipient]};
  });
  const table_url = `https://yourmove.cc/games/${slug}/table/?id=${table_id}`;
  const subject = getSubject(type, table_id, title);
  const content = type == "up:notice" ? up : (type == "started:notice" ? started : (type == "finished:notice" ? finished : null));
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
                  "value": content(table_id, table_url),
              }],
          }),
      })),
      text = await resp.text();

  return new Response(JSON.stringify({status: resp.status, statusText: resp.statusText, text, num: recipients.length}), {
      headers: { "content-type": "application/json" },
  });
}

function up(table_id, url){
  return `<html>
  <head>
    <title>Your Move: Up</title>
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
          <img src="https://yourmove.cc/images/games/ohhell.jpg" height="9em" style="float: right; margin: 1em; height: 9em; border-radius: 1em; border: solid 3px white;">
          <h1 style='padding: 0; margin: 0;'>Your Move</h1>
          <p>Your opponents await your move in <strong>Oh Hell</strong> at table <a href="${url}">${table_id}</a>.</p>
          <p>Please visit the table and take your turn.</p>
      </div>
  </body>
</html>
`;
}

function started(table_id, url){
  return `<html>
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
          <img src="https://yourmove.cc/images/games/ohhell.jpg" height="9em" style="float: right; margin: 1em; height: 9em; border-radius: 1em; border: solid 3px white;">
          <h1 style='padding: 0; margin: 0;'>Your Move</h1>
          <p>Your game of <strong>Oh Hell</strong> will begin soon at table <a href="${url}">${table_id}</a>.</p>
          <p>You will be notified when it's your turn.</p>
      </div>
  </body>
</html>
`;
}

function finished(table_id, url){
  return `<html>
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
          <img src="https://yourmove.cc/images/games/ohhell.jpg" height="9em" style="float: right; margin: 1em; height: 9em; border-radius: 1em; border: solid 3px white;">
          <h1 style='padding: 0; margin: 0;'>Your Move</h1>
          <p>Your game of <strong>Oh Hell</strong> finished at table <a href="${url}">${table_id}</a>.</p>
          <p>You might like to review the outcome.</p>
      </div>
  </body>
</html>
`;
}

function getSubject(type, table_id, title){
  const identifier = `[Your Move] ${title} '${table_id}'`;
  switch (type) {
      case "up:notice":
          return identifier + " awaits your move";
      case "started:notice":
          return identifier + " has started";
      case "finished:notice":
          return identifier + " is finished";
  }
}
