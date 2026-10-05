import { useState, useEffect } from "react";
import { fetchHistory, clearHistory } from "../api/client";
import { useLang } from "../context/LangContext";

const SEV_COLOR = { Mild:"#22c55e", Moderate:"#f59e0b", Severe:"#ef4444", Critical:"#7c3aed" };

export default function History({ onRestore }) {
  const { t } = useLang();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchHistory(20)
      .then(r => setRecords(r.data.history || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleClear = async () => {
    if (!window.confirm("Clear all history?")) return;
    await clearHistory();
    setRecords([]);
  };

  if (loading) return (
    <div style={{ textAlign:"center", padding:40, color:"var(--text-muted)" }} className="pulse">
      Loading history…
    </div>
  );

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div className="section-title" style={{ margin:0 }}>
          <span className="dot" style={{ background:"#818cf8" }}/>
          📋 {t.history}
        </div>
        {records.length > 0 && (
          <button onClick={handleClear} style={{
            background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)",
            color:"#f87171", borderRadius:8, padding:"5px 12px",
            fontSize:"0.78rem", cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
          }}>
            🗑 Clear All
          </button>
        )}
      </div>

      {records.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 20px", color:"var(--text-dim)" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:10 }}>🔍</div>
          {t.noHistory}
        </div>
      )}

      {records.map((r, i) => {
        const sev   = r.overall_severity || "Moderate";
        const color = SEV_COLOR[sev] || "#f59e0b";
        return (
          <div key={r.id}
            onClick={() => onRestore && onRestore(r)}
            className="card"
            style={{
              cursor: onRestore ? "pointer" : "default",
              animation:`fadeUp 0.3s ease ${i*0.05}s both`,
            }}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
              <div style={{ flex:1 }}>
                {/* Time + severity */}
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:"0.72rem", color:"var(--text-dim)" }}>
                    🕐 {new Date(r.created_at).toLocaleString()}
                  </span>
                  <span style={{
                    fontSize:"0.7rem", fontWeight:700, padding:"2px 8px",
                    borderRadius:10, background:`${color}18`, color,
                  }}>{sev}</span>
                  {r.feedback && (
                    <span style={{ fontSize:"0.7rem", color: r.feedback === "correct" ? "#22c55e" : "#f59e0b" }}>
                      {r.feedback === "correct" ? "✓ Accurate" : r.feedback === "wrong" ? "✗ Inaccurate" : "? Unsure"}
                    </span>
                  )}
                </div>

                {/* Symptoms */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                  {(r.symptoms || []).map((s, j) => (
                    <span key={j} style={{
                      background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)",
                      borderRadius:7, padding:"2px 8px", fontSize:"0.73rem", color:"var(--text-muted)",
                    }}>{s.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</span>
                  ))}
                </div>

                {/* Top disease */}
                {r.top_disease && (
                  <div style={{ fontSize:"0.82rem", color:"#38bdf8" }}>
                    Top: <strong>{r.top_disease}</strong>
                    {r.confidence && <span style={{ color:"var(--text-dim)" }}> · {r.confidence}% confidence</span>}
                  </div>
                )}
              </div>

              {onRestore && (
                <div style={{ color:"var(--text-dim)", fontSize:"0.8rem", flexShrink:0, marginTop:2 }}>
                  View →
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
