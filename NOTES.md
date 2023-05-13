# Notes

http://localhost:8080/debug/?id=bIQdLcjcTxK&options=nomonitor,local
http://localhost:8080/debug/?id=bIQdLcjcTxK&options=nomonitor&cut=223

```sh
flyctl deploy ./fly
flyctl open ./fly
docker build -t game-mind .
docker run -p 8080:8080 game-mind
deno run --allow-all ./main.ts -p 8080
time curl -i --location --request POST 'https://yourmove.fly.dev/mind/mexica' --header 'Content-Type: application/json' --data '@payload/sim.json'
```
