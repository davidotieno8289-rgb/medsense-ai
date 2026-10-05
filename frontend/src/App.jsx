import { useState, useEffect } from "react";
import { LangProvider, useLang } from "./context/LangContext";
import SymptomInput from "./components/SymptomInput";
import Results      from "./components/Results";
import Chatbot      from "./components/Chatbot";
import Hospitals    from "./components/Hospitals";
import History      from "./components/History";
import { checkHealth } from "./api/client";

// ─── Server status banner ─────────────────────────────────────────────────────
function StatusBar({ status }) {
  if (status === "ok") return null;
  return (
    <div style={{
      background: status === "loading" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
      border: `1px solid ${status === "loading" ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}`,
      borderRadius:8, padding:"8px 14px", marginBottom:12,
      fontSize:"0.8rem",
      color: status === "loading" ? "#fbbf24" : "#f87171",
      display:"flex", alignItems:"center", gap:8,
    }}>
      <span className="status-dot" style={{
        background: status === "loading" ? "#f59e0b" : "#ef4444",
        animation: status === "loading" ? "pulse 1s infinite" : "none",
      }}/>
      {status === "loading"
        ? "Connecting to MedSense AI backend…"
        : "⚠ Backend offline. Run: python app.py in /backend"}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ activeTab, setActiveTab, serverStatus }) {
  const { t, toggle } = useLang();

  const tabs = [
    { key:"home",      label:`🔬 Analyze`   },
    { key:"hospitals", label:`🏥 Hospitals`  },
    { key:"history",   label:`📋 History`    },
  ];

  return (
    <div className="header">
      <div className="logo" onClick={() => setActiveTab("home")}>
        <div className="logo-icon">🩺</div>
        <span className="logo-text">{t.appName}</span>
      </div>
      <div className="header-actions">
        {/* Server dot */}
        <span className={`status-dot ${serverStatus}`} title={`Server: ${serverStatus}`}/>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`btn btn-ghost${activeTab === tab.key ? " active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
            style={{ display: window.innerWidth < 480 && tab.key === "history" ? "none" : undefined }}
          >
            {tab.label}
          </button>
        ))}
        <button className="btn btn-ghost" onClick={toggle}>🌐 {t.langToggle}</button>
      </div>
    </div>
  );
}

// ─── Inner app (has access to lang context) ───────────────────────────────────
function InnerApp() {
  const { t } = useLang();
  const [activeTab,    setActiveTab]    = useState("home");
  const [result,       setResult]       = useState(null);
  const [symptoms,     setSymptoms]     = useState([]);
  const [showChat,     setShowChat]     = useState(false);
  const [serverStatus, setServerStatus] = useState("loading");

  // Health check
  useEffect(() => {
    checkHealth()
      .then(r => setServerStatus(r.data?.status === "ok" ? "ok" : "error"))
      .catch(() => setServerStatus("error"));
  }, []);

  const handleResult = (data, syms) => {
    setResult(data);
    setSymptoms(syms);
    setActiveTab("results");
  };

  const handleBack = () => {
    setResult(null);
    setSymptoms([]);
    setActiveTab("home");
  };

  const handleRestoreHistory = (record) => {
    if (record.full_result) {
      setResult(record.full_result);
      setSymptoms((record.symptoms || []).map(s => ({
        key:   s,
        label: s.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase()),
      })));
      setActiveTab("results");
    }
  };

  return (
    <div className="page">
      <div className="container">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          serverStatus={serverStatus}
        />

        <div className="disclaimer">{t.disclaimer}</div>
        <StatusBar status={serverStatus}/>

        {/* Views */}
        {activeTab === "home"      && <SymptomInput onResult={handleResult}/>}
        {activeTab === "results"   && result && (
          <Results result={result} symptoms={symptoms} onBack={handleBack}/>
        )}
        {activeTab === "results"   && !result && <SymptomInput onResult={handleResult}/>}
        {activeTab === "hospitals" && <Hospitals/>}
        {activeTab === "history"   && <History onRestore={handleRestoreHistory}/>}
      </div>

      {/* Floating chat button */}
      {!showChat && (
        <button className="float-chat-btn" onClick={() => setShowChat(true)} title={t.chat}>
          💬
        </button>
      )}

      {/* Chatbot modal */}
      {showChat && <Chatbot onClose={() => setShowChat(false)}/>}
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <InnerApp/>
    </LangProvider>
  );
}
