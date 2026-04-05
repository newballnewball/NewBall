import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, getTiers, SAMPLE_WISHES } from "../firebase";
import { Baseball, useCountdown, pad } from "../App";

// Simulated global player count — gives impression of scale
const BASE_PLAYERS = 84371;

function TierRow({ tier, memberCount }) {
  const cd  = useCountdown(tier.next);
  const pot = ((memberCount + BASE_PLAYERS) * tier.amount).toFixed(2);
  const potDisplay = parseFloat(pot) % 1 === 0 ? `$${parseInt(pot)}` : `$${pot}`;

  return (
    <div style={{ display:"flex", alignItems:"center", padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4 }}>
          <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.12em" }}>{tier.label}</span>
          <span style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:700, color:tier.color }}>{potDisplay}</span>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>in the cup</span>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[["d","d"],["h","h"],["m","m"],["s","s"]].map(([k,l])=>(
            <div key={k} style={{ textAlign:"center" }}>
              <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:18, fontWeight:600, color:"#fff", letterSpacing:"0.05em" }}>{pad(cd[k])}</span>
              <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginLeft:2, textTransform:"uppercase" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>entry</div>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, fontWeight:600, color:tier.color }}>${tier.amount === 0.25 ? "0.25" : tier.amount}</div>
      </div>
    </div>
  );
}

function WishPreview({ name, wish, color }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"12px 14px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <div style={{ width:28, height:28, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#0d0a07", flexShrink:0 }}>
          {name.slice(0,2).toUpperCase()}
        </div>
        <span style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.6)" }}>{name}</span>
      </div>
      <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", fontFamily:"'Fraunces',serif", fontStyle:"italic", lineHeight:1.5 }}>"{wish}"</div>
    </div>
  );
}

const wishColors = ["#e8d5a3","#c9b472","#e05c2a","#e8a87c","#d4885a","#c9b99a"];

export default function LandingScreen({ onJoin }) {
  const [memberCount, setMemberCount] = useState(0);
  const tiers = getTiers();
  const totalPlayers = (memberCount + BASE_PLAYERS).toLocaleString();

  // Pick 2 random wishes to show
  const [shownWishes] = useState(() => {
    const shuffled = [...SAMPLE_WISHES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0,2);
  });

  useEffect(() => {
    return onSnapshot(collection(db,"users"), snap => setMemberCount(snap.size));
  },[]);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#0d0a07", minHeight:"100vh", maxWidth:430, margin:"0 auto", color:"#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,300&family=Oswald:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        @keyframes fade-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes chalk-glow{0%,100%{text-shadow:0 0 20px rgba(232,213,163,0.3)}50%{text-shadow:0 0 40px rgba(232,213,163,0.6)}}
        @keyframes btn-pulse{0%,100%{box-shadow:0 0 0 0 rgba(224,92,42,0.4)}70%{box-shadow:0 0 0 14px rgba(224,92,42,0)}}
        .join-btn{transition:transform 0.15s,box-shadow 0.15s;}
        .join-btn:hover{transform:translateY(-2px);}
        .join-btn:active{transform:scale(0.96);}
      `}</style>

      {/* Hero */}
      <div style={{ position:"relative", overflow:"hidden", padding:"52px 24px 36px", background:"linear-gradient(180deg,#1a1008 0%,#0d0a07 100%)" }}>

        {/* Chalk circle texture behind ball */}
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-60%)", width:260, height:260, borderRadius:"50%", border:"1px dashed rgba(232,213,163,0.08)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-60%)", width:180, height:180, borderRadius:"50%", border:"1px dashed rgba(232,213,163,0.05)", pointerEvents:"none" }}/>

        <div style={{ textAlign:"center", position:"relative" }}>
          <div style={{ marginBottom:20, animation:"fade-up 0.4s ease" }}>
            <Baseball size={80} spin="medium" />
          </div>

          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:52, fontWeight:700, color:"#f5f0e8", letterSpacing:"0.05em", lineHeight:1, marginBottom:6, animation:"chalk-glow 3s ease infinite, fade-up 0.4s ease 0.1s both", textTransform:"uppercase" }}>
            NooBall
          </div>

          <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontStyle:"italic", fontWeight:300, color:"rgba(232,213,163,0.7)", marginBottom:28, animation:"fade-up 0.4s ease 0.2s both", lineHeight:1.4 }}>
            $1 in the cup.<br/>One person catches it.
          </div>

          {/* Social proof */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(232,213,163,0.07)", border:"1px solid rgba(232,213,163,0.15)", borderRadius:20, padding:"8px 16px", marginBottom:28, animation:"fade-up 0.4s ease 0.25s both" }}>
            <div style={{ display:"flex", gap:-4 }}>
              {["#e8d5a3","#e05c2a","#c9b472","#e8a87c"].map((c,i) => (
                <div key={i} style={{ width:18, height:18, borderRadius:"50%", background:c, border:"2px solid #0d0a07", marginLeft:i>0?-6:0 }}/>
              ))}
            </div>
            <span style={{ fontSize:13, color:"rgba(232,213,163,0.8)", fontWeight:500 }}>
              <strong style={{ color:"#e8d5a3" }}>{totalPlayers}</strong> already in the pool
            </span>
          </div>

          <div style={{ animation:"fade-up 0.4s ease 0.3s both" }}>
            <button className="join-btn" onClick={onJoin} style={{ background:"#e05c2a", border:"none", borderRadius:14, color:"#fff", fontSize:18, fontWeight:700, padding:"18px 52px", cursor:"pointer", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.08em", textTransform:"uppercase", animation:"btn-pulse 2s ease infinite" }}>
              I'm In
            </button>
          </div>
        </div>
      </div>

      {/* Chalk divider */}
      <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(232,213,163,0.2),transparent)", margin:"0 24px" }}/>

      {/* Live drawings */}
      <div style={{ padding:"24px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#e05c2a", display:"inline-block", boxShadow:"0 0 6px #e05c2a" }}/>
          <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.15em" }}>Live drawings</span>
        </div>
        {tiers.map(tier => <TierRow key={tier.id} tier={tier} memberCount={memberCount} />)}
      </div>

      {/* Chalk divider */}
      <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(232,213,163,0.15),transparent)", margin:"0 24px" }}/>

      {/* What people are wishing for */}
      <div style={{ padding:"24px 20px 48px" }}>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.15em", marginBottom:12 }}>
          What people are wishing for
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
          {shownWishes.map((w,i) => (
            <WishPreview key={i} name={w.name} wish={w.wish} color={wishColors[i%wishColors.length]} />
          ))}
        </div>
        <button className="join-btn" onClick={onJoin} style={{ width:"100%", padding:"16px", background:"transparent", border:"1px solid rgba(232,213,163,0.25)", borderRadius:12, color:"rgba(232,213,163,0.7)", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          Add your wish →
        </button>
      </div>
    </div>
  );
}
