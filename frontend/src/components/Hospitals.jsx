import { useLang } from "../context/LangContext";

const HOSPITALS = [
  { name:"Kenyatta National Hospital",    dist:"2.1 km", type:"Public",   rating:4.1, phone:"+254-20-2726300", emergency:true  },
  { name:"Nairobi Hospital",              dist:"3.4 km", type:"Private",  rating:4.6, phone:"+254-20-2845000", emergency:true  },
  { name:"Aga Khan University Hospital",  dist:"4.8 km", type:"Private",  rating:4.7, phone:"+254-20-3662000", emergency:true  },
  { name:"MP Shah Hospital",              dist:"5.2 km", type:"Private",  rating:4.4, phone:"+254-20-4291000", emergency:true  },
  { name:"Karen Hospital",               dist:"8.0 km", type:"Private",  rating:4.5, phone:"+254-20-6613000", emergency:false },
  { name:"Gertrude's Children Hospital",  dist:"6.1 km", type:"Specialist",rating:4.5,phone:"+254-20-7206000", emergency:true  },
];

function Stars({ rating }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? "#fbbf24" : "#374151", fontSize:"0.78rem" }}>★</span>
      ))}
      <span style={{ marginLeft:4, fontSize:"0.75rem", color:"#64748b" }}>{rating}</span>
    </span>
  );
}

export default function Hospitals() {
  const { t } = useLang();

  return (
    <div className="fade-up">
      <div className="section-title">
        <span className="dot" style={{ background:"#22c55e" }}/>
        🏥 {t.hospitals} — Nairobi
      </div>

      <div style={{
        background:"rgba(234,179,8,0.07)", border:"1px solid rgba(234,179,8,0.2)",
        borderRadius:10, padding:"10px 14px", marginBottom:18, fontSize:"0.8rem", color:"#fbbf24",
      }}>
        📍 Showing facilities near your location. Always call ahead before visiting.
      </div>

      {HOSPITALS.map((h, i) => (
        <div key={i} className="card" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, animation:`fadeUp 0.3s ease ${i*0.06}s both` }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"0.92rem", color:"#e2e8f0" }}>
                {h.name}
              </span>
              {h.emergency && (
                <span style={{
                  fontSize:"0.65rem", background:"rgba(239,68,68,0.15)",
                  border:"1px solid rgba(239,68,68,0.3)", color:"#f87171",
                  borderRadius:6, padding:"1px 6px", fontWeight:700,
                }}>
                  24h ER
                </span>
              )}
            </div>
            <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
              <Stars rating={h.rating}/>
              <span style={{
                fontSize:"0.73rem", color:"var(--text-dim)",
                background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:6, padding:"2px 8px",
              }}>{h.type}</span>
              <a href={`tel:${h.phone}`} style={{ fontSize:"0.73rem", color:"#38bdf8", textDecoration:"none" }}>
                📞 {h.phone}
              </a>
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1rem", color:"#38bdf8" }}>
              {h.dist}
            </div>
            <button
              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(h.name+", Nairobi")}`, "_blank")}
              style={{
                marginTop:6, background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.25)",
                color:"#38bdf8", borderRadius:7, padding:"4px 10px", fontSize:"0.72rem",
                cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
              }}
            >
              🗺 Map
            </button>
          </div>
        </div>
      ))}

      {/* Emergency strip */}
      <div style={{
        background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)",
        borderRadius:12, padding:"14px 18px", marginTop:10, textAlign:"center",
      }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:"#f87171", marginBottom:6 }}>
          🚨 Emergency Numbers
        </div>
        <div style={{ display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap" }}>
          {[["Ambulance","999 / 112"],["Police","999"],["Fire","999"],["Red Cross","+254-20-3950000"]].map(([l,n]) => (
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"0.7rem", color:"#64748b", textTransform:"uppercase" }}>{l}</div>
              <div style={{ fontWeight:700, color:"#f87171", fontSize:"0.9rem" }}>{n}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
