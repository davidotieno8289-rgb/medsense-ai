import { useState, useEffect, useRef } from "react";
import { fetchSymptoms, fetchSuggestions, predictDiseases } from "../api/client";
import { useLang } from "../context/LangContext";

const SEV_COLOR = { Mild:"#22c55e", Moderate:"#f59e0b", Severe:"#ef4444", Critical:"#7c3aed" };

export default function SymptomInput({ onResult }) {
  const { t } = useLang();
  const [allSymptoms, setAllSymptoms] = useState([]);
  const [query, setQuery]             = useState("");
  const [filtered, setFiltered]       = useState([]);
  const [selected, setSelected]       = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [dropOpen, setDropOpen]       = useState(false);
  const inputRef = useRef(null);
  const dropRef  = useRef(null);

  // Load symptom list from backend
  useEffect(() => {
    fetchSymptoms()
      .then(r => setAllSymptoms(r.data.symptoms || []))
      .catch(() => {});
  }, []);

  // Filter dropdown
  useEffect(() => {
    if (!query.trim()) { setFiltered([]); setDropOpen(false); return; }
    const q = query.toLowerCase();
    const res = allSymptoms.filter(s =>
      (s.label.toLowerCase().includes(q) || s.key.includes(q)) &&
      !selected.find(x => x.key === s.key)
    ).slice(0, 10);
    setFiltered(res);
    setDropOpen(res.length > 0);
  }, [query, allSymptoms, selected]);

  // Smart suggestions from backend
  useEffect(() => {
    if (selected.length === 0) { setSuggestions([]); return; }
    fetchSuggestions(selected.map(s => s.key))
      .then(r => setSuggestions(r.data.suggestions || []))
      .catch(() => {});
  }, [selected]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addSymptom = (sym) => {
    if (!selected.find(s => s.key === sym.key)) {
      setSelected(prev => [...prev, sym]);
    }
    setQuery("");
    setDropOpen(false);
    inputRef.current?.focus();
  };

  const removeSymptom = (key) => setSelected(prev => prev.filter(s => s.key !== key));

  const analyze = async () => {
    if (selected.length === 0) { setError(t.noSymptoms); return; }
    setError("");
    setLoading(true);
    try {
      const { data } = await predictDiseases(selected.map(s => s.key));
      onResult(data, selected);
    } catch (e) {
      const msg = e.response?.data?.error || t.serverError;
      setError(msg);
    }
    setLoading(false);
  };

  const QUICK = ["fever","headache","cough","fatigue","nausea","rash","chest_pain","dizziness","abdominal_pain","diarrhea"];
  const quickSyms = allSymptoms.filter(s => QUICK.includes(s.key));

  return (
    <div className="fade-up">
      {/* Hero */}
      <div style={{ textAlign:"center", padding:"44px 0 32px" }}>
        <h1 style={{
          fontFamily:"'Syne',sans-serif", fontSize:"clamp(2rem,5vw,3rem)",
          fontWeight:800, lineHeight:1.1, marginBottom:12,
          background:"linear-gradient(135deg,#e2e8f0 0%,#38bdf8 50%,#818cf8 100%)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        }}>
          {t.tagline}
        </h1>
        <p style={{ color:"var(--text-muted)", fontSize:"1rem" }}>
          AI-powered analysis across 15 conditions · English & Swahili
        </p>
      </div>

      {/* Search box */}
      <div style={{ position:"relative", marginBottom:16 }} ref={dropRef}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => filtered.length > 0 && setDropOpen(true)}
          placeholder={t.searchPlaceholder}
          style={{
            width:"100%", background:"var(--surface2)",
            border:"1.5px solid var(--border-accent)", borderRadius:"var(--radius)",
            padding:"15px 20px", fontSize:"1rem", color:"var(--text)",
            fontFamily:"'DM Sans',sans-serif", outline:"none",
          }}
        />
        {dropOpen && (
          <div style={{
            position:"absolute", top:"calc(100% + 6px)", left:0, right:0,
            background:"#111827", border:"1px solid var(--border-accent)",
            borderRadius:"var(--radius)", maxHeight:230, overflowY:"auto",
            zIndex:50, boxShadow:"var(--shadow)",
          }}>
            {filtered.map(s => (
              <div key={s.key}
                onClick={() => addSymptom(s)}
                style={{
                  padding:"11px 18px", cursor:"pointer", fontSize:"0.9rem",
                  color:"var(--text-muted)", borderBottom:"1px solid rgba(255,255,255,0.04)",
                  transition:"all .15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(56,189,248,0.1)"; e.currentTarget.style.color="#38bdf8"; }}
                onMouseLeave={e => { e.currentTarget.style.background=""; e.currentTarget.style.color="var(--text-muted)"; }}
              >
                + {s.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:"0.72rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:".08em", fontWeight:600 }}>
              {t.selectedSymptoms} ({selected.length})
            </span>
            <button
              onClick={() => setSelected([])}
              style={{ background:"none", border:"none", color:"var(--text-dim)", fontSize:"0.8rem", cursor:"pointer", padding:"2px 6px" }}
            >
              {t.clearAll}
            </button>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:18 }}>
            {selected.map(s => (
              <span key={s.key} className="chip">
                {s.label}
                <span className="chip-remove" onClick={() => removeSymptom(s.key)}>×</span>
              </span>
            ))}
          </div>
        </>
      )}

      {/* Smart suggestions */}
      {suggestions.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop:4 }}>
            <span className="dot" style={{ background:"#f59e0b" }}/>
            💡 {t.suggestions}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:18 }}>
            {suggestions.map(s => (
              <div key={s.key}
                onClick={() => addSymptom(s)}
                style={{
                  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)",
                  borderRadius:20, padding:"5px 13px", fontSize:"0.8rem", color:"var(--text-muted)",
                  cursor:"pointer", transition:"all .2s", display:"flex", alignItems:"center", gap:6,
                }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(56,189,248,0.1)"; e.currentTarget.style.color="#38bdf8"; e.currentTarget.style.borderColor="rgba(56,189,248,0.35)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.color="var(--text-muted)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; }}
              >
                {s.label} <span style={{ fontSize:"0.7rem", color:"#38bdf8" }}>{t.add}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Quick pick */}
      {selected.length === 0 && quickSyms.length > 0 && (
        <>
          <div className="section-title">
            <span className="dot" style={{ background:"#38bdf8" }}/>
            Common symptoms — tap to select
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:20 }}>
            {quickSyms.map(s => (
              <div key={s.key}
                onClick={() => addSymptom(s)}
                style={{
                  background:"var(--surface)", border:"1px solid var(--border)",
                  borderRadius:20, padding:"6px 14px", fontSize:"0.82rem",
                  color:"var(--text-muted)", cursor:"pointer", transition:"all .2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(56,189,248,0.4)"; e.currentTarget.style.color="#38bdf8"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-muted)"; }}
              >
                {s.label}
              </div>
            ))}
          </div>
        </>
      )}

      {error && <div className="error-msg">{error}</div>}

      <button className="btn-primary" onClick={analyze} disabled={loading} style={{ marginTop:14 }}>
        {loading
          ? <span className="pulse">🔄 {t.analyzing}</span>
          : `🔬 ${t.analyze}`
        }
      </button>

      {/* Stats strip */}
      <div style={{ display:"flex", gap:20, justifyContent:"center", marginTop:28, flexWrap:"wrap" }}>
        {[["15", "Diseases"], ["42", "Symptoms"], ["3", "ML Models"], ["2", "Languages"]].map(([n, l]) => (
          <div key={l} style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1.4rem", background:"var(--grad)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{n}</div>
            <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:".07em" }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
