import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { collection, doc, onSnapshot, updateDoc, query, orderBy, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { auth, db, ADMIN_EMAIL, getTiers } from "../firebase";
import { Nooball, useCountdown, pad, hsl, ini, Confetti } from "../App";
import WinnerModal      from "./WinnerModal";
import PinkySwearModal  from "./PinkySwearModal";
import WishInput        from "./WishInput";
import HomescreenPrompt from "./HomescreenPrompt";

function TierCard({ tier, members, myData, isAdmin, onDraw }) {
  const cd     = useCountdown(tier.next);
  const paid   = members.filter(m=>m.paid?.[tier.id]);
  const pot    = (paid.length * tier.amount).toFixed(2);
  const potD   = parseFloat(pot)%1===0 ? `$${parseInt(pot)}` : `$${pot}`;
  const odds   = paid.length>0 ? ((1/paid.length)*100).toFixed(1) : "—";
  const isPaid = myData?.paid?.[tier.id];

  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${tier.color}22`, borderRadius:14, overflow:"hidden" }}>
      {/* Color accent top bar */}
      <div style={{ height:2, background:`linear-gradient(90deg,${tier.color},transparent)` }}/>
      <div style={{ padding:"14px 16px" }}>
        {/* Header row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:"rgba(255,255,255,0.38)", letterSpacing:"0.14em", marginBottom:4 }}>{tier.label.toUpperCase()} DRAWING</div>
            {/* Pool total — prominent */}
            <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:tier.color, letterSpacing:"0.04em", lineHeight:1 }}>{potD}</span>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.35)", fontFamily:"'DM Sans',sans-serif" }}>total pool</span>
            </div>
            {/* Entry fee — secondary */}
            <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:4 }}>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"'DM Sans',sans-serif" }}>
                {tier.amount<1?`¢${Math.round(tier.amount*100)}`:`$${tier.amount}`} to enter
              </span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.18)", fontFamily:"'DM Sans',sans-serif" }}>·</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"'DM Sans',sans-serif" }}>
                {paid.length} {paid.length===1?"player":"players"}
              </span>
              {odds !== "—" && <>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.18)" }}>·</span>
                <span style={{ fontSize:11, color:tier.color, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>
                  {odds}% odds
                </span>
              </>}
            </div>
          </div>
          {isPaid && (
            <div style={{ fontSize:11, fontWeight:600, color:"#34d399", background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:20, padding:"4px 10px", fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
              ✓ You're in
            </div>
          )}
        </div>

        {/* Countdown */}
        <div style={{ display:"flex", gap:5, marginBottom: isAdmin&&paid.length>0 ? 10 : 0 }}>
          {[["d","days"],["h","hrs"],["m","min"],["s","sec"]].map(([k,l])=>(
            <div key={k} style={{ flex:1, textAlign:"center" }}>
              <div style={{ background:"rgba(0,0,0,0.35)", borderRadius:6, padding:"6px 2px", fontFamily:"'DM Mono',monospace", fontSize:18, fontWeight:500, color:"#fff", lineHeight:1 }}>{pad(cd[k])}</div>
              <div style={{ fontSize:8, color:"rgba(255,255,255,0.22)", marginTop:3, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.06em" }}>{l}</div>
            </div>
          ))}
        </div>

        {isAdmin && paid.length>0 && (
          <button onClick={()=>onDraw(tier)} style={{ width:"100%", padding:"9px", background:`${tier.color}14`, border:`1px solid ${tier.color}35`, borderRadius:8, color:tier.color, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            Draw {tier.label} winner ⚾
          </button>
        )}
      </div>
    </div>
  );
}

export default function MainApp({ user }) {
  const [tab, setTab]               = useState("home");
  const [members, setMembers]       = useState([]);
  const [history, setHistory]       = useState([]);
  const [myData, setMyData]         = useState(null);
  const [copied, setCopied]         = useState(false);
  const [winnerModal, setWinnerModal] = useState(null);
  const [pinkyModal, setPinkyModal] = useState(null);
  const [confettiActive, setConf]   = useState(false);
  const [showHomescreen, setShowHS] = useState(false);
  const tiers   = getTiers();
  const isAdmin = user.email === ADMIN_EMAIL;

  useEffect(()=>{
    const q = query(collection(db,"users"),orderBy("joinedAt","asc"));
    return onSnapshot(q,snap=>{
      const data = snap.docs.map(d=>({id:d.id,...d.data()}));
      setMembers(data);
      const me = data.find(m=>m.uid===user.uid);
      if (me) { setMyData(me); if(me.seenHomescreen===false) setShowHS(true); }
    });
  },[user.uid]);

  useEffect(()=>{
    const q = query(collection(db,"history"),orderBy("drawnAt","desc"));
    return onSnapshot(q,snap=>setHistory(snap.docs.map(d=>({id:d.id,...d.data()}))));
  },[]);

  const markPaid = async tierId => {
    const tier = tiers.find(t=>t.id===tierId);
    await updateDoc(doc(db,"users",user.uid),{ paid:{...(myData?.paid||{}),[tierId]:true}, streak:(myData?.streak||0)+1 });
    setPinkyModal(tier);
  };

  const toggleLike = async memberId => {
    if (memberId===user.uid) return;
    await updateDoc(doc(db,"users",user.uid),{ likes:{...(myData?.likes||{}),[memberId]:!myData?.likes?.[memberId]} });
  };

  const getLikeCount = uid => members.filter(m=>m.likes?.[uid]).length;

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}?ref=${user.uid}`).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false),2500);
  };

  const runDraw = async tier => {
    const paid = members.filter(m=>m.paid?.[tier.id]);
    if (!paid.length) return;
    const winner = paid[Math.floor(Math.random()*paid.length)];
    const pot    = (paid.length*tier.amount).toFixed(2);
    await addDoc(collection(db,"history"),{
      winnerId:winner.uid, winnerName:winner.name, winnerWish:winner.wish||"",
      winnerVenmo:winner.venmoHandle||"", amount:parseFloat(pot),
      tierAmount:tier.amount, tierId:tier.id, tierLabel:tier.label,
      members:paid.length, drawnAt:serverTimestamp(),
      month:new Date().toLocaleString("default",{month:"long",year:"numeric"}),
    });
    const all = await getDocs(collection(db,"users"));
    await Promise.all(all.docs.map(d=>{ const pd={...(d.data().paid||{})}; delete pd[tier.id]; return updateDoc(d.ref,{paid:pd}); }));
    setConf(true); setTimeout(()=>setConf(false),5500);
    setWinnerModal({winner,pot,tier});
  };

  const recent        = members.filter(m=>m.uid!==user.uid).slice(-1)[0];
  const sortedMembers = [...members].sort((a,b)=>getLikeCount(b.uid)-getLikeCount(a.uid));
  const winColors     = ["#a78bfa","#f472b6","#60a5fa","#34d399","#fb923c"];
  const latestWinner  = history[0];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#0a0a0f", minHeight:"100vh", maxWidth:430, margin:"0 auto", display:"flex", flexDirection:"column", color:"#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Lora:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;}
        @keyframes fade-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounce-in{0%{transform:scale(0.6);opacity:0}65%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        .btn{transition:all 0.15s;cursor:pointer;border:none;}
        .btn:active{transform:scale(0.96);}
        ::-webkit-scrollbar{width:0;}
        input,textarea{outline:none;}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.22);}
      `}</style>

      <Confetti active={confettiActive}/>
      {showHomescreen && <HomescreenPrompt userId={user.uid} onDismiss={()=>setShowHS(false)}/>}
      {winnerModal && <WinnerModal winner={winnerModal.winner} pot={winnerModal.pot} tier={winnerModal.tier} currentUserId={user.uid} onClose={()=>setWinnerModal(null)}/>}
      {pinkyModal  && <PinkySwearModal tierLabel={pinkyModal.label} amount={pinkyModal.amount} onClose={()=>setPinkyModal(null)}/>}

      {/* HEADER */}
      <div style={{ background:"linear-gradient(160deg,#110828,#0a0a0f)", padding:"18px 20px 20px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse at 80% 0%,rgba(124,58,237,0.1),transparent 55%)",pointerEvents:"none" }}/>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <Nooball size={34} spin="slow"/>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:"0.06em", lineHeight:1, color:"#fff" }}>NOO<span style={{ color:"#a78bfa" }}>BALL</span></div>
              <div style={{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:11, color:"rgba(255,255,255,0.28)", marginTop:1 }}>everybody chips in · one person wins</div>
            </div>
          </div>
          <button className="btn" onClick={()=>signOut(auth)} style={{ fontSize:11,color:"rgba(255,255,255,0.18)",background:"transparent",padding:0,fontFamily:"inherit" }}>sign out</button>
        </div>
        {recent && (
          <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.12)",borderRadius:20,padding:"4px 12px",marginTop:12,fontSize:12,color:"rgba(167,139,250,0.65)",fontFamily:"'DM Sans',sans-serif" }}>
            <span style={{ width:5,height:5,borderRadius:"50%",background:"#a78bfa",display:"inline-block",boxShadow:"0 0 4px #a78bfa" }}/>
            👋 {recent.name} just joined
          </div>
        )}
      </div>

      <div style={{ height:1,background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.15),transparent)" }}/>

      {/* TABS */}
      <div style={{ display:"flex",background:"#0a0a0f",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"0 4px" }}>
        {[{id:"home",l:"Home"},{id:"wishes",l:"Wishes"},{id:"winners",l:"Winners"},{id:"how",l:"How it works"}].map(t=>(
          <button key={t.id} className="btn" onClick={()=>setTab(t.id)} style={{ flex:1,padding:"12px 2px",background:"transparent",borderBottom:`2px solid ${tab===t.id?"#a78bfa":"transparent"}`,color:tab===t.id?"#a78bfa":"rgba(255,255,255,0.3)",fontSize:11,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase" }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex:1,overflowY:"auto",padding:"18px 16px 100px" }}>

        {/* HOME */}
        {tab==="home" && (
          <div style={{ display:"flex",flexDirection:"column",gap:14,animation:"fade-up 0.3s ease" }}>

            {/* Latest winner */}
            {latestWinner && (
              <div style={{ background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.16)",borderRadius:12,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",marginBottom:2 }}>LAST {latestWinner.tierLabel?.toUpperCase()} WINNER</div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#fff",letterSpacing:"0.03em" }}>🏆 {latestWinner.winnerName}</div>
                  {latestWinner.winnerWish && <div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:12,color:"rgba(255,255,255,0.38)",marginTop:2 }}>"{latestWinner.winnerWish}"</div>}
                </div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#a78bfa",letterSpacing:"0.04em" }}>${latestWinner.amount}</div>
              </div>
            )}

            {/* Tiers */}
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:"rgba(255,255,255,0.28)",letterSpacing:"0.15em",marginBottom:10 }}>LIVE DRAWINGS</div>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {tiers.map(tier=>{
                  const isPaid=myData?.paid?.[tier.id];
                  return (
                    <div key={tier.id}>
                      <TierCard tier={tier} members={members} myData={myData} isAdmin={isAdmin} onDraw={runDraw}/>
                      {!isPaid && (
                        <button className="btn" onClick={()=>markPaid(tier.id)} style={{ width:"100%",marginTop:6,padding:"12px",background:`${tier.color}0c`,border:`1px solid ${tier.color}28`,borderRadius:10,color:tier.color,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s" }}>
                          I'm in for {tier.label} — {tier.amount<1?`¢${Math.round(tier.amount*100)}`:`$${tier.amount}`} ⚾
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Wish */}
            <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:16 }}>
              <WishInput userId={user.uid} currentWish={myData?.wish}/>
            </div>

            {/* Venmo */}
            {!myData?.venmoHandle && (
              <div style={{ background:"rgba(167,139,250,0.04)",border:"1px solid rgba(167,139,250,0.14)",borderRadius:14,padding:16 }}>
                <div style={{ fontSize:13,fontWeight:600,color:"rgba(167,139,250,0.8)",marginBottom:3 }}>Add your Venmo</div>
                <div style={{ fontSize:12,color:"rgba(255,255,255,0.28)",marginBottom:10,lineHeight:1.5 }}>If you win, this is how you collect. Add it now so you're ready.</div>
                <VenmoInput userId={user.uid} members={members}/>
              </div>
            )}

            {/* Invite */}
            <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:16 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:"0.04em",marginBottom:5,color:"#f5f0e8" }}>GROW THE BALL ⚾</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.35)",marginBottom:14,lineHeight:1.6 }}>Every friend you bring adds to every pot. Your odds don't change — the winnings do.</div>
              <button className="btn" onClick={copyInvite} style={{ width:"100%",padding:12,background:copied?"rgba(52,211,153,0.09)":"rgba(255,255,255,0.04)",border:copied?"1px solid #34d399":"1px solid rgba(255,255,255,0.08)",color:copied?"#34d399":"rgba(255,255,255,0.5)",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif" }}>
                {copied ? "✓ Link copied — send it!" : "Copy invite link"}
              </button>
            </div>
          </div>
        )}

        {/* WISHES */}
        {tab==="wishes" && (
          <div style={{ animation:"fade-up 0.3s ease" }}>
            <div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:13,color:"rgba(255,255,255,0.3)",marginBottom:16,lineHeight:1.5 }}>
              What everyone's planning to do with the money. Heart the ones that get you.
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {sortedMembers.map((m,i)=>{
                const count=getLikeCount(m.uid),isLiked=myData?.likes?.[m.uid],isTop=i===0&&count>0;
                const color=hsl(members.findIndex(x=>x.uid===m.uid));
                const anyPaid=Object.values(m.paid||{}).some(Boolean);
                return (
                  <div key={m.uid} style={{ background:isTop?"rgba(167,139,250,0.05)":"rgba(255,255,255,0.03)",border:isTop?"1px solid rgba(167,139,250,0.2)":"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px 16px",opacity:anyPaid?1:0.4 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:m.wish?10:0 }}>
                      <div style={{ width:38,height:38,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0 }}>{ini(m.name)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
                          <span style={{ fontSize:14,fontWeight:600 }}>{m.name}</span>
                          {m.uid===user.uid && <span style={{ fontSize:10,color:"#a78bfa",background:"rgba(167,139,250,0.1)",borderRadius:4,padding:"1px 6px" }}>you</span>}
                          {isTop && <span style={{ fontSize:10,background:"rgba(167,139,250,0.1)",color:"#a78bfa",borderRadius:4,padding:"2px 6px",fontWeight:700 }}>crowd favorite ♥</span>}
                        </div>
                        <div style={{ fontSize:11,color:"rgba(255,255,255,0.2)" }}>🔥 {m.streak||0}-month streak</div>
                      </div>
                      <button className="btn" onClick={()=>toggleLike(m.uid)} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:8,borderRadius:8,background:isLiked?"rgba(244,114,182,0.1)":"rgba(255,255,255,0.03)",border:isLiked?"1px solid rgba(244,114,182,0.3)":"1px solid rgba(255,255,255,0.06)",cursor:m.uid===user.uid?"default":"pointer" }}>
                        <span style={{ fontSize:18,lineHeight:1,filter:isLiked?"none":"grayscale(1) opacity(0.3)" }}>♥</span>
                        <span style={{ fontSize:10,fontWeight:600,color:isLiked?"#f472b6":"rgba(255,255,255,0.22)" }}>{count}</span>
                      </button>
                    </div>
                    {m.wish
                      ? <div style={{ fontSize:14,color:"rgba(255,255,255,0.7)",fontFamily:"'Lora',serif",fontStyle:"italic",lineHeight:1.55,paddingLeft:48 }}>"{m.wish}"</div>
                      : <div style={{ fontSize:12,color:"rgba(255,255,255,0.16)",fontStyle:"italic",paddingLeft:48,fontFamily:"'Lora',serif" }}>Still thinking…</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WINNERS */}
        {tab==="winners" && (
          <div style={{ animation:"fade-up 0.3s ease",display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:13,color:"rgba(255,255,255,0.3)",marginBottom:4 }}>Every dollar that went in came back out. No exceptions.</div>
            {history.length===0 && (
              <div style={{ textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.2)" }}>
                <Nooball size={52} spin="fast"/>
                <div style={{ marginTop:16,fontSize:14,fontFamily:"'Lora',serif",fontStyle:"italic" }}>Nobody's won yet. Could be you.</div>
              </div>
            )}
            {history.map((h,i)=>(
              <div key={h.id} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18,borderLeft:`3px solid ${winColors[i%5]}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                  <div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:"rgba(255,255,255,0.22)",marginBottom:4,letterSpacing:"0.1em" }}>{h.tierLabel?.toUpperCase()} · {h.month}</div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#fff",letterSpacing:"0.03em" }}>🏆 {h.winnerName}</div>
                    {h.winnerVenmo && <div style={{ fontSize:12,color:"#a78bfa",marginTop:2 }}>@{h.winnerVenmo}</div>}
                  </div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:winColors[i%5],letterSpacing:"0.04em" }}>${h.amount}</div>
                </div>
                {h.winnerWish && <div style={{ fontSize:13,color:"rgba(255,255,255,0.38)",fontStyle:"italic",fontFamily:"'Lora',serif",borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:10 }}>"{h.winnerWish}"</div>}
              </div>
            ))}
          </div>
        )}

        {/* HOW IT WORKS */}
        {tab==="how" && (
          <div style={{ animation:"fade-up 0.3s ease",display:"flex",flexDirection:"column",gap:14 }}>
            <div style={{ marginBottom:8 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:"#fff",letterSpacing:"0.04em",lineHeight:1.1 }}>OK SO HERE'S THE DEAL.</div>
              <div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:15,color:"rgba(255,255,255,0.4)",marginTop:6,lineHeight:1.5 }}>It's stupidly simple. That's the point.</div>
            </div>

            {[
              { n:"01", t:"You throw in a buck", b:"Pick a drawing — daily for a quarter, weekly for a dollar, monthly for two, yearly for ten. Chip in. You're in the pool." },
              { n:"02", t:"The pot grows", b:"Every person who joins adds to it. More people means more money in the cup — your odds don't change, but the prize does." },
              { n:"03", t:"Someone catches the NooBall", b:"When time's up, one person gets randomly selected and walks away with everything in the pool. That person could be you." },
              { n:"04", t:"It's the honor system", b:"We don't take a cut. There are no fees. The winner posts their Venmo, everyone sends. Simple as that. Don't be the person who doesn't send." },
            ].map(s=>(
              <div key={s.n} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18,display:"flex",gap:14,alignItems:"flex-start" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:"#a78bfa",opacity:0.45,paddingTop:1,flexShrink:0,letterSpacing:"0.08em" }}>{s.n}</div>
                <div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:17,color:"#fff",letterSpacing:"0.04em",marginBottom:5 }}>{s.t.toUpperCase()}</div>
                  <div style={{ fontSize:13,color:"rgba(255,255,255,0.42)",lineHeight:1.65 }}>{s.b}</div>
                </div>
              </div>
            ))}

            <div style={{ background:"rgba(167,139,250,0.05)",border:"1px solid rgba(167,139,250,0.14)",borderRadius:14,padding:18 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#a78bfa",letterSpacing:"0.06em",marginBottom:6 }}>WAIT, IS THIS LEGAL?</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.7 }}>
                Yeah. NooBall is modeled after something called a ROSCA — a Rotating Savings and Credit Association. Basically the oldest community money game in the world. No house. No cut. Every dollar that comes in goes right back out to a member.
              </div>
            </div>

            <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"rgba(255,255,255,0.7)",letterSpacing:"0.06em",marginBottom:6 }}>WHAT'S THE CATCH?</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.7 }}>
                There isn't one. We're building this for fun and planning to keep it free. If that changes, we'll tell you first. Promise.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(10,10,15,0.97)",backdropFilter:"blur(14px)",borderTop:"1px solid rgba(167,139,250,0.09)",display:"flex",padding:"10px 0 18px",zIndex:100 }}>
        {[{id:"home",icon:"⬡",l:"Home"},{id:"wishes",icon:"♥",l:"Wishes"},{id:"winners",icon:"◎",l:"Winners"},{id:"how",icon:"?",l:"How"}].map(n=>(
          <button key={n.id} className="btn" onClick={()=>setTab(n.id)} style={{ flex:1,background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:tab===n.id?"#a78bfa":"rgba(255,255,255,0.2)" }}>
            <span style={{ fontSize:17,lineHeight:1 }}>{n.icon}</span>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:"0.1em" }}>{n.l.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function VenmoInput({ userId, members }) {
  const [handle, setHandle] = useState("");
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");
  const save = async () => {
    const clean = handle.replace("@","").toLowerCase().trim();
    if (!clean) return;
    if (members.filter(m=>m.uid!==userId&&m.venmoHandle===clean).length>0) { setError("That handle's already taken."); return; }
    await updateDoc(doc(db,"users",userId),{venmoHandle:clean});
    setSaved(true);
  };
  return (
    <div>
      <div style={{ display:"flex",gap:8 }}>
        <input placeholder="@yourvenmo" value={handle} onChange={e=>{setHandle(e.target.value);setError("");}} style={{ flex:1,padding:"10px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#fff",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none" }}/>
        <button onClick={save} style={{ padding:"10px 16px",background:saved?"rgba(52,211,153,0.12)":"rgba(167,139,250,0.1)",border:saved?"1px solid #34d399":"1px solid rgba(167,139,250,0.22)",borderRadius:10,color:saved?"#34d399":"#a78bfa",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap" }}>
          {saved ? "✓ Done" : "Save"}
        </button>
      </div>
      {error && <div style={{ fontSize:11,color:"#f87171",marginTop:4 }}>{error}</div>}
    </div>
  );
}
