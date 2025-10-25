export function pipeP(...fns) {
  return function(input) { //returns a Response if found; otherwise it continues
    return fns.reduce(function(p, fn) {
      return p.then(function(x) {
        const done = x instanceof Response;
        if (!done) {
          console.log(x);
        }
        return done ? x : fn(x);
      });
    }, Promise.resolve(input));
  }
}

function normalizeError(e){
  if (!e) return { message: "Unknown error" };
  if (typeof e === "string") return { message: e };
  const { name, message, stack } = e;
  return { name, message, stack };
}

export function fail(ex, stage, status = 500){
  const error = normalizeError(ex);
  return new Response(JSON.stringify({ error, stage }), { headers, status });
}

export function succeed(payload, status = 200){
  return new Response(JSON.stringify(payload), { headers, status });
}

export function handlePipe(pipeline){
  return function(req){
    return pipeline(req.json()).catch(ex => fail(ex, "pipeline"));
  }
}

export const headers = { "Content-Type": "application/json" };

