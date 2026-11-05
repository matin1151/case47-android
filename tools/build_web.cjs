'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),web=path.join(root,'web'),dist=path.join(root,'dist');
const catalog=JSON.parse(fs.readFileSync(path.join(web,'cases/catalog.json'),'utf8'));
const cases=catalog.cases.map(c=>JSON.parse(fs.readFileSync(path.join(web,'cases',c.file),'utf8')));
const bundle='window.CASE_CATALOG = '+JSON.stringify({schemaVersion:1,buildVersion:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,investigator:JSON.parse(fs.readFileSync(path.join(web,'investigator.json'),'utf8')),cases})+';\n';
fs.writeFileSync(path.join(web,'cases.bundle.js'),bundle);
let html=fs.readFileSync(path.join(web,'index.html'),'utf8'),css=fs.readFileSync(path.join(web,'style.css'),'utf8');
css=css.replace(/assets\/[A-Za-z0-9_/-]+\.(png|jpg|ttf)/g,name=>'data:'+(name.endsWith('.png')?'image/png':name.endsWith('.jpg')?'image/jpeg':'font/ttf')+';base64,'+fs.readFileSync(path.join(web,name)).toString('base64'));
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>');
const hashes=[];
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,file)=>{const code=fs.readFileSync(path.join(web,file),'utf8');hashes.push("'sha256-"+crypto.createHash('sha256').update(code).digest('base64')+"'");return '<script>'+code+'</script>';});
html=html.replace("script-src 'self'",'script-src '+hashes.join(' '));fs.mkdirSync(dist,{recursive:true});
fs.writeFileSync(path.join(dist,'kavian-room-six-dev.html'),html);console.log('Offline developer build:',Buffer.byteLength(html),'bytes');

fs.writeFileSync(path.join(dist,'Kavian-Room-Six-'+JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version+'.html'),html);
