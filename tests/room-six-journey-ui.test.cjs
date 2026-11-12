'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{for(const width of [390,1280])for(const choice of ['compare','trust']){
 const p=await browser.newPage({viewport:{width,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.KavianBazaar={hasOwnership:()=>true};});await p.goto(pathToFileURL(path.resolve(__dirname,'../dist/kavian-room-six-dev.html')).href);
 await p.evaluate(()=>{const original=CaseAudio.prototype.buildForest,play=CaseAudio.prototype.pianoNote;CaseAudio.prototype.buildForest=function(){window.__forestAudio=this;return original.call(this);};CaseAudio.prototype.pianoNote=function(hz,t){(window.__notes||(window.__notes=[])).push({hz,t});return play.call(this,hz,t);};});
 await p.locator('[data-action="select-case"][data-id="room-six"]').click();await p.locator('[data-action="start"]').click();
 assert.match(await p.locator('#dialog').innerText(),/صدای جنگل/);await p.locator('[data-action="begin"]').click();
 assert.equal(await p.locator('.r6-opening').count(),1);assert.equal(await p.locator('.r6-journey').count(),1);
 await p.locator('[data-action="r6-opening"][data-choice="'+choice+'"]').click();
 const state=()=>p.evaluate(()=>new CaseEngine.SaveStore(localStorage,'room-six.save.v1').load());
 assert.equal((await state()).journey.opening,choice);assert((await state()).evidence.includes('E01'));
 assert.equal((await state()).evidence.includes('E02'),choice==='compare');
 await p.locator('#dialog [data-action="close"]').first().click();assert(await p.locator('#toast').innerText());
 if(choice==='trust'){await p.locator('[data-action="r6-check-opening"][data-answer="original"]').click();assert.match(await p.locator('#r6-opening-feedback').innerText(),/نقشه آگهی فروش ویلا/);assert.equal((await state()).journey.checked,false);await p.locator('[data-action="r6-check-opening"][data-answer="sale"]').click();assert.equal((await state()).journey.checked,true);}
 await p.waitForFunction(()=>window.__notes&&window.__notes.length>=3);const audio=await p.evaluate(()=>({state:__forestAudio.context.state,notes:__notes.slice(0,3),melody:__forestAudio.melody()}));
 assert.equal(audio.state,'running');assert.equal(audio.melody.length,16);assert(Math.abs(audio.notes[1].t-audio.notes[0].t-.76)<.001);
 await p.reload();await p.locator('[data-action="select-case"][data-id="room-six"]').click();assert.equal(await p.locator('.r6-opening').count(),0);
 // Collect the direct record, hear the claim, then use all three guide levels.
 
 await p.locator('[data-action="navigate"][data-view="interview"]').click();await p.locator('[data-action="person"][data-id="mina"]').click();await p.locator('[data-action="ask"][data-id="m_alibi"]').click();await p.locator('#dialog [data-action="close"]').first().click();
 await p.locator('[data-action="confront"][data-id="m_false_alibi"]').click();assert.match(await p.locator('.r6-proof-task').innerText(),/ثبت مستقیم حضور/);
 for(let n=0;n<3;n++)await p.locator('[data-action="hint"]').click();assert.equal(await p.locator('.r6-hint-step').count(),3);assert.match(await p.locator('#hint-text').innerText(),/تماس تصویری سامان/);
 await p.locator('[data-action="r6-find-proof"][data-id="E15"]').click();assert.equal(await p.locator('.scene-board.r6-guest').count(),1);await p.locator('[data-action="collect"][data-id="E15"]').first().click();await p.locator('#dialog [data-action="close"]').first().click();await p.locator('[data-action="r6-return-review"]').click();assert.equal(await p.locator('.r6-hint-step').count(),3);await p.locator('[data-action="r6-place-proof"]').click();assert.equal(await p.locator('input[name="puzzle"]:checked').count(),1);assert.equal(await p.locator('input[name="puzzle"][value="E15"]').isChecked(),true);
 await p.locator('[data-action="solve"]').click();assert((await state()).contradictions.includes('m_false_alibi'));await p.locator('#dialog [data-action="close"]').first().click();assert.match(await p.locator('#toast').innerText(),/غیبت مینا/);
 await p.reload();await p.locator('[data-action="select-case"][data-id="room-six"]').click();assert.equal((await state()).hints.m_false_alibi,3);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.deepEqual(errors,[]);await p.close();
}
console.log('PASS: both opening routes, real clue reward, recovery check, saved progress, actionable three-level claim guide, proof placement, encouragement and forest melody at mobile/desktop sizes.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
