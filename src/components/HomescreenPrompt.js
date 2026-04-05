import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Nooball } from "../App";

export default function HomescreenPrompt({ userId, onDismiss }) {
  const dismiss = async () => {
    await updateDoc(doc(db,"users",userId), { seenHomescreen: true });
    onDismiss();
  };

  const isIOS     = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(8px)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Lora:ital,wght@1,400&family=DM+Sans:wght@400;600;700&display=swap');
        @keyframes slide-up-sheet{from{transform:translateY(100%)}to{transform:translateY(0)}}
      `}</style>
      <div style={{ background:"#0d0d14",borderRadius:"20px 20px 0 0",padding:"28px 24px 44px",width:"100%",maxWidth:430,animation:"slide-up-sheet 0.35s cubic-bezier(0.34,1.2,0.64,1)",fontFamily:"'DM Sans',sans-serif" }}>
        {/* Handle bar */}
        <div style={{ width:40,height:4,borderRadius:2,background:"rgba(255,255,255,0.12)",margin:"0 auto 22px" }}/>

        <div style={{ textAlign:"center",marginBottom:20 }}>
          <Nooball size={44} spin="slow"/>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:"#fff",letterSpacing:"0.05em",marginTop:10 }}>SAVE NOOBALL TO YOUR PHONE</div>
          <div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:5,lineHeight:1.5 }}>Access it like a real app — no App Store needed</div>
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:22 }}>
          {isIOS && (
            <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 16px" }}>
              <div style={{ fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)",marginBottom:5 }}>📱 On iPhone or iPad</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.45)",lineHeight:1.65 }}>
                Tap the <strong style={{ color:"#a78bfa" }}>Share button</strong> at the bottom of Safari (the box with the arrow), then tap <strong style={{ color:"#a78bfa" }}>"Add to Home Screen."</strong> Done — NooBall gets its own icon.
              </div>
            </div>
          )}
          {isAndroid && (
            <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 16px" }}>
              <div style={{ fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)",marginBottom:5 }}>📱 On Android</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.45)",lineHeight:1.65 }}>
                Tap the <strong style={{ color:"#a78bfa" }}>three-dot menu</strong> in Chrome, then tap <strong style={{ color:"#a78bfa" }}>"Add to Home Screen."</strong> NooBall shows up like any other app.
              </div>
            </div>
          )}
          {!isIOS && !isAndroid && (
            <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 16px" }}>
              <div style={{ fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)",marginBottom:5 }}>📱 On your phone</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.45)",lineHeight:1.65 }}>
                Open this link on your phone's browser and use the <strong style={{ color:"#a78bfa" }}>"Add to Home Screen"</strong> option. NooBall will appear as an app icon — no download required.
              </div>
            </div>
          )}
          <div style={{ background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.14)",borderRadius:12,padding:"10px 16px" }}>
            <div style={{ fontSize:12,color:"rgba(255,255,255,0.35)",fontFamily:"'Lora',serif",fontStyle:"italic" }}>No downloads. No App Store. Works right now.</div>
          </div>
        </div>

        <button onClick={dismiss} style={{ width:"100%",padding:15,background:"linear-gradient(135deg,#7c3aed,#a855f7)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
          Got it — let's go ⚾
        </button>
      </div>
    </div>
  );
}
