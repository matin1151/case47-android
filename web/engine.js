(function (global) {
'use strict';
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function unique(xs) { return Array.from(new Set(xs)); }
function same(a,b) { return a.length===b.length && a.every(x=>b.indexOf(x)!==-1); }
function assert(ok,msg) { if(!ok) throw new Error(msg); }
class Engine {
 constructor(data,saved) {
  this.data=data; this.validateCase(); this.state=this.restore(saved);
 }
 validateCase() {
  const d=this.data; assert(d.schemaVersion===1,'نسخهٔ دادهٔ پرونده پشتیبانی نمی‌شود.');
  ['evidence','characters','scenes','contradictions','deductions','hypotheses'].forEach(k=>{ assert(Array.isArray(d[k]),'دادهٔ پرونده ناقص است: '+k);const ids=d[k].map(x=>x.id);assert(new Set(ids).size===ids.length,'شناسهٔ تکراری در '+k);});
  this.ids={evidence:d.evidence.map(x=>x.id),questions:d.characters.flatMap(c=>c.questions.map(q=>q.id)),contradictions:d.contradictions.map(x=>x.id),deductions:d.deductions.map(x=>x.id),hypotheses:d.hypotheses.map(x=>x.id)};
  assert(unique(this.ids.questions).length===this.ids.questions.length,'شناسهٔ سؤال تکراری است.');
  const checkReq=r=>{Object.keys(r||{}).forEach(k=>{assert(k==='timeline'||this.ids[k],'شرط ناشناخته: '+k);if(k!=='timeline'){assert(Array.isArray(r[k]),'شرط نامعتبر');r[k].forEach(id=>assert(this.ids[k].includes(id),'ارجاع نامعتبر: '+id));}});};
  const evidenceRefs=xs=>(xs||[]).forEach(id=>assert(this.ids.evidence.includes(id),'مدرک ناشناخته: '+id));
  d.scenes.forEach(s=>{checkReq(s.requires);evidenceRefs(s.hotspots.map(h=>h.evidence));});
  d.characters.forEach(c=>c.questions.forEach(q=>{checkReq(q.requires);evidenceRefs(q.grants);}));
  d.contradictions.forEach(c=>{checkReq(c.requires);assert(this.ids.questions.includes(c.claim),'ادعای نامعتبر');assert(d.characters.some(p=>p.id===c.character&&p.questions.some(q=>q.id===c.claim)),'مظنون ادعا نامعتبر');evidenceRefs(c.proof);evidenceRefs(c.grants);});
  d.deductions.forEach(p=>{checkReq(p.requires);evidenceRefs(p.proof);assert(p.hints.length>0,'راهنمای معما خالی است');});
  d.hypotheses.forEach(h=>{checkReq(h.requires);evidenceRefs(h.proof);assert(Array.isArray(h.options)&&h.options.length>=2,'گزینه‌های فرضیه ناقص‌اند');assert(new Set(h.options.map(o=>o.id)).size===h.options.length,'گزینهٔ تکراری در فرضیه');assert(h.options.some(o=>o.id===h.answer),'پاسخ فرضیه نامعتبر است');});
  checkReq(d.timeline.requires);checkReq(d.report.requires);evidenceRefs(d.report.solution.proof);
  d.timeline.slots.forEach(s=>assert(d.timeline.events.some(e=>e.id===s.event),'رویداد نامعتبر'));
 }
 initial() {return {schemaVersion:1,caseId:this.data.id,evidence:[],questions:[],contradictions:[],deductions:[],hypotheses:[],timeline:false,timelineDraft:{},hints:{},started:false,ending:null,attempts:0,settings:{sound:false,volume:0.35},updatedAt:0};}
 restore(s) {
  const n=this.initial(); if(!s)return n;
  assert(s.schemaVersion===1&&s.caseId===this.data.id,'این ذخیره با پرونده سازگار نیست.');
  Object.keys(this.ids).forEach(k=>{const values=k==='hypotheses'&&!('hypotheses' in s)?[]:s[k];assert(Array.isArray(values),'فهرست ذخیره ناقص است.');n[k]=unique(values.filter(id=>typeof id==='string'&&this.ids[k].includes(id)));});
  n.started=s.started===true;n.timeline=s.timeline===true;
  if(s.timelineDraft&&typeof s.timelineDraft==='object')this.data.timeline.slots.forEach((slot,i)=>{const v=s.timelineDraft[i];if(this.data.timeline.events.some(e=>e.id===v))n.timelineDraft[i]=v;});
  this.data.deductions.forEach(p=>{const v=s.hints&&s.hints[p.id];if(Number.isInteger(v))n.hints[p.id]=Math.max(0,Math.min(v,p.hints.length));});
  if(s.settings){n.settings.sound=s.settings.sound===true;const v=Number(s.settings.volume);if(Number.isFinite(v))n.settings.volume=Math.max(0,Math.min(1,v));}
  n.attempts=Number.isInteger(s.attempts)?Math.max(0,Math.min(s.attempts,100000)):0;
  n.ending=['success','failure'].includes(s.ending)?s.ending:null;
  n.updatedAt=Number.isFinite(s.updatedAt)?s.updatedAt:0;return n;
 }
 meets(r) {return Object.entries(r||{}).every(([k,v])=>k==='timeline'?(this.state.timeline===v):v.every(id=>this.state[k].includes(id)));}
 missing(r) {
  return Object.entries(r||{}).flatMap(([k,v])=>k==='timeline'?(!this.state.timeline?['بازسازی خط زمانی']:[]):v.filter(id=>!this.state[k].includes(id)).map(id=>{
   if(k==='questions'){for(const c of this.data.characters){const q=c.questions.find(x=>x.id===id);if(q)return 'پرسش از '+c.name+': '+q.label;}}
   const x=this.data[k].find(x=>x.id===id);return x?x.title:id;
  }));
 }
 snapshot(){return clone(this.state);}
 changed(){this.state.updatedAt=Date.now();return this.snapshot();}
 start(){this.state.started=true;this.changed();}
 collect(id){assert(this.ids.evidence.includes(id),'مدرک ناشناخته');const scene=this.data.scenes.find(s=>s.hotspots.some(h=>h.evidence===id));assert(scene&&this.meets(scene.requires),'این بخش هنوز در دسترس نیست.');this.grant([id]);return this.data.evidence.find(e=>e.id===id);}
 grant(ids){this.state.evidence=unique(this.state.evidence.concat(ids));this.changed();}
 ask(character,id){const c=this.data.characters.find(c=>c.id===character);const q=c&&c.questions.find(q=>q.id===id);assert(q,'سؤال پیدا نشد');assert(this.meets(q.requires),'برای این سؤال باید مدرک بیشتری پیدا کنی.');this.state.questions=unique(this.state.questions.concat([id]));this.grant(q.grants);return q;}
 confront(id,proof){const c=this.data.contradictions.find(c=>c.id===id);assert(c&&this.meets(c.requires),'ابتدا این ادعا را در بازجویی بشنو.');assert(proof.every(e=>this.state.evidence.includes(e)),'مدرک هنوز کشف نشده.');if(!same(unique(proof),c.proof))return {ok:false,message:'این مجموعه دقیقاً ادعا را رد نمی‌کند. منبع و زمان مدارک را دوباره مقایسه کن؛ مدرک اضافی را هم بردار.'};this.state.contradictions=unique(this.state.contradictions.concat([id]));this.grant(c.grants);return {ok:true,message:c.response};}
 deduce(id,proof){const p=this.data.deductions.find(p=>p.id===id);assert(p&&this.meets(p.requires),'پیش‌نیاز این استنتاج هنوز کامل نیست.');assert(proof.every(e=>this.state.evidence.includes(e)),'مدرک هنوز کشف نشده.');if(!same(unique(proof),p.proof))return {ok:false,message:'این مدارک هنوز پاسخ دقیق سؤال نیستند. توضیح هر مدرک و راهنمای اختیاری را بررسی کن.'};this.state.deductions=unique(this.state.deductions.concat([id]));this.changed();return {ok:true,message:p.result};}
 judgeHypothesis(id,answer,proof){const h=this.data.hypotheses.find(x=>x.id===id);assert(h&&this.meets(h.requires),'برای آزمودن این فرضیه، ابتدا شواهد لازم را پیدا کن.');assert(h.options.some(o=>o.id===answer),'گزینهٔ فرضیه نامعتبر است.');assert(Array.isArray(proof)&&proof.every(e=>this.state.evidence.includes(e)),'مدرک هنوز کشف نشده.');if(answer!==h.answer)return {ok:false,message:'این توضیح با همهٔ آنچه می‌دانیم جور درنمی‌آید. روایت‌های دیگر را هم با مدارک بسنج.'};if(!same(unique(proof),h.proof))return {ok:false,message:'این برداشت ممکن است درست باشد، اما مدارک انتخابی هنوز آن را خوب پشتیبانی نمی‌کنند.'};this.state.hypotheses=unique(this.state.hypotheses.concat([id]));this.changed();return {ok:true,message:h.result};}
 hint(id){const p=this.data.deductions.find(p=>p.id===id);assert(p,'معما پیدا نشد');const n=Math.min((this.state.hints[id]||0)+1,p.hints.length);this.state.hints[id]=n;this.changed();return p.hints.slice(0,n);}
 setTimeline(slot,event){assert(this.meets(this.data.timeline.requires),'ابتدا استنتاج‌های زمانی را کامل کن.');assert(this.data.timeline.slots[slot]&&this.data.timeline.events.some(e=>e.id===event),'رویداد نامعتبر');this.state.timelineDraft[slot]=event;this.changed();}
 solveTimeline(){assert(this.meets(this.data.timeline.requires),'استنتاج‌های زمانی ناقص‌اند.');const errors=this.data.timeline.slots.map((s,i)=>this.state.timelineDraft[i]===s.event?null:i).filter(x=>x!==null);if(errors.length)return {ok:false,message:'چند رویداد هنوز در جای درست نیستند؛ زمان‌های علامت‌خورده را با مدارک تطبیق بده.',errors};this.state.timeline=true;this.changed();return {ok:true,message:'خط زمانی بازسازی شد. فاصلهٔ ورود، تماس، درگیری و خروج اکنون روشن است.'};}
 report(answer){assert(this.meets(this.data.report.requires),'پیش‌نیازهای گزارش کامل نیست.');assert(answer.proof.every(e=>this.state.evidence.includes(e)),'مدرک ناشناخته');const sol=this.data.report.solution;const ok=['suspect','motive','method'].every(k=>answer[k]===sol[k])&&same(unique(answer.proof),sol.proof);this.state.attempts++;this.state.ending=ok?'success':'failure';this.changed();return {ok,message:ok?this.data.report.success:this.data.report.failure};}
 retry(){this.state.ending=null;this.changed();}
 settings(s){if(typeof s.sound==='boolean')this.state.settings.sound=s.sound;if(Number.isFinite(s.volume))this.state.settings.volume=Math.max(0,Math.min(1,s.volume));this.changed();}
 progress(){if(this.state.ending==='success')return 100;return Math.round(100*(this.state.evidence.length+this.state.contradictions.length*2+this.state.deductions.length*2+this.state.hypotheses.length*2+(this.state.timeline?4:0))/(this.data.evidence.length+this.data.contradictions.length*2+this.data.deductions.length*2+this.data.hypotheses.length*2+8));}
 nextLead(){
  if(this.state.ending==='success')return {view:'evidence',label:'مرور مدارک',text:'پرونده بسته شد. مدارک و استدلال‌ها برای مرور در دسترس‌اند.'};
  if(this.state.ending==='failure')return {view:'report',label:'بازبینی گزارش',text:'گزارش به نتیجه نرسید. مدارک و انگیزه را دوباره کنار هم بگذار.'};
  for(const s of this.data.scenes){const remaining=s.hotspots.filter(h=>!this.state.evidence.includes(h.evidence));if(this.meets(s.requires)&&remaining.length)return {view:'scene',id:s.id,label:'بررسی '+s.name,text:'در '+s.name+' هنوز '+remaining.length+' مورد بررسی‌نشده هست.'};}
  for(const c of this.data.characters){const q=c.questions.find(q=>this.meets(q.requires)&&!this.state.questions.includes(q.id));if(q)return {view:'interview',id:c.id,label:'گفت‌وگو با '+c.name,text:'از '+c.name+' دربارهٔ «'+q.label+'» بپرس.'};}
  for(const c of this.data.contradictions)if(!this.state.contradictions.includes(c.id)&&this.meets(c.requires))return {view:'interview',id:c.character,label:'بررسی تناقض',text:'ادعای «'+c.title+'» را با مدارک بسنج.'};
  for(const p of this.data.deductions)if(!this.state.deductions.includes(p.id)&&this.meets(p.requires))return {view:'board',label:'رفتن به تابلوی استنتاج',text:'برای «'+p.title+'» مدارک مرتبط را کنار هم بگذار.'};
  for(const h of this.data.hypotheses)if(!this.state.hypotheses.includes(h.id)&&this.meets(h.requires))return {view:'board',label:'آزمودن فرضیه',text:'روی تابلوی استنتاج، «'+h.title+'» را با شواهد بسنج.'};
  if(!this.state.timeline)return {view:'timeline',label:'بازسازی خط زمانی',text:'زمان رویدادها را از روی مدارک مرتب کن.'};
  return {view:'report',label:'نوشتن گزارش نهایی',text:'مدارک و خط زمانی آماده‌اند. گزارش نهایی را ثبت کن.'};
 }
 nextGoal(){return this.nextLead().text;}
}
function checksum(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
class SaveStore {
 constructor(storage,key){this.storage=storage;this.key=key;this.warning='';}
 encode(state){const payload=JSON.stringify(state);return JSON.stringify({format:1,checksum:checksum(payload),payload});}
 decode(raw){assert(typeof raw==='string'&&raw.length<500000,'فایل ذخیره معتبر نیست.');const env=JSON.parse(raw);assert(env.format===1&&typeof env.payload==='string'&&checksum(env.payload)===env.checksum,'فایل ذخیره ناقص یا آسیب‌دیده است.');return JSON.parse(env.payload);}
 load(){for(const suffix of ['',':backup']){try{const raw=this.storage.getItem(this.key+suffix);if(!raw)continue;const s=this.decode(raw);if(suffix)this.warning='ذخیرهٔ اصلی آسیب دیده بود؛ نسخهٔ پشتیبان بازیابی شد.';return s;}catch(e){this.warning='خواندن ذخیره مشکل داشت. می‌توانی نسخهٔ صادرشده را وارد کنی.';}}return null;}
 save(state){try{const raw=this.encode(state);const previous=this.storage.getItem(this.key);if(previous){try{this.decode(previous);this.storage.setItem(this.key+':backup',previous);}catch(e){/* Keep a valid backup. */}}this.storage.setItem(this.key,raw);this.warning='';return true;}catch(e){this.warning='ذخیره روی این دستگاه ممکن نشد؛ پیشرفت را از تنظیمات صادر کن.';return false;}}
}
const api={Engine,SaveStore};if(typeof module!=='undefined'&&module.exports)module.exports=api;global.CaseEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
