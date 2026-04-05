import { useState, useEffect } from "react";
import { HONOR_LINES } from "../firebase";
import { Baseball, Confetti } from "../App";

export default function WinnerModal({ winner, pot, tier, onClose, currentUserId, onMarkPaid }) {
  const [honorLine] = useState(HONOR_LINES[Math.floor(Math.random() * HONOR_LINES.length)]);
  const [paid, setPaid] = useState(false);
  const isWinner = winner?.uid === currentUserId;

  const handlePaid = () => {
    setPaid(true);
    onMarkPaid && onMarkPaid();
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(8px)" }}>
      <style>{`
        @keyframes winner-pop { 0%{transform:scale(0.5) rotate(-10deg);opacity:0} 60%{transform:scale(1.08) rotate(2deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes slide-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
      `}</style>

      <Confetti active={true} />

      <div style={{ background:"#0e0e14",border:"1px solid rgba(192,132,252,0.3)",borderRadius:24,padding:"32px 24px",maxWidth:380,width:"100%",textAlign:"center",position:"relative",overflow:"hidden" }}>
        {/* Glow */}
        <div style={{ position:"absolute",top:-40,left:"50%",transform:"translateX(-50%)",width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(192,132,252,0.25),transparent 70%)",pointerEvents:"none" }}/>

        {/* Ball */}
        <div style={{ marginBottom:16, animation:"winner-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both" }}>
          <Baseball size={72} spin="fast" />
        </div>

        {/* Title */}
        <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6,animation:"slide-up 0.4s ease 0.3s both" }}>
          {tier?.label || "Monthly"} winner
        </div>

        <div style={{ fontFamily:"'Fraunces',serif",fontSize:32,fontWeight:700,color:"#fff",lineHeight:1.1,marginBottom:8,animation:"slide-up 0.4s ease 0.4s both" }}>
          {winner?.name}
        </div>

        <div style={{ fontFamily:"'Fraunces',serif",fontSize:48,fontWeight:700,background:"linear-gradient(135deg,#c084fc,#f472b6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",marginBottom:20,animation:"slide-up 0.4s ease 0.5s both" }}>
          ${pot}
        </div>

        {/* Wish */}
        {winner?.wish && (
          <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 16px",marginBottom:20,animation:"slide-up 0.4s ease 0.6s both" }}>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6 }}>They're going to</div>
            <div style={{ fontSize:15,color:"rgba(255,255,255,0.85)",fontFamily:"'Fraunces',serif",fontStyle:"italic",lineHeight:1.5 }}>"{winner.wish}"</div>
          </div>
        )}

        {/* Venmo + honor system */}
        <div style={{ background:"rgba(168,85,247,0.08)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:12,padding:"14px 16px",marginBottom:20,animation:"slide-up 0.4s ease 0.7s both" }}>
          {winner?.venmoHandle ? (
            <>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:4 }}>Send ${tier?.amount || "2"} to</div>
              <div style={{ fontSize:18,fontWeight:700,color:"#c084fc",marginBottom:8 }}>@{winner.venmoHandle}</div>
            </>
          ) : (
            <div style={{ fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:8 }}>Winner will share their Venmo shortly.</div>
          )}
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.35)",fontStyle:"italic",lineHeight:1.5 }}>{honorLine}</div>
        </div>

        {/* Mark paid */}
        {!isWinner && (
          <button onClick={handlePaid} style={{
            width:"100%",padding:"15px",borderRadius:12,border:"none",cursor:paid?"default":"pointer",fontFamily:"inherit",fontSize:15,fontWeight:700,
            background: paid ? "rgba(52,211,153,0.15)" : "linear-gradient(135deg,#7c3aed,#ec4899)",
            color: paid ? "#34d399" : "#fff",
            border: paid ? "1px solid #34d399" : "none",
            transition:"all 0.2s",
            transform: paid ? "scale(1)" : "scale(1)",
            animation:"slide-up 0.4s ease 0.8s both",
          }}>
            {paid ? "✓ Marked as paid — good human 🤙" : `I sent $${tier?.amount || "2"} ✓`}
          </button>
        )}

        {isWinner && (
          <div style={{ fontSize:15,fontWeight:700,color:"#34d399",padding:12,animation:"slide-up 0.4s ease 0.8s both" }}>
            🎉 That's you! Check your Venmo soon.
          </div>
        )}

        <button onClick={onClose} style={{ marginTop:12,background:"transparent",border:"none",color:"rgba(255,255,255,0.25)",cursor:"pointer",fontSize:13,fontFamily:"inherit" }}>
          Close
        </button>
      </div>
    </div>
  );
}
