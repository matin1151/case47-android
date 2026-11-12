package com.bidrano.kavian;
import java.security.*;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
/** Bazaar v3 signs the exact UTF-8 purchase JSON; never reserialize before verification. */
public final class ReceiptSignature {
 public static boolean verify(String publicKey,String data,String signed){
  if(publicKey==null||data==null||signed==null||signed.isEmpty())return false;
  try{
   Signature verifier=Signature.getInstance("SHA1withRSA");
   verifier.initVerify(KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(Base64.getDecoder().decode(publicKey.replaceAll("\\s", "")))));
   verifier.update(data.getBytes("UTF-8"));return verifier.verify(Base64.getDecoder().decode(signed));
  }catch(Exception e){return false;}
 }
}
