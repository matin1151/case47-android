from pathlib import Path
import json,re,base64,hashlib
R=Path(__file__).resolve().parents[1];W=R/'web';D=R/'dist';D.mkdir(exist_ok=True)
catalog=json.loads((W/'cases/catalog.json').read_text());cases=[]
for item in catalog['cases']:
 case=json.loads((W/'cases'/item['file']).read_text());cases.append(case)
(W/'cases.bundle.js').write_text('window.CASE_CATALOG = '+json.dumps({'schemaVersion':1,'investigator':json.loads((W/'investigator.json').read_text()),'cases':cases},ensure_ascii=False)+';\n')
html=(W/'index.html').read_text();css=(W/'style.css').read_text()
for name in ['vazirmatn-regular.ttf','vazirmatn-bold.ttf','office.png','security.png','archive.png','suspects.png','evidence.png','clock.png','investigator.png']:
 mime='image/png' if name.endswith('png') else 'font/ttf'
 css=css.replace('assets/'+name,'data:'+mime+';base64,'+base64.b64encode((W/'assets'/name).read_bytes()).decode())
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
hashes=[]
def inline(m):
 code=(W/m.group(1)).read_text();hashes.append("'sha256-"+base64.b64encode(hashlib.sha256(code.encode()).digest()).decode()+"'")
 return '<script>'+code+'</script>'
html=re.sub(r'<script src="([^"]+)"></script>',inline,html)
html=html.replace("script-src 'self'","script-src "+' '.join(hashes))
(D/'case47-standalone.html').write_text(html)
print('Data bundle and standalone HTML built:',len(html.encode()),'bytes')
