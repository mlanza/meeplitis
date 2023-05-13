# Notes

http://localhost:8080/debug/?id=bIQdLcjcTxK&options=nomonitor,local
http://localhost:8080/debug/?id=bIQdLcjcTxK&options=nomonitor&cut=223

```sh
flyctl deploy
flyctl open
deno run --allow-all ./main.ts -p 8090
time curl -i --location --request POST 'https://yourmove.fly.dev/mind/mexica' --header 'Content-Type: application/json' --data '@payload/sim.json'
```
