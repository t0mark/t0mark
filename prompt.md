#Command
``` bash
npm install

echo '{"lastUpdated":null,"items":[]}' > data/robotics_trends.json
npm run fetch-trends
npm run dev
```

#Server
```bash
# server 종료
ps -ef | grep node
pkill -9 {pid}
pkill -9 node

nohup npm run dev -- -H 0.0.0.0 -p 5000
```