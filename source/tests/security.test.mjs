import {createRequire} from 'node:module';
import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {Miniflare}=createRequire(require.resolve('wrangler/package.json'))('miniflare');
const mf=new Miniflare({modules:[{type:'ESModule',path:resolve('dist/server/index.js')}],modulesRoot:resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],serviceBindings:{ASSETS:()=>new Response('missing',{status:404})}});
const db=await mf.getD1Database('DB');
for(const f of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())await db.exec((await readFile('drizzle/'+f,'utf8')).replaceAll('\n',' '));
async function request(body,ip='192.0.2.1'){
 const response=await mf.dispatchFetch('http://signal.test/api/game',{method:'POST',headers:{'content-type':'application/json',origin:'http://signal.test','cf-connecting-ip':ip},body:JSON.stringify(body)});
 return {status:response.status,body:await response.json()};
}
async function ok(body,ip){const result=await request(body,ip);assert.equal(result.status,200,JSON.stringify(result));return result.body;}
async function clear(){await db.exec('DELETE FROM rate_limits; DELETE FROM rooms;');}
async function pair(){const a=await ok({action:'create',name:'Captain'});const b=await ok({action:'join',code:a.game.code,name:'Crew'});return {a:{code:a.game.code,token:a.token},b:{code:a.game.code,token:b.token},bId:b.game.me};}
try{
await test('concurrent rate limits admit exactly the quota, including first-window and expired-window races',async()=>{
 for(const seed of ['empty','near-limit','expired']){
  await clear();
  if(seed!=='empty'){await ok({action:'create',name:'Seed'});await db.prepare('UPDATE rate_limits SET count=?,reset_at=?').bind(seed==='near-limit'?9:10,seed==='expired'?Date.now()-1:Date.now()+600000).run();}
  const results=await Promise.all(Array.from({length:30},(_,i)=>request({action:'create',name:'Parallel '+i})));
  assert.equal(results.filter(r=>r.status===200).length,seed==='near-limit'?1:10,seed);
  assert(results.every(r=>[200,429].includes(r.status)));
  const row=await db.prepare("SELECT count FROM rate_limits WHERE bucket LIKE 'create:%'").first();assert.equal(row.count,10);
 }
});
await test('unauthenticated lock/unlock do not create gameplay buckets; abuse bucket cardinality is bounded',async()=>{
 await clear();const {a}=await pair();await db.exec('DELETE FROM rate_limits;');
 for(let i=0;i<80;i++)await request({action:i%2?'lock':'unlock',code:i%3?a.code:('ZZ'+String(2222+i)),token:'invalid-'+i});
 const rows=(await db.prepare('SELECT bucket,count FROM rate_limits').all()).results;
 assert.equal(rows.filter(r=>r.bucket.startsWith('lock:')||r.bucket.startsWith('play:')).length,0);
 assert.equal(rows.length,1,'changing code/token must not create new abuse buckets');
 assert.equal(rows[0].count,60,'denied attempts must not keep incrementing/writing');
});
await test('anonymous bucket storage stays bounded across changing IPs and public codes',async()=>{
 await clear();
 for(let start=0;start<1100;start+=50)await Promise.all(Array.from({length:Math.min(50,1100-start)},(_,i)=>request({action:i%2?'lock':'read',code:'ZZZZZZ',token:'fake-'+(start+i)},'198.18.'+Math.floor((start+i)/256)+'.'+((start+i)%256))));
 const rows=await db.prepare('SELECT COUNT(*) AS n FROM rate_limits').first();assert(rows.n<=1024,JSON.stringify(rows));
 assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM rate_limits WHERE bucket NOT LIKE 'abuse:%'").first()).n,0);
});
await test('concurrent join and authenticated gameplay limits retain exact quota accounting',async()=>{
 await clear();
 const joins=await Promise.all(Array.from({length:40},()=>request({action:'join',code:'ZZZZZZ',name:'Probe'})));
 assert.equal(joins.filter(r=>r.status===400).length,30);assert.equal(joins.filter(r=>r.status===429).length,10);
 await db.exec('DELETE FROM rate_limits;');
 const {a,b}=await pair();await ok({action:'ready',...a});await ok({action:'ready',...b});await ok({action:'start',...a});
 const plays=await Promise.all(Array.from({length:130},()=>request({action:'unlock',...a,role:0,phase:0,round:0})));
 assert.equal(plays.filter(r=>r.status===429).length,10);assert(plays.every(r=>[200,409,429].includes(r.status)));
 assert.equal((await db.prepare("SELECT count FROM rate_limits WHERE bucket LIKE 'play:%'").first()).count,120);
 await ok({action:'unlock',...b,role:1,phase:0,round:0});
});
await test('authenticated players on one Wi-Fi have independent lock/unlock allowances',async()=>{
 await clear();const {a,b}=await pair();await ok({action:'ready',...a});await ok({action:'ready',...b});await ok({action:'start',...a});
 for(let i=0;i<120;i++)await ok({action:'unlock',...a,role:0,phase:0,round:0});
 assert.equal((await request({action:'unlock',...a,role:0,phase:0,round:0})).status,429);
 await ok({action:'unlock',...b,role:1,phase:0,round:0});
 // Unauthenticated abuse on the same IP must not consume a valid player's quota.
 for(let i=0;i<65;i++)await request({action:'lock',code:a.code,token:'fake'});
 await ok({action:'unlock',...b,role:1,phase:0,round:0});
});
await test('all invalid session paths have indistinguishable errors and share bounded abuse throttling',async()=>{
 await clear();const {a}=await pair();const old=await ok({action:'create',name:'Expired'},'192.0.2.2');await db.prepare('UPDATE rooms SET expires=? WHERE code=?').bind(Date.now()-1,old.game.code).run();
 let expected;
 for(const action of ['read','heartbeat','lock','unlock','unknown'])for(const code of ['BAD','ZZZZZZ',a.code,old.game.code]){
  const r=await request({action,code,token:'not-a-session'},'192.0.2.3');
  assert.equal(r.status,400);if(!expected)expected=r.body;assert.deepEqual(r.body,expected,action+' '+code);
 }
 const concurrent=await Promise.all(Array.from({length:60},()=>request({action:'read',code:a.code,token:'bad'},'192.0.2.4')));assert(concurrent.every(r=>r.status===400));
 assert.equal((await request({action:'read',code:'ZZZZZZ'},'192.0.2.4')).status,429);
 assert.equal((await request({action:'read',code:a.code,token:'bad'},'192.0.2.4')).status,429);
});
await test('kick closes admission across changed identities and rematches; captain can deliberately reopen',async()=>{
 await clear();const {a,b,bId}=await pair();await ok({action:'kick',...a,player:bId});
 assert.equal((await request({action:'read',...b})).status,400);
 const denied=await request({action:'join',code:a.code,name:'Different identity'},'198.51.100.1');assert.equal(denied.status,400);
 assert.equal((await ok({action:'read',...a})).game.admissionOpen,false);
 assert.equal((await request({action:'admission',...b,open:true})).status,400);
 await ok({action:'admission',...a,open:true});const replacement=await ok({action:'join',code:a.code,name:'Replacement'});
 await ok({action:'ready',...a});const r={code:a.code,token:replacement.token};await ok({action:'ready',...r});await ok({action:'start',...a});
 await ok({action:'kick',...a,player:replacement.game.me});
 const row=await db.prepare('SELECT state FROM rooms WHERE code=?').bind(a.code).first();const room=JSON.parse(row.state);room.deadline=Date.now()-1;await db.prepare('UPDATE rooms SET state=?,revision=revision+1 WHERE code=?').bind(JSON.stringify(room),a.code).run();
 await ok({action:'read',...a});await ok({action:'rematch',...a});assert.equal((await request({action:'join',code:a.code,name:'Again'},'198.51.100.2')).status,400);
 await ok({action:'admission',...a,open:true});const voluntary=await ok({action:'join',code:a.code,name:'Voluntary'});await ok({action:'leave',code:a.code,token:voluntary.token});await ok({action:'join',code:a.code,name:'Ordinary replacement'});
});
await test('kick races preserve revoked-token and admission boundaries under D1 CAS retries',async()=>{
 for(const duringPlay of [false,true]){
  await clear();const {a,b,bId}=await pair();
  if(duringPlay){await ok({action:'ready',...a});await ok({action:'ready',...b});await ok({action:'start',...a});}
  const other=duringPlay?{action:'lock',...b,role:1,phase:0,round:0,value:'NORTH'}:{action:'join',code:a.code,name:'Concurrent joiner'};
  const [kicked,raced]=await Promise.all([request({action:'kick',...a,player:bId}),request(other,'203.0.113.5')]);
  assert.equal(kicked.status,200,JSON.stringify(kicked));assert([200,400].includes(raced.status),JSON.stringify(raced));
  const final=(await ok({action:'read',...a})).game;assert.equal(final.admissionOpen,false);assert(!final.players.some(p=>p.id===bId));
  assert.equal((await request({action:'read',...b})).status,400);
  assert.equal((await request({action:'join',code:a.code,name:'After removal'},'203.0.113.6')).status,400);
  if(duringPlay)assert.deepEqual(final.locked,[]);
 }
});
await test('callsigns require safe alphanumeric characters and prevent homoglyphs',async()=>{
 await clear();
 assert.equal((await request({action:'create',name:'<script>alert(1)</script>'})).status,400);
 assert.equal((await request({action:'create',name:'   '})).status,400);
 const cap=await ok({action:'create',name:'Sparrow'});
 const joinHomoglyph=await request({action:'join',code:cap.game.code,name:'Sp\u0430rrow'});
 assert.equal(joinHomoglyph.status,400);
});
await test('kicking a player during a 2-player multiplayer mission aborts to lost and preserves quorum',async()=>{
 await clear();const {a,b,bId}=await pair();
 await ok({action:'ready',...a});await ok({action:'ready',...b});await ok({action:'start',...a});
 await ok({action:'kick',...a,player:bId});
 const final=(await ok({action:'read',...a})).game;
 assert.equal(final.status,'lost');
 assert.equal(final.players.length,1);
 assert.equal(final.admissionOpen,false);
 assert.equal(final.events.at(-2).kind,'failure');
});
}finally{await mf.dispose();}
