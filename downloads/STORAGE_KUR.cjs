"use strict";
// Uses the existing Firebase CLI sign-in. No token is printed, exported or saved.
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const { createHash } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const PROJECT = "birarada-5650c";
const BUCKET = "birarada-5650c.firebasestorage.app";
const LOCATION = "europe-west1";
const ACCOUNT = "ahmedberatazboy0@gmail.com";
const RULES_HASH = "ccf66743debc31214b5943edc855c2252b547ddfff6308cf050a2b604e12e492";
class SetupError extends Error {}
function bucketName(value) { return value?.bucket?.name?.split("/").pop() || null; }
async function setupStorage(io) {
  if (!await io.billingEnabled()) throw new SetupError("BLAZE_KAPALI: Projeye etkin bir faturalandirma hesabi bagli degil. Storage ve Functions icin Blaze gerekiyor. Bu arac ucretli plani acmaz; Google faturalandirma adimini tamamlamalisin.");
  let existing = await io.getDefault();
  if (existing && bucketName(existing) !== BUCKET) throw new SetupError("Baska bir varsayilan bucket bulundu. Mevcut bucket korunarak duruldu; adi veya bolgesi degistirilmedi.");
  if (!existing) {
    io.log(`Storage olusturuluyor: ${BUCKET} / ${LOCATION} / STANDARD. Mevcut Blaze planinda kullanim ucret dogurabilir.`);
    try { await io.create({ location: LOCATION, storageClass: "STANDARD" }); }
    catch (error) { if (error.status !== 409) throw error; }
    for (let i=0;i<20;i++) {
      existing = await io.getDefault();
      if (existing) break;
      await io.wait(2000);
    }
    if (!existing) throw new SetupError("Storage olusturma istegi gonderildi fakat henuz hazir degil. Biraz sonra ayni komutu tekrar calistir; yeni bucket adi kullanma.");
    if (bucketName(existing) !== BUCKET) throw new SetupError("Olusan bucket beklenen adla eslesmiyor. Otomatik silme veya yeniden adlandirma yapilmadi.");
  } else io.log("Beklenen Storage zaten var; bolgesi ve ayarlari korunuyor.");
  await io.deployRules();
  io.log("STORAGE_HAZIR: Varsayilan bucket dogrulandi ve istemci erisimini kapatan Storage kurallari dagitildi. Functions/Firestore dagitimi sonraki adimdir.");
}
async function main() {
  const root=__dirname;
  const app=JSON.parse(fs.readFileSync(path.join(root,"app.json"),"utf8"));
  if(app.expo?.android?.package!=="com.birarada.app")throw new SetupError("Dosyayi indirdigin Birarada klasorune koy: app.json ve package.json ile ayni klasor.");
  const rules=fs.readFileSync(path.join(root,"storage.rules"),"utf8").replace(/\r\n/g,"\n");
  if(createHash("sha256").update(rules).digest("hex")!==RULES_HASH)throw new SetupError("Storage kural dosyasi bu dagitimla eslesmiyor. Mevcut kurallarin degistirilmeden duruldu.");
  const localRequire=createRequire(path.join(root,"package.json"));
  const cliRoot=path.dirname(localRequire.resolve("firebase-tools/package.json"));
  const auth=require(path.join(cliRoot,"lib/auth.js"));
  const {requireAuth}=require(path.join(cliRoot,"lib/requireAuth.js"));
  const {Client}=require(path.join(cliRoot,"lib/apiv2.js"));
  const {checkBillingEnabled}=require(path.join(cliRoot,"lib/gcp/cloudbilling.js"));
  const account=auth.getAllAccounts().find(a=>a.user?.email?.toLowerCase()===ACCOUNT);
  if(!account)throw new SetupError("Beklenen Google oturumu bulunamadi. Once npx --no-install firebase login --no-localhost ile proje sahibi hesabina gir.");
  await requireAuth({project:PROJECT,projectId:PROJECT,nonInteractive:true,user:account.user,tokens:account.tokens});
  const client=new Client({urlPrefix:"https://firebasestorage.googleapis.com",apiVersion:"v1beta"});
  await setupStorage({
    billingEnabled:()=>checkBillingEnabled(PROJECT),
    getDefault:async()=>{try{return (await client.get(`/projects/${PROJECT}/defaultBucket`)).body;}catch(error){if(error.status===404)return null;throw error;}},
    create:body=>client.post(`/projects/${PROJECT}/defaultBucket`,body),
    wait:ms=>new Promise(resolve=>setTimeout(resolve,ms)),
    log:console.log,
    deployRules:async()=>{
      const r=spawnSync(process.execPath,[path.join(cliRoot,"lib/bin/firebase.js"),"deploy","--project",PROJECT,"--only","storage","--account",ACCOUNT],{cwd:root,env:process.env,stdio:"inherit"});
      if(r.error||r.status!==0)throw new SetupError("Bucket mevcut olabilir fakat Storage kurallari dagitilamadi. Yukaridaki hatayi duzeltmeden medya kurulumunu tamamlandi sayma.");
    }
  });
}
module.exports={setupStorage,bucketName};
if(require.main===module)main().catch(error=>{
 if(error instanceof SetupError)console.error(error.message);
 else {
  const status=Number(error.status||error.original?.status)||"bilinmiyor";
  console.error(`Storage kurulumu tamamlanamadi (HTTP ${status}). 403: hesap/izin veya API/faturalandirma kontrolu; 400: proje/faturalandirma veya bolge onkosulu. Parola/token gonderme.`);
 }
 process.exitCode=1;
});
