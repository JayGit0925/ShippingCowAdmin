// Dashboard — fully driven by SC_STATE.processedRows

const EmptyDashboard = ({ setRoute }) => (
  <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:20, padding:40, textAlign:"center"}}>
    <PixelCow inflate={0} size={180}/>
    <div style={{fontFamily:"var(--font-display)", fontSize:28, textTransform:"uppercase", letterSpacing:0.5}}>No data yet</div>
    <div style={{fontFamily:"var(--font-mono)", fontSize:13, color:"var(--gray)", maxWidth:420, lineHeight:1.7}}>
      Upload your shipment data in the Silo and your full cost breakdown, zone analysis, and savings opportunities will appear here instantly.
    </div>
    <div style={{display:"flex", gap:10}}>
      <button className="btn primary" onClick={()=>setRoute("silo")}><Icon name="upload" size={13}/> Upload to Silo</button>
      <button className="btn" onClick={()=>setRoute("mooovy")}><Icon name="chat" size={13}/> Ask Mooovy</button>
    </div>
  </div>
);

const SkuRow = ({ sk, days }) => {
  const [hovered, setHovered] = React.useState(false);
  const savePkg = sk.yourCost - sk.scCost;
  const d = days || window.SC_AGG._dateRangeDays() || 90;
  const annualImpact = Math.round(savePkg * sk.ships * (365 / d));
  const tdBg = hovered ? "#feb81b" : "transparent";
  return (
    <tr onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{borderBottom:"1px solid rgba(255,255,255,0.1)", transition:"background 0.15s", cursor:"default"}}>
      <td style={{fontWeight:700, color:hovered?"var(--ink)":"#fff", background:tdBg, transition:"background 0.15s"}}>
        {sk.sku}<div style={{fontSize:11, color:hovered?"rgba(0,0,0,0.55)":"rgba(255,255,255,0.6)", fontWeight:400}}>{sk.name}</div>
      </td>
      <td style={{fontFamily:"var(--font-mono)", color:hovered?"var(--ink)":"rgba(255,255,255,0.85)", background:tdBg, transition:"background 0.15s"}}>{sk.ships}</td>
      <td style={{fontFamily:"var(--font-mono)", color:hovered?"var(--ink)":"rgba(255,255,255,0.85)", background:tdBg, transition:"background 0.15s"}}>${sk.yourCost.toFixed(2)}</td>
      <td style={{fontFamily:"var(--font-mono)", color:hovered?"var(--ink)":"var(--yellow)", fontWeight:700, background:tdBg, transition:"background 0.15s"}}>${sk.scCost.toFixed(2)}</td>
      <td style={{fontFamily:"var(--font-mono)", color:hovered?"var(--ink)":"var(--yellow)", fontWeight:700, background:tdBg, transition:"background 0.15s"}}>−${savePkg.toFixed(2)}</td>
      <td style={{fontFamily:"var(--font-mono)", color:hovered?"var(--ink)":"var(--yellow)", fontWeight:700, background:tdBg, transition:"background 0.15s"}}>${annualImpact.toLocaleString()}</td>
    </tr>
  );
};

const PainPointRow = ({ p, i, tier }) => {
  const [hovered, setHovered] = React.useState(false);
  const locked = tier === "calf" && i >= 3;
  const tdBg = hovered ? "#feb81b" : "transparent";
  return (
    <tr onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{borderBottom:"1px solid rgba(255,255,255,0.1)", transition:"background 0.15s", ...(locked?{opacity:0.45}:{})}}>
      <td style={{fontWeight:600, maxWidth:280, color:hovered?"var(--ink)":"#fff", background:tdBg, transition:"background 0.15s"}}>{p.p}</td>
      <td style={{fontFamily:"var(--font-mono)", fontWeight:700, color:hovered?"var(--ink)":"var(--yellow)", background:tdBg, transition:"background 0.15s"}}>{locked?<span className="lock">Cow+</span>:`$${p.impact.toLocaleString()}/yr`}</td>
      <td style={{color:hovered?"var(--ink)":"rgba(255,255,255,0.8)", background:tdBg, transition:"background 0.15s"}}>{locked?"—":p.action}</td>
      <td style={{background:tdBg, transition:"background 0.15s"}}>{p.sev==="critical"?<span className="tag red">Critical</span>:p.sev==="warning"?<span className="tag amber">Warning</span>:<span className="tag green">Opportunity</span>}</td>
      <td style={{background:tdBg, transition:"background 0.15s"}}><button className="btn sm" disabled={locked}>Fix it</button></td>
    </tr>
  );
};

const ZONE_FACTORS = [0, 0.50, 0.70, 0.85, 1.00, 1.15, 1.30, 1.50, 1.75];
const BASE_COST = 8.94;
const SC_RATE = 0.76; // avg SC rate factor

const ZoneCostChart = ({ zoneSpend, avgZone }) => {
  const scAvg = 3.89;
  const savingRate = Math.max(0, (avgZone - scAvg) / Math.max(avgZone, 1));
  const data = [1,2,3,4,5,6,7,8].map(z => ({
    z,
    userCost: zoneSpend[z] || 0,
    saving:   (zoneSpend[z] || 0) * savingRate,
  }));
  const maxCost = Math.max(...data.map(d => d.userCost), 1);
  const maxH = 150;
  return (
    <div style={{display:"flex", gap:8, alignItems:"flex-end", height:190}}>
      {data.map(({z, userCost, saving}) => (
        <div key={z} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center"}}>
          <div style={{display:"flex", gap:2, alignItems:"flex-end", width:"100%", justifyContent:"center"}}>
            <div style={{flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end", height:maxH}}>
              <div style={{height:Math.max(2, Math.round((userCost/maxCost)*maxH)), background:"var(--blue)", border:"1.5px solid var(--ink)", borderRadius:"3px 3px 0 0"}}/>
            </div>
            <div style={{flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end", height:maxH}}>
              <div style={{height:Math.max(2, Math.round((saving/maxCost)*maxH)), background:"var(--yellow)", border:"1.5px solid var(--ink)", borderRadius:"3px 3px 0 0"}}/>
            </div>
          </div>
          <div style={{fontFamily:"var(--font-mono)", fontSize:10, color:"var(--gray)", marginTop:4}}>Z{z}</div>
          {saving > 0 && <div style={{fontFamily:"var(--font-mono)", fontSize:9, color:"var(--green)"}}>${Math.round(saving)}</div>}
        </div>
      ))}
    </div>
  );
};

const Dashboard = ({ tier, setRoute, period, customRange }) => {
  const [, forceUpdate] = React.useReducer(x=>x+1, 0);
  React.useEffect(() => { window.SC_STATE.subscribe(forceUpdate); }, []);

  // ALL hooks must run on every render — declare BEFORE any early return.
  const A = window.SC_AGG;
  const hasData = window.SC_STATE.hasData;
  const rowsForOrigin = hasData ? A.filteredRows(period || "90d", customRange) : [];
  const originZipsList = hasData ? A.originZips(rowsForOrigin) : [];
  const [selOrigin, setSelOrigin] = React.useState(originZipsList[0] || "30301");

  // Keep selOrigin valid when origin list changes (e.g. after upload or period change)
  React.useEffect(() => {
    if (originZipsList.length && !originZipsList.includes(selOrigin)) {
      setSelOrigin(originZipsList[0]);
    }
  }, [originZipsList.join("|")]);

  if (!hasData) return <EmptyDashboard setRoute={setRoute}/>;

  const fmtUSD = n => "$" + Math.round(n).toLocaleString();

  // Filter rows to the selected period based on actual ship dates
  const rows = A.filteredRows(period || "90d", customRange);
  const dataRange = A.dataDateRange();
  const fmtDate = d => d ? d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "";
  const rowCount = rows.length;
  const periodLabel = rowCount + " shipments · " + (
    rowCount === A.rows.length
      ? (dataRange ? fmtDate(dataRange.min) + " – " + fmtDate(dataRange.max) : "all dates")
      : (rows.length > 0 ? (()=>{ const ds = rows.map(r=>new Date(r.date)).filter(d=>!isNaN(d)); const mn=new Date(Math.min(...ds)),mx=new Date(Math.max(...ds)); return fmtDate(mn)+" – "+fmtDate(mx); })() : "no data in range")
  );

  const totalSpend    = A.totalSpend(rows);
  const totalShips    = A.totalShipments(rows);
  const avgZone       = A.avgZone(rows);
  const dimPct        = A.dimOverchargePct(rows);
  const annualSavings = A.annualSavings(rows);
  const dimInflate    = A.dimInflatePct(rows);
  const dimTotal      = A.dimOverchargeTotal(rows);
  const zoneSpend     = A.zoneSpend(rows);
  const zoneDist      = A.zoneDist(rows);
  const pct6plus      = A.pctZone6plus(rows);
  const topSkus       = A.topSkus(5, rows);
  const painPoints    = A.painPoints(rows);
  const scAnnSavings  = Math.round(annualSavings);
  const skuAnnSavings = Math.round(topSkus.reduce((s,sk)=>{
    const days = A._dateRangeDays(rows)||90;
    return s + (sk.yourCost - sk.scCost) * sk.ships * (365/days);
  }, 0));

  const zoneScenario = { userAvg: avgZone, scAvg: 3.89, savings: scAnnSavings };

  // Origin ZIP selector — uses originZipsList computed above (filteredRows-based)
  const originZips = originZipsList;

  const zoneData = [1,2,3,4,5,6,7,8].map(z => ({
    x:"Z"+z, label: zoneDist[z] || 0, v: zoneDist[z] || 0
  }));

  return (
    <div className="page">
      {/* Period label */}
      {rows.length === 0 && period !== "all" && (
        <div style={{padding:"10px 16px", marginBottom:12, background:"#fff8e1", border:"2px solid var(--ink)", borderRadius:6, fontFamily:"var(--font-mono)", fontSize:12, color:"var(--ink)"}}>
          No shipments found in this date range. Try a wider period or adjust your custom dates.
        </div>
      )}
      {rows.length > 0 && (
        <div style={{marginBottom:12, fontFamily:"var(--font-mono)", fontSize:11, color:"var(--gray)", display:"flex", alignItems:"center", gap:6}}>
          <span style={{background:"var(--ink)", color:"#fff", padding:"2px 8px", borderRadius:3, fontSize:10, letterSpacing:1}}>{(period||"90d").toUpperCase()}</span>
          {periodLabel}
        </div>
      )}

      {/* 1. Gauges */}
      <div className="metrics">
        <div className="metric">
          <div className="lbl">Total Spend</div>
          <div className="val">{fmtUSD(totalSpend)}</div>
          <div className="delta" style={{color:"var(--gray)"}}>{totalShips} shipments</div>
        </div>
        <div className="metric">
          <div className="lbl">Shipments</div>
          <div className="val">{totalShips.toLocaleString()}</div>
          <div className="delta" style={{color:"var(--gray)"}}>from your data</div>
        </div>
        <div className="metric">
          <div className="lbl">Avg Zone</div>
          <div className="val">{avgZone.toFixed(2)}</div>
          <div className="delta" style={{color: avgZone > 4 ? "var(--red)" : "var(--green)"}}>
            {avgZone > 4 ? "▲ Above benchmark" : "✓ On target"}
          </div>
        </div>
        <div className="metric accent">
          <div className="lbl">Dim Overcharge</div>
          <div className="val">{dimPct.toFixed(1)}%</div>
          <div className="delta">{dimInflate > 0 ? `${dimInflate}% above benchmark` : "At benchmark"}</div>
        </div>
        <div className="metric" style={{background:"var(--yellow)"}}>
          <div className="lbl">Switch to SC · Save</div>
          <div className="val" style={{fontSize:"clamp(22px,2.2vw,32px)", color:"var(--ink)"}}>{fmtUSD(scAnnSavings)}<span style={{fontSize:"0.45em", fontFamily:"var(--font-mono)", fontWeight:400}}>/yr</span></div>
          <div className="delta" style={{color:"var(--ink)", opacity:0.75}}>estimated annual savings</div>
        </div>
      </div>

      {/* 2. Herd Zone vs SC */}
      <div className="section-h"><span className="num">02</span><span className="t">Your Herd Zone vs ShippingCow Herd Zone</span></div>
      <div className="card">
        <div className="card-h" style={{flexWrap:"wrap", gap:12}}>
          <div style={{flex:1, minWidth:200}}>
            <div className="t">Zone cost distribution</div>
            <div className="sub">Blue = your spend per zone · Yellow = zone saving $$ with SC 3-Node Smart Routing</div>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <div style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:1.5, textTransform:"uppercase", color:"var(--gray)"}}>Origin ZIP</div>
            <div style={{display:"flex", gap:6}}>
              {originZips.slice(0,4).map(zip => (
                <button key={zip} onClick={()=>setSelOrigin(zip)}
                  style={{padding:"4px 10px", border:"2px solid var(--ink)", borderRadius:4, fontFamily:"var(--font-mono)", fontSize:12,
                    background: selOrigin===zip ? "var(--ink)" : "var(--paper)",
                    color: selOrigin===zip ? "#fff" : "var(--ink)", cursor:"pointer", fontWeight: selOrigin===zip ? 700 : 400}}>
                  {zip}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, padding:"0 18px 16px"}}>
          <div style={{padding:"12px 14px", background:"var(--blue)", border:"2px solid var(--ink)", borderRadius:6, color:"#fff"}}>
            <div style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:1.5, opacity:0.85}}>YOUR ORIGIN</div>
            <div style={{fontFamily:"var(--font-display)", fontSize:17, marginTop:2}}>{selOrigin}</div>
            <div style={{fontFamily:"var(--font-mono)", fontSize:11, marginTop:2, opacity:0.85}}>Avg Zone <strong>{avgZone.toFixed(2)}</strong></div>
          </div>
          <div style={{padding:"12px 14px", background:"var(--yellow)", border:"2px solid var(--ink)", borderRadius:6}}>
            <div style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:1.5, fontWeight:700}}>SC 3-NODE SMART ROUTING</div>
            <div style={{fontFamily:"var(--font-display)", fontSize:17, marginTop:2}}>NJ · TX · CA</div>
            <div style={{fontFamily:"var(--font-mono)", fontSize:11, marginTop:2}}>Avg Zone <strong>3.89</strong> · saves {Math.round((avgZone - 3.89)/Math.max(avgZone,1)*100)}% on zones</div>
          </div>
          <div style={{padding:"12px 14px", background:"#f0fdf4", border:"2px solid var(--ink)", borderRadius:6}}>
            <div style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:1.5, color:"var(--gray)"}}>EST. ANNUAL SAVINGS</div>
            <div style={{fontFamily:"var(--font-display)", fontSize:28, marginTop:2, color:"var(--green)"}}>{fmtUSD(scAnnSavings)}</div>
            <div style={{fontFamily:"var(--font-mono)", fontSize:11, color:"var(--gray)"}}>from zone optimisation alone</div>
          </div>
        </div>

        <div className="card-pad" style={{paddingTop:0}}>
          <div style={{display:"flex", gap:16, marginBottom:10, alignItems:"center"}}>
            <div style={{display:"flex", alignItems:"center", gap:6, fontFamily:"var(--font-mono)", fontSize:11}}>
              <div style={{width:14,height:14,background:"var(--blue)",border:"2px solid var(--ink)",borderRadius:2}}></div>Your zone spend
            </div>
            <div style={{display:"flex", alignItems:"center", gap:6, fontFamily:"var(--font-mono)", fontSize:11}}>
              <div style={{width:14,height:14,background:"var(--yellow)",border:"2px solid var(--ink)",borderRadius:2}}></div>Zone saving $$ with SC
            </div>
          </div>
          <ZoneCostChart zoneSpend={zoneSpend} avgZone={avgZone}/>
          <div style={{marginTop:16, padding:"12px 14px", background:"var(--yellow)", border:"2px solid var(--ink)", borderRadius:6, display:"flex", justifyContent:"space-between", alignItems:"center", gap:12}}>
            <div style={{fontFamily:"var(--font-mono)", fontSize:12}}>
              <strong>SC 3-Node avg zone: 3.89</strong> vs your {avgZone.toFixed(2)} · up to {Math.round((avgZone-3.89)/Math.max(avgZone,1)*100)}% annual savings
            </div>
            <button className="btn dark" style={{whiteSpace:"nowrap"}} onClick={()=>setRoute("mooovy")}>
              Switch to SC · Save {fmtUSD(scAnnSavings)}/yr →
            </button>
          </div>
        </div>
      </div>

      {/* 3. Top Shipped SKUs */}
      <div className="section-h"><span className="num">03</span><span className="t">Top Shipped SKUs</span></div>
      <div className="grid-7-5">
        <div className="card" style={{background:"var(--blue)"}}>
          <div className="card-h" style={{borderBottom:"1.5px solid rgba(255,255,255,0.2)"}}>
            <div>
              <div className="t" style={{color:"#fff"}}>Your shipping cost vs ShippingCow rate</div>
              <div className="sub" style={{color:"rgba(255,255,255,0.7)"}}>Top SKUs by volume from your data</div>
            </div>
          </div>
          <div className="card-pad" style={{paddingTop:8}}>
            {topSkus.length === 0 ? (
              <div style={{color:"rgba(255,255,255,0.7)", fontFamily:"var(--font-mono)", fontSize:12, padding:"20px 0"}}>No SKU data found — make sure your upload includes the <strong>sku</strong> column.</div>
            ) : (
              <table className="t">
                <thead>
                  <tr>
                    <th style={{color:"rgba(255,255,255,0.7)"}}>SKU</th>
                    <th style={{color:"rgba(255,255,255,0.7)"}}>Ships</th>
                    <th style={{color:"rgba(255,255,255,0.7)"}}>Your cost</th>
                    <th style={{color:"rgba(255,255,255,0.7)"}}>SC cost</th>
                    <th style={{color:"rgba(255,255,255,0.7)"}}>Save/pkg</th>
                    <th style={{color:"rgba(255,255,255,0.7)"}}>Annual</th>
                  </tr>
                </thead>
                <tbody>{topSkus.map(sk => <SkuRow key={sk.sku} sk={sk} days={A._dateRangeDays(rows)||90}/>)}</tbody>
              </table>
            )}
            <div style={{marginTop:14, padding:"10px 12px", background:"var(--yellow)", border:"2px solid var(--ink)", borderRadius:6, display:"flex", justifyContent:"space-between", alignItems:"center", gap:10}}>
              <div style={{fontFamily:"var(--font-mono)", fontSize:12, fontWeight:600}}>
                Switch to ShippingCow · save {fmtUSD(skuAnnSavings)}/yr on your top SKUs
              </div>
              <button className="btn dark sm" onClick={()=>setRoute("mooovy")}>Get started →</button>
            </div>
          </div>
        </div>

        {/* Dim cow */}
        <div className="card" style={{padding:0}}>
          <div className="card-h">
            <div>
              <div className="t">Dim overcharge cow</div>
              <div className="sub">{dimPct.toFixed(1)}% of shipments over-billed on dim weight</div>
            </div>
          </div>
          <div className="dim-cow-wrap" style={{margin:"0 18px 18px"}}>
            <div className="corner-tag">DIM {dimPct.toFixed(0)}%</div>
            <PixelCow inflate={Math.min(dimPct/100, 0.6)} size={200}/>
            <div style={{color:"#fff", fontFamily:"var(--font-display)", fontSize:17, lineHeight:1.2, marginTop:8, textTransform:"uppercase", letterSpacing:0.5}}>
              {dimPct > 20
                ? <>You're paying <span style={{color:"var(--yellow)"}}>{dimPct.toFixed(0)}% more</span> than you should on dimensional weight.</>
                : <>Dim overcharge looks <span style={{color:"var(--yellow)"}}>under control</span>. Keep monitoring.</>}
            </div>
            <div style={{color:"rgba(255,255,255,0.85)", fontFamily:"var(--font-mono)", fontSize:11, marginTop:8, lineHeight:1.6}}>
              90-day dim overcharge total: <span style={{color:"var(--yellow)", fontWeight:700}}>{fmtUSD(dimTotal)}</span>
            </div>
            <button className="btn primary" style={{marginTop:12}} onClick={()=>setRoute("mooovy")}>Ask Mooovy why</button>
          </div>
        </div>
      </div>

      {/* 4. Pain Points */}
      <div className="section-h"><span className="num">04</span><span className="t">Pain Points &amp; Savings Summary</span></div>
      <div className="card" style={{background:"var(--blue)"}}>
        <table className="t">
          <thead>
            <tr style={{borderBottom:"2px solid rgba(255,255,255,0.25)"}}>
              <th style={{color:"rgba(255,255,255,0.7)"}}>Pain point</th>
              <th style={{color:"rgba(255,255,255,0.7)"}}>Annual impact</th>
              <th style={{color:"rgba(255,255,255,0.7)"}}>Recommended action</th>
              <th style={{color:"rgba(255,255,255,0.7)"}}>Severity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>{painPoints.map((p,i) => <PainPointRow key={i} p={p} i={i} tier={tier}/>)}</tbody>
        </table>
      </div>

    </div>
  );
};

window.Dashboard = Dashboard;
