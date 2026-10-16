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
function fresh(){return {users:[],posts:[],likes:[],follows:[],comments:[],notifications:[]}}
function load(){try{const d=JSON.parse(fs.readFileSync(DATA,'utf8'));return {...fresh(),...d}}catch(e){return fresh()}}
let db=load();
function save(){fs.writeFileSync(DATA,JSON.stringify(db,null,2));}
function id(rows){return rows.reduce((m,x)=>Math.max(m,Number(x.id)||0),0)+1}
function now(){return new Date().toISOString()}
function clean(v,n=500){return String(v||'').trim().slice(0,n)}
function uname(v){return clean(v,30).toLowerCase().replace(/[^a-z0-9_.]/g,'')}
function pub(u,viewer){if(!u)return null;return {id:u.id,email:u.id===viewer?u.email:undefined,username:u.username,displayName:u.displayName,bio:u.bio||'',avatarUrl:u.avatarUrl||null,isPrivate:!!u.isPrivate}}
function token(uid){return jwt.sign({uid},SECRET,{expiresIn:'30d'})}
function auth(req,res,next){try{const t=req.cookies.birarada_session||'';const p=jwt.verify(t,SECRET);const u=db.users.find(x=>x.id===p.uid);if(!u)throw 0;req.user=u;next()}catch(e){res.status(401).json({error:'Oturum gerekli.'})}}
const cookie={httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:30*864e5};
app.use(express.json({limit:'2mb'}));
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());
app.use(express.static(__dirname));
const limiter=rateLimit({windowMs:15*60*1000,limit:60,standardHeaders:true,legacyHeaders:false});
app.get('/api/health',(req,res)=>res.json({ok:true,service:'birarada-beta',auth:'own-backend',storage:'render-local-beta'}));
app.post('/api/auth/register',limiter,async(req,res)=>{const email=clean(req.body.email,120).toLowerCase(),username=uname(req.body.username),displayName=clean(req.body.displayName||req.body.name,60),password=String(req.body.password||'');if(!email.includes('@')||username.length<3||displayName.length<2||password.length<6)return res.status(400).json({error:'Bilgileri kontrol et.'});if(db.users.some(u=>u.email===email||u.username===username))return res.status(409).json({error:'E-posta veya kullanıcı adı kullanımda.'});const u={id:id(db.users),email,username,displayName,passwordHash:await bcrypt.hash(password,10),bio:'',isPrivate:true,createdAt:now()};db.users.push(u);save();res.cookie('birarada_session',token(u.id),cookie);res.json({user:pub(u,u.id)})});
app.post('/api/auth/login',limiter,async(req,res)=>{const login=clean(req.body.login||req.body.email,120).toLowerCase(),password=String(req.body.password||'');const u=db.users.find(x=>x.email===login||x.username===login);if(!u||!(await bcrypt.compare(password,u.passwordHash)))return res.status(401).json({error:'E-posta/kullanıcı adı veya şifre yanlış.'});res.cookie('birarada_session',token(u.id),cookie);res.json({user:pub(u,u.id)})});
app.post('/api/auth/logout',(req,res)=>{res.clearCookie('birarada_session',{path:'/'});res.json({ok:true})});
app.get('/api/auth/me',auth,(req,res)=>res.json({user:pub(req.user,req.user.id)}));
app.patch('/api/profile',auth,(req,res)=>{if(req.body.displayName!==undefined)req.user.displayName=clean(req.body.displayName,60);if(req.body.bio!==undefined)req.user.bio=clean(req.body.bio,160);if(req.body.isPrivate!==undefined)req.user.isPrivate=!!req.body.isPrivate;save();res.json({user:pub(req.user,req.user.id)})});
app.get('/api/feed',auth,(req,res)=>{const posts=[...db.posts].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(p=>({...p,user:pub(db.users.find(u=>u.id===p.userId),req.user.id),likeCount:db.likes.filter(l=>l.postId===p.id).length,liked:db.likes.some(l=>l.postId===p.id&&l.userId===req.user.id),commentCount:db.comments.filter(c=>c.postId===p.id).length}));res.json({posts})});
app.post('/api/posts',auth,(req,res)=>{const body=clean(req.body.body,1200),mediaUrl=clean(req.body.mediaUrl,500);if(!body&&!mediaUrl)return res.status(400).json({error:'Gönderi boş olamaz.'});const p={id:id(db.posts),userId:req.user.id,body,mediaUrl,createdAt:now()};db.posts.push(p);save();res.json({post:{...p,user:pub(req.user,req.user.id),likeCount:0,liked:false,commentCount:0}})});
app.post('/api/posts/:id/like',auth,(req,res)=>{const postId=Number(req.params.id);const i=db.likes.findIndex(l=>l.postId===postId&&l.userId===req.user.id);let liked;if(i>=0){db.likes.splice(i,1);liked=false}else{db.likes.push({id:id(db.likes),postId,userId:req.user.id,createdAt:now()});liked=true}save();res.json({liked,likeCount:db.likes.filter(l=>l.postId===postId).length})});
app.get('/api/posts/:id/comments',auth,(req,res)=>res.json({comments:db.comments.filter(c=>c.postId===Number(req.params.id)).map(c=>({...c,user:pub(db.users.find(u=>u.id===c.userId),req.user.id)}))}));
app.post('/api/posts/:id/comments',auth,(req,res)=>{const body=clean(req.body.body,500);if(!body)return res.status(400).json({error:'Yorum boş olamaz.'});const c={id:id(db.comments),postId:Number(req.params.id),userId:req.user.id,body,createdAt:now()};db.comments.push(c);save();res.json({comment:{...c,user:pub(req.user,req.user.id)}})});
app.get('/api/users',auth,(req,res)=>{const q=clean(req.query.q,40).toLowerCase();res.json({users:db.users.filter(u=>u.id!==req.user.id&&(!q||u.username.includes(q)||u.displayName.toLowerCase().includes(q))).slice(0,50).map(u=>pub(u,req.user.id))})});
app.get('/api/profile/:username',auth,(req,res)=>{const u=db.users.find(x=>x.username===uname(req.params.username));if(!u)return res.status(404).json({error:'Kullanıcı bulunamadı.'});const posts=db.posts.filter(p=>p.userId===u.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));res.json({user:pub(u,req.user.id),counts:{posts:posts.length,followers:db.follows.filter(f=>f.followingId===u.id).length,following:db.follows.filter(f=>f.followerId===u.id).length},posts})});
app.post('/api/follow/:uid',auth,(req,res)=>{const uid=Number(req.params.uid);if(uid===req.user.id)return res.status(400).json({error:'Kendini takip edemezsin.'});const i=db.follows.findIndex(f=>f.followerId===req.user.id&&f.followingId===uid);let following;if(i>=0){db.follows.splice(i,1);following=false}else{db.follows.push({id:id(db.follows),followerId:req.user.id,followingId:uid,createdAt:now()});following=true}save();res.json({following})});
app.get('*',(req,res)=>{if(req.path.startsWith('/api/'))return res.status(404).json({error:'Bulunamadı.'});res.sendFile(path.join(__dirname,'index.html'))});
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:'Sunucu hatası.'})});
app.listen(PORT,'0.0.0.0',()=>console.log('Birarada beta listening on',PORT));
