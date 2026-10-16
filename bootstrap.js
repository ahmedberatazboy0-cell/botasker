'use strict';
const fs=require('fs');
const path=require('path');
const zlib=require('zlib');

const parts=[1,2,3,4].map(i=>fs.readFileSync(path.join(__dirname,`.birarada_bundle_${i}`),'utf8').trim()).join('');
const files=JSON.parse(zlib.gunzipSync(Buffer.from(parts,'base64')).toString('utf8'));
for(const [rel,content] of Object.entries(files)){
  const target=path.join(__dirname,rel);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,content,'utf8');
}
console.log(`Birarada v9 bundle extracted: ${Object.keys(files).length} files`);
