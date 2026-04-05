import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, getTiers, SAMPLE_WISHES } from "../firebase";
import { Nooball, useCountdown, pad } from "../App";

// Realistic base — feels like a real product without being outlandish
const BASE = 12847;
const TIER_BASE_PAID = { daily:9231, weekly:6802, monthly:4419, yearly:1203 };

// Slowly tick up the pot value on the landing page
function useTicker(base, tickInterval = 4000, increment = 0.25) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const id = setInterval(() => setVal(v => parseFloat((v + increment).toFixed(2))), tickInterval);
    return () => clearInterval(id);
  }, [base, tickInterval, increment]);
  return val;
}

function TierRow({ tier, memberCount }) {
  const cd      = useCountdown(tier.next);
  const basePot = ((TIER_BASE_PAID[tier.id] + memberCount) * tier.amount);
  const pot     = useTicker(basePot, 3500 + Math.random()*2000, tier.amount);
  const potStr  = pot < 1000 ? `$${pot.toFixed(2)}` : `$${(pot/1000).toFixed(1)}k`;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:5 }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:"rgba(255,255,255,0.4)", letterSpacing:"0.15em" }}>{tier.label.toUpperCase()}</span>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:tier.color, letterSpacing:"0.05em", transition:"color 0.3s" }}>{potStr}</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {[["d","d"],["h","h"],["m","m"],["s","s"]].map(([k,l])=>(
            <div key={k} style={{ display:"flex", alignItems:"baseline", gap:2 }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:16, fontWeight:500, color:"#fff" }}>{pad(cd[k])}</span>
              <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>entry</div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:tier.color, letterSpacing:"0.05em" }}>
          {tier.amount < 1 ? `¢${Math.round(tier.amount*100)}` : `$${tier.amount}`}
        </div>
      </div>
    </div>
  );
}

export default function LandingScreen({ onJoin }) {
  const [memberCount, setMemberCount] = useState(0);
  const totalDisplay = useTicker(BASE + memberCount, 8000, 1);
  const tiers = getTiers();

  const [shownWishes] = useState(() =>
    [...SAMPLE_WISHES].sort(()=>Math.random()-.5).slice(0,3)
  );

  useEffect(() => {
    return onSnapshot(collection(db,"users"), snap => setMemberCount(snap.size));
  },[]);

  return (
    <div style={{ fontFamily:"'Lora',serif", background:"#0a0a0f", minHeight:"100vh", maxWidth:430, margin:"0 auto", color:"#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fade-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse-btn{0%,100%{box-shadow:0 0 0 0 rgba(167,139,250,0.5)}70%{box-shadow:0 0 0 16px rgba(167,139,250,0)}}
        @keyframes float-name{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        .join-btn{transition:transform 0.15s;}
        .join-btn:hover{transform:translateY(-2px) scale(1.02);}
        .join-btn:active{transform:scale(0.97);}
      `}</style>

      {/* Hero */}
      <div style={{ background:"linear-gradient(160deg,#12063a 0%,#0d0520 45%,#0a0a0f 100%)", padding:"52px 24px 40px", position:"relative", overflow:"hidden", textAlign:"center" }}>
        <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(124,58,237,0.15),transparent 65%)",pointerEvents:"none" }}/>

        <div style={{ marginBottom:22, animation:"fade-up 0.4s ease" }}>
          <Nooball size={84} spin="medium" />
        </div>

        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:62, color:"#fff", letterSpacing:"0.06em", lineHeight:.95, marginBottom:14, animation:"fade-up 0.4s ease 0.1s both" }}>
          NOO<span style={{ color:"#a78bfa" }}>BALL</span>
        </div>

        <div style={{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:17, color:"rgba(255,255,255,0.55)", lineHeight:1.55, maxWidth:260, margin:"0 auto 28px", animation:"fade-up 0.4s ease 0.2s both" }}>
          $1 in the cup.<br/>One person catches it.
        </div>

        {/* Live counter */}
        <div style={{ display:"inline-flex", alignItems:"center", gap:10, background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:24, padding:"8px 18px", marginBottom:28, animation:"fade-up 0.4s ease 0.25s both" }}>
          <span style={{ width:7,height:7,borderRadius:"50%",background:"#a78bfa",display:"inline-block",boxShadow:"0 0 8px #a78bfa",animation:"pulse-btn 2s ease infinite" }}/>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"rgba(255,255,255,0.7)" }}>
            <strong style={{ color:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:"0.05em" }}>{Math.floor(totalDisplay).toLocaleString()}</strong> people already in
          </span>
        </div>

        <div style={{ animation:"fade-up 0.4s ease 0.3s both" }}>
          <button className="join-btn" onClick={onJoin} style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none", borderRadius:14, color:"#fff", fontSize:20, padding:"17px 52px", cursor:"pointer", fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"0.12em", animation:"pulse-btn 2.5s ease infinite" }}>
            I'M IN
          </button>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height:1,background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.2),transparent)" }}/>

      {/* Live tickers */}
      <div style={{ padding:"22px 20px 4px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
          <span style={{ width:5,height:5,borderRadius:"50%",background:"#a78bfa",display:"inline-block",boxShadow:"0 0 5px #a78bfa" }}/>
          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.15em" }}>Live drawings</span>
        </div>
        {tiers.map(t=><TierRow key={t.id} tier={t} memberCount={memberCount}/>)}
      </div>

      {/* Divider */}
      <div style={{ height:1,background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.12),transparent)",margin:"20px 0 0" }}/>

      {/* Wishes */}
      <div style={{ padding:"22px 20px 52px" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:14 }}>
          What people are wishing for
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:24 }}>
          {shownWishes.map((w,i)=>(
            <div key={i} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start" }}>
              <div style={{ width:30,height:30,borderRadius:"50%",background:`hsl(${(i*80+260)%360},55%,55%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0,fontFamily:"'DM Sans',sans-serif" }}>
                {w.name.slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.5)",marginBottom:3 }}>{w.name}</div>
                <div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:1.5 }}>"{w.wish}"</div>
              </div>
            </div>
          ))}
        </div>
        <button className="join-btn" onClick={onJoin} style={{ width:"100%",padding:14,background:"transparent",border:"1px solid rgba(167,139,250,0.25)",borderRadius:12,color:"rgba(167,139,250,0.7)",fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>
          Add your wish →
        </button>
      </div>
    </div>
  );
}
