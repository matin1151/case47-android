'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {Engine}=require('../web/engine.js');require('../web/room-six-engine.js');require('../web/room-six-journey.js');
const data=JSON.parse(fs.readFileSync('web/cases/room-six.json','utf8'));
function full(){const g=new Engine(data);g.start();for(let round=0;round<20;round++){
 for(const scene of data.scenes)if(g.meets(scene.requires))for(const h of scene.hotspots)g.collect(h.evidence);
 for(const c of data.characters)for(const q of c.questions)if(g.meets(q.requires))g.ask(c.id,q.id);
 for(const c of data.contradictions)if(g.meets(c.requires)&&c.proof.every(id=>g.state.evidence.includes(id)))g.confront(c.id,c.proof);
 for(const p of data.deductions)if(g.meets(p.requires)&&p.proof.every(id=>g.state.evidence.includes(id)))g.deduce(p.id,p.proof,p.interaction?.answer);
 }data.timeline.slots.forEach((s,i)=>g.setTimeline(i,s.event));assert(g.solveTimeline().ok);return g;}
function report(){return {sections:Object.fromEntries(data.report.sections.map(s=>[s.id,{suspect:s.answer,proof:[...s.proof]}]))};}
test('T01 full note is inaccessible until discovering the archive',()=>{const g=new Engine(data);g.start();assert.throws(()=>g.collect('E26'));assert.deepEqual(data.scenes.find(s=>s.hotspots.some(h=>h.evidence==='E26')).requires,{deductions:['entrance']});assert(full().state.evidence.includes('E26'));});
test('T02 technical evidence contains no future confession',()=>assert(!data.evidence.find(e=>e.id==='E13').body.includes('می‌پذیرد')));
test('T03 completed paper deduction is accepted as a report reference',()=>{const g=full(),a=report();a.sections.present.proof=a.sections.present.proof.filter(id=>!['E18','E19'].includes(id));assert(g.report(a).ok);});
test('T03 missing evidence is named exactly',()=>{const g=full(),a=report();a.sections.present.proof=a.sections.present.proof.filter(id=>id!=='E24');assert.match(g.report(a).feedback,/بررسی ابزار و سرآستین/);});
test('T04 new witness answer leads back to unresolved injury',()=>{const g=full();g.state.contradictions=g.state.contradictions.filter(id=>id!=='b_false_saman');assert.equal(g.nextLead().target,'b_false_saman');});
test('T12 partial report names only the remaining investigation',()=>{const g=full(),a=report();a.sections.present.suspect='open';g.report(a);assert.equal(g.state.reportKind,'partial');assert.match(g.nextLead().text,/یک بخش مستند شده/);assert.match(g.nextLead().text,/قتل نیما/);assert(!g.nextLead().text.includes('به نتیجه نرسید'));});
test('purchase UI never trusts local save ownership',async()=>{require('../web/entitlements.js');const owner=new global.CaseOwnership(new global.BazaarOwnership());assert(!owner.canOpen(data));assert((await owner.purchase(data)).owned===false);assert(owner.canOpen({entitlement:'free'}));});
