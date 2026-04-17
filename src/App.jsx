import { useState, useEffect, useRef } from "react";

// ── Palette & design tokens ──────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #080c10;
    --panel:    #0d1318;
    --border:   #1a2430;
    --accent:   #00e5a0;
    --accent2:  #ff6b35;
    --accent3:  #4a9eff;
    --warn:     #ffd700;
    --text:     #e2eaf2;
    --muted:    #5a7080;
    --font-head: 'Syne', sans-serif;
    --font-mono: 'Space Mono', monospace;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-head); overflow-x: hidden; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes slideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 8px var(--accent)} 50%{box-shadow:0 0 24px var(--accent)} }
  @keyframes scanline { 0%{top:-10%} 100%{top:110%} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
`;

// ── Fake zone data ────────────────────────────────────────────────────────────
const ZONES = [
  { id:1,  name:"Aerocity Corridor",    city:"Delhi",    lat:28.56, lng:77.12, gvs:9.2, muni:9.5, market:8.8, price:"+22%", rental:"88%", status:"HOT",    trend:"up",   projects:["IGI Metro Ext.","NH-8 Widening"],        forecast:"₹18,200/sqft by 2027", listings:1240, appreciation:"+31% YoY" },
  { id:2,  name:"Sector 82–90 Belt",    city:"Mohali",   lat:30.71, lng:76.69, gvs:8.7, muni:9.1, market:8.3, price:"+18%", rental:"82%", status:"HOT",    trend:"up",   projects:["Aerotropolis Phase 2","IT SEZ"],           forecast:"₹9,800/sqft by 2027",  listings:890,  appreciation:"+24% YoY" },
  { id:3,  name:"Hinjewadi Phase 4",    city:"Pune",     lat:18.59, lng:73.73, gvs:8.4, muni:8.6, market:8.2, price:"+15%", rental:"79%", status:"HOT",    trend:"up",   projects:["Pune Metro Line 3","Ring Road"],           forecast:"₹11,500/sqft by 2027", listings:2100, appreciation:"+19% YoY" },
  { id:4,  name:"Whitefield East",      city:"Bangalore",lat:12.97, lng:77.75, gvs:7.9, muni:7.4, market:8.4, price:"+12%", rental:"76%", status:"RISING", trend:"up",   projects:["Namma Metro Phase 3","ORR Junction"],      forecast:"₹14,200/sqft by 2027", listings:3200, appreciation:"+17% YoY" },
  { id:5,  name:"New Town Rajarhat",    city:"Kolkata",  lat:22.59, lng:88.48, gvs:7.4, muni:8.1, market:6.7, price:"+10%", rental:"71%", status:"RISING", trend:"up",   projects:["East-West Metro Ext.","IT Hub Phase 3"],   forecast:"₹7,200/sqft by 2027",  listings:780,  appreciation:"+14% YoY" },
  { id:6,  name:"OMR Sholinganallur",   city:"Chennai",  lat:12.90, lng:80.22, gvs:7.1, muni:6.8, market:7.4, price:"+9%",  rental:"74%", status:"RISING", trend:"up",   projects:["Chennai Metro Ph.2","Peripheral Ring Rd"], forecast:"₹10,100/sqft by 2027", listings:1560, appreciation:"+13% YoY" },
  { id:7,  name:"Dwarka Expressway",    city:"Gurugram", lat:28.60, lng:77.03, gvs:6.8, muni:6.2, market:7.4, price:"+8%",  rental:"68%", status:"STABLE", trend:"flat", projects:["RRTS Corridor"],                           forecast:"₹12,800/sqft by 2027", listings:2800, appreciation:"+9% YoY"  },
  { id:8,  name:"Bavdhan–Baner",        city:"Pune",     lat:18.54, lng:73.77, gvs:6.4, muni:5.9, market:6.9, price:"+7%",  rental:"65%", status:"STABLE", trend:"flat", projects:["PMC Road Widening"],                       forecast:"₹10,800/sqft by 2027", listings:1340, appreciation:"+8% YoY"  },
  { id:9,  name:"Thanisandra Main Rd",  city:"Bangalore",lat:13.07, lng:77.62, gvs:5.9, muni:5.4, market:6.4, price:"+5%",  rental:"61%", status:"WATCH",  trend:"flat", projects:["BBMP Drain Project"],                      forecast:"₹8,400/sqft by 2027",  listings:980,  appreciation:"+6% YoY"  },
  { id:10, name:"Vasai–Virar Belt",     city:"Mumbai",   lat:19.38, lng:72.84, gvs:5.4, muni:6.1, market:4.7, price:"+4%",  rental:"57%", status:"WATCH",  trend:"down", projects:["Virar-Alibaug Corridor (Proposed)"],       forecast:"₹7,100/sqft by 2027",  listings:620,  appreciation:"+5% YoY"  },
];

const STATUS_COLOR = { HOT:"#00e5a0", RISING:"#4a9eff", STABLE:"#ffd700", WATCH:"#ff6b35" };
const STATUS_BG    = { HOT:"#00e5a010", RISING:"#4a9eff10", STABLE:"#ffd70010", WATCH:"#ff6b3510" };

// ── Tiny components ───────────────────────────────────────────────────────────
function Tag({ status }) {
  return (
    <span style={{
      background: STATUS_BG[status], color: STATUS_COLOR[status],
      border: `1px solid ${STATUS_COLOR[status]}40`,
      borderRadius: 4, padding: "2px 8px", fontSize: 10,
      fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: 1
    }}>{status}</span>
  );
}

function ScoreBar({ value, max = 10, color = "var(--accent)" }) {
  return (
    <div style={{ background: "#ffffff10", borderRadius: 2, height: 4, width: "100%", overflow: "hidden" }}>
      <div style={{
        width: `${(value / max) * 100}%`, height: "100%",
        background: color, borderRadius: 2,
        transition: "width 0.8s cubic-bezier(.4,0,.2,1)"
      }} />
    </div>
  );
}

function TrendArrow({ trend }) {
  if (trend === "up")   return <span style={{ color: "#00e5a0", fontSize: 14 }}>▲</span>;
  if (trend === "down") return <span style={{ color: "#ff6b35", fontSize: 14 }}>▼</span>;
  return <span style={{ color: "#ffd700", fontSize: 14 }}>◆</span>;
}

function MiniSparkline({ value }) {
  const pts = Array.from({ length: 8 }, (_, i) =>
    Math.max(10, Math.min(90, 50 + (value - 5) * 6 + (Math.sin(i * 1.4 + value) * 15)))
  );
  const d = pts.map((y, i) => `${i === 0 ? "M" : "L"}${i * 14},${90 - y}`).join(" ");
  return (
    <svg width={98} height={36} style={{ display: "block" }}>
      <polyline points={pts.map((y, i) => `${i * 14},${36 - y * 0.36}`).join(" ")}
        fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

// ── Heatmap (SVG-based city grid) ─────────────────────────────────────────────
function HeatMap({ zones, selected, onSelect }) {
  const cities = [...new Set(zones.map(z => z.city))];
  const gridW = 520, gridH = 360;

  const cityPositions = {
    Delhi:     { x: 200, y:  80 },
    Mohali:    { x: 150, y:  60 },
    Pune:      { x: 160, y: 250 },
    Bangalore: { x: 200, y: 290 },
    Kolkata:   { x: 380, y: 170 },
    Chennai:   { x: 250, y: 310 },
    Gurugram:  { x: 190, y:  95 },
    Mumbai:    { x: 120, y: 240 },
  };

  function gvsToColor(gvs) {
    if (gvs >= 8.5) return "#00e5a0";
    if (gvs >= 7.5) return "#4a9eff";
    if (gvs >= 6.5) return "#ffd700";
    return "#ff6b35";
  }

  return (
    <div style={{ position: "relative", width: "100%", paddingTop: 8 }}>
      <svg viewBox={`0 0 ${gridW} ${gridH}`} style={{ width: "100%", borderRadius: 8 }}>
        {/* Background */}
        <defs>
          <radialGradient id="mapbg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0d1c2a" />
            <stop offset="100%" stopColor="#080c10" />
          </radialGradient>
          {zones.map(z => {
            const pos = cityPositions[z.city] || { x: 200, y: 180 };
            return (
              <radialGradient key={z.id} id={`glow${z.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={gvsToColor(z.gvs)} stopOpacity={0.35 * (z.gvs / 10)} />
                <stop offset="100%" stopColor={gvsToColor(z.gvs)} stopOpacity={0} />
              </radialGradient>
            );
          })}
        </defs>
        <rect width={gridW} height={gridH} fill="url(#mapbg)" rx={8} />

        {/* Grid lines */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 44} y1={0} x2={i * 44} y2={gridH}
            stroke="#ffffff04" strokeWidth={1} />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 44} x2={gridW} y2={i * 44}
            stroke="#ffffff04" strokeWidth={1} />
        ))}

        {/* India rough outline (simplified dots) */}
        {[
          [130,40],[200,30],[280,40],[340,60],[400,100],[420,150],
          [400,200],[380,260],[320,310],[250,330],[180,320],[130,280],
          [100,230],[90,180],[100,130],[115,80],[130,40]
        ].map(([x,y], i, arr) => i < arr.length - 1 && (
          <line key={i} x1={x} y1={y} x2={arr[i+1][0]} y2={arr[i+1][1]}
            stroke="#ffffff08" strokeWidth={1} strokeDasharray="3,4" />
        ))}

        {/* Glow halos */}
        {zones.map(z => {
          const pos = cityPositions[z.city] || { x: 200, y: 180 };
          const r = 30 + z.gvs * 4;
          return (
            <ellipse key={z.id} cx={pos.x} cy={pos.y} rx={r} ry={r * 0.7}
              fill={`url(#glow${z.id})`} />
          );
        })}

        {/* Zone dots */}
        {zones.map(z => {
          const pos = cityPositions[z.city] || { x: 200, y: 180 };
          const offset = { x: (z.id % 3 - 1) * 18, y: (z.id % 2 - 0.5) * 14 };
          const cx = pos.x + offset.x, cy = pos.y + offset.y;
          const isSelected = selected?.id === z.id;
          const color = gvsToColor(z.gvs);
          return (
            <g key={z.id} onClick={() => onSelect(z)} style={{ cursor: "pointer" }}>
              {isSelected && (
                <circle cx={cx} cy={cy} r={16} fill="none"
                  stroke={color} strokeWidth={1.5} strokeDasharray="4,3" opacity={0.7} />
              )}
              <circle cx={cx} cy={cy} r={isSelected ? 7 : 5}
                fill={color} opacity={0.9}
                style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
              <text x={cx + 9} y={cy + 4} fill={color} fontSize={9}
                fontFamily="var(--font-mono)" opacity={isSelected ? 1 : 0.6}>
                {z.name.split(" ")[0]}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        {[["#00e5a0","HOT (8.5+)"],["#4a9eff","RISING (7.5+)"],["#ffd700","STABLE (6.5+)"],["#ff6b35","WATCH (<6.5)"]].map(([c,l], i) => (
          <g key={i}>
            <circle cx={16} cy={gridH - 60 + i * 14} r={4} fill={c} />
            <text x={24} y={gridH - 56 + i * 14} fill={c} fontSize={8.5} fontFamily="var(--font-mono)" opacity={0.8}>{l}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Zone Detail Panel ─────────────────────────────────────────────────────────
function ZoneDetail({ zone, onClose }) {
  if (!zone) return (
    <div style={{ padding: 32, textAlign: "center", color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>◎</div>
      Click any dot on the map<br />to inspect a zone
    </div>
  );

  const bars = [
    { label: "Municipal Score", val: zone.muni, color: "#00e5a0" },
    { label: "Market Demand",   val: zone.market, color: "#4a9eff" },
    { label: "Price Velocity",  val: zone.gvs * 0.95, color: "#ffd700" },
    { label: "Rental Absorption", val: parseFloat(zone.rental) / 10, color: "#ff6b35" },
  ];

  return (
    <div style={{ padding: "20px 16px", animation: "slideIn .25s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>{zone.name}</div>
          <div style={{ color: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)", marginTop: 2 }}>{zone.city}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Tag status={zone.status} />
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      </div>

      {/* GVS Score */}
      <div style={{ background: "#ffffff05", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted)", marginBottom: 4 }}>GROWTH VELOCITY SCORE</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: STATUS_COLOR[zone.status] }}>{zone.gvs}<span style={{ fontSize: 14, color: "var(--muted)" }}>/10</span></div>
        </div>
        <div>
          <MiniSparkline value={zone.gvs} />
          <div style={{ textAlign: "right", marginTop: 2 }}><TrendArrow trend={zone.trend} /></div>
        </div>
      </div>

      {/* Score bars */}
      <div style={{ marginBottom: 14 }}>
        {bars.map(b => (
          <div key={b.label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{b.label}</span>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: b.color }}>{b.val.toFixed(1)}</span>
            </div>
            <ScoreBar value={b.val} color={b.color} />
          </div>
        ))}
      </div>

      {/* Key metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          ["Price Chg.", zone.price, "#00e5a0"],
          ["Rental Abs.", zone.rental, "#4a9eff"],
          ["Listings", zone.listings, "#ffd700"],
          ["Appreciation", zone.appreciation, "#ff6b35"],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: "#ffffff04", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--muted)", marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted)", marginBottom: 8 }}>GOVT PROJECTS DETECTED</div>
        {zone.projects.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--accent)", fontSize: 8 }}>◆</span>
            <span style={{ fontSize: 11 }}>{p}</span>
          </div>
        ))}
      </div>

      {/* Forecast */}
      <div style={{ background: "#00e5a008", border: "1px solid #00e5a030", borderRadius: 8, padding: "10px 12px" }}>
        <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--accent)", marginBottom: 4 }}>24–36 MONTH FORECAST</div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{zone.forecast}</div>
      </div>
    </div>
  );
}

// ── Data Ingestion Simulator ──────────────────────────────────────────────────
function IngestionPanel({ onIngest }) {
  const [sources, setSources] = useState([
    { id: 1, name: "MagicBricks Scraper",   type: "MARKET",  status: "idle",    last: "2h ago" },
    { id: 2, name: "99acres Feed",           type: "MARKET",  status: "idle",    last: "3h ago" },
    { id: 3, name: "Municipal Corp Delhi",   type: "GOVT",    status: "idle",    last: "6h ago" },
    { id: 4, name: "Pune PCMC Portal",       type: "GOVT",    status: "idle",    last: "12h ago"},
    { id: 5, name: "BBMP Notifications",     type: "GOVT",    status: "idle",    last: "1d ago" },
  ]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  function runScraper(id) {
    setSources(s => s.map(x => x.id === id ? { ...x, status: "running" } : x));
    setTimeout(() => {
      setSources(s => s.map(x => x.id === id ? { ...x, status: "done", last: "just now" } : x));
      onIngest && onIngest(id);
    }, 1800);
  }

  const typeColor = { MARKET: "var(--accent3)", GOVT: "var(--accent)" };

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted)", marginBottom: 12, letterSpacing: 1 }}>DATA SOURCES</div>

      {sources.map(s => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
            background: s.status === "running" ? "var(--warn)" : s.status === "done" ? "var(--accent)" : "var(--border)",
            animation: s.status === "running" ? "pulse 1s infinite" : "none"
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
            <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{s.last}</div>
          </div>
          <span style={{ fontSize: 8, color: typeColor[s.type], fontFamily: "var(--font-mono)", flexShrink: 0 }}>{s.type}</span>
          <button onClick={() => runScraper(s.id)} disabled={s.status === "running"}
            style={{ background: s.status === "running" ? "transparent" : "#ffffff08", border: "1px solid var(--border)", color: s.status === "running" ? "var(--warn)" : "var(--text)", borderRadius: 4, padding: "3px 8px", fontSize: 9, cursor: "pointer", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
            {s.status === "running" ? "..." : "RUN"}
          </button>
        </div>
      ))}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setUploadedFile(f.name); }}
        style={{
          marginTop: 16, border: `1.5px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 8, padding: "16px 12px", textAlign: "center",
          background: dragOver ? "#00e5a008" : "transparent", transition: "all 0.2s"
        }}>
        <div style={{ fontSize: 18, marginBottom: 6, opacity: 0.4 }}>⊕</div>
        <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
          {uploadedFile ? <span style={{ color: "var(--accent)" }}>✓ {uploadedFile}</span> : "Drop CSV / JSON / PDF"}
        </div>
      </div>
    </div>
  );
}

// ── Analytics Panel ───────────────────────────────────────────────────────────
function AnalyticsPanel({ zones }) {
  const hot    = zones.filter(z => z.status === "HOT").length;
  const rising = zones.filter(z => z.status === "RISING").length;
  const avgGvs = (zones.reduce((a, z) => a + z.gvs, 0) / zones.length).toFixed(1);
  const topZone = [...zones].sort((a, b) => b.gvs - a.gvs)[0];

  const cityGroups = zones.reduce((acc, z) => {
    if (!acc[z.city]) acc[z.city] = [];
    acc[z.city].push(z);
    return acc;
  }, {});

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted)", marginBottom: 12, letterSpacing: 1 }}>MARKET OVERVIEW</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          ["HOT ZONES", hot, "var(--accent)"],
          ["RISING",    rising, "var(--accent3)"],
          ["AVG GVS",   avgGvs, "var(--warn)"],
          ["ZONES",     zones.length, "var(--muted)"],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: "#ffffff04", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 12px" }}>
            <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--muted)", marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted)", marginBottom: 8 }}>TOP PERFORMER</div>
        <div style={{ background: "#00e5a008", border: "1px solid #00e5a030", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{topZone.name}</div>
          <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{topZone.city} · GVS {topZone.gvs}</div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted)", marginBottom: 8 }}>GVS BY CITY</div>
        {Object.entries(cityGroups).map(([city, czones]) => {
          const avg = czones.reduce((a, z) => a + z.gvs, 0) / czones.length;
          return (
            <div key={city} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 10 }}>{city}</span>
                <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{avg.toFixed(1)}</span>
              </div>
              <ScoreBar value={avg} color={avg >= 8 ? "var(--accent)" : avg >= 7 ? "var(--accent3)" : "var(--warn)"} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Zone Table ────────────────────────────────────────────────────────────────
function ZoneTable({ zones, selected, onSelect, filter }) {
  const filtered = zones
    .filter(z => !filter || z.status === filter || z.city.toLowerCase().includes(filter.toLowerCase()) || z.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => b.gvs - a.gvs);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Zone", "City", "GVS", "Price Chg", "Rental", "Status", "Trend"].map(h => (
              <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", fontWeight: 400, letterSpacing: 1, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(z => (
            <tr key={z.id} onClick={() => onSelect(z)}
              style={{ borderBottom: "1px solid var(--border)", cursor: "pointer",
                background: selected?.id === z.id ? "#ffffff06" : "transparent",
                transition: "background 0.15s" }}>
              <td style={{ padding: "8px 10px", fontWeight: 600, whiteSpace: "nowrap" }}>{z.name}</td>
              <td style={{ padding: "8px 10px", color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 10 }}>{z.city}</td>
              <td style={{ padding: "8px 10px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: STATUS_COLOR[z.status] }}>{z.gvs}</span>
              </td>
              <td style={{ padding: "8px 10px", color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{z.price}</td>
              <td style={{ padding: "8px 10px", color: "var(--accent3)", fontFamily: "var(--font-mono)" }}>{z.rental}</td>
              <td style={{ padding: "8px 10px" }}><Tag status={z.status} /></td>
              <td style={{ padding: "8px 10px" }}><TrendArrow trend={z.trend} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [selected, setSelected]   = useState(null);
  const [activeTab, setActiveTab] = useState("map");
  const [sideTab, setSideTab]     = useState("detail");
  const [filter, setFilter]       = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [ingestCount, setIngestCount] = useState(0);
  const [zones, setZones] = useState(ZONES);

  useEffect(() => {
    const id = setInterval(() => setLastUpdate(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  function handleIngest() {
    setIngestCount(c => c + 1);
    setLastUpdate(new Date());
  }

  const tabs = [
    { id: "map",   label: "Heatmap" },
    { id: "table", label: "Zone Table" },
    { id: "ingest",label: "Data Ingest" },
  ];

  const sideTabs = [
    { id: "detail",    label: "Zone Detail" },
    { id: "analytics", label: "Analytics" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

        {/* Header */}
        <header style={{ borderBottom: "1px solid var(--border)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>◈</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>UrbanPulse AI</div>
              <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--muted)", letterSpacing: 1 }}>PREDICTIVE REAL ESTATE ANALYTICS · INDIA</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[{ c: "var(--accent)", l: "HOT" }, { c: "var(--accent3)", l: "RISING" }, { c: "var(--warn)", l: "STABLE" }, { c: "var(--accent2)", l: "WATCH" }].map(x => (
                <span key={x.l} style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: x.c, background: `${x.c}12`, border: `1px solid ${x.c}30`, borderRadius: 3, padding: "2px 6px" }}>{x.l}</span>
              ))}
            </div>
            <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
              <span style={{ color: "var(--accent)", marginRight: 6 }}>●</span>
              LIVE · {lastUpdate.toLocaleTimeString()}
              {ingestCount > 0 && <span style={{ color: "var(--accent3)", marginLeft: 8 }}>+{ingestCount} syncs</span>}
            </div>
          </div>
        </header>

        {/* Tab bar */}
        <div style={{ borderBottom: "1px solid var(--border)", padding: "0 20px", display: "flex", gap: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ background: "none", border: "none", borderBottom: `2px solid ${activeTab === t.id ? "var(--accent)" : "transparent"}`, color: activeTab === t.id ? "var(--accent)" : "var(--muted)", padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: 10, cursor: "pointer", letterSpacing: 1, transition: "all .15s" }}>
              {t.label.toUpperCase()}
            </button>
          ))}

          {activeTab === "table" && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
              <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter zones..."
                style={{ background: "#ffffff08", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 10, padding: "4px 10px", outline: "none" }} />
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

          {/* Left / main area */}
          <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
            {activeTab === "map" && (
              <HeatMap zones={zones} selected={selected} onSelect={setSelected} />
            )}
            {activeTab === "table" && (
              <ZoneTable zones={zones} selected={selected} onSelect={setSelected} filter={filter} />
            )}
            {activeTab === "ingest" && (
              <IngestionPanel onIngest={handleIngest} />
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ width: 280, borderLeft: "1px solid var(--border)", flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
              {sideTabs.map(t => (
                <button key={t.id} onClick={() => setSideTab(t.id)}
                  style={{ flex: 1, background: "none", border: "none", borderBottom: `2px solid ${sideTab === t.id ? "var(--accent)" : "transparent"}`, color: sideTab === t.id ? "var(--accent)" : "var(--muted)", padding: "8px 4px", fontFamily: "var(--font-mono)", fontSize: 9, cursor: "pointer", letterSpacing: 1 }}>
                  {t.label.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              {sideTab === "detail"    && <ZoneDetail zone={selected} onClose={() => setSelected(null)} />}
              {sideTab === "analytics" && <AnalyticsPanel zones={zones} />}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid var(--border)", padding: "6px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            {zones.length} zones tracked · {zones.filter(z => z.status === "HOT").length} hot · Scoring: GVS v2.1
          </span>
          <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            DATA HORIZON: 2024–2027 · INDIA MARKET
          </span>
        </footer>
      </div>
    </>
  );
}
