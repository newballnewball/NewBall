import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import LandingScreen from "./components/LandingScreen";
import AuthScreen    from "./components/AuthScreen";
import MainApp       from "./components/MainApp";

export default function App() {
  const [user, setUser]           = useState(undefined);
  const [showAuth, setShowAuth]   = useState(false);
  const [invitedBy, setInvitedBy] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) { setInvitedBy(ref); setShowAuth(true); }
    return onAuthStateChanged(auth, u => setUser(u || null));
  }, []);

  if (user === undefined) return (
    <div style={{ background:"#0a0a0f", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Nooball size={64} spin="fast" />
    </div>
  );

  if (user)     return <MainApp user={user} />;
  if (showAuth) return <AuthScreen invitedBy={invitedBy} onBack={() => setShowAuth(false)} />;
  return <LandingScreen onJoin={() => setShowAuth(true)} />;
}

// ── Green dollar-sign ball ────────────────────────────────────────────────────
export function Nooball({ size = 36, spin = "slow" }) {
  const dur = spin==="fast"?"1.1s":spin==="medium"?"2s":"3.5s";
  return (
    <span style={{ display:"inline-block", width:size, height:size, verticalAlign:"middle", flexShrink:0, animation:`nb-spin ${dur} linear infinite` }}>
      <style>{`@keyframes nb-spin{0%{transform:rotate(0deg) translateY(0)}25%{transform:rotate(90deg) translateY(-${Math.round(size*.12)}px)}50%{transform:rotate(180deg) translateY(0)}75%{transform:rotate(270deg) translateY(-${Math.round(size*.12)}px)}100%{transform:rotate(360deg) translateY(0)}}`}</style>
      <svg width={size} height={size} viewBox="0 0 100 100">
        {/* Green ball */}
        <circle cx="50" cy="50" r="46" fill="#1a3a1a" stroke="#2d5a2d" strokeWidth="1.5"/>
        <circle cx="50" cy="50" r="46" fill="url(#ggrad)"/>
        <defs>
          <radialGradient id="ggrad" cx="38%" cy="35%">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#14532d" stopOpacity="1"/>
          </radialGradient>
        </defs>
        {/* Shine */}
        <ellipse cx="38" cy="34" rx="10" ry="7" fill="rgba(255,255,255,0.15)" transform="rotate(-20,38,34)"/>
        {/* Dollar sign */}
        <text x="50" y="57" textAnchor="middle" fontFamily="Georgia,serif" fontSize="36" fontWeight="700" fill="#22c55e" stroke="#16a34a" strokeWidth="0.5">$</text>
        {/* Seam lines in darker green */}
        <path d="M26,16 C34,28 36,40 34,50 C32,60 26,72 20,80" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
        <path d="M74,16 C66,28 64,40 66,50 C68,60 74,72 80,80" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
        <path d="M28,22 L24,27 M29,30 L25,35 M30,38 L26,43 M30,46 L26,51 M30,54 L26,59 M29,62 L25,67" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
        <path d="M72,22 L76,27 M71,30 L75,35 M70,38 L74,43 M70,46 L74,51 M70,54 L74,59 M71,62 L75,67" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
      </svg>
    </span>
  );
}

// ── Countdown hook ────────────────────────────────────────────────────────────
export function useCountdown(target) {
  const [t, setT] = useState({ d:0,h:0,m:0,s:0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target) - Date.now();
      if (diff <= 0) return setT({d:0,h:0,m:0,s:0});
      setT({ d:Math.floor(diff/86400000), h:Math.floor(diff%86400000/3600000), m:Math.floor(diff%3600000/60000), s:Math.floor(diff%60000/1000) });
    };
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id);
  },[target]);
  return t;
}

export const pad = n => String(n).padStart(2,"0");
export const hsl = i => `hsl(${(i*53+260)%360},55%,62%)`;
export const ini = n => (n||"?").slice(0,2).toUpperCase();

// ── Confetti ──────────────────────────────────────────────────────────────────
export function Confetti({ active }) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    if (!active) return;
    const cols = ["#a78bfa","#f472b6","#fb923c","#facc15","#34d399","#60a5fa","#c084fc"];
    setPieces(Array.from({length:70},(_,i) => ({
      id:i, x:Math.random()*100, delay:Math.random()*1.2,
      size:5+Math.random()*9, rot:Math.random()*360,
      color:cols[i%cols.length], circle:Math.random()>.4, dur:2.5+Math.random()*1.5,
    })));
    const t = setTimeout(()=>setPieces([]),5500); return()=>clearTimeout(t);
  },[active]);
  return <>
    <style>{`@keyframes nb-fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
    {pieces.map(p=>(
      <div key={p.id} style={{ position:"fixed",top:0,left:`${p.x}%`,width:p.size,height:p.circle?p.size:p.size*.4,background:p.color,borderRadius:p.circle?"50%":"2px",animation:`nb-fall ${p.dur}s ease-in forwards`,animationDelay:`${p.delay}s`,zIndex:9999,pointerEvents:"none",transform:`rotate(${p.rot}deg)` }}/>
    ))}
  </>;
}
