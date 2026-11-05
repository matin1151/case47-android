(function(global){
'use strict';
const Base=global.CaseEngine.Engine;
const oldValidate=Base.prototype.validateCase, oldDeduce=Base.prototype.deduce,oldReport=Base.prototype.report;
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
  const raw=String(input==null?'':input).trim(),value=number(raw);
  if(!raw||!Number.isFinite(value)||Math.abs(value-p.interaction.answer)>0.001)return {ok:false,message:'مقدار واردشده با داده‌های مدرک سازگار نیست. واحد و مرجع را دوباره بررسی کن.'};
 }
 return oldDeduce.call(this,id,proof);
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
  if(!this.meets(s.requires)||!s.proof.every(id=>proof.includes(id))||proof.some(id=>!s.proof.includes(id)))return {id:s.id,ok:false,message:s.label+': نام انتخاب‌شده بدون زنجیره کامل شواهد کافی نیست؛ مدارک مرتبط و بررسی‌های این بخش را کامل کن.'};
  return {id:s.id,ok:true,message:s.label+': زنجیره شواهد کامل است.'};
 });
 const ok=outcomes.every(x=>x.ok);
 this.state.attempts++;this.state.ending=ok?'success':'failure';
 this.state.reportFeedback=ok?null:outcomes.map(x=>x.message).join('\n');
 this.changed();
 return {ok,outcomes,message:ok?this.data.report.success:this.data.report.failure,feedback:this.state.reportFeedback};
};
})(typeof globalThis!=='undefined'?globalThis:this);
