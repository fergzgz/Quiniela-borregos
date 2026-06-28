import { useState, useEffect } from "react";

// ─── BRACKET DATA ─────────────────────────────────────────────────────────────
const INITIAL_BRACKET = {
  r16: [
    { id:"r16_0",  team1:"Alemania",     flag1:"🇩🇪", team2:"Paraguay",    flag2:"🇵🇾" },
    { id:"r16_1",  team1:"Francia",      flag1:"🇫🇷", team2:"Suecia",      flag2:"🇸🇪" },
    { id:"r16_2",  team1:"Sudáfrica",    flag1:"🇿🇦", team2:"Canadá",      flag2:"🇨🇦" },
    { id:"r16_3",  team1:"Países Bajos", flag1:"🇳🇱", team2:"Marruecos",   flag2:"🇲🇦" },
    { id:"r16_4",  team1:"Portugal",     flag1:"🇵🇹", team2:"Croacia",     flag2:"🇭🇷" },
    { id:"r16_5",  team1:"España",       flag1:"🇪🇸", team2:"Austria",     flag2:"🇦🇹" },
    { id:"r16_6",  team1:"EUA",          flag1:"🇺🇸", team2:"Bosnia",      flag2:"🇧🇦" },
    { id:"r16_7",  team1:"Bélgica",      flag1:"🇧🇪", team2:"Senegal",     flag2:"🇸🇳" },
    { id:"r16_8",  team1:"Brasil",       flag1:"🇧🇷", team2:"Japón",       flag2:"🇯🇵" },
    { id:"r16_9",  team1:"Costa de Marfil", flag1:"🇨🇮", team2:"Noruega",    flag2:"🇳🇴" },
    { id:"r16_10", team1:"México",       flag1:"🇲🇽", team2:"Ecuador",     flag2:"🇪🇨" },
    { id:"r16_11", team1:"Inglaterra",   flag1:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", team2:"Congo",       flag2:"🇨🇩" },
    { id:"r16_12", team1:"Argentina",    flag1:"🇦🇷", team2:"Cabo Verde",  flag2:"🇨🇻" },
    { id:"r16_13", team1:"Australia",    flag1:"🇦🇺", team2:"Egipto",      flag2:"🇪🇬" },
    { id:"r16_14", team1:"Suiza",        flag1:"🇨🇭", team2:"Argelia",     flag2:"🇩🇿" },
    { id:"r16_15", team1:"Colombia",     flag1:"🇨🇴", team2:"Ghana",       flag2:"🇬🇭" },
  ],
  qf: Array.from({length:8}, (_,i) => ({ id:`qf_${i}`, team1:null,flag1:null,team2:null,flag2:null })),
  sf: Array.from({length:4}, (_,i) => ({ id:`sf_${i}`, team1:null,flag1:null,team2:null,flag2:null })),
  f:  Array.from({length:2}, (_,i) => ({ id:`f_${i}`,  team1:null,flag1:null,team2:null,flag2:null })),
};

// Puntos base por ronda + 1 pt bonus por acertar el tiempo
const BASE_PTS  = { r16:1, qf:2, sf:4, f:8, champion:16 };
const TIME_BONUS = 1; // +1 por acertar 90min / Prórroga / Penales

const TIME_OPTS = [
  { key:"90",  label:"90 min",   icon:"⚽" },
  { key:"et",  label:"Prórroga", icon:"⏱" },
  { key:"pen", label:"Penales",  icon:"🥅" },
];

const ADMIN_PASS = "borregos2026";

const ALL_TEAMS = [
  ["Alemania","🇩🇪"],["Paraguay","🇵🇾"],["Francia","🇫🇷"],["Suecia","🇸🇪"],
  ["Sudáfrica","🇿🇦"],["Canadá","🇨🇦"],["Países Bajos","🇳🇱"],["Marruecos","🇲🇦"],
  ["Portugal","🇵🇹"],["Croacia","🇭🇷"],["España","🇪🇸"],["Austria","🇦🇹"],
  ["EUA","🇺🇸"],["Bosnia","🇧🇦"],["Bélgica","🇧🇪"],["Senegal","🇸🇳"],
  ["Brasil","🇧🇷"],["Japón","🇯🇵"],["Costa de Marfil","🇨🇮"],["Noruega","🇳🇴"],
  ["México","🇲🇽"],["Ecuador","🇪🇨"],["Inglaterra","🏴󠁧󠁢󠁥󠁮󠁧󠁿"],["Congo","🇨🇩"],
  ["Argentina","🇦🇷"],["Cabo Verde","🇨🇻"],["Australia","🇦🇺"],["Egipto","🇪🇬"],
  ["Suiza","🇨🇭"],["Argelia","🇩🇿"],["Colombia","🇨🇴"],["Ghana","🇬🇭"],
];

// ─── STORAGE ──────────────────────────────────────────────────────────────────
async function loadData(key) {
  try { const r = await window.storage.get(key,true); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function saveData(key, val) {
  try { await window.storage.set(key, JSON.stringify(val), true); } catch {}
}

// ─── SCORE CALC ───────────────────────────────────────────────────────────────
// predictions[roundKey][matchId] = { winner, time }
// results[roundKey][matchId]     = { winner, time }
function calcScore(predictions, results) {
  let pts = 0;
  for (const roundKey of ["r16","qf","sf","f"]) {
    const pRound = predictions[roundKey] || {};
    const rRound = results[roundKey]     || {};
    for (const [id, rData] of Object.entries(rRound)) {
      if (!rData?.winner) continue;
      const pData = pRound[id];
      if (!pData?.winner) continue;
      if (pData.winner === rData.winner) {
        pts += BASE_PTS[roundKey];
        if (pData.time && pData.time === rData.time) pts += TIME_BONUS;
      }
    }
  }
  if (predictions.champion && results.champion && predictions.champion === results.champion)
    pts += BASE_PTS.champion;
  return pts;
}

function calcScoreBreakdown(predictions, results) {
  let winPts = 0, timePts = 0;
  for (const roundKey of ["r16","qf","sf","f"]) {
    const pRound = predictions[roundKey] || {};
    const rRound = results[roundKey]     || {};
    for (const [id, rData] of Object.entries(rRound)) {
      if (!rData?.winner) continue;
      const pData = pRound[id];
      if (!pData?.winner) continue;
      if (pData.winner === rData.winner) {
        winPts += BASE_PTS[roundKey];
        if (pData.time && pData.time === rData.time) timePts += TIME_BONUS;
      }
    }
  }
  if (predictions.champion && results.champion && predictions.champion === results.champion)
    winPts += BASE_PTS.champion;
  return { winPts, timePts, total: winPts + timePts };
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]               = useState("home");
  const [user,   setUser]                 = useState(null);
  const [players, setPlayers]             = useState({});
  const [results, setResults]             = useState({ r16:{}, qf:{}, sf:{}, f:{}, champion:null });
  const [officialBracket, setOfficialBracket] = useState(INITIAL_BRACKET);
  const [loading, setLoading]             = useState(true);
  const [toast,   setToast]               = useState(null);

  useEffect(() => {
    (async () => {
      const p  = await loadData("borregos:players");
      const r  = await loadData("borregos:results");
      const ob = await loadData("borregos:officialBracket");
      if (p)  setPlayers(p);
      if (r)  setResults(r);
      if (ob) setOfficialBracket(ob);
      setLoading(false);
    })();
  }, []);

  function showToast(msg, type="ok") {
    setToast({msg,type});
    setTimeout(() => setToast(null), 2800);
  }

  function handleLogin(code, pin) {
    const p = players[code.toUpperCase()];
    if (!p) return showToast("Código no encontrado","err");
    if (p.pin !== pin) return showToast("PIN incorrecto","err");
    setUser({ code:code.toUpperCase(), ...p });
    setScreen("play");
  }
  function handleRegister(name, code, pin) {
    const c = code.toUpperCase();
    if (players[c])    return showToast("Ese código ya existe","err");
    if (c.length !== 3) return showToast("El código debe tener exactamente 3 letras","err");
    if (pin.length < 4) return showToast("PIN mínimo 4 dígitos","err");
    const updated = {...players, [c]:{ name, pin, predictions:{}, registeredAt:Date.now() }};
    setPlayers(updated); saveData("borregos:players", updated);
    setUser({ code:c, name, pin, predictions:{} });
    showToast("¡Bienvenido! Ya puedes hacer tus picks 🎉");
    setScreen("play");
  }
  function handleLogout() { setUser(null); setScreen("home"); }

  function savePredictions(preds) {
    const updated = {...players, [user.code]:{ ...players[user.code], predictions:preds }};
    setPlayers(updated); saveData("borregos:players", updated);
    setUser(u => ({...u, predictions:preds}));
    showToast("¡Picks guardados! ✅");
  }
  function saveResults(newResults, newBracket) {
    setResults(newResults); setOfficialBracket(newBracket);
    saveData("borregos:results", newResults);
    saveData("borregos:officialBracket", newBracket);
    showToast("Resultados actualizados ✅");
  }

  if (loading) return (
    <div style={S.loadScreen}>
      <div style={S.spinner}/>
      <p style={{color:"#E8C840",marginTop:16,fontFamily:"sans-serif",letterSpacing:2,fontSize:13}}>CARGANDO…</p>
    </div>
  );

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      <Header user={user} screen={screen} setScreen={setScreen} onLogout={handleLogout}/>
      <main style={S.main}>
        {screen==="home"        && <HomeScreen    setScreen={setScreen} results={results} officialBracket={officialBracket}/>}
        {screen==="login"       && <LoginScreen   onLogin={handleLogin} setScreen={setScreen}/>}
        {screen==="register"    && <RegisterScreen onRegister={handleRegister} setScreen={setScreen}/>}
        {screen==="play"        && <PlayScreen    user={user} officialBracket={officialBracket} results={results} onSave={savePredictions}/>}
        {screen==="leaderboard" && <LeaderboardScreen players={players} results={results} user={user}/>}
        {screen==="admin"       && <AdminScreen   bracket={officialBracket} results={results} onSave={saveResults} showToast={showToast}/>}
      </main>
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function Header({user,screen,setScreen,onLogout}) {
  return (
    <header style={S.header}>
      <button style={S.logoBtn} onClick={()=>setScreen("home")}>
        <div style={S.logoMark}>
          <span style={S.logoRam}>🐏</span>
        </div>
        <div>
          <div style={S.logoTop}>QUINIELA</div>
          <div style={S.logoBottom}>BORREGOS</div>
        </div>
      </button>
      <nav style={S.nav}>
        <NB active={screen==="leaderboard"} onClick={()=>setScreen("leaderboard")}>TABLA</NB>
        {user
          ? <><NB active={screen==="play"} onClick={()=>setScreen("play")}>MIS PICKS</NB>
               <button style={S.outBtn} onClick={onLogout}>{user.code} ✕</button></>
          : <><NB active={screen==="login"} onClick={()=>setScreen("login")}>ENTRAR</NB>
               <NB active={screen==="register"} onClick={()=>setScreen("register")}>REGISTRO</NB></>
        }
        <NB active={screen==="admin"} onClick={()=>setScreen("admin")}>ADMIN</NB>
      </nav>
    </header>
  );
}
function NB({active,onClick,children}) {
  return <button onClick={onClick} style={{...S.nb,...(active?S.nbOn:{})}}>{children}</button>;
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({setScreen,results,officialBracket}) {
  const rounds=[
    {key:"r16",label:"16AVOS",  color:"#3B82F6"},
    {key:"qf", label:"CUARTOS", color:"#8B5CF6"},
    {key:"sf", label:"SEMIS",   color:"#EC4899"},
    {key:"f",  label:"FINAL",   color:"#E8C840"},
  ];
  return (
    <div style={S.homeWrap}>
      {/* HERO */}
      <div style={S.hero}>
        <div style={S.heroStripe}/>
        <div style={S.heroContent}>
          <div style={S.heroYear}>
            <span style={S.heroYearNum}>26</span>
          </div>
          <h1 style={S.heroTitle}>FIFA WORLD CUP™</h1>
          <p style={S.heroSub}>FASE FINAL · QUINIELA BORREGOS</p>
          <div style={S.heroDivider}/>
          <p style={S.heroDate}>🏟 FINAL · 19 DE JULIO · METLIFE STADIUM</p>
        </div>
      </div>

      {/* SCORING LEGEND */}
      <div style={S.scoreLegend}>
        <div style={S.scoreLegendTitle}>SISTEMA DE PUNTOS</div>
        <div style={S.scoreGrid}>
          {[["16AVOS","1"],["CUARTOS","2"],["SEMIS","4"],["FINAL","8"],["CAMPEÓN","16"],["+ TIEMPO","1"]].map(([l,v])=>(
            <div key={l} style={S.scoreCell}>
              <span style={S.scorePts}>{v}</span>
              <span style={S.scoreLabel}>{l}</span>
            </div>
          ))}
        </div>
        <p style={S.scoreNote}>+1 pt extra por acertar si gana en 90 min, Prórroga o Penales</p>
      </div>

      {/* PROGRESS */}
      <div style={S.progressCard}>
        <div style={S.progressTitle}>AVANCE DEL TORNEO</div>
        {rounds.map(r=>{
          const total = officialBracket[r.key]?.length || 0;
          const done  = Object.values(results[r.key]||{}).filter(x=>x?.winner).length;
          const pct   = total ? (done/total)*100 : 0;
          return (
            <div key={r.key} style={S.progRow}>
              <span style={{...S.progName,color:r.color}}>{r.label}</span>
              <div style={S.progTrack}>
                <div style={{...S.progBar,width:`${pct}%`,background:r.color}}/>
              </div>
              <span style={S.progNum}>{done}/{total}</span>
            </div>
          );
        })}
      </div>

      <div style={S.heroBtns}>
        <button style={S.btnMain} onClick={()=>setScreen("register")}>CREAR CUENTA</button>
        <button style={S.btnGhost} onClick={()=>setScreen("login")}>YA TENGO CUENTA</button>
        <button style={S.btnLine} onClick={()=>setScreen("leaderboard")}>VER TABLA →</button>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({onLogin,setScreen}) {
  const [code,setCode]=useState(""); const [pin,setPin]=useState("");
  return (
    <div style={S.card}>
      <div style={S.cardBadge}>INICIAR SESIÓN</div>
      <input style={S.inp} placeholder="Código (3 letras)" maxLength={3}
        value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/>
      <input style={S.inp} placeholder="PIN" type="password" maxLength={6}
        value={pin} onChange={e=>setPin(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&onLogin(code,pin)}/>
      <button style={S.btnMain} onClick={()=>onLogin(code,pin)}>ENTRAR</button>
      <p style={S.cardNote}>¿No tienes cuenta?{" "}
        <span style={S.lnk} onClick={()=>setScreen("register")}>Regístrate aquí</span>
      </p>
    </div>
  );
}

// ─── REGISTER ────────────────────────────────────────────────────────────────
function RegisterScreen({onRegister,setScreen}) {
  const [name,setName]=useState(""); const [code,setCode]=useState(""); const [pin,setPin]=useState("");
  return (
    <div style={S.card}>
      <div style={S.cardBadge}>CREAR CUENTA</div>
      <input style={S.inp} placeholder="Nombre completo" value={name} onChange={e=>setName(e.target.value)}/>
      <input style={S.inp} placeholder="Código único (3 letras, ej: FER)" maxLength={3}
        value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/>
      <input style={S.inp} placeholder="PIN (4-6 dígitos)" type="password" maxLength={6}
        value={pin} onChange={e=>setPin(e.target.value)}/>
      <button style={S.btnMain} onClick={()=>onRegister(name,code,pin)}>REGISTRARSE</button>
      <p style={S.cardNote}>¿Ya tienes cuenta?{" "}
        <span style={S.lnk} onClick={()=>setScreen("login")}>Inicia sesión</span>
      </p>
    </div>
  );
}

// ─── PLAY ─────────────────────────────────────────────────────────────────────
function PlayScreen({user,officialBracket,results,onSave}) {
  const [preds,setPreds] = useState(user?.predictions||{});
  const [activeRound,setActiveRound] = useState("r16");

  if (!user) return (
    <div style={S.card}>
      <p style={{color:"#94A3B8",textAlign:"center"}}>Inicia sesión para hacer tus picks.</p>
    </div>
  );

  const rounds=[
    {key:"r16",label:"16AVOS",  pts:1},
    {key:"qf", label:"CUARTOS", pts:2},
    {key:"sf", label:"SEMIS",   pts:4},
    {key:"f",  label:"FINAL",   pts:8},
  ];

  function pickWinner(roundKey,matchId,winner) {
    setPreds(p=>({...p,[roundKey]:{...(p[roundKey]||{}),[matchId]:{...(p[roundKey]?.[matchId]||{}),winner}}}));
  }
  function pickTime(roundKey,matchId,time) {
    setPreds(p=>({...p,[roundKey]:{...(p[roundKey]||{}),[matchId]:{...(p[roundKey]?.[matchId]||{}),time}}}));
  }

  const breakdown = calcScoreBreakdown(preds, results);

  return (
    <div style={S.playWrap}>
      {/* USER HEADER */}
      <div style={S.userBar}>
        <div>
          <div style={S.userCode}>{user.code}</div>
          <div style={S.userName}>{user.name}</div>
        </div>
        <div style={S.scoreBox}>
          <div style={S.scoreTotal}>{breakdown.total}</div>
          <div style={S.scoreSub}>PTS</div>
          <div style={S.scoreDetail}>
            <span style={{color:"#60A5FA"}}>⚽ {breakdown.winPts}</span>
            {" + "}
            <span style={{color:"#34D399"}}>⏱ {breakdown.timePts}</span>
          </div>
        </div>
      </div>

      {/* ROUND TABS */}
      <div style={S.tabs}>
        {rounds.map(r=>{
          const rRes = results[r.key]||{};
          const rPred = preds[r.key]||{};
          const matches = officialBracket[r.key]||[];
          const picked = matches.filter(m=>rPred[m.id]?.winner).length;
          return (
            <button key={r.key} onClick={()=>setActiveRound(r.key)}
              style={{...S.tab,...(activeRound===r.key?S.tabOn:{})}}>
              <span style={S.tabLabel}>{r.label}</span>
              <span style={S.tabPts}>+{r.pts}{r.pts>1?"pts":"pt"}</span>
              <span style={S.tabPick}>{picked}/{matches.length}</span>
            </button>
          );
        })}
      </div>

      {/* MATCHES */}
      <div style={S.matchList}>
        {(officialBracket[activeRound]||[]).map((m,idx)=>{
          const t1=m.team1||"TBD", f1=m.flag1||"🏳";
          const t2=m.team2||"TBD", f2=m.flag2||"🏳";
          const pData = (preds[activeRound]||{})[m.id]||{};
          const rData = (results[activeRound]||{})[m.id]||{};
          const hasResult = !!rData.winner;
          const winOk  = hasResult && pData.winner===rData.winner;
          const winErr = hasResult && pData.winner && pData.winner!==rData.winner;
          const timeOk = hasResult && winOk && pData.time && pData.time===rData.time;

          return (
            <div key={m.id} style={{...S.matchCard,
              borderColor: winOk? "#22C55E" : winErr? "#EF4444" : "#1E3A5F"}}>

              {/* Match number */}
              <div style={S.matchNum}>#{idx+1}</div>

              {hasResult && (
                <div style={S.resultRow}>
                  <span style={winOk?S.resOk:S.resErr}>{winOk?"✅ +"+BASE_PTS[activeRound]:"❌"}</span>
                  {winOk && <span style={timeOk?S.timeOk:S.timeErr}>{timeOk?"⏱ +1":"⏱ ✗"}</span>}
                </div>
              )}

              {/* Teams */}
              <div style={S.matchRow}>
                <TeamBtn team={t1} flag={f1}
                  selected={pData.winner===t1} disabled={hasResult}
                  correct={hasResult&&rData.winner===t1}
                  onClick={()=>pickWinner(activeRound,m.id,t1)}/>
                <div style={S.vsChip}>VS</div>
                <TeamBtn team={t2} flag={f2}
                  selected={pData.winner===t2} disabled={hasResult}
                  correct={hasResult&&rData.winner===t2}
                  onClick={()=>pickWinner(activeRound,m.id,t2)}/>
              </div>

              {/* Time pick — only show if winner picked or result exists */}
              {(pData.winner || hasResult) && (
                <div style={S.timeRow}>
                  <span style={S.timeLabel}>¿Cómo gana?</span>
                  <div style={S.timeBtns}>
                    {TIME_OPTS.map(opt=>(
                      <button key={opt.key}
                        disabled={hasResult}
                        style={{...S.timeBtn,
                          ...(pData.time===opt.key?S.timeBtnOn:{}),
                          ...(hasResult&&rData.time===opt.key?S.timeBtnResult:{}),
                        }}
                        onClick={()=>pickTime(activeRound,m.id,opt.key)}>
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CHAMPION */}
      {activeRound==="f" && (
        <div style={S.champCard}>
          <div style={S.champTitle}>🏆 CAMPEÓN DEL MUNDO <span style={{color:"#E8C840"}}>(+16 pts)</span></div>
          <div style={S.champGrid}>
            {ALL_TEAMS.map(([team,flag])=>(
              <button key={team}
                style={{...S.champBtn,...(preds.champion===team?S.champOn:{})}}
                onClick={()=>setPreds(p=>({...p,champion:team}))}>
                {flag}<br/><span style={{fontSize:9}}>{team}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button style={{...S.btnMain,marginTop:20}} onClick={()=>onSave(preds)}>
        GUARDAR PICKS 💾
      </button>
    </div>
  );
}

function TeamBtn({team,flag,selected,disabled,correct,onClick}) {
  return (
    <button onClick={onClick} disabled={disabled&&!selected}
      style={{...S.teamBtn,
        ...(selected?S.teamOn:{}),
        ...(correct?S.teamCorrect:{}),
        ...(disabled&&!selected?{opacity:0.55,cursor:"default"}:{}),
      }}>
      <span style={S.teamFlag}>{flag}</span>
      <span style={S.teamName}>{team}</span>
    </button>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function LeaderboardScreen({players,results,user}) {
  const ranked = Object.entries(players)
    .map(([code,p])=>{
      const bd = calcScoreBreakdown(p.predictions||{},results);
      return {code,name:p.name,...bd};
    })
    .sort((a,b)=>b.total-a.total);

  const medals=["🥇","🥈","🥉"];
  return (
    <div style={S.lbWrap}>
      <div style={S.lbHeader}>
        <div style={S.lbTitle}>TABLA DE POSICIONES</div>
        <div style={S.lbSub}>{ranked.length} participantes</div>
      </div>
      {ranked.length===0
        ? <div style={S.empty}>Nadie registrado aún. ¡Sé el primero!</div>
        : ranked.map((p,i)=>(
          <div key={p.code} style={{...S.lbRow,...(p.code===user?.code?S.lbRowMe:{})}}>
            <span style={S.lbPos}>{medals[i]||`${i+1}`}</span>
            <div style={S.lbCodeWrap}>
              <span style={S.lbCode}>{p.code}</span>
            </div>
            <span style={S.lbName}>{p.name}</span>
            <div style={S.lbPts}>
              <span style={S.lbTotal}>{p.total}</span>
              <span style={S.lbBreak}>
                <span style={{color:"#60A5FA"}}>⚽{p.winPts}</span>
                {" "}
                <span style={{color:"#34D399"}}>⏱{p.timePts}</span>
              </span>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function AdminScreen({bracket,results,onSave,showToast}) {
  const [pass,setPass]=useState(""); const [auth,setAuth]=useState(false);
  const [localRes,setLocalRes]         = useState(() => JSON.parse(JSON.stringify(results)));
  const [localBracket,setLocalBracket] = useState(() => JSON.parse(JSON.stringify(bracket)));
  const [activeRound,setActiveRound]   = useState("r16");

  // Sync when parent saves
  useEffect(() => {
    setLocalRes(JSON.parse(JSON.stringify(results)));
    setLocalBracket(JSON.parse(JSON.stringify(bracket)));
  }, [results, bracket]);

  function login(){
    if(pass===ADMIN_PASS) setAuth(true);
    else showToast("Contraseña incorrecta","err");
  }

  function setWinner(roundKey, matchId, winner, flag) {
    setLocalRes(r => {
      const updated = {
        ...r,
        [roundKey]: {
          ...(r[roundKey]||{}),
          [matchId]: { ...((r[roundKey]||{})[matchId]||{}), winner, time: undefined }
        }
      };
      return updated;
    });
    // propagate to next round using functional form to avoid stale closure
    setLocalBracket(b => {
      const order=["r16","qf","sf","f"];
      const ri=order.indexOf(roundKey);
      if(ri>=order.length-1) return b;
      const next=order[ri+1];
      const idx=(b[roundKey]||[]).findIndex(m=>m.id===matchId);
      if(idx<0) return b;
      const nextIdx=Math.floor(idx/2);
      const slot=idx%2===0?"team1":"team2";
      const fslot=slot==="team1"?"flag1":"flag2";
      return {
        ...b,
        [next]: (b[next]||[]).map((m,i) => i===nextIdx ? {...m,[slot]:winner,[fslot]:flag} : m)
      };
    });
  }
  function setTime(roundKey, matchId, time){
    setLocalRes(r => ({
      ...r,
      [roundKey]: {
        ...(r[roundKey]||{}),
        [matchId]: { ...((r[roundKey]||{})[matchId]||{}), time }
      }
    }));
  }
  function clearResult(roundKey, matchId){
    setLocalRes(r => ({...r,[roundKey]:{...(r[roundKey]||{}),[matchId]:{}}}));
  }

  if(!auth) return (
    <div style={S.card}>
      <div style={S.cardBadge}>🔐 ADMIN</div>
      <input style={S.inp} placeholder="Contraseña admin" type="password"
        value={pass} onChange={e=>setPass(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&login()}/>
      <button style={S.btnMain} onClick={login}>ENTRAR</button>
    </div>
  );

  const rounds=[{key:"r16",label:"16AVOS"},{key:"qf",label:"CUARTOS"},{key:"sf",label:"SEMIS"},{key:"f",label:"FINAL"}];
  return (
    <div style={S.playWrap}>
      <div style={S.adminHeader}>
        <span style={S.adminTitle}>⚙️ PANEL ADMIN</span>
        <button style={S.btnMain} onClick={()=>onSave(localRes,localBracket)}>GUARDAR 💾</button>
      </div>
      <div style={S.tabs}>
        {rounds.map(r=>(
          <button key={r.key} onClick={()=>setActiveRound(r.key)}
            style={{...S.tab,...(activeRound===r.key?S.tabOn:{})}}>
            <span style={S.tabLabel}>{r.label}</span>
          </button>
        ))}
      </div>
      <div style={S.matchList}>
        {(localBracket[activeRound]||[]).map((m,idx)=>{
          const t1=m.team1||"TBD",f1=m.flag1||"🏳";
          const t2=m.team2||"TBD",f2=m.flag2||"🏳";
          const rData=(localRes[activeRound]||{})[m.id]||{};
          return (
            <div key={m.id} style={S.adminCard}>
              <div style={S.adminCardTop}>
                <span style={S.adminMatchNum}>Partido #{idx+1}</span>
                {rData.winner && <button style={S.clearBtn} onClick={()=>clearResult(activeRound,m.id)}>✕ Limpiar</button>}
              </div>
              <div style={S.adminTeams}>
                <button disabled={t1==="TBD"}
                  style={{...S.adminTeamBtn,...(rData.winner===t1?S.adminTeamOn:{})}}
                  onClick={()=>setWinner(activeRound,m.id,t1,f1)}>
                  {f1} {t1}
                </button>
                <span style={S.adminVs}>VS</span>
                <button disabled={t2==="TBD"}
                  style={{...S.adminTeamBtn,...(rData.winner===t2?S.adminTeamOn:{})}}
                  onClick={()=>setWinner(activeRound,m.id,t2,f2)}>
                  {f2} {t2}
                </button>
              </div>
              {rData.winner && (
                <div style={S.adminTimeBlock}>
                  <div style={S.adminTimeHeader}>
                    <span style={S.adminTimeHeaderLabel}>⏱ ¿Cómo ganó {rData.winner}?</span>
                    {!rData.time && <span style={S.adminTimePending}>← requerido</span>}
                    {rData.time  && <span style={S.adminTimeDone}>✓ registrado</span>}
                  </div>
                  <div style={S.adminTimeBtns}>
                    {TIME_OPTS.map(opt=>{
                      const sel = rData.time===opt.key;
                      return (
                      <button key={opt.key}
                        style={{...S.adminTimeBtn,...(sel?S.adminTimeOn:{})}}
                        onClick={()=>setTime(activeRound,m.id,opt.key)}>
                        <span style={{fontSize:20}}>{opt.icon}</span>
                        <span style={{...S.adminTimeOptLabel,...(sel?S.adminTimeOnLabel:{})}}>{opt.label}</span>
                        {sel && <span style={{color:"#22C55E",fontSize:11,fontFamily:FONT_COND,fontWeight:700}}>✓</span>}
                      </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {activeRound==="f" && (
        <div style={S.champCard}>
          <div style={S.champTitle}>🏆 DEFINIR CAMPEÓN</div>
          <div style={S.champGrid}>
            {ALL_TEAMS.map(([team,flag])=>(
              <button key={team}
                style={{...S.champBtn,...(localRes.champion===team?S.champOn:{})}}
                onClick={()=>setLocalRes(r=>({...r,champion:team}))}>
                {flag}<br/><span style={{fontSize:9}}>{team}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <button style={{...S.btnMain,marginTop:16}} onClick={()=>onSave(localRes,localBracket)}>
        GUARDAR RESULTADOS 💾
      </button>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({msg,type}) {
  return <div style={{...S.toast,...(type==="err"?S.toastErr:{})}}>{msg}</div>;
}

// ─── CSS KEYFRAMES ────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #040D18; }
  button:focus { outline: 2px solid #E8C840; outline-offset: 2px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
`;

// ─── STYLES ───────────────────────────────────────────────────────────────────
const FONT_COND = "'Barlow Condensed', 'Arial Narrow', sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";

const S = {
  root: {
    minHeight:"100vh",
    background:"#040D18",
    fontFamily: FONT_BODY,
    color:"#E2E8F0",
  },
  loadScreen:{
    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
    minHeight:"100vh",background:"#040D18",
  },
  spinner:{
    width:44,height:44,border:"3px solid #0F2A4A",
    borderTop:"3px solid #E8C840",borderRadius:"50%",
    animation:"spin 0.8s linear infinite",
  },

  // HEADER
  header:{
    display:"flex",alignItems:"center",justifyContent:"space-between",
    padding:"0 16px",height:56,
    background:"#020810",
    borderBottom:"2px solid #E8C840",
    position:"sticky",top:0,zIndex:200,
  },
  logoBtn:{ background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,padding:0 },
  logoMark:{
    width:36,height:36,background:"#E8C840",borderRadius:4,
    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
  },
  logoRam:{ fontSize:22 },
  logoTop:{ fontFamily:FONT_COND,fontWeight:900,fontSize:16,color:"#E8C840",letterSpacing:3,lineHeight:1 },
  logoBottom:{ fontFamily:FONT_COND,fontWeight:700,fontSize:11,color:"#60A5FA",letterSpacing:4,lineHeight:1.2 },
  nav:{ display:"flex",gap:4,alignItems:"center" },
  nb:{
    background:"transparent",border:"1px solid #1E3A5F",
    color:"#94A3B8",padding:"5px 9px",borderRadius:4,cursor:"pointer",
    fontFamily:FONT_COND,fontWeight:700,fontSize:12,letterSpacing:1,
  },
  nbOn:{ background:"#E8C840",color:"#040D18",borderColor:"#E8C840" },
  outBtn:{
    background:"#1A0808",border:"1px solid #7F1D1D",
    color:"#FCA5A5",padding:"5px 9px",borderRadius:4,cursor:"pointer",
    fontFamily:FONT_COND,fontWeight:700,fontSize:12,letterSpacing:1,
  },

  main:{ maxWidth:680,margin:"0 auto",padding:"20px 14px 80px" },

  // HOME
  homeWrap:{ display:"flex",flexDirection:"column",gap:16 },

  hero:{
    position:"relative",borderRadius:12,overflow:"hidden",
    background:"linear-gradient(135deg, #0A1628 0%, #0D2137 40%, #071020 100%)",
    border:"1px solid #1E3A5F",
  },
  heroStripe:{
    position:"absolute",top:0,left:0,right:0,height:4,
    background:"linear-gradient(90deg,#E8C840,#3B82F6,#EF4444,#E8C840)",
  },
  heroContent:{ padding:"32px 24px",textAlign:"center" },
  heroYear:{
    display:"inline-flex",alignItems:"center",justifyContent:"center",
    width:72,height:72,background:"#E8C840",borderRadius:8,marginBottom:16,
  },
  heroYearNum:{ fontFamily:FONT_COND,fontWeight:900,fontSize:40,color:"#040D18",lineHeight:1 },
  heroTitle:{
    fontFamily:FONT_COND,fontWeight:900,fontSize:26,letterSpacing:4,
    color:"#FFFFFF",margin:"0 0 6px",
  },
  heroSub:{ fontFamily:FONT_COND,fontWeight:600,fontSize:13,color:"#60A5FA",letterSpacing:3,margin:"0 0 16px" },
  heroDivider:{ height:2,background:"linear-gradient(90deg,transparent,#E8C840,transparent)",margin:"0 auto 16px",width:120 },
  heroDate:{ fontFamily:FONT_COND,fontWeight:600,fontSize:12,color:"#94A3B8",letterSpacing:2 },

  scoreLegend:{
    background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:12,padding:"16px",
  },
  scoreLegendTitle:{ fontFamily:FONT_COND,fontWeight:800,fontSize:13,color:"#E8C840",letterSpacing:3,marginBottom:12 },
  scoreGrid:{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6,marginBottom:10 },
  scoreCell:{
    display:"flex",flexDirection:"column",alignItems:"center",gap:2,
    background:"#0D1F35",borderRadius:6,padding:"8px 4px",
  },
  scorePts:{ fontFamily:FONT_COND,fontWeight:900,fontSize:22,color:"#E8C840" },
  scoreLabel:{ fontFamily:FONT_COND,fontSize:9,color:"#64748B",letterSpacing:1,textAlign:"center" },
  scoreNote:{ fontSize:11,color:"#60A5FA",textAlign:"center",margin:0 },

  progressCard:{
    background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:12,padding:16,
  },
  progressTitle:{ fontFamily:FONT_COND,fontWeight:800,fontSize:13,color:"#94A3B8",letterSpacing:3,marginBottom:14 },
  progRow:{ display:"flex",alignItems:"center",gap:10,marginBottom:8 },
  progName:{ fontFamily:FONT_COND,fontWeight:700,fontSize:11,letterSpacing:2,width:56 },
  progTrack:{ flex:1,height:5,background:"#1E3A5F",borderRadius:3,overflow:"hidden" },
  progBar:{ height:"100%",borderRadius:3,transition:"width 0.5s ease" },
  progNum:{ fontSize:11,color:"#475569",width:30,textAlign:"right" },

  heroBtns:{ display:"flex",flexDirection:"column",gap:10 },

  // BUTTONS
  btnMain:{
    background:"#E8C840",color:"#040D18",border:"none",
    borderRadius:6,padding:"13px 20px",
    fontFamily:FONT_COND,fontSize:15,fontWeight:900,letterSpacing:2,cursor:"pointer",
    width:"100%",
  },
  btnGhost:{
    background:"transparent",color:"#E8C840",border:"2px solid #E8C840",
    borderRadius:6,padding:"11px 20px",
    fontFamily:FONT_COND,fontSize:15,fontWeight:800,letterSpacing:2,cursor:"pointer",
    width:"100%",
  },
  btnLine:{
    background:"transparent",color:"#60A5FA",border:"1px solid #1E3A5F",
    borderRadius:6,padding:"11px 20px",
    fontFamily:FONT_COND,fontSize:14,fontWeight:700,letterSpacing:2,cursor:"pointer",
    width:"100%",
  },

  // CARD / FORMS
  card:{
    background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:12,
    padding:24,display:"flex",flexDirection:"column",gap:12,
    maxWidth:400,margin:"0 auto",
  },
  cardBadge:{
    fontFamily:FONT_COND,fontWeight:900,fontSize:18,letterSpacing:4,
    color:"#E8C840",textAlign:"center",marginBottom:4,
  },
  inp:{
    background:"#040D18",border:"1px solid #1E3A5F",borderRadius:6,
    padding:"12px 14px",color:"#E2E8F0",fontSize:14,outline:"none",
    fontFamily:FONT_BODY,
  },
  cardNote:{ fontSize:12,color:"#64748B",textAlign:"center",margin:0 },
  lnk:{ color:"#60A5FA",cursor:"pointer",textDecoration:"underline" },

  // PLAY
  playWrap:{ display:"flex",flexDirection:"column",gap:14 },
  userBar:{
    display:"flex",justifyContent:"space-between",alignItems:"center",
    background:"linear-gradient(135deg,#0A1628,#071020)",
    border:"1px solid #1E3A5F",borderRadius:12,padding:"14px 16px",
  },
  userCode:{ fontFamily:FONT_COND,fontWeight:900,fontSize:28,color:"#E8C840",letterSpacing:4 },
  userName:{ fontSize:12,color:"#94A3B8",marginTop:2 },
  scoreBox:{ textAlign:"right" },
  scoreTotal:{ fontFamily:FONT_COND,fontWeight:900,fontSize:36,color:"#FFFFFF",lineHeight:1 },
  scoreSub:{ fontFamily:FONT_COND,fontSize:11,color:"#E8C840",letterSpacing:2 },
  scoreDetail:{ fontSize:11,marginTop:2 },

  tabs:{ display:"flex",gap:6 },
  tab:{
    flex:1,background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:8,
    padding:"8px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,
  },
  tabOn:{ background:"#0D2137",border:"1px solid #E8C840" },
  tabLabel:{ fontFamily:FONT_COND,fontWeight:800,fontSize:12,color:"#CBD5E1",letterSpacing:1 },
  tabPts:{ fontFamily:FONT_COND,fontSize:10,color:"#E8C840" },
  tabPick:{ fontSize:10,color:"#475569" },

  matchList:{ display:"flex",flexDirection:"column",gap:10 },
  matchCard:{
    background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:12,
    padding:"12px",display:"flex",flexDirection:"column",gap:10,
    animation:"slideUp 0.2s ease",
  },
  matchNum:{ fontFamily:FONT_COND,fontSize:10,color:"#475569",letterSpacing:2 },
  resultRow:{ display:"flex",gap:10,alignItems:"center" },
  resOk:{ fontFamily:FONT_COND,fontWeight:700,fontSize:13,color:"#22C55E" },
  resErr:{ fontFamily:FONT_COND,fontWeight:700,fontSize:13,color:"#EF4444" },
  timeOk:{ fontFamily:FONT_COND,fontWeight:700,fontSize:12,color:"#34D399" },
  timeErr:{ fontFamily:FONT_COND,fontWeight:700,fontSize:12,color:"#EF4444" },

  matchRow:{ display:"flex",alignItems:"stretch",gap:8 },
  vsChip:{
    fontFamily:FONT_COND,fontWeight:900,fontSize:11,color:"#475569",
    display:"flex",alignItems:"center",flexShrink:0,letterSpacing:1,
  },
  teamBtn:{
    flex:1,background:"#040D18",border:"1px solid #1E3A5F",borderRadius:8,
    padding:"10px 6px",cursor:"pointer",
    display:"flex",flexDirection:"column",alignItems:"center",gap:4,
  },
  teamOn:{ background:"#0D1F35",border:"1px solid #E8C840" },
  teamCorrect:{ border:"1px solid #22C55E",background:"rgba(34,197,94,0.08)" },
  teamFlag:{ fontSize:24 },
  teamName:{ fontFamily:FONT_COND,fontWeight:700,fontSize:10,color:"#94A3B8",letterSpacing:0.5,textAlign:"center" },

  timeRow:{
    borderTop:"1px solid #1E3A5F",paddingTop:8,
    display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",
  },
  timeLabel:{ fontFamily:FONT_COND,fontSize:11,color:"#64748B",letterSpacing:1,flexShrink:0 },
  timeBtns:{ display:"flex",gap:6,flex:1,flexWrap:"wrap" },
  timeBtn:{
    flex:1,background:"#040D18",border:"1px solid #1E3A5F",borderRadius:6,
    padding:"6px 4px",cursor:"pointer",
    fontFamily:FONT_COND,fontSize:11,fontWeight:600,color:"#64748B",
    letterSpacing:0.5,whiteSpace:"nowrap",
  },
  timeBtnOn:{ background:"#0A2040",border:"1px solid #3B82F6",color:"#93C5FD" },
  timeBtnResult:{ border:"1px solid #22C55E",color:"#22C55E" },

  // CHAMPION
  champCard:{
    background:"linear-gradient(135deg,#0A1628,#071020)",
    border:"1px solid rgba(232,200,64,0.3)",borderRadius:12,padding:16,
  },
  champTitle:{
    fontFamily:FONT_COND,fontWeight:900,fontSize:15,letterSpacing:3,
    color:"#FFFFFF",textAlign:"center",marginBottom:12,
  },
  champGrid:{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6 },
  champBtn:{
    background:"#040D18",border:"1px solid #1E3A5F",borderRadius:8,
    padding:"8px 4px",cursor:"pointer",
    fontFamily:FONT_COND,fontSize:11,color:"#94A3B8",textAlign:"center",lineHeight:1.4,
  },
  champOn:{ background:"#1A1A00",border:"1px solid #E8C840",color:"#E8C840" },

  // LEADERBOARD
  lbWrap:{ display:"flex",flexDirection:"column",gap:8 },
  lbHeader:{
    background:"linear-gradient(135deg,#0A1628,#071020)",
    border:"1px solid #1E3A5F",borderRadius:12,padding:"20px 16px",
    textAlign:"center",marginBottom:4,
  },
  lbTitle:{ fontFamily:FONT_COND,fontWeight:900,fontSize:22,letterSpacing:4,color:"#E8C840" },
  lbSub:{ fontFamily:FONT_COND,fontSize:12,color:"#64748B",letterSpacing:2,marginTop:4 },
  lbRow:{
    display:"flex",alignItems:"center",gap:10,
    background:"#0A1628",border:"1px solid #1E3A5F",
    borderRadius:10,padding:"10px 14px",
  },
  lbRowMe:{ background:"#0D1F35",borderColor:"#E8C840",borderWidth:1 },
  lbPos:{ fontFamily:FONT_COND,fontWeight:900,fontSize:18,width:28,flexShrink:0 },
  lbCodeWrap:{ flexShrink:0 },
  lbCode:{
    fontFamily:FONT_COND,fontWeight:800,fontSize:13,letterSpacing:2,
    background:"#1E3A5F",borderRadius:4,padding:"2px 7px",color:"#60A5FA",
  },
  lbName:{ flex:1,fontSize:13,color:"#E2E8F0",fontWeight:500 },
  lbPts:{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2 },
  lbTotal:{ fontFamily:FONT_COND,fontWeight:900,fontSize:20,color:"#FFFFFF" },
  lbBreak:{ fontSize:10 },
  empty:{ color:"#475569",textAlign:"center",padding:"40px 20px",fontFamily:FONT_COND,fontSize:16,letterSpacing:2 },

  // ADMIN
  adminHeader:{
    display:"flex",justifyContent:"space-between",alignItems:"center",
    background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:10,padding:"12px 16px",
  },
  adminTitle:{ fontFamily:FONT_COND,fontWeight:900,fontSize:18,letterSpacing:3,color:"#E8C840" },
  adminCard:{
    background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:12,
    padding:12,display:"flex",flexDirection:"column",gap:8,
  },
  adminCardTop:{ display:"flex",justifyContent:"space-between",alignItems:"center" },
  adminMatchNum:{ fontFamily:FONT_COND,fontSize:11,color:"#475569",letterSpacing:2 },
  clearBtn:{
    background:"#1A0808",border:"1px solid #7F1D1D",color:"#FCA5A5",
    borderRadius:4,padding:"3px 8px",cursor:"pointer",
    fontFamily:FONT_COND,fontSize:11,fontWeight:600,
  },
  adminTeams:{ display:"flex",alignItems:"center",gap:8 },
  adminTeamBtn:{
    flex:1,background:"#040D18",border:"1px solid #1E3A5F",borderRadius:8,
    padding:"10px 8px",cursor:"pointer",
    fontFamily:FONT_COND,fontWeight:700,fontSize:13,color:"#94A3B8",letterSpacing:0.5,
  },
  adminTeamOn:{ background:"#0A2008",border:"1px solid #22C55E",color:"#22C55E" },
  adminVs:{ fontFamily:FONT_COND,fontWeight:900,fontSize:11,color:"#475569",flexShrink:0,letterSpacing:1 },
  adminTimeBlock:{
    borderTop:"2px solid #1E3A5F",paddingTop:10,marginTop:2,
    display:"flex",flexDirection:"column",gap:8,
  },
  adminTimeHeader:{
    display:"flex",alignItems:"center",justifyContent:"space-between",
  },
  adminTimeHeaderLabel:{
    fontFamily:FONT_COND,fontWeight:800,fontSize:13,color:"#CBD5E1",letterSpacing:1,
  },
  adminTimePending:{
    fontFamily:FONT_COND,fontWeight:700,fontSize:11,color:"#F59E0B",letterSpacing:1,
    background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)",
    borderRadius:4,padding:"2px 8px",
  },
  adminTimeDone:{
    fontFamily:FONT_COND,fontWeight:700,fontSize:11,color:"#22C55E",letterSpacing:1,
    background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",
    borderRadius:4,padding:"2px 8px",
  },
  adminTimeBtns:{ display:"flex",gap:8 },
  adminTimeBtn:{
    flex:1,background:"#040D18",border:"2px solid #1E3A5F",borderRadius:8,
    padding:"10px 6px",cursor:"pointer",
    display:"flex",flexDirection:"column",alignItems:"center",gap:4,
  },
  adminTimeOptLabel:{
    fontFamily:FONT_COND,fontWeight:700,fontSize:12,color:"#64748B",letterSpacing:0.5,
  },
  adminTimeOn:{
    background:"#0A1F3A",border:"2px solid #3B82F6",
  },
  adminTimeOnLabel:{ color:"#93C5FD" },

  // TOAST
  toast:{
    position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
    background:"#0D2137",border:"1px solid #3B82F6",
    borderRadius:8,padding:"12px 24px",
    fontFamily:FONT_COND,fontSize:14,fontWeight:700,letterSpacing:1,
    color:"#E2E8F0",zIndex:999,whiteSpace:"nowrap",
    boxShadow:"0 8px 32px rgba(0,0,0,0.6)",
  },
  toastErr:{ background:"#1A0808",borderColor:"#EF4444",color:"#FCA5A5" },
};
