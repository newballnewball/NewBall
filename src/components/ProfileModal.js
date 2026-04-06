import { useState } from "react";
import { deleteUser, GoogleAuthProvider, signInWithPopup, getAuth, signOut } from "firebase/auth";
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function ProfileModal({ user, myData, members, onClose, onShowHomescreen }) {
  const [name, setName]     = useState(myData?.name || "");
  const [venmo, setVenmo]   = useState(myData?.venmoHandle || "");
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveProfile = async () => {
    setError(""); setSaving(true);
    try {
      const cleanVenmo = venmo.replace("@","").toLowerCase().trim();
      if (cleanVenmo && cleanVenmo !== myData?.venmoHandle) {
        const q = query(collection(db,"users"),where("venmoHandle","==",cleanVenmo));
        const snap = await getDocs(q);
        if (snap.docs.some(d=>d.id!==user.uid)) throw new Error("That Venmo handle is already taken.");
      }
      await updateDoc(doc(db,"users",user.uid),{
        name: name.trim() || myData?.name,
        venmoHandle: cleanVenmo,
      });
      setSaved(true);
      setTimeout(()=>setSaved(false),2000);
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db,"users",user.uid));
      await deleteUser(auth.currentUser);
    } catch(e) {
      if (e.code==="auth/requires-recent-login") {
        try {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
          await deleteDoc(doc(db,"users",user.uid));
          await deleteUser(auth.currentUser);
        } catch(e2) {
          setError("Couldn't delete account. Please sign out and sign back in, then try again.");
          setDeleting(false);
          setConfirmDelete(false);
        }
      } else {
        setError(e.message);
        setDeleting(false);
        setConfirmDelete(false);
      }
    }
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(8px)" }}>
      <div style={{ background:"#0d1018",borderRadius:"20px 20px 0 0",padding:"24px 24px 44px",width:"100%",maxWidth:430,animation:"slide-up-sheet 0.3s cubic-bezier(0.34,1.2,0.64,1)",fontFamily:"'DM Sans',sans-serif",maxHeight:"90vh",overflowY:"auto" }}>
        <div style={{ width:40,height:4,borderRadius:2,background:"rgba(255,255,255,0.12)",margin:"0 auto 20px" }}/>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#fff",letterSpacing:"0.05em" }}>YOUR PROFILE</div>
          <button onClick={onClose} style={{ background:"transparent",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:22,lineHeight:1,padding:0,fontFamily:"inherit" }}>×</button>
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:14,marginBottom:22 }}>
          <div>
            <div style={{ fontSize:11,color:"rgba(251,191,36,0.5)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6,fontFamily:"'Bebas Neue',sans-serif" }}>Display name</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={{ width:"100%",padding:"12px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#fff",fontSize:14,fontFamily:"inherit" }}/>
          </div>

          <div>
            <div style={{ fontSize:11,color:"rgba(251,191,36,0.5)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6,fontFamily:"'Bebas Neue',sans-serif" }}>Email</div>
            <div style={{ padding:"12px 14px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,fontSize:14,color:"rgba(255,255,255,0.4)" }}>{user.email}</div>
          </div>

          <div>
            <div style={{ fontSize:11,color:"rgba(251,191,36,0.5)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6,fontFamily:"'Bebas Neue',sans-serif" }}>Venmo handle</div>
            <input value={venmo} onChange={e=>setVenmo(e.target.value)} placeholder="@yourvenmo" style={{ width:"100%",padding:"12px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#fff",fontSize:14,fontFamily:"inherit" }}/>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:5 }}>This is how you collect your winnings.</div>
          </div>

          {error && <div style={{ fontSize:12,color:"#f87171" }}>{error}</div>}

          <button onClick={saveProfile} disabled={saving} style={{ padding:"13px",background:saved?"rgba(52,211,153,0.12)":"linear-gradient(135deg,#f59e0b,#fbbf24)",border:saved?"1px solid #34d399":"none",borderRadius:12,color:saved?"#34d399":"#451a03",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
            {saving?"Saving...":saved?"Saved":"Save changes"}
          </button>
        </div>

        <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"12px 16px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ fontSize:13,color:"rgba(255,255,255,0.5)" }}>Times played</div>
          <div style={{ fontSize:16,fontWeight:700,color:"#fbbf24" }}>{myData?.streak||0}</div>
        </div>

        <button onClick={()=>{ onClose(); onShowHomescreen(); }} style={{ width:"100%",padding:"12px",background:"rgba(251,191,36,0.06)",border:"1px solid rgba(251,191,36,0.15)",borderRadius:12,color:"rgba(251,191,36,0.7)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          Add to Home Screen
        </button>

        <button onClick={()=>signOut(getAuth())} style={{ width:"100%",padding:"12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"rgba(255,255,255,0.45)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:22 }}>
          Sign out
        </button>

        <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:20 }}>
          {!confirmDelete ? (
            <button onClick={()=>setConfirmDelete(true)} style={{ background:"transparent",border:"none",color:"rgba(255,100,100,0.45)",cursor:"pointer",fontSize:13,fontFamily:"inherit",padding:0 }}>
              Delete my account
            </button>
          ) : (
            <div style={{ background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,padding:"16px" }}>
              <div style={{ fontSize:14,fontWeight:700,color:"#ef4444",marginBottom:6 }}>Are you sure?</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:14,lineHeight:1.5 }}>This permanently deletes your account and all your data. It can't be undone.</div>
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={()=>setConfirmDelete(false)} style={{ flex:1,padding:"11px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"rgba(255,255,255,0.6)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                  Cancel
                </button>
                <button onClick={deleteAccount} disabled={deleting} style={{ flex:1,padding:"11px",background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.35)",borderRadius:10,color:"#ef4444",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                  {deleting?"Deleting...":"Yes, delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
