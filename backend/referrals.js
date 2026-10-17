'use strict';
const {createHash,randomBytes}=require('node:crypto');
const emailKey=s=>{const [local,domain]=s.toLowerCase().split('@');return ['gmail.com','googlemail.com'].includes(domain)?local.split('+')[0].replace(/\./g,'')+'@gmail.com':s.toLowerCase();};
const hash=s=>createHash('sha256').update(s).digest('hex');
const day=ms=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lusaka',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(ms));
const fail=(code,status=409)=>{throw Object.assign(new Error(code),{status});};
const complete=p=>!!(p&&p.name&&p.age>=18&&p.gender&&p.city&&p.bio&&p.photos?.length);
const active=m=>!m||m.status==='active';
function service(db,auth,now=Date.now){
 const ref=(c,id)=>db.collection(c).doc(id);
 async function member(uid){
  const [p,m,c,u]=await Promise.all([ref('profiles',uid).get(),ref('chibwenziModeration',uid).get(),ref('chibwenziContacts',uid).get(),auth.getUser(uid)]);
  if(u.disabled||!active(m.data()))fail('ACCOUNT_UNAVAILABLE',403);
  if(!complete(p.data())||!/^\+260[79]\d{8}$/.test(c.data()?.phone||''))fail('COMPLETE_PROFILE',403);
  if(!u.emailVerified||!u.email)fail('VERIFY_EMAIL',403);
  return {profile:p.data(),phone:c.data().phone,user:u};
 }
 async function wallet(uid){return (await ref('chibwenziWallets',uid).get()).data()?.balance||0;}
 async function invite(uid){
  await member(uid);const owner=ref('chibwenziInviteOwners',uid);
  const code=await db.runTransaction(async t=>{const [s,closed]=await Promise.all([t.get(owner),t.get(ref('chibwenziReferralClosed',uid))]);if(closed.exists)fail('ACCOUNT_UNAVAILABLE',403);if(s.exists)return s.data().code;
   const code=randomBytes(18).toString('hex');t.create(ref('chibwenziInviteCodes',code),{uid,createdAt:now()});t.create(owner,{code});return code;});
  return {code,balance:await wallet(uid),inviterReward:5,newMemberReward:3,dailyLimit:25};
 }
 async function claim(uid,code){
  if(!/^[a-f0-9]{36}$/.test(code||''))fail('INVALID_INVITE',400);
  const newcomer=await member(uid);const created=Date.parse(newcomer.user.metadata.creationTime);
  if(!Number.isFinite(created))fail('ACCOUNT_INELIGIBLE');
  const inviteRef=ref('chibwenziInviteCodes',code),claimRef=ref('chibwenziReferralClaims',uid);
  return db.runTransaction(async t=>{
   const [inv,previous]=await Promise.all([t.get(inviteRef),t.get(claimRef)]);
   if(previous.exists)return {status:'already_claimed'};
   if(!inv.exists||inv.data().uid===uid)fail('INVALID_INVITE');
   const host=inv.data().uid;
   const closed=await Promise.all([t.get(ref('chibwenziReferralClosed',uid)),t.get(ref('chibwenziReferralClosed',host))]);if(closed.some(s=>s.exists))fail('ACCOUNT_UNAVAILABLE',403);
   if(created<inv.data().createdAt||now()-created>7*86400000)fail('NEW_ACCOUNTS_ONLY');
   const keys=[ref('chibwenziReferralIdentities',hash('email:'+emailKey(newcomer.user.email))),ref('chibwenziReferralIdentities',hash('phone:'+newcomer.phone))];
   const hWallet=ref('chibwenziWallets',host),nWallet=ref('chibwenziWallets',uid),daily=ref('chibwenziReferralDays',host+'_'+day(now()));
   const [hp,hm,hc,hw,nw,count,...identities]=await Promise.all([t.get(ref('profiles',host)),t.get(ref('chibwenziModeration',host)),t.get(ref('chibwenziContacts',host)),t.get(hWallet),t.get(nWallet),t.get(daily),...keys.map(r=>t.get(r))]);
   if(!complete(hp.data())||!active(hm.data()))fail('INVITER_UNAVAILABLE');
   if(hc.data()?.phone===newcomer.phone||(hc.data()?.email ? emailKey(hc.data().email) : '')===emailKey(newcomer.user.email)||identities.some(x=>x.exists))fail('ALREADY_REWARDED');
   if((count.data()?.credits||0)>=25)fail('DAILY_LIMIT');
   t.set(hWallet,{balance:(hw.data()?.balance||0)+5},{merge:true});t.set(nWallet,{balance:(nw.data()?.balance||0)+3},{merge:true});
   t.set(daily,{uid:host,credits:(count.data()?.credits||0)+5});t.create(claimRef,{inviter:host,at:now(),inviterCredits:5,newMemberCredits:3});
   keys.forEach(r=>t.create(r,{uid,at:now()}));return {status:'rewarded',credits:3};
  });
 }
 async function spend(uid,target){
  if(typeof target!=='string'||!/^[-\w]{1,128}$/.test(target)||target===uid)fail('INVALID_TARGET',400);
  await member(uid);
  return db.runTransaction(async t=>{
   const w=ref('chibwenziWallets',uid),op=ref('chibwenziCreditLikes',hash(uid+':'+target)),swipe=ref('swipes',uid+'_'+target);
   const [old,bal,p,m,own,reciprocal,priorSwipe]=await Promise.all([t.get(op),t.get(w),t.get(ref('profiles',target)),t.get(ref('chibwenziModeration',target)),t.get(ref('profiles',uid)),t.get(ref('swipes',target+'_'+uid)),t.get(swipe)]);
   const closed=await t.get(ref('chibwenziReferralClosed',uid));if(closed.exists)fail('ACCOUNT_UNAVAILABLE',403);
   if(old.exists)return old.data();
   if(!complete(p.data())||!active(m.data())||own.data()?.blockedIds?.includes(target)||p.data()?.blockedIds?.includes(uid))fail('TARGET_UNAVAILABLE');
   if(['like','super'].includes(priorSwipe.data()?.action))fail('ALREADY_LIKED');
   const balance=bal.data()?.balance||0;if(balance<1)fail('NO_CREDITS');
   const matched=['like','super'].includes(reciprocal.data()?.action);const result={balance:balance-1,matched};
   t.set(w,{balance:balance-1},{merge:true});t.create(op,{...result,uid,target});t.set(swipe,{by:uid,target,action:'like',at:now()});
   if(matched){const users=[uid,target].sort(),brief=x=>({name:x.name,city:x.city,photo:x.photos[0]});t.set(ref('matches',users.join('_')),{users,at:now(),profiles:{[uid]:brief(own.data()),[target]:brief(p.data())}},{merge:true});}
   return result;
  });
 }
 async function erase(uid){
  // Lock issuance before cleanup; in-flight transactions read this document and retry.
  await ref('chibwenziReferralClosed',uid).set({closed:true});
  const owner=await ref('chibwenziInviteOwners',uid).get();
  const direct=[ref('chibwenziWallets',uid),ref('chibwenziInviteOwners',uid),ref('chibwenziReferralClaims',uid)];
  if(owner.exists)direct.push(ref('chibwenziInviteCodes',owner.data().code));
  await Promise.all(direct.map(r=>r.delete()));
  for(const [collection,field] of [['chibwenziInviteCodes','uid'],['chibwenziReferralClaims','inviter'],['chibwenziReferralIdentities','uid'],['chibwenziReferralDays','uid'],['chibwenziCreditLikes','uid'],['chibwenziCreditLikes','target']]){
   let snap;
   do{snap=await db.collection(collection).where(field,'==',uid).limit(300).get();if(snap.empty)break;const batch=db.batch();snap.docs.forEach(d=>batch.delete(d.ref));await batch.commit();}while(snap.size===300);
  }
  // Minimal closed-UID marker prevents a still-valid session recreating deleted ledgers.
  return {deleted:true};
 }
 return {invite,claim,spend,wallet,erase};
}
function install(app){
 let api,admin;
 const enabled=()=>process.env.CHIBWENZI_REFERRALS_ENABLED==='true'&&!!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
 app.get('/api/referrals/config',(_,res)=>res.json({enabled:enabled(),deletionAvailable:!!process.env.FIREBASE_SERVICE_ACCOUNT_JSON}));
 app.use('/api/referrals',async(req,res,next)=>{
  if(!enabled() && !(req.path==='/delete'&&process.env.FIREBASE_SERVICE_ACCOUNT_JSON))return res.status(503).json({error:'REFERRALS_UNAVAILABLE'});
  try{
   if(!api){admin=require('firebase-admin');const credentials=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);if(credentials.project_id!=='rummikube-b2188')throw Error('WRONG_PROJECT');
    const a=admin.initializeApp({credential:admin.credential.cert(credentials)},'chibwenzi-referrals');api=service(a.firestore(),a.auth());}
   const token=/^Bearer (.+)$/.exec(req.headers.authorization||'')?.[1];if(!token)return res.status(401).json({error:'SIGN_IN_REQUIRED'});
   const decoded=await admin.app('chibwenzi-referrals').auth().verifyIdToken(token,true);
   if(decoded.firebase?.sign_in_provider==='anonymous')return res.status(401).json({error:'SIGN_IN_REQUIRED'});req.memberUid=decoded.uid;next();
  }catch(e){console.warn('referral authentication',e.code||'unavailable');res.status(401).json({error:'SIGN_IN_REQUIRED'});}
 });
 const route=fn=>async(req,res)=>{try{res.json(await fn(req));}catch(e){console.warn('referral request',e.status?e.message:'service-error');res.status(e.status||503).json({error:e.status?e.message:'SERVICE_UNAVAILABLE'});}};
 app.post('/api/referrals/invite',route(r=>api.invite(r.memberUid)));
 app.post('/api/referrals/claim',route(r=>api.claim(r.memberUid,r.body?.code)));
 app.post('/api/referrals/delete',route(r=>api.erase(r.memberUid)));
 app.post('/api/referrals/like',route(r=>api.spend(r.memberUid,r.body?.target)));
}
module.exports={service,install,day,complete};
