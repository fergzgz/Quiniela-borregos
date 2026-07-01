import { useState, useEffect } from "react";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPA_URL = "https://poogunmcbpwyuwjcpnsn.supabase.co";
const SUPA_KEY = "sb_publishable_qcC9ixNNOWjvzbv1-2Yw1g_rNS9s0OE";
const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" };

async function sbGetPlayers() {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/players?select=*`, { headers: H });
    const rows = await r.json();
    const obj = {};
    for (const row of (Array.isArray(rows) ? rows : [])) {
      obj[row.code] = { name: row.name, pin: row.pin, predictions: row.predictions || {}, bonus: row.bonus || 0 };
    }
    return obj;
  } catch { return {}; }
}
async function sbSavePlayer(code, name, pin, predictions) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/players`, {
      method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ code, name, pin, predictions }),
    });
  } catch {}
}
async function sbSaveBonus(code, bonus) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/players?code=eq.${code}`, {
      method: "PATCH", headers: H,
      body: JSON.stringify({ bonus }),
    });
  } catch {}
}

async function sbGetResults() {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/results?id=eq.main`, { headers: H });
    const rows = await r.json();
    return rows?.[0]?.data ?? { r16:{}, r8:{}, qf:{}, sf:{}, third:{}, f:{}, champion:null };
  } catch { return { r16:{}, r8:{}, qf:{}, sf:{}, third:{}, f:{}, champion:null }; }
}
async function sbSetResults(data) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/results`, {
      method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ id:"main", data, updated_at: new Date().toISOString() }),
    });
  } catch {}
}
async function sbGetBracket() {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/bracket?id=eq.main`, { headers: H });
    const rows = await r.json();
    return rows?.[0]?.data ?? null;
  } catch { return null; }
}
async function sbSetBracket(data) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/bracket`, {
      method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ id:"main", data, updated_at: new Date().toISOString() }),
    });
  } catch {}
}
async function sbGetConfig() {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/config?id=eq.main`, { headers: H });
    const rows = await r.json();
    return rows?.[0]?.data ?? { lockedMatches:{}, championLocked:false };
  } catch { return { lockedMatches:{}, championLocked:false }; }
}
async function sbSetConfig(data) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/config`, {
      method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ id:"main", data, updated_at: new Date().toISOString() }),
    });
  } catch {}
}

// ─── FLAGS ────────────────────────────────────────────────────────────────────
const TEAM_FLAGS = {
  "Alemania":"de","Paraguay":"py","Francia":"fr","Suecia":"se",
  "Sudáfrica":"za","Canadá":"ca","Países Bajos":"nl","Marruecos":"ma",
  "Portugal":"pt","Croacia":"hr","España":"es","Austria":"at",
  "EUA":"us","Bosnia":"ba","Bélgica":"be","Senegal":"sn",
  "Brasil":"br","Japón":"jp","Costa de Marfil":"ci","Noruega":"no",
  "México":"mx","Ecuador":"ec","Inglaterra":"gb-eng","Congo":"cd",
  "Argentina":"ar","Cabo Verde":"cv","Australia":"au","Egipto":"eg",
  "Suiza":"ch","Argelia":"dz","Colombia":"co","Ghana":"gh",
};
function Flag({ team, size=32 }) {
  const code = TEAM_FLAGS[team];
  if (!code) return <span style={{fontSize:size*0.7}}>🏳</span>;
  return <img src={`https://flagcdn.com/w40/${code}.png`} alt={team}
    style={{width:size,height:"auto",borderRadius:3,display:"block",objectFit:"cover"}}
    onError={e=>{e.target.style.display="none"}}/>;
}

// ─── BRACKET DATA ─────────────────────────────────────────────────────────────
const INITIAL_BRACKET = {
  r16: [
    { id:"r16_0",  team1:"Alemania",       team2:"Paraguay",     date:"Lun 29 Jun", time:"14:30", venue:"Boston" },
    { id:"r16_1",  team1:"Francia",        team2:"Suecia",       date:"Mar 30 Jun", time:"15:00", venue:"Nueva York/NJ" },
    { id:"r16_2",  team1:"Sudáfrica",      team2:"Canadá",       date:"Dom 28 Jun", time:"13:00", venue:"Los Ángeles" },
    { id:"r16_3",  team1:"Países Bajos",   team2:"Marruecos",    date:"Lun 29 Jun", time:"19:00", venue:"Monterrey" },
    { id:"r16_4",  team1:"Portugal",       team2:"Croacia",      date:"Jue 2 Jul",  time:"17:00", venue:"Toronto" },
    { id:"r16_5",  team1:"España",         team2:"Austria",      date:"Jue 2 Jul",  time:"13:00", venue:"Los Ángeles" },
    { id:"r16_6",  team1:"EUA",            team2:"Bosnia",       date:"Mié 1 Jul",  time:"18:00", venue:"San Francisco" },
    { id:"r16_7",  team1:"Bélgica",        team2:"Senegal",      date:"Mié 1 Jul",  time:"14:00", venue:"Seattle" },
    { id:"r16_8",  team1:"Brasil",         team2:"Japón",        date:"Lun 29 Jun", time:"11:00", venue:"Houston" },
    { id:"r16_9",  team1:"Costa de Marfil",team2:"Noruega",      date:"Mar 30 Jun", time:"11:00", venue:"Dallas" },
    { id:"r16_10", team1:"México",         team2:"Ecuador",      date:"Mar 30 Jun", time:"19:00", venue:"Ciudad de México" },
    { id:"r16_11", team1:"Inglaterra",     team2:"Congo",        date:"Mié 1 Jul",  time:"10:00", venue:"Atlanta" },
    { id:"r16_12", team1:"Argentina",      team2:"Cabo Verde",   date:"Vie 3 Jul",  time:"16:00", venue:"Miami" },
    { id:"r16_13", team1:"Australia",      team2:"Egipto",       date:"Vie 3 Jul",  time:"12:00", venue:"Dallas" },
    { id:"r16_14", team1:"Suiza",          team2:"Argelia",      date:"Jue 2 Jul",  time:"21:00", venue:"Vancouver" },
    { id:"r16_15", team1:"Colombia",       team2:"Ghana",        date:"Vie 3 Jul",  time:"19:30", venue:"Kansas City" },
  ],
  r8:    Array.from({length:8}, (_,i) => ({ id:`r8_${i}`,    team1:null, team2:null, date:"", time:"", venue:"" })),
  qf:    Array.from({length:4}, (_,i) => ({ id:`qf_${i}`,    team1:null, team2:null, date:"", time:"", venue:"" })),
  sf:    Array.from({length:2}, (_,i) => ({ id:`sf_${i}`,    team1:null, team2:null, date:"", time:"", venue:"" })),
  third: [{ id:"third_0", team1:null, team2:null, date:"", time:"", venue:"" }],
  f:     [{ id:"f_0",     team1:null, team2:null, date:"19 Jul", time:"", venue:"MetLife Stadium" }],
};

// ─── ROUND CONFIG ─────────────────────────────────────────────────────────────
const ROUNDS = [
  { key:"r16",   label:"16AVOS",    pts:1 },
  { key:"r8",    label:"OCTAVOS",   pts:2 },
  { key:"qf",    label:"CUARTOS",   pts:4 },
  { key:"sf",    label:"SEMIS",     pts:6 },
  { key:"third", label:"3ER LUGAR", pts:4 },
  { key:"f",     label:"FINAL",     pts:8 },
];
const BASE_PTS   = { r16:1, r8:2, qf:4, sf:6, third:4, f:8, champion:16 };
const TIME_BONUS = 1;
const TIME_OPTS  = [
  { key:"90",  label:"90 min",   icon:"⚽" },
  { key:"et",  label:"Prórroga", icon:"⏱" },
  { key:"pen", label:"Penales",  icon:"🥅" },
];
// next round propagation map
const NEXT_ROUND = { r16:"r8", r8:"qf", qf:"sf", sf:"f" };
const ADMIN_PASS = "borregos2026";
const ALL_TEAMS  = Object.keys(TEAM_FLAGS);

// ─── SCORE ────────────────────────────────────────────────────────────────────
function calcScoreBreakdown(predictions, results, bonus = 0) {
  let winPts = 0, timePts = 0;
  for (const { key } of ROUNDS) {
    const pRound = predictions[key] || {};
    const rRound = results[key]     || {};
    for (const [id, rData] of Object.entries(rRound)) {
      if (!rData?.winner) continue;
      const pData = pRound[id];
      if (!pData?.winner) continue;
      if (pData.winner === rData.winner) {
        winPts += BASE_PTS[key];
        if (pData.time && pData.time === rData.time) timePts += TIME_BONUS;
      }
    }
  }
  if (predictions.champion && results.champion && predictions.champion === results.champion)
    winPts += BASE_PTS.champion;
  return { winPts, timePts, bonus, total: winPts + timePts + bonus };
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]                   = useState("home");
  const [user,   setUser]                     = useState(null);
  const [players, setPlayers]                 = useState({});
  const [results, setResults]                 = useState({ r16:{}, r8:{}, qf:{}, sf:{}, third:{}, f:{}, champion:null });
  const [officialBracket, setOfficialBracket] = useState(INITIAL_BRACKET);
  const [config,  setConfig]                  = useState({ lockedMatches:{}, championLocked:false });
  const [loading, setLoading]                 = useState(true);
  const [toast,   setToast]                   = useState(null);

  useEffect(() => {
    async function refresh(initial = false) {
      const [p, r, ob, cfg] = await Promise.all([sbGetPlayers(), sbGetResults(), sbGetBracket(), sbGetConfig()]);
      if (p) setPlayers(p);
      if (r) setResults(r);
      if (ob && ob.r16) setOfficialBracket(ob);
      if (cfg) setConfig(cfg);
      if (initial) setLoading(false);
    }
    refresh(true);
    // Auto-refresh every 15 seconds so picks, results and locks update for all users in real time
    const interval = setInterval(() => refresh(false), 15000);
    return () => clearInterval(interval);
  }, []);

  function showToast(msg, type="ok") { setToast({msg,type}); setTimeout(()=>setToast(null),2800); }

  async function handleLogin(code, pin) {
    const p = players[code.toUpperCase()];
    if (!p) return showToast("Código no encontrado","err");
    if (p.pin !== pin) return showToast("PIN incorrecto","err");
    setUser({ code:code.toUpperCase(), ...p });
    setScreen("play");
  }
  async function handleRegister(name, code, pin) {
    const c = code.toUpperCase();
    if (players[c])     return showToast("Ese código ya existe","err");
    if (c.length !== 3) return showToast("El código debe tener exactamente 3 letras","err");
    if (pin.length < 4) return showToast("PIN mínimo 4 dígitos","err");
    await sbSavePlayer(c, name, pin, {});
    const updated = {...players, [c]:{ name, pin, predictions:{} }};
    setPlayers(updated);
    setUser({ code:c, name, pin, predictions:{} });
    showToast("¡Bienvenido! Ya puedes hacer tus picks 🎉");
    setScreen("play");
  }
  function handleLogout() { setUser(null); setScreen("home"); }

  async function savePredictions(preds) {
    await sbSavePlayer(user.code, user.name, user.pin, preds);
    const updated = {...players, [user.code]:{ ...players[user.code], predictions:preds }};
    setPlayers(updated);
    setUser(u => ({...u, predictions:preds}));
    showToast("¡Picks guardados! ✅");
  }
  async function saveResults(newResults, newBracket) {
    await Promise.all([sbSetResults(newResults), sbSetBracket(newBracket)]);
    setResults(newResults);
    setOfficialBracket(newBracket);
    showToast("Resultados actualizados ✅");
  }
  async function saveConfig(newConfig) {
    await sbSetConfig(newConfig);
    setConfig(newConfig);
    showToast("Configuración guardada ✅");
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
        {screen==="home"        && <HomeScreen setScreen={setScreen} results={results} officialBracket={officialBracket}/>}
        {screen==="login"       && <LoginScreen onLogin={handleLogin} setScreen={setScreen}/>}
        {screen==="register"    && <RegisterScreen onRegister={handleRegister} setScreen={setScreen}/>}
        {screen==="play"        && <PlayScreen user={user} officialBracket={officialBracket} results={results} config={config} players={players} onSave={savePredictions}/>}
        {screen==="leaderboard" && <LeaderboardScreen players={players} results={results} config={config} user={user}/>}
        {screen==="admin"       && <AdminScreen bracket={officialBracket} results={results} config={config} players={players} setPlayers={setPlayers} onSave={saveResults} onSaveConfig={saveConfig} showToast={showToast}/>}
      </main>
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function Header({user,screen,setScreen,onLogout}) {
  return (
    <header style={S.header}>
      <button style={S.logoBtn} onClick={()=>setScreen("home")}>
        <div style={S.logoMark}><span style={S.logoRam}>🐏</span></div>
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
  const colors = { r16:"#3B82F6", r8:"#6366F1", qf:"#8B5CF6", sf:"#EC4899", third:"#F59E0B", f:"#E8C840" };
  return (
    <div style={S.homeWrap}>
      <div style={S.hero}>
        <div style={S.heroStripe}/>
        <div style={S.heroContent}>
          <div style={S.heroYear}><span style={S.heroYearNum}>26</span></div>
          <h1 style={S.heroTitle}>FIFA WORLD CUP™</h1>
          <p style={S.heroSub}>FASE FINAL · QUINIELA BORREGOS</p>
          <div style={S.heroDivider}/>
          <p style={S.heroDate}>🏟 FINAL · 19 DE JULIO · METLIFE STADIUM</p>
        </div>
      </div>
      <div style={S.scoreLegend}>
        <div style={S.scoreLegendTitle}>SISTEMA DE PUNTOS</div>
        <div style={S.scoreGrid}>
          {[["16AVOS","1"],["OCTAVOS","2"],["CUARTOS","4"],["SEMIS","6"],["3ER LUG","4"],["FINAL","8"],["CAMPEÓN","16"],["+ TIEMPO","1"]].map(([l,v])=>(
            <div key={l} style={S.scoreCell}>
              <span style={S.scorePts}>{v}</span>
              <span style={S.scoreLabel}>{l}</span>
            </div>
          ))}
        </div>
        <p style={S.scoreNote}>+1 pt extra por acertar si gana en 90 min, Prórroga o Penales</p>
      </div>
      <div style={S.progressCard}>
        <div style={S.progressTitle}>AVANCE DEL TORNEO</div>
        {ROUNDS.map(r=>{
          const total = officialBracket[r.key]?.length || 0;
          const done  = Object.values(results[r.key]||{}).filter(x=>x?.winner).length;
          const pct   = total ? (done/total)*100 : 0;
          return (
            <div key={r.key} style={S.progRow}>
              <span style={{...S.progName,color:colors[r.key]}}>{r.label}</span>
              <div style={S.progTrack}><div style={{...S.progBar,width:`${pct}%`,background:colors[r.key]}}/></div>
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

// ─── LOGIN / REGISTER ─────────────────────────────────────────────────────────
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
        <span style={S.lnk} onClick={()=>setScreen("register")}>Regístrate aquí</span></p>
    </div>
  );
}
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
        <span style={S.lnk} onClick={()=>setScreen("login")}>Inicia sesión</span></p>
    </div>
  );
}

// ─── PLAY ─────────────────────────────────────────────────────────────────────
function PlayScreen({user,officialBracket,results,config,players,onSave}) {
  const [preds,setPreds]             = useState(user?.predictions||{});
  const [activeRound,setActiveRound] = useState("r16");
  const [dirty,setDirty]             = useState(false);

  if (!user) return (
    <div style={S.card}>
      <p style={{color:"#94A3B8",textAlign:"center"}}>Inicia sesión para hacer tus picks.</p>
    </div>
  );

  function pickWinner(roundKey,matchId,winner) {
    if (config.lockedMatches?.[matchId]) return;
    setPreds(p=>{
      const existing = p[roundKey]?.[matchId] || {};
      return {...p,[roundKey]:{...(p[roundKey]||{}),[matchId]:{...existing,winner}}};
    });
    setDirty(true);
  }
  function pickTime(roundKey,matchId,time) {
    if (config.lockedMatches?.[matchId]) return;
    setPreds(p=>({...p,[roundKey]:{...(p[roundKey]||{}),[matchId]:{...(p[roundKey]?.[matchId]||{}),time}}}));
    setDirty(true);
  }
  function pickChampion(team) {
    if (config.championLocked) return;
    setPreds(p=>({...p,champion:team}));
    setDirty(true);
  }

  const breakdown = calcScoreBreakdown(preds, results, user?.bonus || 0);

  return (
    <div style={S.playWrap}>
      <div style={S.userBar}>
        <div>
          <div style={S.userCode}>{user.code}</div>
          <div style={S.userName}>{user.name}</div>
        </div>
        <div style={S.scoreBox}>
          <div style={S.scoreTotal}>{breakdown.total}</div>
          <div style={S.scoreSub}>PTS</div>
          <div style={S.scoreDetail}>
            <span style={{color:"#60A5FA"}}>⚽ {breakdown.winPts}</span>{" + "}
            <span style={{color:"#34D399"}}>⏱ {breakdown.timePts}</span>{breakdown.bonus > 0 && <span style={{color:"#E8C840"}}>{" + "}🎁 {breakdown.bonus}</span>}
          </div>
        </div>
      </div>

      <div style={S.tabs}>
        {ROUNDS.map(r=>{
          const matches = officialBracket[r.key]||[];
          const picked  = matches.filter(m=>(preds[r.key]||{})[m.id]?.winner).length;
          const anyLocked = matches.some(m=>config.lockedMatches?.[m.id]);
          return (
            <button key={r.key} onClick={()=>setActiveRound(r.key)}
              style={{...S.tab,...(activeRound===r.key?S.tabOn:{})}}>
              <span style={S.tabLabel}>{r.label}</span>
              <span style={S.tabPts}>+{r.pts}pts</span>
              <span style={S.tabPick}>{picked}/{matches.length}</span>
              {anyLocked && <span style={S.tabLock}>🔒</span>}
            </button>
          );
        })}
      </div>

      <div style={S.matchList}>
        {(officialBracket[activeRound]||[]).map((m,idx)=>{
          const t1=m.team1||"TBD", t2=m.team2||"TBD";
          const pData  = (preds[activeRound]||{})[m.id]||{};
          const rData  = (results[activeRound]||{})[m.id]||{};
          const locked = config.lockedMatches?.[m.id] || false;
          const hasResult = !!rData.winner;
          const winOk  = hasResult && pData.winner===rData.winner;
          const winErr = hasResult && pData.winner && pData.winner!==rData.winner;
          const timeOk = hasResult && winOk && pData.time && pData.time===rData.time;
          const isLive = locked && !hasResult;

          // collect other players' picks for this match (only when locked)
          const otherPicks = locked
            ? Object.entries(players)
                .filter(([code]) => code !== user.code)
                .map(([code, p]) => ({
                  code,
                  name: p.name,
                  pick: (p.predictions?.[activeRound]||{})[m.id] || null,
                }))
                .filter(x => x.pick?.winner)
            : [];

          return (
            <div key={m.id} style={{...S.matchCard,
              borderColor: hasResult?(winOk?"#22C55E":winErr?"#EF4444":"#1E3A5F"):isLive?"#F59E0B":"#1E3A5F"}}>

              {/* Match header */}
              <div style={S.matchMeta}>
                <span style={S.matchNum}>#{idx+1}</span>
                {m.date && <span style={S.matchDate}>{m.date}{m.time?` · ${m.time}`:""}{m.venue?` · ${m.venue}`:""}</span>}
                {isLive && <span style={S.liveBadge}>⚡ EN JUEGO</span>}
                {locked && !isLive && !hasResult && <span style={S.lockedTag}>🔒</span>}
              </div>

              {/* Result feedback */}
              {hasResult && (
                <div style={S.resultRow}>
                  <span style={winOk?S.resOk:S.resErr}>{winOk?"✅ +"+BASE_PTS[activeRound]:"❌"}</span>
                  {winOk && <span style={timeOk?S.timeOk:S.timeErr}>{timeOk?"⏱ +1":"⏱ ✗"}</span>}
                </div>
              )}

              {/* Team picks */}
              <div style={S.matchRow}>
                <TeamBtn team={t1} selected={pData.winner===t1} disabled={locked||hasResult}
                  correct={hasResult&&rData.winner===t1} onClick={()=>pickWinner(activeRound,m.id,t1)}/>
                <div style={S.vsChip}>VS</div>
                <TeamBtn team={t2} selected={pData.winner===t2} disabled={locked||hasResult}
                  correct={hasResult&&rData.winner===t2} onClick={()=>pickWinner(activeRound,m.id,t2)}/>
              </div>

              {/* Time pick */}
              {(pData.winner||hasResult||locked) && (
                <div style={S.timeRow}>
                  <span style={S.timeLabel}>¿Cómo gana?</span>
                  <div style={S.timeBtns}>
                    {TIME_OPTS.map(opt=>(
                      <button key={opt.key} disabled={locked||hasResult}
                        style={{...S.timeBtn,...(pData.time===opt.key?S.timeBtnOn:{}),...(hasResult&&rData.time===opt.key?S.timeBtnResult:{})}}
                        onClick={()=>pickTime(activeRound,m.id,opt.key)}>
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Other players' picks — visible once match is locked */}
              {locked && otherPicks.length > 0 && (
                <div style={S.othersWrap}>
                  <div style={S.othersTitle}>PICKS DEL GRUPO</div>
                  <div style={S.othersList}>
                    {otherPicks.map(op=>(
                      <div key={op.code} style={S.otherRow}>
                        <span style={S.otherCode}>{op.code}</span>
                        <span style={S.otherName}>{op.name}</span>
                        <div style={S.otherPick}>
                          <Flag team={op.pick.winner} size={16}/>
                          <span style={S.otherTeam}>{op.pick.winner}</span>
                          {op.pick.time && <span style={S.otherTime}>
                            {TIME_OPTS.find(t=>t.key===op.pick.time)?.icon}
                            {TIME_OPTS.find(t=>t.key===op.pick.time)?.label}
                          </span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Champion pick */}
      {activeRound==="f" && (
        <div style={S.champCard}>
          <div style={S.champTitle}>
            🏆 CAMPEÓN DEL MUNDO <span style={{color:"#E8C840"}}>(+16 pts)</span>
            {config.championLocked && <span style={S.champLocked}> 🔒</span>}
          </div>
          <div style={S.champGrid}>
            {ALL_TEAMS.map(team=>(
              <button key={team}
                style={{...S.champBtn,...(preds.champion===team?S.champOn:{}),...(config.championLocked?{opacity:0.7,cursor:"default"}:{})}}
                onClick={()=>pickChampion(team)}>
                <Flag team={team} size={26}/>
                <span style={{fontSize:9,marginTop:3}}>{team}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {dirty && (
        <button style={{...S.btnMain,marginTop:20}} onClick={async()=>{await onSave(preds);setDirty(false);}}>
          GUARDAR PICKS 💾
        </button>
      )}
    </div>
  );
}

function TeamBtn({team,selected,disabled,correct,onClick}) {
  return (
    <button onClick={onClick} disabled={disabled&&!selected}
      style={{...S.teamBtn,...(selected?S.teamOn:{}),...(correct?S.teamCorrect:{}),...(disabled&&!selected?{opacity:0.55,cursor:"default"}:{})}}>
      <Flag team={team} size={32}/>
      <span style={S.teamName}>{team}</span>
    </button>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function LeaderboardScreen({players,results,config,user}) {
  const ranked = Object.entries(players)
    .map(([code,p])=>{ const bd=calcScoreBreakdown(p.predictions||{},results,p.bonus||0); return {code,name:p.name,predictions:p.predictions||{},bonus:p.bonus||0,...bd}; })
    .sort((a,b)=>b.total-a.total);
  const medals=["🥇","🥈","🥉"];
  return (
    <div style={S.lbWrap}>
      <div style={S.lbHeader}>
        <div style={S.lbTitle}>TABLA DE POSICIONES</div>
        <div style={S.lbSub}>{ranked.length} participantes</div>
      </div>
      {ranked.length===0
        ? <div style={S.empty}>Nadie registrado aún.</div>
        : ranked.map((p,i)=>(
          <div key={p.code} style={{...S.lbRow,...(p.code===user?.code?S.lbRowMe:{})}}>
            <span style={S.lbPos}>{medals[i]||`${i+1}`}</span>
            <div style={S.lbCodeWrap}><span style={S.lbCode}>{p.code}</span></div>
            <div style={S.lbInfo}>
              <span style={S.lbName}>{p.name}</span>
              {config.championLocked && p.predictions.champion && (
                <span style={S.lbChamp}>
                  🏆 <Flag team={p.predictions.champion} size={14}/> {p.predictions.champion}
                </span>
              )}
            </div>
            <div style={S.lbPts}>
              <span style={S.lbTotal}>{p.total}</span>
              <span style={S.lbBreak}>
                <span style={{color:"#60A5FA"}}>⚽{p.winPts}</span>{" "}
                <span style={{color:"#34D399"}}>⏱{p.timePts}</span>{p.bonus > 0 && <span style={{color:"#E8C840"}}> 🎁{p.bonus}</span>}
              </span>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function AdminScreen({bracket,results,config,players,setPlayers,onSave,onSaveConfig,showToast}) {
  const [pass,setPass]                 = useState("");
  const [auth,setAuth]                 = useState(false);
  const [localRes,setLocalRes]         = useState(()=>JSON.parse(JSON.stringify(results)));
  const [localBracket,setLocalBracket] = useState(()=>JSON.parse(JSON.stringify(bracket)));
  const [localConfig,setLocalConfig]   = useState(()=>JSON.parse(JSON.stringify(config)));
  const [activeTab,setActiveTab]       = useState("results");
  const [bonusEdits,setBonusEdits]     = useState({});
  const [activeRound,setActiveRound]   = useState("r16");

  useEffect(()=>{
    setLocalRes(JSON.parse(JSON.stringify(results)));
    setLocalBracket(JSON.parse(JSON.stringify(bracket)));
    setLocalConfig(JSON.parse(JSON.stringify(config)));
  },[results,bracket,config]);

  function login(){ if(pass===ADMIN_PASS) setAuth(true); else showToast("Contraseña incorrecta","err"); }

  function setWinner(roundKey,matchId,winner){
    setLocalRes(r=>({...r,[roundKey]:{...(r[roundKey]||{}),[matchId]:{...((r[roundKey]||{})[matchId]||{}),winner,time:undefined}}}));
    setLocalBracket(b=>{
      const next = NEXT_ROUND[roundKey];
      if(!next) return b;
      const matches = b[roundKey]||[];
      const idx = matches.findIndex(m=>m.id===matchId);
      if(idx<0) return b;
      const nextIdx = Math.floor(idx/2);
      const slot = idx%2===0?"team1":"team2";
      let newB = {...b,[next]:(b[next]||[]).map((m,i)=>i===nextIdx?{...m,[slot]:winner}:m)};
      // propagate loser to third place if semifinal
      if(roundKey==="sf"){
        const loser = winner===matches[idx].team1 ? matches[idx].team2 : matches[idx].team1;
        if(loser){
          const thirdSlot = idx===0?"team1":"team2";
          newB = {...newB,third:(b.third||[]).map((m,i)=>i===0?{...m,[thirdSlot]:loser}:m)};
        }
      }
      return newB;
    });
  }
  function setTime(roundKey,matchId,time){
    setLocalRes(r=>({...r,[roundKey]:{...(r[roundKey]||{}),[matchId]:{...((r[roundKey]||{})[matchId]||{}),time}}}));
  }
  function clearResult(roundKey,matchId){
    setLocalRes(r=>({...r,[roundKey]:{...(r[roundKey]||{}),[matchId]:{}}}));
  }
  function toggleMatchLock(matchId){
    setLocalConfig(c=>({...c,lockedMatches:{...(c.lockedMatches||{}),[matchId]:!c.lockedMatches?.[matchId]}}));
  }
  function toggleChampionLock(){
    setLocalConfig(c=>({...c,championLocked:!c.championLocked}));
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

  return (
    <div style={S.playWrap}>
      <div style={S.adminHeader}>
        <span style={S.adminTitle}>⚙️ PANEL ADMIN</span>
      </div>

      {/* Admin main tabs */}
      <div style={S.tabs}>
        <button style={{...S.tab,...(activeTab==="results"?S.tabOn:{})}} onClick={()=>setActiveTab("results")}>
          <span style={S.tabLabel}>RESULTADOS</span>
        </button>
        <button style={{...S.tab,...(activeTab==="locks"?S.tabOn:{})}} onClick={()=>setActiveTab("locks")}>
          <span style={S.tabLabel}>🔒 BLOQUEOS</span>
        </button>
        <button style={{...S.tab,...(activeTab==="bonus"?S.tabOn:{})}} onClick={()=>setActiveTab("bonus")}>
          <span style={S.tabLabel}>🎁 BONUS</span>
        </button>
      </div>

      {/* ── BLOQUEOS TAB ── */}
      {activeTab==="locks" && (
        <div style={S.locksPanel}>
          <p style={S.locksPanelNote}>
            Bloquea cada partido individualmente. Al bloquearlo, todos los jugadores verán los picks de sus compañeros en ese partido. El campeón se bloquea por separado.
          </p>

          {/* Champion lock */}
          <div style={{...S.lockRow,borderColor:"#E8C840",marginBottom:8}}>
            <div>
              <div style={S.lockRoundName}>🏆 SELECCIÓN DE CAMPEÓN</div>
              <div style={S.lockRoundSub}>Al bloquear se muestra el campeón de cada jugador en la tabla</div>
            </div>
            <button style={{...S.lockBtn,...(localConfig.championLocked?S.lockBtnOn:{})}} onClick={toggleChampionLock}>
              {localConfig.championLocked?"🔒 BLOQUEADO":"🔓 ABIERTO"}
            </button>
          </div>

          {/* Per-round per-match locks */}
          {ROUNDS.map(r=>(
            <div key={r.key} style={S.lockRoundBlock}>
              <div style={S.lockRoundHeader}>{r.label}</div>
              {(localBracket[r.key]||[]).map((m,idx)=>{
                const t1=m.team1||"TBD", t2=m.team2||"TBD";
                const locked=localConfig.lockedMatches?.[m.id]||false;
                return (
                  <div key={m.id} style={S.lockMatchRow}>
                    <div style={S.lockMatchInfo}>
                      <span style={S.lockMatchNum}>#{idx+1}</span>
                      <div style={S.lockMatchTeams}>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <Flag team={t1} size={16}/><span style={S.lockTeamName}>{t1}</span>
                        </div>
                        <span style={{color:"#475569",fontSize:10}}>vs</span>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <Flag team={t2} size={16}/><span style={S.lockTeamName}>{t2}</span>
                        </div>
                      </div>
                      {m.date && <span style={S.lockMatchDate}>{m.date} {m.time}</span>}
                    </div>
                    <button style={{...S.lockBtn,...(locked?S.lockBtnOn:{})}} onClick={()=>toggleMatchLock(m.id)}>
                      {locked?"🔒":"🔓"}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}

          <button style={{...S.btnMain,marginTop:8}} onClick={()=>onSaveConfig(localConfig)}>
            GUARDAR BLOQUEOS 💾
          </button>
        </div>
      )}


      {/* ── BONUS TAB ── */}
      {activeTab==="bonus" && (
        <BonusPanel players={players} bonusEdits={bonusEdits} setBonusEdits={setBonusEdits}
          onSave={async (code, val) => {
            await sbSaveBonus(code, val);
            const updated = {...players, [code]: {...players[code], bonus: val}};
            setPlayers(updated);
            showToast(`Bonus actualizado para ${code} ✅`);
          }}/>
      )}
      {/* ── RESULTADOS TAB ── */}
      {activeTab==="results" && (
        <>
          <div style={S.tabs}>
            {ROUNDS.map(r=>(
              <button key={r.key} onClick={()=>setActiveRound(r.key)}
                style={{...S.tab,...(activeRound===r.key?S.tabOn:{})}}>
                <span style={S.tabLabel}>{r.label}</span>
              </button>
            ))}
          </div>
          <div style={S.matchList}>
            {(localBracket[activeRound]||[]).map((m,idx)=>{
              const t1=m.team1||"TBD", t2=m.team2||"TBD";
              const rData=(localRes[activeRound]||{})[m.id]||{};
              const locked=localConfig.lockedMatches?.[m.id]||false;
              return (
                <div key={m.id} style={{...S.adminCard,...(locked?{borderColor:"#F59E0B"}:{})}}>
                  <div style={S.adminCardTop}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={S.adminMatchNum}>Partido #{idx+1}</span>
                      {m.date && <span style={S.matchDate}>{m.date}{m.time?` · ${m.time}`:""}</span>}
                      {locked && <span style={{...S.liveBadge}}>🔒 BLOQUEADO</span>}
                    </div>
                    {rData.winner && <button style={S.clearBtn} onClick={()=>clearResult(activeRound,m.id)}>✕</button>}
                  </div>
                  <div style={S.adminTeams}>
                    <button disabled={t1==="TBD"}
                      style={{...S.adminTeamBtn,...(rData.winner===t1?S.adminTeamOn:{})}}
                      onClick={()=>setWinner(activeRound,m.id,t1)}>
                      <Flag team={t1} size={22}/> {t1}
                    </button>
                    <span style={S.adminVs}>VS</span>
                    <button disabled={t2==="TBD"}
                      style={{...S.adminTeamBtn,...(rData.winner===t2?S.adminTeamOn:{})}}
                      onClick={()=>setWinner(activeRound,m.id,t2)}>
                      <Flag team={t2} size={22}/> {t2}
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
                          const sel=rData.time===opt.key;
                          return (
                            <button key={opt.key}
                              style={{...S.adminTimeBtn,...(sel?S.adminTimeOn:{})}}
                              onClick={()=>setTime(activeRound,m.id,opt.key)}>
                              <span style={{fontSize:20}}>{opt.icon}</span>
                              <span style={{...S.adminTimeOptLabel,...(sel?S.adminTimeOnLabel:{})}}>{opt.label}</span>
                              {sel && <span style={{color:"#22C55E",fontSize:11,fontWeight:700}}>✓</span>}
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
                {ALL_TEAMS.map(team=>(
                  <button key={team} style={{...S.champBtn,...(localRes.champion===team?S.champOn:{})}}
                    onClick={()=>setLocalRes(r=>({...r,champion:team}))}>
                    <Flag team={team} size={22}/>
                    <span style={{fontSize:9,marginTop:3}}>{team}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <button style={{...S.btnMain,marginTop:16}} onClick={()=>onSave(localRes,localBracket)}>
            GUARDAR RESULTADOS 💾
          </button>
        </>
      )}
    </div>
  );
}


// ─── BONUS PANEL ──────────────────────────────────────────────────────────────
function BonusPanel({players, bonusEdits, setBonusEdits, onSave}) {
  return (
    <div style={S.bonusPanel}>
      <p style={S.bonusPanelNote}>
        Agrega puntos bonus manualmente a cualquier participante. Se suman al total en la tabla.
      </p>
      {Object.entries(players).map(([code, p]) => {
        const current = p.bonus || 0;
        const edit = bonusEdits[code] ?? current;
        return (
          <div key={code} style={S.bonusRow}>
            <div style={S.bonusInfo}>
              <span style={S.bonusCode}>{code}</span>
              <span style={S.bonusName}>{p.name}</span>
              {current > 0 && <span style={S.bonusCurrent}>🎁 {current} pts actuales</span>}
            </div>
            <div style={S.bonusControls}>
              <button style={S.bonusMinus}
                onClick={() => setBonusEdits(b => ({...b, [code]: Math.max(0, (b[code] ?? current) - 1)}))}>
                −
              </button>
              <span style={S.bonusVal}>{edit}</span>
              <button style={S.bonusPlus}
                onClick={() => setBonusEdits(b => ({...b, [code]: (b[code] ?? current) + 1}))}>
                +
              </button>
              <button style={{...S.btnSaveBonus,...(edit === current ? S.btnSaveBonusDisabled : {})}}
                disabled={edit === current}
                onClick={() => onSave(code, edit)}>
                GUARDAR
              </button>
            </div>
          </div>
        );
      })}
      {Object.keys(players).length === 0 && (
        <p style={{color:"#475569",textAlign:"center",fontFamily:FONT_COND,fontSize:14}}>No hay participantes registrados.</p>
      )}
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({msg,type}) {
  return <div style={{...S.toast,...(type==="err"?S.toastErr:{})}}>{msg}</div>;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #040D18; }
  button:focus { outline: 2px solid #E8C840; outline-offset: 2px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
`;
const FONT_COND = "'Barlow Condensed', 'Arial Narrow', sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";

const S = {
  root:{ minHeight:"100vh",background:"#040D18",fontFamily:FONT_BODY,color:"#E2E8F0" },
  loadScreen:{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#040D18" },
  spinner:{ width:44,height:44,border:"3px solid #0F2A4A",borderTop:"3px solid #E8C840",borderRadius:"50%",animation:"spin 0.8s linear infinite" },
  header:{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",height:56,background:"#020810",borderBottom:"2px solid #E8C840",position:"sticky",top:0,zIndex:200 },
  logoBtn:{ background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,padding:0 },
  logoMark:{ width:36,height:36,background:"#E8C840",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 },
  logoRam:{ fontSize:22 },
  logoTop:{ fontFamily:FONT_COND,fontWeight:900,fontSize:16,color:"#E8C840",letterSpacing:3,lineHeight:1 },
  logoBottom:{ fontFamily:FONT_COND,fontWeight:700,fontSize:11,color:"#60A5FA",letterSpacing:4,lineHeight:1.2 },
  nav:{ display:"flex",gap:4,alignItems:"center",flexWrap:"wrap" },
  nb:{ background:"transparent",border:"1px solid #1E3A5F",color:"#94A3B8",padding:"5px 9px",borderRadius:4,cursor:"pointer",fontFamily:FONT_COND,fontWeight:700,fontSize:12,letterSpacing:1 },
  nbOn:{ background:"#E8C840",color:"#040D18",borderColor:"#E8C840" },
  outBtn:{ background:"#1A0808",border:"1px solid #7F1D1D",color:"#FCA5A5",padding:"5px 9px",borderRadius:4,cursor:"pointer",fontFamily:FONT_COND,fontWeight:700,fontSize:12,letterSpacing:1 },
  main:{ maxWidth:680,margin:"0 auto",padding:"20px 14px 80px" },
  homeWrap:{ display:"flex",flexDirection:"column",gap:16 },
  hero:{ position:"relative",borderRadius:12,overflow:"hidden",background:"linear-gradient(135deg,#0A1628 0%,#0D2137 40%,#071020 100%)",border:"1px solid #1E3A5F" },
  heroStripe:{ position:"absolute",top:0,left:0,right:0,height:4,background:"linear-gradient(90deg,#E8C840,#3B82F6,#EF4444,#E8C840)" },
  heroContent:{ padding:"32px 24px",textAlign:"center" },
  heroYear:{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:72,height:72,background:"#E8C840",borderRadius:8,marginBottom:16 },
  heroYearNum:{ fontFamily:FONT_COND,fontWeight:900,fontSize:40,color:"#040D18",lineHeight:1 },
  heroTitle:{ fontFamily:FONT_COND,fontWeight:900,fontSize:26,letterSpacing:4,color:"#FFFFFF",margin:"0 0 6px" },
  heroSub:{ fontFamily:FONT_COND,fontWeight:600,fontSize:13,color:"#60A5FA",letterSpacing:3,margin:"0 0 16px" },
  heroDivider:{ height:2,background:"linear-gradient(90deg,transparent,#E8C840,transparent)",margin:"0 auto 16px",width:120 },
  heroDate:{ fontFamily:FONT_COND,fontWeight:600,fontSize:12,color:"#94A3B8",letterSpacing:2 },
  scoreLegend:{ background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:12,padding:16 },
  scoreLegendTitle:{ fontFamily:FONT_COND,fontWeight:800,fontSize:13,color:"#E8C840",letterSpacing:3,marginBottom:12 },
  scoreGrid:{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10 },
  scoreCell:{ display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"#0D1F35",borderRadius:6,padding:"8px 4px" },
  scorePts:{ fontFamily:FONT_COND,fontWeight:900,fontSize:20,color:"#E8C840" },
  scoreLabel:{ fontFamily:FONT_COND,fontSize:9,color:"#64748B",letterSpacing:0.5,textAlign:"center" },
  scoreNote:{ fontSize:11,color:"#60A5FA",textAlign:"center",margin:0 },
  progressCard:{ background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:12,padding:16 },
  progressTitle:{ fontFamily:FONT_COND,fontWeight:800,fontSize:13,color:"#94A3B8",letterSpacing:3,marginBottom:14 },
  progRow:{ display:"flex",alignItems:"center",gap:10,marginBottom:8 },
  progName:{ fontFamily:FONT_COND,fontWeight:700,fontSize:10,letterSpacing:1,width:64,flexShrink:0 },
  progTrack:{ flex:1,height:5,background:"#1E3A5F",borderRadius:3,overflow:"hidden" },
  progBar:{ height:"100%",borderRadius:3,transition:"width 0.5s ease" },
  progNum:{ fontSize:11,color:"#475569",width:30,textAlign:"right" },
  heroBtns:{ display:"flex",flexDirection:"column",gap:10 },
  btnMain:{ background:"#E8C840",color:"#040D18",border:"none",borderRadius:6,padding:"13px 20px",fontFamily:FONT_COND,fontSize:15,fontWeight:900,letterSpacing:2,cursor:"pointer",width:"100%" },
  btnGhost:{ background:"transparent",color:"#E8C840",border:"2px solid #E8C840",borderRadius:6,padding:"11px 20px",fontFamily:FONT_COND,fontSize:15,fontWeight:800,letterSpacing:2,cursor:"pointer",width:"100%" },
  btnLine:{ background:"transparent",color:"#60A5FA",border:"1px solid #1E3A5F",borderRadius:6,padding:"11px 20px",fontFamily:FONT_COND,fontSize:14,fontWeight:700,letterSpacing:2,cursor:"pointer",width:"100%" },
  card:{ background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:12,padding:24,display:"flex",flexDirection:"column",gap:12,maxWidth:400,margin:"0 auto" },
  cardBadge:{ fontFamily:FONT_COND,fontWeight:900,fontSize:18,letterSpacing:4,color:"#E8C840",textAlign:"center",marginBottom:4 },
  inp:{ background:"#040D18",border:"1px solid #1E3A5F",borderRadius:6,padding:"12px 14px",color:"#E2E8F0",fontSize:14,outline:"none",fontFamily:FONT_BODY },
  cardNote:{ fontSize:12,color:"#64748B",textAlign:"center",margin:0 },
  lnk:{ color:"#60A5FA",cursor:"pointer",textDecoration:"underline" },
  playWrap:{ display:"flex",flexDirection:"column",gap:14 },
  userBar:{ display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(135deg,#0A1628,#071020)",border:"1px solid #1E3A5F",borderRadius:12,padding:"14px 16px" },
  userCode:{ fontFamily:FONT_COND,fontWeight:900,fontSize:28,color:"#E8C840",letterSpacing:4 },
  userName:{ fontSize:12,color:"#94A3B8",marginTop:2 },
  scoreBox:{ textAlign:"right" },
  scoreTotal:{ fontFamily:FONT_COND,fontWeight:900,fontSize:36,color:"#FFFFFF",lineHeight:1 },
  scoreSub:{ fontFamily:FONT_COND,fontSize:11,color:"#E8C840",letterSpacing:2 },
  scoreDetail:{ fontSize:11,marginTop:2 },
  tabs:{ display:"flex",gap:6,flexWrap:"wrap" },
  tab:{ flex:1,minWidth:56,background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:8,padding:"8px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1 },
  tabOn:{ background:"#0D2137",border:"1px solid #E8C840" },
  tabLabel:{ fontFamily:FONT_COND,fontWeight:800,fontSize:11,color:"#CBD5E1",letterSpacing:0.5 },
  tabPts:{ fontFamily:FONT_COND,fontSize:9,color:"#E8C840" },
  tabPick:{ fontSize:9,color:"#475569" },
  tabLock:{ fontSize:10 },
  matchList:{ display:"flex",flexDirection:"column",gap:10 },
  matchCard:{ background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:12,padding:12,display:"flex",flexDirection:"column",gap:10,animation:"slideUp 0.2s ease" },
  matchMeta:{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" },
  matchNum:{ fontFamily:FONT_COND,fontSize:10,color:"#475569",letterSpacing:2 },
  matchDate:{ fontFamily:FONT_COND,fontSize:10,color:"#3B82F6",letterSpacing:0.5 },
  liveBadge:{ fontFamily:FONT_COND,fontWeight:800,fontSize:10,color:"#F59E0B",letterSpacing:1,animation:"pulse 1.5s infinite" },
  lockedTag:{ fontSize:11 },
  resultRow:{ display:"flex",gap:10,alignItems:"center" },
  resOk:{ fontFamily:FONT_COND,fontWeight:700,fontSize:13,color:"#22C55E" },
  resErr:{ fontFamily:FONT_COND,fontWeight:700,fontSize:13,color:"#EF4444" },
  timeOk:{ fontFamily:FONT_COND,fontWeight:700,fontSize:12,color:"#34D399" },
  timeErr:{ fontFamily:FONT_COND,fontWeight:700,fontSize:12,color:"#EF4444" },
  matchRow:{ display:"flex",alignItems:"stretch",gap:8 },
  vsChip:{ fontFamily:FONT_COND,fontWeight:900,fontSize:11,color:"#475569",display:"flex",alignItems:"center",flexShrink:0,letterSpacing:1 },
  teamBtn:{ flex:1,background:"#040D18",border:"1px solid #1E3A5F",borderRadius:8,padding:"10px 6px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4 },
  teamOn:{ background:"#0D1F35",border:"1px solid #E8C840" },
  teamCorrect:{ border:"1px solid #22C55E",background:"rgba(34,197,94,0.08)" },
  teamName:{ fontFamily:FONT_COND,fontWeight:700,fontSize:10,color:"#94A3B8",letterSpacing:0.5,textAlign:"center" },
  timeRow:{ borderTop:"1px solid #1E3A5F",paddingTop:8,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" },
  timeLabel:{ fontFamily:FONT_COND,fontSize:11,color:"#64748B",letterSpacing:1,flexShrink:0 },
  timeBtns:{ display:"flex",gap:6,flex:1,flexWrap:"wrap" },
  timeBtn:{ flex:1,background:"#040D18",border:"1px solid #1E3A5F",borderRadius:6,padding:"6px 4px",cursor:"pointer",fontFamily:FONT_COND,fontSize:11,fontWeight:600,color:"#64748B",whiteSpace:"nowrap" },
  timeBtnOn:{ background:"#0A2040",border:"1px solid #3B82F6",color:"#93C5FD" },
  timeBtnResult:{ border:"1px solid #22C55E",color:"#22C55E" },
  // others picks
  othersWrap:{ borderTop:"1px solid #1E2A4A",paddingTop:10,marginTop:2 },
  othersTitle:{ fontFamily:FONT_COND,fontWeight:800,fontSize:10,color:"#475569",letterSpacing:2,marginBottom:8 },
  othersList:{ display:"flex",flexDirection:"column",gap:6 },
  otherRow:{ display:"flex",alignItems:"center",gap:8,background:"#040D18",borderRadius:6,padding:"6px 10px" },
  otherCode:{ fontFamily:FONT_COND,fontWeight:800,fontSize:11,color:"#E8C840",width:32,flexShrink:0 },
  otherName:{ fontSize:11,color:"#94A3B8",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" },
  otherPick:{ display:"flex",alignItems:"center",gap:4,flexShrink:0 },
  otherTeam:{ fontFamily:FONT_COND,fontWeight:700,fontSize:11,color:"#E2E8F0" },
  otherTime:{ fontFamily:FONT_COND,fontSize:10,color:"#60A5FA",marginLeft:4 },
  // champion
  champCard:{ background:"linear-gradient(135deg,#0A1628,#071020)",border:"1px solid rgba(232,200,64,0.3)",borderRadius:12,padding:16 },
  champTitle:{ fontFamily:FONT_COND,fontWeight:900,fontSize:14,letterSpacing:2,color:"#FFFFFF",textAlign:"center",marginBottom:12 },
  champLocked:{ color:"#EF4444" },
  champGrid:{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6 },
  champBtn:{ background:"#040D18",border:"1px solid #1E3A5F",borderRadius:8,padding:"8px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",fontFamily:FONT_COND,color:"#94A3B8",lineHeight:1.4 },
  champOn:{ background:"#1A1A00",border:"1px solid #E8C840",color:"#E8C840" },
  // leaderboard
  lbWrap:{ display:"flex",flexDirection:"column",gap:8 },
  lbHeader:{ background:"linear-gradient(135deg,#0A1628,#071020)",border:"1px solid #1E3A5F",borderRadius:12,padding:"20px 16px",textAlign:"center",marginBottom:4 },
  lbTitle:{ fontFamily:FONT_COND,fontWeight:900,fontSize:22,letterSpacing:4,color:"#E8C840" },
  lbSub:{ fontFamily:FONT_COND,fontSize:12,color:"#64748B",letterSpacing:2,marginTop:4 },
  lbRow:{ display:"flex",alignItems:"center",gap:10,background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:10,padding:"10px 14px" },
  lbRowMe:{ background:"#0D1F35",borderColor:"#E8C840" },
  lbPos:{ fontFamily:FONT_COND,fontWeight:900,fontSize:18,width:28,flexShrink:0 },
  lbCodeWrap:{ flexShrink:0 },
  lbCode:{ fontFamily:FONT_COND,fontWeight:800,fontSize:13,letterSpacing:2,background:"#1E3A5F",borderRadius:4,padding:"2px 7px",color:"#60A5FA" },
  lbInfo:{ flex:1,display:"flex",flexDirection:"column",gap:2,minWidth:0 },
  lbName:{ fontSize:13,color:"#E2E8F0",fontWeight:500 },
  lbChamp:{ display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#E8C840",fontFamily:FONT_COND,fontWeight:600 },
  lbPts:{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2,flexShrink:0 },
  lbTotal:{ fontFamily:FONT_COND,fontWeight:900,fontSize:20,color:"#FFFFFF" },
  lbBreak:{ fontSize:10 },
  empty:{ color:"#475569",textAlign:"center",padding:"40px 20px",fontFamily:FONT_COND,fontSize:16,letterSpacing:2 },
  // admin
  adminHeader:{ display:"flex",justifyContent:"space-between",alignItems:"center",background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:10,padding:"12px 16px" },
  adminTitle:{ fontFamily:FONT_COND,fontWeight:900,fontSize:18,letterSpacing:3,color:"#E8C840" },
  adminCard:{ background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:12,padding:12,display:"flex",flexDirection:"column",gap:8 },
  adminCardTop:{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:4 },
  adminMatchNum:{ fontFamily:FONT_COND,fontSize:11,color:"#475569",letterSpacing:2 },
  clearBtn:{ background:"#1A0808",border:"1px solid #7F1D1D",color:"#FCA5A5",borderRadius:4,padding:"3px 8px",cursor:"pointer",fontFamily:FONT_COND,fontSize:11,fontWeight:600 },
  adminTeams:{ display:"flex",alignItems:"center",gap:8 },
  adminTeamBtn:{ flex:1,background:"#040D18",border:"1px solid #1E3A5F",borderRadius:8,padding:"8px",cursor:"pointer",fontFamily:FONT_COND,fontWeight:700,fontSize:12,color:"#94A3B8",display:"flex",alignItems:"center",gap:6 },
  adminTeamOn:{ background:"#0A2008",border:"1px solid #22C55E",color:"#22C55E" },
  adminVs:{ fontFamily:FONT_COND,fontWeight:900,fontSize:11,color:"#475569",flexShrink:0 },
  adminTimeBlock:{ borderTop:"2px solid #1E3A5F",paddingTop:10,display:"flex",flexDirection:"column",gap:8 },
  adminTimeHeader:{ display:"flex",alignItems:"center",justifyContent:"space-between" },
  adminTimeHeaderLabel:{ fontFamily:FONT_COND,fontWeight:800,fontSize:13,color:"#CBD5E1",letterSpacing:1 },
  adminTimePending:{ fontFamily:FONT_COND,fontWeight:700,fontSize:11,color:"#F59E0B",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:4,padding:"2px 8px" },
  adminTimeDone:{ fontFamily:FONT_COND,fontWeight:700,fontSize:11,color:"#22C55E",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:4,padding:"2px 8px" },
  adminTimeBtns:{ display:"flex",gap:8 },
  adminTimeBtn:{ flex:1,background:"#040D18",border:"2px solid #1E3A5F",borderRadius:8,padding:"10px 6px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4 },
  adminTimeOptLabel:{ fontFamily:FONT_COND,fontWeight:700,fontSize:12,color:"#64748B" },
  adminTimeOn:{ background:"#0A1F3A",border:"2px solid #3B82F6" },
  adminTimeOnLabel:{ color:"#93C5FD" },
  // locks
  locksPanel:{ display:"flex",flexDirection:"column",gap:10 },
  locksPanelNote:{ fontSize:12,color:"#64748B",margin:"0 0 4px",lineHeight:1.6 },
  lockRoundBlock:{ background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:10,overflow:"hidden" },
  lockRoundHeader:{ fontFamily:FONT_COND,fontWeight:800,fontSize:12,color:"#E8C840",letterSpacing:3,padding:"8px 12px",background:"#0D1F35",borderBottom:"1px solid #1E3A5F" },
  lockMatchRow:{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderBottom:"1px solid #0D1F35",gap:8 },
  lockMatchInfo:{ display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0,flexWrap:"wrap" },
  lockMatchNum:{ fontFamily:FONT_COND,fontSize:10,color:"#475569",flexShrink:0 },
  lockMatchTeams:{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" },
  lockTeamName:{ fontFamily:FONT_COND,fontWeight:600,fontSize:11,color:"#CBD5E1" },
  lockMatchDate:{ fontFamily:FONT_COND,fontSize:9,color:"#3B82F6",letterSpacing:0.5 },
  lockRow:{ display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:10,padding:"12px 14px",gap:12 },
  lockRoundName:{ fontFamily:FONT_COND,fontWeight:800,fontSize:14,color:"#CBD5E1",letterSpacing:1 },
  lockRoundSub:{ fontSize:11,color:"#475569",marginTop:2 },
  lockBtn:{ background:"#0D1F35",border:"1px solid #1E3A5F",borderRadius:6,padding:"8px 14px",cursor:"pointer",fontFamily:FONT_COND,fontWeight:700,fontSize:12,color:"#64748B",letterSpacing:1,flexShrink:0,whiteSpace:"nowrap" },
  lockBtnOn:{ background:"#1A0808",border:"1px solid #EF4444",color:"#FCA5A5" },
  toast:{ position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#0D2137",border:"1px solid #3B82F6",borderRadius:8,padding:"12px 24px",fontFamily:FONT_COND,fontSize:14,fontWeight:700,letterSpacing:1,color:"#E2E8F0",zIndex:999,whiteSpace:"nowrap",boxShadow:"0 8px 32px rgba(0,0,0,0.6)" },

  bonusPanel:{ display:"flex",flexDirection:"column",gap:10 },
  bonusPanelNote:{ fontSize:12,color:"#64748B",margin:"0 0 4px",lineHeight:1.6 },
  bonusRow:{ display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0A1628",border:"1px solid #1E3A5F",borderRadius:10,padding:"10px 14px",gap:12,flexWrap:"wrap" },
  bonusInfo:{ display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0 },
  bonusCode:{ fontFamily:FONT_COND,fontWeight:800,fontSize:13,color:"#E8C840",letterSpacing:2,flexShrink:0 },
  bonusName:{ fontSize:12,color:"#94A3B8",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" },
  bonusCurrent:{ fontFamily:FONT_COND,fontSize:11,color:"#E8C840",flexShrink:0 },
  bonusControls:{ display:"flex",alignItems:"center",gap:6,flexShrink:0 },
  bonusMinus:{ background:"#1A0808",border:"1px solid #7F1D1D",color:"#FCA5A5",width:30,height:30,borderRadius:6,cursor:"pointer",fontFamily:FONT_COND,fontWeight:900,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" },
  bonusPlus:{ background:"#0A2008",border:"1px solid #22C55E",color:"#86EFAC",width:30,height:30,borderRadius:6,cursor:"pointer",fontFamily:FONT_COND,fontWeight:900,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" },
  bonusVal:{ fontFamily:FONT_COND,fontWeight:900,fontSize:22,color:"#FFFFFF",minWidth:32,textAlign:"center" },
  btnSaveBonus:{ background:"#E8C840",color:"#040D18",border:"none",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontFamily:FONT_COND,fontWeight:800,fontSize:11,letterSpacing:1 },
  btnSaveBonusDisabled:{ background:"#1E3A5F",color:"#475569",cursor:"default" },
  toastErr:{ background:"#1A0808",borderColor:"#EF4444",color:"#FCA5A5" },
};
