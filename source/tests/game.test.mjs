import { strict as assert } from 'node:assert';
import { createRoom,joinRoom,transition,view,rolesFor,answer,PHASES } from '../lib/game/engine.ts';
let passes=0;
for(const count of [1,2,3,4])for(const variant of [0,1,2]){
 const {room:r,token}=createRoom('ABC234','Captain',count===1);r.variant=variant;r.settings=Array.from({length:3},(_,phase)=>Array.from({length:4},(_,role)=>(phase+role+variant)%3));const tokens=[token];for(let p=1;p<count;p++)tokens.push(joinRoom(r,'Crew '+p));
 for(const t of tokens)transition(r,t,{action:'ready'});transition(r,token,{action:'start'});
 for(let phase=0;phase<3;phase++){
 for(let role=0;role<4;role++){
 const owner=tokens[role%count];const v=view(r,owner);assert.equal(v.stations.length,rolesFor(r,r.players[role%count].id).length);
 assert(!JSON.stringify(v).includes('"token"'));assert.equal(v.solutions.length,0);
 const clueOwner=tokens[((role+3)%4)%count];const clue=view(r,clueOwner).stations.find(s=>s.role===(role+3)%4).evidence;
 let solved;
 if(phase===0)solved=PHASES[phase].options[role].find(option=>!clue.lines.slice(0,2).some(line=>line.startsWith(option+' —')));
 else if(phase===1){const sum=clue.lines.slice(0,2).reduce((a,l)=>a+Number(l.match(/: (\d+) units/)[1]),0);solved=v.stations.find(s=>s.role===role).reference.lines.find(line=>line.startsWith(sum+' units = ')).split(' = ')[1]}
 else{const encoded=clue.lines[0].split(': ')[1].replaceAll(' ','');solved=v.stations.find(s=>s.role===role).reference.lines.find(line=>line.split(' = ')[0].slice(2)===encoded).split(' = ')[1]}
 assert.equal(solved,answer(r,role));
 transition(r,owner,{action:'lock',phase,round:r.round,role,value:answer(r,role)});
 }
 }assert.equal(r.status,'won');assert.equal(view(r,token).solutions.length,3);transition(r,token,{action:'rematch'});assert.equal(r.status,'lobby');assert.equal(r.variant,(variant+1)%3);passes++;
}
const {room:r,token:t}=createRoom('DEF234','A');const u=joinRoom(r,'B');
assert.throws(()=>transition(r,u,{action:'start'}),/captain/);assert.throws(()=>view(r,'bogus'),/Session/);
transition(r,t,{action:'ready'});transition(r,u,{action:'ready'});transition(r,t,{action:'start'});
assert.throws(()=>transition(r,t,{action:'lock',phase:0,round:0,role:1,value:answer(r,1)}),/another/);
assert.throws(()=>joinRoom(r,'C'),/started/);
const deadline=r.deadline;
for(let role=0;role<4;role++)transition(r,role%2?u:t,{action:'lock',phase:0,round:0,role,value:role===0?PHASES[0].options[0].find(v=>v!==answer(r,0)):answer(r,role)});
assert.equal(r.phase,0);assert.equal(r.deadline,deadline-20000);assert.equal(r.round,1);
assert.throws(()=>transition(r,t,{action:'lock',phase:0,round:0,role:0,value:answer(r,0)}),/changed/);
assert.equal(view(r,t).me,r.players[0].id);
r.players[0].seen=Date.now()-65000;transition(r,u,{action:'claim'});assert.equal(r.host,r.players[1].id);
r.deadline=Date.now()-100;transition(r,u,{action:'heartbeat'});assert.equal(r.status,'lost');
console.log(`${passes} complete missions passed (all 3 configurations, 1–4 players). Permissions, evidence solvability, redaction, penalties, stale actions, reconnect identity, captain transfer, timeout and rematch passed.`);

const legacy=createRoom('OLD234','Legacy',true);delete legacy.room.settings;
transition(legacy.room,legacy.token,{action:'ready'});transition(legacy.room,legacy.token,{action:'start'});
for(let phase=0;phase<3;phase++)for(let role=0;role<4;role++){assert.equal(view(legacy.room,legacy.token).stations[role].reference,null);transition(legacy.room,legacy.token,{action:'lock',phase,round:legacy.room.round,role,value:answer(legacy.room,role)})}
assert.equal(legacy.room.status,'won');
const lobby=createRoom('END234','First');const second=joinRoom(lobby.room,'Second');transition(lobby.room,lobby.token,{action:'leave'});assert.equal(lobby.room.players.length,1);assert.equal(lobby.room.host,lobby.room.players[0].id);assert.deepEqual(rolesFor(lobby.room,lobby.room.host),[0,1,2,3]);transition(lobby.room,second,{action:'leave'});const replacement=joinRoom(lobby.room,'Replacement');assert.equal(view(lobby.room,replacement).host,view(lobby.room,replacement).me);
console.log('New mechanics solved independently from private clues; legacy rooms complete unchanged; leaving, seat release and host succession passed.');
const kickRoom=createRoom('KIK234','Captain');const sybilToken=joinRoom(kickRoom.room,'Sybil');assert.throws(()=>joinRoom(kickRoom.room,'sybil'),/already in use/);transition(kickRoom.room,kickRoom.token,{action:'ready'});const secondToken=joinRoom(kickRoom.room,'Second');assert.equal(view(kickRoom.room,kickRoom.token).players[0].ready,true);
const sybilId=kickRoom.room.players[1].id;assert.throws(()=>transition(kickRoom.room,sybilToken,{action:'kick',player:sybilId}),/captain/);assert.throws(()=>transition(kickRoom.room,kickRoom.token,{action:'kick',player:kickRoom.room.players[0].id}),/cannot remove themselves/);transition(kickRoom.room,kickRoom.token,{action:'kick',player:sybilId});assert.equal(kickRoom.room.players.length,2);assert.throws(()=>view(kickRoom.room,sybilToken),/Session/);
transition(kickRoom.room,secondToken,{action:'ready'});transition(kickRoom.room,kickRoom.token,{action:'start'});transition(kickRoom.room,kickRoom.token,{action:'lock',phase:0,round:kickRoom.room.round,role:0,value:answer(kickRoom.room,0)});const roundBeforeKick=kickRoom.room.round;transition(kickRoom.room,kickRoom.token,{action:'kick',player:kickRoom.room.players[1].id});assert.equal(kickRoom.room.players.length,1);assert.deepEqual(kickRoom.room.locked,{});assert.equal(kickRoom.room.round,roundBeforeKick+1);assert.deepEqual(rolesFor(kickRoom.room,kickRoom.room.host),[0,1,2,3]);
console.log('Security regressions passed: duplicate callsigns rejected, joins keep ready state, captain kick in lobby and during a mission frees the seat and clears locks.');
