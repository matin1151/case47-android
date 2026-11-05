(function(global){
'use strict';
const Base=global.CaseEngine.Engine;
const oldValidate=Base.prototype.validateCase, oldDeduce=Base.prototype.deduce,oldReport=Base.prototype.report,oldRestore=Base.prototype.restore;
function number(value){return Number(String(value==null?'':value).trim().replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[٫,]/g,'.'));}
Base.prototype.validateCase=function(){
 oldValidate.call(this);
 if(!this.data.report.sections)return;
 const names=new Set();
 for(const section of this.data.report.sections){
  if(names.has(section.id)||!this.data.characters.some(c=>c.id===section.answer))throw Error('بخش گزارش نامعتبر است.');
  names.add(section.id);
  if(!section.proof.length||section.proof.some(id=>!this.ids.evidence.includes(id)))throw Error('مدارک گزارش نامعتبرند.');
  for(const [kind,ids] of Object.entries(section.requires||{})){
   if(kind==='timeline'){if(typeof ids!=='boolean')throw Error('شرط زمانی نامعتبر است.');}
   else if(!this.ids[kind]||!Array.isArray(ids)||ids.some(id=>!this.ids[kind].includes(id)))throw Error('پیش‌نیاز گزارش نامعتبر است.');
  }
 }
};
Base.prototype.deduce=function(id,proof,input){
 const p=this.data.deductions.find(p=>p.id===id);
 if(p&&p.interaction){
  this.ensureStarted();
  if(!this.meets(p.requires))throw Error('پیش‌نیاز این بررسی کامل نیست.');
  const raw=String(input==null?'':input).trim(),value=p.id==='paper'?((number(raw)%360)+360)%360:number(raw);
  if(!raw||!Number.isFinite(value)||Math.abs(value-p.interaction.answer)>0.001)return {ok:false,message:'مقدار واردشده با داده‌های مدرک سازگار نیست. واحد و مرجع را دوباره بررسی کن.'};
 }
 const result=oldDeduce.call(this,id,proof);
 if(this.data.id==='room-six'&&!result.ok){result.message=result.message.replace(/\d+/g,n=>Number(n).toLocaleString('fa-IR'));if(p&&p.checklist)result.message+=' اطلاعات لازم: '+p.checklist.join('؛ ');}
 return result;
};
Base.prototype.report=function(answer){
 const sections=this.data.report.sections;
 if(!sections)return oldReport.call(this,answer);
 this.ensureStarted();
 if(!answer||!answer.sections)throw Error('دو بخش گزارش را جدا تکمیل کن.');
 const outcomes=sections.map(s=>{
  const a=answer.sections[s.id]||{},proof=a.proof||[];
  if(!Array.isArray(proof)||proof.some(id=>!this.state.evidence.includes(id)))throw Error('مدرک گزارش هنوز کشف نشده است.');
  if(a.suspect==='open'||!a.suspect)return {id:s.id,ok:false,message:s.label+': این بخش باز مانده است.'};
  if(!this.data.characters.some(c=>c.id===a.suspect))throw Error('مظنون نامعتبر است.');
  if(a.suspect!==s.answer)return {id:s.id,ok:false,message:s.label+': نسبت دادن مسئولیت با زنجیره شواهد سازگار نیست. زمان و نقش هر نفر را دوباره بسنج.'};
  const missing=s.proof.filter(id=>!proof.includes(id)),extra=proof.filter(id=>!s.proof.includes(id)&&!(s.related||[]).includes(id));
  if(missing.length)return {id:s.id,ok:false,message:s.label+': '+missing.length.toLocaleString('fa-IR')+' مدرک اصلی کم است. '+(s.checklist||[]).join('؛ ')};
  if(extra.length)return {id:s.id,ok:false,message:s.label+': این مدارک به این رخداد مربوط نیستند: '+extra.map(id=>this.data.evidence.find(e=>e.id===id).title).join('، ')};
  if(!this.meets(s.requires))return {id:s.id,ok:false,message:s.label+': مدارک حاضرند، اما این بررسی‌ها ثبت نشده‌اند: '+this.missing(s.requires).join('، ')};
  return {id:s.id,ok:true,message:s.label+': زنجیره شواهد کامل است.'};
 });
 const ok=outcomes.every(x=>x.ok);
 this.state.reportDraft=JSON.parse(JSON.stringify(answer));
 this.state.reportOutcomes=outcomes;
 const wrong=sections.some(s=>{const a=answer.sections[s.id];return a&&a.suspect&&a.suspect!=='open'&&a.suspect!==s.answer;});
 this.state.reportKind=ok?'complete':wrong?'wrong':outcomes.some(x=>x.ok)?'partial':'open';
 this.state.attempts++;this.state.ending=ok?'success':'failure';
 this.state.reportFeedback=ok?null:outcomes.map(x=>x.message).join('\n');
 this.changed();
 return {ok,outcomes,message:ok?this.data.report.success:this.data.report.failure,feedback:this.state.reportFeedback};
};
Base.prototype.restore=function(s){
 const n=oldRestore.call(this,s);
 if(this.data.id!=='room-six')return n;
 n.reportDraft=s&&s.reportDraft&&typeof s.reportDraft==='object'?JSON.parse(JSON.stringify(s.reportDraft)):null;
 n.reportKind=s&&['complete','partial','wrong','open'].includes(s.reportKind)?s.reportKind:null;
 n.reportOutcomes=s&&Array.isArray(s.reportOutcomes)?s.reportOutcomes: [];
 n.puzzleDrafts={};for(const [id,values] of Object.entries(s&&s.puzzleDrafts||{})){if([...this.ids.deductions,...this.ids.contradictions].includes(id)&&Array.isArray(values))n.puzzleDrafts[id]=values.filter(v=>n.evidence.includes(v));}n.revision='r155-0.5.5';
 if(s&&s.revision!==n.revision&&(s.deductions.length||s.ending)){
  n.ending=null;n.reportFeedback='نسخه پرونده به‌روز شده است. مدارک و پاسخ‌های تو حفظ شدند؛ بررسی‌های تازه و گزارش نهایی را دوباره ثبت کن.';
  n.deductions=n.deductions.filter(id=>!['raw','refer','past'].includes(id));
 }
 return n;
};
const oldSetTimeline=Base.prototype.setTimeline;Base.prototype.setTimeline=function(i,id){if(this.data.id==='room-six'&&id===''){this.ensureStarted();if(!Number.isInteger(i)||!this.data.timeline.slots[i])throw Error('جایگاه نامعتبر است.');this.state.timelineDraft[i]='';this.state.timeline=false;this.changed();return;}return oldSetTimeline.call(this,i,id);};
const oldAsk=Base.prototype.ask;
Base.prototype.ask=function(character,id){
 const q=oldAsk.call(this,character,id);
 if(this.data.id!=='room-six')return q;
 const c=this.data.contradictions.find(c=>c.claim===id&&this.state.contradictions.includes(c.id));
 return c?Object.assign({},q,{answer:q.answer+'\nپس از سنجش این ادعا: '+c.response}):q;
};
})(typeof globalThis!=='undefined'?globalThis:this);
