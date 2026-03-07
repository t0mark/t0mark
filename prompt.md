#Command
``` bash
# 의존성 설치
npm install

# 뉴스 스크래핑
echo '{"lastUpdated":null,"items":[]}' > data/robotics_trends.json
npm run fetch-trends

# 공고 스크래핑
rm -f data/interns.json data/interns-filter-cache.json
node scripts/fetch-interns.js --limit=5 2>&1

# 장학생 스크래핑
rm -f data/scholarships.json data/scholarships-filter-cache.json
npm run fetch-scholarships

# 서버 시작
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