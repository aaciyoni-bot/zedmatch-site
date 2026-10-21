
'use strict';
const {createHmac,timingSafeEqual}=require('node:crypto');
const sign=(payload,secret)=>createHmac('sha256',secret).update('chibwenzi-promoter:'+payload).digest('hex');
function issue(agent,secret,now=Date.now()){
 if(!Number.isInteger(agent)||agent<1||agent>100)throw Error('INVALID_AGENT');
 const payload=Buffer.from(JSON.stringify({agent,at:now})).toString('base64url');return payload+'.'+sign(payload,secret);
}
function verify(ticket,secret,now=Date.now()){
 const invalid=()=>{throw Object.assign(Error('INVALID_AGENT_TICKET'),{status:400});};
 if(typeof ticket!=='string'||ticket.length>300)invalid();
 const [payload,sig,extra]=ticket.split('.');if(extra||!/^[a-f0-9]{64}$/.test(sig||''))invalid();
 if(!timingSafeEqual(Buffer.from(sign(payload,secret)),Buffer.from(sig)))invalid();
 let data;try{data=JSON.parse(Buffer.from(payload,'base64url'));}catch(_){invalid();}
 if(!Number.isInteger(data.agent)||data.agent<1||data.agent>100||!Number.isFinite(data.at)||data.at>now||now-data.at>7*86400000)invalid();return data;
}
module.exports={issue,verify};
