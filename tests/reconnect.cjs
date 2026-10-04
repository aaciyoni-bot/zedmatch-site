const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
for (const s of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(s[1]);
const code=html.slice(html.indexOf('// A failed read is never'),html.indexOf('let bootPromise'));
function setup(sequence){
 const calls=[]; const user={uid:'member',getIdToken:async()=>{calls.push('refresh')}};
 const c={setTimeout:(fn,ms)=>setTimeout(fn,ms===800?0:ms),clearTimeout,console:{warn(){}},navigator:{onLine:true},FB:{uid:'member',auth:{currentUser:user},fs:{doc:(_,name,uid)=>({name,uid}),getDocFromServer:async()=>{calls.push('read');const step=sequence.shift();if(step instanceof Error)throw step;return step;}}}};
 vm.createContext(c);vm.runInContext(code,c);return{c,calls};
}
const err=code=>Object.assign(new Error(code),{code});
(async()=>{
 let t=setup([err('unavailable'),{exists:()=>true}]);assert((await t.c.cbReadOwnDocument('profiles')).exists());assert.deepEqual(t.calls,['read','read']);
 t=setup([err('permission-denied'),err('permission-denied')]);await assert.rejects(t.c.cbReadOwnDocument('profiles'),{code:'permission-denied'});assert.deepEqual(t.calls,['read','refresh','read']);
 t=setup([{exists:()=>false}]);assert.equal((await t.c.cbReadOwnDocument('profiles')).exists(),false);
 t=setup([err('unavailable')]);t.c.navigator.onLine=false;await assert.rejects(t.c.cbReadOwnDocument('profiles'));assert.deepEqual(t.calls,['read']);
 t=setup([]);t.c.FB.fs.getDocFromServer=async()=>{t.c.FB.auth.currentUser={uid:'someone-else'};return {exists:()=>true}};await assert.rejects(t.c.cbReadOwnDocument('profiles'),{code:'unauthenticated'});
 t=setup([]);await assert.rejects(t.c.cbWithDeadline(new Promise(()=>{}),5),{code:'deadline-exceeded'});
 assert(html.includes('if (FIREBASE_ON && !FB.on) return renderConnectionError'));
 assert(!html.includes("onclick=\"boot()\">Try again</button></main>'"));
 console.log('PASS transient retry, permission refresh/rejection, missing document, offline behavior, account isolation, bounded timeout, no production demo fallback');
})();
