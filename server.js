const express=require('express');
const path=require('path');
const fs=require('fs');
const crypto=require('crypto');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const rateLimit=require('express-rate-limit');

const app=express();
const PORT=process.env.PORT||3000;
const SECRET=process.env.JWT_SECRET||crypto.randomBytes(32).toString('hex');
const DATA=path.join(__dirname,'data','birarada.json');
fs.mkdirSync(path.dirname(DATA),{recursive:true});

function fresh(){return {
  users:[],posts:[],likes:[],follows:[],followRequests:[],comments:[],notifications:[],
  saves:[],collections:[],collectionItems:[],blocks:[],mutes:[],reports:[],notes:[],
  closeFriends:[],postReactions:[],postViews:[],searchHistory:[],activities:[]
}}
function load(){try{const d=JSON.parse(fs.readFileSync(DATA,'utf8'));return {...fresh(),...d}}catch(e){return fresh()}}
let db=load();
function save(){fs.writeFileSync(DATA,JSON.stringify(db,null,2))}
function id(rows){return rows.reduce((m,x)=>Math.max(m,Number(x.id)||0),0)+1}
function now(){return new Date().toISOString()}
function clean(v,n=500){return String(v||'').trim().slice(0,n)}
function uname(v){return clean(v,30).toLowerCase().replace(/[^a-z0-9_.]/g,'')}
function blocked(a,b){return db.blocks.some(x=>(x.blockerId===a&&x.blockedId===b)||(x.blockerId===b&&x.blockedId===a))}
function muted(a,b){return db.mutes.some(x=>x.userId===a&&x.mutedUserId===b)}
function following(a,b){return db.follows.some(f=>f.followerId===a&&f.followingId===b)}
function pub(u,viewer){
  if(!u)return null;
  return {id:u.id,email:u.id===viewer?u.email:undefined,username:u.username,displayName:u.displayName,bio:u.bio||'',
    avatarUrl:u.avatarUrl||null,isPrivate:!!u.isPrivate,theme:u.theme||'dark',accent:u.accent||'orange',
    pronouns:u.pronouns||'',website:u.website||'',location:u.location||'',createdAt:u.createdAt,
    allowMessages:u.allowMessages!==false,showActivity:u.showActivity!==false}
}
function token(uid){return jwt.sign({uid},SECRET,{expiresIn:'30d'})}
function auth(req,res,next){try{const t=req.cookies.birarada_session||'';const p=jwt.verify(t,SECRET);const u=db.users.find(x=>x.id===p.uid);if(!u)throw 0;req.user=u;next()}catch(e){res.status(401).json({error:'Oturum gerekli.'})}}
function addNotif(userId,type,text,actorId=null,entityId=null){
  if(!userId)return;
  db.notifications.push({id:id(db.notifications),userId,type,text,actorId,entityId,read:false,createdAt:now()});
}
function addActivity(userId,type,text){db.activities.push({id:id(db.activities),userId,type,text,createdAt:now()})}
const cookie={httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:30*864e5};

app.use(express.json({limit:'2mb'}));
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());
app.use(express.static(__dirname));
const limiter=rateLimit({windowMs:15*60*1000,limit:80,standardHeaders:true,legacyHeaders:false});

app.get('/api/health',(req,res)=>res.json({ok:true,service:'birarada-beta',auth:'own-backend',storage:'render-local-beta',features:'extended'}));

app.post('/api/auth/register',limiter,async(req,res)=>{
  const email=clean(req.body.email,120).toLowerCase(),username=uname(req.body.username),displayName=clean(req.body.displayName||req.body.name,60),password=String(req.body.password||'');
  if(!email.includes('@')||username.length<3||displayName.length<2||password.length<6)return res.status(400).json({error:'Bilgileri kontrol et.'});
  if(db.users.some(u=>u.email===email||u.username===username))return res.status(409).json({error:'E-posta veya kullanıcı adı kullanımda.'});
  const u={id:id(db.users),email,username,displayName,passwordHash:await bcrypt.hash(password,10),bio:'',isPrivate:true,theme:'dark',accent:'orange',allowMessages:true,showActivity:true,createdAt:now()};
  db.users.push(u);addActivity(u.id,'register','Hesap oluşturuldu');save();
  res.cookie('birarada_session',token(u.id),cookie);res.json({user:pub(u,u.id)});
});
app.post('/api/auth/login',limiter,async(req,res)=>{
  const login=clean(req.body.login||req.body.email,120).toLowerCase(),password=String(req.body.password||'');
  const u=db.users.find(x=>x.email===login||x.username===login);
  if(!u||!(await bcrypt.compare(password,u.passwordHash)))return res.status(401).json({error:'E-posta/kullanıcı adı veya şifre yanlış.'});
  addActivity(u.id,'login','Giriş yapıldı');save();
  res.cookie('birarada_session',token(u.id),cookie);res.json({user:pub(u,u.id)});
});
app.post('/api/auth/logout',(req,res)=>{res.clearCookie('birarada_session',{path:'/'});res.json({ok:true})});
app.get('/api/auth/me',auth,(req,res)=>res.json({user:pub(req.user,req.user.id)}));

app.patch('/api/profile',auth,(req,res)=>{
  const body=req.body||{};
  if(body.displayName!==undefined)req.user.displayName=clean(body.displayName,60);
  if(body.bio!==undefined)req.user.bio=clean(body.bio,160);
  if(body.isPrivate!==undefined)req.user.isPrivate=!!body.isPrivate;
  if(body.pronouns!==undefined)req.user.pronouns=clean(body.pronouns,40);
  if(body.website!==undefined)req.user.website=clean(body.website,120);
  if(body.location!==undefined)req.user.location=clean(body.location,80);
  if(body.allowMessages!==undefined)req.user.allowMessages=!!body.allowMessages;
  if(body.showActivity!==undefined)req.user.showActivity=!!body.showActivity;
  if(body.theme!==undefined)req.user.theme=clean(body.theme,20);
  if(body.accent!==undefined)req.user.accent=clean(body.accent,20);
  addActivity(req.user.id,'profile','Profil güncellendi');save();res.json({user:pub(req.user,req.user.id)});
});

app.get('/api/feed',auth,(req,res)=>{
  const posts=[...db.posts]
    .filter(p=>!blocked(req.user.id,p.userId)&&!muted(req.user.id,p.userId))
    .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
    .map(p=>({...p,user:pub(db.users.find(u=>u.id===p.userId),req.user.id),
      likeCount:db.likes.filter(l=>l.postId===p.id).length,
      liked:db.likes.some(l=>l.postId===p.id&&l.userId===req.user.id),
      saved:db.saves.some(s=>s.postId===p.id&&s.userId===req.user.id),
      commentCount:db.comments.filter(c=>c.postId===p.id).length,
      reactionCounts:db.postReactions.filter(r=>r.postId===p.id).reduce((o,r)=>(o[r.emoji]=(o[r.emoji]||0)+1,o),{})
    }));
  res.json({posts});
});
app.post('/api/posts',auth,(req,res)=>{
  const body=clean(req.body.body,1200),mediaUrl=clean(req.body.mediaUrl,500),visibility=['public','followers','close'].includes(req.body.visibility)?req.body.visibility:'public';
  if(!body&&!mediaUrl)return res.status(400).json({error:'Gönderi boş olamaz.'});
  const p={id:id(db.posts),userId:req.user.id,body,mediaUrl,visibility,edited:false,pinned:false,commentsEnabled:req.body.commentsEnabled!==false,createdAt:now()};
  db.posts.push(p);addActivity(req.user.id,'post','Gönderi oluşturuldu');save();
  res.json({post:{...p,user:pub(req.user,req.user.id),likeCount:0,liked:false,saved:false,commentCount:0,reactionCounts:{}}});
});
app.patch('/api/posts/:id',auth,(req,res)=>{
  const p=db.posts.find(x=>x.id===Number(req.params.id)&&x.userId===req.user.id);if(!p)return res.status(404).json({error:'Gönderi bulunamadı.'});
  if(req.body.body!==undefined)p.body=clean(req.body.body,1200);
  if(req.body.mediaUrl!==undefined)p.mediaUrl=clean(req.body.mediaUrl,500);
  if(req.body.visibility!==undefined&&['public','followers','close'].includes(req.body.visibility))p.visibility=req.body.visibility;
  if(req.body.commentsEnabled!==undefined)p.commentsEnabled=!!req.body.commentsEnabled;
  if(req.body.pinned!==undefined)p.pinned=!!req.body.pinned;
  p.edited=true;p.editedAt=now();save();res.json({post:p});
});
app.delete('/api/posts/:id',auth,(req,res)=>{
  const pid=Number(req.params.id),i=db.posts.findIndex(x=>x.id===pid&&x.userId===req.user.id);if(i<0)return res.status(404).json({error:'Gönderi bulunamadı.'});
  db.posts.splice(i,1);db.likes=db.likes.filter(x=>x.postId!==pid);db.comments=db.comments.filter(x=>x.postId!==pid);db.saves=db.saves.filter(x=>x.postId!==pid);db.postReactions=db.postReactions.filter(x=>x.postId!==pid);save();res.json({ok:true});
});
app.post('/api/posts/:id/like',auth,(req,res)=>{
  const postId=Number(req.params.id),p=db.posts.find(x=>x.id===postId);if(!p)return res.status(404).json({error:'Gönderi bulunamadı.'});
  const i=db.likes.findIndex(l=>l.postId===postId&&l.userId===req.user.id);let liked;
  if(i>=0){db.likes.splice(i,1);liked=false}else{db.likes.push({id:id(db.likes),postId,userId:req.user.id,createdAt:now()});liked=true;if(p.userId!==req.user.id)addNotif(p.userId,'like',`${req.user.displayName} gönderini beğendi`,req.user.id,p.id)}
  save();res.json({liked,likeCount:db.likes.filter(l=>l.postId===postId).length});
});
app.post('/api/posts/:id/reaction',auth,(req,res)=>{
  const postId=Number(req.params.id),emoji=clean(req.body.emoji,8);if(!['🔥','👏','😂','🤝','💯','🧡'].includes(emoji))return res.status(400).json({error:'Geçersiz tepki.'});
  db.postReactions=db.postReactions.filter(r=>!(r.postId===postId&&r.userId===req.user.id));
  db.postReactions.push({id:id(db.postReactions),postId,userId:req.user.id,emoji,createdAt:now()});save();res.json({ok:true});
});
app.post('/api/posts/:id/save',auth,(req,res)=>{
  const postId=Number(req.params.id);const i=db.saves.findIndex(s=>s.postId===postId&&s.userId===req.user.id);let saved;
  if(i>=0){db.saves.splice(i,1);saved=false}else{db.saves.push({id:id(db.saves),postId,userId:req.user.id,createdAt:now()});saved=true}
  save();res.json({saved});
});
app.get('/api/saved',auth,(req,res)=>{
  const ids=db.saves.filter(s=>s.userId===req.user.id).map(s=>s.postId);res.json({posts:db.posts.filter(p=>ids.includes(p.id)).map(p=>({...p,user:pub(db.users.find(u=>u.id===p.userId),req.user.id)}))});
});
app.get('/api/posts/:id/comments',auth,(req,res)=>res.json({comments:db.comments.filter(c=>c.postId===Number(req.params.id)).map(c=>({...c,user:pub(db.users.find(u=>u.id===c.userId),req.user.id)}))}));
app.post('/api/posts/:id/comments',auth,(req,res)=>{
  const p=db.posts.find(x=>x.id===Number(req.params.id));if(!p)return res.status(404).json({error:'Gönderi bulunamadı.'});if(p.commentsEnabled===false)return res.status(403).json({error:'Yorumlar kapalı.'});
  const body=clean(req.body.body,500);if(!body)return res.status(400).json({error:'Yorum boş olamaz.'});
  const c={id:id(db.comments),postId:p.id,userId:req.user.id,body,createdAt:now()};db.comments.push(c);if(p.userId!==req.user.id)addNotif(p.userId,'comment',`${req.user.displayName} yorum yaptı`,req.user.id,p.id);save();res.json({comment:{...c,user:pub(req.user,req.user.id)}});
});
app.delete('/api/comments/:id',auth,(req,res)=>{const i=db.comments.findIndex(c=>c.id===Number(req.params.id)&&c.userId===req.user.id);if(i<0)return res.status(404).json({error:'Yorum bulunamadı.'});db.comments.splice(i,1);save();res.json({ok:true})});

app.get('/api/users',auth,(req,res)=>{
  const q=clean(req.query.q,40).toLowerCase();
  res.json({users:db.users.filter(u=>u.id!==req.user.id&&!blocked(req.user.id,u.id)&&(!q||u.username.includes(q)||u.displayName.toLowerCase().includes(q))).slice(0,50).map(u=>({...pub(u,req.user.id),following:following(req.user.id,u.id),muted:muted(req.user.id,u.id)}))});
});
app.get('/api/profile/:username',auth,(req,res)=>{
  const u=db.users.find(x=>x.username===uname(req.params.username));if(!u||blocked(req.user.id,u.id))return res.status(404).json({error:'Kullanıcı bulunamadı.'});
  const posts=db.posts.filter(p=>p.userId===u.id).sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||new Date(b.createdAt)-new Date(a.createdAt));
  res.json({user:pub(u,req.user.id),counts:{posts:posts.length,followers:db.follows.filter(f=>f.followingId===u.id).length,following:db.follows.filter(f=>f.followerId===u.id).length},posts,following:following(req.user.id,u.id),isClose:db.closeFriends.some(c=>c.userId===req.user.id&&c.friendId===u.id)});
});
app.post('/api/follow/:uid',auth,(req,res)=>{
  const uid=Number(req.params.uid),target=db.users.find(u=>u.id===uid);if(!target||uid===req.user.id)return res.status(400).json({error:'Geçersiz kullanıcı.'});
  if(blocked(req.user.id,uid))return res.status(403).json({error:'Takip işlemi kullanılamıyor.'});
  const i=db.follows.findIndex(f=>f.followerId===req.user.id&&f.followingId===uid);let followingNow=false,pending=false;
  if(i>=0){db.follows.splice(i,1)}
  else if(target.isPrivate){if(!db.followRequests.some(r=>r.fromId===req.user.id&&r.toId===uid)){db.followRequests.push({id:id(db.followRequests),fromId:req.user.id,toId:uid,createdAt:now()});addNotif(uid,'follow_request',`${req.user.displayName} seni takip etmek istiyor`,req.user.id)}pending=true}
  else{db.follows.push({id:id(db.follows),followerId:req.user.id,followingId:uid,createdAt:now()});followingNow=true;addNotif(uid,'follow',`${req.user.displayName} seni takip etti`,req.user.id)}
  save();res.json({following:followingNow,pending});
});
app.get('/api/follow-requests',auth,(req,res)=>res.json({requests:db.followRequests.filter(r=>r.toId===req.user.id).map(r=>({...r,user:pub(db.users.find(u=>u.id===r.fromId),req.user.id)}))}));
app.post('/api/follow-requests/:id/:action',auth,(req,res)=>{
  const r=db.followRequests.find(x=>x.id===Number(req.params.id)&&x.toId===req.user.id);if(!r)return res.status(404).json({error:'İstek bulunamadı.'});
  if(req.params.action==='accept'){if(!following(r.fromId,r.toId))db.follows.push({id:id(db.follows),followerId:r.fromId,followingId:r.toId,createdAt:now()});addNotif(r.fromId,'follow_accept',`${req.user.displayName} takip isteğini kabul etti`,req.user.id)}
  db.followRequests=db.followRequests.filter(x=>x.id!==r.id);save();res.json({ok:true});
});
app.post('/api/users/:uid/block',auth,(req,res)=>{const uid=Number(req.params.uid);if(uid===req.user.id)return res.status(400).json({error:'Geçersiz işlem.'});const i=db.blocks.findIndex(x=>x.blockerId===req.user.id&&x.blockedId===uid);let blockedNow;if(i>=0){db.blocks.splice(i,1);blockedNow=false}else{db.blocks.push({id:id(db.blocks),blockerId:req.user.id,blockedId:uid,createdAt:now()});blockedNow=true;db.follows=db.follows.filter(f=>!((f.followerId===req.user.id&&f.followingId===uid)||(f.followerId===uid&&f.followingId===req.user.id)))}save();res.json({blocked:blockedNow})});
app.post('/api/users/:uid/mute',auth,(req,res)=>{const uid=Number(req.params.uid);const i=db.mutes.findIndex(x=>x.userId===req.user.id&&x.mutedUserId===uid);let mutedNow;if(i>=0){db.mutes.splice(i,1);mutedNow=false}else{db.mutes.push({id:id(db.mutes),userId:req.user.id,mutedUserId:uid,createdAt:now()});mutedNow=true}save();res.json({muted:mutedNow})});
app.post('/api/users/:uid/close',auth,(req,res)=>{const uid=Number(req.params.uid);const i=db.closeFriends.findIndex(x=>x.userId===req.user.id&&x.friendId===uid);let close;if(i>=0){db.closeFriends.splice(i,1);close=false}else{db.closeFriends.push({id:id(db.closeFriends),userId:req.user.id,friendId:uid,createdAt:now()});close=true}save();res.json({close})});

app.post('/api/reports',auth,(req,res)=>{const type=clean(req.body.type,30),targetId=Number(req.body.targetId),reason=clean(req.body.reason,300);if(!type||!targetId||!reason)return res.status(400).json({error:'Rapor bilgileri eksik.'});db.reports.push({id:id(db.reports),reporterId:req.user.id,type,targetId,reason,status:'open',createdAt:now()});save();res.json({ok:true})});

app.get('/api/notifications',auth,(req,res)=>{const ns=db.notifications.filter(n=>n.userId===req.user.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,100).map(n=>({...n,actor:pub(db.users.find(u=>u.id===n.actorId),req.user.id)}));res.json({notifications:ns,unread:ns.filter(n=>!n.read).length})});
app.post('/api/notifications/read-all',auth,(req,res)=>{db.notifications.filter(n=>n.userId===req.user.id).forEach(n=>n.read=true);save();res.json({ok:true})});

app.get('/api/notes',auth,(req,res)=>{const n=db.notes.filter(n=>Date.now()-new Date(n.createdAt).getTime()<24*3600e3).map(n=>({...n,user:pub(db.users.find(u=>u.id===n.userId),req.user.id)}));res.json({notes:n})});
app.post('/api/notes',auth,(req,res)=>{const body=clean(req.body.body,80);db.notes=db.notes.filter(n=>n.userId!==req.user.id);if(body)db.notes.push({id:id(db.notes),userId:req.user.id,body,createdAt:now()});save();res.json({ok:true})});

app.get('/api/activity',auth,(req,res)=>res.json({activities:db.activities.filter(a=>a.userId===req.user.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,100)}));
app.get('/api/export',auth,(req,res)=>{const uid=req.user.id;res.json({
  user:pub(req.user,uid),posts:db.posts.filter(x=>x.userId===uid),comments:db.comments.filter(x=>x.userId===uid),
  likes:db.likes.filter(x=>x.userId===uid),follows:db.follows.filter(x=>x.followerId===uid||x.followingId===uid),
  saves:db.saves.filter(x=>x.userId===uid),notifications:db.notifications.filter(x=>x.userId===uid),activities:db.activities.filter(x=>x.userId===uid)
})});
app.delete('/api/account',auth,(req,res)=>{
  const uid=req.user.id;db.users=db.users.filter(x=>x.id!==uid);db.posts=db.posts.filter(x=>x.userId!==uid);db.likes=db.likes.filter(x=>x.userId!==uid);db.comments=db.comments.filter(x=>x.userId!==uid);db.follows=db.follows.filter(x=>x.followerId!==uid&&x.followingId!==uid);db.saves=db.saves.filter(x=>x.userId!==uid);db.blocks=db.blocks.filter(x=>x.blockerId!==uid&&x.blockedId!==uid);db.mutes=db.mutes.filter(x=>x.userId!==uid&&x.mutedUserId!==uid);db.notifications=db.notifications.filter(x=>x.userId!==uid);save();res.clearCookie('birarada_session',{path:'/'});res.json({ok:true});
});

app.get('*',(req,res)=>{if(req.path.startsWith('/api/'))return res.status(404).json({error:'Bulunamadı.'});res.sendFile(path.join(__dirname,'index.html'))});
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:'Sunucu hatası.'})});
app.listen(PORT,'0.0.0.0',()=>console.log('Birarada extended beta listening on',PORT));
