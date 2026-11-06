'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const baseline=process.argv[2];
 const url=pathToFileURL(baseline?path.resolve(baseline):path.resolve(__dirname,'../dist/kavian-room-six-dev.html')).href;
 for(const choice of baseline?['compare']:['compare','trust']){
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
  try {
  const page=await browser.newPage({viewport:choice==='compare'?{width:390,height:844}:{width:1280,height:900}});
  page.setDefaultTimeout(5000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const action=(name,id)=>page.locator('button[data-action="'+name+'"]'+(id?'[data-id="'+id+'"]':''));
  const dialog=page.locator('#dialog');
  const close=()=>dialog.locator('[data-action=close]').first().click();
  const navigate=view=>action('navigate').and(page.locator('[data-view="'+view+'"]')).first().click();
  const collect=id=>page.locator('.scene-side').locator(action('collect',id)).click();
  const question=async()=>{await navigate('interview');await action('person','behzad').click();};
  const claim=action('confront','b_false_space');
  await page.goto(url);
  await action('select-case','room-six').click();await action('start').click();await action('begin').click();
  await action('r6-opening').and(page.locator('[data-choice='+choice+']')).click();await close();
  if(choice==='trust')await action('r6-check-opening').and(page.locator('[data-answer=sale]')).click();
  await collect('E21');
  const statements=await dialog.innerText();
  for(const name of ['بهزاد','مینا','لیلا','سامان'])assert.equal(statements.split(name+':').length-1,baseline?2:1);
  assert.match(statements,baseline?/از شروع تماس کنار سامان بودم/:/از شروع تماس تصویری سامان کنار او بودم/);
  await close();
  await navigate('evidence');assert.equal(await action('evidence','E02').count(),choice==='compare'?1:0);await navigate('scene');
  if(choice==='trust'){await action('scene','r6-archive').click();await collect('E02');await close();await action('scene','r6-living').click();}
  const measure=action('r6-next').filter({hasText:'بررسی اندازه‌های هم‌مبنا'}).first();
  await measure.click();
  if(baseline){assert.equal(await dialog.evaluate(d=>d.open),false);assert.match(await page.locator('.scene-side').innerText(),/بررسی نشده/);await collect('E03');}
  else assert.match(await dialog.innerText(),/اندازه‌های هم‌مبنا/);
  await close();
  assert.match(await page.locator('.scene-side').locator(action('collect','E03')).innerText(),/ثبت شده/);
  await question();await action('ask','b_space').click();
  assert.match(await dialog.innerText(),/بایگانی‌ای در کار نبود/);await close();
  if(baseline){
   assert.match(await claim.innerText(),/پشت دیوار فضایی نیست.*مدارک مرتبط را ارائه کن/s);
   await claim.click();
   assert.equal(await dialog.locator('input[value=E02]').count(),1);
   assert.equal(await dialog.locator('input[value=E22]').count(),0);await close();
   await navigate('board');await action('deduction','space').click();
  }else{
   assert.equal(await claim.count(),0);
   await page.reload();await action('select-case','room-six').click();await question();
   assert.equal(await claim.count(),0);
   assert.match(await action('r6-space-step').innerText(),/بخش گمشده نقشه/);
   await action('r6-space-step').click();
  }
  assert.match(await dialog.innerText(),/بخش گمشده نقشه/);
  for(const id of ['E01','E02','E03'])await dialog.locator('input[value='+id+']').check();
  await page.locator('#r6-input').fill('۱٫۸');await action('solve').click();
  assert.match(await dialog.innerText(),/۱٫۸۰ متر.*۱٫۶۵ متر/s);
  if(baseline){
   assert.doesNotMatch(await dialog.innerText(),/بازدید کمد و ضلع شرقی/);await close();
   assert.match(await action('r6-next').first().innerText(),/گفت‌وگو با مینا/);
  }else{
   assert.match(await dialog.innerText(),/مکان تازه باز شد: بازدید کمد و ضلع شرقی/);
   await dialog.locator(action('r6-space-step')).click();
   assert.match(await page.locator('.scene-caption').innerText(),/بازدید کمد و ضلع شرقی/);
   await page.reload();await action('select-case','room-six').click()
   assert.match(await action('r6-next').first().innerText(),/رفتن به بازدید کمد و ضلع شرقی/);
   await question();assert.equal(await claim.count(),0);
   assert.match(await action('r6-space-step').innerText(),/رفتن به بازدید کمد و ضلع شرقی/);
   await action('r6-space-step').click();await collect('E22');await close();
   await question();assert.match(await claim.innerText(),/پشت کمد فقط تأسیسات است؟/);await claim.click();
   assert.match(await page.locator('#dialog-title').innerText(),/پشت کمد فقط تأسیسات است؟/);
   for(const id of ['E02','E22'])await dialog.locator('input[value='+id+']').check();
   await action('solve').click();assert.match(await dialog.innerText(),/پوشش کمد.*اتاق کار/s);
   await close();assert.match(await claim.innerText(),/تناقض اثبات شده/);
   await navigate('scene');await action('scene','r6-guest').click();await collect('E15');
   assert.match(await dialog.innerText(),/مینا از آغاز تماس تا ورود با آب در ۲۳:۵۲ در قاب نیست/);
   assert.match(statements,/۲۳:۵۱.*۲۳:۵۲/);await close();
  }
  assert.deepEqual(errors,[]);
  console.log(baseline?'All five issues reproduced in baseline UI':choice+': UI checks passed');
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
