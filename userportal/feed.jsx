// Daily Insight Feed — personalized to user's uploaded data
const InsightFeed = ({ tier, setRoute }) => {
  const D = window.SC_DATA;
  const [, forceUpdate] = React.useReducer(x=>x+1, 0);
  React.useEffect(() => { window.SC_STATE.subscribe(forceUpdate); }, []);

  const hasData = window.SC_STATE.hasData;
  const userCarriers  = hasData ? window.SC_AGG.carriers()  : [];
  const userPlatforms = hasData ? window.SC_AGG.platforms() : [];

  const [filter, setFilter] = React.useState("all");
  const [liked, setLiked]   = React.useState({});
  const [dismissed, setDismissed] = React.useState({});

  const cats = [
    { id:"all",      label:"All"      },
    { id:"Carrier",  label:"Carrier",  color:"red"    },
    { id:"Platform", label:"Platform", color:"amber"  },
    { id:"Trade",    label:"Trade",    color:"purple" },
    { id:"Logistics",label:"Logistics",color:"teal"   },
    { id:"Internal", label:"Your data",color:"yellow" },
    { id:"Tip",      label:"Tips",     color:"green"  },
  ];

  // Score each insight by relevance to user's data
  const score = (it) => {
    let s = 0;
    if (!hasData) return 0;
    if (it.cat === "Internal") s += 5;
    if (it.cat === "Tip")      s += 3;
    if (it.cat === "Carrier" && userCarriers.some(c => it.head.toLowerCase().includes(c.toLowerCase().split(" ")[0]))) s += 3;
    if (it.cat === "Platform" && userPlatforms.some(p => it.head.toLowerCase().includes(p.toLowerCase()))) s += 3;
    return s;
  };

  // Auto-generate internal insight from real data if available
  const internalInsights = hasData ? (() => {
    const A = window.SC_AGG;
    const avgZone = A.avgZone();
    const pct6 = A.pctZone6plus();
    const dimPct = A.dimOverchargePct();
    const annualSavings = A.annualSavings();
    const carriers = A.carriers();
    const platforms = A.platforms();
    const insights = [];

    if (pct6 > 15) insights.push({
      cat:"Internal", catLabel:"Your Data", color:"yellow",
      sev:"warning",
      head:`Zone 6+ share is ${pct6.toFixed(1)}% of your shipments`,
      body:`Based on your uploaded data, ${pct6.toFixed(1)}% of your shipments are going to Zone 6 or higher. This is a significant cost driver — higher zones mean longer last-mile hauls and higher carrier rates.`,
      means:`At your current volume, shifting to SC's NJ · TX · CA 3-node network would reduce this to approximately 13%, saving an estimated $${Math.round(annualSavings * 0.4).toLocaleString()}/yr on last-mile alone.`,
      impact:`$${Math.round(annualSavings * 0.4).toLocaleString()} exposure`,
      sources:"Internal pattern detection · ShippingCow zone model",
      ts:"Just now",
    });

    if (dimPct > 20) insights.push({
      cat:"Internal", catLabel:"Your Data", color:"yellow",
      sev:"warning",
      head:`${dimPct.toFixed(1)}% of your shipments are billed on dimensional weight`,
      body:`Your data shows ${dimPct.toFixed(1)}% of shipments where the carrier billed on dimensional weight rather than actual weight — indicating oversized packaging on a significant portion of your volume.`,
      means:`Switching to right-sized boxes on your top dim-offender SKUs could recover approximately $${Math.round(A.dimOverchargeTotal() * (365/(A._dateRangeDays()||90))).toLocaleString()}/yr in overcharges.`,
      impact:`$${Math.round(A.dimOverchargeTotal() * (365/(A._dateRangeDays()||90))).toLocaleString()}/yr`,
      sources:"Internal pattern detection · ShippingCow dim model",
      ts:"Just now",
    });

    if (carriers.length > 0) insights.push({
      cat:"Internal", catLabel:"Your Data", color:"yellow",
      sev:"opportunity",
      head:`SC negotiated rates available for your carriers: ${carriers.slice(0,2).join(", ")}`,
      body:`You're shipping with ${carriers.join(", ")}. ShippingCow has pre-negotiated rates with all of these carriers — typically 20–30% below retail for your volume tier.`,
      means:`Switching your ${carriers[0]} volume to SC's negotiated rate would save approximately $${Math.round(annualSavings * 0.35).toLocaleString()}/yr.`,
      impact:`$${Math.round(annualSavings * 0.35).toLocaleString()}/yr`,
      sources:"ShippingCow rate database · Internal carrier analysis",
      ts:"Just now",
    });
    return insights;
  })() : [];

  const allInsights = [...internalInsights, ...D.insights]
    .filter(x => !dismissed[x.head])
    .filter(x => filter === "all" || x.cat === filter)
    .sort((a,b) => score(b) - score(a));

  const sevDot = { critical:"#C53030", warning:"#D97706", opportunity:"#2F855A", info:"#0E7490" };

  return (
    <div className="page">
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14}}>
        <div>
          <div style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:1.5, textTransform:"uppercase", color:"var(--gray)"}}>Today · Apr 30, 2026</div>
          <div style={{fontFamily:"var(--font-display)", fontSize:24, textTransform:"uppercase", letterSpacing:0.5, marginTop:2}}>
            {hasData ? "Personalized to your data" : "Market intelligence"}
          </div>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          {!hasData && (
            <div style={{padding:"8px 12px", background:"var(--yellow-soft,#fffbeb)", border:"1.5px dashed var(--ink)", borderRadius:6, fontFamily:"var(--font-mono)", fontSize:11.5}}>
              Upload data in Silo to personalize this feed →
              <button className="btn sm primary" style={{marginLeft:8}} onClick={()=>setRoute("silo")}>Upload</button>
            </div>
          )}
          <button className="btn sm"><Icon name="bell" size={12}/> Watchlist · {tier==="calf"?"3/5":tier==="cow"?"8/20":"12"}</button>
        </div>
      </div>

      <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:18}}>
        {cats.map(c => (
          <button key={c.id} className={`btn sm ${filter===c.id?"primary":""}`} onClick={()=>setFilter(c.id)}>{c.label}</button>
        ))}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 320px", gap:18}}>
        <div style={{display:"flex", flexDirection:"column", gap:14}}>
          {allInsights.length === 0 && (
            <div style={{textAlign:"center", padding:"40px 20px", color:"var(--gray)", fontFamily:"var(--font-mono)", fontSize:12}}>
              No insights match this filter.
            </div>
          )}
          {allInsights.map((it, i) => (
            <div key={i} className="feed-card">
              <div className="meta">
                <span className={`tag ${it.color}`}>{it.catLabel}</span>
                <span style={{display:"inline-flex", alignItems:"center", gap:5, fontFamily:"var(--font-mono)", fontSize:10.5, letterSpacing:1, textTransform:"uppercase", color:"var(--gray)"}}>
                  <span style={{width:8, height:8, borderRadius:"50%", background:sevDot[it.sev]}}/>{it.sev}
                </span>
                <span style={{fontFamily:"var(--font-mono)", fontSize:10.5, color:"var(--gray)"}}>· {it.ts}</span>
                <span className="impact">{it.impact}</span>
                {it.cat === "Internal" && hasData && <span style={{fontFamily:"var(--font-mono)", fontSize:9.5, background:"var(--blue)", color:"#fff", padding:"2px 6px", borderRadius:3, letterSpacing:1}}>FROM YOUR DATA</span>}
              </div>
              <div className="head">{it.head}</div>
              <p style={{margin:"8px 0 0", fontSize:13.5}}>{it.body}</p>
              <div className="means">
                <strong style={{fontFamily:"var(--font-mono)", fontSize:10.5, letterSpacing:1.5, textTransform:"uppercase"}}>What this means for you</strong>
                <div style={{marginTop:4}}>{it.means}</div>
              </div>
              <div className="cite">Sources: {it.sources}</div>
              <div className="actions">
                <button className="icon-btn" onClick={()=>setLiked({...liked,[it.head]:liked[it.head]==="up"?null:"up"})}><Icon name="thumbup" size={12}/></button>
                <button className="icon-btn" onClick={()=>setLiked({...liked,[it.head]:liked[it.head]==="down"?null:"down"})}><Icon name="thumbdown" size={12}/></button>
                <button className="icon-btn" onClick={()=>setRoute("mooovy")}><Icon name="chat" size={12}/> Ask Mooovy</button>
                <button className="icon-btn"><Icon name="share" size={12}/> Share</button>
                <button className="icon-btn" onClick={()=>setDismissed({...dismissed,[it.head]:true})}><Icon name="x" size={12}/></button>
                <button className="btn sm primary" style={{marginLeft:"auto"}} onClick={()=>it.cat==="Internal"?setRoute("dashboard"):null}>
                  {it.cat==="Internal"?"Open in Dashboard":"Take action"} <Icon name="arrowR" size={11}/>
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside style={{display:"flex", flexDirection:"column", gap:14, position:"sticky", top:80, alignSelf:"flex-start"}}>
          <div className="card card-pad">
            <div style={{fontFamily:"var(--font-display)", fontSize:14, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8}}>Your Watchlist</div>
            {[
              {t:"FedEx GRI", on:userCarriers.some(c=>c.includes("FedEx"))},
              {t:"Section 301 tariffs", on:true},
              {t:"Amazon FBA fees", on:userPlatforms.includes("Amazon")},
              {t:"UPS surcharges", on:userCarriers.some(c=>c.includes("UPS"))},
              {t:"Port disruptions", on:false},
            ].map(w => (
              <div key={w.t} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px dashed var(--gray-soft)"}}>
                <span style={{fontSize:13}}>{w.t}</span>
                <span style={{fontFamily:"var(--font-mono)", fontSize:10, padding:"2px 6px", borderRadius:3,
                  background:w.on?"var(--green-soft)":"var(--gray-soft)", border:"1px solid var(--ink)"}}>{w.on?"ON":"OFF"}</span>
              </div>
            ))}
            <button className="btn sm" style={{marginTop:10, width:"100%"}}><Icon name="plus" size={12}/> Add topic</button>
          </div>
          <div className="card card-pad" style={{background:"var(--yellow)"}}>
            <div style={{fontFamily:"var(--font-display)", fontSize:16, textTransform:"uppercase", letterSpacing:0.5}}>Daily digest</div>
            <div style={{fontSize:13, marginTop:6}}>Get this feed in your inbox at 6:30 AM.</div>
            <button className="btn sm dark" style={{marginTop:10}}>Turn it on</button>
          </div>
        </aside>
      </div>
    </div>
  );
};
window.InsightFeed = InsightFeed;
