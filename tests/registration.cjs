const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
for(const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
const source=html.slice(html.indexOf('// Contact data'),html.indexOf('// Persist my profile'));
function setup(){
 const calls=[], elements={registrationPhone:{value:'0979237089'},registrationEmail:{value:'member@example.invalid',reportValidity:()=>true},registrationPassword:{value:'test-password'},registrationStatus:{textContent:''}};
 const c={FB:{auth:{currentUser:{uid:'one',isAnonymous:false}},fs:{doc:(_,collection,uid)=>({collection,uid}),serverTimestamp:()=>123,setDoc:async(ref,data)=>calls.push({ref,data}),getDoc:async()=>({exists:()=>false})},authMod:{}},$:id=>elements[id],app:{},fbGoogleBusy:false,me:{ageConfirmed:true,name:'Member',gender:'m',photos:['photo']},buildPool(){},renderHome(){calls.push('home')},renderAgeGate(){calls.push('age')},renderOnboarding(){calls.push('onboarding')},fbAcceptAuthenticatedUser:async()=>calls.push('accepted')};
 vm.createContext(c);vm.runInContext(source,c);return{c,calls,elements};
}
(async()=>{
 let t=setup();for(const n of ['0979237089','979237089','260979237089','+260 97 923 7089'])assert.equal(t.c.normalizeRegistrationPhone(n),'+260979237089');
 for(const n of ['','123','+2609792370890','+260679237089','abc0979237089'])assert.equal(t.c.normalizeRegistrationPhone(n),null);
 assert.equal(t.c.registrationComplete(),false);await t.c.saveRegistrationPhone({preventDefault(){}});assert.equal(t.c.registrationComplete(),true);assert.equal(t.calls[0].ref.collection,'chibwenziContacts');assert.equal(t.calls[0].ref.uid,'one');assert.deepEqual(Object.keys(t.calls[0].data),['phone','updatedAt']);assert(!('phone' in t.c.me));
 t.c.FB.auth.currentUser={uid:'two',isAnonymous:false};assert.equal(t.c.registrationComplete(),false);
 t=setup();t.c.FB.fs.setDoc=async()=>{throw Error('denied')};await t.c.saveRegistrationPhone({preventDefault(){}});assert.equal(t.c.registrationComplete(),false);assert(!t.calls.includes('home'));
 t=setup();t.c.FB.auth.currentUser.isAnonymous=true;await t.c.saveRegistrationPhone({preventDefault(){}});assert(!t.calls.some(c=>c.ref));
 t=setup();t.c.FB.authMod.signInWithEmailAndPassword=async()=>{throw {code:'auth/invalid-credential'}};await t.c.submitEmailRegistration({preventDefault(){}},'signin');assert(!t.calls.includes('accepted'));assert(t.elements.registrationStatus.textContent.includes('incorrect'));assert.equal(vm.runInContext('registrationBusy',t.c),false);
 t=setup();t.c.FB.auth.currentUser.isAnonymous=true;t.c.FB.authMod.EmailAuthProvider={credential:()=>({})};t.c.FB.authMod.linkWithCredential=async()=>{t.calls.push('linked');return{user:{uid:'one'}}};await t.c.submitEmailRegistration({preventDefault(){}},'signup');assert(t.calls.includes('linked'));assert(t.calls.includes('accepted'));assert.equal(t.elements.registrationPassword.value,'');
 console.log('PASS syntax, phone formats, private writes, account isolation, failed-save gate, anonymous gate, wrong-password recovery, anonymous email linking');
})();
