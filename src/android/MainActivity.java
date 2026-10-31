package com.bidrano.kavian;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.net.Uri;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebResourceError;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebSettings;
import android.webkit.ValueCallback;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;
import java.io.InputStream;
import java.io.ByteArrayInputStream;
import java.util.HashMap;

/** Offline-only, isolated WebView shell. No network or storage permissions. */
public final class MainActivity extends Activity {
 private static final String HOST="appassets.androidplatform.net";
 private static final String HOME="https://"+HOST+"/assets/index.html";
 private FrameLayout root;
 private WebView web;
 private LinearLayout status;
 private boolean failed;
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  getWindow().setStatusBarColor(Color.rgb(13,20,21));
  getWindow().setNavigationBarColor(Color.rgb(16,25,25));
  root=new FrameLayout(this);root.setBackgroundColor(Color.rgb(13,20,21));
  root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener(){
   @Override public WindowInsets onApplyWindowInsets(View view,WindowInsets insets){
    view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
    return insets.consumeSystemWindowInsets();
   }
  });
  setContentView(root);createWeb();
 }
 private void createWeb(){
  failed=false;web=new WebView(this);web.setBackgroundColor(Color.rgb(13,20,21));
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);
  s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  s.setMediaPlaybackRequiresUserGesture(true);s.setSupportZoom(false);s.setBuiltInZoomControls(false);
  s.setDefaultTextEncodingName("UTF-8");s.setCacheMode(WebSettings.LOAD_DEFAULT);
  web.setWebChromeClient(new WebChromeClient());
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){return resource(request.getUrl());}
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return !isLocal(request.getUrl());}
   @Override public void onPageFinished(WebView view,String url){
    if(failed)return;
    view.evaluateJavascript("Boolean(window.CASE47_READY)",new ValueCallback<String>() { public void onReceiveValue(String value) {
     if("true".equals(value)){if(status!=null){root.removeView(status);status=null;}}
     else showStatus("بارگذاری بازی کامل نشد. برای تلاش دوباره لمس کن؛ ذخیرهٔ قبلی حفظ می‌شود.",true);
    }});
   }
   @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame()){failed=true;showStatus("بازی بارگذاری نشد. دوباره تلاش کن.",true);}}
   @Override public boolean onRenderProcessGone(WebView view,RenderProcessGoneDetail detail){root.removeView(view);view.destroy();web=null;showStatus("نمایش بازی متوقف شد. پیشرفت ثبت‌شده حفظ شده است.",true);return true;}
  });
  root.addView(web,new FrameLayout.LayoutParams(-1,-1));
  showStatus("در حال باز کردن پرونده ۴۷…",false);web.loadUrl(HOME);
 }
 private boolean isLocal(Uri uri){return "https".equals(uri.getScheme())&&HOST.equals(uri.getHost())&&uri.getPath()!=null&&uri.getPath().startsWith("/assets/");}
 private WebResourceResponse resource(Uri uri){
  if(!isLocal(uri))return missing();
  String path=uri.getPath().substring("/assets/".length());
  if(path.contains("..")||path.contains("\\")||path.startsWith("/"))return missing();
  try{
   InputStream in=getAssets().open("www/"+path);
   String mime=path.endsWith(".html")?"text/html":path.endsWith(".js")?"text/javascript":path.endsWith(".css")?"text/css":path.endsWith(".json")?"application/json":path.endsWith(".png")?"image/png":path.endsWith(".ttf")?"font/ttf":"application/octet-stream";
   WebResourceResponse r=new WebResourceResponse(mime,"UTF-8",in);HashMap<String,String> headers=new HashMap<>();headers.put("Cache-Control","no-cache");headers.put("X-Content-Type-Options","nosniff");r.setResponseHeaders(headers);return r;
  }catch(Exception e){return missing();}
 }
 private WebResourceResponse missing(){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",new HashMap<String,String>(),new ByteArrayInputStream(new byte[0]));}
 private void showStatus(String message,boolean retry){
  if(status!=null)root.removeView(status);status=new LinearLayout(this);status.setOrientation(LinearLayout.VERTICAL);status.setGravity(17);status.setPadding(35,35,35,35);status.setBackgroundColor(Color.rgb(13,20,21));
  TextView text=new TextView(this);text.setText(message);text.setTextColor(Color.rgb(238,233,219));text.setTextSize(18);text.setGravity(17);status.addView(text);
  if(retry){Button button=new Button(this);button.setText("تلاش دوباره");button.setOnClickListener(new View.OnClickListener(){public void onClick(View v){if(web!=null){root.removeView(web);web.destroy();web=null;}createWeb();}});status.addView(button);}
  root.addView(status,new FrameLayout.LayoutParams(-1,-1));
 }
 @Override public void onBackPressed(){if(web==null){super.onBackPressed();return;}web.evaluateJavascript("typeof window.case47Back==='function' && window.case47Back()",new ValueCallback<String>(){public void onReceiveValue(String value){if(!"true".equals(value))MainActivity.this.finish();}});}
 @Override protected void onPause(){if(web!=null){web.evaluateJavascript("document.dispatchEvent(new Event('case47pause'))",null);web.onPause();}super.onPause();}
 @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
 @Override protected void onDestroy(){if(web!=null){web.destroy();web=null;}super.onDestroy();}
}
