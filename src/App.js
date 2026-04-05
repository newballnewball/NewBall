import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import AuthScreen from "./components/AuthScreen";
import MainApp from "./components/MainApp";

export default function App() {
  const [user, setUser] = useState(undefined);
  const [invitedBy, setInvitedBy] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setInvitedBy(ref);
    return onAuthStateChanged(auth, u => setUser(u || null));
  }, []);

  if (user === undefined) {
    return (
      <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Baseball size={56} spin="fast" />
      </div>
    );
  }

  if (!user) return <AuthScreen invitedBy={invitedBy} />;
  return <MainApp user={user} />;
}

export function Baseball({ size = 36, spin = "slow" }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size, verticalAlign: "middle", flexShrink: 0,
      animation: spin === "fast" ? "fly 1.2s linear infinite" : "fly 3s linear infinite",
    }}>
      <style>{`
        @keyframes fly {
          0%   { transform: rotate(0deg) translateY(0px); }
          25%  { transform: rotate(90deg) translateY(-6px); }
          50%  { transform: rotate(180deg) translateY(0px); }
          75%  { transform: rotate(270deg) translateY(-6px); }
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
