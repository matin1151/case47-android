'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
const options={headless:true};if(process.env.CHROMIUM_PATH)options.executablePath=process.env.CHROMIUM_PATH;
const browser=await chromium.launch(options);
try{
for(const width of [390,1280]){
const page=await browser.newPage({viewport:{width,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.resolve(__dirname,'../dist/kavian-room-six-dev.html')).href);
assert.equal(await page.locator('.library-card').count(),2);
await page.locator('[data-action="select-case"][data-id="room-six"]').click();
await page.locator('[data-action="start"]').click();await page.locator('[data-action="begin"]').click();
assert.equal(await page.locator('.r6-map').count(),1);assert(await page.locator('.scene-board').evaluate(e=>e.getBoundingClientRect().width>250));assert(await page.locator('.scene-board').evaluate(e=>getComputedStyle(e).backgroundImage.startsWith('url("data:image/jpeg')));
assert.equal(await page.locator('[data-action="r6-zoom"]').count(),0);
assert.match(await page.locator('.r6-room-description').innerText(),/نشیمن|پوشه فروش/);
await page.locator('.r6-map summary').click();
assert.equal(await page.locator('.r6-plan [role="button"]').count(),6);
await page.locator('[data-action="r6-help"]').click();
assert.match(await page.locator('#dialog').innerText(),/آرشیو/);await page.locator('#dialog [data-action="close"]').first().click();
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await page.locator('[data-action="collect"][data-id="E01"]').first().click();
assert.equal(await page.locator('#dialog [data-exhibit="E01"] .r6-plan').count(),1);assert.equal(await page.locator('#dialog [data-action="r6-zoom"]').count(),0);await page.locator('#dialog [data-action="close"]').first().click();
for(const [scene,ids] of [['r6-archive',['E02']],['r6-office',['E03']]]){
await page.locator('.scene-tabs [data-action="scene"][data-id="'+scene+'"]').first().click();
for(const id of ids){await page.locator('[data-action="collect"][data-id="'+id+'"]').first().click();await page.locator('#dialog [data-action="close"]').first().click();}
}
await page.locator('[data-action="navigate"][data-view="board"]').click();await page.locator('[data-action="deduction"][data-id="space"]').click();
assert.equal(await page.locator('#dialog [data-proof-search],#dialog [data-proof-kind]').count(),0);
await page.locator('#r6-input').fill('1.65');
for(const id of ['E01','E02','E03'])await page.locator('input[name="puzzle"][value="'+id+'"]').check();
await page.locator('[data-action="solve"]').click();assert.match(await page.locator('#puzzle-feedback').innerText(),/واحد/);
await page.locator('#r6-input').fill('۱٫۸');await page.locator('[data-action="solve"]').click();assert.match(await page.locator('#dialog').innerText(),/۱٫۸۰/);
await page.locator('#dialog [data-action="close"]').first().click();
// Two-proof deduction must accept the second selected document and preserve the first.
await page.locator('[data-action="navigate"][data-view="scene"]').click();
for(const [scene,ids] of [['r6-guest',['E15']],['r6-study',['E18']],['r6-terrace',['E14','E16','E17','E19']]]){
await page.locator('.scene-tabs [data-action="scene"][data-id="'+scene+'"]').first().click();
for(const id of ids){await page.locator('[data-action="collect"][data-id="'+id+'"]').first().click();assert.equal(await page.locator('#dialog [data-exhibit="'+id+'"]').count(),1);await page.locator('#dialog [data-action="close"]').first().click();}
}
await page.locator('[data-action="navigate"][data-view="board"]').click();
await page.locator('[data-action="deduction"][data-id="sync"]').click();await page.locator('#r6-input').fill('۲');
await page.locator('input[name="puzzle"][value="E14"]').check();await page.locator('[data-action="solve"]').click();assert.match(await page.locator('#puzzle-feedback').innerText(),/کم است/);
await page.locator('input[name="puzzle"][value="E15"]').check();assert.equal(await page.locator('input[name="puzzle"]:checked').count(),2);
await page.locator('[data-action="solve"]').click();assert.match(await page.locator('#dialog').innerText(),/۲ دقیقه/);await page.locator('#dialog [data-action="close"]').first().click();
await page.locator('[data-action="deduction"][data-id="paper"]').click();
assert.equal(await page.locator('.r6-paper-upper,.r6-paper-lower').count(),2);
await page.locator('[data-action="r6-rotate"]').click();await page.locator('[data-action="r6-rotate"]').click();assert.equal(await page.locator('#r6-input').inputValue(),'180');await page.locator('#r6-input').fill('۹۰');await page.locator('[data-action="r6-rotate"]').click();assert.equal(await page.locator('#r6-input').inputValue(),'180');
for(const id of ['E17','E18','E19'])await page.locator('input[name="puzzle"][value="'+id+'"]').check();
await page.locator('[data-action="solve"]').click();assert.match(await page.locator('#dialog').innerText(),/جمله کامل/);await page.locator('#dialog [data-action="close"]').first().click();
await page.locator('[data-action="navigate"][data-view="evidence"]').click();
for(const id of ['E01','E02','E03','E14','E15','E16','E17','E18','E19']){
 await page.locator('[data-action="evidence"][data-id="'+id+'"]').click();
 assert.equal(await page.locator('#dialog [data-exhibit="'+id+'"]').count(),1);
 assert.equal(await page.locator('#dialog [data-action="r6-zoom"]').count(),0);
 await page.locator('#dialog [data-action="close"]').first().click();
}
await page.locator('[data-action="report"]').click();assert.equal(await page.locator('#r6-report-form fieldset').count(),2);
await page.locator('#r6-report-form button[type="submit"]').click();assert.match(await page.locator('.report-feedback').innerText(),/باز مانده/);
await page.locator('[data-action="retry"]').click();assert.equal(await page.locator('#r6-report-form').count(),1);
await page.reload();await page.locator('[data-action="select-case"][data-id="room-six"]').click();
assert.equal(await page.locator('.r6-map').count(),1);
assert.deepEqual(errors,[]);await page.close();
}
console.log('Room Six mobile/desktop UI, fixed images, direct proof selection, two-proof solve, paper rotation, partial report, retry and reload passed.');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
