(function(global){
'use strict';
const Base=global.CaseEngine.Engine,P=Base.prototype;
const old={initial:P.initial,restore:P.restore,nextLead:P.nextLead,hint:P.hint,confront:P.confront,deduce:P.deduce};
const basic=['b_space','m_alibi','m_meet','l_gather','l_sound','s_exit','s_water'];
const core=['E01','E21','E02','E03'];
const isR6=g=>g.data.id==='room-six';
P.initial=function(){const s=old.initial.call(this);if(isR6(this))s.journey={opening:null,checked:false,rewards:[],review:null};return s;};
P.restore=function(saved){const s=old.restore.call(this,saved);if(!isR6(this))return s;
 const j=saved&&saved.journey;
 s.journey={opening:j&&['compare','trust','legacy'].includes(j.opening)?j.opening:!j&&(s.evidence.length||s.questions.length||s.deductions.length)?'legacy':null,checked:!!(j&&j.checked),rewards:j&&Array.isArray(j.rewards)?[...new Set(j.rewards.filter(x=>typeof x==='string'&&x.length<80))].slice(0,100):[]};
 s.journey.review=null;if(j&&j.review&&['deduce','confront'].includes(j.review.type)){const kind=j.review.type==='deduce'?'deductions':'contradictions';if(this.data[kind].some(x=>x.id===j.review.id)&&!s[kind].includes(j.review.id))s.journey.review={type:j.review.type,id:j.review.id};}
 for(const c of this.data.contradictions){const n=saved&&saved.hints&&saved.hints[c.id];if(Number.isInteger(n))s.hints[c.id]=Math.max(0,Math.min(n,(c.hints||[]).length));}
 return s;
};
P.chooseOpening=function(choice){
 this.ensureStarted();if(!isR6(this)||!['compare','trust'].includes(choice))throw Error('این انتخاب در دسترس نیست.');
 if(this.state.journey.opening)return {ok:false,message:'تصمیم نخست قبلاً ثبت شده است.'};
 this.collect('E01');this.state.journey.opening=choice;
 if(choice==='compare'){this.collect('E02');this.state.journey.checked=true;}
 this.changed();return {ok:true,fast:choice==='compare',message:choice==='compare'?'دو نسخه نقشه را برای مقایسه ثبت کردی. لیلا پوشه آبی ملک را از آرشیو تحویل داد؛ پیش از رفتن به اتاق کار، اظهارات اولیه روی میز نشیمن را هم ثبت کن.':'توضیح بهزاد هنوز تأیید نشده است. قبل از ثبت برداشت، یک بار عنوان روی برگه را بررسی کن؛ راه تحقیق همچنان باز است.'};
};
P.verifyOpening=function(answer){this.ensureStarted();if(!isR6(this)||this.state.journey.opening!=='trust')throw Error('این بررسی در دسترس نیست.');
 if(answer!=='sale')return {ok:false,message:'روی خود برگه عنوان «نقشه آگهی فروش ویلا» نوشته شده است. برای شناخت کاربری واقعی فضا، نسخه اصلی را هم لازم داری.'};
 this.state.journey.checked=true;this.changed();return {ok:true,message:'منبع برگه مشخص شد. اظهارات روی میز نشیمن را ثبت کن؛ سپس پوشه آبی ملک را در آرشیو بررسی کن و نسخه اصلی را بردار.'};
};
P.investigationPhase=function(){if(!isR6(this))return 0;if(this.state.ending==='success')return 4;
 if(core.some(id=>!this.state.evidence.includes(id)))return 0;
 if(basic.some(id=>!this.state.questions.includes(id)))return 1;
 if(this.data.contradictions.some(x=>!this.state.contradictions.includes(x.id))||['space','entrance','belonging','raw','refer','show','paper','past'].some(id=>!this.state.deductions.includes(id)))return 2;
 if(!this.state.timeline||!this.state.deductions.includes('opportunity'))return 3;
 return 4;
};
P.nextLead=function(){
 if(!isR6(this)||this.state.ending)return old.nextLead.call(this);
 const evidence=id=>{const scene=this.data.scenes.find(s=>s.hotspots.some(h=>h.evidence===id)),e=this.data.evidence.find(e=>e.id===id);return scene&&this.meets(scene.requires)?{view:'scene',id:scene.id,kind:'collect',target:id,label:'بررسی '+e.title,text:'در '+scene.name+'\n«'+e.title+'» را بررسی کن.'}:null;};
 for(const id of core)if(!this.state.evidence.includes(id)){const lead=evidence(id);if(lead)return lead;}
 for(const id of basic)if(!this.state.questions.includes(id)){const c=this.data.characters.find(c=>c.questions.some(q=>q.id===id)),q=c.questions.find(q=>q.id===id);if(this.meets(q.requires))return {view:'interview',id:c.id,kind:'ask',target:id,label:'گفت‌وگو با '+c.name,text:'از '+c.name+' بپرس\n'+q.label};}
 for(const id of ['l_false_sound','m_false_alibi','m_false_meet','b_false_space']){const c=this.data.contradictions.find(c=>c.id===id);if(this.state.contradictions.includes(id)||!this.meets(c.requires))continue;
  const missing=c.proof.filter(id=>!this.state.evidence.includes(id));if(missing.length){const lead=evidence(missing[0]);if(lead)return lead;}else return {view:'interview',id:c.character,kind:'confront',target:id,label:'سنجیدن این ادعا',text:'ادعای «'+c.title+'» را بررسی کن.\n'+c.prompt};
 }
 for(const p of this.data.deductions){if(this.state.deductions.includes(p.id)||!this.meets(p.requires))continue;const missing=p.proof.filter(id=>!this.state.evidence.includes(id));if(missing.length){const lead=evidence(missing[0]);if(lead)return lead;}else return {view:'board',kind:'deduce',target:p.id,label:'بررسی '+p.title,text:'مدارک «'+p.title+'» آماده‌اند.\n'+p.prompt};}
 if(!this.state.timeline&&this.meets(this.data.timeline.requires))return {view:'timeline',label:'چیدن رویدادها',text:'مدارک زمانی آماده‌اند.\nزمان‌های اصلاح‌شده را روی خط زمانی بچین.'};
 if(this.data.report.sections.every(s=>this.meets(s.requires)))return {view:'report',label:'نوشتن گزارش مستقل',text:'زنجیره مدارک و خط زمانی آماده‌اند.\nماجرای رها و قتل نیما را در دو بخش جدا جمع‌بندی کن.'};
 return old.nextLead.call(this);
};
P.hint=function(id){if(!isR6(this))return old.hint.call(this,id);this.ensureStarted();const p=[...this.data.deductions,...this.data.contradictions].find(x=>x.id===id);if(!p)throw Error('راهنمای این بررسی پیدا نشد.');const n=Math.min((this.state.hints[id]||0)+1,p.hints.length);this.state.hints[id]=n;this.changed();return p.hints.slice(0,n);};
function check(g,p,proof){g.ensureStarted();if(!p||!g.meets(p.requires))throw Error('ابتدا پیش‌نیاز همین بررسی را کامل کن.');if(!Array.isArray(proof)||proof.some(id=>!g.state.evidence.includes(id)))throw Error('مدرک انتخابی هنوز کشف نشده است.');const missing=p.proof.filter(id=>!proof.includes(id));if(missing.length)return {ok:false,message:'هنوز '+missing.length+' مدرک اصلی برای همین پرسش کم است. '+(p.checklist||[]).join('؛ ')+' را بررسی کن. راهنمای مرحله‌ای، محل و روش مقایسه را نشان می‌دهد.'};const extra=[...new Set(proof)].filter(id=>!p.proof.includes(id)&&!(p.related||[]).includes(id));if(extra.length)return {ok:false,message:'«'+extra.map(id=>g.data.evidence.find(e=>e.id===id).title).join('»، «')+'» به همین پرسش پاسخ مستقیم نمی‌دهد. فعلاً آن را از روی میز بردار؛ در دفتر مدارک حفظ می‌شود.'};return null;}
P.confront=function(id,proof){if(!isR6(this))return old.confront.call(this,id,proof);const p=this.data.contradictions.find(x=>x.id===id),bad=check(this,p,proof);return bad||old.confront.call(this,id,proof);};
P.deduce=function(id,proof,input){if(!isR6(this))return old.deduce.call(this,id,proof,input);const p=this.data.deductions.find(x=>x.id===id),bad=check(this,p,proof);return bad||old.deduce.call(this,id,proof,input);};
P.journeyReward=function(key,message){if(!isR6(this)||this.state.journey.rewards.includes(key))return '';this.state.journey.rewards.push(key);this.changed();return message;};
})(typeof globalThis!=='undefined'?globalThis:this);
