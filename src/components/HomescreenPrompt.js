import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Nooball } from "../App";

export default function HomescreenPrompt({ userId, onDismiss }) {
  const dismiss = async () => {
    await updateDoc(doc(db,"users",userId), { seenHomescreen:true });
    onDismiss();
  };

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(8px)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Lora:ital,wght@1,400&family=DM+Sans:wght@400;600;700&display=swap');
        @keyframes slide-up-modal{from{transform:translateY(100%)}to{transform:translateY(0)}}
      `}</style>
      <div style={{ background:"#0d0d14",borderRadius:"20px 20px 0 0",padding:"28px 24px 40px",width:"100%",maxWidth:430,animation:"slide-up-modal 0.35s cubic-bezier(0.34,1.2,0.64,1)",fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ textAlign:"center",marginBottom:20 }}>
          <Nooball size={44} spin="slow"/>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#fff",letterSpacing:"0.05em",marginTop:10 }}>SAVE NOOBALL TO YOUR PHONE</div>
          <div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:13,color:"rgba(255,255,255,0.45)",marginTop:6 }}>Access it like a real app — no App Store needed</div>
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:22 }}>
          {isIOS && (
            <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 16px" }}>
              <div style={{ fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)",marginBottom:4 }}>📱 On iPhone / iPad</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.6 }}>
                Tap the <strong style={{ color:"#a78bfa" }}>Share</strong> button at the bottom of Safari, then tap <strong style={{ color:"#a78bfa" }}>"Add to Home Screen"</strong>. NooBall will appear as an app icon.
              </div>
            </div>
          )}
          {isAndroid && (
            <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 16px" }}>
              <div style={{ fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)",marginBottom:4 }}>📱 On Android</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.6 }}>
                Tap the <strong style={{ color:"#a78bfa" }}>three dots menu</strong> in Chrome, then tap <strong style={{ color:"#a78bfa" }}>"Add to Home Screen"</strong>. NooBall will appear as an app icon.
              </div>
            </div>
          )}
          {!isIOS && !isAndroid && (
            <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 16px" }}>
              <div style={{ fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)",marginBottom:4 }}>📱 On your phone</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.6 }}>
                Open this link on your phone, then use your browser's <strong style={{ color:"#a78bfa" }}>"Add to Home Screen"</strong> option to save NooBall as an app icon.
              </div>
            </div>
          )}
          <div style={{ background:"rgba(167,139,250,0.07)",border:"1px solid rgba(167,139,250,0.15)",borderRadius:12,padding:"10px 16px" }}>
            <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",fontFamily:"'Lora',serif",fontStyle:"italic" }}>No downloads. No App Store. Works instantly.</div>
          </div>
        </div>

        <button onClick={dismiss} style={{ width:"100%",padding:14,background:"linear-gradient(135deg,#7c3aed,#a855f7)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
          Got it — let's go 🎱
        </button>
      </div>
    </div>
  );
}
