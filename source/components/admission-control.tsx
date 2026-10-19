import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

export function AdmissionControl({open,captain,busy,onReopen}:{open:boolean;captain:boolean;busy:boolean;onReopen:()=>Promise<void>}){
 const [confirm,setConfirm]=useState(false);
 if(open)return null;
 return <div className="notice" role="status"><div>
  <p>New joins are paused after a captain removal. Existing crew can still reconnect. This stays paused through rematches.</p>
  {captain&&<Dialog open={confirm} onOpenChange={setConfirm}><DialogTrigger asChild><Button variant="outline" disabled={busy}>Reopen joining</Button></DialogTrigger><DialogContent className="help-dialog"><DialogHeader><DialogTitle>Allow new players to join?</DialogTitle><DialogDescription>Anyone who knows this room code can join, including someone previously removed. Share the code only with your intended crew.</DialogDescription></DialogHeader><Button variant="outline" autoFocus onClick={()=>setConfirm(false)}>Keep joining paused</Button><Button disabled={busy} onClick={async()=>{await onReopen();setConfirm(false)}}>Confirm reopen joining</Button></DialogContent></Dialog>}
 </div></div>;
}
