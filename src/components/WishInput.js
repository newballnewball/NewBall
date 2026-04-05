import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function WishInput({ userId, currentWish }) {
  const [wish, setWish]         = useState(currentWish || "");
  const [saved, setSaved]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [floatingWish, setFloat] = useState(null);

  const save = async () => {
    if (!wish.trim() || saving) return;
    setSaving(true);
    await updateDoc(doc(db,"users",userId), { wish: wish.trim() });
    setFloat(wish.trim());
    setTimeout(() => setFloat(null), 2000);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ position:"relative" }}>
      <style>{`
        @keyframes wish-float { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-40px) scale(0.95)} }
        @keyframes saved-bounce { 0%{transform:scale(1)} 40%{transform:scale(1.08)} 100%{transform:scale(1)} }
      `}</style>

      {floatingWish && (
        <div style={{ position:"absolute",bottom:"100%",left:0,right:0,padding:"10px 14px",background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.3)",borderRadius:10,fontSize:13,color:"#34d399",fontStyle:"italic",fontFamily:"'Fraunces',serif",animation:"wish-float 2s ease forwards",pointerEvents:"none",zIndex:10 }}>
          "{floatingWish}" ✓
        </div>
      )}

      <div style={{ fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.7)",marginBottom:10 }}>
        What would you do with it? 💭
      </div>
      <textarea
        placeholder="Be specific — it makes your wish real."
        value={wish}
        onChange={e => { setWish(e.target.value); setSaved(false); }}
        rows={3}
        style={{ width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${saved?"rgba(52,211,153,0.4)":"rgba(255,255,255,0.09)"}`,borderRadius:10,padding:11,fontSize:13,fontFamily:"inherit",resize:"none",color:"#fff",outline:"none",transition:"border-color 0.3s" }}
      />
      <button
        onClick={save}
        disabled={saving || !wish.trim()}
        style={{
          marginTop:8,
          background: saved ? "rgba(52,211,153,0.15)" : wish.trim() ? "rgba(192,132,252,0.15)" : "rgba(255,255,255,0.04)",
          border: saved ? "1px solid #34d399" : wish.trim() ? "1px solid rgba(192,132,252,0.4)" : "1px solid rgba(255,255,255,0.08)",
          color: saved ? "#34d399" : wish.trim() ? "#c084fc" : "rgba(255,255,255,0.3)",
          borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:wish.trim()?"pointer":"default",fontFamily:"inherit",
          transition:"all 0.2s",
          animation: saved ? "saved-bounce 0.3s ease" : "none",
        }}
      >
        {saving ? "Saving…" : saved ? "✓ Wish locked in!" : "Lock in my wish"}
      </button>
    </div>
  );
}
