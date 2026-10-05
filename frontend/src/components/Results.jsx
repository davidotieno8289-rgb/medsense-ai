import { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { submitFeedback } from "../api/client";
import { useLang } from "../context/LangContext";

const SEV = {
  Mild:     { color:"#22c55e", bg:"rgba(34,197,94,0.1)",   border:"rgba(34,197,94,0.3)"   },
  Moderate: { color:"#f59e0b", bg:"rgba(245,158,11,0.1)",  border:"rgba(245,158,11,0.3)"  },
  Severe:   { color:"#ef4444", bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.3)"   },
  Critical: { color:"#7c3aed", bg:"rgba(124,58,237,0.1)",  border:"rgba(124,58,237,0.3)"  },
};

function SevBadge({ s }) {
  const c = SEV[s] || SEV.Moderate;
  return (
    <span className="sev-badge" style={{ background:c.bg, color:c.color, border:`1px solid ${c.border}` }}>
      {s}
    </span>
  );
}

function ConfBar({ pct }) {
  const color = pct >= 70 ? "linear-gradient(90deg,#0ea5e9,#6366f1)"
              : pct >= 45 ? "linear-gradient(90deg,#f59e0b,#f97316)"
              :             "linear-gradient(90deg,#64748b,#475569)";
  return (
    <div className="conf-row">
      <span className="conf-label">Confidence</span>
      <div className="conf-bar-wrap">
        <div className="conf-bar" style={{ width:`${pct}%`, background:color }}/>
      </div>
      <span className="conf-pct">{pct}%</span>
    </div>
  );
}

function DiseaseCard({ d, index }) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="card fade-up" style={{ marginBottom:14, animationDelay:`${index*0.07}s` }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, cursor:"pointer" }}
      >
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#e2e8f0" }}>
              {index + 1}. {d.disease}
            </span>
            {d.icd_code && (
              <span style={{ fontSize:"0.7rem", color:"var(--text-dim)", background:"rgba(255,255,255,0.05)", padding:"2px 7px", borderRadius:8 }}>
                ICD {d.icd_code}
              </span>
            )}
          </div>
          <SevBadge s={d.severity} />
        </div>
        <span style={{ color:"var(--text-dim)", fontSize:"1.1rem", marginTop:2 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Confidence bar always visible */}
      <div style={{ marginTop:14 }}>
        <ConfBar pct={d.confidence} />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop:12 }}>
          <p style={{ fontSize:"0.85rem", color:"var(--text-muted)", lineHeight:1.65, marginBottom:12 }}>
            📖 {d.explanation}
          </p>

          {/* Matched symptoms */}
          {d.matched_symptoms?.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>
                {t.matchedSymptoms}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {d.matched_symptoms.map((s,i) => (
                  <span key={i} style={{
                    background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)",
                    borderRadius:10, padding:"3px 10px", fontSize:"0.75rem", color:"#a5b4fc",
                  }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested action */}
          {d.suggested_action && (
            <div style={{
              background:"rgba(56,189,248,0.07)", borderLeft:"3px solid #0ea5e9",
              borderRadius:"0 8px 8px 0", padding:"10px 14px",
              fontSize:"0.83rem", color:"#7dd3fc", lineHeight:1.5, marginBottom:12,
            }}>
              💊 <strong>{t.suggestedAction}:</strong> {d.suggested_action}
            </div>
          )}

          {/* Related symptoms */}
          {d.related_symptoms?.length > 0 && (
            <div>
              <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>
                {t.relatedSymptoms}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {d.related_symptoms.map((s,i) => (
                  <span key={i} style={{
                    background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)",
                    borderRadius:8, padding:"3px 9px", fontSize:"0.74rem", color:"var(--text-dim)",
                  }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChartPanel({ predictions }) {
  const barData = predictions.slice(0, 6).map(d => ({
    name: d.disease.length > 20 ? d.disease.slice(0, 18) + "…" : d.disease,
    value: d.confidence,
    fill: d.confidence >= 70 ? "#0ea5e9" : d.confidence >= 45 ? "#f59e0b" : "#64748b",
  }));

  return (
    <div style={{ marginBottom:20 }}>
      <div className="section-title">
        <span className="dot" style={{ background:"#818cf8" }}/>
        📊 Confidence Chart
      </div>
      <div className="card">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top:8, right:8, bottom:30, left:0 }}>
            <XAxis dataKey="name" tick={{ fill:"#64748b", fontSize:11 }} angle={-30} textAnchor="end" interval={0}/>
            <YAxis domain={[0,100]} tick={{ fill:"#64748b", fontSize:11 }} unit="%" />
            <Tooltip
              contentStyle={{ background:"#111827", border:"1px solid rgba(56,189,248,0.25)", borderRadius:8, color:"#e2e8f0" }}
              formatter={(v) => [`${v}%`, "Confidence"]}
            />
            <Bar dataKey="value" radius={[4,4,0,0]}>
              {barData.map((d, i) => <Cell key={i} fill={d.fill}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FeedbackPanel({ historyId }) {
  const { t } = useLang();
  const [sent, setSent] = useState(false);
  const [rating, setRating] = useState("");

  const submit = async (r) => {
    setRating(r);
    try { await submitFeedback({ history_id: historyId, rating: r }); } catch {}
    setSent(true);
  };

  if (sent) return (
    <div style={{ textAlign:"center", padding:"16px 0", color:"#22c55e", fontSize:"0.9rem" }}>
      ✅ {t.thanksFeedback}
    </div>
  );

  return (
    <div style={{ textAlign:"center", padding:"16px 0" }}>
      <div style={{ fontSize:"0.8rem", color:"var(--text-muted)", marginBottom:10 }}>{t.feedbackQ}</div>
      <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
        {[["correct","#22c55e",t.correct],["unsure","#f59e0b",t.unsure],["wrong","#ef4444",t.wrong]].map(([r,c,label]) => (
          <button key={r} onClick={() => submit(r)} style={{
            background:`rgba(${c.slice(1).match(/../g).map(h=>parseInt(h,16)).join(",")},0.1)`,
            border:`1px solid ${c}`, borderRadius:8, padding:"6px 14px",
            color:c, cursor:"pointer", fontSize:"0.8rem", transition:"all .2s",
          }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Results({ result, symptoms, onBack }) {
  const { t } = useLang();
  const { predictions, overall_severity, disclaimer, history_id } = result;

  const overallSev = SEV[overall_severity] || SEV.Moderate;

  return (
    <div className="fade-up" style={{ paddingBottom:80 }}>
      <button className="btn-back" onClick={onBack}>
        {t.newAnalysis}
      </button>

      {/* Overall summary card */}
      <div className="card" style={{ marginBottom:22, border:`1px solid ${overallSev.border}` }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>
              Analysed symptoms
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"0.95rem", color:"#e2e8f0" }}>
              {symptoms.map(s => s.label).join(" · ")}
            </div>
          </div>
          <div>
            <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", marginBottom:4 }}>{t.severity}</div>
            <SevBadge s={overall_severity}/>
          </div>
        </div>
      </div>

      {/* Chart */}
      {predictions?.length > 0 && <ChartPanel predictions={predictions}/>}

      {/* Disease cards */}
      <div className="section-title">
        <span className="dot" style={{ background:"#0ea5e9" }}/>
        🩺 {t.topConditions}
      </div>
      {predictions?.map((d, i) => <DiseaseCard key={i} d={d} index={i}/>)}

      {/* Feedback */}
      {history_id && <FeedbackPanel historyId={history_id}/>}

      {/* Disclaimer */}
      {disclaimer && <div className="disclaimer" style={{ marginTop:20 }}>{disclaimer}</div>}
    </div>
  );
}
