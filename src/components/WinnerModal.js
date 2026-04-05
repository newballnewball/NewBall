import { useState } from "react";
import { HONOR_LINES } from "../firebase";
import { Nooball, Confetti } from "../App";

export default function WinnerModal({ winner, pot, tier, onClose, currentUserId }) {
  const [honorLine] = useState(HONOR_LINES[Math.floor(Math.random()*HONOR_LINES.length)]);
  const [paid, setPaid] = useState(false);
  const isWinner = winner?.uid === currentUserId;

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(10px)" }}>
      <Confetti active={true}/>

      <div style={{ background:"#0d0d14",border:"1px solid rgba(167,139,250,0.3)",borderRadius:24,padding:"32px 24px",maxWidth:380,width:"100%",textAlign:"center",position:"relative",overflow:"hidden",animation:"winner-glow 2s ease infinite",fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ position:"absolute",top:-50,left:"50%",transform:"translateX(-50%)",width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(167,139,250,0.2),transparent 70%)",pointerEvents:"none" }}/>

        <div style={{ marginBottom:16,animation:"winner-pop 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <Nooball size={76} spin="fast"/>
        </div>

        <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:13,color:"rgba(255,255,255,0.4)",letterSpacing:"0.18em",marginBottom:6,animation:"slide-up 0.4s ease 0.3s both" }}>
          {tier?.label?.toUpperCase() || "MONTHLY"} WINNER
        </div>

        {isWinner ? (
          <>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:42,color:"#a78bfa",letterSpacing:"0.04em",lineHeight:1,marginBottom:6,animation:"slide-up 0.4s ease 0.4s both" }}>
              THAT'S YOU!
            </div>
            <div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:16,color:"rgba(255,255,255,0.6)",marginBottom:16,lineHeight:1.5,animation:"slide-up 0.4s ease 0.45s both" }}>
              You caught the NooBall.<br/>Check your Venmo soon.
            </div>
          </>
        ) : (
          <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:"#fff",letterSpacing:"0.03em",lineHeight:1.1,marginBottom:6,animation:"slide-up 0.4s ease 0.4s both" }}>
            {winner?.name}
          </div>
        )}

        <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:54,background:"linear-gradient(135deg,#a78bfa,#f472b6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",letterSpacing:"0.04em",marginBottom:20,animation:"slide-up 0.4s ease 0.5s both" }}>
          ${pot}
        </div>

        {winner?.wish && (
          <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 16px",marginBottom:18,animation:"slide-up 0.4s ease 0.55s both" }}>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5,fontFamily:"'DM Sans',sans-serif" }}>They're going to</div>
            <div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:15,color:"rgba(255,255,255,0.85)",lineHeight:1.5 }}>"{winner.wish}"</div>
          </div>
        )}

        <div style={{ background:"rgba(167,139,250,0.07)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:12,padding:"14px 16px",marginBottom:18,animation:"slide-up 0.4s ease 0.6s both" }}>
          {winner?.venmoHandle
            ?<><div style={{ fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:4 }}>Send ${tier?.amount || "2"} to</div>
               <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#a78bfa",letterSpacing:"0.05em",marginBottom:8 }}>@{winner.venmoHandle}</div></>
            :<div style={{ fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:10 }}>Winner will share their Venmo shortly.</div>}
          <div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:12,color:"rgba(255,255,255,0.35)",lineHeight:1.5 }}>{honorLine}</div>
        </div>

        {!isWinner && (
          <button onClick={()=>setPaid(true)} disabled={paid} style={{ width:"100%",padding:14,borderRadius:12,cursor:paid?"default":"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,background:paid?"rgba(52,211,153,0.15)":"linear-gradient(135deg,#7c3aed,#a855f7)",color:paid?"#34d399":"#fff",border:paid?"1px solid #34d399":"none",transition:"all 0.2s",animation:"slide-up 0.4s ease 0.7s both" }}>
            {paid ? "Sent — good human" : `I sent $${tier?.amount}`}
          </button>
        )}

        <button onClick={onClose} style={{ marginTop:12,background:"transparent",border:"none",color:"rgba(255,255,255,0.22)",cursor:"pointer",fontSize:13,fontFamily:"inherit" }}>
          Close
        </button>
      </div>
    </div>
  );
}
