export const ROLES = ['Comms','Navigation','Systems','Security'];
export const PHASES = [
 {title:'Find the real rescue ship',description:'Three ships are calling. Only one can reach you safely. Cross-check your private evidence, then lock all four stations.',labels:['Rescue ship','Docking bay','Power bus','Authentication'],options:[['KESTREL','ORION','VEGA'],['NORTH','EAST','WEST'],['BUS A','BUS B','BUS C'],['LANTERN','HARBOR','CIPHER']]},
 {title:'Bring the array back online',description:'The storm scattered the calibration records. One station has the measurements; another has the conversion card. Combine them to restore the array.',labels:['Relay','Bearing','Cooling loop','Shield mode'],options:[['RELAY 1','RELAY 2','RELAY 3'],['045°','135°','270°'],['LOOP A','LOOP B','LOOP C'],['LOW','MEDIUM','HIGH']]},
 {title:'Send the final signal',description:'A coded rescue transmission is coming through. Share the symbols with the station that holds the matching codebook, then commit the launch together.',labels:['Frequency','Launch window','Output','Handshake code'],options:[['121.5 MHz','243.0 MHz','406.0 MHz'],['WINDOW A','WINDOW B','WINDOW C'],['20 kW','40 kW','60 kW'],['ECHO','NOVA','SOL']]}];
// Server-owned, curated scenarios. Never import this module into the browser.
const VARIANTS = [
 [[0,1,2,1],[2,0,1,2],[1,2,0,2]],
 [[2,2,0,0],[0,2,2,1],[2,0,1,0]],
 [[1,0,1,2],[1,1,0,0],[0,1,2,1]]
];
function newGrid(){return Array.from({length:3},()=>Array.from(crypto.getRandomValues(new Uint8Array(4)),n=>n%3))}
function grid(r:Room){return r.settings||VARIANTS[r.variant]}
type Player={id:string;token:string;name:string;ready:boolean;seen:number};
type Event={at:number;text:string;kind:string};
export type Room={admissionOpen?:boolean;settings?:number[][];code:string;players:Player[];host:string;practice:boolean;status:string;phase:number;variant:number;deadline:number;started:number;finished:number;attempts:number;round:number;locked:Record<string,string>;events:Event[];hinted:number[]};
function event(r:Room,text:string,kind='info'){r.events.push({at:Date.now(),text,kind});r.events=r.events.slice(-120)}
function removePlayer(r:Room,target:Player,reason:string){r.players=r.players.filter(x=>x.id!==target.id);if(r.host===target.id)r.host=r.players[0]?.id||'';if(r.status==='playing'){r.locked={};r.round++}event(r,`${target.name} ${reason}`)}
export function createRoom(code:string,name:string,practice=false):{room:Room;token:string}{
 const token=crypto.randomUUID();const id=crypto.randomUUID();return {token,room:{settings:newGrid(),code,players:[{id,token,name,ready:false,seen:Date.now()}],host:id,practice,status:'lobby',phase:0,variant:crypto.getRandomValues(new Uint8Array(1))[0]%3,deadline:0,started:0,finished:0,attempts:0,round:0,locked:{},events:[],hinted:[]}};
}
export function rolesFor(r:Room,id:string){return [0,1,2,3].filter(n=>r.players[n%r.players.length]?.id===id)}
export function answer(r:Room,role:number){return PHASES[r.phase].options[role][grid(r)[r.phase][role]]}
export function expire(r:Room){if(r.status==='playing'&&Date.now()>=r.deadline){r.status='lost';r.finished=r.deadline;event(r,'The rescue window closed. Your last signal never cleared the storm.','failure')}}
export function transition(r:Room,token:string,body:any){
 expire(r);const p=r.players.find(x=>x.token===token);if(!p)throw Error('Your crew session is unavailable. Join the room again.');p.seen=Date.now();
 const host=()=>{if(r.host!==p.id)throw Error('Only the room captain can do that.')};
 switch(body.action){
 case 'heartbeat': break;
 case 'leave': if(r.status==='playing')throw Error('Finish the active mission before leaving.');removePlayer(r,p,'left the crew.');break;
 case 'admission': host();if(r.status!=='lobby')throw Error('Change admission from the lobby.');if(typeof body.open!=='boolean')throw Error('Choose whether joining is open.');r.admissionOpen=body.open;event(r,p.name+(body.open?' reopened joining. Anyone with the room code can join.':' paused new joins.'));break;
 case 'kick': host();{const target=r.players.find(x=>x.id===body.player);if(!target)throw Error('That crewmate is no longer in the room.');if(target.id===p.id)throw Error('The captain cannot remove themselves. Use Leave room instead.');r.admissionOpen=false;removePlayer(r,target,'was removed by the captain. New joins are paused until the captain reopens admission from the lobby.')}break;
 case 'ready': if(r.status!=='lobby')throw Error('The mission has already started.');p.ready=!p.ready;break;
 case 'claim': if((r.players.find(x=>x.id===r.host)?.seen||0)>Date.now()-60000)throw Error('The captain is still connected.');r.host=p.id;event(r,p.name+' took command.');break;
 case 'start': host();if(r.status!=='lobby')throw Error('This mission has already started.');if(!r.practice&&r.players.length<2)throw Error('Invite at least one crewmate first.');if(r.players.some(x=>!x.ready))throw Error('Every crewmate must mark ready.');r.status='playing';r.started=Date.now();r.deadline=r.started+540000;event(r,'Mission started. Nine minutes until the rescue window closes.');break;
 case 'lock': {
 if(r.status!=='playing')throw Error('There is no active mission.');if(body.phase!==r.phase||body.round!==r.round)throw Error('The mission changed. Check the latest station settings.');
 const role=body.role;if(!Number.isInteger(role)||!rolesFor(r,p.id).includes(role))throw Error('That station belongs to another crewmate.');if(!PHASES[r.phase].options[role].includes(body.value))throw Error('Choose a valid station setting.');
 if(r.locked[role])throw Error('Your station is already locked.');r.locked[role]=body.value;event(r,`${p.name} locked ${ROLES[role]}.`);
 if(Object.keys(r.locked).length===4){
 const correct=[0,1,2,3].every(i=>r.locked[i]===answer(r,i));r.attempts++;
 event(r,PHASES[r.phase].title+': '+[0,1,2,3].map(i=>`${ROLES[i]} ${r.locked[i]}`).join(' · ')+(correct?' — confirmed.':' — mismatch. 20 seconds lost.'),correct?'success':'failure');
 r.locked={};r.round++;
 if(correct){r.phase++;if(r.phase===3){r.status='won';r.finished=Date.now();event(r,'Signal received. Rescue is on its way.','success')}}else{r.deadline-=20000;expire(r)}
 }break;}
 case 'unlock': if(r.status!=='playing'||body.phase!==r.phase||body.round!==r.round)throw Error('The mission changed.');if(!rolesFor(r,p.id).includes(body.role))throw Error('That is not your station.');delete r.locked[body.role];break;
 case 'hint': if(r.status!=='playing')throw Error('Hints are available during a mission.');if(!r.hinted.includes(r.phase)){r.hinted.push(r.phase);event(r,'Team hint opened. No time penalty.')}break;
 case 'rematch': host();if(!['won','lost'].includes(r.status))throw Error('Finish this mission first.');r.variant=(r.variant+1)%3;if(r.settings)r.settings=newGrid();r.status='lobby';r.phase=0;r.round++;r.started=0;r.deadline=0;r.finished=0;r.locked={};r.events=[];r.attempts=0;r.hinted=[];r.players.forEach(x=>x.ready=false);break;
 default:throw Error('Unknown action.');
 }return r;
}
export function joinRoom(r:Room,name:string){if(r.admissionOpen===false)throw Error('The captain has paused new joins.');if(r.practice)throw Error('This room is for solo practice. Create a crew room instead.');if(r.status!=='lobby')throw Error('That mission has started. Ask the crew to finish and rematch.');if(r.players.length>=4)throw Error('This room is full.');if(r.players.some(x=>x.name.toLowerCase()===name.toLowerCase()))throw Error('That callsign is already in use. Pick another.');const token=crypto.randomUUID();r.players.push({id:crypto.randomUUID(),token,name,ready:false,seen:Date.now()});if(!r.host)r.host=r.players[r.players.length-1].id;return token}
export function stationReference(r:Room,role:number){
 if(!r.settings||r.phase===0)return null;
 if(r.phase===1){const values=[[10,20,30],[45,135,270],[10,20,30],[1,2,3]][role];return {title:'Calibration card',lines:values.map((v,i)=>`${v} units = ${PHASES[1].options[role][i]}`)}}
 return {title:'Receiver codebook',lines:PHASES[2].options[role].map((v,i)=>`${['A ·−','B −···','C −·−·'][i]} = ${v}`)};
}
function hint(r:Room){if(!r.settings||r.phase===0)return 'Evidence flows Comms → Navigation → Systems → Security → Comms. Eliminate the two ruled-out options and choose the remaining one.';if(r.phase===1)return 'Read your measurements to the next station. Add the two readings, then use that station’s calibration card to select the matching setting.';return 'Read the dots and dashes to the next station. They match the exact symbol sequence in their receiver codebook. Spaces only separate the symbols.'}
function clues(r:Room,role:number){
 if(r.settings&&r.phase>0){const next=(role+1)%4;const index=grid(r)[r.phase][next];
 if(r.phase===1){const totals=[[10,20,30],[45,135,270],[10,20,30],[1,2,3]][next];const total=totals[index];const first=next===3?1:5;return {title:['Antenna telemetry','Thermal telemetry','Radiation telemetry','Relay telemetry'][role],forRole:ROLES[next],lines:[`Primary reading: ${first} units.`,`Correction reading: ${total-first} units.`,`Add both readings. ${ROLES[next]} has the calibration card; you have the measurements.`]}}
 return {title:'Fragment of the rescue transmission',forRole:ROLES[next],lines:[`Encoded setting: ${['· −','− · · ·','− · − ·'][index]}`,`The receiver for this fragment is ${ROLES[next]}.`,'Relay the exact dots and dashes. The receiver’s codebook translates the signal into a setting.']};
 }

 const next=(role+1)%4;const opt=PHASES[r.phase].options[next];const val=answer(r,next);const wrong=opt.filter(x=>x!==val);
 const intros=[['Dock inspection','Power audit','Challenge-response record','Rescue manifest'],['Antenna calibration','Thermal inspection','Radiation advisory','Relay continuity test'],['Flight schedule','Transmitter safety','Handshake bulletin','Receiver specification']];
 const explanations=[['Both obstructed bays are unsafe. Use the remaining bay.','Both damaged buses are isolated. Use the remaining bus.','Both old passphrases have been revoked. Use the remaining phrase.','Both other ships are outside rescue range. Call the remaining ship.'],['Both rejected bearings face the storm. Use the remaining bearing.','Both failed loops leak. Use the remaining cooling loop.','Both unsuitable shield modes block the uplink. Use the remaining mode.','Both failed relays have no continuity. Use the remaining relay.'],['Both cancelled windows miss the rescue orbit. Use the remaining window.','Both disallowed outputs overload the receiver. Use the remaining output.','Both expired codes will be rejected. Use the remaining code.','Both unsupported frequencies are out of range. Use the remaining frequency.']];
 return {title:intros[r.phase][role],forRole:ROLES[next],lines:[`${wrong[0]} — ruled out.`,`${wrong[1]} — ruled out.`,explanations[r.phase][role]]};
}
export function view(r:Room,token:string){expire(r);const me=r.players.find(p=>p.token===token);if(!me)throw Error('Session not found.');const assigned=rolesFor(r,me.id);return {admissionOpen:r.admissionOpen!==false,code:r.code,me:me.id,host:r.host,practice:r.practice,status:r.status,phase:r.phase,round:r.round,deadline:r.deadline,started:r.started,finished:r.finished,attempts:r.attempts,serverNow:Date.now(),players:r.players.map(({token,...p})=>({...p,roles:rolesFor(r,p.id)})),locked:Object.keys(r.locked).map(Number),events:r.events,hint:r.hinted.includes(r.phase),hintText:r.hinted.includes(r.phase)?hint(r):null,mechanic:!r.settings||r.phase===0?'Cross-check evidence':r.phase===1?'Combine telemetry':'Decode the transmission',stations:r.status==='playing'?assigned.map(role=>({role,name:ROLES[role],label:PHASES[r.phase].labels[role],options:PHASES[r.phase].options[role],selected:r.locked[role]||null,evidence:clues(r,role),reference:stationReference(r,role)})):[],phaseInfo:PHASES[r.phase]||null,solutions:['won','lost'].includes(r.status)?PHASES.map((phase,i)=>({title:phase.title,settings:phase.options.map((options,j)=>`${ROLES[j]}: ${options[grid(r)[i][j]]}`)})):[]}}
