import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { collection, doc, onSnapshot, updateDoc, query, orderBy, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { auth, db, ADMIN_EMAIL, getTiers, HONOR_LINES } from "../firebase";
import { Baseball, useCountdown, pad, hsl, ini, Confetti } from "../App";
import WinnerModal    from "./WinnerModal";
import PinkySwearModal from "./PinkySwearModal";
import WishInput      from "./WishInput";

function TierCard({ tier, members, myData, userId, isAdmin, onDraw }) {
  const cd     = useCountdown(tier.next);
  const paid   = members.filter(m => m.paid?.[tier.id]);
  const pot    = (paid.length * tier.amount).toFixed(2);
  const potD   = parseFloat(pot) % 1 === 0 ? `$${parseInt(pot)}` : `$${pot}`;
  const odds   = paid.length > 0 ? ((1/paid.length)*100).toFixed(1) : "0.0";
  const isPaid = myData?.paid?.[tier.id];

  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${tier.color}28`, borderRadius:14, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${tier.color},transparent)` }}/>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
        <div>
          <div style={{ fontFamily:"'Oswald',sans-serif",fontSize:11,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:2 }}>{tier.label}</div>
          <div style={{ fontFamily:"'Fraunces',serif",fontSize:24,fontWeight:700,color:tier.color,lineHeight:1 }}>{potD}</div>
          <div style={{ fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:3 }}>{paid.length} in · your odds {odds}%</div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
          {isPaid
            ? <div style={{ fontSize:11,fontWeight:600,color:"#34d399",background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:20,padding:"3px 10px" }}>✓ In</div>
            : <div style={{ fontSize:12,fontWeight:700,color:tier.color,background:`${tier.color}15`,border:`1px solid ${tier.color}30`,borderRadius:20,padding:"3px 10px" }}>${tier.amount === 0.25 ? "0.25" : tier.amount}</div>
          }
        </div>
      </div>
      <div style={{ display:"flex",gap:5,marginBottom:isPaid||!isAdmin?0:10 }}>
        {[["d","d"],["h","h"],["m","m"],["s","s"]].map(([k,l])=>(
          <div key={k} style={{ flex:1,textAlign:"center" }}>
            <div style={{ background:"rgba(0,0,0,0.3)",borderRadius:6,padding:"5px 2px",fontFamily:"'Oswald',monospace",fontSize:16,fontWeight:600,color:"#fff",lineHeight:1 }}>{pad(cd[k])}</div>
            <div style={{ fontSize:8,color:"rgba(255,255,255,0.25)",marginTop:2,textTransform:"uppercase" }}>{l}</div>
          </div>
        ))}
      </div>
      {isAdmin && paid.length > 0 && (
        <button onClick={()=>onDraw(tier)} style={{ width:"100%",marginTop:10,padding:"9px",background:`${tier.color}22`,border:`1px solid ${tier.color}44`,borderRadius:8,color:tier.color,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
          Draw {tier.label} winner ⚾
        </button>
      )}
    </div>
  );
}

export default function MainApp({ user }) {
  const [tab, setTab]                   = useState("home");
  const [members, setMembers]           = useState([]);
  const [history, setHistory]           = useState([]);
  const [myData, setMyData]             = useState(null);
  const [copied, setCopied]             = useState(false);
  const [winnerModal, setWinnerModal]   = useState(null);
  const [pinkyModal, setPinkyModal]     = useState(null);
  const [confettiActive, setConfetti]   = useState(false);
  const tiers = getTiers(); // fresh every render
  const isAdmin = user.email === ADMIN_EMAIL;

  useEffect(() => {
    const q = query(collection(db,"users"),orderBy("joinedAt","asc"));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d=>({id:d.id,...d.data()}));
      setMembers(data);
      const me = data.find(m=>m.uid===user.uid);
      if (me) setMyData(me);
    });
  },[user.uid]);

  useEffect(() => {
    const q = query(collection(db,"history"),orderBy("drawnAt","desc"));
    return onSnapshot(q, snap => setHistory(snap.docs.map(d=>({id:d.id,...d.data()}))));
  },[]);

  const markPaid = async (tierId) => {
    const tier = tiers.find(t=>t.id===tierId);
    const newPaid = {...(myData?.paid||{}), [tierId]:true};
    await updateDoc(doc(db,"users",user.uid),{ paid:newPaid, streak:(myData?.streak||0)+1 });
    setPinkyModal(tier);
  };

  const toggleLike = async (memberId) => {
    if (memberId===user.uid) return;
    const newLikes = {...(myData?.likes||{}), [memberId]:!myData?.likes?.[memberId]};
    await updateDoc(doc(db,"users",user.uid),{likes:newLikes});
  };

  const getLikeCount = uid => members.filter(m=>m.likes?.[uid]).length;

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}?ref=${user.uid}`).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false),2500);
  };

  const runDraw = async (tier) => {
    const paid = members.filter(m=>m.paid?.[tier.id]);
    if (!paid.length) return;
    const winner = paid[Math.floor(Math.random()*paid.length)];
    const pot    = (paid.length * tier.amount).toFixed(2);
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
    setConfetti(true); setTimeout(()=>setConfetti(false),5500);
    setWinnerModal({winner,pot,tier});
  };

  const recent        = members.filter(m=>m.uid!==user.uid).slice(-1)[0];
  const sortedMembers = [...members].sort((a,b)=>getLikeCount(b.uid)-getLikeCount(a.uid));
  const winColors     = ["#e8d5a3","#e05c2a","#c9b472","#e8a87c","#d4885a"];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#0d0a07", minHeight:"100vh", maxWidth:430, margin:"0 auto", display:"flex", flexDirection:"column", color:"#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,300&family=Oswald:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        @keyframes fade-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounce-in{0%{transform:scale(0.6);opacity:0}65%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(224,92,42,0.3)}50%{box-shadow:0 0 40px rgba(224,92,42,0.6)}}
        .btn{transition:all 0.15s;cursor:pointer;border:none;}
        .btn:active{transform:scale(0.96);}
        ::-webkit-scrollbar{width:0;}
        input,textarea{outline:none;}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.22);}
      `}</style>

      <Confetti active={confettiActive}/>
      {winnerModal && <WinnerModal winner={winnerModal.winner} pot={winnerModal.pot} tier={winnerModal.tier} currentUserId={user.uid} onClose={()=>setWinnerModal(null)} onMarkPaid={()=>{}}/>}
      {pinkyModal  && <PinkySwearModal tierLabel={pinkyModal.label} amount={pinkyModal.amount} onClose={()=>setPinkyModal(null)}/>}

      {/* HEADER */}
      <div style={{ background:"linear-gradient(180deg,#1a1008,#0d0a07)", padding:"18px 20px 22px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",border:"1px dashed rgba(232,213,163,0.06)",pointerEvents:"none" }}/>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:recent?12:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <Baseball size={34} spin="slow"/>
            <div>
              <div style={{ fontFamily:"'Oswald',sans-serif",fontSize:24,fontWeight:700,letterSpacing:"0.05em",lineHeight:1,color:"#f5f0e8",textTransform:"uppercase" }}>NooBall</div>
              <div style={{ fontSize:11,color:"rgba(232,213,163,0.4)",marginTop:2 }}>everybody chips in · one person wins</div>
            </div>
          </div>
          <button className="btn" onClick={()=>signOut(auth)} style={{ fontSize:11,color:"rgba(255,255,255,0.2)",background:"transparent",padding:0 }}>sign out</button>
        </div>
        {recent && (
          <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:"rgba(232,213,163,0.06)",border:"1px solid rgba(232,213,163,0.12)",borderRadius:20,padding:"4px 12px",marginTop:12,fontSize:12,color:"rgba(232,213,163,0.6)" }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:"#e05c2a",display:"inline-block",boxShadow:"0 0 6px #e05c2a" }}/>
            👋 {recent.name} just joined
          </div>
        )}
      </div>

      {/* Chalk line */}
      <div style={{ height:1,background:"linear-gradient(90deg,transparent,rgba(232,213,163,0.15),transparent)" }}/>

      {/* TABS */}
      <div style={{ display:"flex",background:"#0d0a07",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"0 4px" }}>
        {[{id:"home",l:"Home"},{id:"wishes",l:"Wishes"},{id:"winners",l:"Winners"},{id:"how",l:"How it works"}].map(t=>(
          <button key={t.id} className="btn" onClick={()=>setTab(t.id)} style={{ flex:1,padding:"12px 2px",background:"transparent",borderBottom:`2px solid ${tab===t.id?"#e05c2a":"transparent"}`,color:tab===t.id?"#e8d5a3":"rgba(255,255,255,0.3)",fontSize:11,fontWeight:tab===t.id?700:400,fontFamily:"'Oswald',sans-serif",textTransform:"uppercase",letterSpacing:"0.08em" }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex:1,overflowY:"auto",padding:"20px 16px 100px" }}>

        {/* HOME */}
        {tab==="home" && (
          <div style={{ display:"flex",flexDirection:"column",gap:14,animation:"fade-up 0.3s ease" }}>

            {/* Sponsored */}
            <div style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.18)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2 }}>Sponsored</div>
                <div style={{ fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.65)" }}>Free money transfers</div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.3)" }}>Send your winnings with Zello Pay</div>
              </div>
              <div style={{ fontSize:12,fontWeight:700,color:"#e8d5a3",whiteSpace:"nowrap",marginLeft:12 }}>Try free →</div>
            </div>

            {/* Tiers */}
            <div>
              <div style={{ fontFamily:"'Oswald',sans-serif",fontSize:11,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:10 }}>Live drawings</div>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {tiers.map(tier => {
                  const isPaid = myData?.paid?.[tier.id];
                  return (
                    <div key={tier.id}>
                      <TierCard tier={tier} members={members} myData={myData} userId={user.uid} isAdmin={isAdmin} onDraw={runDraw}/>
                      {!isPaid && (
                        <button className="btn" onClick={()=>markPaid(tier.id)} style={{ width:"100%",marginTop:6,padding:"12px",background:`${tier.color}10`,border:`1px solid ${tier.color}33`,borderRadius:10,color:tier.color,fontSize:13,fontWeight:600,fontFamily:"inherit",letterSpacing:"0.02em" }}>
                          I'm in for {tier.label} (${tier.amount === 0.25 ? "0.25" : tier.amount}) ⚾
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
              <div style={{ background:"rgba(232,213,163,0.05)",border:"1px solid rgba(232,213,163,0.15)",borderRadius:14,padding:16 }}>
                <div style={{ fontSize:13,fontWeight:600,color:"rgba(232,213,163,0.8)",marginBottom:4 }}>Add your Venmo handle</div>
                <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",marginBottom:10 }}>So you can receive your winnings if you win.</div>
                <VenmoInput userId={user.uid} members={members}/>
              </div>
            )}

            {/* Invite */}
            <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:16 }}>
              <div style={{ fontSize:14,fontWeight:700,marginBottom:4,color:"#f5f0e8" }}>Invite friends, grow the ball ⚾</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.35)",marginBottom:14,lineHeight:1.6 }}>Every new member adds to every pot. Your odds stay the same — but the prizes keep growing.</div>
              <button className="btn" onClick={copyInvite} style={{ width:"100%",padding:12,background:copied?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.04)",border:copied?"1px solid #34d399":"1px solid rgba(255,255,255,0.09)",color:copied?"#34d399":"rgba(255,255,255,0.6)",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"inherit" }}>
                {copied?"✓ Invite link copied!":"Copy your invite link"}
              </button>
            </div>
          </div>
        )}

        {/* WISHES */}
        {tab==="wishes" && (
          <div style={{ animation:"fade-up 0.3s ease" }}>
            <div style={{ fontSize:13,color:"rgba(255,255,255,0.3)",marginBottom:16 }}>What members would do with the money. Heart the ones that move you ♥</div>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {sortedMembers.map((m,i)=>{
                const count=getLikeCount(m.uid),isLiked=myData?.likes?.[m.uid],isTop=i===0&&count>0;
                const color=hsl(members.findIndex(x=>x.uid===m.uid));
                const anyPaid=Object.values(m.paid||{}).some(Boolean);
                return (
                  <div key={m.uid} style={{ background:isTop?"rgba(232,213,163,0.06)":"rgba(255,255,255,0.03)",border:isTop?"1px solid rgba(232,213,163,0.2)":"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px 16px",opacity:anyPaid?1:0.45 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:m.wish?10:0 }}>
                      <div style={{ width:38,height:38,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#0d0a07",flexShrink:0 }}>{ini(m.name)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
                          <span style={{ fontSize:14,fontWeight:600 }}>{m.name}</span>
                          {m.uid===user.uid && <span style={{ fontSize:10,color:"#e8d5a3",background:"rgba(232,213,163,0.1)",borderRadius:4,padding:"1px 6px" }}>you</span>}
                          {isTop && <span style={{ fontSize:10,background:"rgba(232,213,163,0.12)",color:"#e8d5a3",borderRadius:4,padding:"2px 6px",fontWeight:700 }}>TOP ♥</span>}
                        </div>
                        <div style={{ fontSize:11,color:"rgba(255,255,255,0.22)" }}>🔥 {m.streak||0}-month streak</div>
                      </div>
                      <button className="btn" onClick={()=>toggleLike(m.uid)} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:8,borderRadius:8,background:isLiked?"rgba(224,92,42,0.12)":"rgba(255,255,255,0.04)",border:isLiked?"1px solid rgba(224,92,42,0.35)":"1px solid rgba(255,255,255,0.07)",cursor:m.uid===user.uid?"default":"pointer" }}>
                        <span style={{ fontSize:18,lineHeight:1,filter:isLiked?"none":"grayscale(1) opacity(0.35)" }}>♥</span>
                        <span style={{ fontSize:10,fontWeight:600,color:isLiked?"#e05c2a":"rgba(255,255,255,0.25)" }}>{count}</span>
                      </button>
                    </div>
                    {m.wish
                      ?<div style={{ fontSize:14,color:"rgba(255,255,255,0.7)",fontFamily:"'Fraunces',serif",fontStyle:"italic",lineHeight:1.55,paddingLeft:48 }}>"{m.wish}"</div>
                      :<div style={{ fontSize:12,color:"rgba(255,255,255,0.18)",fontStyle:"italic",paddingLeft:48 }}>No wish yet…</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WINNERS */}
        {tab==="winners" && (
          <div style={{ animation:"fade-up 0.3s ease",display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ fontSize:13,color:"rgba(255,255,255,0.3)",marginBottom:4 }}>Every dollar comes back. Here's proof.</div>
            {history.length===0 && (
              <div style={{ textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.2)" }}>
                <Baseball size={52} spin="fast"/>
                <div style={{ marginTop:16,fontSize:14 }}>No draws yet — the first one's coming soon.</div>
              </div>
            )}
            {history.map((h,i)=>(
              <div key={h.id} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18,borderLeft:`3px solid ${winColors[i%5]}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                  <div>
                    <div style={{ fontFamily:"'Oswald',sans-serif",fontSize:11,color:"rgba(255,255,255,0.22)",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em" }}>{h.tierLabel} · {h.month}</div>
                    <div style={{ fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700 }}>🏆 {h.winnerName}</div>
                    {h.winnerVenmo && <div style={{ fontSize:12,color:"#e8d5a3",marginTop:2 }}>@{h.winnerVenmo}</div>}
                  </div>
                  <div style={{ fontFamily:"'Fraunces',serif",fontSize:28,fontWeight:700,color:winColors[i%5] }}>${h.amount}</div>
                </div>
                {h.winnerWish && <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",fontStyle:"italic",fontFamily:"'Fraunces',serif",borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:10 }}>"{h.winnerWish}"</div>}
              </div>
            ))}
            <div style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:14,marginTop:4 }}>
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.18)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4 }}>Sponsored</div>
              <div style={{ fontSize:14,fontWeight:600,color:"rgba(255,255,255,0.75)" }}>Make your winnings work harder.</div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",marginBottom:6 }}>High-yield savings with Vault Bank.</div>
              <div style={{ fontSize:13,fontWeight:700,color:"#e8d5a3" }}>Open an account →</div>
            </div>
          </div>
        )}

        {/* HOW */}
        {tab==="how" && (
          <div style={{ animation:"fade-up 0.3s ease",display:"flex",flexDirection:"column",gap:14 }}>
            <div style={{ fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:700,lineHeight:1.3,marginBottom:4,color:"#f5f0e8" }}>
              Simple by design.<br/>
              <span style={{ fontStyle:"italic",fontWeight:300,color:"rgba(232,213,163,0.5)",fontSize:22 }}>Powerful by community.</span>
            </div>
            {[
              {n:"01",t:"Everyone chips in",b:"Pick your drawing — daily, weekly, monthly, or yearly. Throw in your dollar. You're in the pool."},
              {n:"02",t:"The ball gets bigger",b:"Every person who joins adds to the pot. The more the pool grows, the more someone catches. Your odds stay the same — the prize doesn't."},
              {n:"03",t:"One person catches the NooBall",b:"When the timer hits zero, one member is randomly selected to receive the entire pot. That's their NooBall."},
              {n:"04",t:"Honor system, always",b:"NooBall doesn't take a cut. Ever. The winner posts their Venmo. Everyone sends. That's it."},
            ].map(s=>(
              <div key={s.n} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18,display:"flex",gap:14,alignItems:"flex-start" }}>
                <div style={{ fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:500,color:"#e8d5a3",opacity:0.4,paddingTop:2,flexShrink:0 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize:15,fontWeight:700,marginBottom:4,color:"#f5f0e8" }}>{s.t}</div>
                  <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.65 }}>{s.b}</div>
                </div>
              </div>
            ))}
            <div style={{ background:"rgba(232,213,163,0.05)",border:"1px solid rgba(232,213,163,0.12)",borderRadius:14,padding:18 }}>
              <div style={{ fontSize:15,fontWeight:700,marginBottom:6,color:"#e8d5a3" }}>Is this legal? 🤔</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.7 }}>NooBall is modeled after a ROSCA — a Rotating Savings and Credit Association. One of the world's oldest financial tools. No house cut. No fees. Every dollar in comes back out to a member.</div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(13,10,7,0.97)",backdropFilter:"blur(12px)",borderTop:"1px solid rgba(232,213,163,0.1)",display:"flex",padding:"10px 0 18px",zIndex:100 }}>
        {[{id:"home",icon:"⬡",l:"Home"},{id:"wishes",icon:"♥",l:"Wishes"},{id:"winners",icon:"◎",l:"Winners"},{id:"how",icon:"?",l:"How"}].map(n=>(
          <button key={n.id} className="btn" onClick={()=>setTab(n.id)} style={{ flex:1,background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:tab===n.id?"#e8d5a3":"rgba(255,255,255,0.22)" }}>
            <span style={{ fontSize:17,lineHeight:1 }}>{n.icon}</span>
            <span style={{ fontSize:10,fontWeight:tab===n.id?700:400,fontFamily:"'Oswald',sans-serif",textTransform:"uppercase",letterSpacing:"0.06em" }}>{n.l}</span>
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
    const taken = members.filter(m=>m.uid!==userId&&m.venmoHandle===clean).length>0;
    if (taken) { setError("That Venmo handle is already registered."); return; }
    await updateDoc(doc(db,"users",userId),{venmoHandle:clean});
    setSaved(true);
  };

  return (
    <div>
      <div style={{ display:"flex",gap:8 }}>
        <input placeholder="@yourvenmo" value={handle} onChange={e=>{setHandle(e.target.value);setError("");}} style={{ flex:1,padding:"10px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#fff",fontSize:13,fontFamily:"inherit",outline:"none" }}/>
        <button onClick={save} style={{ padding:"10px 16px",background:saved?"rgba(52,211,153,0.15)":"rgba(232,213,163,0.1)",border:saved?"1px solid #34d399":"1px solid rgba(232,213,163,0.25)",borderRadius:10,color:saved?"#34d399":"#e8d5a3",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" }}>
          {saved?"✓ Saved":"Save"}
        </button>
      </div>
      {error && <div style={{ fontSize:11,color:"#f87171",marginTop:4 }}>{error}</div>}
    </div>
  );
}
