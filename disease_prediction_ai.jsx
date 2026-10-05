import { useState, useEffect, useRef } from "react";

// ─── TRANSLATIONS ────────────────────────────────────────────────────────────
const T = {
  en: {
    appName: "MedSense AI",
    tagline: "Intelligent Symptom Analysis",
    disclaimer: "⚠ For informational purposes only. Not a substitute for professional medical advice.",
    searchPlaceholder: "Search symptoms (e.g. headache, fever...)",
    selectedSymptoms: "Selected Symptoms",
    clearAll: "Clear All",
    analyze: "Analyze Symptoms",
    analyzing: "Analyzing...",
    results: "Diagnosis Results",
    confidence: "Confidence",
    severity: "Severity",
    relatedSymptoms: "Related Symptoms",
    suggestedAction: "Suggested Action",
    hospitals: "Nearby Hospitals",
    history: "Session History",
    chat: "AI Assistant",
    chatPlaceholder: "Ask about your symptoms...",
    send: "Send",
    backHome: "← New Analysis",
    mild: "Mild",
    moderate: "Moderate",
    severe: "Severe",
    critical: "Critical",
    noSymptoms: "Please select at least one symptom.",
    lang: "Swahili",
    topDiseases: "Top Predicted Conditions",
    whyThese: "Why these results?",
    suggestions: "Smart Suggestions",
    addSymptom: "Add",
    remove: "×",
    chatGreeting: "Hello! I'm MedSense AI. Describe your symptoms or ask me anything about health.",
  },
  sw: {
    appName: "MedSense AI",
    tagline: "Uchambuzi wa Dalili kwa Akili Bandia",
    disclaimer: "⚠ Kwa madhumuni ya habari tu. Si mbadala wa ushauri wa daktari.",
    searchPlaceholder: "Tafuta dalili (mfano: maumivu ya kichwa, homa...)",
    selectedSymptoms: "Dalili Zilizochaguliwa",
    clearAll: "Futa Zote",
    analyze: "Changanua Dalili",
    analyzing: "Inachunguza...",
    results: "Matokeo ya Uchunguzi",
    confidence: "Uhakika",
    severity: "Ukali",
    relatedSymptoms: "Dalili Zinazohusiana",
    suggestedAction: "Hatua Inayopendekezwa",
    hospitals: "Hospitali Zilizo Karibu",
    history: "Historia ya Kipindi",
    chat: "Msaidizi wa AI",
    chatPlaceholder: "Uliza kuhusu dalili zako...",
    send: "Tuma",
    backHome: "← Uchambuzi Mpya",
    mild: "Ndogo",
    moderate: "Wastani",
    severe: "Kali",
    critical: "Hatari",
    noSymptoms: "Tafadhali chagua dalili moja angalau.",
    lang: "English",
    topDiseases: "Magonjwa Yanayowezekana Zaidi",
    whyThese: "Kwa nini matokeo haya?",
    suggestions: "Mapendekezo ya Dalili",
    addSymptom: "Ongeza",
    remove: "×",
    chatGreeting: "Habari! Mimi ni MedSense AI. Elezea dalili zako au niulize swali lolote kuhusu afya.",
  },
};

// ─── SYMPTOM DATABASE ────────────────────────────────────────────────────────
const SYMPTOMS = [
  "Fever","Headache","Cough","Fatigue","Sore throat","Runny nose","Body aches",
  "Shortness of breath","Chest pain","Nausea","Vomiting","Diarrhea","Abdominal pain",
  "Loss of appetite","Chills","Night sweats","Rash","Swollen lymph nodes","Joint pain",
  "Back pain","Dizziness","Confusion","Muscle weakness","Blurred vision","Ear pain",
  "Toothache","Itching","Yellowing of skin","Dark urine","Excessive thirst",
  "Frequent urination","Weight loss","Weight gain","Palpitations","Swollen feet",
  "Difficulty swallowing","Heartburn","Bloating","Constipation","Blood in stool",
  "Painful urination","Discharge","Genital sores","Stiff neck","Sensitivity to light",
];

// ─── HOSPITALS ────────────────────────────────────────────────────────────────
const HOSPITALS = [
  { name: "Kenyatta National Hospital", dist: "2.1 km", type: "Public", rating: 4.1 },
  { name: "Nairobi Hospital", dist: "3.4 km", type: "Private", rating: 4.6 },
  { name: "Aga Khan University Hospital", dist: "4.8 km", type: "Private", rating: 4.7 },
  { name: "MP Shah Hospital", dist: "5.2 km", type: "Private", rating: 4.4 },
  { name: "Karen Hospital", dist: "8.0 km", type: "Private", rating: 4.5 },
];

const SEV_COLOR = { Mild: "#22c55e", Moderate: "#f59e0b", Severe: "#ef4444", Critical: "#7c3aed" };
const SEV_BG   = { Mild: "#f0fdf4", Moderate: "#fffbeb", Severe: "#fef2f2", Critical: "#f5f3ff" };

// ─── ANTHROPIC API CALL ───────────────────────────────────────────────────────
async function callClaude(messages, system) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages,
    }),
  });
  const data = await res.json();
  return data.content?.find(b => b.type === "text")?.text || "";
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("en");
  const t = T[lang];
  const [view, setView] = useState("home"); // home | results | chat
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("results"); // results | hospitals | history
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (view === "chat" && chatMsgs.length === 0) {
      setChatMsgs([{ role: "assistant", content: t.chatGreeting }]);
    }
  }, [view]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  // Symptom search filter
  const filtered = query.length > 0
    ? SYMPTOMS.filter(s => s.toLowerCase().includes(query.toLowerCase()) && !selected.includes(s))
    : [];

  // Smart suggestions based on selected
  useEffect(() => {
    if (selected.length === 0) { setSuggestions([]); return; }
    const related = {
      "Fever": ["Chills","Headache","Body aches","Fatigue"],
      "Headache": ["Nausea","Sensitivity to light","Blurred vision","Dizziness"],
      "Cough": ["Sore throat","Shortness of breath","Chest pain","Runny nose"],
      "Fatigue": ["Body aches","Joint pain","Night sweats","Weight loss"],
      "Nausea": ["Vomiting","Abdominal pain","Diarrhea","Loss of appetite"],
      "Abdominal pain": ["Nausea","Bloating","Diarrhea","Constipation"],
      "Chest pain": ["Shortness of breath","Palpitations","Dizziness","Fatigue"],
      "Rash": ["Itching","Fever","Swollen lymph nodes"],
    };
    const pool = new Set();
    selected.forEach(s => (related[s] || []).forEach(r => { if (!selected.includes(r)) pool.add(r); }));
    setSuggestions([...pool].slice(0, 6));
  }, [selected]);

  const toggleSymptom = (s) => {
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    setQuery("");
  };

  // ─── ANALYZE ──────────────────────────────────────────────────────────────
  const analyze = async () => {
    if (selected.length === 0) { setError(t.noSymptoms); return; }
    setError("");
    setLoading(true);
    try {
      const system = `You are a medical AI assistant. When given symptoms, respond ONLY with a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "diseases": [
    {
      "name": "Disease Name",
      "confidence": 85,
      "severity": "Moderate",
      "explanation": "Brief explanation linking symptoms to this condition (2-3 sentences).",
      "suggestedAction": "What the patient should do",
      "relatedSymptoms": ["symptom1", "symptom2"]
    }
  ],
  "overallSeverity": "Moderate",
  "summary": "Brief 1-sentence overall assessment.",
  "disclaimer": "This is not medical advice."
}
Rules:
- List 3-5 most likely diseases, ordered by confidence (highest first)
- confidence is integer 0-100
- severity is one of: Mild, Moderate, Severe, Critical
- overallSeverity is based on the most serious condition
- Keep explanations clear and patient-friendly
- Response language: ${lang === "sw" ? "Swahili" : "English"}`;

      const raw = await callClaude(
        [{ role: "user", content: `Patient symptoms: ${selected.join(", ")}` }],
        system
      );
      const json = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setResults(json);
      setHistory(prev => [{ symptoms: [...selected], result: json, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
      setView("results");
      setActiveTab("results");
    } catch (e) {
      setError("Analysis failed. Please try again.");
    }
    setLoading(false);
  };

  // ─── CHAT ─────────────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput };
    setChatMsgs(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);
    try {
      const system = `You are MedSense AI, a helpful and empathetic medical information assistant. You help users understand symptoms, diseases, and general health topics. Always remind users that you are not a substitute for professional medical advice. Be concise (3-5 sentences max). Respond in ${lang === "sw" ? "Swahili" : "English"}.`;
      const history = [...chatMsgs, userMsg].map(m => ({ role: m.role, content: m.content }));
      const reply = await callClaude(history, system);
      setChatMsgs(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setChatMsgs(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    }
    setChatLoading(false);
  };

  const sevColor = (s) => SEV_COLOR[s] || "#6b7280";
  const sevBg    = (s) => SEV_BG[s]   || "#f9fafb";

  // ═══════════════════════════════════════════════════════════════════════════
  // STYLES
  // ═══════════════════════════════════════════════════════════════════════════
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: #0a0f1e; color: #e2e8f0; min-height: 100vh; }
    
    .app { min-height: 100vh; background: linear-gradient(135deg, #0a0f1e 0%, #0d1a2e 50%, #0a1628 100%); position: relative; overflow-x: hidden; }
    
    /* Grid bg */
    .app::before { content: ''; position: fixed; inset: 0; background-image: linear-gradient(rgba(56,189,248,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.04) 1px, transparent 1px); background-size: 40px 40px; pointer-events: none; z-index: 0; }
    
    .container { max-width: 900px; margin: 0 auto; padding: 0 20px; position: relative; z-index: 1; }
    
    /* HEADER */
    .header { display: flex; align-items: center; justify-content: space-between; padding: 20px 0 16px; border-bottom: 1px solid rgba(56,189,248,.12); }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon { width: 38px; height: 38px; background: linear-gradient(135deg, #0ea5e9, #6366f1); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .logo-text { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.3rem; background: linear-gradient(90deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .header-right { display: flex; gap: 10px; align-items: center; }
    .btn-ghost { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); color: #94a3b8; padding: 7px 14px; border-radius: 8px; cursor: pointer; font-size: 0.82rem; font-family: 'DM Sans', sans-serif; transition: all .2s; }
    .btn-ghost:hover { background: rgba(255,255,255,.1); color: #e2e8f0; }
    .btn-ghost.active { background: rgba(56,189,248,.15); border-color: rgba(56,189,248,.4); color: #38bdf8; }

    /* DISCLAIMER */
    .disclaimer { background: rgba(234,179,8,.08); border: 1px solid rgba(234,179,8,.25); border-radius: 10px; padding: 10px 16px; font-size: 0.78rem; color: #fbbf24; margin: 16px 0; }

    /* HERO */
    .hero { text-align: center; padding: 48px 0 32px; }
    .hero h1 { font-family: 'Syne', sans-serif; font-size: 2.8rem; font-weight: 800; background: linear-gradient(135deg, #e2e8f0 0%, #38bdf8 50%, #818cf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.1; margin-bottom: 12px; }
    .hero p { color: #64748b; font-size: 1rem; }
    
    /* SEARCH */
    .search-wrap { position: relative; margin-bottom: 20px; }
    .search-input { width: 100%; background: rgba(255,255,255,.05); border: 1.5px solid rgba(56,189,248,.2); border-radius: 14px; padding: 15px 20px; font-size: 1rem; color: #e2e8f0; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color .2s; }
    .search-input:focus { border-color: rgba(56,189,248,.6); background: rgba(255,255,255,.07); }
    .search-input::placeholder { color: #475569; }
    .dropdown { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #111827; border: 1px solid rgba(56,189,248,.25); border-radius: 12px; max-height: 220px; overflow-y: auto; z-index: 50; box-shadow: 0 20px 40px rgba(0,0,0,.5); }
    .dropdown-item { padding: 11px 18px; cursor: pointer; font-size: 0.9rem; color: #94a3b8; transition: all .15s; }
    .dropdown-item:hover { background: rgba(56,189,248,.1); color: #38bdf8; }
    
    /* CHIPS */
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; min-height: 36px; }
    .chip { display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, rgba(56,189,248,.15), rgba(99,102,241,.15)); border: 1px solid rgba(56,189,248,.35); border-radius: 20px; padding: 5px 12px 5px 14px; font-size: 0.83rem; color: #7dd3fc; animation: pop .2s ease; }
    @keyframes pop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .chip-remove { cursor: pointer; color: #475569; font-size: 1rem; line-height: 1; transition: color .15s; }
    .chip-remove:hover { color: #ef4444; }
    
    /* SUGGESTIONS */
    .suggest-label { font-size: 0.75rem; color: #475569; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; font-weight: 600; }
    .suggest-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 20px; }
    .suggest-chip { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 20px; padding: 5px 12px; font-size: 0.8rem; color: #64748b; cursor: pointer; transition: all .2s; display: flex; align-items: center; gap: 5px; }
    .suggest-chip:hover { background: rgba(56,189,248,.1); border-color: rgba(56,189,248,.3); color: #38bdf8; }
    .suggest-chip span { font-size: 0.7rem; color: #38bdf8; }
    
    /* ANALYZE BTN */
    .btn-primary { width: 100%; background: linear-gradient(135deg, #0ea5e9, #6366f1); border: none; border-radius: 14px; padding: 16px; font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 700; color: #fff; cursor: pointer; transition: all .25s; letter-spacing: .02em; position: relative; overflow: hidden; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(14,165,233,.35); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary .pulse { display: inline-block; animation: pulse 1s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
    .error-msg { color: #f87171; font-size: 0.85rem; margin-top: 8px; }

    /* TABS */
    .tabs { display: flex; gap: 4px; background: rgba(255,255,255,.04); border-radius: 12px; padding: 4px; margin-bottom: 20px; }
    .tab { flex: 1; padding: 9px; text-align: center; border-radius: 9px; cursor: pointer; font-size: 0.85rem; color: #64748b; transition: all .2s; border: none; background: none; font-family: 'DM Sans', sans-serif; }
    .tab.active { background: rgba(56,189,248,.15); color: #38bdf8; font-weight: 600; }

    /* RESULTS */
    .back-btn { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); color: #94a3b8; padding: 8px 16px; border-radius: 9px; cursor: pointer; font-size: 0.85rem; margin-bottom: 20px; display: inline-flex; align-items: center; gap: 6px; transition: all .2s; font-family: 'DM Sans', sans-serif; }
    .back-btn:hover { background: rgba(255,255,255,.08); color: #e2e8f0; }
    
    .overall-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 20px 24px; margin-bottom: 20px; }
    .overall-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .sev-badge { padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; letter-spacing: .05em; }
    .summary-text { color: #94a3b8; font-size: 0.9rem; margin-top: 10px; line-height: 1.5; }
    
    .disease-card { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 20px; margin-bottom: 14px; transition: border-color .2s; }
    .disease-card:hover { border-color: rgba(56,189,248,.25); }
    .disease-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
    .disease-name { font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 700; color: #e2e8f0; }
    .disease-badges { display: flex; gap: 8px; flex-shrink: 0; }
    .small-badge { font-size: 0.72rem; padding: 3px 10px; border-radius: 12px; font-weight: 600; }
    
    .conf-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .conf-label { font-size: 0.75rem; color: #475569; width: 80px; flex-shrink: 0; text-transform: uppercase; letter-spacing: .06em; }
    .conf-bar-wrap { flex: 1; height: 7px; background: rgba(255,255,255,.07); border-radius: 4px; overflow: hidden; }
    .conf-bar { height: 100%; border-radius: 4px; transition: width 1s ease; }
    .conf-pct { font-size: 0.82rem; color: #38bdf8; font-weight: 700; width: 36px; text-align: right; flex-shrink: 0; }
    
    .explanation { font-size: 0.85rem; color: #64748b; line-height: 1.6; margin-bottom: 12px; }
    .action-box { background: rgba(56,189,248,.07); border-left: 3px solid #0ea5e9; border-radius: 0 8px 8px 0; padding: 10px 14px; font-size: 0.83rem; color: #7dd3fc; }
    
    .rel-symptoms { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .rel-chip { background: rgba(99,102,241,.1); border: 1px solid rgba(99,102,241,.25); border-radius: 10px; padding: 3px 10px; font-size: 0.75rem; color: #a5b4fc; }

    /* HOSPITALS */
    .hosp-card { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); border-radius: 14px; padding: 16px 20px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .hosp-name { font-weight: 600; color: #e2e8f0; font-size: 0.9rem; }
    .hosp-meta { display: flex; gap: 12px; align-items: center; margin-top: 4px; }
    .hosp-tag { font-size: 0.75rem; color: #64748b; }
    .hosp-dist { font-size: 0.9rem; color: #38bdf8; font-weight: 700; }
    .stars { color: #fbbf24; font-size: 0.8rem; }

    /* HISTORY */
    .hist-card { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07); border-radius: 12px; padding: 14px 18px; margin-bottom: 10px; cursor: pointer; transition: all .2s; }
    .hist-card:hover { border-color: rgba(56,189,248,.3); background: rgba(56,189,248,.05); }
    .hist-time { font-size: 0.72rem; color: #475569; margin-bottom: 6px; }
    .hist-syms { display: flex; flex-wrap: wrap; gap: 5px; }
    .hist-chip { background: rgba(255,255,255,.05); border-radius: 8px; padding: 2px 8px; font-size: 0.72rem; color: #64748b; }

    /* CHAT */
    .chat-wrap { display: flex; flex-direction: column; height: calc(100vh - 200px); max-height: 600px; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 16px 0; display: flex; flex-direction: column; gap: 12px; scrollbar-width: thin; scrollbar-color: rgba(56,189,248,.2) transparent; }
    .chat-bubble { max-width: 78%; padding: 12px 16px; border-radius: 14px; font-size: 0.88rem; line-height: 1.55; animation: fadeUp .25s ease; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .chat-bubble.user { align-self: flex-end; background: linear-gradient(135deg, rgba(14,165,233,.25), rgba(99,102,241,.25)); border: 1px solid rgba(56,189,248,.25); color: #e2e8f0; border-radius: 14px 14px 4px 14px; }
    .chat-bubble.assistant { align-self: flex-start; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); color: #cbd5e1; border-radius: 14px 14px 14px 4px; }
    .typing-dot { display: inline-block; width: 7px; height: 7px; background: #38bdf8; border-radius: 50%; margin: 0 2px; animation: bounce 1.2s infinite; }
    .typing-dot:nth-child(2) { animation-delay: .2s; }
    .typing-dot:nth-child(3) { animation-delay: .4s; }
    @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
    .chat-input-row { display: flex; gap: 10px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,.07); }
    .chat-input { flex: 1; background: rgba(255,255,255,.05); border: 1.5px solid rgba(255,255,255,.1); border-radius: 12px; padding: 12px 16px; color: #e2e8f0; font-size: 0.9rem; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color .2s; }
    .chat-input:focus { border-color: rgba(56,189,248,.5); }
    .chat-input::placeholder { color: #374151; }
    .btn-send { background: linear-gradient(135deg, #0ea5e9, #6366f1); border: none; border-radius: 12px; padding: 12px 18px; color: #fff; cursor: pointer; font-weight: 700; font-size: 0.9rem; transition: all .2s; font-family: 'DM Sans', sans-serif; }
    .btn-send:hover:not(:disabled) { transform: scale(1.04); }
    .btn-send:disabled { opacity: 0.5; cursor: not-allowed; }

    /* FLOATING CHAT BTN */
    .float-chat { position: fixed; bottom: 28px; right: 28px; background: linear-gradient(135deg, #0ea5e9, #6366f1); border: none; border-radius: 50%; width: 54px; height: 54px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 8px 24px rgba(14,165,233,.4); font-size: 22px; z-index: 100; transition: transform .2s; }
    .float-chat:hover { transform: scale(1.1); }

    .section-title { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: #94a3b8; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

    @media (max-width: 600px) {
      .hero h1 { font-size: 2rem; }
      .disease-top { flex-direction: column; }
    }
  `;

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="container">

          {/* HEADER */}
          <div className="header">
            <div className="logo">
              <div className="logo-icon">🩺</div>
              <span className="logo-text">{t.appName}</span>
            </div>
            <div className="header-right">
              <button className={`btn-ghost${view === "chat" ? " active" : ""}`} onClick={() => setView(view === "chat" ? (results ? "results" : "home") : "chat")}>
                💬 {t.chat}
              </button>
              <button className="btn-ghost" onClick={() => setLang(lang === "en" ? "sw" : "en")}>
                🌐 {t.lang}
              </button>
            </div>
          </div>

          {/* DISCLAIMER */}
          <div className="disclaimer">{t.disclaimer}</div>

          {/* ── CHAT VIEW ──────────────────────────────────────────────────── */}
          {view === "chat" && (
            <div>
              <button className="back-btn" onClick={() => setView(results ? "results" : "home")}>
                {t.backHome}
              </button>
              <div className="section-title"><span className="dot" style={{background:"#38bdf8"}}/>💬 {t.chat}</div>
              <div className="chat-wrap">
                <div className="chat-messages">
                  {chatMsgs.map((m, i) => (
                    <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>
                  ))}
                  {chatLoading && (
                    <div className="chat-bubble assistant">
                      <span className="typing-dot"/>
                      <span className="typing-dot"/>
                      <span className="typing-dot"/>
                    </div>
                  )}
                  <div ref={chatEndRef}/>
                </div>
                <div className="chat-input-row">
                  <input
                    className="chat-input"
                    placeholder={t.chatPlaceholder}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                  />
                  <button className="btn-send" onClick={sendChat} disabled={chatLoading}>
                    {t.send}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── HOME VIEW ──────────────────────────────────────────────────── */}
          {view === "home" && (
            <div>
              <div className="hero">
                <h1>{t.tagline}</h1>
                <p>AI-powered symptom analysis. Instant, clear, multilingual.</p>
              </div>

              {/* SEARCH */}
              <div className="search-wrap">
                <input
                  className="search-input"
                  placeholder={t.searchPlaceholder}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {filtered.length > 0 && (
                  <div className="dropdown">
                    {filtered.map(s => (
                      <div key={s} className="dropdown-item" onClick={() => toggleSymptom(s)}>+ {s}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* SELECTED CHIPS */}
              {selected.length > 0 && (
                <>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:"0.75rem",color:"#475569",textTransform:"uppercase",letterSpacing:".08em",fontWeight:600}}>{t.selectedSymptoms} ({selected.length})</span>
                    <button className="btn-ghost" style={{padding:"4px 10px",fontSize:"0.75rem"}} onClick={() => setSelected([])}>{t.clearAll}</button>
                  </div>
                  <div className="chips">
                    {selected.map(s => (
                      <span key={s} className="chip">
                        {s} <span className="chip-remove" onClick={() => toggleSymptom(s)}>{t.remove}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* SMART SUGGESTIONS */}
              {suggestions.length > 0 && (
                <>
                  <div className="suggest-label">💡 {t.suggestions}</div>
                  <div className="suggest-chips">
                    {suggestions.map(s => (
                      <div key={s} className="suggest-chip" onClick={() => toggleSymptom(s)}>
                        {s} <span>+ {t.addSymptom}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* QUICK SELECT */}
              {selected.length === 0 && (
                <>
                  <div className="suggest-label" style={{marginTop:8}}>Common symptoms</div>
                  <div className="suggest-chips">
                    {["Fever","Headache","Cough","Fatigue","Nausea","Rash","Chest pain","Dizziness"].map(s => (
                      <div key={s} className="suggest-chip" onClick={() => toggleSymptom(s)}>{s}</div>
                    ))}
                  </div>
                </>
              )}

              {error && <div className="error-msg">{error}</div>}

              <button className="btn-primary" onClick={analyze} disabled={loading} style={{marginTop:12}}>
                {loading ? <span className="pulse">{t.analyzing}</span> : `🔬 ${t.analyze}`}
              </button>
            </div>
          )}

          {/* ── RESULTS VIEW ───────────────────────────────────────────────── */}
          {view === "results" && results && (
            <div style={{paddingBottom:80}}>
              <button className="back-btn" onClick={() => { setView("home"); setResults(null); setSelected([]); }}>
                {t.backHome}
              </button>

              {/* OVERALL */}
              <div className="overall-card">
                <div className="overall-row">
                  <div>
                    <div style={{fontSize:"0.72rem",color:"#475569",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>{t.results}</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"1.1rem",color:"#e2e8f0"}}>{selected.join(" · ")}</div>
                  </div>
                  <div>
                    <div style={{fontSize:"0.72rem",color:"#475569",textTransform:"uppercase",marginBottom:4}}>{t.severity}</div>
                    <span className="sev-badge" style={{background:sevBg(results.overallSeverity),color:sevColor(results.overallSeverity)}}>
                      {results.overallSeverity}
                    </span>
                  </div>
                </div>
                {results.summary && <div className="summary-text">{results.summary}</div>}
              </div>

              {/* TABS */}
              <div className="tabs">
                {["results","hospitals","history"].map(tab => (
                  <button key={tab} className={`tab${activeTab===tab?" active":""}`} onClick={() => setActiveTab(tab)}>
                    {tab==="results" ? `🩺 ${t.topDiseases}` : tab==="hospitals" ? `🏥 ${t.hospitals}` : `📋 ${t.history}`}
                  </button>
                ))}
              </div>

              {/* DISEASE RESULTS */}
              {activeTab === "results" && (
                <div>
                  {results.diseases.map((d, i) => (
                    <div key={i} className="disease-card">
                      <div className="disease-top">
                        <div>
                          <div className="disease-name">{i+1}. {d.name}</div>
                        </div>
                        <div className="disease-badges">
                          <span className="small-badge" style={{background:sevBg(d.severity),color:sevColor(d.severity)}}>
                            {d.severity}
                          </span>
                        </div>
                      </div>

                      <div className="conf-row">
                        <span className="conf-label">{t.confidence}</span>
                        <div className="conf-bar-wrap">
                          <div className="conf-bar" style={{
                            width: `${d.confidence}%`,
                            background: d.confidence >= 75 ? "linear-gradient(90deg,#0ea5e9,#6366f1)" :
                                        d.confidence >= 50 ? "linear-gradient(90deg,#f59e0b,#f97316)" :
                                        "linear-gradient(90deg,#64748b,#475569)"
                          }}/>
                        </div>
                        <span className="conf-pct">{d.confidence}%</span>
                      </div>

                      <p className="explanation">📖 {d.explanation}</p>

                      {d.suggestedAction && (
                        <div className="action-box">💊 <strong>{t.suggestedAction}:</strong> {d.suggestedAction}</div>
                      )}

                      {d.relatedSymptoms?.length > 0 && (
                        <div className="rel-symptoms">
                          {d.relatedSymptoms.map((s,j) => <span key={j} className="rel-chip">{s}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* HOSPITALS */}
              {activeTab === "hospitals" && (
                <div>
                  <div className="section-title"><span className="dot" style={{background:"#22c55e"}}/>🏥 {t.hospitals}</div>
                  {HOSPITALS.map((h, i) => (
                    <div key={i} className="hosp-card">
                      <div>
                        <div className="hosp-name">{h.name}</div>
                        <div className="hosp-meta">
                          <span className="hosp-tag">{h.type}</span>
                          <span className="stars">{"★".repeat(Math.round(h.rating))}{"☆".repeat(5-Math.round(h.rating))}</span>
                          <span className="hosp-tag">{h.rating}</span>
                        </div>
                      </div>
                      <div className="hosp-dist">📍 {h.dist}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* HISTORY */}
              {activeTab === "history" && (
                <div>
                  <div className="section-title"><span className="dot" style={{background:"#818cf8"}}/>📋 {t.history}</div>
                  {history.length === 0 && <div style={{color:"#475569",fontSize:"0.85rem"}}>No history yet.</div>}
                  {history.map((h, i) => (
                    <div key={i} className="hist-card" onClick={() => { setResults(h.result); setSelected(h.symptoms); setActiveTab("results"); }}>
                      <div className="hist-time">🕐 {h.time} — {h.result?.overallSeverity}</div>
                      <div className="hist-syms">
                        {h.symptoms.map((s,j) => <span key={j} className="hist-chip">{s}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* FLOATING CHAT BUTTON (home/results only) */}
        {view !== "chat" && (
          <button className="float-chat" onClick={() => setView("chat")} title="Chat with AI">
            💬
          </button>
        )}
      </div>
    </>
  );
}
