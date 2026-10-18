import { database } from '../lib/game/storage';
import { createRoom, joinRoom, transition, view, type Room } from '../lib/game/engine';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function POST(req:Request){
 try{
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return Response.json({error:'This request must come from the game.'},{status:403,headers});
 const text=await req.text();if(text.length>2048)return Response.json({error:'Request too large.'},{status:413,headers});
 let b;try{b=JSON.parse(text)}catch{return Response.json({error:'Invalid request.'},{status:400,headers})}
 if(!b||typeof b!=='object')throw Error('Invalid request.');const db=database();
 const name=typeof b.name==='string'?b.name.trim().slice(0,18):'';
 if(b.action==='create'){
 if(!name)throw Error('Enter your callsign.');
 for(let i=0;i<4;i++){
 const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const code=Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>chars[n%chars.length]).join('');
 const {room,token}=createRoom(code,name,b.practice===true);
 const res=await db.prepare('INSERT OR IGNORE INTO rooms (code,state,revision,expires) VALUES (?,?,0,?)').bind(code,JSON.stringify(room),Date.now()+86400000).run();
 if(res.meta.changes)return Response.json({token,game:{...view(room,token),revision:0}},{headers});
 }throw Error('Could not create a room. Try again.');
 }
 const code=typeof b.code==='string'?b.code.toUpperCase():'';if(!/^[A-Z2-9]{6}$/.test(code))throw Error('Enter the six-character room code.');
 for(let attempt=0;attempt<6;attempt++){
 const row=await db.prepare('SELECT state,revision,expires FROM rooms WHERE code=?').bind(code).first<{state:string;revision:number;expires:number}>();
 if(!row||row.expires<Date.now())throw Error('Room not found or expired. Rooms last 24 hours.');
 const room:Room=JSON.parse(row.state);let token=typeof b.token==='string'?b.token:'';
 if(b.action==='join'){if(!name)throw Error('Enter your callsign.');token=joinRoom(room,name)}
 else if(b.action==='read'){
 const previousStatus=room.status;const game=view(room,token);
 if(previousStatus===room.status)return Response.json({game:{...game,revision:row.revision}},{headers});
 // A read can expire a running mission. Persist that outcome through the same
 // compare-and-swap path as player actions, retrying if another player updated it.
 }
 else transition(room,token,b);
 const result=await db.prepare('UPDATE rooms SET state=?,revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(room),code,row.revision).run();
 if(result.meta.changes&&b.action==='leave')return Response.json({left:true},{headers});
 if(result.meta.changes)return Response.json({game:{...view(room,token),revision:row.revision+1},...(b.action==='join'?{token}:{})},{headers});
 }return Response.json({error:'The crew updated the mission. Please try that action again.'},{status:409,headers});
 }catch(e){const msg=e instanceof Error?e.message:'Unable to contact the station.';const storage=/D1|SQLITE|storage|database/i.test(msg);if(storage)console.error(e);return Response.json({error:storage?'The station is temporarily unavailable. Please try again.':msg},{status:storage?503:400,headers})}
}

