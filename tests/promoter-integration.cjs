const assert=require('node:assert/strict');
const admin=require('../backend/node_modules/firebase-admin');
if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Emulator required');
admin.initializeApp({projectId:'demo-chibwenzi'});
const db=admin.firestore(),auth=admin.auth();
const api=require('../backend/promoters').service(db,auth);
(async()=>{
 const owner='integration-owner',stamp=Date.now();await auth.createUser({uid:owner,email:'aaci.yoni@gmail.com',emailVerified:true});
 await db.doc('chibwenziAdmins/aaci.yoni@gmail.com').set({enabled:true});
 await api.manage(owner,{agent:99,name:'Emulator test',username:'emulator.test',password:'emulator-only-password'});
 const login=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'emulator.test@promoters.chibwenzi.com',password:'emulator-only-password',returnSecureToken:true})});assert.equal(login.status,200);const session=await login.json();const decoded=await auth.verifyIdToken(session.idToken,true);assert.equal(decoded.uid,'chibwenzi-promoter-099');
 for(let i=0;i<2;i++){
  const uid='integration-member-'+i;await auth.createUser({uid,email:uid+'@example.test',emailVerified:true});
  await db.doc('profiles/'+uid).set({name:'Emulator',age:25,gender:'f',city:'Ndola',bio:'Test',photos:['test']});
  await db.doc('chibwenziContacts/'+uid).set({phone:'+26097900000'+i});
 }
 await Promise.all([api.track('integration-member-0',99,stamp),api.track('integration-member-0',99,stamp)]);
 assert.equal((await api.dashboard('chibwenzi-promoter-099')).registered,1);
 await api.track('integration-member-1',99,stamp);
 await db.doc('profiles/integration-member-0').update({verified:true,verifyStatus:'approved'});
 await Promise.all([api.settle('integration-member-0'),api.settle('integration-member-0')]);
 let stats=await api.dashboard('chibwenzi-promoter-099');assert.equal(stats.earnedNgwee,200);assert.equal(stats.pending,1);
 await assert.rejects(api.dashboard('integration-member-0'),/PROMOTER_ACCESS_REQUIRED/);
 await assert.rejects(api.manage('integration-member-0',{agent:98}),/ADMIN_REQUIRED/);
 const batch=db.batch();for(let i=0;i<101;i++){let id='pending-'+String(i).padStart(3,'0');await auth.createUser({uid:id,email:id+'@example.test',emailVerified:true});batch.set(db.doc('chibwenziPromoterClaims/'+id),{agent:99,status:'pending'});}await batch.commit();
 const page=await api.reconcile(owner);assert.equal(page.checked,100);assert(page.nextCursor);const next=await api.reconcile(owner,page.nextCursor);assert.equal(next.checked,2);assert.equal(next.nextCursor,null);
 await api.manage(owner,{agent:99,name:'Renamed',username:'emulator.changed',password:'changed-test-password',enabled:false});
 await assert.rejects(api.dashboard('chibwenzi-promoter-099'),/PROMOTER_ACCESS_REQUIRED/);
 assert.equal((await auth.getUser('chibwenzi-promoter-099')).disabled,true);
 console.log('PASS real Firebase Auth credential creation, login, token verification, disable; ');
 console.log('PASS real Firestore concurrent claims/settlements, 2 ZMW exactly once, verification gate, account isolation, pagination beyond 100');
 await admin.app().delete();
})().catch(e=>{console.error(e);process.exitCode=1;});
