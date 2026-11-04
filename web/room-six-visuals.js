(function(global){
'use strict';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function photo(sheet,panel,label){return '<div class="r6-photo r6-sheet-'+sheet+'" role="img" aria-label="'+esc(label)+'" style="--r6-x:'+((panel%3)*50)+'%;--r6-y:'+(panel<3?0:100)+'%"></div>';}
// A dimensioned native drawing keeps clues exact, including the narrow NE strip.
function plan(mode,active,known){
 const interactive=mode==='navigation',original=mode==='original';
 const rooms=[['r6-guest','مهمان',0,0,3,4.6],['r6-archive','آرشیو ملک',3,0,5,4.6],['r6-office','کار بهزاد',8,1.8,4,2.8],['r6-hidden',original?'بایگانی':known?'پهنه ششم':'خدمات',8,0,4,1.8],['r6-living','نشیمن',3,5.6,5,4.4],['r6-study','کتابخانه',8,5.6,4,4.4]];
 const rect=(x,y,w,h,cls)=>'<rect class="'+cls+'" x="'+(30+x*40)+'" y="'+(35+y*40)+'" width="'+w*40+'" height="'+h*40+'"/>';
 const text=(x,y,t)=>'<text x="'+(30+x*40)+'" y="'+(35+y*40)+'" text-anchor="middle" dominant-baseline="middle">'+esc(t)+'</text>';
 const door=(x,y)=>'<path class="map-door" d="M '+(30+x*40)+' '+(35+y*40)+' h 24 m -24 0 v -24 m 0 24 a 24 24 0 0 1 24 -24"/>';
 const fixtures='<g class="map-fixtures">'+rect(.35,.35,1.55,1.7,'map-furniture')+rect(.45,.45,1.35,.35,'map-furniture')+rect(3.2,.25,.3,3.6,'map-furniture')+rect(3.2,.25,4.4,.3,'map-furniture')+rect(5.8,3.4,1.5,.6,'map-furniture')+rect(8.35,2.05,3.2,.3,'map-furniture')+rect(8.4,3.7,1.5,.55,'map-furniture')+rect(.2,5.8,.4,1.9,'map-furniture')+rect(.2,5.8,2.5,.4,'map-furniture')+rect(.3,8.25,.65,.9,'map-furniture')+rect(2.1,8.25,.6,.45,'map-furniture')+rect(3.5,5.9,2.5,.55,'map-furniture')+rect(3.5,5.9,.55,1.4,'map-furniture')+rect(5.4,8,1.5,.65,'map-furniture')+rect(8.2,5.95,.3,3.65,'map-furniture')+rect(9.8,8.9,1.5,.55,'map-furniture')+'</g>';
 return '<svg class="r6-plan" viewBox="0 0 540 480" role="'+(interactive?'group':'img')+'" aria-label="'+(original?'نقشه اصلی با بایگانی شمال‌شرقی':'نقشه ویلا با اتاق‌های متفاوت و سرویس محصور')+'"><text x="270" y="16" text-anchor="middle">شمال ↑  ·  ۱۲ متر</text>'+rect(0,0,12,10,'map-outline')+rooms.map(([id,label,x,y,w,h])=>'<g '+(interactive?'role="button" tabindex="0" data-action="scene" data-id="'+id+'" aria-label="'+label+'"':'')+' class="map-zone '+(active===id?'selected':'')+'">'+rect(x,y,w,h,'map-room')+text(x+w/2,y+h/2,label)+'</g>').join('')+rect(0,4.6,12,1,'map-hall')+text(6,5.1,'راهرو')+rect(0,5.6,3,2.4,'map-service')+text(1.5,6.8,'آشپزخانه')+rect(0,8,3,2,'map-service')+text(1.5,9,'سرویس')+fixtures+door(1.9,4.6)+door(5,4.6)+door(9.3,4.6)+door(5,5.6)+door(9.3,5.6)+door(2,8)+(original?door(9.3,1.8)+'<path class="map-door" d="M510 55v25h-24"/>':'')+'<path class="map-window" d="M510 280v120M175 435h120"/><text x="270" y="464" text-anchor="middle">عمق بنا ۱۰ متر · شیشه کتابخانه ثابت است</text></svg>';
}
const paper='<div class="r6-paper-upper">رها گفت قصد رفتن دارد؛ اما…</div><div class="r6-paper-lower">من خروجش را ندیدم. مینا.</div>';
function fragments(which,both){return '<div class="r6-paper-table" data-paper-view="'+which+'">'+(both||which==='E18'?paper.split('<div class="r6-paper-lower">')[0]:'')+(both||which==='E19'?'<div class="r6-paper-lower" style="--paper-angle:180deg">من خروجش را ندیدم. مینا.</div>':'')+'</div>';}
function document(e,inside){return '<figure class="r6-exhibit" data-exhibit="'+esc(e.id)+'"><figcaption>'+esc(e.title)+'</figcaption>'+inside+'</figure>';}
function sheet(title,body){return '<div class="r6-readable-sheet"><h3>'+esc(title)+'</h3>'+body+'</div>';}
function evidence(e){
 let v;
 switch(e.id){
 case 'E01':v='<p class="r6-document-note">لیلا قصد فروش ویلا را دارد. این برگه چیدمان اتاق‌ها برای آگهی فروش است؛ نقشه فنی اصلی ساختمان نیست.</p>'+plan('sale')+'<p class="r6-document-note">پیوست نسخه اصلی: پوشه آبی ملک، قفسه سمت چپ آرشیو</p>';break;
 case 'E02':v=plan('original');break;
 case 'E03':v=sheet('برگه برداشت مشترک','<p>مرجع هر دو اندازه: خط ثابت اتاق کار</p><dl><dt>تا انتهای داخلی ضلع شمالی</dt><dd dir="ltr">۴٫۶۰ m</dd><dt>تا روی پوشش کمد</dt><dd dir="ltr">۲٫۸۰ m</dd><dt>ضخامت دیوار</dt><dd dir="ltr">۰٫۱۵ m</dd></dl><p>اختلاف کلی را جدا از فضای مفید حساب کن.</p>');break;
 case 'E04':v=sheet('رسید تعمیرات · آذر ۱۳۹۸','<p>درخواست‌کننده: بهزاد</p><p>اجرای پوشش یکپارچه مقابل ورودی بایگانی</p><p>عنوان ثبت‌شده: تعمیر رطوبت</p><span class="r6-stamp">رونوشت آرشیو تعمیرات</span>');break;
 case 'E05':v=photo('closeups',3,'نمای نزدیک آویز برگ در شکاف خشک کف کنار قفسه');break;
 case 'E06':v='<div class="r6-raha-souvenir" role="img" aria-label="عکس یادگاری قدیمی رها با لبخند کنار پنجره نشیمن ویلا؛ جنگل و مبل در پس‌زمینه و آویز برگ روی سینه دیده می‌شوند"></div>';break;
 case 'E07':v=sheet('رونوشت نسخه خام','<p>رها: این دو صورت‌حساب یک هزینه‌اند؛ گزارش می‌کنم.</p><p>بهزاد: این مدارک از اینجا بیرون نمی‌رود.</p><p>نیما: باید کمک بخواهیم.</p><p>بهزاد: اول مدارک.</p><small>مسیر نسخه آفلاین در دفتر فهرست فایل‌های نیما ثبت شده است.</small>');break;
 case 'E08':v=sheet('تطبیق صورت‌حساب‌ها','<table><thead><tr><th>ثبت</th><th>مشاهده</th></tr></thead><tbody><tr><td>دو پرداخت</td><td>یک خدمت مشترک</td></tr><tr><td>امضاها</td><td>ناسازگار</td></tr><tr><td>نسخه مستقل</td><td>هم‌خوان با یادداشت رها</td></tr></tbody></table><p>مدیر اجرایی: بهزاد · مسئول اسناد: نیما</p>');break;
 case 'E09':v=sheet('پرونده مشاوره','<p>پرداخت‌کننده: بهزاد ← دریافت‌کننده: نیما</p><p>عنوان: مشاوره · پرداخت دوره‌ای</p><blockquote>نسخه صدا می‌ماند، تا وقتی توافقمان بماند.</blockquote><small>رونوشت پیام نیما به بهزاد، در دوره پرداخت‌ها</small>');break;
 case 'E10':v='<svg class="r6-site-plan" viewBox="0 0 400 360" role="img" aria-label="مخزن متروک شش متر شمال ویلا، جدا از مخزن فعال"><rect x="20" y="20" width="360" height="320" rx="15" fill="#e5dcc1"/><g fill="#374d3d" stroke="#687c5f" stroke-width="3"><circle cx="60" cy="65" r="20"/><circle cx="335" cy="90" r="23"/><rect x="140" y="38" width="120" height="40"/><rect x="80" y="175" width="240" height="125"/><rect x="15" y="225" width="50" height="50"/></g><g fill="#283a30" font-size="15" text-anchor="middle"><text x="200" y="28">شمال ↑</text><text x="200" y="105">مخزن متروک</text><text x="245" y="145">۶ متر</text><text x="200" y="325">بنای ویلا</text><text x="55" y="210">مخزن فعال</text></g><path d="M200 80v90" stroke="#8b5944" stroke-width="2" stroke-dasharray="5 4"/></svg><p class="r6-document-note">پیوست جست‌وجوی ۱۳۹۸: مخزن متروک تخلیه نشده است.</p>';break;
 case 'E11':v=sheet('گزارش بررسی مخزن','<p>محل: مخزن متروک شمال بنا</p><p>ثبت بقایا و نمونه‌برداری برای شناسایی</p><p>شناسایی قطعی: در انتظار گزارش بعدی</p><span class="r6-stamp">گروه بررسی</span>');break;
 case 'E13':v=photo('closeups',4,'بلندگو و سیم‌کشی برنامه پخش لیلا');break;
 case 'E14':v='<div class="r6-cctv">'+photo('rooms',5,'نمای ایوان در ثبت پیوسته دوربین')+'<span>ثبت دوربین · ساعت تنظیم‌نشده</span></div>'+sheet('برچسب زمان فیلم','<p dir="ltr">۲۳:۴۷ · اعلان تماس سامان</p><p dir="ltr">۲۳:۵۰ · ورود به مطالعه</p><p dir="ltr">۲۳:۵۳ · خروج از مطالعه</p><p>چهره ورود اول قابل تشخیص نیست.</p>');break;
 case 'E15':v='<div class="r6-phone-table"><div class="r6-phone"><p>تماس تصویری سامان</p>'+photo('portraits',4,'سامان با عینک، پیوسته در قاب تماس تصویری')+'<div class="r6-call-status">شروع ۲۳:۴۵ · ورود مینا ۲۳:۵۲</div><span class="r6-call-end" aria-hidden="true">☎</span></div></div>';break;
 case 'E16':v='<div class="r6-phone-table"><div class="r6-phone r6-call-log"><p>تلفن بهزاد · سابقه تماس</p><h3>نیما</h3><p dir="ltr">۲۳:۴۷</p><p>تماس پاسخ‌داده‌شده</p><blockquote>پاسخ زنده نیما در صدای فیلم هم شنیده می‌شود.</blockquote></div></div>';break;
 case 'E17':v='<div class="r6-chat"><p>رونوشت تلفن مینا · ۲۳:۴۲</p><blockquote>نیما: برگه‌ات پیش من است. اتاق مطالعه، تنها بیا.</blockquote><blockquote>مینا: برای پس گرفتن برگه می‌آیم.</blockquote></div>';break;
 case 'E18':case 'E19':v=fragments(e.id,false);break;
 case 'E20':v=sheet('ثبت صحنه کتابخانه','<p>تنها مسیر رفت‌وآمد: در راهرو</p><p>شیشه قدی: ثابت و سالم</p><p>جای اختفای فرد دیگر: ثبت نشده</p><p>انتقال، بیماری یا اثر تأخیری ماده‌ای که قبلاً مصرف شده: با بررسی تخصصی کنار گذاشته شده</p><small>گزارش، دقیقه مرگ را تعیین نمی‌کند.</small>');break;
 case 'E21':v=sheet('دفتر اظهارات اولیه','<p>بهزاد: پشت اتاق کار فضایی نیست.</p><p>مینا: تمام مدت کنار سامان بودم.</p><p>لیلا: صدا از خانه بود.</p><p>سامان: خودرو را دیدم؛ سرنشین را نه.</p>');break;
 case 'E22':v=sheet('ثبت بازدید ورودی بایگانی','<p>محل بازدید: پوشش کمد اتاق کار و ضلع شرقی بنا</p><p>پوشش کمد و در خدماتی شرقی به همان فضای باریک می‌رسند.</p><p>فضای مفید: حدود ۱٫۶۵ × ۴ متر</p><p>در خدماتی به کتابخانه وصل نیست.</p>');break;
 default:throw Error('نمای مدرک تعریف نشده: '+e.id);
 }
 return document(e,v);
}
global.RoomSixVisuals={plan,evidence,fragments,photo};
})(typeof globalThis!=='undefined'?globalThis:this);
