
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {Engine,SaveStore}=require('../web/engine.js');require('../web/room-six-engine.js');require('../web/room-six-journey.js');
const data=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../web/cases/room-six.json'),'utf8'));
function start(){const g=new Engine(data);g.start();return g;}
function collectOpen(g){for(const s of data.scenes)if(g.meets(s.requires))for(const h of s.hotspots)g.collect(h.evidence);}
function play(){const g=start();collectOpen(g);for(let round=0;round<12;round++){collectOpen(g);for(const c of data.characters)for(const q of c.questions)if(g.meets(q.requires))g.ask(c.id,q.id);for(const c of data.contradictions)if(g.meets(c.requires)&&c.proof.every(id=>g.state.evidence.includes(id)))g.confront(c.id,c.proof);for(const p of data.deductions)if(g.meets(p.requires)&&p.proof.every(id=>g.state.evidence.includes(id)))g.deduce(p.id,p.proof,p.interaction&&p.interaction.answer);}data.timeline.slots.forEach((s,i)=>g.setTimeline(i,s.event));assert(g.solveTimeline().ok);return g;}
function answer(){return {sections:Object.fromEntries(data.report.sections.map(s=>[s.id,{suspect:s.answer,proof:[...s.proof]}]))};}
test('interview guidance separates the instruction from the direct question',()=>{const g=start();collectOpen(g);for(const c of data.characters)for(const q of c.questions)if(q.id!=='s_exit'&&g.meets(q.requires))g.ask(c.id,q.id);assert.equal(g.nextLead().text,'از سامان بپرس\nخروج رها را دیدی؟');assert.equal(g.nextLead().id,'saman');});
test('first-clue comparison earns an actual second record once',()=>{const g=start();assert.equal(g.chooseOpening('compare').fast,true);assert.deepEqual(g.state.evidence,['E01','E02']);assert.equal(g.chooseOpening('compare').ok,false);assert.deepEqual(g.state.evidence,['E01','E02']);});
test('trusting an unverified statement adds a recoverable source check',()=>{const g=start();g.chooseOpening('trust');assert.deepEqual(g.state.evidence,['E01']);assert.equal(g.verifyOpening('original').ok,false);assert.equal(g.state.journey.checked,false);assert.equal(g.verifyOpening('sale').ok,true);assert.equal(g.state.journey.checked,true);g.collect('E02');assert(g.state.evidence.includes('E02'));});
test('every recommended step is reachable through both opening branches',()=>{for(const choice of ['compare','trust']){const g=start();g.chooseOpening(choice);if(choice==='trust')g.verifyOpening('sale');let finished=false;for(let n=0;n<100;n++){const lead=g.nextLead();if(lead.view==='report'){assert.equal(g.report(answer()).ok,true,choice);finished=true;break;}if(lead.kind==='collect')g.collect(lead.target);else if(lead.kind==='ask')g.ask(lead.id,lead.target);else if(lead.kind==='confront'){const p=data.contradictions.find(x=>x.id===lead.target);assert.equal(g.confront(p.id,p.proof).ok,true);}else if(lead.kind==='deduce'){const p=data.deductions.find(x=>x.id===lead.target);assert.equal(g.deduce(p.id,p.proof,p.interaction&&p.interaction.answer).ok,true);}else if(lead.view==='timeline'){data.timeline.slots.forEach((s,i)=>g.setTimeline(i,s.event));assert(g.solveTimeline().ok);}else assert.fail('Unusable recommended step: '+JSON.stringify(lead));}assert(finished,choice);}});
test('contradiction hints have three usable levels, survive restore, and do not solve for the player',()=>{const g=start();collectOpen(g);g.ask('mina','m_alibi');for(let i=0;i<5;i++)g.hint('m_false_alibi');assert.equal(g.state.hints.m_false_alibi,3);assert.equal(g.state.contradictions.length,0);const restored=new Engine(data,g.snapshot());assert.equal(restored.state.hints.m_false_alibi,3);assert.match(restored.hint('m_false_alibi')[2],/تماس تصویری سامان/);});
test('direct contradictory records suffice, but unrelated records and incomplete final reports do not',()=>{const g=start();collectOpen(g);g.ask('mina','m_alibi');g.ask('mina','m_meet');assert(g.confront('m_false_alibi',['E15']).ok);assert(g.confront('m_false_meet',['E17']).ok);assert.equal(g.confront('m_false_meet',['E17','E13']).ok,false);const a=answer();for(const section of Object.values(a.sections))section.proof=section.proof.filter(id=>g.state.evidence.includes(id));assert.equal(g.report(a).ok,false);});
test('old saves resume without a new opening and rewards cannot be farmed',()=>{const g=start();g.collect('E01');const old=g.snapshot();delete old.journey;const restored=new Engine(data,old);assert.equal(restored.state.journey.opening,'legacy');assert.equal(restored.journeyReward('first','تقدم'),'تقدم');assert.equal(restored.journeyReward('first','تقدم'),'');assert.equal(new Engine(data,restored.snapshot()).journeyReward('first','تقدم'),'');});
test('case validates and cannot collect before starting',()=>{const g=new Engine(data);assert.throws(()=>g.collect('E01'));});
test('hidden room and tank remain locked until their independent prerequisites',()=>{const g=start();assert.throws(()=>g.collect('E05'));assert.throws(()=>g.collect('E11'));collectOpen(g);const p=data.deductions[0];assert.equal(g.deduce(p.id,p.proof,'۱٫۸').ok,true);assert.throws(()=>g.collect('E05'));});
test('measurement requires a correct value and discovered proof',()=>{const g=start(),p=data.deductions[0];assert.throws(()=>g.deduce(p.id,p.proof,1.8));collectOpen(g);assert.equal(g.deduce(p.id,p.proof,1.65).ok,false);assert.equal(g.deduce(p.id,p.proof,'').ok,false);assert.deepEqual(g.state.deductions,[]);assert.equal(g.deduce(p.id,['E01'],1.8).ok,false);assert.equal(g.deduce(p.id,p.proof,'۱٫۸۰').ok,true);});
test('wrong synchronization and fragment rotation do not complete deductions',()=>{const g=start();collectOpen(g);for(const [id,value] of [['sync',-2],['paper',90]]){const p=data.deductions.find(x=>x.id===id);assert.equal(g.deduce(id,p.proof,value).ok,false);assert(!g.state.deductions.includes(id));}});
test('complete playthrough unlocks all scenes without confession dependency',()=>{const g=play();collectOpen(g);assert.equal(g.state.evidence.length,data.evidence.length);assert.equal(g.state.deductions.length,data.deductions.length);assert.equal(g.report(answer()).ok,true);assert.equal(g.progress(),100);});
test('correct names without proof never complete report',()=>{const g=start();const a=answer();for(const s of Object.values(a.sections))s.proof=[];assert.equal(g.report(a).ok,false);});
test('two reports have independent outcomes and can remain open',()=>{const g=play(),a=answer();a.sections.present={suspect:'open',proof:[]};const r=g.report(a);assert.equal(r.ok,false);assert.equal(r.outcomes[0].ok,true);assert.equal(r.outcomes[1].ok,false);const ev=[...g.state.evidence];g.retry();assert.deepEqual(g.state.evidence,ev);assert.equal(g.report(answer()).ok,true);});
test('assigning both events to one suspect fails despite full evidence',()=>{const g=play(),a=answer();a.sections.present.suspect='behzad';const r=g.report(a);assert.equal(r.ok,false);assert.equal(r.outcomes[0].ok,true);assert.equal(r.outcomes[1].ok,false);});
test('unrelated or undiscovered evidence cannot support report',()=>{const g=play(),a=answer();a.sections.present.proof.push('E13');assert.equal(g.report(a).ok,false);a.sections.present.proof.push('unknown');assert.throws(()=>g.report(a));});
test('unrelated evidence cannot challenge an alibi',()=>{const g=start();collectOpen(g);g.ask('mina','m_alibi');assert.equal(g.confront('m_false_alibi',['E13']).ok,false);});
test('adding the second required proof completes the two-document comparison',()=>{const g=start();collectOpen(g);assert.equal(g.deduce('sync',['E14'],'۲').ok,false);assert.equal(g.deduce('sync',['E14','E15'],'۲').ok,true);});
test('a supporting live call can accompany the two primary clock records',()=>{const g=start();collectOpen(g);assert.equal(g.deduce('sync',['E14','E15','E16'],2).ok,true);assert.equal(g.deduce('sync',['E14','E15','E13'],2).ok,false);});
test('all pre-unlock clues remain independently reachable',()=>{const g=start();collectOpen(g);for(const id of ['E01','E02','E03','E18','E19'])assert(g.state.evidence.includes(id),id);assert(!g.state.evidence.includes('E05'));});
test('each evidence exhibit has a different representation and never opens a zoom control',()=>{require('../web/room-six-visuals.js');const renders=data.evidence.map(e=>global.RoomSixVisuals.evidence(e));assert.equal(new Set(renders.map(s=>s.replace(/<figcaption>.*?<\/figcaption>/,'').replace(/data-exhibit="[^"]+"/,''))).size,data.evidence.length);for(const html of renders)assert(!html.includes('r6-zoom'));});
test('incorrect timeline is rejected and corrected chronology succeeds',()=>{const g=play();g.state.timeline=false;g.setTimeline(0,'confirm');assert.equal(g.solveTimeline().ok,false);g.setTimeline(0,'alive');assert.equal(g.solveTimeline().ok,true);});
test('progress roundtrips through SaveStore and stays independent of case47',()=>{const g=play(),memory=new Map(),store=new SaveStore({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},'room-six.save.v1');store.save(g.snapshot());const restored=new Engine(data,store.load());assert.equal(restored.report(answer()).ok,true);const old=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../web/cases/case47.json'),'utf8'));assert.throws(()=>new Engine(old,store.load()));assert.equal(new Engine(old).state.started,false);});

test('later report cannot be collected on the first night; opportunity does not establish the fatal act',()=>{const g=start();collectOpen(g);assert.throws(()=>g.collect('E23'));const p=data.deductions.find(x=>x.id==='sync');assert(g.deduce('sync',p.proof,2).ok);g.collect('E23');g.collect('E24');assert.throws(()=>g.deduce('fatal-act',['E14','E15','E16','E20']));const full=play(),act=data.deductions.find(x=>x.id==='fatal-act');full.state.deductions=full.state.deductions.filter(id=>id!=='fatal-act');assert.equal(full.deduce(act.id,act.proof.filter(id=>id!=='E24')).ok,false);assert.equal(new Engine(data,full.snapshot()).deduce(act.id,act.proof).ok,true);});

test('R026-R032 historic reconstruction requires the post-recording account and supports save restore',()=>{
 const g=start();collectOpen(g);
 const raw=data.deductions.find(p=>p.id==='raw');
 assert.equal(g.deduce('raw',['E07']).ok,false);
 assert.equal(g.deduce('raw',raw.proof).ok,true);
 const restored=new Engine(data,g.snapshot());
 assert(restored.state.evidence.includes('E26'));
 assert(restored.state.deductions.includes('raw'));
 const full=play(),a=answer();
 a.sections.past.proof=a.sections.past.proof.filter(id=>id!=='E26');
 assert.equal(full.report(a).outcomes.find(x=>x.id==='past').ok,false);
 assert.equal(full.report(answer()).ok,true);
});
test('R026-R032 recording and independent account are readable without duplicate exhibits',()=>{
 require('../web/room-six-visuals.js');
 for(const id of ['E07','E26']){
  const e=data.evidence.find(e=>e.id===id),html=global.RoomSixVisuals.evidence(e);
  assert(html.includes(e.body));
 }
});

test('each extra historic document is assessed independently and relevant context is accepted',()=>{
 const g=play();
 for(const section of data.report.sections)for(const e of data.evidence){
  if(section.proof.includes(e.id))continue;
  const a=answer();a.sections[section.id].proof.push(e.id);
  const result=g.report(a).outcomes.find(o=>o.id===section.id);
  assert.equal(result.ok,(section.related||[]).includes(e.id),section.id+' '+e.id);
  if(!result.ok)assert(result.message.includes(e.title),result.message);
 }
});
test('report has distinct complete, partial, open and wrong outcomes and retains choices',()=>{
 const g=play(),a=answer();g.report(a);assert.equal(g.state.reportKind,'complete');
 a.sections.past={suspect:'open',proof:[]};g.report(a);assert.equal(g.state.reportKind,'partial');
 assert.equal(g.state.reportOutcomes.find(x=>x.id==='present').ok,true);
 g.retry();const restored=new Engine(data,g.snapshot());assert.deepEqual(restored.state.reportDraft,a);
 a.sections.present={suspect:'open',proof:[]};g.report(a);assert.equal(g.state.reportKind,'open');
 a.sections.present={suspect:'behzad',proof:[]};g.report(a);assert.equal(g.state.reportKind,'wrong');
 g.retry();assert.equal(g.report(answer()).ok,true);
});
test('all deductions check empty, incomplete, correct, related and unrelated evidence',()=>{
 const g=play();
 for(const p of data.deductions){
  const value=p.interaction&&p.interaction.answer;
  assert.equal(g.deduce(p.id,[],value).ok,false,p.id);
  assert.equal(g.deduce(p.id,p.proof.slice(1),value).ok,false,p.id);
  assert.equal(g.deduce(p.id,p.proof,value).ok,true,p.id);
  for(const id of p.related||[])assert.equal(g.deduce(p.id,[...p.proof,id],value).ok,true,p.id+' '+id);
  const unrelated=data.evidence.find(e=>!p.proof.includes(e.id)&&!(p.related||[]).includes(e.id));
  if(unrelated)assert.equal(g.deduce(p.id,[...p.proof,unrelated.id],value).ok,false,p.id);
 }
});
test('numeric inputs and equivalent paper rotations are consistent',()=>{
 const g=play();
 for(const input of ['1.80','۱٫۸۰','١٫٨٠',' 1,80 '])assert(g.deduce('space',data.deductions.find(p=>p.id==='space').proof,input).ok);
 for(const input of ['',1.65,0])assert.equal(g.deduce('space',data.deductions.find(p=>p.id==='space').proof,input).ok,false);
 for(const angle of [0,90,270,360])assert.equal(g.deduce('paper',data.deductions.find(p=>p.id==='paper').proof,angle).ok,false);
 for(const angle of [180,540,-180,'۱۸۰'])assert(g.deduce('paper',data.deductions.find(p=>p.id==='paper').proof,angle).ok);
});
test('timeline rejects blanks, duplicate events and a swapped pair while preserving draft',()=>{
 const g=play();g.setTimeline(0,'');assert.equal(g.solveTimeline().ok,false);assert.equal(g.state.timelineDraft[0],'');
 g.setTimeline(0,data.timeline.slots[1].event);assert.equal(g.solveTimeline().ok,false);
 g.setTimeline(1,data.timeline.slots[0].event);assert.equal(g.solveTimeline().ok,false);
 data.timeline.slots.forEach((s,i)=>g.setTimeline(i,s.event));assert(g.solveTimeline().ok);
});
test('old saves preserve discoveries and explicitly require revised historic checks',()=>{
 const g=play(),s=g.snapshot();delete s.revision;s.ending='success';
 const r=new Engine(data,s);assert.deepEqual(r.state.evidence,s.evidence);assert.equal(r.state.ending,null);
 assert(r.state.reportFeedback.includes('به‌روز'));assert(!r.state.deductions.includes('past'));
});

test('all interview questions unlock only after their stated prerequisites',()=>{
 const full=play();
 for(const c of data.characters)for(const q of c.questions){
  const first=start();
  if(Object.keys(q.requires).length)assert.throws(()=>first.ask(c.id,q.id),q.id);
  else assert.equal(first.ask(c.id,q.id).id,q.id);
  assert(full.meets(q.requires),q.id);assert.equal(full.ask(c.id,q.id).id,q.id);
 }
});
test('every optional clue guide has three levels and restores its count without resolving the clue',()=>{
 const g=start();
 for(const p of [...data.deductions,...data.contradictions]){
  for(let i=1;i<=3;i++)assert.equal(g.hint(p.id).length,i,p.id);
  assert.equal(g.hint(p.id).length,3,p.id);
 }
 const r=new Engine(data,g.snapshot());
 assert.deepEqual(r.state.hints,g.state.hints);
 assert.equal(r.state.deductions.length,0);assert.equal(r.state.contradictions.length,0);
});
