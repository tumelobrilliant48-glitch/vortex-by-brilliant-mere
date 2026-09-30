"use client";
import { useState } from "react";

export default function VORTEX() {
  const [entered, setEntered] = useState(false);
  
  if (!entered) {
    return (
      <div style={{background:"black",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"white",fontFamily:"system-ui",userSelect:"none"}}>
        <h1 style={{fontSize:"42px",fontWeight:"900",letterSpacing:"-1px"}}>VORTEX</h1>
        <p style={{opacity:0.6,marginTop:"8px"}}>Luxury social + AI + Wallet</p>
        <p style={{opacity:0.4,fontSize:"12px",marginTop:"4px"}}>Built in BW for the world</p>
        
        <button 
          onClick={()=>setEntered(true)}
          style={{marginTop:"28px",padding:"14px 28px",borderRadius:"99px",border:"1px solid #D4AF37",background:"transparent",color:"white",fontWeight:"700",cursor:"pointer",touchAction:"manipulation"}}
        >
          Enter VORTEX → 800 Features
        </button>
        <p style={{opacity:0.3,fontSize:"10px",marginTop:"24px"}}>v1.0.0-800 • LIVE</p>
      </div>
    )
  }

  return (
    <div style={{background:"#0a0a0a",minHeight:"100vh",color:"white",padding:"16px",fontFamily:"system-ui",userSelect:"none"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0"}}>
        <h2 style={{fontWeight:"900"}}>VORTEX</h2>
        <div style={{width:"32px",height:"32px",borderRadius:"99px",background:"linear-gradient(135deg,#D4AF37,#8a6d1b)"}}></div>
      </div>

      <div style={{background:"linear-gradient(135deg,#1a1a1a,#2a2a2a)",border:"1px solid #333",borderRadius:"20px",padding:"16px",marginTop:"12px"}}>
        <div style={{opacity:0.6,fontSize:"12px"}}>Wallet Balance</div>
        <div style={{fontSize:"32px",fontWeight:"800"}}>$12,450 <span style={{color:"#22c55e",fontSize:"14px"}}>↑ +2.4%</span></div>
      </div>

      <div style={{marginTop:"20px",display:"grid",gap:"12px"}}>
        {[
          {user:"aistudio.luxe", title:"AI City at Night - Gaborone Future", likes:"1.2k"},
          {user:"creator.gold", title:"Golden Serpent #082 - Reels", likes:"892"},
          {user:"bw.luxe", title:"Market Drop - Limited", likes:"3.4k"},
        ].map(post=>(
          <div key={post.user} style={{background:"#151515",border:"1px solid #222",borderRadius:"16px",padding:"14px"}}>
            <div style={{fontWeight:"700",fontSize:"14px"}}>{post.user} • 2h</div>
            <div style={{height:"140px",background:"linear-gradient(135deg,#222,#111)",borderRadius:"12px",marginTop:"10px",display:"flex",alignItems:"center",justifyContent:"center",opacity:0.8}}>{post.title}</div>
            <div style={{marginTop:"10px",opacity:0.6,fontSize:"13px"}}>❤️ {post.likes} • 💬 48 • Share</div>
          </div>
        ))}
      </div>

      <div style={{position:"fixed",bottom:"0",left:"0",right:"0",background:"#000",borderTop:"1px solid #222",display:"flex",justifyContent:"space-around",padding:"12px 0"}}>
        {["HOME","REELS","FIND","MARKET","CHAT","VAULT","YOU"].map((t,i)=>(
          <div key={t} style={{fontSize:"10px",opacity:i===0?1:0.4,fontWeight:i===0?800:400}}>{t}</div>
        ))}
      </div>
    </div>
  )
            }
