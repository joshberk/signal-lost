import { createRequire } from 'node:module';
import { strict as assert } from 'node:assert';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const require=createRequire(import.meta.url);
const wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=wranglerRequire('miniflare');
const files=await readdir('dist/server',{recursive:true});
const modules=['index.js',...files.filter(f=>f.endsWith('.js')&&f!=='index.js')].map(f=>({type:'ESModule',path:resolve('dist/server',f)}));
const mf=new Miniflare({modules,modulesRoot:resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],serviceBindings:{ASSETS:()=>new Response('Not found',{status:404})}});
try{
const db=await mf.getD1Database('DB');await db.exec((await readFile('drizzle/0000_blushing_mercury.sql','utf8')).replaceAll('\n',' '));
async function call(action,s={},extra={},expected=200){const response=await mf.dispatchFetch('http://signal.test/api/game',{method:'POST',headers:{'content-type':'application/json',origin:'http://signal.test'},body:JSON.stringify({...s,...extra,action})});const d=await response.json();assert.equal(response.status,expected,JSON.stringify(d));return d}
const created=await call('create',{}, {name:'Captain'});assert.equal(created.game.revision,0);const code=created.game.code;const players=[{code,token:created.token}];
for(let i=1;i<4;i++){const d=await call('join',{code},{name:'Crew '+i});players.push({code,token:d.token})}
await call('read',{code,token:'invalid'}, {},400);
for(const p of players)await call('ready',p);
await call('start',players[1],{},400);await call('start',players[0]);
for(let phase=0;phase<3;phase++){
 const views=await Promise.all(players.map(async p=>(await call('read',p)).game));
 const settings=views.map((v,role)=>{const station=v.stations[0];const clue=views[(role+3)%4].stations[0].evidence;assert.equal(v.phase,phase);assert.equal(v.stations.length,1);assert(!JSON.stringify(v).includes('"token"'));
 if(phase===0)return station.options.find(o=>!clue.lines.slice(0,2).some(l=>l.startsWith(o+' —')));
 if(phase===1){const sum=clue.lines.slice(0,2).reduce((a,l)=>a+Number(l.match(/: (\d+) units/)[1]),0);return station.reference.lines.find(l=>l.startsWith(sum+' units = ')).split(' = ')[1]}
 const cipher=clue.lines[0].split(': ')[1].replaceAll(' ','');return station.reference.lines.find(l=>l.split(' = ')[0].slice(2)===cipher).split(' = ')[1];});
 await Promise.all(players.map((p,role)=>call('lock',p,{role,phase,round:views[role].round,value:settings[role]})));
}
const won=(await call('read',players[3])).game;assert.equal(won.status,'won');assert.equal(won.solutions.length,3);
await call('rematch',players[0]);await call('leave',players[3]);const after=(await call('read',players[0])).game;assert.equal(after.players.length,3);
const joined=await call('join',{code},{name:'Replacement'});assert.equal(joined.game.players.length,4);
await call('join',{code},{name:'Fifth player'},400);
await call('read',{code:'BAD'}, {},400);
await call('read',{code:'ZZZZZZ'}, {},400);
assert.equal((await mf.dispatchFetch('http://signal.test/api/game')).status,405);
assert.equal((await mf.dispatchFetch('http://signal.test/api/game',{method:'POST',headers:{origin:'https://other.example'},body:'{}'})).status,403);
assert.equal((await mf.dispatchFetch('http://signal.test/api/game',{method:'POST',body:'bad json'})).status,400);
assert.equal((await mf.dispatchFetch('http://signal.test/api/game',{method:'POST',body:'x'.repeat(2049)})).status,413);
// Inject elapsed server times only in this isolated test database, never in hosted rooms.
async function editRoom(code,edit){const row=await db.prepare('SELECT state FROM rooms WHERE code=?').bind(code).first();const r=JSON.parse(row.state);edit(r);await db.prepare('UPDATE rooms SET state=?,revision=revision+1 WHERE code=?').bind(JSON.stringify(r),code).run();}
const duo=await call('create',{}, {name:'Duo captain'});const a={code:duo.game.code,token:duo.token};
const second=await call('join',{code:a.code},{name:'Duo crew'});const b={code:a.code,token:second.token};
await call('ready',a);await call('ready',b);await call('start',a);
let av=(await call('read',a)).game;assert.deepEqual(av.stations.map(s=>s.role),[0,2]);assert.equal(av.solutions.length,0);
await call('lock',a,{role:1,phase:0,round:av.round,value:'NORTH'},400);
const bv=(await call('read',b)).game;const stations=[...av.stations,...bv.stations];
const values=Array.from({length:4},(_,role)=>{const s=stations.find(s=>s.role===role);const clue=stations.find(s=>s.role===(role+3)%4).evidence;return s.options.find(o=>!clue.lines.slice(0,2).some(l=>l.startsWith(o+' —')))});
values[0]=av.stations[0].options.find(o=>o!==values[0]);
await Promise.all(values.map((value,role)=>call('lock',role%2?b:a,{role,phase:0,round:av.round,value})));
const wrong=(await call('read',a)).game;assert.equal(wrong.phase,0);assert.equal(wrong.round,av.round+1);assert.equal(wrong.deadline,av.deadline-20000);assert.equal(wrong.attempts,1);
await call('lock',a,{role:0,phase:0,round:av.round,value:values[0]},400);
await call('leave',b,{},400);await call('claim',b,{},400);
await editRoom(a.code,r=>{r.players[0].seen=Date.now()-61000});await call('claim',b);assert.equal((await call('read',b)).game.host,second.game.me);
await editRoom(a.code,r=>{r.deadline=Date.now()-1});
const beforeExpiry=await db.prepare('SELECT revision FROM rooms WHERE code=?').bind(a.code).first();
const expired=(await call('read',a)).game;assert.equal(expired.status,'lost');assert.equal(expired.revision,beforeExpiry.revision+1);
const saved=await db.prepare('SELECT state,revision FROM rooms WHERE code=?').bind(a.code).first();assert.equal(JSON.parse(saved.state).status,'lost');assert.equal(saved.revision,expired.revision);
assert.equal((await call('read',b)).game.revision,expired.revision);
await call('rematch',b);await call('leave',a);assert.equal((await call('read',b)).game.players.length,1);
await db.prepare('UPDATE rooms SET expires=? WHERE code=?').bind(Date.now()-1,a.code).run();await call('read',b,{},400);
const practice=await call('create',{}, {name:'Practice',practice:true});const p={code:practice.game.code,token:practice.token};await call('ready',p);await call('start',p);assert.equal((await call('read',p)).game.stations.length,4);
const assets=await readdir('dist/client/assets');for(const f of assets.filter(f=>f.endsWith('.js'))){const js=await readFile('dist/client/assets/'+f,'utf8');assert(!js.includes('Server-owned, curated scenarios'));assert(!js.includes('Primary reading:'));assert(!js.includes('Both obstructed bays'));}
console.log('Built Worker + real local D1 integration passed: four sessions, all three mechanics, simultaneous commits, permissions, persistence, rematch, leave and replacement.');
console.log('Additional API checks passed: two-player roles, wrong-answer penalty, stale/unauthorized actions, captain takeover, timeout persistence, solo practice, invalid/full/expired rooms, origin/method/body guards and browser bundle isolation.');
}finally{await mf.dispose()}
