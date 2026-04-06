import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, getTier, SAMPLE_WISHES } from "../firebase";
import { Nooball, useCountdown, pad } from "../App";

export default function LandingScreen({ onJoin }) {
  const [memberCount, setMemberCount] = useState(0);
  const tier = getTier();
  const cd   = useCountdown(tier.next);
  const [shownWishes] = useState(()=>[...SAMPLE_WISHES].sort(()=>Math.random()-.5).slice(0,3));

  useEffect(()=>{ return onSnapshot(collection(db,"users"),snap=>setMemberCount(snap.size)); },[]);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#0b0f1a", minHeight:"100vh", maxWidth:430, margin:"0 auto", color:"#fff", display:"flex", flexDirection:"column" }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div style={{ background:"linear-gradient(170deg,#1a1207 0%,#0b0f1a 100%)", padding:"60px 24px 40px", textAlign:"center", position:"relative", overflow:"hidden", flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center" }}>
        <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 10%,rgba(251,191,36,0.12),transparent 60%)",pointerEvents:"none" }}/>

        <div style={{ marginBottom:20, animation:"fade-up 0.4s ease" }}><Nooball size={80} spin="medium"/></div>

        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:56, color:"#fff", letterSpacing:"0.06em", lineHeight:.95, marginBottom:16, animation:"fade-up 0.4s ease 0.1s both" }}>
          NOO<span style={{ color:"#fbbf24" }}>BALL</span>
        </div>

        <div style={{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:18, color:"rgba(255,255,255,0.5)", lineHeight:1.6, maxWidth:280, marginBottom:28, animation:"fade-up 0.4s ease 0.15s both" }}>
          Everyone chips in $1.<br/>One random person wins it all.
        </div>

        {/* Countdown */}
        <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:8, animation:"fade-up 0.4s ease 0.2s both" }}>
          {[["d","days"],["h","hrs"],["m","min"],["s","sec"]].map(([k,l])=>(
            <div key={k} style={{ textAlign:"center" }}>
              <div style={{ background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.15)", borderRadius:8, padding:"6px 10px", fontFamily:"'DM Mono',monospace", fontSize:18, fontWeight:500, color:"#fde68a", lineHeight:1, minWidth:38 }}>{pad(cd[k])}</div>
              <div style={{ fontSize:8, color:"rgba(255,255,255,0.25)", marginTop:3, textTransform:"uppercase", letterSpacing:"0.08em" }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginBottom:28, animation:"fade-up 0.4s ease 0.22s both" }}>until next drawing</div>

        {/* Member count */}
        {memberCount > 0 && (
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.18)", borderRadius:24, padding:"7px 16px", marginBottom:28, animation:"fade-up 0.4s ease 0.25s both" }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:"#fbbf24",boxShadow:"0 0 6px #fbbf24",animation:"btn-pulse 2s ease infinite",display:"inline-block" }}/>
            <span style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>
              <strong style={{ color:"#fde68a", fontFamily:"'Bebas Neue',sans-serif", fontSize:15, letterSpacing:"0.04em" }}>{memberCount}</strong> {memberCount === 1 ? "person" : "people"} already in
            </span>
          </div>
        )}

        {/* THE BUTTON */}
        <div style={{ animation:"fade-up 0.4s ease 0.3s both" }}>
          <button className="join-btn" onClick={onJoin} style={{ background:"linear-gradient(135deg,#f59e0b,#fbbf24)", border:"none", borderRadius:18, color:"#451a03", fontSize:26, padding:"22px 72px", cursor:"pointer", fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"0.1em", animation:"btn-pulse 2.5s ease infinite", boxShadow:"0 4px 30px rgba(251,191,36,0.35)" }}>
            I'M IN — $1
          </button>
        </div>

        {/* One-liner */}
        <div style={{ marginTop:20, fontSize:12, color:"rgba(255,255,255,0.25)", animation:"fade-up 0.4s ease 0.35s both" }}>
          Honor system. Venmo. No fees. No catch.
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────────── */}
      <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(251,191,36,0.2),transparent)" }}/>

      {/* ── Wishes ───────────────────────────────────────── */}
      <div style={{ padding:"24px 24px 48px" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:"rgba(251,191,36,0.4)", letterSpacing:"0.15em", marginBottom:14 }}>WHAT PEOPLE WANT</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:22 }}>
          {shownWishes.map((w,i)=>(
            <div key={i} style={{ background:"rgba(251,191,36,0.04)", border:"1px solid rgba(251,191,36,0.1)", borderRadius:12, padding:"12px 14px", display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ width:32,height:32,borderRadius:"50%",background:`hsl(${(i*80+30)%360},55%,50%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0 }}>
                {w.name.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:2 }}>{w.name}</div>
                <div style={{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:13, color:"rgba(255,255,255,0.65)", lineHeight:1.5 }}>"{w.wish}"</div>
              </div>
            </div>
          ))}
        </div>
        <button className="join-btn" onClick={onJoin} style={{ width:"100%", padding:14, background:"transparent", border:"1px solid rgba(251,191,36,0.22)", borderRadius:12, color:"rgba(251,191,36,0.65)", fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>
          Add your wish
        </button>
      </div>
    </div>
  );
}
