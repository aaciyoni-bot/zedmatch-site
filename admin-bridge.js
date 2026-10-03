/* Connect the legacy member UI to the dedicated, claim-protected dashboard. */
(()=>{
let role=false,attached=false;
isAdmin=()=>role;
renderAdmin=function(container){container.innerHTML='<section style="padding:30px;text-align:center"><h2>Chibwenzi Administration</h2><p>Management uses a separate, protected workspace. Sign in with your own administrator account.</p><a href="admin.html" style="display:inline-block;padding:12px 20px;background:#741d36;color:white;border-radius:12px">Open administration</a></section>';};
fbLoadModeration=async()=>{throw Error('Use the dedicated administration workspace');};
fbLoadAllProfiles=async()=>{throw Error('Use the dedicated administration workspace');};
submitReport=async function(id,name,reason){if(!FB.on||!FB.auth?.currentUser){showToast('Please sign in before reporting.');return;}const buttons=[...document.querySelectorAll('.fixed button')];buttons.forEach(b=>b.disabled=true);try{const match=matches.find(m=>m.id===id&&m.matchId);const data={by:FB.uid,targetId:id,targetName:name,reason,status:'open',at:Date.now()};if(match)data.matchId=match.matchId;const ref=FB.fs.doc(FB.fs.collection(FB.db,'reports'));const batch=FB.fs.writeBatch(FB.db);batch.set(ref,data);batch.set(FB.fs.doc(FB.db,'chibwenziReportDirectory',ref.id),{by:data.by,targetId:data.targetId,status:data.status,at:data.at});await batch.commit();reports.unshift({type:'report',...data});saveReports();if(!me.blockedIds.includes(id))me.blockedIds.push(id);matches=matches.filter(m=>m.id!==id);saveMe();saveMatches();document.querySelectorAll('.fixed.z-\\[85\\], .fixed.z-\\[75\\]').forEach(x=>x.remove());if(activeChatId===id)activeChatId=null;buildPool();renderHome();showToast('Report saved. This person is blocked from your local view.',3200);}catch(e){showToast('Report was not saved. Please retry when connected.',4000);}finally{buttons.forEach(b=>b.disabled=false);}};
fbLoadPool=async function(){
  if(!FB.on||!me)return [];
  try{const {collection,query,where,limit,getDocs}=FB.fs;
    const snap=await getDocs(query(collection(FB.db,'profiles'),where('gender','==',me.seeking),limit(60)));
    const seen=new Set([...me.likedIds,...me.passedIds,...me.superLikedIds,...me.blockedIds,FB.uid]);
    return snap.docs.filter(d=>{const p=d.data();return !seen.has(d.id)&&p.name&&p.photos?.length&&(!p.moderationStatus||p.moderationStatus==='active');}).map(d=>{const p=d.data();return {id:d.id,name:p.name,age:p.age,gender:p.gender,city:p.city,bio:p.bio||'',interests:p.interests||[],photos:p.photos,verified:!!p.verified,_real:true};});
  }catch(e){return [];}
};
// Do not assume that a trusted email address is an administrator role.
const timer=setInterval(()=>{if(attached){clearInterval(timer);return;}if(typeof FB==='undefined'||!FB.auth||!FB.authMod)return;attached=true;FB.authMod.onIdTokenChanged(FB.auth,async user=>{try{role=false;if(user?.email&&user.emailVerified){const result=await FB.fs.getDocFromServer(FB.fs.doc(FB.db,'chibwenziAdmins',user.email));role=result.exists()&&result.data().enabled===true;}}catch(e){role=false;}});},500);
setTimeout(()=>clearInterval(timer),60000);
})();
