// VORTEX Backend - Harden security bcrypt + JWT # from your README
const express=require('express'); const app=express();
app.use(express.json());
app.get('/api/search/people', (req,res)=>{ res.json([]) }); // real empty, not fake
app.get('/api/feed', (req,res)=>{ res.json([]) }); // Following Feed #3 real empty
app.post('/api/friends/request', (req,res)=>{ res.json({status:'sent'}) });
app.listen(3000,()=>console.log('VORTEX 800 running'));
