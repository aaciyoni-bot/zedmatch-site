// Run only in a trusted environment with Application Default Credentials.
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
async function main(){const [project,email,mode]=process.argv.slice(2);if(!project||!email||!['grant','revoke'].includes(mode))throw Error('Usage: node set-role.cjs PROJECT_ID EMAIL grant|revoke');initializeApp({credential:applicationDefault(),projectId:project});const user=await getAuth().getUserByEmail(email);if(!user.emailVerified||user.disabled)throw Error('An enabled, verified account is required');const db=getFirestore();await db.doc('chibwenziAdmins/'+user.email).set({enabled:mode==='grant',updatedAt:FieldValue.serverTimestamp(),source:'trusted-owner-tool'});console.log('Role updated. Sign in again to update the dashboard.');}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
