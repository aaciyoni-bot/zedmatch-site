const assert=require('node:assert/strict');
const {service,day}=require('./referrals');
const clock=Date.UTC(2026,9,17,12);let time=clock;
const docs=new Map(),users=new Map();let queue=Promise.resolve();
const profile={name:'Test',age:25,gender:'f',city:'Ndola',bio:'Testing',photos:['photo']};
function snapshot(key){const value=docs.get(key);return {exists:docs.has(key),data:()=>value};}
const db={collection:c=>({doc:id=>({key:c+'/'+id,get:async()=>snapshot(c+'/'+id)})}),runTransaction:fn=>{const next=queue.then(async()=>{const writes=[];const result=await fn({get:async r=>snapshot(r.key),set:(r,v,o)=>writes.push(()=>docs.set(r.key,o?.merge?{...docs.get(r.key),...v}:v)),create:(r,v)=>{assert(!docs.has(r.key));writes.push(()=>docs.set(r.key,v));}});writes.forEach(w=>w());return result;});queue=next.catch(()=>{});return next;}};
function add(uid,n){docs.set('profiles/'+uid,{...profile});docs.set('chibwenziContacts/'+uid,{phone:'+26097'+String(n).padStart(7,'0'),email:uid+'@example.test'});users.set(uid,{email:uid+'@example.test',emailVerified:true,metadata:{creationTime:new Date(clock+1000).toISOString()}});}
const api=service(db,{getUser:async uid=>users.get(uid)},()=>time);
(async()=>{
 add('host',1);const invite=await api.invite('host');assert.equal(invite.code.length,36);assert.equal((await api.invite('host')).code,invite.code);
 add('a',2);time=clock+2000;
 await Promise.all([api.claim('a',invite.code),api.claim('a',invite.code)]);
 assert.equal(await api.wallet('host'),5);assert.equal(await api.wallet('a'),3);
 await assert.rejects(api.claim('host',invite.code),/INVALID_INVITE/);
 add('old',3);users.get('old').metadata.creationTime=new Date(clock-86400000).toISOString();await assert.rejects(api.claim('old',invite.code),/NEW_ACCOUNTS_ONLY/);
 add('unverified',4);users.get('unverified').emailVerified=false;await assert.rejects(api.claim('unverified',invite.code),/VERIFY_EMAIL/);
 add('duplicate',2);await assert.rejects(api.claim('duplicate',invite.code),/ALREADY_REWARDED/);
 add('incomplete',5);docs.get('profiles/incomplete').bio='';await assert.rejects(api.claim('incomplete',invite.code),/COMPLETE_PROFILE/);
 for(let i=0;i<4;i++){add('friend'+i,10+i);await api.claim('friend'+i,invite.code);}assert.equal(await api.wallet('host'),25);
 add('wait',20);await assert.rejects(api.claim('wait',invite.code),/DAILY_LIMIT/);assert.equal(await api.wallet('wait'),0);
 time+=86400000;await api.claim('wait',invite.code);assert.equal(await api.wallet('host'),30);
 add('target',30);docs.set('swipes/target_a',{action:'like'});
 await Promise.all([api.spend('a','target'),api.spend('a','target')]);assert.equal(await api.wallet('a'),2);assert(docs.has('matches/a_target'));
 add('blocked',31);docs.set('chibwenziModeration/blocked',{status:'suspended'});await assert.rejects(api.spend('a','blocked'),/TARGET_UNAVAILABLE/);assert.equal(await api.wallet('a'),2);
 add('zero',32);await assert.rejects(api.spend('zero','target'),/NO_CREDITS/);assert(!docs.has('swipes/zero_target'));
 assert.equal(day(Date.UTC(2026,9,17,21,59)),day(Date.UTC(2026,9,17,0)));assert.notEqual(day(Date.UTC(2026,9,17,22)),day(Date.UTC(2026,9,17,0)));
 console.log('PASS stable private invite, duplicate claims, self invite, old accounts, verified email, duplicate phone, profile completion, daily cap, Zambia rollover, persistent balance, atomic credit like/match, idempotent retry, suspension, zero balance');
})().catch(e=>{console.error(e);process.exitCode=1});
