'use strict';
const {createHash,randomUUID}=require('node:crypto');
const fail=(message,status=403)=>{throw Object.assign(Error(message),{status});};
const digest=v=>createHash('sha256').update(v).digest('hex');
const normalizedEmail=s=>{const [a,b]=s.toLowerCase().split('@');return ['gmail.com','googlemail.com'].includes(b)?a.split('+')[0].replace(/\./g,'')+'@gmail.com':s.toLowerCase();};
const complete=p=>!!(p?.name&&p.age>=18&&p.gender&&p.city&&p.bio&&p.photos?.length);
function service(db,auth,now=Date.now){
 const ref=(c,id)=>db.collection(c).doc(String(id));
 async function track(uid,agent,issuedAt){
  if(!Number.isInteger(agent)||agent<1||agent>100)fail('INVALID_AGENT',400);
  const u=await auth.getUser(uid),created=Date.parse(u.metadata.creationTime);
  if(u.disabled||!u.emailVerified||!u.email)fail('VERIFY_EMAIL');
  if(!Number.isFinite(created)||created<issuedAt-1000||now()-issuedAt>7*86400000)fail('NEW_ACCOUNTS_ONLY');
  await db.runTransaction(async t=>{
   const claim=ref('chibwenziPromoterClaims',uid),stats=ref('chibwenziPromoterStats',agent);
   const [old,p,c,m,closed,count,agentRole]=await Promise.all([t.get(claim),t.get(ref('profiles',uid)),t.get(ref('chibwenziContacts',uid)),t.get(ref('chibwenziModeration',uid)),t.get(ref('chibwenziReferralClosed',uid)),t.get(stats),t.get(ref('chibwenziPromoterAccounts',agent))]);
   if(closed.exists)fail('ACCOUNT_UNAVAILABLE');
   if(old.exists)return;
   if(!agentRole.exists||agentRole.data().enabled!==true||agentRole.data().uid===uid)fail('INVALID_AGENT');
   if(!complete(p.data())||!/^\+260[79]\d{8}$/.test(c.data()?.phone||''))fail('COMPLETE_PROFILE');
   if(m.exists&&m.data().status!=='active')fail('ACCOUNT_UNAVAILABLE');
   const keys=[digest('email:'+normalizedEmail(u.email)),digest('phone:'+c.data().phone)];
   const ids=await Promise.all(keys.map(k=>t.get(ref('chibwenziPromoterIdentities',k))));
   if(ids.some(s=>s.exists))fail('ALREADY_COUNTED');
   t.create(claim,{agent,at:now(),status:'pending',identityKeys:keys});
   keys.forEach(k=>t.create(ref('chibwenziPromoterIdentities',k),{uid}));
   t.set(stats,{registered:(count.data()?.registered||0)+1,pending:(count.data()?.pending||0)+1},{merge:true});
  });
  await settle(uid);return {status:'counted'};
 }
 async function settle(uid){
  const u=await auth.getUser(uid);if(u.disabled||!u.emailVerified)return {status:'pending'};
  return db.runTransaction(async t=>{
   const claim=ref('chibwenziPromoterClaims',uid),snap=await t.get(claim);
   if(!snap.exists||snap.data().status!=='pending')return {status:'unchanged'};
   const c=snap.data(),stats=ref('chibwenziPromoterStats',c.agent),ledger=ref('chibwenziPromoterEarnings',digest(uid));
   const [p,m,closed,count,old,role]=await Promise.all([t.get(ref('profiles',uid)),t.get(ref('chibwenziModeration',uid)),t.get(ref('chibwenziReferralClosed',uid)),t.get(stats),t.get(ledger),t.get(ref('chibwenziPromoterAccounts',c.agent))]);
   if(closed.exists||!role.exists||!role.data().enabled||role.data().uid===uid||!complete(p.data())||p.data().verified!==true||p.data().verifyStatus!=='approved'||(m.exists&&m.data().status!=='active'))return {status:'pending'};
   if(old.exists)return {status:'unchanged'};
   const totals=count.data()||{};
   // Money is represented in integer ngwee: 200 ngwee = 2 ZMW.
   t.create(ledger,{agent:c.agent,amountNgwee:200,currency:'ZMW',at:now()});
   t.set(stats,{verified:(totals.verified||0)+1,pending:Math.max(0,(totals.pending||0)-1),earnedNgwee:(totals.earnedNgwee||0)+200},{merge:true});
   t.set(claim,{status:'approved',approvedAt:now()},{merge:true});return {status:'approved'};
  });
 }
 async function dashboard(uid){
  const role=await ref('chibwenziPromoterUsers',uid).get();
  if(!role.exists||role.data().enabled!==true)fail('PROMOTER_ACCESS_REQUIRED');
  const agent=role.data().agent,account=await ref('chibwenziPromoterAccounts',agent).get();
  if(!account.exists||!account.data().enabled||account.data().uid!==uid)fail('PROMOTER_ACCESS_REQUIRED');
  const totals=(await ref('chibwenziPromoterStats',agent).get()).data()||{};
  return {agent,username:account.data().username,name:account.data().name||'',link:'https://chibwenzi.com/?agent='+agent,registered:totals.registered||0,pending:totals.pending||0,verified:totals.verified||0,earnedNgwee:totals.earnedNgwee||0,currency:'ZMW',rewardNgwee:200};
 }
 async function admin(uid){
  const u=await auth.getUser(uid);if(u.disabled||!u.emailVerified||!u.email)fail('ADMIN_REQUIRED');
  const r=await ref('chibwenziAdmins',u.email).get();if(!r.exists||r.data().enabled!==true)fail('ADMIN_REQUIRED');
 }
 async function reconcile(uid,after){
  await admin(uid);
  if(after!==undefined&&(typeof after!=='string'||!/^[-\w]{1,128}$/.test(after)))fail('INVALID_CURSOR',400);
  let query=db.collection('chibwenziPromoterClaims').where('status','==','pending').orderBy('__name__').limit(100);
  if(after)query=query.startAfter(after);
  const pending=await query.get();
  let approved=0;
  for(const d of pending.docs){try{if((await settle(d.id)).status==='approved')approved++;}catch(e){if(e.code!=='auth/user-not-found')throw e;}}
  return {checked:pending.size,approved,nextCursor:pending.size===100?pending.docs.at(-1).id:null};
 }
 async function erase(uid){
  await db.runTransaction(async t=>{
   const claim=ref('chibwenziPromoterClaims',uid),s=await t.get(claim);if(!s.exists)return;
   const stats=ref('chibwenziPromoterStats',s.data().agent),count=await t.get(stats);
   if(s.data().status==='pending')t.set(stats,{pending:Math.max(0,(count.data()?.pending||0)-1)},{merge:true});
   // Historical aggregate earnings and the pseudonymous financial ledger remain.
   t.delete(claim);
  });
 }
 async function owner(uid){
  await admin(uid);const u=await auth.getUser(uid),r=await ref('chibwenziAdmins',u.email).get();
  if(u.email!=='aaci.yoni@gmail.com'&&!(u.email==='eltonmusakanya@gmail.com'&&r.data().fullAccess===true))fail('FULL_ADMIN_REQUIRED');
 }
 async function accounts(uid){await owner(uid);const docs=await db.collection('chibwenziPromoterAccounts').get();return {accounts:docs.docs.map(d=>({agent:Number(d.id),name:d.data().name||'',username:d.data().username||'',enabled:d.data().enabled===true,portal:'https://chibwenzi.com/promoters.html?agent='+d.id}))};}
 async function manage(uid,input){
  await owner(uid);
  const {agent,name,password}=input||{},username=String(input?.username||'').trim().toLowerCase(),enabled=input?.enabled!==false;
  if(!Number.isInteger(agent)||agent<1||agent>100||typeof name!=='string'||!name.trim()||name.length>120||!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username))fail('INVALID_AGENT_DETAILS',400);
  if(password!==undefined&&password!==''&&(typeof password!=='string'||password.length<12||password.length>128))fail('PASSWORD_MIN_12_CHARACTERS',400);
  const account=ref('chibwenziPromoterAccounts',agent),operation=randomUUID(),agentUid='chibwenzi-promoter-'+String(agent).padStart(3,'0');
  await db.runTransaction(async t=>{const old=await t.get(account);if(old.data()?.operation)fail('ACCOUNT_UPDATE_IN_PROGRESS',409);if(!old.exists&&!password)fail('PASSWORD_REQUIRED',400);if(old.exists&&old.data().uid!==agentUid)fail('ACCOUNT_REQUIRES_OPERATOR_REVIEW',409);t.set(account,{uid:agentUid,enabled:false,operation},{merge:true});});
  try{
   const changes={email:username+'@promoters.chibwenzi.com',displayName:name.trim(),disabled:!enabled};if(password)changes.password=password;
   let exists=true;try{await auth.getUser(agentUid);}catch(e){if(e.code==='auth/user-not-found')exists=false;else throw e;}
   if(exists)await auth.updateUser(agentUid,changes);else{if(!password)fail('PASSWORD_REQUIRED',400);await auth.createUser({uid:agentUid,...changes,emailVerified:false});}
   if(exists)await auth.revokeRefreshTokens(agentUid);
   await db.runTransaction(async t=>{const current=await t.get(account);if(current.data()?.operation!==operation)fail('ACCOUNT_UPDATE_CONFLICT',409);
    t.set(account,{uid:agentUid,username,name:name.trim(),enabled,updatedAt:now()});t.set(ref('chibwenziPromoterUsers',agentUid),{agent,enabled});
    t.create(ref('chibwenziPromoterAdminAudit',operation),{actor:uid,agent,action:'account-update',passwordChanged:!!password,enabled,at:now()});
   });
   return {agent,username,name:name.trim(),enabled,portal:'https://chibwenzi.com/promoters.html?agent='+agent,link:'https://chibwenzi.com/?agent='+agent};
  }catch(e){await db.runTransaction(async t=>{const current=await t.get(account);if(current.data()?.operation===operation)t.set(account,{operation:null,enabled:false},{merge:true});});if(e.code==='auth/email-already-exists')fail('USERNAME_UNAVAILABLE',409);if(e.status)throw e;fail('ACCOUNT_UPDATE_FAILED_RETRY',503);}
 }
 return {track,settle,dashboard,admin,reconcile,erase,accounts,manage};
}
module.exports={service};
