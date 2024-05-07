addEventListener("fetch", (event) => {
	event.respondWith(
		handleRequest(event.request).catch(
			(err) => new Response(err.stack, {
				status: 500
			})
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

		case "PATCH":
			return await request.json().then(function (payload) {
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
			const accessToken = request.headers.get('accessToken');
			const {
				_table_id,
				_seat,
				_commands
			} = await request.json();

			const {
				sub,
				email
			} = await fetch("https://verify.workers.meeplitis.com", {
				headers: {
					accessToken
				}
			}).then(function (resp) {
				return resp.json();
			});

			console.log("sub", sub, "email", email);

			const _player_id = sub;

			const seats = await fetch(`${SUPABASE_URL}/rest/v1/rpc/seats`, {
				method: "POST",
				body: JSON.stringify({
					_player_id,
					_table_id
				}),
				headers: {
					"content-type": "application/json; charset=UTF-8",
					"accept": 'application/json',
					"apiKey": APIKEY,
					"authorization": `Bearer ${APIKEY}`
				}
			}).then(function (resp) {
				return resp.json();
			});

			if (!seats.includes(_seat)) {
				throw new Error("You are not permitted to issue a move from this seat");
			}

			console.log("seat", _seat, "of", seats);

			const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/move`, {
				method: "POST",
				body: JSON.stringify({
					_table_id,
					_seat,
					_commands
				}),
				headers: {
					"content-type": "application/json; charset=UTF-8",
					"accept": 'application/json',
					"apiKey": APIKEY,
					"authorization": `Bearer ${APIKEY}`
				}
			}).then(function (resp) {
				return resp.json();
			});
			const status = resp?.code === "XX000" ? 409 : 200;
			return new Response(JSON.stringify(resp), {
				headers: {
					"Content-type": "application/json",
					'access-control-allow-headers': 'accessToken,Apikey,Accept,Content-Type,Authorization',
					"Access-Control-Allow-Origin": '*',
					'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
					'Access-Control-Max-Age': '86400'
				},
				status
			});
	}
}
