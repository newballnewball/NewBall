import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function WishInput({ userId, currentWish }) {
  const [wish, setWish]   = useState(currentWish || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [floater, setFloater] = useState(null);

  const save = async () => {
    if (!wish.trim() || saving) return;
    setSaving(true);
    await updateDoc(doc(db,"users",userId), { wish:wish.trim() });
    setFloater(wish.trim());
    setTimeout(()=>setFloater(null), 2200);
    setSaved(true); setSaving(false);
    setTimeout(()=>setSaved(false), 3000);
  };

  return (
    <div style={{ position:"relative" }}>
      <style>{`
        @keyframes wish-float{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-36px) scale(0.95)}}
        @keyframes saved-pop{0%{transform:scale(1)}40%{transform:scale(1.07)}100%{transform:scale(1)}}
      `}</style>
      {floater && (
        <div style={{ position:"absolute",bottom:"100%",left:0,right:0,padding:"10px 14px",background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.25)",borderRadius:10,fontSize:13,color:"#34d399",fontFamily:"'Lora',serif",fontStyle:"italic",animation:"wish-float 2.2s ease forwards",pointerEvents:"none",zIndex:10 }}>
          "{floater}" ✓
        </div>
      )}
      <div style={{ fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.7)",marginBottom:10,fontFamily:"'DM Sans',sans-serif" }}>What would you do with it? 💭</div>
      <textarea
        placeholder="Be specific — it makes your wish real."
        value={wish}
        onChange={e=>{setWish(e.target.value);setSaved(false);}}
        rows={3}
        style={{ width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${saved?"rgba(52,211,153,0.35)":"rgba(255,255,255,0.09)"}`,borderRadius:10,padding:11,fontSize:13,fontFamily:"'Lora',serif",fontStyle:"italic",resize:"none",color:"#fff",outline:"none",transition:"border-color 0.3s" }}
      />
      <button
        onClick={save}
        disabled={saving||!wish.trim()}
        style={{ marginTop:8,background:saved?"rgba(52,211,153,0.12)":wish.trim()?"rgba(167,139,250,0.12)":"rgba(255,255,255,0.04)",border:saved?"1px solid #34d399":wish.trim()?"1px solid rgba(167,139,250,0.35)":"1px solid rgba(255,255,255,0.08)",color:saved?"#34d399":wish.trim()?"#a78bfa":"rgba(255,255,255,0.3)",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:wish.trim()?"pointer":"default",fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s",animation:saved?"saved-pop 0.3s ease":"none" }}
      >
        {saving?"Saving…":saved?"✓ Wish locked in!":"Lock in my wish"}
      </button>
    </div>
  );
}
