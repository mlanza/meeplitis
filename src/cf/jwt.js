import * as jwt from "https://deno.land/x/djwt@v2.1/mod.ts";
const JWT_SECRET = "...";
const token = "...";
const verified = await jwt.verify(token, JWT_SECRET, "HS256");
console.log("verified", verified);
