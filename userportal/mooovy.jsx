// Mooovy chat — queries SC_STATE.processedRows

function generateReply(text, rows) {
  const t = text.toLowerCase();
  const A = window.SC_AGG;
  const fmtUSD = n => "$" + Math.round(n).toLocaleString();
  const hasData = rows.length > 0;

  if (!hasData) {
    return <>I don't see any shipment data yet. Upload your file in the Silo and I'll be able to answer questions about your actual costs, zones, and dim overcharges. <button className="btn sm primary" style={{marginTop:8}} onClick={()=>window.__setRoute?.("silo")}>Go to Silo →</button></>;
  }

  if (t.includes("dim") || t.includes("overcharge")) {
    const topSkus = A.topSkus(4);
    const dimTotal = A.dimOverchargeTotal();
    const dimPct   = A.dimOverchargePct();
    return (
      <>
        Pulling from your {rows.length} shipment rows. <strong>{dimPct.toFixed(1)}%</strong> of your shipments are billed on dim weight, with a total overcharge of <strong>{fmtUSD(dimTotal)}</strong> this period.
        {topSkus.length > 0 && (
          <div className="mini-table" style={{marginTop:8}}>
            <div className="row head"><div>SKU</div><div>Ships</div><div>Your cost</div></div>
            {topSkus.map(sk => (
              <div key={sk.sku} className="row"><div>{sk.sku}</div><div>{sk.ships}</div><div>${sk.yourCost.toFixed(2)}</div></div>
            ))}
          </div>
        )}
        <div style={{marginTop:8, fontSize:12.5}}>Switching to right-sized boxes on your top offenders could save approximately <strong>{fmtUSD(dimTotal * 0.7 * (365 / (A._dateRangeDays()||90)))}/yr</strong>.</div>
      </>
    );
  }

  if (t.includes("zone") || t.includes("zone 6") || t.includes("zoning")) {
    const avgZone  = A.avgZone();
    const pct6plus = A.pctZone6plus();
    const pct4plus = A.pctZone4plus();
    return (
      <>
        Your weighted average zone is <strong>{avgZone.toFixed(2)}</strong>. <strong>{pct6plus.toFixed(1)}%</strong> of shipments are in Zone 6+ and <strong>{pct4plus.toFixed(0)}%</strong> in Zone 4+.
        <div style={{marginTop:8}}>SC's 3-node network (NJ · TX · CA) would bring your avg zone to <strong>3.89</strong> — saving approximately <strong>{fmtUSD(A.annualSavings())}/yr</strong> on last-mile alone.</div>
      </>
    );
  }

  if (t.includes("cost") || t.includes("spend") || t.includes("expensive")) {
    const total    = A.totalSpend();
    const perShip  = total / Math.max(A.totalShipments(), 1);
    const carriers = A.carriers();
    return (
      <>
        Your total spend across <strong>{rows.length} rows</strong> is <strong>{fmtUSD(total)}</strong> — averaging <strong>${perShip.toFixed(2)}/shipment</strong>.
        <div style={{marginTop:8}}>Carriers in your data: <strong>{carriers.join(", ") || "none detected"}</strong>. SC's negotiated rates would reduce your per-shipment cost by approximately <strong>{(25).toFixed(0)}%</strong>.</div>
      </>
    );
  }

  if (t.includes("sku") || t.includes("top") || t.includes("product")) {
    const topSkus = A.topSkus(5);
    if (topSkus.length === 0) return <>I don't see any SKU data in your upload. Make sure your spreadsheet has a <code>sku</code> column.</>;
    const days = A._dateRangeDays() || 90;
    return (
      <>
        Your top {topSkus.length} SKUs by shipment volume:
        <div className="mini-table" style={{marginTop:8}}>
          <div className="row head"><div>SKU</div><div>Ships</div><div>Avg cost</div></div>
          {topSkus.map(sk => (
            <div key={sk.sku} className="row"><div>{sk.sku}</div><div>{sk.ships}</div><div>${sk.yourCost.toFixed(2)}</div></div>
          ))}
        </div>
        <div style={{marginTop:8}}>Switching these to SC rates saves approximately <strong>{fmtUSD(topSkus.reduce((s,sk)=>(s+(sk.yourCost-sk.scCost)*sk.ships),0)*(365/days))}/yr</strong>.</div>
      </>
    );
  }

  if (t.includes("carrier")) {
    const carriers  = A.carriers();
    const platforms = A.platforms();
    return <>Your data includes <strong>{carriers.join(", ") || "no carriers detected"}</strong> across <strong>{platforms.join(", ") || "no platforms detected"}</strong>. SC has negotiated rates with FedEx, UPS, and USPS — want me to show the rate comparison?</>;
  }

  if (t.includes("save") || t.includes("saving") || t.includes("switch")) {
    const ann = A.annualSavings();
    return <>Based on your {rows.length} rows, switching to ShippingCow would save approximately <strong>{fmtUSD(ann)}/yr</strong> — from carrier rate negotiation, zone optimization via our NJ · TX · CA network, and dim overcharge reduction. Want to break that down by category?</>;
  }

  if (t.includes("report") || t.includes("generate") || t.includes("export")) {
    return <>I can generate a full cost analysis report from your data. It'll include: carrier performance, zone distribution, top SKU breakdown, dim overcharge analysis, and estimated savings. <button className="btn sm primary" style={{marginTop:8}}>Generate report (XLSX)</button></>;
  }

  return <>I can pull that from your {rows.length} shipment rows. Could you be more specific — are you asking about a carrier, SKU, time range, or cost category? I'll give you the exact number.</>;
}

const Mooovy = ({ tier, setRoute }) => {
  const [msgs, setMsgs] = React.useState([
    { role:"moo", html: (
      <span>Howdy. I'm <strong>Mooovy</strong>. I'm connected to your shipment data — {window.SC_STATE.hasData ? `I can see ${window.SC_STATE.processedRows.length} rows` : "no data uploaded yet"}. {window.SC_STATE.hasData ? "Ask me anything about your costs, zones, carriers, or SKUs." : <span>Upload your data in the <button className="btn sm" style={{display:"inline"}} onClick={()=>setRoute?.("silo")}>Silo →</button> and I'll analyze it for you.</span>}</span>
    )}
  ]);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const [showReview, setShowReview] = React.useState(false);
  const streamRef = React.useRef(null);
  const [, forceUpdate] = React.useReducer(x=>x+1, 0);

  React.useEffect(() => {
    window.__setRoute = setRoute;
    window.SC_STATE.subscribe(forceUpdate);
  }, []);

  React.useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [msgs, thinking]);

  const send = (text) => {
    if (!text.trim()) return;
    setMsgs(prev => [...prev, { role:"user", html: text }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const reply = generateReply(text, window.SC_STATE.processedRows);
      setThinking(false);
      setMsgs(prev => [...prev, { role:"moo", html: reply }]);
    }, 800);
  };

  const onUpload = () => {
    setMsgs(prev => [...prev, { role:"user", html: <span><Icon name="paperclip" size={12}/> april_fedex_invoice.pdf</span> }]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMsgs(prev => [...prev, { role:"moo", html: <>I see <code>april_fedex_invoice.pdf</code>. Looks like a FedEx invoice — parsing it now…</> }]);
      setTimeout(() => {
        setMsgs(prev => [...prev, { role:"moo", html: <>Done. I parsed <strong>342 shipments</strong>. 12 had unclear destination ZIPs — want to review and confirm before saving to Silo?<br/><br/><button className="btn primary sm" onClick={()=>setShowReview(true)}>Open side-by-side review</button></> }]);
      }, 1000);
    }, 900);
  };

  const rows = window.SC_STATE.processedRows;
  const hasData = window.SC_STATE.hasData;

  const suggested = hasData ? [
    "What's my biggest dim-overcharge SKU?",
    "What's my average zone?",
    "Show me my top shipped SKUs",
    "How much would I save switching to SC?",
    "Which carrier am I using the most?",
  ] : [
    "What data do I need to upload?",
    "How does zone calculation work?",
    "What are current FedEx GRI rates?",
    "How do I calculate dim weight?",
  ];

  return (
    <div className="page" style={{padding:0, height:"calc(100vh - 60px)", display:"grid", gridTemplateRows:"auto 1fr"}}>
      <div style={{padding:"14px 24px", borderBottom:"2px solid var(--ink)", background:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div style={{display:"flex", alignItems:"center", gap:12}}>
          <div style={{width:36, height:36, background:"var(--blue)", border:"2px solid var(--ink)", borderRadius:8, display:"grid", placeItems:"center"}}>
            <PixelCow size={26} inflate={0}/>
          </div>
          <div>
            <div style={{fontFamily:"var(--font-display)", fontSize:18, textTransform:"uppercase", letterSpacing:0.5}}>Mooovy</div>
            <div style={{fontFamily:"var(--font-mono)", fontSize:10.5, color:"var(--gray)"}}>
              {hasData ? `● connected · ${rows.length} rows in scope` : "○ no data · upload to Silo first"}
            </div>
          </div>
        </div>
        <div style={{display:"flex", gap:8}}>
          {!hasData && <button className="btn sm primary" onClick={()=>setRoute("silo")}><Icon name="upload" size={11}/> Upload data</button>}
          <button className="btn sm" onClick={()=>setMsgs([{ role:"moo", html:"New conversation started. What would you like to know?" }])}>New chat</button>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateRows:"1fr auto auto", minHeight:0}}>
        <div className="chat-stream" ref={streamRef}>
          {msgs.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>{m.html}</div>
          ))}
          {thinking && (
            <div className="bubble moo" style={{maxWidth:100}}>
              <span style={{display:"inline-flex", gap:5}}>
                <span className="dot"/><span className="dot"/><span className="dot"/>
              </span>
            </div>
          )}
        </div>
        <div className="suggested">
          {suggested.map(q => <button key={q} onClick={()=>send(q)}>{q}</button>)}
        </div>
        <div className="composer">
          <button className="btn sm" onClick={onUpload}><Icon name="paperclip" size={12}/> Attach</button>
          <textarea placeholder={hasData ? "Ask Mooovy about your data…" : "Ask Mooovy about logistics, tariffs, carriers…"}
            value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input);}}}/>
          <button className="btn primary" onClick={()=>send(input)}><Icon name="send" size={14}/></button>
        </div>
      </div>

      <style>{`.dot{width:6px;height:6px;border-radius:50%;background:var(--ink);animation:bounce 1.2s infinite}.dot:nth-child(2){animation-delay:0.15s}.dot:nth-child(3){animation-delay:0.3s}@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:0.4}40%{transform:translateY(-4px);opacity:1}}`}</style>
      {showReview && (
        <div className="modal-back" onClick={()=>setShowReview(false)}>
          <div className="modal" style={{maxWidth:700}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"space-between"}}>
              <h3>Side-by-side review</h3>
              <button className="btn sm ghost" onClick={()=>setShowReview(false)}><Icon name="x" size={12}/></button>
            </div>
            <p style={{color:"var(--gray)", fontSize:13, marginTop:4}}>342 parsed · 12 need review. Edit dest ZIPs, then confirm.</p>
            <div style={{marginTop:14, display:"flex", gap:8, justifyContent:"flex-end"}}>
              <button className="btn" onClick={()=>setShowReview(false)}>Cancel</button>
              <button className="btn primary" onClick={()=>setShowReview(false)}><Icon name="check" size={12}/> Confirm &amp; save to Silo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

window.Mooovy = Mooovy;
