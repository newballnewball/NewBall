import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import LandingScreen from "./components/LandingScreen";
import AuthScreen    from "./components/AuthScreen";
import MainApp       from "./components/MainApp";

export default function App() {
  const [user, setUser]         = useState(undefined);
  const [showAuth, setShowAuth] = useState(false);
  const [invitedBy, setInvitedBy] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) { setInvitedBy(ref); setShowAuth(true); }
    return onAuthStateChanged(auth, u => setUser(u || null));
  }, []);

  if (user === undefined) return (
    <div style={{ background:"#0d0a07", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Baseball size={56} spin="fast" />
    </div>
  );

  if (user)      return <MainApp user={user} />;
  if (showAuth)  return <AuthScreen invitedBy={invitedBy} onBack={() => setShowAuth(false)} />;
  return <LandingScreen onJoin={() => setShowAuth(true)} />;
}

// ── Spinning baseball SVG ─────────────────────────────────────────────────────
export function Baseball({ size = 36, spin = "slow" }) {
  const dur = spin==="fast" ? "1.1s" : spin==="medium" ? "2s" : "3.5s";
  return (
    <span style={{ display:"inline-block", width:size, height:size, verticalAlign:"middle", flexShrink:0, animation:`nb-fly ${dur} linear infinite` }}>
      <style>{`@keyframes nb-fly{0%{transform:rotate(0deg) translateY(0)}25%{transform:rotate(90deg) translateY(-${Math.round(size*.14)}px)}50%{transform:rotate(180deg) translateY(0)}75%{transform:rotate(270deg) translateY(-${Math.round(size*.14)}px)}100%{transform:rotate(360deg) translateY(0)}}`}</style>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#f5f0e8" stroke="#e0d8cc" strokeWidth="1.5"/>
        <path d="M26,16 C34,28 36,40 34,50 C32,60 26,72 20,80" fill="none" stroke="#cc2222" strokeWidth="4" strokeLinecap="round"/>
        <path d="M74,16 C66,28 64,40 66,50 C68,60 74,72 80,80" fill="none" stroke="#cc2222" strokeWidth="4" strokeLinecap="round"/>
        <path d="M28,19 L23,24 M29,26 L24,31 M30,33 L25,38 M30,40 L25,45 M30,47 L25,52 M30,54 L25,59 M29,61 L24,66 M28,68 L23,73" fill="none" stroke="#cc2222" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M72,19 L77,24 M71,26 L76,31 M70,33 L75,38 M70,40 L75,45 M70,47 L75,52 M70,54 L75,59 M71,61 L76,66 M72,68 L77,73" fill="none" stroke="#cc2222" strokeWidth="2.2" strokeLinecap="round"/>
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
export const hsl = i => `hsl(${(i*47+30)%360},45%,55%)`;
export const ini = n => (n||"?").slice(0,2).toUpperCase();

// ── Confetti ──────────────────────────────────────────────────────────────────
export function Confetti({ active }) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    if (!active) return;
    const cols = ["#e8d5a3","#e05c2a","#c9b472","#f5f0e8","#e8a87c","#d4885a"];
    setPieces(Array.from({length:65},(_,i) => ({
      id:i, x:Math.random()*100, delay:Math.random()*1.2,
      size:5+Math.random()*9, rot:Math.random()*360,
      color:cols[i%cols.length], circle:Math.random()>.4,
      dur:2.5+Math.random()*1.5,
    })));
    const t = setTimeout(()=>setPieces([]),5500);
    return ()=>clearTimeout(t);
  },[active]);
  return <>
    <style>{`@keyframes nb-fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
    {pieces.map(p=>(
      <div key={p.id} style={{ position:"fixed",top:0,left:`${p.x}%`,width:p.size,height:p.circle?p.size:p.size*.4,background:p.color,borderRadius:p.circle?"50%":"2px",animation:`nb-fall ${p.dur}s ease-in forwards`,animationDelay:`${p.delay}s`,zIndex:9999,pointerEvents:"none",transform:`rotate(${p.rot}deg)` }}/>
    ))}
  </>;
}
