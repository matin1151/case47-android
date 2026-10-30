#!/usr/bin/env python3
"""Build the offline Android shell with official SDK tools (no Gradle required)."""
import os,subprocess,zipfile,shutil,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[1]
T=Path(os.environ.get('CASE47_ANDROID_TOOLS','/tmp/case47-tools'))
SDK=T/'build-tools/android-15';PLATFORM=T/'platform/android-35/android.jar';ECJ=T/'ecj.jar'
B=R/'.local/android-build';D=R/'dist';KEY=R/'.local/test-signing.jks'
def run(*args):subprocess.run([str(a) for a in args],check=True,cwd=R)
for p in [SDK/'aapt2',SDK/'zipalign',PLATFORM,ECJ]:
 if not p.exists():raise SystemExit('Missing build prerequisite: '+str(p)+'; see docs/ANDROID.md')
for p in [SDK/'aapt2',SDK/'zipalign']:p.chmod(0o755)
if B.exists():shutil.rmtree(B)
(B/'classes').mkdir(parents=True);(B/'dex').mkdir();(B/'assets/www').mkdir(parents=True)
run('python',R/'tools/build_web.py')
shutil.copytree(R/'web',B/'assets/www',dirs_exist_ok=True)
run(SDK/'aapt2','compile','--dir',R/'src/android/res','-o',B/'resources.zip')
run(SDK/'aapt2','link','-o',B/'unsigned.apk','-I',PLATFORM,'--manifest',R/'src/android/AndroidManifest.xml','-A',B/'assets',B/'resources.zip','--min-sdk-version','26','--target-sdk-version','35')
run('java','-jar',ECJ,'-1.8','-proc:none','-nowarn','-bootclasspath',PLATFORM,'-d',B/'classes',R/'src/android/MainActivity.java')
with zipfile.ZipFile(B/'classes.jar','w',zipfile.ZIP_DEFLATED) as z:
 for p in (B/'classes').rglob('*.class'):z.write(p,p.relative_to(B/'classes'))
run('java','-cp',SDK/'lib/d8.jar','com.android.tools.r8.D8','--lib',PLATFORM,'--min-api','26','--output',B/'dex',B/'classes.jar')
with zipfile.ZipFile(B/'unsigned.apk','a',zipfile.ZIP_DEFLATED) as z:
 for p in (B/'dex').glob('*.dex'):z.write(p,p.name)
run(SDK/'zipalign','-f','-p','4',B/'unsigned.apk',B/'aligned.apk')
if not KEY.exists():
 run('keytool','-genkeypair','-keystore',KEY,'-storepass','android','-keypass','android','-alias','case47-test','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=Case 47 Test Build,O=Development,C=IR')
OUT=D/'Case47-0.5.1-test.apk'
run('java','-jar',SDK/'lib/apksigner.jar','sign','--ks',KEY,'--ks-key-alias','case47-test','--ks-pass','pass:android','--key-pass','pass:android','--out',OUT,B/'aligned.apk')
run('java','-jar',SDK/'lib/apksigner.jar','verify','--verbose',OUT)
run(SDK/'zipalign','-c','4',OUT)
(D/'APK-SHA256.txt').write_text(hashlib.sha256(OUT.read_bytes()).hexdigest()+'  '+OUT.name+'\n')
print('Built',OUT,'bytes',OUT.stat().st_size)
