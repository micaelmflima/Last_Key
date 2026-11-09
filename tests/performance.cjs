// CPU-side render/path benchmark; not an end-to-end FPS measurement.
const {chromium}=require('playwright');const fs=require('fs');
const {spawn}=require('node:child_process'); const {once}=require('node:events');
(async()=>{const server=spawn(process.execPath,['server.js'],{cwd:require('node:path').resolve(__dirname,'..'),env:{...process.env,PORT:'10004'}});
let browser;try{await once(server.stdout,'data');browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:1280,height:800}});if(process.env.BASELINE_HTML) await p.route('http://127.0.0.1:10004/',route=>route.fulfill({contentType:'text/html',body:fs.readFileSync(process.env.BASELINE_HTML,'utf8')}));
await p.goto('http://127.0.0.1:10004');await p.waitForFunction(()=>sprites.p1&&sprites.tank);await p.click('#local');const result=await p.evaluate(()=>{
 begin(112358,1,true);mode='local';const durations=[],paths=[];const rooms=map.rooms.filter(r=>r.tier);for(const r of map.rooms)world.rooms[r.id].seen=true;
 for(let i=0;i<100;i++){const r=rooms[Math.floor(i/10)%rooms.length];world.players.forEach((p,j)=>{p.x=r.wx+j*44;p.y=r.wy;p.a=i*.07;});cameras=[];const t=performance.now();render(world,1000+i*16.67);durations.push(performance.now()-t);}
 const target=world.players[0];for(let i=0;i<100;i++){const r=rooms[i%rooms.length];const e={x:r.wx,y:r.wy,r:[13,15,24,28,31,36][i%6]};const t=performance.now();findPath(e,target);paths.push(performance.now()-t);}
 const stats=a=>{a.sort((x,y)=>x-y);return {median:a[50],p95:a[95],max:a[99],total:a.reduce((x,y)=>x+y,0)};};return {render:stats(durations),pathfinding:stats(paths)};
 });console.log(JSON.stringify(result,null,2));}finally{await browser?.close();server.kill();}})().catch(error=>{console.error(error);process.exitCode=1;});
