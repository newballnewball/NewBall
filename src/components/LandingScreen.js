import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, getTiers, SAMPLE_WISHES } from "../firebase";
import { Nooball, useCountdown, pad } from "../App";

function TierRow({ tier }) {
  const cd = useCountdown(tier.next);

  return (
    <div style={{ padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:"rgba(255,255,255,0.4)", letterSpacing:"0.14em" }}>{tier.label.toUpperCase()}</span>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            {[["d","d"],["h","h"],["m","m"],["s","s"]].map(([k,l])=>(
              <div key={k} style={{ display:"flex", alignItems:"baseline", gap:1 }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:15, fontWeight:500, color:"#fff" }}>{pad(cd[k])}</span>
                <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)", fontFamily:"'DM Sans',sans-serif" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:"'DM Sans',sans-serif", marginBottom:2 }}>to enter</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:tier.color, letterSpacing:"0.04em" }}>
            {tier.amount < 1 ? `¢${Math.round(tier.amount*100)}` : `$${tier.amount}`}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingScreen({ onJoin }) {
  const [memberCount, setMemberCount] = useState(0);
  const tiers = getTiers();
  const [shownWishes] = useState(()=>[...SAMPLE_WISHES].sort(()=>Math.random()-.5).slice(0,3));

  useEffect(()=>{ return onSnapshot(collection(db,"users"),snap=>setMemberCount(snap.size)); },[]);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#0a0a0f", minHeight:"100vh", maxWidth:430, margin:"0 auto", color:"#fff" }}>

      {/* Hero */}
      <div style={{ background:"linear-gradient(170deg,#110828 0%,#0a0a0f 100%)", padding:"52px 24px 36px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 10%,rgba(124,58,237,0.14),transparent 60%)",pointerEvents:"none" }}/>

        <div style={{ marginBottom:20, animation:"fade-up 0.4s ease" }}><Nooball size={88} spin="medium"/></div>

        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:60, color:"#fff", letterSpacing:"0.06em", lineHeight:.95, marginBottom:14, animation:"fade-up 0.4s ease 0.1s both" }}>
          NOO<span style={{ color:"#a78bfa" }}>BALL</span>
        </div>

        <div style={{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:17, color:"rgba(255,255,255,0.5)", lineHeight:1.6, maxWidth:260, margin:"0 auto 28px", animation:"fade-up 0.4s ease 0.15s both" }}>
          $1 in the cup.<br/>One person catches it.
        </div>

        {/* Real member count */}
        {memberCount > 0 && (
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.18)", borderRadius:24, padding:"8px 18px", marginBottom:28, animation:"fade-up 0.4s ease 0.2s both" }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:"#a78bfa",boxShadow:"0 0 6px #a78bfa",animation:"btn-pulse 2s ease infinite",display:"inline-block" }}/>
            <span style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>
              <strong style={{ color:"#fff", fontFamily:"'Bebas Neue',sans-serif", fontSize:15, letterSpacing:"0.04em" }}>{memberCount.toLocaleString()}</strong> {memberCount === 1 ? "person" : "people"} already in
            </span>
          </div>
        )}

        <div style={{ animation:"fade-up 0.4s ease 0.25s both" }}>
          <button className="join-btn" onClick={onJoin} style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none", borderRadius:14, color:"#fff", fontSize:20, padding:"17px 56px", cursor:"pointer", fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"0.1em", animation:"btn-pulse 2.5s ease infinite" }}>
            I'M IN
          </button>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.2),transparent)" }}/>

      {/* Tickers */}
      <div style={{ padding:"22px 20px 8px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
          <span style={{ width:5,height:5,borderRadius:"50%",background:"#a78bfa",boxShadow:"0 0 4px #a78bfa",display:"inline-block" }}/>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.15em", fontFamily:"'DM Sans',sans-serif" }}>Next drawings</span>
        </div>
        {tiers.map(t=><TierRow key={t.id} tier={t}/>)}
      </div>

      {/* Divider */}
      <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.1),transparent)", margin:"16px 0 0" }}/>

      {/* Wishes */}
      <div style={{ padding:"22px 20px 52px" }}>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.15em", marginBottom:14, fontFamily:"'DM Sans',sans-serif" }}>What people are wishing for</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:22 }}>
          {shownWishes.map((w,i)=>(
            <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start" }}>
              <div style={{ width:30,height:30,borderRadius:"50%",background:`hsl(${(i*80+260)%360},50%,55%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0,fontFamily:"'DM Sans',sans-serif" }}>
                {w.name.slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:3, fontFamily:"'DM Sans',sans-serif" }}>{w.name}</div>
                <div style={{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:13, color:"rgba(255,255,255,0.7)", lineHeight:1.5 }}>"{w.wish}"</div>
              </div>
            </div>
          ))}
        </div>
        <button className="join-btn" onClick={onJoin} style={{ width:"100%", padding:14, background:"transparent", border:"1px solid rgba(167,139,250,0.22)", borderRadius:12, color:"rgba(167,139,250,0.65)", fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>
          Add your wish
        </button>
      </div>
    </div>
  );
}
