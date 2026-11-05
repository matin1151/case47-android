'use strict';
const fs=require('fs'),assert=require('assert/strict'),vm=require('vm'),path=require('path');
const {Engine}=require('../web/engine.js');
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'fixtures/baseline-room-six-engine.js'),'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'fixtures/baseline-room-six-journey.js'),'utf8'));
const d=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/baseline-room-six.json'),'utf8')),g=new Engine(d);g.start();
for(let n=0;n<12;n++){
for(const s of d.scenes)if(g.meets(s.requires))for(const h of s.hotspots)g.collect(h.evidence);
for(const c of d.characters)for(const q of c.questions)if(g.meets(q.requires))g.ask(c.id,q.id);
for(const c of d.contradictions)if(g.meets(c.requires)&&c.proof.every(id=>g.state.evidence.includes(id)))g.confront(c.id,c.proof);
for(const p of d.deductions)if(g.meets(p.requires)&&p.proof.every(id=>g.state.evidence.includes(id)))g.deduce(p.id,p.proof,p.interaction&&p.interaction.answer);
}
d.timeline.slots.forEach((s,i)=>g.setTimeline(i,s.event));g.solveTimeline();
const a=()=>({sections:Object.fromEntries(d.report.sections.map(s=>[s.id,{suspect:s.answer,proof:[...s.proof]}]))});
const results=[];
assert(g.report(a()).ok);
for(const id of ['E04','E09','E10']){const x=a();x.sections.past.proof.push(id);assert.equal(g.report(x).outcomes.find(o=>o.id==='past').ok,false);results.push({R:'R097-R101',case:'required proof + '+id,before:'rejected relevant supporting evidence'});}
const paper=d.deductions.find(p=>p.id==='paper');assert.equal(g.deduce('paper',paper.proof,90).ok,false);results.push({R:'R089',case:'90 degrees',before:'rejected; no validation bug reproduced'});
assert.equal(g.deduce('paper',paper.proof,540).ok,false);results.push({R:'R088',case:'540 degrees',before:'equivalent orientation rejected'});
assert.throws(()=>g.setTimeline(0,''));results.push({R:'R139',case:'clear timeline slot',before:'throws instead of accepting blank draft'});
const partial=a();partial.sections.past={suspect:'open',proof:[]};g.report(partial);assert.equal(g.state.ending,'failure');assert(!g.state.reportDraft);results.push({R:'R102-R105',case:'partial report',before:'generic failure; draft not persisted'});
const raw=d.evidence.find(e=>e.id==='E07');assert(raw.body.includes('کمک'));results.push({R:'R026-R048',case:'historic source review',before:{raw:raw.body,finance:d.evidence.find(e=>e.id==='E08').body}});
console.log(JSON.stringify({baseline:'04e4f8e56ee68a3138319f392573812d6b5d649d',results},null,2));
