#!/usr/bin/env python3
"""Download public official build dependencies; no account or SDK login needed."""
from pathlib import Path
import os,urllib.request,zipfile,hashlib,concurrent.futures
T=Path(os.environ.get('CASE47_ANDROID_TOOLS','/tmp/case47-tools'));T.mkdir(parents=True,exist_ok=True)
items=[('platform.zip','https://dl.google.com/android/repository/platform-35_r02.zip','platform'),('build-tools.zip','https://dl.google.com/android/repository/build-tools_r35_linux.zip','build-tools'),('ecj.jar','https://repo.maven.apache.org/maven2/org/eclipse/jdt/ecj/3.38.0/ecj-3.38.0.jar',None)]
def fetch(item):
 name,url,folder=item;p=T/name
 if not p.exists():urllib.request.urlretrieve(url,p)
 print(name,hashlib.sha256(p.read_bytes()).hexdigest(),flush=True)
 if folder and not (T/folder).exists():
  with zipfile.ZipFile(p) as z:z.extractall(T/folder)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:list(ex.map(fetch,items))
print('SDK platform / build tools 35 and ECJ compiler ready.')
