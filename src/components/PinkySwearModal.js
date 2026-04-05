import { useState } from "react";
import { PINKY_LINES } from "../firebase";
import { Baseball } from "../App";

export default function PinkySwearModal({ onClose, tierLabel, amount }) {
  const [line] = useState(PINKY_LINES[Math.floor(Math.random() * PINKY_LINES.length)]);

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(8px)" }}>
      <style>{`
        @keyframes pinky-pop { 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes emoji-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ background:"#0e0e14",border:"1px solid rgba(192,132,252,0.25)",borderRadius:24,padding:"40px 28px",maxWidth:340,width:"100%",textAlign:"center",animation:"pinky-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ fontSize:72,marginBottom:16,display:"block",animation:"emoji-bounce 1s ease infinite" }}>🤙</div>

        <div style={{ fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:700,color:"#fff",lineHeight:1.2,marginBottom:12,animation:"slide-up 0.3s ease 0.15s both" }}>
          You're locked in.
        </div>

        <div style={{ fontSize:14,color:"rgba(255,255,255,0.5)",lineHeight:1.6,marginBottom:8,animation:"slide-up 0.3s ease 0.25s both" }}>
          {tierLabel} · ${amount}
        </div>

        <div style={{ fontSize:14,color:"rgba(255,255,255,0.6)",lineHeight:1.65,marginBottom:28,animation:"slide-up 0.3s ease 0.3s both",fontStyle:"italic" }}>
          {line}
        </div>

        <div style={{ marginBottom:20,animation:"slide-up 0.3s ease 0.35s both" }}>
          <Baseball size={36} spin="medium" />
        </div>

        <button onClick={onClose} style={{ width:"100%",padding:"14px",background:"linear-gradient(135deg,#7c3aed,#ec4899)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",animation:"slide-up 0.3s ease 0.4s both" }}>
          Let's go 🎉
        </button>
      </div>
    </div>
  );
}
