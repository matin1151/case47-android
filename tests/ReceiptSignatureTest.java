import com.bidrano.kavian.ReceiptSignature;
import java.security.*;
import java.util.Base64;
public class ReceiptSignatureTest {
 public static void main(String[] args)throws Exception{
  KeyPairGenerator g=KeyPairGenerator.getInstance("RSA");g.initialize(2048);KeyPair pair=g.generateKeyPair();
  String key=Base64.getEncoder().encodeToString(pair.getPublic().getEncoded()),raw="{\"productId\":\"kavian_case2_room_six\",\"purchaseState\":0}";
  Signature signer=Signature.getInstance("SHA1withRSA");signer.initSign(pair.getPrivate());signer.update(raw.getBytes("UTF-8"));String signed=Base64.getEncoder().encodeToString(signer.sign());
  check(ReceiptSignature.verify(key,raw,signed));check(!ReceiptSignature.verify(key,raw+" ",signed));
  check(!ReceiptSignature.verify(key,raw.replace(":0",":1"),signed));check(!ReceiptSignature.verify(key,raw,""));
  check(!ReceiptSignature.verify(key,raw,"not-a-receipt"));check(!ReceiptSignature.verify("",raw,signed));
  check(!ReceiptSignature.verify(Base64.getEncoder().encodeToString(g.generateKeyPair().getPublic().getEncoded()),raw,signed));
  System.out.println("7 signed receipt acceptance/tampering checks passed");
 }
 static void check(boolean ok){if(!ok)throw new AssertionError("receipt validation failed");}
}
