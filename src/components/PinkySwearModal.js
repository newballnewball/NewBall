import { useState } from "react";
import { PINKY_LINES } from "../firebase";
import { Nooball } from "../App";

export default function PinkySwearModal({ onClose, tierLabel, amount }) {
  const [line] = useState(PINKY_LINES[Math.floor(Math.random()*PINKY_LINES.length)]);
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(8px)" }}>
      <div style={{ background:"#0d1018",border:"1px solid rgba(251,191,36,0.22)",borderRadius:24,padding:"40px 28px",maxWidth:340,width:"100%",textAlign:"center",animation:"pinky-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)",fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ fontSize:68,marginBottom:14,animation:"bounce 1s ease infinite" }}>&#129305;</div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:"#fff",letterSpacing:"0.04em",marginBottom:8,animation:"slide-up 0.3s ease 0.15s both" }}>You're locked in.</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"rgba(255,255,255,0.4)",marginBottom:8,animation:"slide-up 0.3s ease 0.2s both" }}>{tierLabel} · ${amount < 1 ? amount.toFixed(2) : amount}</div>
        <div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:14,color:"rgba(255,255,255,0.6)",lineHeight:1.65,marginBottom:24,animation:"slide-up 0.3s ease 0.25s both" }}>{line}</div>
        <div style={{ marginBottom:20 }}><Nooball size={36} spin="medium"/></div>
        <button onClick={onClose} style={{ width:"100%",padding:14,background:"linear-gradient(135deg,#f59e0b,#fbbf24)",border:"none",borderRadius:12,color:"#451a03",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",animation:"slide-up 0.3s ease 0.3s both" }}>
          Let's go
        </button>
      </div>
    </div>
  );
}
