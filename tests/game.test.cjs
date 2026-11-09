const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
let browser, server;
const url='http://127.0.0.1:10003';
before(async()=>{
  server=spawn(process.execPath,['server.js'],{cwd:require('node:path').resolve(__dirname,'..'),env:{...process.env,PORT:'10003'}});
  await once(server.stdout,'data');
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
});
after(async()=>{await browser?.close();server?.kill();});
async function page(){const p=await browser.newPage({viewport:{width:1280,height:800}});p.setDefaultTimeout(12000);p.errors=[];p.on('pageerror',e=>p.errors.push(e.message));await p.goto(url);await p.waitForFunction(()=>Object.keys(sprites).length===13);return p;}
test('sprites, movement, precision aim, firing and five skills with five levels',async()=>{
 const p=await page();try{
 await p.click('#local');
 const result=await p.evaluate(()=>{
   const bench=map.rooms.find(r=>r.type==='bench');const player=world.players[0]; player.x=bench.wx;player.y=bench.wy;world.cores=100;
   for(let skill=0;skill<5;skill++)for(let n=0;n<7;n++)applyUpgrade(player,skill);
   applyUpgrade(player,5);
   openBench(0);const levels=[...player.mods],cores=world.cores;
   const ui=[...document.querySelectorAll('#benchChoices button')].map(b=>({text:b.textContent,disabled:b.disabled,pips:b.querySelectorAll('.filled').length}));
   closeBench();const x=player.x;const input=emptyInput(0);input.x=1;input.focus=true;updatePlayers([input,emptyInput()]);
   const moved=player.x-x;input.fire=true;updateWeapon(player,input);
   return {levels,cores,ui,moved,focus:player.focus,kick:player.kick,bullets:world.bullets.length};
 });
 assert.deepEqual(result.levels,[5,5,5,5,5,0,0,0,0,0]);assert.equal(result.cores,75);
 assert.ok(result.ui.every(b=>b.disabled));assert.equal(result.ui[0].pips,5);
 assert.ok(result.moved>0&&result.moved<2);assert.equal(result.focus,true);assert.equal(result.kick,1);assert.ok(result.bullets>0);
 await p.evaluate(()=>{const r=roomAt(world.players[0].x,world.players[0].y);world.rooms[r.id].seen=true;world.players[1].x=r.wx+40;world.players[1].y=r.wy;openBench(0);});await p.waitForTimeout(500);await p.screenshot({path:'test-results/upgrades.png'});await p.click('#benchClose');await p.screenshot({path:'test-results/gameplay.png'});assert.deepEqual(p.errors,[]);
 }finally{await p.close();}
});
test('100 seeded maps contain two new stages, stay in bounds and connect every room',async()=>{
 const p=await page();try{
 const result=await p.evaluate(()=>{
 for(let seed=0;seed<100;seed++){
   const m=makeMap(seed);if(!['foundry','garden'].every(t=>m.rooms.filter(r=>r.type===t).length===1))return 'missing stage';
   if(m.rooms.some(r=>r.x<0||r.y<0||r.x+r.w>COLS||r.y+r.h>ROWS))return 'bounds '+seed;
   const start=m.rooms[0].cy*COLS+m.rooms[0].cx, seen=new Set([start]),q=[start];
   for(let i=0;i<q.length;i++){const n=q[i],x=n%COLS,y=Math.floor(n/COLS);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,j=yy*COLS+xx;if(xx>=0&&xx<COLS&&yy>=0&&yy<ROWS&&m.grid[j]&&!seen.has(j)){seen.add(j);q.push(j);}}}
   if(m.rooms.some(r=>!seen.has(r.cy*COLS+r.cx)))return 'disconnected '+seed;
 }return 'ok';});assert.equal(result,'ok');
 }finally{await p.close();}
});
test('new stages have three waves and rewards; final encounter and exit require campaign progress',async()=>{
 const p=await page();try{await p.click('#local');
 const result=await p.evaluate(()=>{
  const final=map.rooms.find(r=>r.type==='boss'&&r.tier===3);const a=world.players[0];a.x=final.wx;a.y=final.wy;visitRooms();const locked=!world.rooms[final.id].started;
  const stage=map.rooms.find(r=>r.type==='foundry'),rec=world.rooms[stage.id];a.x=stage.wx;a.y=stage.wy;visitRooms();
  const waves=[rec.wave];for(let n=0;n<2;n++){world.enemies=[];rec.countdown=0;progressWaves();waves.push(rec.wave);}
  world.enemies=[];progressWaves();const rewarded=world.drops.some(d=>d.type==='core'&&d.value===10);
  for(const r of map.rooms)world.rooms[r.id].cleared=true;
  world.bosses=2;a.x=final.wx;a.y=final.wy;visitRooms();
  const scene=Boolean(world.cutscene);const hp=a.hp,tick=world.tick;simulate(performance.now());
  const frozen=a.hp===hp&&world.tick===tick+1&&world.cutscene.remaining===419;
  const snap=makeSnapshot();world.cutscene.remaining=1;simulate(performance.now());
  const ended=world.cutscene===null;
  const exit=map.rooms.at(-1);for(const player of world.players){player.x=exit.wx;player.y=exit.wy;}world.key=true;world.enemies=[];simulate(performance.now());const prevented=world.status==='play';
  world.bosses=3;simulate(performance.now());return {locked,waves,rewarded,scene,frozen,ended,prevented,status:world.status,snapshotScene:snap.cutscene.remaining};
 });
 assert.equal(result.locked,true);assert.deepEqual(result.waves,[1,2,3]);assert.equal(result.rewarded,true);
 assert.equal(result.scene,true);assert.equal(result.frozen,true);assert.equal(result.ended,true);assert.equal(result.prevented,true);assert.equal(result.status,'win');assert.equal(result.snapshotScene,419);
 assert.deepEqual(p.errors,[]);
 }finally{await p.close();}
});
test('two browsers synchronize sprites, upgrades, aimed shots and final boss cinematic',async()=>{
 const a=await page(),b=await page();try{
 await a.click('#create');await a.waitForFunction(()=>Boolean(code));
 await b.fill('#roomInput',await a.evaluate(()=>code));await b.click('#join');
 await a.waitForFunction(()=>paired);await a.click('#start');await b.waitForFunction(()=>Boolean(view));
 await a.evaluate(()=>{const bench=map.rooms.find(r=>r.type==='bench');for(const p of world.players){p.x=bench.wx;p.y=bench.wy;}world.cores=20;publishSnapshot();});
 await b.waitForFunction(()=>view.cores===20&&benchNear(view.players[1]));await b.waitForTimeout(200);
 await b.bringToFront();await b.keyboard.down('e');await b.waitForSelector('#bench:not([hidden])');await b.keyboard.up('e');await b.locator('#benchChoices button').first().click();await b.waitForFunction(()=>view.players[1].mods[0]===1);
 assert.equal(await a.evaluate(()=>world.players[1].mods[0]),1);await b.click('#benchClose');
 await b.mouse.move(1000,400);await b.mouse.down({button:'right'});await b.mouse.down();
 await a.waitForFunction(()=>world.players[1].focus&&world.players[1].shots>0);await b.mouse.up();await b.mouse.up({button:'right'});
 await a.evaluate(()=>{world.bosses=2;for(const r of map.rooms)if(['garden','foundry'].includes(r.type))world.rooms[r.id].cleared=true;const r=map.rooms.find(r=>r.type==='boss'&&r.tier===3);for(const p of world.players){p.x=r.wx;p.y=r.wy;}visitRooms();publishSnapshot();});
 await b.waitForFunction(()=>Boolean(view?.cutscene));
 assert.equal(await b.evaluate(()=>view.cutscene.duration),420);
 await b.waitForTimeout(1800);await b.screenshot({path:'test-results/boss-cutscene.png'});
 await a.waitForFunction(()=>!world.cutscene,{},{timeout:12000});await b.waitForFunction(()=>!view.cutscene,{},{timeout:12000});
 assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
 }finally{await a.close();await b.close();}
});

test('motion atlases select direction, mirrored walking steps and enemy attack frames',async()=>{
 const p=await page();try{await p.click('#local');
 const frames=await p.evaluate(()=>{
  const calls=[],original=ctx.drawImage;
  ctx.drawImage=function(img,...args){if(img===sprites.p1Motion||img===sprites.enemyMotion)calls.push({kind:img===sprites.p1Motion?'player':'enemy',sx:args[0],sy:args[1]});return original.call(this,img,...args);};
  try{
   const player=world.players[0];player.moving=true;
   for(const [angle,tick] of [[0,0],[Math.PI/2,8],[-Math.PI/2,16],[Math.PI,24]]){player.a=angle;world.tick=tick;drawPlayer(player,1000);}
   const r=map.rooms.find(r=>r.tier);const e=makeEnemy(2,r.wx,r.wy,r.id);e.animAttack=.2;drawEnemy(e,1000);
   return {calls,snapshot:makeSnapshot().enemies[0]};
  }finally{ctx.drawImage=original;}
 });
 assert.deepEqual(frames.calls.slice(0,4).map(c=>[c.sx,c.sy]),[[128,128],[0,0],[256,256],[0,128]]);
 assert.deepEqual(frames.calls[4],{kind:'enemy',sx:256,sy:128});assert.equal(frames.snapshot.animAttack,.2);assert.equal(frames.snapshot.moving,false);assert.deepEqual(p.errors,[]);
 }finally{await p.close();}
});
test('room transitions reuse tile cache; clearance masks match collisions and path searches are budgeted',async()=>{
 const p=await page();try{await p.click('#local');
 const result=await p.evaluate(()=>{
  const layer=tileLayer;for(const room of map.rooms){world.players[0].x=room.wx;world.players[0].y=room.wy;render(world,1000);if(tileLayer!==layer)return {error:'cache rebuilt on room entry'};}
  for(const radius of [13,15,24,28,31,36]){const mask=navigationMask(radius);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const expected=!wallAt(x,y)&&!blocked((x+.5)*T,(y+.5)*T,radius,true);if(Boolean(mask[y*COLS+x])!==expected)return {error:'clearance mismatch'};
  }}
  const room=map.rooms.find(r=>r.type==='normal');for(const player of world.players){player.x=room.wx;player.y=room.wy;}
  world.enemies=[];for(let i=0;i<16;i++)makeEnemy(1,room.wx+100,room.wy+40,room.id);
  const originalRoute=straightRoute,originalPath=findPath;let calls=0;
  try{straightRoute=()=>false;findPath=(...args)=>{calls++;return originalPath(...args);};updateEnemies();return {calls,error:null};}
  finally{straightRoute=originalRoute;findPath=originalPath;}
 });
 assert.equal(result.error,null);assert.equal(result.calls,2);assert.deepEqual(p.errors,[]);
 }finally{await p.close();}
});
