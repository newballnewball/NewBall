import { useState } from "react";
import {
  signInWithPopup, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, ADMIN_EMAIL } from "../firebase";
import { Baseball } from "../App";

async function ensureUserDoc(user, extra = {}) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      name: user.displayName || extra.name || "Member",
      email: user.email,
      wish: "",
      paid: false,
      streak: 0,
      isAdmin: user.email === ADMIN_EMAIL,
      joinedAt: serverTimestamp(),
      invitedBy: extra.invitedBy || null,
      likes: {},
    });
  }
}

export default function AuthScreen({ invitedBy }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const attempt = async (fn) => {
    setError("");
    setLoading(true);
    try { await fn(); }
    catch (e) { setError(e.message.replace("Firebase: ", "").replace(/\(auth.*\)\.?/, "").trim()); }
    finally { setLoading(false); }
  };

  const loginGoogle = () => attempt(async () => {
    const r = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(r.user, { invitedBy });
  });

  const loginEmail = () => attempt(async () => {
    if (!email || !password) throw new Error("Please enter your email and password.");
    if (mode === "signup") {
      if (!name) throw new Error("Please enter your name.");
      const r = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(r.user, { displayName: name });
      await ensureUserDoc(r.user, { name, invitedBy });
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  });

  const inp = {
    width: "100%", padding: "13px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, color: "#fff", fontSize: 14,
    fontFamily: "inherit", outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#0a0a0f", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,300&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 24px rgba(168,85,247,0.35)} 50%{box-shadow:0 0 40px rgba(168,85,247,0.6)} }
      `}</style>

      <div style={{ position: "fixed", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(168,85,247,0.2),transparent 70%)", pointerEvents: "none" }}/>
      <div style={{ position: "fixed", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(236,72,153,0.15),transparent 70%)", pointerEvents: "none" }}/>

      <div style={{ width: "100%", maxWidth: 360, animation: "fade-up 0.4s ease", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ marginBottom: 14 }}><Baseball size={72} spin="fast" /></div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 38, fontWeight: 700, color: "#fff", letterSpacing: "-1px" }}>NooBall</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>everybody chips in · one person wins</div>
          {invitedBy && <div style={{ marginTop: 14, fontSize: 13, color: "#c084fc", background: "rgba(192,132,252,0.1)", border: "1px solid rgba(192,132,252,0.2)", borderRadius: 20, padding: "6px 16px", display: "inline-block" }}>✨ You were invited to join</div>}
        </div>

        {/* Google */}
        <button onClick={loginGoogle} disabled={loading} style={{ width: "100%", padding: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "inherit", marginBottom: 10 }}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.7-3-11.7-7.3l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.9 36.2 44 30.5 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }}/>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>or</div>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }}/>
        </div>

        {/* Email form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {mode === "signup" && <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={inp} />}
          <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inp} onKeyDown={e => e.key === "Enter" && loginEmail()} />
          {error && <div style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>{error}</div>}
          <button onClick={loginEmail} disabled={loading} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg,#7c3aed,#ec4899)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 4, animation: "glow 3s ease infinite" }}>
            {loading ? "..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
          {mode === "login"
            ? <>No account? <span onClick={() => setMode("signup")} style={{ color: "#c084fc", cursor: "pointer", fontWeight: 600 }}>Sign up</span></>
            : <>Have an account? <span onClick={() => setMode("login")} style={{ color: "#c084fc", cursor: "pointer", fontWeight: 600 }}>Sign in</span></>}
        </div>
      </div>
    </div>
  );
}
