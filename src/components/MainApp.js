import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { collection, doc, onSnapshot, updateDoc, query, orderBy, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { auth, db, ADMIN_EMAIL, getTiers } from "../firebase";
import { Nooball, useCountdown, pad, hsl, ini, Confetti } from "../App";
import WinnerModal     from "./WinnerModal";
import PinkySwearModal from "./PinkySwearModal";
import WishInput       from "./WishInput";
import HomescreenPrompt from "./HomescreenPrompt";

function TierCard({ tier, members, myData, isAdmin, onDraw }) {
  const cd     = useCountdown(tier.next);
  const paid   = members.filter(m=>m.paid?.[tier.id]);
  const pot    = (paid.length * tier.amount).toFixed(2);
  const potD   = parseFloat(pot)%1===0?`$${parseInt(pot)}`:`$${pot}`;
  const odds   = paid.length>0?((1/paid.length)*100).toFixed(1):"0.0";
  const isPaid = myData?.paid?.[tier.id];

  return (
    <div style={{ background:"rgba(255,255,255,0.03)",border:`1px solid ${tier.color}25`,borderRadius:14,padding:"14px 16px",position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${tier.color},transparent)` }}/>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:"rgba(255,255,255,0.4)",letterSpacing:"0.14em",marginBottom:2 }}>{tier.label.toUpperCase()}</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:tier.color,letterSpacing:"0.04em",lineHeight:1 }}>{potD}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:3 }}>{paid.length} in · your odds {odds}%</div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
          {isPaid
            ?<div style={{ fontSize:11,fontWeight:600,color:"#34d399",background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:20,padding:"3px 10px",fontFamily:"'DM Sans',sans-serif" }}>✓ In</div>
            :<div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:tier.color,background:`${tier.color}12`,border:`1px solid ${tier.color}28`,borderRadius:20,padding:"3px 10px",letterSpacing:"0.04em" }}>
              {tier.amount<1?`¢${Math.round(tier.amount*100)}`:`$${tier.amount}`}
            </div>}
        </div>
      </div>
      <div style={{ display:"flex",gap:5 }}>
        {[["d","d"],["h","h"],["m","m"],["s","s"]].map(([k,l])=>(
          <div key={k} style={{ flex:1,textAlign:"center" }}>
            <div style={{ background:"rgba(0,0,0,0.3)",borderRadius:6,padding:"5px 2px",fontFamily:"'DM Mono',monospace",fontSize:16,fontWeight:500,color:"#fff",lineHeight:1 }}>{pad(cd[k])}</div>
            <div style={{ fontSize:8,color:"rgba(255,255,255,0.25)",marginTop:2,textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif" }}>{l}</div>
          </div>
        ))}
      </div>
      {isAdmin&&paid.length>0&&(
        <button onClick={()=>onDraw(tier)} style={{ width:"100%",marginTop:10,padding:"9px",background:`${tier.color}18`,border:`1px solid ${tier.color}40`,borderRadius:8,color:tier.color,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" }}>
          Draw {tier.label} winner ⚾
        </button>
      )}
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

  useEffect(() => {
    const q = query(collection(db,"users"),orderBy("joinedAt","asc"));
    return onSnapshot(q,snap=>{
      const data = snap.docs.map(d=>({id:d.id,...d.data()}));
      setMembers(data);
      const me = data.find(m=>m.uid===user.uid);
      if (me) {
        setMyData(me);
        // Show homescreen prompt once to new users
        if (me.seenHomescreen===false) setShowHS(true);
      }
    });
  },[user.uid]);

  useEffect(()=>{
    const q = query(collection(db,"history"),orderBy("drawnAt","desc"));
    return onSnapshot(q,snap=>setHistory(snap.docs.map(d=>({id:d.id,...d.data()}))));
  },[]);

  const markPaid = async tierId => {
    const tier = tiers.find(t=>t.id===tierId);
    const newPaid = {...(myData?.paid||{}),[tierId]:true};
    await updateDoc(doc(db,"users",user.uid),{paid:newPaid,streak:(myData?.streak||0)+1});
    setPinkyModal(tier);
  };

  const toggleLike = async memberId => {
    if (memberId===user.uid) return;
    const newLikes = {...(myData?.likes||{}),[memberId]:!myData?.likes?.[memberId]};
    await updateDoc(doc(db,"users",user.uid),{likes:newLikes});
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
    await Promise.all(all.docs.map(d=>{
      const pd={...(d.data().paid||{})}; delete pd[tier.id];
      return updateDoc(d.ref,{paid:pd});
    }));
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
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;}
        @keyframes fade-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounce-in{0%{transform:scale(0.6);opacity:0}65%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(124,58,237,0.3)}50%{box-shadow:0 0 40px rgba(124,58,237,0.55)}}
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
      <div style={{ background:"linear-gradient(160deg,#12063a,#0d0520 45%,#0a0a0f)", padding:"18px 20px 22px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse at 80% 0%,rgba(124,58,237,0.12),transparent 60%)",pointerEvents:"none" }}/>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:recent?12:0,position:"relative" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <Nooball size={34} spin="slow"/>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:"0.06em",lineHeight:1,color:"#fff" }}>NOO<span style={{ color:"#a78bfa" }}>BALL</span></div>
              <div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:1 }}>everybody chips in · one person wins</div>
            </div>
          </div>
          <button className="btn" onClick={()=>signOut(auth)} style={{ fontSize:11,color:"rgba(255,255,255,0.2)",background:"transparent",padding:0,fontFamily:"inherit" }}>sign out</button>
        </div>
        {recent&&(
          <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:"rgba(167,139,250,0.07)",border:"1px solid rgba(167,139,250,0.15)",borderRadius:20,padding:"4px 12px",marginTop:10,fontSize:12,color:"rgba(167,139,250,0.7)",fontFamily:"'DM Sans',sans-serif" }}>
            <span style={{ width:5,height:5,borderRadius:"50%",background:"#a78bfa",display:"inline-block",boxShadow:"0 0 5px #a78bfa" }}/>
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
        {tab==="home"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:14,animation:"fade-up 0.3s ease" }}>

            {/* Latest winner banner */}
            {latestWinner&&(
              <div style={{ background:"rgba(167,139,250,0.07)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:12,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em",marginBottom:2 }}>LAST WINNER · {latestWinner.tierLabel}</div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#fff",letterSpacing:"0.03em" }}>🏆 {latestWinner.winnerName}</div>
                  {latestWinner.winnerWish&&<div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:2 }}>"{latestWinner.winnerWish}"</div>}
                </div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#a78bfa",letterSpacing:"0.04em" }}>${latestWinner.amount}</div>
              </div>
            )}

            {/* Sponsored */}
            <div style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.18)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2,fontFamily:"'DM Sans',sans-serif" }}>Sponsored</div>
                <div style={{ fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.6)",fontFamily:"'DM Sans',sans-serif" }}>Free money transfers</div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.3)",fontFamily:"'DM Sans',sans-serif" }}>Send your winnings with Zello Pay</div>
              </div>
              <div style={{ fontSize:12,fontWeight:700,color:"#a78bfa",whiteSpace:"nowrap",marginLeft:12,fontFamily:"'DM Sans',sans-serif" }}>Try free →</div>
            </div>

            {/* Tiers */}
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:"rgba(255,255,255,0.3)",letterSpacing:"0.15em",marginBottom:10 }}>LIVE DRAWINGS</div>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {tiers.map(tier=>{
                  const isPaid=myData?.paid?.[tier.id];
                  return(
                    <div key={tier.id}>
                      <TierCard tier={tier} members={members} myData={myData} isAdmin={isAdmin} onDraw={runDraw}/>
                      {!isPaid&&(
                        <button className="btn" onClick={()=>markPaid(tier.id)} style={{ width:"100%",marginTop:6,padding:"12px",background:`${tier.color}0d`,border:`1px solid ${tier.color}30`,borderRadius:10,color:tier.color,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif" }}>
                          I'm in for {tier.label} ({tier.amount<1?`¢${Math.round(tier.amount*100)}`:`$${tier.amount}`}) ⚾
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
            {!myData?.venmoHandle&&(
              <div style={{ background:"rgba(167,139,250,0.05)",border:"1px solid rgba(167,139,250,0.15)",borderRadius:14,padding:16 }}>
                <div style={{ fontSize:13,fontWeight:600,color:"rgba(167,139,250,0.8)",marginBottom:4,fontFamily:"'DM Sans',sans-serif" }}>Add your Venmo handle</div>
                <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",marginBottom:10,fontFamily:"'DM Sans',sans-serif" }}>So you can receive your winnings.</div>
                <VenmoInput userId={user.uid} members={members}/>
              </div>
            )}

            {/* Invite */}
            <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:16 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:"0.04em",marginBottom:4,color:"#f5f0e8" }}>INVITE FRIENDS, GROW THE BALL ⚾</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.35)",marginBottom:14,lineHeight:1.6,fontFamily:"'DM Sans',sans-serif" }}>Every new member adds to every pot. Your odds stay the same — the prizes don't.</div>
              <button className="btn" onClick={copyInvite} style={{ width:"100%",padding:12,background:copied?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.04)",border:copied?"1px solid #34d399":"1px solid rgba(255,255,255,0.08)",color:copied?"#34d399":"rgba(255,255,255,0.55)",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif" }}>
                {copied?"✓ Invite link copied!":"Copy your invite link"}
              </button>
            </div>
          </div>
        )}

        {/* WISHES */}
        {tab==="wishes"&&(
          <div style={{ animation:"fade-up 0.3s ease" }}>
            <div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:13,color:"rgba(255,255,255,0.3)",marginBottom:16 }}>What members would do with the money. Heart the ones that move you ♥</div>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {sortedMembers.map((m,i)=>{
                const count=getLikeCount(m.uid),isLiked=myData?.likes?.[m.uid],isTop=i===0&&count>0;
                const color=hsl(members.findIndex(x=>x.uid===m.uid));
                const anyPaid=Object.values(m.paid||{}).some(Boolean);
                return(
                  <div key={m.uid} style={{ background:isTop?"rgba(167,139,250,0.06)":"rgba(255,255,255,0.03)",border:isTop?"1px solid rgba(167,139,250,0.22)":"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px 16px",opacity:anyPaid?1:0.45 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:m.wish?10:0 }}>
                      <div style={{ width:38,height:38,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0,fontFamily:"'DM Sans',sans-serif" }}>{ini(m.name)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
                          <span style={{ fontSize:14,fontWeight:600,fontFamily:"'DM Sans',sans-serif" }}>{m.name}</span>
                          {m.uid===user.uid&&<span style={{ fontSize:10,color:"#a78bfa",background:"rgba(167,139,250,0.12)",borderRadius:4,padding:"1px 6px",fontFamily:"'DM Sans',sans-serif" }}>you</span>}
                          {isTop&&<span style={{ fontSize:10,background:"rgba(167,139,250,0.12)",color:"#a78bfa",borderRadius:4,padding:"2px 6px",fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>TOP ♥</span>}
                        </div>
                        <div style={{ fontSize:11,color:"rgba(255,255,255,0.22)",fontFamily:"'DM Sans',sans-serif" }}>🔥 {m.streak||0}-month streak</div>
                      </div>
                      <button className="btn" onClick={()=>toggleLike(m.uid)} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:8,borderRadius:8,background:isLiked?"rgba(244,114,182,0.12)":"rgba(255,255,255,0.04)",border:isLiked?"1px solid rgba(244,114,182,0.35)":"1px solid rgba(255,255,255,0.07)",cursor:m.uid===user.uid?"default":"pointer" }}>
                        <span style={{ fontSize:18,lineHeight:1,filter:isLiked?"none":"grayscale(1) opacity(0.35)" }}>♥</span>
                        <span style={{ fontSize:10,fontWeight:600,color:isLiked?"#f472b6":"rgba(255,255,255,0.25)",fontFamily:"'DM Sans',sans-serif" }}>{count}</span>
                      </button>
                    </div>
                    {m.wish
                      ?<div style={{ fontSize:14,color:"rgba(255,255,255,0.7)",fontFamily:"'Lora',serif",fontStyle:"italic",lineHeight:1.55,paddingLeft:48 }}>"{m.wish}"</div>
                      :<div style={{ fontSize:12,color:"rgba(255,255,255,0.18)",fontStyle:"italic",paddingLeft:48,fontFamily:"'Lora',serif" }}>No wish yet…</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WINNERS */}
        {tab==="winners"&&(
          <div style={{ animation:"fade-up 0.3s ease",display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:13,color:"rgba(255,255,255,0.3)",marginBottom:4 }}>Every dollar comes back. Here's proof.</div>
            {history.length===0&&(
              <div style={{ textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.2)" }}>
                <Nooball size={52} spin="fast"/>
                <div style={{ marginTop:16,fontSize:14,fontFamily:"'Lora',serif",fontStyle:"italic" }}>No draws yet — the first one's coming soon.</div>
              </div>
            )}
            {history.map((h,i)=>(
              <div key={h.id} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18,borderLeft:`3px solid ${winColors[i%5]}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                  <div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:"rgba(255,255,255,0.22)",marginBottom:4,letterSpacing:"0.1em" }}>{h.tierLabel?.toUpperCase()} · {h.month}</div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#fff",letterSpacing:"0.03em" }}>🏆 {h.winnerName}</div>
                    {h.winnerVenmo&&<div style={{ fontSize:12,color:"#a78bfa",marginTop:2,fontFamily:"'DM Sans',sans-serif" }}>@{h.winnerVenmo}</div>}
                  </div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:winColors[i%5],letterSpacing:"0.04em" }}>${h.amount}</div>
                </div>
                {h.winnerWish&&<div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",fontStyle:"italic",fontFamily:"'Lora',serif",borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:10 }}>"{h.winnerWish}"</div>}
              </div>
            ))}
            <div style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:14,marginTop:4 }}>
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.18)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4,fontFamily:"'DM Sans',sans-serif" }}>Sponsored</div>
              <div style={{ fontSize:14,fontWeight:600,color:"rgba(255,255,255,0.7)",fontFamily:"'DM Sans',sans-serif" }}>Make your winnings work harder.</div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",marginBottom:6,fontFamily:"'DM Sans',sans-serif" }}>High-yield savings with Vault Bank.</div>
              <div style={{ fontSize:13,fontWeight:700,color:"#a78bfa",fontFamily:"'DM Sans',sans-serif" }}>Open an account →</div>
            </div>
          </div>
        )}

        {/* HOW */}
        {tab==="how"&&(
          <div style={{ animation:"fade-up 0.3s ease",display:"flex",flexDirection:"column",gap:14 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:32,color:"#fff",letterSpacing:"0.04em",lineHeight:1.1,marginBottom:4 }}>
              SIMPLE BY DESIGN.<br/><span style={{ fontFamily:"'Lora',serif",fontSize:22,fontStyle:"italic",fontWeight:400,color:"rgba(255,255,255,0.4)",letterSpacing:"0",textTransform:"none" }}>Powerful by community.</span>
            </div>
            {[
              {n:"01",t:"Everyone chips in",b:"Pick your drawing — daily, weekly, monthly, or yearly. Throw in your dollar. You're in the pool."},
              {n:"02",t:"The ball gets bigger",b:"Every person who joins adds to the pot. The more the pool grows, the more someone catches. Your odds stay the same — the prize doesn't."},
              {n:"03",t:"One person catches the NooBall",b:"When the timer hits zero, one member is randomly selected to receive the entire pot. That's their NooBall."},
              {n:"04",t:"Honor system, always",b:"NooBall doesn't take a cut. Ever. The winner posts their Venmo. Everyone sends. That's it."},
            ].map(s=>(
              <div key={s.n} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18,display:"flex",gap:14,alignItems:"flex-start" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:"#a78bfa",opacity:0.5,paddingTop:1,flexShrink:0,letterSpacing:"0.08em" }}>{s.n}</div>
                <div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:17,color:"#fff",letterSpacing:"0.04em",marginBottom:5 }}>{s.t.toUpperCase()}</div>
                  <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.65,fontFamily:"'DM Sans',sans-serif" }}>{s.b}</div>
                </div>
              </div>
            ))}
            <div style={{ background:"rgba(167,139,250,0.05)",border:"1px solid rgba(167,139,250,0.15)",borderRadius:14,padding:18 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:"#a78bfa",letterSpacing:"0.06em",marginBottom:6 }}>IS THIS LEGAL? 🤔</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.7,fontFamily:"'DM Sans',sans-serif" }}>NooBall is modeled after a ROSCA — a Rotating Savings and Credit Association. One of the world's oldest financial tools. No house cut. No fees. Every dollar in comes back out to a member.</div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(10,10,15,0.97)",backdropFilter:"blur(12px)",borderTop:"1px solid rgba(167,139,250,0.1)",display:"flex",padding:"10px 0 18px",zIndex:100 }}>
        {[{id:"home",icon:"⬡",l:"Home"},{id:"wishes",icon:"♥",l:"Wishes"},{id:"winners",icon:"◎",l:"Winners"},{id:"how",icon:"?",l:"How"}].map(n=>(
          <button key={n.id} className="btn" onClick={()=>setTab(n.id)} style={{ flex:1,background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:tab===n.id?"#a78bfa":"rgba(255,255,255,0.22)" }}>
            <span style={{ fontSize:17,lineHeight:1 }}>{n.icon}</span>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:10,fontWeight:tab===n.id?700:400,letterSpacing:"0.1em" }}>{n.l.toUpperCase()}</span>
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
    if (members.filter(m=>m.uid!==userId&&m.venmoHandle===clean).length>0) { setError("That Venmo handle is already registered."); return; }
    await updateDoc(doc(db,"users",userId),{venmoHandle:clean});
    setSaved(true);
  };
  return (
    <div>
      <div style={{ display:"flex",gap:8 }}>
        <input placeholder="@yourvenmo" value={handle} onChange={e=>{setHandle(e.target.value);setError("");}} style={{ flex:1,padding:"10px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#fff",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none" }}/>
        <button onClick={save} style={{ padding:"10px 16px",background:saved?"rgba(52,211,153,0.15)":"rgba(167,139,250,0.12)",border:saved?"1px solid #34d399":"1px solid rgba(167,139,250,0.25)",borderRadius:10,color:saved?"#34d399":"#a78bfa",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap" }}>
          {saved?"✓ Saved":"Save"}
        </button>
      </div>
      {error&&<div style={{ fontSize:11,color:"#f87171",marginTop:4,fontFamily:"'DM Sans',sans-serif" }}>{error}</div>}
    </div>
  );
}
