// Silo — upload entry point, template download, column mapper, ingest pipeline

const CANONICAL_FIELDS = [
  { id:"date",             label:"date",             desc:"Ship date (YYYY-MM-DD)",          required:true  },
  { id:"sku",              label:"sku",              desc:"Product identifier",               required:true  },
  { id:"category",         label:"category",         desc:"Product category",                 required:false },
  { id:"cost_per_package", label:"cost_per_package", desc:"Shipping cost in USD",             required:true  },
  { id:"packages_shipped", label:"packages_shipped", desc:"Qty shipped in this row",          required:true  },
  { id:"length_in",        label:"length_in",        desc:"Package length (inches)",          required:true  },
  { id:"width_in",         label:"width_in",         desc:"Package width (inches)",           required:true  },
  { id:"height_in",        label:"height_in",        desc:"Package height (inches)",          required:true  },
  { id:"origin_zip",       label:"origin_zip",       desc:"5-digit sender ZIP",               required:true  },
  { id:"destination_zip",  label:"destination_zip",  desc:"5-digit recipient ZIP",            required:true  },
  { id:"actual_weight_lb", label:"actual_weight_lb", desc:"Physical weight (lbs)",            required:true  },
  { id:"billable_weight_lb",label:"billable_weight_lb",desc:"Carrier-billed weight (lbs)",   required:true  },
  { id:"carrier",          label:"carrier",          desc:"FedEx Ground, UPS Ground, etc.",   required:true  },
  { id:"selling_platform", label:"selling_platform", desc:"Amazon, Shopify, Walmart, etc.",   required:false },
];

const EXAMPLE_ROWS = [
  { date:"2026-04-01", sku:"ESP-4421", category:"Appliances",   cost_per_package:18.40, packages_shipped:3, length_in:14, width_in:12, height_in:10, origin_zip:"30301", destination_zip:"33101", actual_weight_lb:4.2, billable_weight_lb:6.8, carrier:"FedEx Ground",    selling_platform:"Amazon"  },
  { date:"2026-04-02", sku:"BLD-2201", category:"Appliances",   cost_per_package:15.20, packages_shipped:2, length_in:16, width_in:10, height_in:8,  origin_zip:"30301", destination_zip:"10001", actual_weight_lb:3.1, billable_weight_lb:3.5, carrier:"UPS Ground",      selling_platform:"Shopify" },
  { date:"2026-04-02", sku:"VAC-0881", category:"Home",         cost_per_package:22.10, packages_shipped:1, length_in:24, width_in:14, height_in:12, origin_zip:"30301", destination_zip:"90210", actual_weight_lb:6.0, billable_weight_lb:9.8, carrier:"FedEx Ground",    selling_platform:"Amazon"  },
  { date:"2026-04-03", sku:"FAN-1102", category:"Home",         cost_per_package:12.60, packages_shipped:4, length_in:36, width_in:10, height_in:10, origin_zip:"30301", destination_zip:"60601", actual_weight_lb:5.2, billable_weight_lb:9.1, carrier:"FedEx Home Delivery", selling_platform:"Amazon"  },
  { date:"2026-04-04", sku:"COF-3310", category:"Appliances",   cost_per_package:9.80,  packages_shipped:5, length_in:8,  width_in:8,  height_in:6,  origin_zip:"30301", destination_zip:"78701", actual_weight_lb:1.8, billable_weight_lb:2.0, carrier:"USPS Priority Mail", selling_platform:"Shopify" },
];

// ── Template download (pure JS, no SheetJS needed) ────────────────────────────
function downloadTemplate() {
  const headers = CANONICAL_FIELDS.map(f => f.label);
  const instructionRow = CANONICAL_FIELDS.map(f => f.desc + (f.required ? " [REQUIRED]" : " [optional]"));
  const exampleRows = EXAMPLE_ROWS.map(r => CANONICAL_FIELDS.map(f => r[f.id] ?? ""));

  const rows = [headers, instructionRow, ...exampleRows];
  const csv = rows.map(function(r){ return r.map(function(v){ return '"' + String(v).split('"').join('""') + '"'; }).join(","); }).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "shippingcow_template.csv";
  a.click(); URL.revokeObjectURL(url);
}

// ── File parser — CSV or XLSX via SheetJS ─────────────────────────────────────
function parseFile(file, callback) {
  const reader = new FileReader();
  const isXLSX = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

  if (isXLSX) {
    reader.onload = e => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (json.length === 0) { callback({ error: "No data found in spreadsheet" }); return; }
        const headers = Object.keys(json[0]);
        callback({ headers, rows: json });
      } catch(err) {
        callback({ error: "Could not read XLSX: " + err.message });
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    reader.onload = e => {
      try {
        const result = parseCSV(e.target.result);
        callback(result);
      } catch(err) {
        callback({ error: "Could not read CSV: " + err.message });
      }
    };
    reader.readAsText(file);
  }
}

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map(line => {
    const vals = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; continue; }
      if (c === "," && !inQ) { vals.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    vals.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  }).filter(r => Object.values(r).some(v => v !== ""));
  return { headers, rows };
}

// ── Auto-map headers to canonical fields ──────────────────────────────────────
function autoMap(headers) {
  const mapping = {};
  const aliases = {
    date:              ["date","ship date","shipdate","ship_date","order date","shipped date","ship on"],
    sku:               ["sku","item sku","product sku","item_sku","product id","item id","asin","product code","item number"],
    category:          ["category","product category","product_category","type","item type","dept","department"],
    cost_per_package:  ["cost per package","cost_per_package","shipping cost","cost","rate","charge","freight cost","ship cost","rate usd","shipping charge","amount"],
    packages_shipped:  ["packages shipped","packages_shipped","units","qty","quantity","count","pieces","units shipped","pcs","num packages"],
    length_in:         ["length in","length_in","pkg length","length","l (in)","l","length (in)","length (inches)","pkg l"],
    width_in:          ["width in","width_in","pkg width","width","w (in)","w","width (in)","width (inches)","pkg w"],
    height_in:         ["height in","height_in","pkg height","height","h (in)","h","height (in)","height (inches)","pkg h"],
    origin_zip:        ["origin zip","origin_zip","from zip","from_zip","sender zip","ship from","origin","from","source zip","warehouse zip","shipper zip"],
    destination_zip:   ["destination zip","destination_zip","to zip","to_zip","dest zip","ship to","destination","to","recipient zip","consignee zip","delivery zip"],
    actual_weight_lb:  ["actual weight","actual_weight_lb","weight actual","weight (actual)","act weight","actual lb","actual weight (lb)","weight lb","net weight","physical weight"],
    billable_weight_lb:["billable weight","billable_weight_lb","billed weight","weight (billed)","bil weight","billable lb","charged weight","rated weight","billed lb"],
    carrier:           ["carrier","carrier name","shipping carrier","ship carrier","courier","shipper","service carrier"],
    selling_platform:  ["selling platform","selling_platform","channel","platform","marketplace","sales channel","store","source","sales platform"],
  };
  // Normalize: lowercase + trim + collapse spaces
  const norm = s => s.toLowerCase().trim().replace(/\s+/g,' ');
  headers.forEach(h => {
    const hn = norm(h);
    CANONICAL_FIELDS.forEach(f => {
      if (mapping[f.id]) return; // already mapped
      const alts = aliases[f.id] || [];
      if (alts.includes(hn)) mapping[f.id] = h;
    });
  });
  return mapping;
}


// ── Pre-processing: detect + skip garbage rows ────────────────────────────────
const GARBAGE_PATTERNS = [
  /^SYSTEM_LOG/i, /^ERROR_d+/i, /^WAREHOUSE_EVENT/i, /^REBOOT/i,
  /^--$/, /^NULL$/i, /^CORRUPT/i, /^FILE_NOT_FOUND/i, /^\.\.\./, /^STATION_/i,
];
function isGarbageValue(v) { return GARBAGE_PATTERNS.some(p => p.test(String(v).trim())); }
function isGarbageRow(row) {
  const vals = Array.isArray(row) ? row : Object.values(row);
  const nonEmpty = vals.filter(v => v !== "" && v !== null && v !== undefined);
  if (nonEmpty.length === 0) return true;
  // If first 3 meaningful vals all match garbage patterns → skip
  const garbageCount = nonEmpty.slice(0, 4).filter(v => isGarbageValue(v)).length;
  if (garbageCount >= 2) return true;
  // All-zero numeric row (cost=0, weight=0, zip=0)
  const nums = nonEmpty.filter(v => typeof v === 'number');
  if (nums.length >= 3 && nums.every(n => n === 0)) return true;
  return false;
}

// ── Normalize individual values ────────────────────────────────────────────────
function normalizeDate(v) {
  if (!v || v === 0 || v === '0000-00-00') return '';
  // Excel serial number (e.g. 46082)
  if (typeof v === 'number' && v > 40000 && v < 60000) {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    return d.toISOString().slice(0, 10);
  }
  // Already a string date
  const s = String(v).trim();
  // MM/DD/YYYY
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return m1[3] + "-" + m1[1].padStart(2,"0") + "-" + m1[2].padStart(2,"0");
  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Try JS Date parse
  const parsed = new Date(s);
  if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10);
  return s;
}

function normalizeZip(v) {
  if (!v && v !== 0) return '';
  const s = String(v).trim().replace(/[^0-9]/g, '');
  if (s.length === 0) return '';
  return s.padStart(5, '0').slice(0, 5);
}

function normalizeCarrier(v) {
  if (!v) return '';
  const s = String(v).trim().toLowerCase();
  if (s.includes('fedex freight') || s.includes('fedex ltl')) return 'FedEx Freight';
  if (s.includes('fedex home'))    return 'FedEx Home Delivery';
  if (s.includes('fedex'))         return 'FedEx Ground';
  if (s.includes('ups ground'))    return 'UPS Ground';
  if (s.includes('ups 2') || s.includes('ups second')) return 'UPS 2nd Day Air';
  if (s.includes('ups'))           return 'UPS Ground';
  if (s.includes('usps priority')) return 'USPS Priority Mail';
  if (s.includes('usps first'))    return 'USPS First Class';
  if (s.includes('usps'))          return 'USPS Priority Mail';
  if (s.includes('dhl'))           return 'DHL Express';
  if (s.includes('ontrac'))        return 'OnTrac';
  return v; // keep original if unknown
}

function normalizeNumber(v) {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[$,\s]/g, '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? '' : n;
}

function parseDimensions(v) {
  // handles "84x36x32", "84 x 36 x 32", "84X36X32", "84*36*32"
  if (!v) return { l:'', w:'', h:'' };
  const s = String(v).replace(/\s/g,'');
  const m = s.match(/([\d.]+)[x*×X]([\d.]+)[x*×X]([\d.]+)/i);
  if (m) return { l: parseFloat(m[1]), w: parseFloat(m[2]), h: parseFloat(m[3]) };
  return { l:'', w:'', h:'' };
}

// ── Apply mapping + normalize all rows client-side ────────────────────────────
function applyMappingAndNormalize(rows, colMap, headers) {
  // colMap: { canonical_field: source_col_name }
  // Find dimension column
  const dimCol = colMap._dim_col || headers.find(h => /size|dim|lwh|lxw/i.test(h));

  return rows
    .filter(row => !isGarbageRow(row))
    .map(row => {
      const g = (field) => {
        const src = colMap[field];
        return src ? (row[src] ?? '') : '';
      };

      // Handle packed dimensions
      let length_in = normalizeNumber(g('length_in'));
      let width_in  = normalizeNumber(g('width_in'));
      let height_in = normalizeNumber(g('height_in'));
      if ((!length_in || !width_in || !height_in) && dimCol) {
        const dims = parseDimensions(row[dimCol]);
        if (dims.l) { length_in = dims.l; width_in = dims.w; height_in = dims.h; }
      }

      const actual   = normalizeNumber(g('actual_weight_lb'));
      const billable = normalizeNumber(g('billable_weight_lb')) || actual;
      const cost     = normalizeNumber(g('cost_per_package'));

      return {
        date:              normalizeDate(g('date')),
        sku:               String(g('sku')).trim(),
        category:          String(g('category')).trim(),
        cost_per_package:  cost,
        packages_shipped:  parseInt(g('packages_shipped')) || 1,
        length_in,
        width_in,
        height_in,
        origin_zip:        normalizeZip(g('origin_zip')),
        destination_zip:   normalizeZip(g('destination_zip')),
        actual_weight_lb:  actual,
        billable_weight_lb: billable,
        carrier:           normalizeCarrier(g('carrier')),
        selling_platform:  String(g('selling_platform')).trim(),
      };
    })
    .filter(r => r.sku && r.origin_zip && r.destination_zip && r.cost_per_package > 0);
}

// ── AI-powered file categorization + normalization ────────────────────────────
async function aiParseFile(parsedFile) {
  const { headers, rows } = parsedFile;

  // Pre-filter garbage rows client-side first
  const cleanRows = rows.filter(row => !isGarbageRow(row));
  const sampleRows = cleanRows.slice(0, 6);

  // Ask AI ONLY for column mapping (small, reliable output)
  const prompt = [
    "You are a logistics data expert for ShippingCow.",
    "",
    "A user uploaded a spreadsheet. Map each source column to our canonical schema fields.",
    "",
    "FILE: " + parsedFile.name,
    "HEADERS: " + JSON.stringify(headers),
    "SAMPLE ROWS (first 6, garbage pre-filtered):",
    JSON.stringify(sampleRows, null, 2),
    "",
    "CANONICAL FIELDS TO MAP:",
    "- date (ship date, watch for Excel serial numbers like 46082 = 2026-03-01)",
    "- sku (product identifier)",
    "- category (product type/category)",
    "- cost_per_package (shipping cost in USD)",
    "- packages_shipped (quantity, default 1 if absent)",
    "- length_in, width_in, height_in (may be packed as one string like 84x36x32)",
    "- origin_zip (sender ZIP code)",
    "- destination_zip (recipient ZIP code)",
    "- actual_weight_lb (physical weight)",
    "- billable_weight_lb (carrier-billed weight)",
    "- carrier (ship method)",
    "- selling_platform (channel/marketplace)",
    "",
    "COLUMN NAME HINTS: Ship_Method=carrier, Size_LxWxH=packed dimensions, Shipping_Fee=cost, Source_ZIP=origin_zip, Dest_ZIP=destination_zip, Weight_Actual=actual_weight_lb, Weight_Billable=billable_weight_lb, Channel=selling_platform, Item_Group=category.",
    "",
    "If dimensions are in ONE packed column (e.g. 84x36x32), set _dim_col to that column name, leave length_in/width_in/height_in null.",
    "",
    "Respond with ONLY valid JSON, no markdown:",
    JSON.stringify({
      file_type: "brief description",
      confidence: "0.0-1.0",
      column_mapping: {
        date: "source_col_name or null",
        sku: "source_col_name or null",
        category: "source_col_name or null",
        cost_per_package: "source_col_name or null",
        packages_shipped: "source_col_name or null",
        length_in: "source_col_name or null",
        width_in: "source_col_name or null",
        height_in: "source_col_name or null",
        _dim_col: "packed_dim_col or null",
        origin_zip: "source_col_name or null",
        destination_zip: "source_col_name or null",
        actual_weight_lb: "source_col_name or null",
        billable_weight_lb: "source_col_name or null",
        carrier: "source_col_name or null",
        selling_platform: "source_col_name or null"
      },
      skipped_rows_estimate: 0,
      notes: "brief observations"
    }, null, 2)
  ].join("\n");;

  const response = await window.claude.complete({
    messages: [{ role: 'user', content: prompt }],
  });

  let text = response.trim();
  // Strip markdown code fences if present
  const fence = '\x60\x60\x60';
  if (text.indexOf(fence) === 0) text = text.slice(text.indexOf('\n') + 1);
  const lastFence = text.lastIndexOf(fence);
  if (lastFence !== -1) text = text.slice(0, lastFence);
  text = text.trim();
  const aiMapping = JSON.parse(text);

  // Apply mapping + normalize ALL rows client-side
  const normalizedRows = applyMappingAndNormalize(cleanRows, aiMapping.column_mapping, headers);

  return {
    file_type: aiMapping.file_type || 'Shipment data',
    confidence: aiMapping.confidence || 0.8,
    column_mapping: aiMapping.column_mapping,
    normalized_rows: normalizedRows,
    skipped_rows: cleanRows.length - normalizedRows.length + (rows.length - cleanRows.length),
    notes: aiMapping.notes || '',
  };
}

// ── AI Review Table — editable preview of normalized rows ──────────────────
const AIReviewTable = ({ rows, onUpdate, onRemove }) => {
  if (!rows || rows.length === 0) {
    return (
      <div style={{padding:30, textAlign:"center", border:"2px dashed var(--ink)", borderRadius:8, color:"var(--gray)", fontFamily:"var(--font-mono)", fontSize:12}}>
        No rows to review. Try re-uploading.
      </div>
    );
  }
  const cols = CANONICAL_FIELDS;
  const previewRows = rows.slice(0, 50);
  return (
    <div style={{border:"2px solid var(--ink)", borderRadius:8, overflow:"auto", background:"#fff", maxHeight:520, boxShadow:"3px 3px 0 var(--ink)"}}>
      <table style={{width:"100%", borderCollapse:"collapse", fontFamily:"var(--font-mono)", fontSize:11}}>
        <thead style={{position:"sticky", top:0, background:"var(--ink)", color:"#fff", zIndex:1}}>
          <tr>
            <th style={{padding:"8px 10px", textAlign:"left", fontSize:10, textTransform:"uppercase", letterSpacing:0.5}}>#</th>
            {cols.map(c => (
              <th key={c.id} style={{padding:"8px 10px", textAlign:"left", fontSize:10, textTransform:"uppercase", letterSpacing:0.5, whiteSpace:"nowrap"}}>
                {c.label}{c.required && <span style={{color:"var(--yellow)"}}> *</span>}
              </th>
            ))}
            <th style={{padding:"8px 10px", width:40}}></th>
          </tr>
        </thead>
        <tbody>
          {previewRows.map((row, i) => (
            <tr key={i} style={{borderTop:"1px solid var(--ink)"}}>
              <td style={{padding:"6px 10px", color:"var(--gray)", fontSize:10}}>{i+1}</td>
              {cols.map(c => {
                const val = row[c.id] == null ? "" : row[c.id];
                const missing = c.required && (val === "" || val == null);
                return (
                  <td key={c.id} style={{padding:0, borderLeft:"1px solid #eee", background: missing ? "rgba(255,200,0,0.18)" : "transparent"}}>
                    <input
                      value={val}
                      onChange={e => onUpdate(i, c.id, e.target.value)}
                      style={{width:"100%", minWidth:90, padding:"6px 8px", border:"none", outline:"none", background:"transparent", fontFamily:"var(--font-mono)", fontSize:11, color:"var(--ink)"}}
                    />
                  </td>
                );
              })}
              <td style={{padding:"4px 6px", textAlign:"center"}}>
                <button
                  onClick={() => onRemove(i)}
                  title="Remove row"
                  style={{border:"1px solid var(--ink)", background:"#fff", borderRadius:4, padding:"2px 8px", cursor:"pointer", fontFamily:"var(--font-mono)", fontSize:11, lineHeight:1}}
                >×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 50 && (
        <div style={{padding:"8px 12px", borderTop:"2px solid var(--ink)", fontFamily:"var(--font-mono)", fontSize:11, color:"var(--gray)", background:"#fafafa"}}>
          Showing first 50 of {rows.length} rows. All {rows.length} will be imported.
        </div>
      )}
    </div>
  );
};

// ── Silo component ─────────────────────────────────────────────────────────────
const SiloNew = ({ tier }) => {
  // steps: list | upload | ai-parsing | ai-review | success
  const [step, setStep] = React.useState("list");
  const [parsedFile, setParsedFile] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [showCascade, setShowCascade] = React.useState(false);
  const [files, setFiles] = React.useState(window.SC_STATE.siloFiles);
  const [aiResult, setAiResult] = React.useState(null);
  const [reviewRows, setReviewRows] = React.useState([]);
  const [aiError, setAiError] = React.useState(null);
  const [aiProgress, setAiProgress] = React.useState("");
  const [, forceUpdate] = React.useReducer(x => x+1, 0);

  React.useEffect(() => { window.SC_STATE.subscribe(forceUpdate); }, []);

  const handleFile = (file) => {
    parseFile(file, result => {
      if (result.error) { alert("Parse error: " + result.error); return; }
      setParsedFile({ name: file.name, size: file.size, headers: result.headers, rows: result.rows });
      setStep("ai-parsing");
      runAIParsing({ name: file.name, size: file.size, headers: result.headers, rows: result.rows });
    });
  };

  const runAIParsing = async (pf) => {
    setAiError(null);
    setAiProgress("Reading your file…");
    try {
      setAiProgress("Analyzing " + pf.rows.length + " rows — AI is mapping columns…");
      const result = await aiParseFile(pf);
      setAiResult(result);
      setReviewRows(result.normalized_rows || []);
      setStep("ai-review");
    } catch(err) {
      console.warn('AI parse error:', err);
      // Graceful fallback: use client-side auto-mapping only
      const autoMapped = autoMap(pf.headers);
      const fallbackRows = applyMappingAndNormalize(
        pf.rows, autoMapped, pf.headers
      );
      setAiError("AI mapping failed: " + err.message + ". Used column-name matching — please review and adjust.");
      setAiResult({
        file_type: "Auto-detected (AI unavailable)",
        confidence: 0.5,
        column_mapping: autoMapped,
        skipped_rows: pf.rows.length - fallbackRows.length,
        notes: "Fallback: matched columns by name. Check mappings carefully.",
      });
      setReviewRows(fallbackRows);
      setStep("ai-review");
    }
  };

  const handleUpdateRow = (i, field, val) => {
    setReviewRows(prev => { const r = [...prev]; r[i] = {...r[i], [field]: val}; return r; });
  };
  const handleRemoveRow = (i) => {
    setReviewRows(prev => prev.filter((_,idx) => idx !== i));
  };

  const handleImport = () => {
    const processed = window.ingestRows(reviewRows);
    const fileMeta = {
      name: parsedFile.name,
      schema: "shipments",
      rows: processed.length,
      size: Math.round(parsedFile.size / 1024) + " KB",
      when: "Just now",
      ai: true,
      aiNotes: aiResult?.notes,
    };
    window.SC_STATE.setProcessedRows(processed, fileMeta);
    setFiles([fileMeta, ...files]);
    setStep("success");
  };

  const handleDrop = e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if(f) handleFile(f); };
  const currentFiles = window.SC_STATE.siloFiles.length ? window.SC_STATE.siloFiles : files;

  return (
    <div className="page" style={{padding:"18px 24px"}}>
      {/* Header */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14}}>
        <div>
          <div style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:1.5, textTransform:"uppercase", color:"var(--gray)"}}>Your data · single source of truth</div>
          <div style={{fontFamily:"var(--font-display)", fontSize:24, textTransform:"uppercase", letterSpacing:0.5, marginTop:2}}>The Silo</div>
        </div>
        <div style={{display:"flex", gap:12, alignItems:"center"}}>
          <div style={{fontFamily:"var(--font-mono)", fontSize:11.5, color:"var(--gray)"}}>{currentFiles.length} files</div>
          <button className="btn sm" onClick={downloadTemplate}><Icon name="download" size={12}/> Download template</button>
          <button className="btn primary" onClick={()=>setStep("upload")}><Icon name="upload" size={12}/> Upload data</button>
        </div>
      </div>

      {/* Schema chips */}
      <div style={{marginBottom:14, padding:"10px 14px", background:"var(--paper)", border:"1.5px solid var(--ink)", borderRadius:8, display:"flex", flexWrap:"wrap", gap:6, alignItems:"center"}}>
        <div style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:1.5, textTransform:"uppercase", color:"var(--gray)", marginRight:6}}>Required fields:</div>
        {CANONICAL_FIELDS.map(f => (
          <span key={f.id} style={{padding:"3px 9px", border:"1.5px solid var(--ink)", borderRadius:4, fontFamily:"var(--font-mono)", fontSize:10.5,
            background: f.required ? "var(--ink)" : "transparent", color: f.required ? "#fff" : "var(--gray)"}}>
            {f.label}{!f.required && <span style={{opacity:0.5, marginLeft:3, fontSize:9}}> opt</span>}
          </span>
        ))}
      </div>

      {/* Upload step */}
      {step === "upload" && (
        <div onDrop={handleDrop} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
          style={{border:"3px dashed " + (dragOver?"var(--blue)":"var(--ink)"), borderRadius:12, padding:"60px 40px",
            background: dragOver?"var(--blue-light)":"var(--white)", textAlign:"center", transition:"all 0.15s"}}>
          <div style={{fontFamily:"var(--font-display)", fontSize:28, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8}}>
            Drop any CSV or XLSX here
          </div>
          <div style={{fontFamily:"var(--font-mono)", fontSize:12, color:"var(--gray)", marginBottom:6}}>
            Any format — our AI will read it, extract what's needed, and normalize it to our schema.
          </div>
          <div style={{display:"inline-flex", alignItems:"center", gap:8, fontFamily:"var(--font-mono)", fontSize:11.5, background:"var(--yellow)", border:"1.5px solid var(--ink)", borderRadius:6, padding:"8px 14px", marginBottom:20}}>
            <Icon name="sparkle" size={14}/> AI will auto-categorize columns, fix formats, and normalize all rows
          </div>
          <div style={{display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap"}}>
            <input type="file" accept=".csv,.xlsx,.xls" style={{display:"none"}} id="file-input" onChange={e=>handleFile(e.target.files[0])}/>
            <label htmlFor="file-input" className="btn primary" style={{cursor:"pointer"}}>Browse file</label>
            <button className="btn" onClick={downloadTemplate}><Icon name="download" size={12}/> Download template</button>
            <button className="btn" onClick={()=>setStep("list")}>Cancel</button>
          </div>
        </div>
      )}

      {/* AI parsing step */}
      {step === "ai-parsing" && (
        <div style={{textAlign:"center", padding:"60px 40px"}}>
          <div style={{width:80, height:80, margin:"0 auto 20px", position:"relative"}}>
            <PixelCow inflate={0.2} size={80}/>
          </div>
          <div style={{fontFamily:"var(--font-display)", fontSize:22, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8}}>
            Mooovy is reading your file…
          </div>
          <div style={{fontFamily:"var(--font-mono)", fontSize:13, color:"var(--gray)", marginBottom:20}}>{aiProgress}</div>
          <div style={{display:"flex", gap:6, justifyContent:"center"}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{width:10, height:10, background:"var(--blue)", borderRadius:"50%",
                animation:"pulse 1.2s ease-in-out " + (i*0.2) + "s infinite"}}/>
            ))}
          </div>
          <style>{"@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}"}</style>
        </div>
      )}

      {/* AI review step */}
      {step === "ai-review" && aiResult && (
        <div>
          {/* AI summary banner */}
          <div style={{padding:"14px 18px", background: aiError ? "var(--amber-soft,#fffbeb)" : "var(--yellow)", border:"2px solid var(--ink)", borderRadius:8, marginBottom:16, boxShadow:"3px 3px 0 var(--ink)"}}>
            <div style={{display:"flex", gap:14, alignItems:"flex-start", flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:"var(--font-display)", fontSize:15, textTransform:"uppercase", letterSpacing:0.5, display:"flex", alignItems:"center", gap:8}}>
                  <Icon name="sparkle" size={15}/>
                  {aiError ? "Auto-mapped (AI unavailable)" : "AI categorized your file"}
                </div>
                <div style={{fontFamily:"var(--font-mono)", fontSize:11.5, marginTop:4}}>
                  <strong>Type:</strong> {aiResult.file_type} &nbsp;·&nbsp;
                  <strong>Confidence:</strong> {Math.round((aiResult.confidence||0.5)*100)}% &nbsp;·&nbsp;
                  <strong>Rows extracted:</strong> {reviewRows.length} &nbsp;·&nbsp;
                  <strong>Skipped:</strong> {aiResult.skipped_rows || 0}
                </div>
                {aiResult.notes && <div style={{fontFamily:"var(--font-mono)", fontSize:11, marginTop:4, opacity:0.8}}>{aiResult.notes}</div>}
                {aiError && <div style={{fontFamily:"var(--font-mono)", fontSize:11, color:"var(--red)", marginTop:4}}>{aiError}</div>}
              </div>
              <div style={{display:"flex", gap:8, flexShrink:0}}>
                <button className="btn sm" onClick={()=>setStep("upload")}>← Re-upload</button>
                <button className="btn sm dark" onClick={handleImport} disabled={reviewRows.length===0}>
                  <Icon name="check" size={12}/> Confirm & import ({reviewRows.length} rows)
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <div style={{fontFamily:"var(--font-mono)", fontSize:11, color:"var(--gray)"}}>
              Review, edit, or remove rows before importing. Click any cell to edit.
            </div>
            <div style={{display:"flex", gap:8}}>
              <button className="btn sm" onClick={()=>setReviewRows(prev=>[...prev, {...CANONICAL_FIELDS.reduce((o,f)=>(o[f.id]="",o),{})}])}>+ Add row</button>
            </div>
          </div>

          <AIReviewTable rows={reviewRows} onUpdate={handleUpdateRow} onRemove={handleRemoveRow}/>

          <div style={{display:"flex", gap:8, justifyContent:"flex-end", marginTop:14}}>
            <button className="btn" onClick={()=>setStep("upload")}>← Back</button>
            <button className="btn primary" onClick={handleImport} disabled={reviewRows.length===0}>
              <Icon name="check" size={12}/> Confirm & import ({reviewRows.length} rows) →
            </button>
          </div>
        </div>
      )}

      {/* Success banner */}
      {step === "success" && (
        <div style={{marginBottom:14, padding:"14px 18px", background:"var(--yellow)", border:"2px solid var(--ink)", borderRadius:8, display:"flex", alignItems:"center", gap:12, boxShadow:"3px 3px 0 var(--ink)"}}>
          <Icon name="check" size={18}/>
          <div>
            <div style={{fontFamily:"var(--font-display)", fontSize:16, textTransform:"uppercase"}}>Import complete</div>
            <div style={{fontFamily:"var(--font-mono)", fontSize:11.5, marginTop:2}}>{window.SC_STATE.processedRows.length} rows ingested · Dashboard, Zoning Map, Mooovy & Daily Insight updated</div>
          </div>
          <button className="btn sm dark" style={{marginLeft:"auto"}} onClick={()=>setStep("list")}>View files</button>
        </div>
      )}

      {/* File list */}
      {(step === "list" || step === "success") && (
        <div className="silo">
          <div className="panel">
            <div className="panel-h">
              <span className="t">Files</span>
              <span style={{fontFamily:"var(--font-mono)", fontSize:10, color:"var(--gray)"}}>{currentFiles.length}</span>
            </div>
            {currentFiles.length === 0 ? (
              <div style={{padding:24, textAlign:"center", color:"var(--gray)"}}>
                <div style={{fontFamily:"var(--font-display)", fontSize:16, textTransform:"uppercase", marginBottom:6}}>No files yet</div>
                <div style={{fontFamily:"var(--font-mono)", fontSize:11}}>Upload any spreadsheet to get started</div>
                <button className="btn primary" style={{marginTop:12}} onClick={()=>setStep("upload")}>Upload now</button>
              </div>
            ) : (
              <div className="files">
                {currentFiles.map((f,i) => (
                  <div key={i} className={"file " + (i===active?"active":"")} onClick={()=>setActive(i)}>
                    <div className="ic">XLSX</div>
                    <div style={{flex:1, minWidth:0}}>
                      <div className="name" style={{whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{f.name}</div>
                      <div className="sub">{f.rows} rows · {f.size} · {f.when}</div>
                      {f.ai && <span style={{fontFamily:"var(--font-mono)", fontSize:9.5, color:"var(--blue)", fontWeight:700}}><Icon name="sparkle" size={9}/> AI parsed</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-h">
              <span className="t">{currentFiles[active]?.name || "No file selected"}</span>
            </div>
            {window.SC_STATE.processedRows.length > 0 ? (
              <div className="preview">
                <table className="xlsx">
                  <thead>
                    <tr>
                      <th className="rownum"></th>
                      <th>date</th><th>sku</th><th>carrier</th><th>origin_zip</th><th>dest_zip</th>
                      <th>actual_lb</th><th>billable_lb</th><th>cost</th><th>zone</th><th>platform</th>
                    </tr>
                  </thead>
                  <tbody>
                    {window.SC_STATE.processedRows.slice(0,12).map((r,i)=>(
                      <tr key={i}>
                        <td className="rownum">{i+1}</td>
                        <td>{r.date}</td>
                        <td style={{fontWeight:600}}>{r.sku}</td>
                        <td>{r.carrier}</td>
                        <td>{r.origin_zip}</td>
                        <td>{r.destination_zip}</td>
                        <td>{parseFloat(r.actual_weight_lb||0).toFixed(1)}</td>
                        <td>{parseFloat(r.billable_weight_lb||0).toFixed(1)}</td>
                        <td>${parseFloat(r.cost_per_package||0).toFixed(2)}</td>
                        <td style={{fontWeight:700, color:"var(--blue)"}}>{r.zone}</td>
                        <td>{r.selling_platform}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{padding:24, textAlign:"center", color:"var(--gray)"}}>
                <div style={{fontFamily:"var(--font-mono)", fontSize:11}}>Upload a file to preview data here</div>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-h"><span className="t">Metadata</span></div>
            <div style={{padding:14, display:"flex", flexDirection:"column", gap:10}}>
              {currentFiles[active] ? (
                <>
                  <SiloMeta k="Filename" v={currentFiles[active].name}/>
                  <SiloMeta k="Schema"   v={currentFiles[active].schema}/>
                  <SiloMeta k="Rows"     v={currentFiles[active].rows}/>
                  <SiloMeta k="Size"     v={currentFiles[active].size}/>
                  <SiloMeta k="Uploaded" v={currentFiles[active].when}/>
                  {currentFiles[active].ai && <SiloMeta k="Parsed by" v="Mooovy AI"/>}
                  {currentFiles[active].aiNotes && <SiloMeta k="AI notes" v={currentFiles[active].aiNotes}/>}
                  <div style={{display:"flex", flexDirection:"column", gap:6, marginTop:6}}>
                    <button className="btn sm"><Icon name="download" size={12}/> Download CSV</button>
                    <button className="btn sm" style={{background:"var(--red-soft)"}} onClick={()=>setShowCascade(true)}><Icon name="trash" size={12}/> Delete</button>
                  </div>
                </>
              ) : (
                <div style={{fontFamily:"var(--font-mono)", fontSize:11, color:"var(--gray)"}}>Select a file to view metadata</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCascade && (
        <div className="modal-back" onClick={()=>setShowCascade(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>Delete this file?</h3>
            <p style={{color:"var(--ink-soft)", marginTop:6}}>This will remove <strong>{currentFiles[active]?.rows} shipment records</strong> and reset all surfaces.</p>
            <div style={{display:"flex", gap:8, justifyContent:"flex-end", marginTop:14}}>
              <button className="btn" onClick={()=>setShowCascade(false)}>Cancel</button>
              <button className="btn dark" onClick={()=>{ window.SC_STATE.clear(); setShowCascade(false); setStep("list"); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SiloMeta = ({ k, v }) => (
  <div>
    <div style={{fontFamily:"var(--font-mono)", fontSize:9.5, letterSpacing:1.5, color:"var(--gray)", textTransform:"uppercase"}}>{k}</div>
    <div style={{fontSize:13, fontWeight:600, marginTop:2}}>{v}</div>
  </div>
);

window.Silo = SiloNew;
