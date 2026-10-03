// Run only in a trusted environment with Google Application Default Credentials.
// No credentials are accepted from or exposed to the website.
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
async function main(){const [project,email,mode]=process.argv.slice(2);if(!project||!email||!['grant','revoke'].includes(mode))throw Error('Usage: node set-role.cjs PROJECT_ID EMAIL grant|revoke');initializeApp({credential:applicationDefault(),projectId:project});const auth=getAuth();const user=await auth.getUserByEmail(email);if(!user.emailVerified||user.disabled)throw Error('An enabled, verified account is required');const claims={...user.customClaims};if(mode==='grant')claims.chibwenziAdmin=true;else delete claims.chibwenziAdmin;await auth.setCustomUserClaims(user.uid,claims);if(mode==='revoke')await auth.revokeRefreshTokens(user.uid);console.log(`Chibwenzi administrator role ${mode} completed. Sign out and sign in again.`);}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
