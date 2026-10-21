const assert=require('node:assert/strict');
const {service,day}=require('./referrals');
const clock=Date.UTC(2026,9,17,12);let time=clock;
const docs=new Map(),users=new Map();let queue=Promise.resolve();
const profile={name:'Test',age:25,gender:'f',city:'Ndola',bio:'Testing',photos:['photo']};
function snapshot(key){const value=docs.get(key);return {exists:docs.has(key),data:()=>value};}
const docRef=key=>({key,get:async()=>snapshot(key),set:async v=>docs.set(key,v),delete:async()=>docs.delete(key)});
const db={batch:()=>{const pending=[];return{delete:r=>pending.push(r.key),commit:async()=>pending.forEach(k=>docs.delete(k))}},collection:c=>({
 doc:id=>docRef(c+'/'+id),
 where:(field,op,uid)=>({limit:n=>({get:async()=>{
  const found=[...docs].filter(([k,v])=>k.startsWith(c+'/')&&v[field]===uid).slice(0,n);
  return {empty:!found.length,size:found.length,docs:found.map(([key])=>({ref:docRef(key)}))};
 }})})
}),runTransaction:fn=>{const next=queue.then(async()=>{const writes=[];const result=await fn({get:async r=>snapshot(r.key),delete:r=>writes.push(()=>docs.delete(r.key)),set:(r,v,o)=>writes.push(()=>docs.set(r.key,o?.merge?{...docs.get(r.key),...v}:v)),create:(r,v)=>{assert(!docs.has(r.key));writes.push(()=>docs.set(r.key,v));}});writes.forEach(w=>w());return result;});queue=next.catch(()=>{});return next;}};
function add(uid,n){docs.set('profiles/'+uid,{...profile});docs.set('chibwenziContacts/'+uid,{phone:'+26097'+String(n).padStart(7,'0'),email:uid+'@example.test'});users.set(uid,{email:uid+'@example.test',emailVerified:true,metadata:{creationTime:new Date(clock+1000).toISOString()}});}
const mockAuth={getUser:async uid=>{if(!users.has(uid))throw Object.assign(Error('missing'),{code:'auth/user-not-found'});return users.get(uid);},createUser:async data=>{if([...users.values()].some(u=>u.email===data.email))throw Object.assign(Error('duplicate'),{code:'auth/email-already-exists'});users.set(data.uid,{...data});},updateUser:async(uid,data)=>users.set(uid,{...users.get(uid),...data}),revokeRefreshTokens:async()=>{}};
const api=service(db,mockAuth,()=>time);
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
 await api.erase('a');assert.equal(await api.wallet('a'),0);assert(!docs.has('chibwenziReferralClaims/a'));assert(![...docs].some(([k,v])=>k.startsWith('chibwenziReferralIdentities/')&&v.uid==='a'));await assert.rejects(api.invite('a'),/ACCOUNT_UNAVAILABLE/);await api.erase('a');
 docs.set('chibwenziPromoterAccounts/1',{uid:'promoter-one',username:'agent001',enabled:true});docs.set('chibwenziPromoterUsers/promoter-one',{agent:1,enabled:true});
 add('promoted',99);time=clock+2000;
 await Promise.all([api.promoterClaim('promoted',1,clock),api.promoterClaim('promoted',1,clock)]);
 assert.equal(docs.get('chibwenziPromoterStats/1').registered,1);
 await api.promoterClaim('promoted',100,clock);assert(!docs.has('chibwenziPromoterStats/100'));
 add('promotedDuplicate',99);await assert.rejects(api.promoterClaim('promotedDuplicate',1,clock),/ALREADY_COUNTED/);
 await assert.rejects(api.promoterClaim('old',1,clock),/NEW_ACCOUNTS_ONLY/);
 await assert.rejects(api.promoterClaim('unverified',1,clock),/VERIFY_EMAIL/);
 await assert.rejects(api.promoterClaim('promoted',101,clock),/INVALID_AGENT/);
 assert.equal((await api.promoters.dashboard('promoter-one')).earnedNgwee,0);
 docs.get('profiles/promoted').verified=true;docs.get('profiles/promoted').verifyStatus='approved';
 await Promise.all([api.promoters.settle('promoted'),api.promoters.settle('promoted')]);
 const dashboard=await api.promoters.dashboard('promoter-one');assert.equal(dashboard.earnedNgwee,200);assert.equal(dashboard.verified,1);assert.equal(dashboard.pending,0);
 await assert.rejects(api.promoters.dashboard('a'),/PROMOTER_ACCESS_REQUIRED/);
 docs.get('chibwenziPromoterAccounts/1').enabled=false;await assert.rejects(api.promoters.dashboard('promoter-one'),/PROMOTER_ACCESS_REQUIRED/);docs.get('chibwenziPromoterAccounts/1').enabled=true;
 await api.erase('promoted');assert(!docs.has('chibwenziPromoterClaims/promoted'));assert.equal(docs.get('chibwenziPromoterStats/1').registered,1);
 await assert.rejects(api.promoterClaim('promoted',1,clock),/ACCOUNT_UNAVAILABLE/);
 const tickets=require('./promoter-tickets'),ticket=tickets.issue(100,'test-only',clock);
 assert.equal(tickets.verify(ticket,'test-only',clock+1000).agent,100);
 assert.throws(()=>tickets.verify(ticket,'wrong',clock+1000));assert.throws(()=>tickets.verify(ticket,'test-only',clock+8*86400000));assert.throws(()=>tickets.issue(101,'test-only',clock));
 assert.equal((await api.promoters.dashboard('promoter-one')).earnedNgwee,200);
 add('owner-account',200);users.get('owner-account').email='aaci.yoni@gmail.com';docs.set('chibwenziAdmins/aaci.yoni@gmail.com',{enabled:true});
 await api.promoters.manage('owner-account',{agent:2,name:'Test promoter',username:'test.agent',password:'test-only-strong-password',enabled:true});
 assert.equal(docs.get('chibwenziPromoterAccounts/2').username,'test.agent');assert.equal(users.get('chibwenzi-promoter-002').email,'test.agent@promoters.chibwenzi.com');
 assert(!JSON.stringify([...docs]).includes('test-only-strong-password'));
 await api.promoters.manage('owner-account',{agent:2,name:'Updated name',username:'new.agent',password:'',enabled:false});
 assert.equal(docs.get('chibwenziPromoterAccounts/2').enabled,false);assert.equal(users.get('chibwenzi-promoter-002').disabled,true);
 await assert.rejects(api.promoters.manage('a',{agent:3,name:'Test',username:'agent3',password:'test-password-123'}),/ADMIN_REQUIRED/);
 await assert.rejects(api.promoters.manage('owner-account',{agent:3,name:'Test',username:'agent3',password:'short'}),/PASSWORD_MIN/);
 console.log('PASS admin-defined name, username, password, account disable, no plaintext password records, unauthorized denial;');
 console.log('PASS 2 ZMW commission, verification gate, atomic duplicate protection, isolated account dashboard;');
 console.log('PASS promoter attribution, deduplication, old-account exclusion, validation, retained anonymous totals, signed tickets;');
 console.log('PASS cleanup and issuance lock; stable private invite, duplicate claims, self invite, old accounts, verified email, duplicate phone, profile completion, daily cap, Zambia rollover, persistent balance, atomic credit like/match, idempotent retry, suspension, zero balance');
})().catch(e=>{console.error(e);process.exitCode=1});
