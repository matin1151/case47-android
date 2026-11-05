from pathlib import Path
import json,re,base64,hashlib
R=Path(__file__).resolve().parents[1];W=R/'web';D=R/'dist';D.mkdir(exist_ok=True)
catalog=json.loads((W/'cases/catalog.json').read_text());cases=[]
for item in catalog['cases']:
 case=json.loads((W/'cases'/item['file']).read_text());cases.append(case)
(W/'cases.bundle.js').write_text('window.CASE_CATALOG = '+json.dumps({'schemaVersion':1,'buildVersion':json.loads((R/'package.json').read_text())['version'],'investigator':json.loads((W/'investigator.json').read_text()),'cases':cases},ensure_ascii=False)+';\n')
html=(W/'index.html').read_text();css=(W/'style.css').read_text()
def asset(m):
 name=m.group(0)
 mime='image/png' if name.endswith('.png') else 'image/jpeg' if name.endswith('.jpg') else 'font/ttf'
 return 'data:'+mime+';base64,'+base64.b64encode((W/name).read_bytes()).decode()
css=re.sub(r'assets/[A-Za-z0-9_/-]+\.(?:png|jpg|ttf)',asset,css)
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
hashes=[]
def inline(m):
 code=(W/m.group(1)).read_text();hashes.append("'sha256-"+base64.b64encode(hashlib.sha256(code.encode()).digest()).decode()+"'")
 return '<script>'+code+'</script>'
html=re.sub(r'<script src="([^"]+)"></script>',inline,html)
html=html.replace("script-src 'self'","script-src "+' '.join(hashes))
(D/'case47-standalone.html').write_text(html)
(D/'kavian-room-six-dev.html').write_text(html)
print('Data bundle and standalone HTML built:',len(html.encode()),'bytes')

(D/('Kavian-Room-Six-'+json.loads((R/'package.json').read_text())['version']+'.html')).write_text(html)
