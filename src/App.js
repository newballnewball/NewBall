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

// ── The NooBall — clean, trustworthy, satisfying spin ─────────────────────────
export function Nooball({ size = 36, spin = "slow" }) {
  const animName = spin==="fast"?"nb-spin-fast":spin==="medium"?"nb-spin-medium":"nb-spin-slow";
  const dur = spin==="fast"?"1.4s":spin==="medium"?"2.4s":"4s";
  return (
    <span style={{
      display:"inline-block", width:size, height:size,
      verticalAlign:"middle", flexShrink:0,
      animation:`${animName} ${dur} linear infinite`,
    }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <radialGradient id="nb-grad" cx="40%" cy="35%" r="60%">
            <stop offset="0%"   stopColor="#4ade80"/>
            <stop offset="50%"  stopColor="#16a34a"/>
            <stop offset="100%" stopColor="#052e16"/>
          </radialGradient>
          <radialGradient id="nb-shine" cx="35%" cy="30%" r="40%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.25)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#nb-grad)" stroke="#166534" strokeWidth="1"/>
        <circle cx="50" cy="50" r="46" fill="url(#nb-shine)"/>
        <text x="50" y="62" textAnchor="middle" fontFamily="Georgia,serif" fontSize="40" fontWeight="700" fill="#bbf7d0" opacity="0.9">$</text>
        <path d="M27,18 C35,30 37,42 35,52 C33,62 27,73 21,81" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
        <path d="M73,18 C65,30 63,42 65,52 C67,62 73,73 79,81" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
        <path d="M29,22 L25,27 M30,31 L26,36 M31,40 L27,45 M31,49 L27,54 M31,58 L27,63 M30,67 L26,72" fill="none" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        <path d="M71,22 L75,27 M70,31 L74,36 M69,40 L73,45 M69,49 L73,54 M69,58 L73,63 M70,67 L74,72" fill="none" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      </svg>
    </span>
  );
}

// ── Countdown hook ─────────────────────────────────────────────────────────────
export function useCountdown(target) {
  const [t, setT] = useState({ d:0,h:0,m:0,s:0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target) - Date.now();
      if (diff <= 0) return setT({d:0,h:0,m:0,s:0});
      setT({
        d: Math.floor(diff/86400000),
        h: Math.floor(diff%86400000/3600000),
        m: Math.floor(diff%3600000/60000),
        s: Math.floor(diff%60000/1000),
      });
    };
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id);
  },[target]);
  return t;
}

export const pad = n => String(n).padStart(2,"0");
export const hsl = i => `hsl(${(i*53+260)%360},55%,62%)`;
export const ini = n => (n||"?").slice(0,2).toUpperCase();

// ── Confetti ───────────────────────────────────────────────────────────────────
export function Confetti({ active }) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    if (!active) return;
    const cols = ["#a78bfa","#f472b6","#fb923c","#facc15","#34d399","#60a5fa"];
    setPieces(Array.from({length:65},(_,i) => ({
      id:i, x:Math.random()*100, delay:Math.random()*1.2,
      size:5+Math.random()*9, rot:Math.random()*360,
      color:cols[i%cols.length], circle:Math.random()>.4, dur:2.5+Math.random()*1.5,
    })));
    const t = setTimeout(()=>setPieces([]),5500); return()=>clearTimeout(t);
  },[active]);
  return <>
    {pieces.map(p=>(
      <div key={p.id} style={{ position:"fixed",top:0,left:`${p.x}%`,width:p.size,height:p.circle?p.size:p.size*.4,background:p.color,borderRadius:p.circle?"50%":"2px",animation:`nb-fall ${p.dur}s ease-in forwards`,animationDelay:`${p.delay}s`,zIndex:9999,pointerEvents:"none",transform:`rotate(${p.rot}deg)` }}/>
    ))}
  </>;
}
