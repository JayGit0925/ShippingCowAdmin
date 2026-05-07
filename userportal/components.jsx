// Shared components: PixelCow, Barn, Charts, etc.

const PixelCow = ({ inflate = 0, size = 220, hat = false, walking = false }) => {
  // inflate: 0..1 — body width grows
  const bodyScaleX = 1 + inflate * 0.55;
  const bodyScaleY = 1 + inflate * 0.18;
  // 16x16 pixel cow, pixel = size/16
  const px = size / 18;
  // Color palette
  const C = { ink: "#1A202C", body: "#FFFFFF", spot: "#1A202C", pink: "#F8B4D0", yel: "#FEB81B", blue: "#0052C9" };

  // Define cow as a list of {x,y,c}. Simple iconographic 16-bit cow.
  // Using a procedural rectangle approach
  return (
    <svg viewBox={`0 0 ${size + 40} ${size + 20}`} width="100%" style={{ display: "block" }} className="cow-svg pixel">
      <g transform={`translate(${20 + (1 - bodyScaleX) * (size/2)} ${10 + (1 - bodyScaleY) * (size/2)}) scale(${bodyScaleX} ${bodyScaleY})`} style={{ transition: "transform 0.7s cubic-bezier(.34,1.56,.64,1)" }}>
        {/* Body */}
        <rect x={px*3} y={px*7}  width={px*11} height={px*5} fill={C.body} stroke={C.ink} strokeWidth={px*0.5}/>
        {/* Spots */}
        <rect x={px*5}  y={px*8}  width={px*2} height={px*2} fill={C.spot}/>
        <rect x={px*9}  y={px*9}  width={px*3} height={px*2} fill={C.spot}/>
        <rect x={px*4}  y={px*10} width={px*1} height={px*1} fill={C.spot}/>
        {/* Legs */}
        <rect x={px*4}  y={px*12} width={px*2} height={px*3} fill={C.body} stroke={C.ink} strokeWidth={px*0.5}/>
        <rect x={px*7}  y={px*12} width={px*2} height={px*3} fill={C.body} stroke={C.ink} strokeWidth={px*0.5}/>
        <rect x={px*10} y={px*12} width={px*2} height={px*3} fill={C.body} stroke={C.ink} strokeWidth={px*0.5}/>
        <rect x={px*13} y={px*12} width={px*1.6} height={px*3} fill={C.body} stroke={C.ink} strokeWidth={px*0.5}/>
        {/* Hooves */}
        <rect x={px*4}  y={px*14.5} width={px*2} height={px*0.6} fill={C.ink}/>
        <rect x={px*7}  y={px*14.5} width={px*2} height={px*0.6} fill={C.ink}/>
        <rect x={px*10} y={px*14.5} width={px*2} height={px*0.6} fill={C.ink}/>
        <rect x={px*13} y={px*14.5} width={px*1.6} height={px*0.6} fill={C.ink}/>
        {/* Tail */}
        <rect x={px*14.5} y={px*7} width={px*0.6} height={px*4} fill={C.ink}/>
        <rect x={px*14.5} y={px*6.4} width={px*1.4} height={px*0.6} fill={C.ink}/>
      </g>
      {/* Head — keeps fixed scale */}
      <g transform={`translate(${20} ${10})`}>
        <rect x={-px*1.5} y={px*4}    width={px*5}   height={px*5}  fill={C.body} stroke={C.ink} strokeWidth={px*0.5}/>
        {/* Ears */}
        <rect x={-px*1.5} y={px*3.4}  width={px*1.6} height={px*1.4} fill={C.body} stroke={C.ink} strokeWidth={px*0.5}/>
        <rect x={px*1.9}  y={px*3.4}  width={px*1.6} height={px*1.4} fill={C.body} stroke={C.ink} strokeWidth={px*0.5}/>
        {/* Horns */}
        <rect x={-px*0.6} y={px*2.6}  width={px*0.8} height={px*1}  fill={C.yel} stroke={C.ink} strokeWidth={px*0.5}/>
        <rect x={px*2.6}  y={px*2.6}  width={px*0.8} height={px*1}  fill={C.yel} stroke={C.ink} strokeWidth={px*0.5}/>
        {/* Spot on head */}
        <rect x={px*1.2}  y={px*4.4}  width={px*1.5} height={px*1.2} fill={C.spot}/>
        {/* Eyes */}
        <rect x={-px*0.6} y={px*5.6}  width={px*0.7} height={px*0.7} fill={C.ink}/>
        <rect x={px*2.4}  y={px*5.6}  width={px*0.7} height={px*0.7} fill={C.ink}/>
        {/* Snout */}
        <rect x={-px*0.4} y={px*7}    width={px*3.4} height={px*1.4} fill={C.pink} stroke={C.ink} strokeWidth={px*0.5}/>
        <rect x={px*0.4}  y={px*7.5}  width={px*0.5} height={px*0.5} fill={C.ink}/>
        <rect x={px*2}    y={px*7.5}  width={px*0.5} height={px*0.5} fill={C.ink}/>
        {hat && (
          <g>
            <rect x={px*0} y={px*1.3} width={px*3} height={px*1.4} fill={C.yel} stroke={C.ink} strokeWidth={px*0.5}/>
            <rect x={-px*0.6} y={px*2.6} width={px*4.2} height={px*0.5} fill={C.yel} stroke={C.ink} strokeWidth={px*0.5}/>
          </g>
        )}
      </g>
      {walking && <style>{`@keyframes cow-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }`}</style>}
    </svg>
  );
};

const Barn = ({ size = 56, withCow = false }) => {
  const px = size / 14;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pixel">
      {/* Roof */}
      <polygon points={`${size/2},${px*1} ${size-px*1},${px*5} ${px*1},${px*5}`} fill="#FEB81B" stroke="#1A202C" strokeWidth={px*0.5}/>
      {/* Body */}
      <rect x={px*1.5} y={px*5} width={size - px*3} height={px*7} fill="#C53030" stroke="#1A202C" strokeWidth={px*0.5}/>
      {/* White cross */}
      <rect x={size/2 - px*0.4} y={px*5.6} width={px*0.8} height={px*5.5} fill="#FFFFFF"/>
      <rect x={px*2.5} y={px*7.8} width={size - px*5} height={px*0.8} fill="#FFFFFF"/>
      {/* Door */}
      <rect x={size/2 - px*1.2} y={px*9} width={px*2.4} height={px*3} fill="#1A202C"/>
    </svg>
  );
};

// Bar chart helper (horizontal)
const HBar = ({ label, value, max, fill = "var(--blue)", suffix = "", lock = false }) => (
  <div className="bar-row">
    <div className="lbl-b">{label}</div>
    <div className="track"><div className="fill" style={{ width: `${Math.min(100, (value/max)*100)}%`, background: fill }}/></div>
    <div className="v">{lock ? <span className="lock">Locked</span> : `${value.toLocaleString()}${suffix}`}</div>
  </div>
);

// Vertical bar chart (recharts-free)
const VBars = ({ data, height = 160, color = "var(--blue)", showZone = false }) => {
  const max = Math.max(...data.map(d => d.v));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, padding: "8px 4px 0", borderBottom: "2px solid var(--ink)", marginBottom: 4 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
          <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
            <div style={{ width: "100%", height: `${(d.v/max)*100}%`, background: color, border: "1.5px solid var(--ink)", borderRadius: "3px 3px 0 0", position: "relative" }}>
              <div style={{ position: "absolute", top: -16, left: 0, right: 0, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--ink)", fontWeight: 600 }}>{d.label}</div>
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gray)" }}>{d.x}</div>
        </div>
      ))}
    </div>
  );
};

// Stacked bar series
const StackedBars = ({ series, keys, colors, height = 200 }) => {
  const max = Math.max(...series.map(row => keys.reduce((s,k)=>s+row[k],0)));
  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height, padding: "8px 4px 0", borderBottom: "2px solid var(--ink)" }}>
        {series.map((row, i) => {
          const total = keys.reduce((s,k)=>s+row[k],0);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
              <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                <div style={{ width: "100%", height: `${(total/max)*100}%`, border: "1.5px solid var(--ink)", borderRadius: "3px 3px 0 0", display: "flex", flexDirection: "column-reverse", overflow: "hidden" }}>
                  {keys.map((k, ki) => (
                    <div key={k} style={{ flex: row[k], background: colors[ki] }}/>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", marginTop: 4 }}>
        {series.map((row, i) => <div key={i} style={{ flex: 1, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gray)" }}>{row.month}</div>)}
      </div>
    </div>
  );
};

// Donut score ring
const ScoreRing = ({ score, size = 120 }) => {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score >= 80 ? "#2F855A" : score >= 60 ? "#D97706" : score >= 40 ? "#C53030" : "#7B1818";
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
              strokeDasharray={`${C*pct} ${C}`} strokeDashoffset={C*0.25} transform={`rotate(-90 ${size/2} ${size/2})`} strokeLinecap="round"/>
      <text x={size/2} y={size/2 - 2} textAnchor="middle" style={{ fontFamily: "var(--font-display)", fontSize: 30, fill: "#1A202C" }}>{score}</text>
      <text x={size/2} y={size/2 + 16} textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: 9, fill: "#4A5568", letterSpacing: 1.5 }}>HEALTH</text>
    </svg>
  );
};

Object.assign(window, { PixelCow, Barn, HBar, VBars, StackedBars, ScoreRing });
