// Each admitted request consumes its quota in one SQLite statement. Initialization,
// expiry reset, admission and increment are serialized by D1, not by this isolate.
export async function limited(db:D1Database,key:string,limit:number,windowMs:number){
 const now=Date.now();
 const admitted=await db.prepare(`
  INSERT INTO rate_limits (bucket,count,reset_at) VALUES (?,1,?)
  ON CONFLICT(bucket) DO UPDATE SET
   count=CASE WHEN reset_at<=? THEN 1 ELSE count+1 END,
   reset_at=CASE WHEN reset_at<=? THEN excluded.reset_at ELSE reset_at END
  WHERE reset_at<=? OR count<?
  RETURNING count
 `).bind(key,now+windowMs,now,now,now,limit).first<{count:number}>();
 return admitted===null;
}

// Public inputs never become durable bucket keys. A fixed number of IP hash
// slots bounds storage even when an attacker varies codes, tokens or source IPs.
// Collisions may share an anonymous allowance; valid gameplay bypasses it.
export async function publicKey(scope:'create'|'join'|'abuse',request:Request){
 const ip=request.headers.get('cf-connecting-ip')||'local';
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip)));
 const slot=((digest[0]<<8)|digest[1])%1024;
 return `${scope}:${slot}`;
}
