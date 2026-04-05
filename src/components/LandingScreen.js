import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db, TIERS } from "../firebase";
import { Baseball, useCountdown, pad } from "../App";

function TierCountdown({ tier, memberCount }) {
  const cd = useCountdown(tier.next);
  const pot = (memberCount * tier.amount).toFixed(2);
  const odds = memberCount > 0 ? ((1/(memberCount+1))*100).toFixed(1) : "100.0";

  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${tier.color}33`, borderRadius:16, padding:"18px 16px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${tier.color},transparent)` }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2 }}>{tier.label}</div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:700, color:tier.color, lineHeight:1 }}>
            ${parseFloat(pot) % 1 === 0 ? parseInt(pot) : pot}
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>in the cup right now</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:2 }}>if you join</div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:700, color:"#fff" }}>{odds}%</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>odds of winning</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:6 }}>
        {[["d","days"],["h","hrs"],["m","min"],["s","sec"]].map(([k,l]) => (
          <div key={k} style={{ flex:1, textAlign:"center" }}>
            <div style={{ background:"rgba(0,0,0,0.3)", borderRadius:8, padding:"7px 2px", fontFamily:"monospace", fontSize:20, fontWeight:700, color:"#fff", lineHeight:1 }}>{pad(cd[k])}</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:3, textTransform:"uppercase", letterSpacing:"0.1em" }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingScreen({ onJoin }) {
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    return onSnapshot(collection(db,"users"), snap => setMemberCount(snap.size));
  }, []);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#0a0a0f", minHeight:"100vh", maxWidth:430, margin:"0 auto", color:"#fff", display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,300&display=swap');
        * { box-sizing:border-box; }
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 24px rgba(192,132,252,0.4)} 50%{box-shadow:0 0 48px rgba(192,132,252,0.8)} }
        .join-btn:hover { transform:translateY(-2px); }
        .join-btn:active { transform:scale(0.97); }
      `}</style>

      {/* Hero */}
      <div style={{ background:"linear-gradient(160deg,#1a0533,#180a2e 50%,#0a0a0f)", padding:"48px 24px 32px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-60,left:"50%",transform:"translateX(-50%)",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.2),transparent 70%)",pointerEvents:"none" }}/>
        <div style={{ marginBottom:20, animation:"fade-up 0.4s ease" }}>
          <Baseball size={72} spin="medium" />
        </div>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:48, fontWeight:700, color:"#fff", letterSpacing:"-2px", lineHeight:1, marginBottom:12, animation:"fade-up 0.4s ease 0.1s both" }}>
          NooBall
        </div>
        <div style={{ fontSize:16, color:"rgba(255,255,255,0.5)", lineHeight:1.5, maxWidth:280, margin:"0 auto 8px", animation:"fade-up 0.4s ease 0.2s both" }}>
          $1 in the cup.
        </div>
        <div style={{ fontSize:16, color:"rgba(255,255,255,0.5)", lineHeight:1.5, maxWidth:280, margin:"0 auto 32px", animation:"fade-up 0.4s ease 0.25s both" }}>
          One person catches it.
        </div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.25)", marginBottom:24, animation:"fade-up 0.4s ease 0.3s both" }}>
          {memberCount} {memberCount === 1 ? "person" : "people"} already in the pool
        </div>
        <button className="join-btn" onClick={onJoin} style={{ background:"linear-gradient(135deg,#7c3aed,#ec4899)", border:"none", borderRadius:14, color:"#fff", fontSize:18, fontWeight:800, padding:"18px 48px", cursor:"pointer", fontFamily:"inherit", animation:"pulse-glow 2.5s ease infinite, fade-up 0.4s ease 0.35s both", transition:"transform 0.15s" }}>
          I'm in ⚾
        </button>
      </div>

      {/* Live tickers */}
      <div style={{ padding:"24px 16px 40px", display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:4 }}>Live drawings</div>
        {TIERS.map(tier => <TierCountdown key={tier.id} tier={tier} memberCount={memberCount} />)}
      </div>
    </div>
  );
}
