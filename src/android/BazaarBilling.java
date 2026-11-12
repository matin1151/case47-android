package com.bidrano.kavian;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.*;
import android.os.*;
import android.webkit.JavascriptInterface;
import android.util.Base64;
import org.json.*;
import java.security.*;
import java.security.spec.X509EncodedKeySpec;
import java.util.*;
import java.util.concurrent.*;
import com.android.vending.billing.IInAppBillingService;

/** Permanent (never consumed) Bazaar purchase, with signed offline receipts. */
public final class BazaarBilling {
 static final int REQUEST=4702;
 static final String PRODUCT="kavian_case2_room_six";
 private final MainActivity activity;
 private final SharedPreferences cache;
 private final ExecutorService worker=Executors.newSingleThreadExecutor();
 private IInAppBillingService service;
 private boolean bound,closed,busy;
 private String pendingId,payload;
 private String publicKey="";
 BazaarBilling(MainActivity activity){
  this.activity=activity;cache=activity.getSharedPreferences("bazaar-receipts-v1",Context.MODE_PRIVATE);
  try{publicKey=activity.getString(com.bidrano.kavian.R.string.bazaar_public_key).trim();}catch(Exception ignored){}
 }
 private boolean configured(){return publicKey.length()>100&&!BuildConfig.REVIEW;}
 private JSONObject verified(String raw,String signature) throws Exception {
  if(!configured())throw new SecurityException();
  if(!ReceiptSignature.verify(publicKey,raw,signature))throw new SecurityException();
  JSONObject p=new JSONObject(raw);
  if(!activity.getPackageName().equals(p.getString("packageName"))||!PRODUCT.equals(p.getString("productId"))||p.getInt("purchaseState")!=0||p.optString("purchaseToken",p.optString("token")).isEmpty())throw new SecurityException();
  return p;
 }
 @JavascriptInterface public boolean hasOwnership(String id){
  if(!"room-six".equals(id))return false;
  if(BuildConfig.REVIEW)return true;
  try{verified(cache.getString("data",""),cache.getString("signature",""));return true;}catch(Exception e){return false;}
 }
 @JavascriptInterface public void request(final String requestId,final String action,final String product){
  if(requestId==null||!requestId.matches("[a-zA-Z0-9-]{1,60}"))return;
  activity.runOnUiThread(()->{
   if(!configured()){reply(requestId,false,"پرداخت این نسخه هنوز تنظیم نشده است؛ پس از تنظیم پنل بازار فعال می‌شود.");return;}
   if(busy){reply(requestId,false,"یک درخواست پرداخت در حال انجام است.");return;}
   if(!"restore".equals(action)&&!("purchase".equals(action)&&PRODUCT.equals(product))){reply(requestId,false,"درخواست خرید معتبر نیست.");return;}
   busy=true;pendingId=requestId;
   if(service!=null){perform(action);return;}
   Intent intent=new Intent("ir.cafebazaar.pardakht.InAppBillingService.BIND");intent.setPackage("com.farsitel.bazaar");
   try{bound=activity.bindService(intent,newConnection(action),Context.BIND_AUTO_CREATE);if(!bound)finish(false,"برای خرید، بازار را نصب یا به‌روز کن و وارد حسابت شو.");}
   catch(Exception e){finish(false,"اتصال به بازار برقرار نشد.");}
  });
 }
 private ServiceConnection connection;
 private ServiceConnection newConnection(final String action){connection=new ServiceConnection(){
  public void onServiceConnected(ComponentName name,IBinder binder){service=IInAppBillingService.Stub.asInterface(binder);perform(action);}
  public void onServiceDisconnected(ComponentName name){service=null;if(busy)finish(false,"ارتباط با بازار قطع شد؛ بازیابی خرید را بزن.");}
 };return connection;}
 private int code(Bundle b){Object value=b.get("RESPONSE_CODE");return value==null?0:((Number)value).intValue();}
 private void perform(final String action){worker.execute(()->{
  try{
   if(service.isBillingSupported(3,activity.getPackageName(),"inapp")!=0)throw new Exception();
   if("restore".equals(action)){restore();return;}
   payload=UUID.randomUUID().toString();
   Bundle response=service.getBuyIntent(3,activity.getPackageName(),PRODUCT,"inapp",payload);
   if(code(response)==7){restore();return;}
   if(code(response)!=0)throw new Exception();
   PendingIntent intent=response.getParcelable("BUY_INTENT");if(intent==null)throw new Exception();
   activity.runOnUiThread(()->{try{activity.startIntentSenderForResult(intent.getIntentSender(),REQUEST,new Intent(),0,0,0);}catch(Exception e){finish(false,"صفحه پرداخت باز نشد.");}});
  }catch(Exception e){finish(false,"بازار پاسخ معتبر نداد. اینترنت و حساب بازار را بررسی و دوباره تلاش کن.");}
 });}
 private void restore() throws Exception {
  String next=null,rawFound=null,sigFound=null;Set<String> seen=new HashSet<>();
  do{
   Bundle response=service.getPurchases(3,activity.getPackageName(),"inapp",next);if(code(response)!=0)throw new Exception();
   ArrayList<String> raws=response.getStringArrayList("INAPP_PURCHASE_DATA_LIST"),sigs=response.getStringArrayList("INAPP_DATA_SIGNATURE_LIST");
   if(raws==null||sigs==null||raws.size()!=sigs.size())throw new Exception();
   for(int i=0;i<raws.size();i++){
    JSONObject item=new JSONObject(raws.get(i));if(!PRODUCT.equals(item.optString("productId")))continue;
    verified(raws.get(i),sigs.get(i));rawFound=raws.get(i);sigFound=sigs.get(i);
   }
   next=response.getString("INAPP_CONTINUATION_TOKEN");if(next!=null&&!next.isEmpty()&&!seen.add(next))throw new Exception();
  }while(next!=null&&!next.isEmpty());
  SharedPreferences.Editor edit=cache.edit().clear();if(rawFound!=null)edit.putString("data",rawFound).putString("signature",sigFound);if(!edit.commit())throw new Exception();
  finish(true,rawFound==null?"خریدی برای این حساب پیدا نشد.":"خرید قبلی تأیید و پرونده باز شد.");
 }
 boolean onResult(int requestCode,int resultCode,Intent data){
  if(requestCode!=REQUEST)return false;
  if(!busy||payload==null)return true;
  if(resultCode==Activity.RESULT_CANCELED){finish(false,"خرید لغو شد؛ پرونده تغییری نکرد.");return true;}
  worker.execute(()->{try{
   if(resultCode!=Activity.RESULT_OK||data==null)throw new Exception();
   Object result=data.getExtras()==null?null:data.getExtras().get("RESPONSE_CODE");if(result!=null&&((Number)result).intValue()!=0)throw new Exception();
   String raw=data.getStringExtra("INAPP_PURCHASE_DATA"),sig=data.getStringExtra("INAPP_DATA_SIGNATURE");
   JSONObject p=verified(raw,sig);if(!payload.equals(p.optString("developerPayload")))throw new SecurityException();
   if(!cache.edit().putString("data",raw).putString("signature",sig).commit())throw new Exception();
   finish(true,"خرید تأیید شد؛ اتاق ششم برای همیشه باز است.");
  }catch(Exception e){finish(false,"خرید تأیید نشد. اگر مبلغ کسر شده، بازیابی خرید را بزن.");}});return true;
 }
 private void finish(boolean ok,String message){activity.runOnUiThread(()->{String id=pendingId;pendingId=null;payload=null;busy=false;if(id!=null)reply(id,ok,message);});}
 private void reply(String id,boolean ok,String message){if(closed)return;try{JSONObject result=new JSONObject();result.put("id",id);result.put("ok",ok);result.put("owned",hasOwnership("room-six"));result.put("message",message);activity.billingReply(result.toString());}catch(Exception ignored){}}
 void close(){closed=true;worker.shutdownNow();if(bound&&connection!=null){try{activity.unbindService(connection);}catch(Exception ignored){}}service=null;}
}
