// Zoning Map — ported from USMap.tsx (tile grid layout)

const ZONE_COLOR = { 1: '#0052C9', 2: '#3A7FDE', 3: '#B0C8F0' };
const ZONE_LABEL = { 1: '1–2 Day', 2: '2 Day', 3: '2–3 Day' };

const TILES = [
  // Row 0
  { abbr:'AK', name:'Alaska',           col:0, row:0, zone:3 },
  { abbr:'ME', name:'Maine',            col:9, row:0, zone:2 },
  // Row 1
  { abbr:'WA', name:'Washington',       col:0, row:1, zone:2 },
  { abbr:'MT', name:'Montana',          col:1, row:1, zone:3 },
  { abbr:'ND', name:'North Dakota',     col:2, row:1, zone:3 },
  { abbr:'MN', name:'Minnesota',        col:3, row:1, zone:2 },
  { abbr:'WI', name:'Wisconsin',        col:4, row:1, zone:2 },
  { abbr:'MI', name:'Michigan',         col:5, row:1, zone:2 },
  { abbr:'VT', name:'Vermont',          col:8, row:1, zone:2 },
  { abbr:'NH', name:'New Hampshire',    col:9, row:1, zone:2 },
  // Row 2
  { abbr:'OR', name:'Oregon',           col:0, row:2, zone:2 },
  { abbr:'ID', name:'Idaho',            col:1, row:2, zone:2 },
  { abbr:'WY', name:'Wyoming',          col:2, row:2, zone:3 },
  { abbr:'SD', name:'South Dakota',     col:3, row:2, zone:3 },
  { abbr:'IA', name:'Iowa',             col:4, row:2, zone:2 },
  { abbr:'IL', name:'Illinois',         col:5, row:2, zone:1 },
  { abbr:'IN', name:'Indiana',          col:6, row:2, zone:1 },
  { abbr:'OH', name:'Ohio',             col:7, row:2, zone:2 },
  { abbr:'NY', name:'New York',         col:8, row:2, zone:2 },
  { abbr:'MA', name:'Massachusetts',    col:9, row:2, zone:2 },
  // Row 3
  { abbr:'CA', name:'California',       col:0, row:3, zone:1 },
  { abbr:'NV', name:'Nevada',           col:1, row:3, zone:1 },
  { abbr:'UT', name:'Utah',             col:2, row:3, zone:2 },
  { abbr:'CO', name:'Colorado',         col:3, row:3, zone:2 },
  { abbr:'NE', name:'Nebraska',         col:4, row:3, zone:2 },
  { abbr:'MO', name:'Missouri',         col:5, row:3, zone:1 },
  { abbr:'KY', name:'Kentucky',         col:6, row:3, zone:1 },
  { abbr:'WV', name:'West Virginia',    col:7, row:3, zone:2 },
  { abbr:'PA', name:'Pennsylvania',     col:8, row:3, zone:1 },
  { abbr:'NJ', name:'New Jersey',       col:9, row:3, zone:1 },
  // Row 4
  { abbr:'AZ', name:'Arizona',          col:1, row:4, zone:1 },
  { abbr:'NM', name:'New Mexico',       col:2, row:4, zone:1 },
  { abbr:'KS', name:'Kansas',           col:3, row:4, zone:1 },
  { abbr:'OK', name:'Oklahoma',         col:4, row:4, zone:1 },
  { abbr:'AR', name:'Arkansas',         col:5, row:4, zone:1 },
  { abbr:'TN', name:'Tennessee',        col:6, row:4, zone:1 },
  { abbr:'VA', name:'Virginia',         col:7, row:4, zone:1 },
  { abbr:'MD', name:'Maryland',         col:8, row:4, zone:1 },
  { abbr:'CT', name:'Connecticut',      col:9, row:4, zone:2 },
  // Row 5
  { abbr:'TX', name:'Texas',            col:2, row:5, zone:1 },
  { abbr:'LA', name:'Louisiana',        col:3, row:5, zone:1 },
  { abbr:'MS', name:'Mississippi',      col:4, row:5, zone:1 },
  { abbr:'AL', name:'Alabama',          col:5, row:5, zone:1 },
  { abbr:'NC', name:'North Carolina',   col:7, row:5, zone:1 },
  { abbr:'SC', name:'South Carolina',   col:8, row:5, zone:1 },
  { abbr:'DE', name:'Delaware',         col:9, row:5, zone:1 },
  // Row 6
  { abbr:'GA', name:'Georgia',          col:5, row:6, zone:1 },
  { abbr:'FL', name:'Florida',          col:6, row:6, zone:1 },
  { abbr:'HI', name:'Hawaii',           col:8, row:6, zone:3 },
  { abbr:'RI', name:'Rhode Island',     col:9, row:6, zone:2 },
];

const WAREHOUSES = [
  { label:'NJ', name:'New Brunswick, NJ', col:9, row:3 },
  { label:'CA', name:'Ontario, CA',        col:0, row:3 },
  { label:'TX', name:'Missouri City, TX',  col:2, row:5 },
];

const TILE_SIZE = 52;
const GAP = 3;
const STEP = TILE_SIZE + GAP;
const COLS = 10;
const ROWS = 7;
const MAP_W = COLS * STEP - GAP;
const MAP_H = ROWS * STEP - GAP;

const TileMap = () => {
  const [tip, setTip] = React.useState(null);
  const containerRef = React.useRef(null);

  const handleEnter = (e, t) => {
    const rect = containerRef.current.getBoundingClientRect();
    setTip({ name: t.name, zone: t.zone, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const handleMove = (e, t) => {
    const rect = containerRef.current.getBoundingClientRect();
    setTip({ name: t.name, zone: t.zone, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div ref={containerRef} style={{background:'#1A202C', border:'4px solid #1A202C', padding:'1.5rem', position:'relative', borderRadius:8}}>
      {tip && (
        <div style={{
          position:'absolute', left:tip.x+12, top:tip.y+12,
          background:'#1A202C', color:'#fff',
          padding:'0.4rem 0.75rem', border:'2px solid #FEB81B',
          fontSize:'0.78rem', pointerEvents:'none', zIndex:10,
          whiteSpace:'nowrap', fontFamily:'var(--font-display)',
        }}>
          <span style={{color:'#FEB81B', display:'block', textTransform:'uppercase', letterSpacing:'0.05em'}}>{tip.name}</span>
          <span style={{color:'#B0C8F0', fontSize:'0.72rem'}}>{ZONE_LABEL[tip.zone]} Delivery</span>
        </div>
      )}

      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{width:'100%', height:'auto', display:'block'}} aria-label="US delivery coverage map">
        {TILES.map(t => {
          const x = t.col * STEP;
          const y = t.row * STEP;
          const isWH = WAREHOUSES.some(w => w.col === t.col && w.row === t.row);
          const color = isWH ? '#FEB81B' : ZONE_COLOR[t.zone];
          return (
            <g key={t.abbr} style={{cursor:'pointer'}}
              onMouseEnter={e => handleEnter(e, t)}
              onMouseMove={e => handleMove(e, t)}
              onMouseLeave={() => setTip(null)}>
              {/* Shadow */}
              <rect x={x+3} y={y+3} width={TILE_SIZE} height={TILE_SIZE} fill="rgba(0,0,0,0.4)"/>
              {/* Tile */}
              <rect x={x} y={y} width={TILE_SIZE} height={TILE_SIZE} fill={color} stroke="#1A202C" strokeWidth={1.5}/>
              {/* Warehouse star */}
              {isWH && (
                <text x={x+TILE_SIZE/2} y={y+13} textAnchor="middle" fontSize={9} fill="#1A202C" style={{userSelect:'none', pointerEvents:'none'}}>★WH</text>
              )}
              {/* Abbr */}
              <text x={x+TILE_SIZE/2} y={y+TILE_SIZE/2+5} textAnchor="middle"
                fontFamily="'Archivo Black', 'Black Han Sans', sans-serif"
                fontSize={13} fill={isWH ? '#1A202C' : '#fff'} fontWeight="bold"
                style={{userSelect:'none', pointerEvents:'none'}}>
                {t.abbr}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{display:'flex', flexWrap:'wrap', gap:'1rem', justifyContent:'center', marginTop:'1.2rem',
        fontFamily:'var(--font-display)', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.06em'}}>
        {[
          {color:'#0052C9', label:'1–2 Day Delivery'},
          {color:'#3A7FDE', label:'2 Day Delivery'},
          {color:'#B0C8F0', label:'2–3 Day Delivery'},
          {color:'#FEB81B', label:'★ Warehouse'},
        ].map(l => (
          <span key={l.label} style={{display:'inline-flex', alignItems:'center', gap:'0.4rem', color:'#fff'}}>
            <span style={{width:14, height:14, background:l.color, border:'2px solid rgba(255,255,255,0.3)', flexShrink:0, display:'inline-block'}}/>
            {l.label}
          </span>
        ))}
      </div>

      {/* Warehouse callouts */}
      <div style={{display:'flex', gap:'0.8rem', justifyContent:'center', marginTop:'1rem', flexWrap:'wrap'}}>
        {WAREHOUSES.map(w => (
          <div key={w.label} style={{
            background:'rgba(254,184,27,0.15)', border:'2px solid #FEB81B',
            padding:'0.3rem 0.8rem', fontFamily:'var(--font-display)',
            fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em', color:'#FEB81B',
          }}>
            ★ {w.label} — {w.name}
          </div>
        ))}
      </div>
    </div>
  );
};

const ZoningMap = ({ tier }) => {
  const [, forceUpdate] = React.useReducer(x=>x+1, 0);
  React.useEffect(() => { window.SC_STATE.subscribe(forceUpdate); }, []);

  const hasData = window.SC_STATE.hasData;
  const A = window.SC_AGG;
  const destMap = hasData ? A.destStateShipments() : {};
  const maxShips = Math.max(...Object.values(destMap), 1);
  const topDests = hasData ? A.topDestStates(3) : [];
  const avgZone  = hasData ? A.avgZone() : 0;
  const pct4     = hasData ? A.pctZone4plus() : 0;
  const pct6     = hasData ? A.pctZone6plus() : 0;
  const origins  = hasData ? A.originZips() : [];

  // Tile intensity: warehouse tiles always yellow, dest tiles shaded by volume
  const getTileOverride = (t) => {
    const isWH = WAREHOUSES.some(w => w.col === t.col && w.row === t.row);
    if (isWH) return null; // handled separately
    if (!hasData) return null;
    const ships = destMap[t.abbr] || 0;
    if (!ships) return null;
    const intensity = ships / maxShips;
    // Blue shade: more ships = darker
    const r = Math.round(0 + (184 - 0) * (1 - intensity));
    const g = Math.round(82 + (184 - 82) * (1 - intensity));
    const b = Math.round(201 + (255 - 201) * (1 - intensity));
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div className="page">
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12}}>
        <div>
          <div style={{fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:1.5, textTransform:'uppercase', color:'var(--gray)'}}>SC 3-Node Smart Routing · NJ · TX · CA</div>
          <div style={{fontFamily:'var(--font-display)', fontSize:24, textTransform:'uppercase', letterSpacing:0.5, marginTop:2}}>Zoning Map</div>
        </div>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          {origins.length > 0 && <div style={{fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--gray)'}}>Origin ZIPs: {origins.slice(0,3).join(', ')}</div>}
          {!hasData && <span style={{fontFamily:'var(--font-mono)', fontSize:11, background:'var(--yellow)', padding:'4px 10px', borderRadius:4, border:'1.5px solid var(--ink)'}}>Demo mode — upload data to see your zones</span>}
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 280px', gap:18}}>
        <div>
          <TileMapLive destMap={destMap} maxShips={maxShips} hasData={hasData}/>
        </div>

        <aside style={{display:'flex', flexDirection:'column', gap:14}}>
          <div className="card card-pad">
            <div style={{fontFamily:'var(--font-display)', fontSize:14, textTransform:'uppercase', letterSpacing:0.5, marginBottom:10}}>Zone analytics</div>
            {hasData ? (
              <>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                  <ZoneStat label="Weighted avg zone" value={avgZone.toFixed(2)}/>
                  <ZoneStat label="% Zone 4+" value={`${pct4.toFixed(0)}%`}/>
                  <ZoneStat label="% Zone 6+" value={`${pct6.toFixed(1)}%`} flag="amber"/>
                  <ZoneStat label="SC avg zone" value="3.89" flag="green"/>
                </div>
                <div style={{marginTop:14, fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color:'var(--gray)'}}>Top destination states</div>
                {topDests.map(s => (
                  <div key={s.state} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px dashed var(--gray-soft)'}}>
                    <span style={{fontWeight:600}}>{s.state}</span>
                    <span style={{fontFamily:'var(--font-mono)', fontSize:11}}>{s.count} ships · ${Math.round(s.cost/Math.max(s.count,1))}/avg</span>
                  </div>
                ))}
                {topDests.length === 0 && <div style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--gray)', marginTop:8}}>No destination data yet</div>}
              </>
            ) : (
              <div style={{fontFamily:'var(--font-mono)', fontSize:12, color:'var(--gray)', lineHeight:1.7}}>
                Upload shipment data to see your zone distribution, avg zone, and destination breakdown.
                <button className="btn sm primary" style={{marginTop:10, width:'100%'}} onClick={()=>window.__setRoute?.('silo')}><Icon name="upload" size={11}/> Go to Silo</button>
              </div>
            )}
          </div>

          <div className="card card-pad" style={{background:'var(--blue)', color:'#fff', borderColor:'#1A202C'}}>
            <div style={{fontFamily:'var(--font-display)', fontSize:14, textTransform:'uppercase', letterSpacing:0.5}}>SC 3-Node Savings</div>
            <div style={{fontFamily:'var(--font-mono)', fontSize:12, marginTop:8, lineHeight:1.6, opacity:0.9}}>
              Moving to SC's NJ · TX · CA network from your origin{origins.length > 1 ? 's' : ''} would reduce your avg zone by <strong style={{color:'var(--yellow)'}}>{hasData ? Math.max(0, avgZone - 3.89).toFixed(2) : '—'}</strong> and save approximately <strong style={{color:'var(--yellow)'}}>{hasData ? '$' + Math.round(A.annualSavings()).toLocaleString() : '—'}/yr</strong>.
            </div>
            {tier === 'calf' && <span className="lock" style={{marginTop:8, display:'inline-flex'}}><Icon name="lock" size={10}/> Scenario tool on Cow+</span>}
          </div>
        </aside>
      </div>
    </div>
  );
};

const ZoneStat = ({ label, value, flag }) => (
  <div style={{background:'var(--paper)', border:'1.5px solid var(--ink)', borderRadius:6, padding:'8px 10px'}}>
    <div style={{fontFamily:'var(--font-mono)', fontSize:9.5, letterSpacing:1.5, color:'var(--gray)', textTransform:'uppercase'}}>{label}</div>
    <div style={{fontFamily:'var(--font-display)', fontSize:22, marginTop:2, color: flag==='amber'?'var(--amber)':flag==='green'?'var(--green)':'var(--ink)'}}>{value}</div>
  </div>
);

const TileMapLive = ({ destMap, maxShips, hasData }) => {
  const [tip, setTip] = React.useState(null);
  const containerRef = React.useRef(null);

  const handleEnter = (e, t) => {
    const rect = containerRef.current.getBoundingClientRect();
    setTip({ name: t.name, zone: t.zone, abbr: t.abbr, ships: destMap[t.abbr] || 0, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const handleMove = (e, t) => {
    const rect = containerRef.current.getBoundingClientRect();
    setTip({ name: t.name, zone: t.zone, abbr: t.abbr, ships: destMap[t.abbr] || 0, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const getTileColor = (t) => {
    const isWH = WAREHOUSES.some(w => w.col === t.col && w.row === t.row);
    if (isWH) return '#FEB81B';
    if (!hasData) return ZONE_COLOR[t.zone];
    const ships = destMap[t.abbr] || 0;
    if (!ships) return '#2d3748'; // dark gray — no shipments
    const intensity = ships / Math.max(maxShips, 1);
    // Scale from light blue to bright blue based on volume
    const r = Math.round(176 - 176 * intensity);
    const g = Math.round(200 - 118 * intensity);
    const b = Math.round(240 - 39 * intensity);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div ref={containerRef} style={{background:'#1A202C', border:'4px solid #1A202C', padding:'1.5rem', position:'relative', borderRadius:8}}>
      {tip && (
        <div style={{position:'absolute', left:tip.x+12, top:tip.y+12, background:'#1A202C', color:'#fff',
          padding:'0.4rem 0.75rem', border:'2px solid #FEB81B', fontSize:'0.78rem',
          pointerEvents:'none', zIndex:10, whiteSpace:'nowrap', fontFamily:'var(--font-display)'}}>
          <span style={{color:'#FEB81B', display:'block', textTransform:'uppercase', letterSpacing:'0.05em'}}>{tip.name}</span>
          {hasData
            ? <span style={{color:'#B0C8F0', fontSize:'0.72rem'}}>{tip.ships > 0 ? `${tip.ships} shipments` : 'No shipments'} · {ZONE_LABEL[tip.zone]} Delivery</span>
            : <span style={{color:'#B0C8F0', fontSize:'0.72rem'}}>{ZONE_LABEL[tip.zone]} Delivery</span>}
        </div>
      )}
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{width:'100%', height:'auto', display:'block'}}>
        {TILES.map(t => {
          const x = t.col * STEP;
          const y = t.row * STEP;
          const isWH = WAREHOUSES.some(w => w.col === t.col && w.row === t.row);
          const color = getTileColor(t);
          return (
            <g key={t.abbr} style={{cursor:'pointer'}}
              onMouseEnter={e=>handleEnter(e,t)} onMouseMove={e=>handleMove(e,t)} onMouseLeave={()=>setTip(null)}>
              <rect x={x+3} y={y+3} width={TILE_SIZE} height={TILE_SIZE} fill="rgba(0,0,0,0.4)"/>
              <rect x={x} y={y} width={TILE_SIZE} height={TILE_SIZE} fill={color} stroke="#1A202C" strokeWidth={1.5}/>
              {isWH && <text x={x+TILE_SIZE/2} y={y+13} textAnchor="middle" fontSize={9} fill="#1A202C" style={{userSelect:'none', pointerEvents:'none'}}>★WH</text>}
              <text x={x+TILE_SIZE/2} y={y+TILE_SIZE/2+5} textAnchor="middle"
                fontFamily="'Archivo Black','Black Han Sans',sans-serif" fontSize={13}
                fill={isWH ? '#1A202C' : '#fff'} fontWeight="bold"
                style={{userSelect:'none', pointerEvents:'none'}}>{t.abbr}</text>
            </g>
          );
        })}
      </svg>
      <div style={{display:'flex', flexWrap:'wrap', gap:'1rem', justifyContent:'center', marginTop:'1.2rem',
        fontFamily:'var(--font-display)', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.06em'}}>
        {(hasData ? [
          {color:'#B0C8F0', label:'Low volume'},
          {color:'#3A7FDE', label:'Medium volume'},
          {color:'#0052C9', label:'High volume'},
          {color:'#2d3748', label:'No shipments'},
          {color:'#FEB81B', label:'★ SC Warehouse'},
        ] : [
          {color:'#0052C9', label:'1–2 Day Delivery'},
          {color:'#3A7FDE', label:'2 Day Delivery'},
          {color:'#B0C8F0', label:'2–3 Day Delivery'},
          {color:'#FEB81B', label:'★ Warehouse'},
        ]).map(l => (
          <span key={l.label} style={{display:'inline-flex', alignItems:'center', gap:'0.4rem', color:'#fff'}}>
            <span style={{width:14, height:14, background:l.color, border:'2px solid rgba(255,255,255,0.3)', flexShrink:0, display:'inline-block'}}/>
            {l.label}
          </span>
        ))}
      </div>
      <div style={{display:'flex', gap:'0.8rem', justifyContent:'center', marginTop:'1rem', flexWrap:'wrap'}}>
        {WAREHOUSES.map(w => (
          <div key={w.label} style={{background:'rgba(254,184,27,0.15)', border:'2px solid #FEB81B',
            padding:'0.3rem 0.8rem', fontFamily:'var(--font-display)', fontSize:'0.72rem',
            textTransform:'uppercase', letterSpacing:'0.06em', color:'#FEB81B'}}>
            ★ {w.label} — {w.name}
          </div>
        ))}
      </div>
    </div>
  );
};

window.ZoningMap = ZoningMap;
