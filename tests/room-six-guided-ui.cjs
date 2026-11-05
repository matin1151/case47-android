'use strict';
const {chromium}=require('playwright'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});try{
for(const choice of ['compare','trust']){
const p=await b.newPage({viewport:{width:768,height:1024}}),log=[],errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(pathToFileURL(path.resolve(__dirname,'../dist/kavian-room-six-dev.html')).href);
await p.locator('[data-action="select-case"][data-id="room-six"]').click();await p.locator('[data-action="start"]').click();await p.locator('[data-action="begin"]').click();
await p.locator('[data-action="r6-opening"][data-choice="'+choice+'"]').click();await p.locator('#dialog [data-action="close"]').first().click();
if(choice==='trust')await p.locator('[data-action="r6-check-opening"][data-answer="sale"]').click();
for(let n=0;n<160;n++){
 if(await p.locator('#r6-report-form').count())break;
 await p.locator('[data-action="r6-next"]').first().click();if(await p.locator('#r6-report-form').count())break;
 if(await p.locator('#dialog[open]').count()){
  if(await p.locator('[data-action="solve"]').count()){
   log.push(await p.locator('#dialog-title').innerText());console.log(choice+' / '+log.at(-1));
   for(let h=0;h<3;h++)await p.locator('[data-action="hint"]').click();
   await p.locator('[data-action="r6-place-proof"]').click();
   const input=p.locator('#r6-input');
   if(await input.count()){const label=await input.getAttribute('aria-label'),guide=await p.locator('#hint-text').innerText();
    if(label.includes('درجه')){await input.fill('۹۰');await p.screenshot({path:path.resolve(__dirname,'../paper-90.png')});await input.fill('۱۸۰');await p.screenshot({path:path.resolve(__dirname,'../paper-180.png')});}const value=label.includes('درجه')?'۱۸۰':label.includes('متر')?'۱٫۸':'۲';
    assert(guide.includes(value)||guide.includes(value.replace('٫','٫'))||guide.includes('۱۸۰'));
    await input.fill(value);
   }
   await p.locator('[data-action="solve"]').click();
   assert.equal(await p.locator('#puzzle-feedback').count(),0,'Puzzle rejected: '+await p.locator('#dialog').innerText());
  }
  await p.locator('#dialog [data-action="close"]').first().click();
 }else if(await p.locator('.r6-target').count()){
  await p.locator('.r6-target').first().click();await p.locator('#dialog [data-action="close"]').first().click();
 }else if(await p.locator('[data-slot]').count()){
  const patterns=[/تماس زنده نیما/,/تنها ورود/,/صدای برخورد/,/خروج همان/,/بازگشت مینا/,/مشاهده وضعیت/,/ورود مشترک/,/تأیید مرگ/];
  const slots=p.locator('[data-slot]');for(let i=0;i<patterns.length;i++){const opts=await slots.nth(i).locator('option').allTextContents(),index=opts.findIndex(t=>patterns[i].test(t));assert(index>=0);await slots.nth(i).selectOption({index});}
  await p.locator('[data-action="timeline-submit"]').click();
  if(await p.locator('#dialog[open]').count())await p.locator('#dialog [data-action="close"]').first().click();
 }else throw Error('No visible next action: '+await p.locator('body').innerText());
}
assert(await p.locator('#r6-report-form').count());
await p.locator('select[name="past-suspect"]').selectOption({label:'بهزاد'});await p.locator('select[name="present-suspect"]').selectOption({label:'مینا'});
const past=['قطعه آویز','عکس یادگاری قدیمی رها','صدای خام','مغایرت‌های مالی','گزارش گروه بررسی مخزن','یادداشت نیما و پیوست پرونده جست‌وجو'];
const present=['ثبت پیوسته دوربین','تماس تصویری سامان','تماس زنده نیما','پیام قرار','بخش بزرگ برگه','بخش کوچک برگه','گزارش اتاق مطالعه','گزارش تکمیلی مرگ نیما','بررسی ابزار و سرآستین','دو اظهارنظر امضاشده مینا'];
for(const [group,titles]of [['past',past],['present',present]])for(const title of titles){const row=p.locator('fieldset').filter({has:p.locator('select[name="'+group+'-suspect"]')}).locator('.proof-option').filter({has:p.locator('label span').filter({hasText:title})});await row.locator('input').check();}
await p.locator('#r6-report-form button[type="submit"]').click();
assert.match(await p.locator('.ending h1').innerText(),/گزارش مستند/);
await p.locator('.r6-epilogue summary').click();assert.match(await p.locator('.r6-epilogue').innerText(),/چهار هفته|تطبیق نمونه/);
await p.locator('[data-action="retry"]').click();assert.equal(await p.locator('select[name="past-suspect"]').inputValue(),'behzad');assert.equal(await p.locator('input[name="r6-past"]:checked').count(),past.length);
assert.deepEqual(errors,[]);console.log(JSON.stringify({choice,steps:log,report:'complete',uiOnly:true,usedBuiltInHints:true}));await p.close();
}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1;});
