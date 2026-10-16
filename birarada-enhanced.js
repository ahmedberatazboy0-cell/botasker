(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const initial=s=>(String(s||'B').trim()[0]||'B').toUpperCase();
const toast2=t=>{ if(window.toast)return window.toast(t); console.log(t) };

const css=`
:root{--amber:#ff7a1a;--amber2:#ffb066;--surface:#111318;--surface2:#17191f;--edge:#292c34}
body{background:radial-gradient(circle at 65% -10%,#431b0d33,transparent 28%),#090a0d}
.auth{background:radial-gradient(circle at 18% 20%,#63270f55,transparent 30%),linear-gradient(145deg,#08090b,#0d0e12)!important}
.hero{padding:38px 44px!important;background:transparent!important}
.hero h1{font-size:clamp(58px,6.8vw,105px)!important;letter-spacing:-.075em!important}
.hero h1 span{background:linear-gradient(90deg,#ffb066,#ff6f16);-webkit-background-clip:text;color:transparent!important}
.city{border-radius:28px!important;box-shadow:0 30px 90px #0008,inset 0 1px #ffffff0c}
.authpanel{background:#0b0c0fe8;backdrop-filter:blur(20px)}
.authpanel .card{padding:25px;border:1px solid #ffffff12;background:#111318cc;border-radius:24px;box-shadow:0 25px 80px #0009}
.shell{grid-template-columns:220px minmax(0,1fr) 300px!important}
.side{background:#0b0c10!important;border-color:#22252c!important}
.nav button{height:44px;display:flex;align-items:center;gap:10px;font-weight:720!important}
.nav button.active{background:linear-gradient(90deg,#29190f,#17181d)!important;box-shadow:inset 3px 0 var(--amber)}
.page{width:min(760px,100%)!important}
.panel,.card2{background:linear-gradient(180deg,#121419,#0f1115)!important;border:1px solid #272a31!important;border-radius:20px!important}
.plus-right{height:100vh;position:sticky;top:0;border-left:1px solid #24262d;background:#0b0c0f;padding:18px 16px;overflow:auto}
.plus-right h3{font-size:15px;margin:4px 0 12px}
.plus-card{background:linear-gradient(180deg,#121419,#101116);border:1px solid #252830;border-radius:18px;padding:14px;margin-bottom:12px}
.plus-card p{font-size:11px;line-height:1.6;color:#999fa8;margin:7px 0}
.safety-card{background:linear-gradient(180deg,#102019,#0d1713);border-color:#244535}
.plus-trend{display:flex;justify-content:space-between;padding:9px 0;border-top:1px solid #24272e;font-size:11px}.plus-trend:first-of-type{border-top:0}
.plus-top{height:64px;position:sticky;top:0;z-index:25;background:#0a0b0edd;backdrop-filter:blur(18px);border-bottom:1px solid #252830;display:flex;align-items:center;justify-content:space-between;padding:0 20px}
.plus-top h2{font-size:18px;margin:0}.plus-actions{display:flex;gap:7px}.round2{width:38px;height:38px;border:1px solid #2b2e36;background:#14161b;color:#e6e8ec;border-radius:12px}
.moments2{display:flex;gap:12px;overflow:auto;padding:2px 1px 15px;scrollbar-width:none}.moment2{width:70px;flex:0 0 70px;text-align:center}.ring2{width:60px;height:60px;border-radius:50%;padding:2px;background:linear-gradient(145deg,#ffc27f,#ff6f17 60%,#4e1f10);margin:auto}.ring2>div{height:100%;border-radius:50%;background:#20232a;border:3px solid #0b0c0f;display:grid;place-items:center;font-weight:900}.moment2 small{display:block;font-size:10px;color:#9ca2ac;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:6px}
.ext-page{display:none;width:min(760px,100%);margin:auto;padding:22px 20px 90px}.ext-page.active{display:block}
.ext-head{display:flex;align-items:end;justify-content:space-between;margin-bottom:14px}.ext-head h3{margin:0}.ext-head span{font-size:11px;color:#9096a0}
.ext-list{overflow:hidden}.ext-row{display:flex;gap:11px;align-items:center;padding:13px 14px;border-bottom:1px solid #252830}.ext-row:last-child{border-bottom:0}.ext-grow{flex:1;min-width:0}.ext-grow b,.ext-grow span{display:block}.ext-grow span{font-size:10px;color:#9096a0;margin-top:2px}
.pill2{height:36px;border:1px solid #2d3038;background:#181a20;color:#e4e6ea;border-radius:10px;padding:0 12px;font-size:11px;font-weight:780}.pill2.orange{background:linear-gradient(135deg,#ffac62,#ff7417);color:#1b110a;border:0}
.badge2{font-size:9px;padding:3px 6px;border-radius:999px;background:#ff7a1a;color:#1b110a;font-weight:900;margin-left:auto}
.dot2{width:8px;height:8px;border-radius:50%;background:#ff7a1a;flex:0 0 8px}
.draftbar{display:flex;justify-content:space-between;gap:10px;font-size:10px;color:#898f99;padding:4px 1px 9px}
.compact2 .posthead{padding:10px!important}.compact2 .postbody{padding:0 12px 10px!important}
.reduce-motion2 *{transition:none!important;animation:none!important;scroll-behavior:auto!important}
.modal2{position:fixed;inset:0;background:#000c;z-index:1000;display:none;place-items:center;padding:18px}.modal2.show{display:grid}.modalbox2{width:min(560px,100%);max-height:82vh;overflow:auto;background:#111318;border:1px solid #30333c;border-radius:22px;padding:20px;box-shadow:0 30px 100px #000c}.modalbox2 h3{margin:0 0 13px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.post-tools2{display:flex;gap:5px;align-items:center;padding:9px 12px;border-top:1px solid #24272d}.post-tools2 button{border:0;background:transparent;color:#cfd2d8;border-radius:9px;padding:7px 8px;font-size:11px}.post-tools2 button:hover{background:#1b1d23}.post-tools2 .push{margin-left:auto}.saved2{color:#ff8b41!important}
.ext-setting{padding:15px}.ext-setting h4{margin:0 0 6px}.ext-setting p{font-size:11px;line-height:1.55;color:#949aa4;margin:0 0 11px}
#postText{min-height:90px!important}
@media(max-width:1120px){.shell{grid-template-columns:210px 1fr!important}.plus-right{display:none}}
@media(max-width:820px){.shell{display:block!important}.plus-top{height:58px;padding:0 13px}.plus-top h2{font-size:16px}.ext-page{padding:15px 12px 82px}.plus-right{display:none}.grid2{grid-template-columns:1fr}.hero{display:none!important}.authpanel .card{padding:20px}.side{display:none!important}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

function api2(url,opt={}){return fetch(url,{credentials:'include',headers:{'Content-Type':'application/json',...(opt.headers||{})},...opt}).then(async r=>{let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||'İşlem başarısız');return d})}

function addTop(){
 const main=document.querySelector('.shell main'); if(!main||document.querySelector('.plus-top'))return;
 const top=document.createElement('div');top.className='plus-top';top.innerHTML=`<h2 id="plusTitle">Meydan</h2><div class="plus-actions"><button class="round2" id="plusNotif">♢</button><button class="round2" id="plusQuick">＋</button><button class="round2" id="plusSettings">⚙</button></div>`;
 main.prepend(top);
 $('plusNotif').onclick=()=>openExt('notifications');$('plusQuick').onclick=()=>showQuick();$('plusSettings').onclick=()=>openExt('settings');
}
function addRight(){
 const shell=document.querySelector('.shell');if(!shell||document.querySelector('.plus-right'))return;
 const right=document.createElement('aside');right.className='plus-right';right.innerHTML=`
 <h3>Birarada Beta</h3>
 <div class="plus-card safety-card"><b>Güvenli başlangıç</b><p>Yeni hesaplar varsayılan gizli başlar. Engelleme, sessize alma ve şikâyet altyapısı beta sürümünde aktif.</p></div>
 <div class="plus-card"><b>24 saatlik Not</b><p>Çevrene kısa bir not bırak.</p><div style="display:flex;gap:6px"><input id="note2" maxlength="80" placeholder="Bir not..." style="min-width:0;width:100%;height:35px;border:1px solid #2b2e35;border-radius:10px;background:#0c0d11;color:#fff;padding:0 8px"><button class="pill2" id="noteSave2">Yayınla</button></div><div id="notes2" style="margin-top:9px"></div></div>
 <div class="plus-card"><b>Keşif</b><div class="plus-trend"><span>#birarada</span><span>Topluluk</span></div><div class="plus-trend"><span>#oyun</span><span>İlgi</span></div><div class="plus-trend"><span>#müzik</span><span>İlgi</span></div></div>
 <div class="plus-card"><b>Özgün ürün dili</b><p>Meydan, Çevre ve Anlar; Birarada'nın kendi bilgi mimarisinin parçalarıdır. Başka bir platformun piksel kopyası değildir.</p></div>`;
 shell.appendChild(right);
 $('noteSave2').onclick=saveNote;loadNotes2();
}
function addMoments(){
 const home=$('home');if(!home||home.querySelector('.moments2'))return;
 const h=home.querySelector('h2');if(h)h.textContent='Meydan';
 const box=document.createElement('div');box.innerHTML=`<div style="display:flex;justify-content:space-between;margin-bottom:10px"><b>Anlar</b><span class="muted" style="font-size:10px">24 saatlik kısa paylaşımlar</span></div><div class="moments2"><div class="moment2"><div class="ring2"><div>＋</div></div><small>Yeni An</small></div><div class="moment2"><div class="ring2"><div>B</div></div><small>Birarada</small></div><div class="moment2"><div class="ring2"><div>O</div></div><small>Oyun</small></div><div class="moment2"><div class="ring2"><div>M</div></div><small>Müzik</small></div><div class="moment2"><div class="ring2"><div>S</div></div><small>Sokak</small></div></div>`;
 const composer=home.querySelector('.composer');home.insertBefore(box,composer);
}
function addDraftUI(){
 const composer=document.querySelector('.composer');if(!composer||$('draftbar2'))return;
 const bar=document.createElement('div');bar.id='draftbar2';bar.className='draftbar';bar.innerHTML=`<span id="draftState2">Taslak otomatik kaydedilir</span><span><b id="chars2">0</b>/1200</span>`;
 const row=composer.querySelector('.row.end');composer.insertBefore(bar,row);
 const vis=document.createElement('select');vis.id='visibility2';vis.className='pill2';vis.innerHTML='<option value="public">Herkes</option><option value="followers">Takipçiler</option><option value="close">Yakınlar</option>';
 const clear=document.createElement('button');clear.className='pill2';clear.textContent='Taslağı sil';clear.id='clearDraft2';
 row.prepend(clear);row.prepend(vis);
 const t=$('postText'),img=$('postImage');
 const key='birarada_draft_ext';
 const update=()=>{if($('chars2'))$('chars2').textContent=t.value.length};
 const save=()=>{localStorage.setItem(key,JSON.stringify({body:t.value,img:img.value,visibility:vis.value}));$('draftState2').textContent='Taslak kaydedildi'};
 [t,img,vis].forEach(el=>el.addEventListener('input',()=>{update();clearTimeout(window.__bd);window.__bd=setTimeout(save,450)}));
 clear.onclick=()=>{localStorage.removeItem(key);t.value='';img.value='';vis.value='public';update();$('draftState2').textContent='Taslak silindi'};
 try{const d=JSON.parse(localStorage.getItem(key)||'null');if(d){t.value=d.body||'';img.value=d.img||'';vis.value=d.visibility||'public';update()}}catch{}
 $('share').onclick=async()=>{try{await api2('/api/posts',{method:'POST',body:JSON.stringify({body:t.value,mediaUrl:img.value,visibility:vis.value})});localStorage.removeItem(key);t.value='';img.value='';update();toast2('Meydana bırakıldı.');window.loadFeed&&loadFeed()}catch(e){toast2(e.message)}};
}
const extDefs=[
 ['moments','◉','Anlar'],['saved','◇','Kaydedilenler'],['notifications','♢','Bildirimler'],['requests','↔','Takip İstekleri'],['activity','⌁','Etkinlikler'],['settings','⚙','Güvenlik & Ayarlar']
];
function addPages(){
 const main=document.querySelector('.shell main');const navEl=document.querySelector('.side .nav');if(!main||!navEl)return;
 extDefs.forEach(([id,ic,label])=>{
  if(!document.querySelector(`.side [data-ext="${id}"]`)){const b=document.createElement('button');b.dataset.ext=id;b.innerHTML=`<span style="width:22px;text-align:center">${ic}</span>${label}${id==='notifications'?'<span id="badge2" class="badge2 hidden">0</span>':''}`;navEl.appendChild(b);b.onclick=()=>openExt(id)}
  if(!$(id+'Ext')){const s=document.createElement('section');s.id=id+'Ext';s.className='ext-page';s.innerHTML=pageTemplate(id);main.appendChild(s)}
 });
}
function pageTemplate(id){
 if(id==='moments')return `<div class="ext-head"><div><h3>Anlar</h3><span>Birarada'nın kısa paylaşım alanı</span></div></div><div class="panel empty"><b>Anlar beta hazırlığında.</b>24 saatlik paylaşım altyapısı bir sonraki medya depolama aşamasında açılacak.</div>`;
 if(id==='saved')return `<div class="ext-head"><div><h3>Kaydedilenler</h3><span>Sonra dönmek istediklerin</span></div></div><div id="savedFeed2" class="feed"></div>`;
 if(id==='notifications')return `<div class="ext-head"><div><h3>Bildirimler</h3><span>Beğeni, yorum, takip ve istekler</span></div><button id="readAll2" class="pill2">Tümünü oku</button></div><div id="notifList2" class="panel ext-list"></div>`;
 if(id==='requests')return `<div class="ext-head"><div><h3>Takip İstekleri</h3><span>Gizli hesabına gelenler</span></div></div><div id="requests2" class="panel ext-list"></div>`;
 if(id==='activity')return `<div class="ext-head"><div><h3>Etkinlikler</h3><span>Hesap hareket geçmişin</span></div></div><div id="activity2" class="panel ext-list"></div>`;
 if(id==='settings')return `<div class="ext-head"><div><h3>Güvenlik & Ayarlar</h3><span>Kontrol sende</span></div></div><div class="grid2"><div class="panel ext-setting"><h4>Gizli hesap</h4><p>Hesabının görünürlüğünü değiştir.</p><button class="pill2" id="privacy2">Durumu değiştir</button></div><div class="panel ext-setting"><h4>Mesaj izni</h4><p>Mesaj isteklerini açıp kapat.</p><button class="pill2" id="message2">Değiştir</button></div><div class="panel ext-setting"><h4>Hareket durumu</h4><p>Aktiflik bilgisini göster/gizle.</p><button class="pill2" id="activityToggle2">Değiştir</button></div><div class="panel ext-setting"><h4>Görünüm</h4><p>Kompakt görünüm ve azaltılmış hareket.</p><button class="pill2" id="compact2">Kompakt</button> <button class="pill2" id="motion2">Hareket azalt</button></div><div class="panel ext-setting"><h4>Verilerim</h4><p>Hesap verilerinin JSON kopyasını al.</p><button class="pill2" id="export2">Verilerimi indir</button></div><div class="panel ext-setting"><h4 style="color:#ff818a">Tehlikeli alan</h4><p>Hesabı kalıcı olarak sil.</p><button class="pill2" id="delete2" style="color:#ff818a">Hesabı sil</button></div></div>`;
 return '';
}
function openExt(id){
 document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
 document.querySelectorAll('.ext-page').forEach(x=>x.classList.remove('active'));
 const p=$(id+'Ext');if(p)p.classList.add('active');
 document.querySelectorAll('.side button').forEach(x=>x.classList.remove('active'));
 const b=document.querySelector(`.side [data-ext="${id}"]`);if(b)b.classList.add('active');
 if($('plusTitle'))$('plusTitle').textContent={moments:'Anlar',saved:'Kaydedilenler',notifications:'Bildirimler',requests:'Takip İstekleri',activity:'Etkinlikler',settings:'Güvenlik & Ayarlar'}[id]||'Birarada';
 if(id==='saved')loadSaved2();if(id==='notifications')loadNotifications2();if(id==='requests')loadRequests2();if(id==='activity')loadActivity2();if(id==='settings')wireSettings();
}
function enhanceOriginalNav(){
 document.querySelectorAll('.side [data-page]').forEach(b=>b.addEventListener('click',()=>{$('plusTitle').textContent=b.dataset.page==='home'?'Meydan':b.dataset.page==='explore'?'Çevre':'Profilim';document.querySelectorAll('.ext-page').forEach(x=>x.classList.remove('active'))}));
}
function enhancePosts(){
 window.postHTML=(p)=>{const name=p.user?.displayName||'Kullanıcı',u=p.user?.username||'';return `<article class="panel post"><div class="posthead"><div class="avatar">${esc(initial(name))}</div><div class="postmeta"><b>${esc(name)}</b><span>@${esc(u)} · ${new Date(p.createdAt).toLocaleString('tr-TR')}${p.edited?' · düzenlendi':''}${p.pinned?' · sabit':''}</span></div><button class="post-more" style="margin-left:auto;background:none;border:0;color:#8c929c;font-size:20px" onclick="postMenu2(${p.id},${p.userId},${JSON.stringify(p.body||'').replace(/"/g,'&quot;')},${!!p.saved},${!!p.pinned},${p.commentsEnabled!==false})">···</button></div>${p.body?`<div class="postbody">${esc(p.body)}</div>`:''}${p.mediaUrl?`<img class="postimg" src="${esc(p.mediaUrl)}" loading="lazy" onerror="this.style.display='none'">`:''}<div class="post-tools2"><button onclick="likePost(${p.id})">${p.liked?'♥':'♡'} ${p.likeCount||0}</button><button onclick="openComments2(${p.id})">Yorum ${p.commentCount||0}</button><button onclick="react2(${p.id})">Tepki</button><button class="${p.saved?'saved2':''}" onclick="save2(${p.id})">${p.saved?'◆ Kaydedildi':'◇ Kaydet'}</button><button class="push" onclick="share2(${p.id})">Paylaş</button></div></article>`};
 if(window.loadFeed)loadFeed();
}
window.save2=async id=>{try{const d=await api2('/api/posts/'+id+'/save',{method:'POST'});toast2(d.saved?'Kaydedildi.':'Kayıttan çıkarıldı.');window.loadFeed&&loadFeed()}catch(e){toast2(e.message)}};
window.react2=async id=>{const e=prompt('Tepki seç: 🔥 👏 😂 🤝 💯 🧡','🔥');if(!e)return;try{await api2('/api/posts/'+id+'/reaction',{method:'POST',body:JSON.stringify({emoji:e.trim()})});toast2('Tepkin eklendi.')}catch(x){toast2(x.message)}};
window.share2=async id=>{const url=location.origin+'/?post='+id;try{if(navigator.share)await navigator.share({title:'Birarada gönderisi',url});else{await navigator.clipboard.writeText(url);toast2('Bağlantı kopyalandı.')}}catch{}};
window.openComments2=async id=>{try{const d=await api2('/api/posts/'+id+'/comments');const list=d.comments.map(c=>`${c.user?.displayName||'Kullanıcı'}: ${c.body}`).join('\n\n')||'Henüz yorum yok.';const v=prompt(list+'\n\nYeni yorum:','');if(v&&v.trim()){await api2('/api/posts/'+id+'/comments',{method:'POST',body:JSON.stringify({body:v})});toast2('Yorum eklendi.');loadFeed()}}catch(e){toast2(e.message)}};
function ensureModal(){if($('modal2'))return;const m=document.createElement('div');m.id='modal2';m.className='modal2';m.innerHTML='<div class="modalbox2"><button id="modalClose2" class="round2" style="float:right">×</button><div id="modalBody2"></div></div>';document.body.appendChild(m);$('modalClose2').onclick=()=>m.classList.remove('show');m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('show')})}
window.postMenu2=(id,userId,body,saved,pinned,commentsEnabled)=>{ensureModal();const mine=window.me&&me.id===userId;let h='<h3>Gönderi seçenekleri</h3><div class="grid2">';if(mine){h+=`<button class="pill2" onclick="edit2(${id},${JSON.stringify(body).replace(/"/g,'&quot;')})">Düzenle</button><button class="pill2" onclick="pin2(${id},${!pinned})">${pinned?'Sabitlemeyi kaldır':'Sabitle'}</button><button class="pill2" onclick="commentsToggle2(${id},${!commentsEnabled})">${commentsEnabled?'Yorumları kapat':'Yorumları aç'}</button><button class="pill2" style="color:#ff7e87" onclick="deletePost2(${id})">Sil</button>`}else{h+=`<button class="pill2" onclick="save2(${id})">Kaydet / çıkar</button><button class="pill2" onclick="report2(${id})">Şikâyet et</button>`}h+='</div>';$('modalBody2').innerHTML=h;$('modal2').classList.add('show')};
window.edit2=async(id,body)=>{const v=prompt('Gönderiyi düzenle:',body||'');if(v===null)return;try{await api2('/api/posts/'+id,{method:'PATCH',body:JSON.stringify({body:v})});$('modal2').classList.remove('show');toast2('Düzenlendi.');loadFeed()}catch(e){toast2(e.message)}};
window.pin2=async(id,v)=>{try{await api2('/api/posts/'+id,{method:'PATCH',body:JSON.stringify({pinned:v})});$('modal2').classList.remove('show');toast2(v?'Sabitlendi.':'Sabitleme kaldırıldı.');window.loadProfile&&loadProfile()}catch(e){toast2(e.message)}};
window.commentsToggle2=async(id,v)=>{try{await api2('/api/posts/'+id,{method:'PATCH',body:JSON.stringify({commentsEnabled:v})});$('modal2').classList.remove('show');toast2(v?'Yorumlar açıldı.':'Yorumlar kapatıldı.')}catch(e){toast2(e.message)}};
window.deletePost2=async id=>{if(!confirm('Gönderi kalıcı silinsin mi?'))return;try{await api2('/api/posts/'+id,{method:'DELETE'});$('modal2').classList.remove('show');toast2('Silindi.');loadFeed()}catch(e){toast2(e.message)}};
window.report2=async id=>{const reason=prompt('Şikâyet nedenini yaz:');if(!reason)return;try{await api2('/api/reports',{method:'POST',body:JSON.stringify({type:'post',targetId:id,reason})});$('modal2').classList.remove('show');toast2('Şikâyetin alındı.')}catch(e){toast2(e.message)}};

async function loadSaved2(){try{const d=await api2('/api/saved');$('savedFeed2').innerHTML=d.posts.length?d.posts.map(p=>postHTML({...p,saved:true,likeCount:0,commentCount:0})).join(''):'<div class="panel empty">Henüz kaydettiğin gönderi yok.</div>'}catch(e){toast2(e.message)}}
async function loadNotifications2(){try{const d=await api2('/api/notifications');if($('badge2')){$('badge2').textContent=d.unread;$('badge2').classList.toggle('hidden',!d.unread)};$('notifList2').innerHTML=d.notifications.length?d.notifications.map(n=>`<div class="ext-row">${n.read?'':'<div class="dot2"></div>'}<div class="ext-grow"><b>${esc(n.text)}</b><span>${new Date(n.createdAt).toLocaleString('tr-TR')}</span></div></div>`).join(''):'<div class="empty">Henüz bildirimin yok.</div>';if($('readAll2'))$('readAll2').onclick=async()=>{await api2('/api/notifications/read-all',{method:'POST'});loadNotifications2()}}catch(e){toast2(e.message)}}
async function loadRequests2(){try{const d=await api2('/api/follow-requests');$('requests2').innerHTML=d.requests.length?d.requests.map(r=>`<div class="ext-row"><div class="avatar">${esc(initial(r.user?.displayName))}</div><div class="ext-grow"><b>${esc(r.user?.displayName||'Kullanıcı')}</b><span>@${esc(r.user?.username||'')}</span></div><button class="pill2 orange" onclick="req2(${r.id},'accept')">Kabul</button><button class="pill2" onclick="req2(${r.id},'reject')">Reddet</button></div>`).join(''):'<div class="empty">Bekleyen istek yok.</div>'}catch(e){toast2(e.message)}}
window.req2=async(id,a)=>{try{await api2('/api/follow-requests/'+id+'/'+a,{method:'POST'});loadRequests2();toast2(a==='accept'?'Kabul edildi.':'Reddedildi.')}catch(e){toast2(e.message)}};
async function loadActivity2(){try{const d=await api2('/api/activity');$('activity2').innerHTML=d.activities.length?d.activities.map(a=>`<div class="ext-row"><div class="ext-grow"><b>${esc(a.text)}</b><span>${esc(a.type)} · ${new Date(a.createdAt).toLocaleString('tr-TR')}</span></div></div>`).join(''):'<div class="empty">Etkinlik yok.</div>'}catch(e){toast2(e.message)}}
function wireSettings(){setTimeout(()=>{if(!$('privacy2'))return;$('privacy2').onclick=()=>patchMe({isPrivate:!me.isPrivate},me.isPrivate?'Hesap açık oldu.':'Hesap gizliye alındı.');$('message2').onclick=()=>patchMe({allowMessages:!me.allowMessages},'Mesaj tercihi güncellendi.');$('activityToggle2').onclick=()=>patchMe({showActivity:!me.showActivity},'Hareket tercihi güncellendi.');$('compact2').onclick=()=>{document.body.classList.toggle('compact2');localStorage.setItem('bcompact',document.body.classList.contains('compact2')?'1':'0')};$('motion2').onclick=()=>{document.body.classList.toggle('reduce-motion2');localStorage.setItem('bmotion',document.body.classList.contains('reduce-motion2')?'1':'0')};$('export2').onclick=export2;$('delete2').onclick=delete2},0)}
async function patchMe(body,msg){try{const d=await api2('/api/profile',{method:'PATCH',body:JSON.stringify(body)});window.me=me={...me,...d.user};toast2(msg)}catch(e){toast2(e.message)}}
async function export2(){try{const d=await api2('/api/export');const blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='birarada-verilerim.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}catch(e){toast2(e.message)}}
async function delete2(){if(prompt('Kalıcı silmek için SİL yaz:')!=='SİL')return;try{await api2('/api/account',{method:'DELETE'});location.reload()}catch(e){toast2(e.message)}}
async function saveNote(){try{await api2('/api/notes',{method:'POST',body:JSON.stringify({body:$('note2').value})});$('note2').value='';loadNotes2();toast2('Not yayınlandı.')}catch(e){toast2(e.message)}}
async function loadNotes2(){if(!$('notes2'))return;try{const d=await api2('/api/notes');$('notes2').innerHTML=d.notes.slice(0,5).map(n=>`<div style="padding:7px 0;border-top:1px solid #262930;font-size:10px"><b>${esc(n.user?.displayName||'Kullanıcı')}</b> · ${esc(n.body)}</div>`).join('')}catch{}}
function showQuick(){ensureModal();$('modalBody2').innerHTML=`<h3>Hızlı işlemler</h3><div class="grid2"><button class="pill2" onclick="document.getElementById('modal2').classList.remove('show');document.querySelector('[data-page=home]').click();document.getElementById('postText').focus()">Yeni gönderi</button><button class="pill2" onclick="document.getElementById('modal2').classList.remove('show');document.querySelector('[data-ext=saved]').click()">Kaydedilenler</button><button class="pill2" onclick="document.getElementById('modal2').classList.remove('show');document.querySelector('[data-ext=requests]').click()">Takip istekleri</button><button class="pill2" onclick="document.getElementById('modal2').classList.remove('show');document.querySelector('[data-ext=activity]').click()">Etkinlikler</button></div>`;$('modal2').classList.add('show')}
function upgradeExplore(){
 window.followUser=async id=>{try{const d=await api2('/api/follow/'+id,{method:'POST'});toast2(d.pending?'Takip isteği gönderildi.':d.following?'Takip edildi.':'Takip bırakıldı.');window.loadUsers&&loadUsers()}catch(e){toast2(e.message)}}
}
function keyboard(){document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.querySelector('[data-page=explore]')?.click();setTimeout(()=>$('search')?.focus(),50)}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&!$('app')?.classList.contains('hidden'))$('share')?.click();if(e.key==='Escape')$('modal2')?.classList.remove('show')})}
function init(){
 addTop();addRight();addMoments();addDraftUI();addPages();enhanceOriginalNav();enhancePosts();upgradeExplore();keyboard();ensureModal();
 if(localStorage.getItem('bcompact')==='1')document.body.classList.add('compact2');if(localStorage.getItem('bmotion')==='1')document.body.classList.add('reduce-motion2');
 setInterval(()=>{if(!$('app')?.classList.contains('hidden'))loadNotifications2()},30000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();