import { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import {
  collection, doc, onSnapshot, updateDoc, query,
  orderBy, addDoc, serverTimestamp, getDocs,
} from "firebase/firestore";
import { auth, db, ADMIN_EMAIL } from "../firebase";
import { Baseball } from "../App";

function useCountdown(target) {
  const [t, setT] = useState({ d:0,h:0,m:0,s:0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target) - Date.now();
      if (diff <= 0) return setT({ d:0,h:0,m:0,s:0 });
      setT({ d:Math.floor(diff/86400000), h:Math.floor(diff%86400000/3600000), m:Math.floor(diff%3600000/60000), s:Math.floor(diff%60000/1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

function pad(n) { return String(n).padStart(2,"0"); }
function hsl(i) { return `hsl(${(i*47+260)%360},55%,60%)`; }
function ini(n) { return (n||"?").slice(0,2).toUpperCase(); }

export default function MainApp({ user }) {
  const [tab, setTab] = useState("home");
  const [members, setMembers] = useState([]);
  const [history, setHistory] = useState([]);
  const [myData, setMyData] = useState(null);
  const [wish, setWish] = useState("");
  const [wishSaved, setWishSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [drawWinner, setDrawWinner] = useState(null);
  const [confetti, setConfetti] = useState([]);
  const cd = useCountdown("2026-05-01T20:00:00");
  const isAdmin = user.email === ADMIN_EMAIL;

  useEffect(() => {
    const q = query(collection(db,"users"), orderBy("joinedAt","asc"));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id:d.id,...d.data() }));
      setMembers(data);
      const me = data.find(m => m.uid === user.uid);
      if (me) { setMyData(me); setWish(w => w || me.wish || ""); }
    });
  }, [user.uid]);

  useEffect(() => {
    const q = query(collection(db,"history"), orderBy("drawnAt","desc"));
    return onSnapshot(q, snap => setHistory(snap.docs.map(d => ({ id:d.id,...d.data() }))));
  }, []);

  const paid = members.filter(m => m.paid);
  const pot  = paid.length;
  const odds = pot > 0 ? ((1/pot)*100).toFixed(1) : "0.0";

  const markPaid = async () => {
    await updateDoc(doc(db,"users",user.uid), { paid:true, streak:(myData?.streak||0)+1 });
  };

  const saveWish = async () => {
    if (!wish.trim()) return;
    await updateDoc(doc(db,"users",user.uid), { wish: wish.trim() });
    setWishSaved(true);
    setTimeout(() => setWishSaved(false), 2000);
  };

  const toggleLike = async (memberId) => {
    if (memberId === user.uid) return;
    const newLikes = { ...(myData?.likes||{}), [memberId]: !myData?.likes?.[memberId] };
    await updateDoc(doc(db,"users",user.uid), { likes: newLikes });
  };

  const getLikeCount = (uid) => members.filter(m => m.likes?.[uid]).length;

  const copyInvite = () => {
    const url = `${window.location.origin}?ref=${user.uid}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const runDraw = async () => {
    if (!paid.length) return;
    const winner = paid[Math.floor(Math.random() * paid.length)];
    await addDoc(collection(db,"history"), {
      winnerId: winner.uid, winnerName: winner.name, winnerWish: winner.wish||"",
      amount: pot, members: paid.length, drawnAt: serverTimestamp(),
      month: new Date().toLocaleString("default",{month:"long",year:"numeric"}),
    });
    const all = await getDocs(collection(db,"users"));
    await Promise.all(all.docs.map(d => updateDoc(d.ref, { paid:false })));
    setDrawWinner(winner);
    spawnConfetti();
  };

  const spawnConfetti = () => {
    const cols = ["#c084fc","#f472b6","#fb923c","#facc15","#34d399","#60a5fa"];
    setConfetti(Array.from({length:55},(_,i) => ({ id:i, x:Math.random()*100, delay:Math.random()*0.9, size:5+Math.random()*8, rot:Math.random()*360, color:cols[i%cols.length], circle:Math.random()>0.4 })));
    setTimeout(() => setConfetti([]), 4500);
  };

  const recent = members.filter(m => m.uid !== user.uid).slice(-1)[0];
  const sortedMembers = [...members].sort((a,b) => getLikeCount(b.uid) - getLikeCount(a.uid));
  const winColors = ["#c084fc","#f472b6","#60a5fa","#34d399","#fb923c"];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#0a0a0f", minHeight:"100vh", maxWidth:430, margin:"0 auto", display:"flex", flexDirection:"column", color:"#fff", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,300&display=swap');
        * { box-sizing:border-box; }
        @keyframes fall { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(900deg);opacity:0} }
        @keyframes fade-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce-in { 0%{transform:scale(0.6);opacity:0} 65%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(168,85,247,0.3)} 50%{box-shadow:0 0 40px rgba(168,85,247,0.55)} }
        .btn { transition:all 0.15s; cursor:pointer; border:none; }
        .btn:active { transform:scale(0.97); }
        ::-webkit-scrollbar { width:0; }
        input,textarea { outline:none; }
        input::placeholder,textarea::placeholder { color:rgba(255,255,255,0.22); }
      `}</style>

      {/* Confetti */}
      {confetti.map(p => (
        <div key={p.id} style={{ position:"fixed",top:-10,left:`${p.x}%`,width:p.size,height:p.circle?p.size:p.size*0.45,background:p.color,borderRadius:p.circle?"50%":"2px",animation:`fall 3.4s ease-in forwards`,animationDelay:`${p.delay}s`,zIndex:9999,pointerEvents:"none",transform:`rotate(${p.rot}deg)` }}/>
      ))}

      {/* HEADER */}
      <div style={{ background:"linear-gradient(160deg,#1a0533,#180a2e 45%,#0a0a0f)", padding:"22px 20px 26px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.22),transparent 70%)",pointerEvents:"none" }}/>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:recent?14:18 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <Baseball size={38} spin="slow" />
            <div>
              <div style={{ fontFamily:"'Fraunces',serif",fontSize:28,fontWeight:700,letterSpacing:"-0.5px",lineHeight:1 }}>NooBall</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:2 }}>everybody chips in · one person wins</div>
            </div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}>
            <div style={{ background:"linear-gradient(135deg,rgba(168,85,247,0.25),rgba(236,72,153,0.25))",border:"1px solid rgba(168,85,247,0.35)",borderRadius:20,padding:"6px 14px",fontSize:15,fontWeight:700 }}>
              ${pot} <span style={{ fontSize:11,fontWeight:400,opacity:0.5 }}>pot</span>
            </div>
            <button className="btn" onClick={() => signOut(auth)} style={{ fontSize:11,color:"rgba(255,255,255,0.2)",background:"transparent",padding:0 }}>sign out</button>
          </div>
        </div>

        {recent && <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"4px 12px",marginBottom:14,fontSize:12,color:"rgba(255,255,255,0.5)" }}>
          <span style={{ width:6,height:6,borderRadius:"50%",background:"#34d399",display:"inline-block",boxShadow:"0 0 6px #34d399" }}/>
          👋 {recent.name} just joined
        </div>}

        {/* Countdown */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10 }}>Drawing on May 1st</div>
          <div style={{ display:"flex",gap:8 }}>
            {[["d","days"],["h","hrs"],["m","min"],["s","sec"]].map(([k,l]) => (
              <div key={k} style={{ flex:1,textAlign:"center" }}>
                <div style={{ background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"10px 4px",fontFamily:"monospace",fontSize:26,fontWeight:700,color:"#fff",lineHeight:1,transition:"color 0.3s" }}>
                  {pad(cd[k])}
                </div>
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:5,textTransform:"uppercase",letterSpacing:"0.12em" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Odds */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1px 1fr",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"14px 20px" }}>
          <div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4 }}>Your odds</div>
            <div style={{ fontFamily:"'Fraunces',serif",fontSize:34,fontWeight:700,color:"#c084fc",lineHeight:1 }}>{odds}%</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.08)" }}/>
          <div style={{ paddingLeft:20 }}>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4 }}>In the pool</div>
            <div style={{ fontFamily:"'Fraunces',serif",fontSize:34,fontWeight:700,color:"#fff",lineHeight:1 }}>{pot} <span style={{ fontSize:16,fontWeight:300,opacity:0.4 }}>paid</span></div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:"flex",background:"#0a0a0f",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"0 4px" }}>
        {[{id:"home",l:"Home"},{id:"wishes",l:"Wishes"},{id:"winners",l:"Winners"},{id:"how",l:"How it works"}].map(t => (
          <button key={t.id} className="btn" onClick={() => setTab(t.id)} style={{ flex:1,padding:"13px 2px",background:"transparent",borderBottom:`2px solid ${tab===t.id?"#c084fc":"transparent"}`,color:tab===t.id?"#c084fc":"rgba(255,255,255,0.3)",fontSize:11,fontWeight:tab===t.id?700:400,textTransform:"uppercase",letterSpacing:"0.05em" }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex:1,overflowY:"auto",padding:"20px 16px 100px" }}>

        {/* HOME */}
        {tab === "home" && (
          <div style={{ display:"flex",flexDirection:"column",gap:14,animation:"fade-up 0.3s ease" }}>
            {/* Paid status */}
            {!myData?.paid ? (
              <div style={{ background:"rgba(251,146,60,0.08)",border:"1px solid rgba(251,146,60,0.3)",borderRadius:14,padding:16,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:14,fontWeight:700,color:"#fb923c" }}>Your $1 is due</div>
                  <div style={{ fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:2 }}>Tap when you've paid in</div>
                </div>
                <button className="btn" onClick={markPaid} style={{ background:"#fb923c",color:"#fff",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:700,fontFamily:"inherit" }}>Mark paid ✓</button>
              </div>
            ) : (
              <div style={{ background:"rgba(52,211,153,0.07)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,animation:"bounce-in 0.4s ease" }}>
                <Baseball size={28} spin="slow" />
                <div>
                  <div style={{ fontSize:14,fontWeight:600,color:"#34d399" }}>You're in this month!</div>
                  <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)" }}>🔥 {myData?.streak||0}-month streak</div>
                </div>
              </div>
            )}

            {/* Who's in */}
            <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:16 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                <div style={{ fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.7)" }}>Who's in this month</div>
                <div style={{ fontSize:12,color:"rgba(255,255,255,0.25)" }}>{pot}/{members.length}</div>
              </div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                {members.map((m,i) => (
                  <div key={m.uid} title={m.name} style={{ width:34,height:34,borderRadius:"50%",background:m.paid?hsl(i):"rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:m.paid?"#fff":"rgba(255,255,255,0.2)",border:m.paid?"2px solid rgba(255,255,255,0.1)":"1px dashed rgba(255,255,255,0.12)",opacity:m.paid?1:0.45 }}>
                    {ini(m.name)}
                  </div>
                ))}
              </div>
              <div style={{ marginTop:12,height:3,background:"rgba(255,255,255,0.06)",borderRadius:4 }}>
                <div style={{ height:"100%",width:`${members.length>0?(pot/members.length*100):0}%`,background:"linear-gradient(90deg,#a855f7,#ec4899)",borderRadius:4,transition:"width 0.6s ease" }}/>
              </div>
            </div>

            {/* Wish */}
            <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:16 }}>
              <div style={{ fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.7)",marginBottom:10 }}>What would you do with it? 💭</div>
              <textarea placeholder="Be specific — it inspires others and makes your wish real." value={wish} onChange={e => setWish(e.target.value)} rows={3}
                style={{ width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:10,padding:11,fontSize:13,fontFamily:"inherit",resize:"none",color:"#fff" }}/>
              <button className="btn" onClick={saveWish} style={{ marginTop:8,background:wishSaved?"rgba(52,211,153,0.15)":"rgba(255,255,255,0.07)",border:wishSaved?"1px solid #34d399":"1px solid rgba(255,255,255,0.1)",color:wishSaved?"#34d399":"rgba(255,255,255,0.6)",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:600,fontFamily:"inherit" }}>
                {wishSaved ? "✓ Saved!" : "Save wish"}
              </button>
            </div>

            {/* Invite */}
            <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:16 }}>
              <div style={{ fontSize:14,fontWeight:700,marginBottom:4 }}>Invite friends, grow the ball ⚾</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.35)",marginBottom:14,lineHeight:1.6 }}>Every person who joins adds $1 to the pot. Your odds stay the same — but the prize gets bigger.</div>
              <button className="btn" onClick={copyInvite} style={{ width:"100%",padding:12,background:copied?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.05)",border:copied?"1px solid #34d399":"1px solid rgba(255,255,255,0.09)",color:copied?"#34d399":"rgba(255,255,255,0.65)",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"inherit" }}>
                {copied ? "✓ Invite link copied!" : "Copy your invite link"}
              </button>
            </div>

            {/* Admin */}
            {isAdmin && (
              <div style={{ background:"rgba(168,85,247,0.08)",border:"1px solid rgba(168,85,247,0.25)",borderRadius:14,padding:16 }}>
                <div style={{ fontSize:13,fontWeight:700,color:"#c084fc",marginBottom:10 }}>⚡ Admin — Run the draw</div>
                {drawWinner ? (
                  <div style={{ textAlign:"center",animation:"bounce-in 0.5s ease" }}>
                    <Baseball size={40} spin="fast" />
                    <div style={{ fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:700,marginTop:8 }}>{drawWinner.name} wins ${pot}!</div>
                    <button className="btn" onClick={() => setDrawWinner(null)} style={{ marginTop:12,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",borderRadius:8,padding:"8px 16px",fontSize:12,fontFamily:"inherit" }}>Dismiss</button>
                  </div>
                ) : (
                  <button className="btn" onClick={runDraw} disabled={!paid.length} style={{ width:"100%",padding:13,background:"linear-gradient(135deg,#7c3aed,#ec4899)",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,fontFamily:"inherit",opacity:paid.length?1:0.4,animation:"glow 3s ease infinite" }}>
                    {paid.length ? `⚾ Draw winner from ${paid.length} members` : "No paid members yet"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* WISHES */}
        {tab === "wishes" && (
          <div style={{ animation:"fade-up 0.3s ease" }}>
            <div style={{ fontSize:13,color:"rgba(255,255,255,0.3)",marginBottom:16 }}>What members would do with the money. Heart the ones that move you ♥</div>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {sortedMembers.map((m,i) => {
                const count = getLikeCount(m.uid);
                const isLiked = myData?.likes?.[m.uid];
                const isTop = i===0 && count>0;
                const color = hsl(members.findIndex(x => x.uid===m.uid));
                return (
                  <div key={m.uid} style={{ background:isTop?"rgba(192,132,252,0.07)":"rgba(255,255,255,0.03)",border:isTop?"1px solid rgba(192,132,252,0.25)":"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px 16px",opacity:m.paid?1:0.45 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:m.wish?10:0 }}>
                      <div style={{ width:38,height:38,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0 }}>{ini(m.name)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
                          <span style={{ fontSize:14,fontWeight:600 }}>{m.name}</span>
                          {m.uid===user.uid && <span style={{ fontSize:10,color:"#c084fc",background:"rgba(192,132,252,0.15)",borderRadius:4,padding:"1px 6px" }}>you</span>}
                          {isTop && <span style={{ fontSize:10,background:"rgba(192,132,252,0.15)",color:"#c084fc",borderRadius:4,padding:"2px 6px",fontWeight:700 }}>TOP ♥</span>}
                          {!m.paid && <span style={{ fontSize:10,color:"rgba(255,255,255,0.25)" }}>unpaid</span>}
                        </div>
                        <div style={{ fontSize:11,color:"rgba(255,255,255,0.22)" }}>🔥 {m.streak||0}-month streak</div>
                      </div>
                      <button className="btn" onClick={() => toggleLike(m.uid)} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:8,borderRadius:8,background:isLiked?"rgba(244,114,182,0.12)":"rgba(255,255,255,0.04)",border:isLiked?"1px solid rgba(244,114,182,0.35)":"1px solid rgba(255,255,255,0.07)",cursor:m.uid===user.uid?"default":"pointer" }}>
                        <span style={{ fontSize:18,lineHeight:1,filter:isLiked?"none":"grayscale(1) opacity(0.35)" }}>♥</span>
                        <span style={{ fontSize:10,fontWeight:600,color:isLiked?"#f472b6":"rgba(255,255,255,0.25)" }}>{count}</span>
                      </button>
                    </div>
                    {m.wish
                      ? <div style={{ fontSize:14,color:"rgba(255,255,255,0.7)",fontFamily:"'Fraunces',serif",fontStyle:"italic",lineHeight:1.55,paddingLeft:48 }}>"{m.wish}"</div>
                      : <div style={{ fontSize:12,color:"rgba(255,255,255,0.18)",fontStyle:"italic",paddingLeft:48 }}>No wish added yet…</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WINNERS */}
        {tab === "winners" && (
          <div style={{ animation:"fade-up 0.3s ease",display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ fontSize:13,color:"rgba(255,255,255,0.3)",marginBottom:4 }}>Every dollar comes back. Here's proof.</div>
            {history.length === 0 && (
              <div style={{ textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.2)" }}>
                <Baseball size={52} spin="fast" />
                <div style={{ marginTop:16,fontSize:14 }}>No draws yet — the first one's coming soon.</div>
              </div>
            )}
            {history.map((h,i) => (
              <div key={h.id} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18,borderLeft:`3px solid ${winColors[i%5]}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:11,color:"rgba(255,255,255,0.22)",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em" }}>{h.month}</div>
                    <div style={{ fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700 }}>🏆 {h.winnerName}</div>
                  </div>
                  <div style={{ fontFamily:"'Fraunces',serif",fontSize:30,fontWeight:700,color:winColors[i%5] }}>${h.amount}</div>
                </div>
                {h.winnerWish && <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",fontStyle:"italic",fontFamily:"'Fraunces',serif",borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:10 }}>"{h.winnerWish}"</div>}
              </div>
            ))}
            <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:14 }}>
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.18)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4 }}>Sponsored</div>
              <div style={{ fontSize:14,fontWeight:600,color:"rgba(255,255,255,0.75)" }}>Make your winnings work harder.</div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",marginBottom:8 }}>High-yield savings with Vault Bank.</div>
              <div style={{ fontSize:13,fontWeight:700,color:"#c084fc" }}>Open an account →</div>
            </div>
          </div>
        )}

        {/* HOW */}
        {tab === "how" && (
          <div style={{ animation:"fade-up 0.3s ease",display:"flex",flexDirection:"column",gap:14 }}>
            <div style={{ fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:700,lineHeight:1.3,marginBottom:4 }}>
              Simple by design.<br/>
              <span style={{ fontStyle:"italic",fontWeight:300,color:"rgba(255,255,255,0.4)",fontSize:22 }}>Powerful by community.</span>
            </div>
            {[
              {n:"01",t:"Everyone chips in $1",b:"Once a month, every member throws a dollar into the pool. No more, no less."},
              {n:"02",t:"The ball gets bigger",b:"Every dollar that comes in makes the ball roll a little heavier. The more people who join, the more it's worth — that's the whole game."},
              {n:"03",t:"One person gets the NooBall",b:"At the end of the month, one member is randomly selected to receive the entire pool. That's their NooBall — a fresh start, a little win, a moment that's theirs."},
              {n:"04",t:"Every dollar comes back",b:"No house cut. No fees. No catch. 100% of what goes in comes back out to a member. Always."},
            ].map(s => (
              <div key={s.n} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18,display:"flex",gap:14,alignItems:"flex-start" }}>
                <div style={{ fontFamily:"monospace",fontSize:11,fontWeight:500,color:"#c084fc",opacity:0.5,paddingTop:2,flexShrink:0 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize:15,fontWeight:700,marginBottom:4 }}>{s.t}</div>
                  <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.65 }}>{s.b}</div>
                </div>
              </div>
            ))}
            <div style={{ background:"linear-gradient(135deg,rgba(168,85,247,0.1),rgba(236,72,153,0.07))",border:"1px solid rgba(168,85,247,0.18)",borderRadius:14,padding:18 }}>
              <div style={{ fontSize:15,fontWeight:700,marginBottom:6 }}>Is this legal? 🤔</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.7 }}>NooBall is modeled after a ROSCA — a Rotating Savings and Credit Association. One of the world's oldest financial tools. No house, no cut, no catch. Every dollar in comes back out to a member.</div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(10,10,15,0.96)",backdropFilter:"blur(12px)",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",padding:"10px 0 18px",zIndex:100 }}>
        {[{id:"home",icon:"⬡",l:"Home"},{id:"wishes",icon:"♥",l:"Wishes"},{id:"winners",icon:"◎",l:"Winners"},{id:"how",icon:"?",l:"How"}].map(n => (
          <button key={n.id} className="btn" onClick={() => setTab(n.id)} style={{ flex:1,background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:tab===n.id?"#c084fc":"rgba(255,255,255,0.22)" }}>
            <span style={{ fontSize:17,lineHeight:1 }}>{n.icon}</span>
            <span style={{ fontSize:10,fontWeight:tab===n.id?700:400,textTransform:"uppercase",letterSpacing:"0.04em" }}>{n.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
