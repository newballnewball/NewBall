import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import LandingScreen from "./components/LandingScreen";
import AuthScreen from "./components/AuthScreen";
import MainApp from "./components/MainApp";

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

  if (user === undefined) {
    return (
      <div style={{ background:"#0a0a0f", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Baseball size={56} spin="fast" />
      </div>
    );
  }

  if (user) return <MainApp user={user} />;
  if (showAuth) return <AuthScreen invitedBy={invitedBy} onBack={() => setShowAuth(false)} />;
  return <LandingScreen onJoin={() => setShowAuth(true)} />;
}

export function Baseball({ size = 36, spin = "slow" }) {
  const duration = spin === "fast" ? "1.2s" : spin === "medium" ? "2s" : "3s";
  return (
    <span style={{ display:"inline-block", width:size, height:size, verticalAlign:"middle", flexShrink:0, animation:`nooball-fly ${duration} linear infinite` }}>
      <style>{`
        @keyframes nooball-fly {
          0%   { transform: rotate(0deg) translateY(0px); }
          25%  { transform: rotate(90deg) translateY(-${size*0.15}px); }
          50%  { transform: rotate(180deg) translateY(0px); }
          75%  { transform: rotate(270deg) translateY(-${size*0.15}px); }
          100% { transform: rotate(360deg) translateY(0px); }
        }
      `}</style>
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

export function useCountdown(target) {
  const [t, setT] = useState({ d:0,h:0,m:0,s:0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target) - Date.now();
      if (diff <= 0) return setT({ d:0,h:0,m:0,s:0 });
      setT({ d:Math.floor(diff/86400000), h:Math.floor(diff%86400000/3600000), m:Math.floor(diff%3600000/60000), s:Math.floor(diff%60000/1000) });
    };
    tick(); const id = setInterval(tick,1000); return () => clearInterval(id);
  }, [target]);
  return t;
}

export function pad(n) { return String(n).padStart(2,"0"); }
export function hsl(i) { return `hsl(${(i*47+260)%360},55%,60%)`; }
export function ini(n) { return (n||"?").slice(0,2).toUpperCase(); }

export function Confetti({ active }) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    if (!active) return;
    const cols = ["#c084fc","#f472b6","#fb923c","#facc15","#34d399","#60a5fa","#f5f0e8"];
    setPieces(Array.from({length:70},(_,i) => ({
      id:i, x:Math.random()*100, delay:Math.random()*1.2,
      size:5+Math.random()*10, rot:Math.random()*360,
      color:cols[i%cols.length], circle:Math.random()>0.4,
      duration: 2.5+Math.random()*1.5,
    })));
    const t = setTimeout(() => setPieces([]), 5000);
    return () => clearTimeout(t);
  }, [active]);
  return <>
    <style>{`@keyframes confetti-fall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }`}</style>
    {pieces.map(p => (
      <div key={p.id} style={{ position:"fixed",top:0,left:`${p.x}%`,width:p.size,height:p.circle?p.size:p.size*0.4,background:p.color,borderRadius:p.circle?"50%":"2px",animation:`confetti-fall ${p.duration}s ease-in forwards`,animationDelay:`${p.delay}s`,zIndex:9999,pointerEvents:"none",transform:`rotate(${p.rot}deg)` }}/>
    ))}
  </>;
}
