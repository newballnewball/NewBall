import { useState, useEffect } from "react";
import { collection, doc, onSnapshot, updateDoc, query, orderBy, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db, ADMIN_EMAIL, getTier } from "../firebase";
import { Nooball, useCountdown, pad, hsl, ini, Confetti } from "../App";
import WinnerModal      from "./WinnerModal";
import PinkySwearModal  from "./PinkySwearModal";
import HomescreenPrompt from "./HomescreenPrompt";
import ProfileModal     from "./ProfileModal";

export default function MainApp({ user }) {
  const [members, setMembers]       = useState([]);
  const [history, setHistory]       = useState([]);
  const [myData, setMyData]         = useState(null);
  const [copied, setCopied]         = useState(false);
  const [winnerModal, setWinnerModal] = useState(null);
  const [pinkyModal, setPinkyModal] = useState(null);
  const [confettiActive, setConf]   = useState(false);
  const [showHomescreen, setShowHS] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [wish, setWish]             = useState("");
  const [wishSaved, setWishSaved]   = useState(false);
  const tier    = getTier();
  const cd      = useCountdown(tier.next);
  const isAdmin = user.email === ADMIN_EMAIL;

  useEffect(()=>{
    const q = query(collection(db,"users"),orderBy("joinedAt","asc"));
    return onSnapshot(q,snap=>{
      const data = snap.docs.map(d=>({id:d.id,...d.data()}));
      setMembers(data);
      const me = data.find(m=>m.uid===user.uid);
      if (me) {
        setMyData(me);
        if (!wish && me.wish) setWish(me.wish);
        if (me.seenHomescreen !== true) setShowHS(true);
      }
    });
  },[user.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{
    const q = query(collection(db,"history"),orderBy("drawnAt","desc"));
    return onSnapshot(q,snap=>setHistory(snap.docs.map(d=>({id:d.id,...d.data()}))));
  },[]);

  const paid   = members.filter(m=>m.paid?.[tier.id]);
  const pot    = paid.length * tier.amount;
  const potStr = pot % 1 === 0 ? `$${pot}` : `$${pot.toFixed(2)}`;
  const isPaid = myData?.paid?.[tier.id];

  const markPaid = async () => {
    await updateDoc(doc(db,"users",user.uid),{
      paid:{...(myData?.paid||{}),[tier.id]:true},
      streak:(myData?.streak||0)+1,
    });
    setPinkyModal(tier);
  };

  const saveWish = async () => {
    if (!wish.trim()) return;
    await updateDoc(doc(db,"users",user.uid), { wish:wish.trim() });
    setWishSaved(true);
    setTimeout(()=>setWishSaved(false), 2000);
  };

  const toggleLike = async memberId => {
    if (memberId===user.uid) return;
    await updateDoc(doc(db,"users",user.uid),{
      likes:{...(myData?.likes||{}),[memberId]:!myData?.likes?.[memberId]},
    });
  };

  const getLikeCount = uid => members.filter(m=>m.likes?.[uid]).length;

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}?ref=${user.uid}`);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = `${window.location.origin}?ref=${user.uid}`;
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(()=>setCopied(false),2500);
  };

  const runDraw = async () => {
    if (!paid.length) return;
    const winner = paid[Math.floor(Math.random()*paid.length)];
    const amount = paid.length * tier.amount;
    await addDoc(collection(db,"history"),{
      winnerId:winner.uid, winnerName:winner.name, winnerWish:winner.wish||"",
      winnerVenmo:winner.venmoHandle||"", amount,
      tierAmount:tier.amount, tierId:tier.id, tierLabel:tier.label,
      members:paid.length, drawnAt:serverTimestamp(),
      month:new Date().toLocaleString("default",{month:"long",year:"numeric"}),
    });
    const all = await getDocs(collection(db,"users"));
    await Promise.all(all.docs.map(d=>{
      const pd={...(d.data().paid||{})}; delete pd[tier.id];
      return updateDoc(d.ref,{paid:pd});
    }));
    setConf(true); setTimeout(()=>setConf(false),5500);
    setWinnerModal({winner,pot:amount.toFixed(2),tier});
  };

  const sortedMembers = [...members].sort((a,b)=>getLikeCount(b.uid)-getLikeCount(a.uid));
  const latestWinner  = history[0];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#0b0f1a", minHeight:"100vh", maxWidth:430, margin:"0 auto", color:"#fff" }}>

      <Confetti active={confettiActive}/>
      {showHomescreen && <HomescreenPrompt userId={user.uid} onDismiss={()=>setShowHS(false)}/>}
      {showProfile    && <ProfileModal user={user} myData={myData} members={members} onClose={()=>setShowProfile(false)} onShowHomescreen={()=>setShowHS(true)}/>}
      {winnerModal    && <WinnerModal winner={winnerModal.winner} pot={winnerModal.pot} tier={winnerModal.tier} currentUserId={user.uid} onClose={()=>setWinnerModal(null)}/>}
      {pinkyModal     && <PinkySwearModal tierLabel={pinkyModal.label} amount={pinkyModal.amount} onClose={()=>setPinkyModal(null)}/>}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{ background:"linear-gradient(170deg,#1a1207 0%,#0b0f1a 100%)", padding:"24px 24px 32px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 20%,rgba(251,191,36,0.1),transparent 60%)",pointerEvents:"none" }}/>

        {/* Top bar */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative",marginBottom:28 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <Nooball size={30} spin="slow"/>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:"0.06em", color:"#fff" }}>NOO<span style={{ color:"#fbbf24" }}>BALL</span></span>
          </div>
          <button className="btn" onClick={()=>setShowProfile(true)} style={{ width:32,height:32,borderRadius:"50%",background:myData?hsl(members.findIndex(m=>m.uid===user.uid)):"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0 }}>
            {ini(myData?.name||user.displayName||"?")}
          </button>
        </div>

        {/* The Pot */}
        <div style={{ position:"relative",animation:"fade-up 0.4s ease" }}>
          <div style={{ marginBottom:12 }}><Nooball size={64} spin="medium"/></div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:72, background:"linear-gradient(135deg,#fbbf24,#f97316)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", letterSpacing:"0.04em", lineHeight:1, marginBottom:4 }}>
            {potStr}
          </div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.4)", marginBottom:16 }}>
            in the pot
          </div>

          {/* Countdown */}
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:6 }}>
            {[["d","days"],["h","hrs"],["m","min"],["s","sec"]].map(([k,l])=>(
              <div key={k} style={{ textAlign:"center" }}>
                <div style={{ background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.15)", borderRadius:8, padding:"8px 12px", fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:500, color:"#fde68a", lineHeight:1, minWidth:44 }}>{pad(cd[k])}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:4, textTransform:"uppercase", letterSpacing:"0.08em" }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)", marginBottom:24 }}>
            {paid.length} {paid.length===1?"person":"people"} playing
          </div>

          {/* THE BUTTON */}
          {isPaid ? (
            <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.25)",borderRadius:16,padding:"14px 32px",fontSize:16,fontWeight:700,color:"#34d399" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              You're in this week
            </div>
          ) : (
            <button className="join-btn" onClick={markPaid} style={{ background:"linear-gradient(135deg,#f59e0b,#fbbf24)", border:"none", borderRadius:18, color:"#451a03", fontSize:24, padding:"20px 64px", cursor:"pointer", fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"0.1em", animation:"btn-pulse 2.5s ease infinite", boxShadow:"0 4px 30px rgba(251,191,36,0.35)" }}>
              I'M IN — $1
            </button>
          )}

          {/* Admin draw button */}
          {isAdmin && paid.length > 0 && (
            <button onClick={runDraw} style={{ display:"block", margin:"16px auto 0", padding:"10px 24px", background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)", borderRadius:10, color:"#fbbf24", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              Draw this week's winner
            </button>
          )}
        </div>
      </div>

      {/* ── HOW IT WORKS — inline, 3 sentences ───────────── */}
      <div style={{ padding:"20px 24px", textAlign:"center", borderBottom:"1px solid rgba(251,191,36,0.08)" }}>
        <div style={{ fontSize:14, color:"rgba(255,255,255,0.4)", lineHeight:1.7 }}>
          Everyone chips in <strong style={{ color:"#fde68a" }}>$1 a week</strong>.
          One random person <strong style={{ color:"#fde68a" }}>wins the whole pot</strong>.
          Losers Venmo the winner. <strong style={{ color:"#fde68a" }}>Honor system</strong> — no fees, no catch.
        </div>
      </div>

      {/* ── LAST WINNER ──────────────────────────────────── */}
      {latestWinner && (
        <div style={{ padding:"16px 24px", borderBottom:"1px solid rgba(251,191,36,0.08)" }}>
          <div style={{ background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.14)", borderRadius:14, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:10, color:"rgba(251,191,36,0.5)", letterSpacing:"0.14em", marginBottom:3 }}>LAST WINNER</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:"#fff", letterSpacing:"0.03em" }}>{latestWinner.winnerName}</div>
              {latestWinner.winnerWish && <div style={{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:2 }}>"{latestWinner.winnerWish}"</div>}
            </div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:"#fbbf24", letterSpacing:"0.04em" }}>${latestWinner.amount}</div>
          </div>
        </div>
      )}

      {/* ── WISH WALL ────────────────────────────────────── */}
      <div style={{ padding:"20px 24px 40px" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:"rgba(251,191,36,0.4)", letterSpacing:"0.15em", marginBottom:14 }}>
          WHAT PEOPLE WANT
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {/* Your wish — always first */}
          <div style={{ background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.16)", borderRadius:14, padding:"14px 16px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
              <div style={{ width:36,height:36,borderRadius:"50%",background:myData?hsl(members.findIndex(m=>m.uid===user.uid)):"#fbbf24",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0 }}>
                {ini(myData?.name||user.displayName||"?")}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <span style={{ fontSize:14,fontWeight:600 }}>{myData?.name || user.displayName || "You"}</span>
                  <span style={{ fontSize:10,color:"#fbbf24",background:"rgba(251,191,36,0.12)",borderRadius:4,padding:"1px 6px" }}>you</span>
                </div>
              </div>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <input
                placeholder="What would you do with the money?"
                value={wish}
                onChange={e=>{setWish(e.target.value);setWishSaved(false);}}
                onKeyDown={e=>e.key==="Enter"&&saveWish()}
                style={{ flex:1,padding:"10px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#fff",fontSize:13,fontFamily:"'Lora',serif",fontStyle:"italic",outline:"none" }}
              />
              <button onClick={saveWish} disabled={!wish.trim()} style={{ padding:"10px 16px",background:wishSaved?"rgba(52,211,153,0.12)":"rgba(251,191,36,0.12)",border:wishSaved?"1px solid #34d399":"1px solid rgba(251,191,36,0.25)",borderRadius:10,color:wishSaved?"#34d399":"#fbbf24",fontSize:12,fontWeight:600,cursor:wish.trim()?"pointer":"default",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",animation:wishSaved?"saved-pop 0.3s ease":"none" }}>
                {wishSaved ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          {/* Everyone else's wishes */}
          {sortedMembers.filter(m=>m.uid!==user.uid).map(m=>{
            const count=getLikeCount(m.uid);
            const isLiked=myData?.likes?.[m.uid];
            const color=hsl(members.findIndex(x=>x.uid===m.uid));
            return(
              <div key={m.uid} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px 16px" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ width:36,height:36,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0 }}>{ini(m.name)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14,fontWeight:600,marginBottom:2 }}>{m.name}</div>
                    {m.wish
                      ? <div style={{ fontSize:13,color:"rgba(255,255,255,0.6)",fontFamily:"'Lora',serif",fontStyle:"italic",lineHeight:1.5 }}>"{m.wish}"</div>
                      : <div style={{ fontSize:12,color:"rgba(255,255,255,0.2)",fontStyle:"italic",fontFamily:"'Lora',serif" }}>Still thinking...</div>
                    }
                  </div>
                  <button className="btn" onClick={()=>toggleLike(m.uid)} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:8,borderRadius:8,background:isLiked?"rgba(249,115,22,0.1)":"rgba(255,255,255,0.03)",border:isLiked?"1px solid rgba(249,115,22,0.3)":"1px solid rgba(255,255,255,0.06)",cursor:"pointer",flexShrink:0 }}>
                    <span style={{ fontSize:16,lineHeight:1,filter:isLiked?"none":"grayscale(1) opacity(0.3)" }}>&#9829;</span>
                    <span style={{ fontSize:10,fontWeight:600,color:isLiked?"#f97316":"rgba(255,255,255,0.22)" }}>{count}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── INVITE ─────────────────────────────────────── */}
        <div style={{ marginTop:24, textAlign:"center" }}>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)", marginBottom:10 }}>More people = bigger pot</div>
          <button className="btn" onClick={copyInvite} style={{ padding:"12px 28px",background:copied?"rgba(52,211,153,0.09)":"rgba(251,191,36,0.06)",border:copied?"1px solid #34d399":"1px solid rgba(251,191,36,0.15)",color:copied?"#34d399":"rgba(251,191,36,0.6)",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif" }}>
            {copied ? "Link copied!" : "Copy invite link"}
          </button>
        </div>

        {/* ── PAST WINNERS ───────────────────────────────── */}
        {history.length > 1 && (
          <div style={{ marginTop:28 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:"rgba(251,191,36,0.4)", letterSpacing:"0.15em", marginBottom:12 }}>PAST WINNERS</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {history.slice(1).map((h,i)=>(
                <div key={h.id} style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:16,fontWeight:600 }}>{h.winnerName}</div>
                    <div style={{ fontSize:11,color:"rgba(255,255,255,0.25)" }}>{h.month}</div>
                  </div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#fbbf24" }}>${h.amount}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FINE PRINT ─────────────────────────────────── */}
        <div style={{ marginTop:32, fontSize:11, color:"rgba(255,255,255,0.18)", lineHeight:1.7, textAlign:"center" }}>
          NooBall is a community savings pool (ROSCA). No house cut, no fees.
          Payouts are peer-to-peer via Venmo on an honor system.
          You can delete your account anytime from your profile.
        </div>
      </div>
    </div>
  );
}
