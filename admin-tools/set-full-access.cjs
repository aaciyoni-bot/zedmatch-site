// Trusted operator only. Requires existing enabled administrator; never creates a new one.
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
(async()=>{
 const [email,mode]=process.argv.slice(2);
 if(!email||!['inspect','grant','revoke'].includes(mode))throw Error('Usage: node set-full-access.cjs EXACT_EMAIL inspect|grant|revoke');
 initializeApp({credential:applicationDefault(),projectId:'rummikube-b2188'});
 const account=await getAuth().getUserByEmail(email);
 if(!account.emailVerified||account.disabled)throw Error('Enabled, verified account required');
 const db=getFirestore(),ref=db.doc('chibwenziAdmins/'+account.email);
 await db.runTransaction(async t=>{
  const before=await t.get(ref);if(!before.exists||before.data().enabled!==true)throw Error('Existing enabled administrator required');
  console.log(JSON.stringify({email:account.email,uid:account.uid,enabled:true,fullAccess:before.data().fullAccess===true,mode}));
  if(mode!=='inspect'){
   t.update(ref,{fullAccess:mode==='grant',updatedAt:FieldValue.serverTimestamp(),source:'trusted-owner-tool'});
   t.create(db.collection('chibwenziRoleAudit').doc(),{email:account.email,previousFullAccess:before.data().fullAccess===true,fullAccess:mode==='grant',at:FieldValue.serverTimestamp(),source:'trusted-owner-tool'});
  }
 });
})().catch(e=>{console.error(e.message);process.exitCode=1;});
