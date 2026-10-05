import { useState, useEffect, useRef } from "react";
import { useLang } from "../context/LangContext";

// ── Built-in rule-based fallback (works with zero configuration) ──────────────
const KB = [
  { keys: ["malaria"],
    ans: "Malaria is a life-threatening disease caused by Plasmodium parasites spread through infected Anopheles mosquito bites. Symptoms include high fever, chills, headache, muscle aches, and fatigue. It is highly treatable if caught early — seek medical care immediately if you suspect malaria." },
  { keys: ["typhoid"],
    ans: "Typhoid fever is a bacterial infection (Salmonella typhi) spread through contaminated food or water. Symptoms include sustained high fever, weakness, stomach pain, and loss of appetite. It requires antibiotic treatment — see a doctor promptly." },
  { keys: ["covid", "coronavirus"],
    ans: "COVID-19 is caused by the SARS-CoV-2 virus. Common symptoms include fever, cough, fatigue, and loss of smell or taste. Isolate immediately if you suspect infection, take a test, and seek emergency care if you have difficulty breathing." },
  { keys: ["dengue"],
    ans: "Dengue fever is a mosquito-borne viral infection causing high fever, severe headache, pain behind the eyes, joint/muscle pain, and a rash. Avoid aspirin — use paracetamol. Seek urgent medical care if symptoms worsen." },
  { keys: ["pneumonia"],
    ans: "Pneumonia is an infection inflaming the lung air sacs. Symptoms include cough with phlegm, fever, chills, and difficulty breathing. It can be serious — see a doctor immediately, especially for children or the elderly." },
  { keys: ["flu", "influenza"],
    ans: "Influenza (flu) is a contagious respiratory illness. Symptoms include sudden fever, body aches, headache, fatigue, sore throat, and cough. Rest, stay hydrated, and consider antiviral medication if caught within 48 hours." },
  { keys: ["cold", "common cold"],
    ans: "The common cold is a mild viral upper respiratory infection. Symptoms include runny nose, sore throat, sneezing, and mild cough. It usually resolves in 7–10 days with rest and fluids — no antibiotics needed." },
  { keys: ["diabetes"],
    ans: "Diabetes is a chronic condition where the body cannot properly regulate blood sugar. Key symptoms include excessive thirst, frequent urination, fatigue, and blurred vision. It requires medical management — consult a doctor for blood sugar testing." },
  { keys: ["hypertension", "blood pressure"],
    ans: "Hypertension (high blood pressure) often has no symptoms but can lead to heart disease and stroke. Diagnosed when readings are consistently above 130/80 mmHg. Lifestyle changes (diet, exercise) and medication can manage it effectively." },
  { keys: ["anemia"],
    ans: "Anemia occurs when you don't have enough healthy red blood cells. Symptoms include fatigue, dizziness, shortness of breath, and pale skin. Often caused by iron or vitamin deficiency — see a doctor for a blood test and supplements." },
  { keys: ["hepatitis", "jaundice"],
    ans: "Hepatitis is liver inflammation, often caused by viral infection. Warning signs include yellowing of skin/eyes (jaundice), dark urine, fatigue, and abdominal pain. Seek medical attention immediately — specialist care is required." },
  { keys: ["meningitis"],
    ans: "⚠ MEDICAL EMERGENCY: Meningitis signs include stiff neck, severe headache, high fever, sensitivity to light, and rash. Call emergency services (999/112) IMMEDIATELY. Do not wait — meningitis can be fatal within hours without treatment." },
  { keys: ["uti", "urinary", "painful urination"],
    ans: "A UTI (urinary tract infection) causes a burning sensation when urinating, frequent urges to urinate, cloudy or smelly urine, and sometimes fever. It requires antibiotic treatment — see a doctor for a urine test." },
  { keys: ["vaccine", "vaccination", "immunization"],
    ans: "In Kenya, key recommended vaccines include those for polio, measles, hepatitis B, typhoid, yellow fever, meningitis, and COVID-19. Visit your nearest health facility or a travel clinic for a personalized vaccination schedule." },
  { keys: ["doctor", "hospital", "when to see", "emergency"],
    ans: "See a doctor if: symptoms are severe or worsening, you've had a high fever (>39°C/102°F) for more than 2 days, you have chest pain or difficulty breathing, or you're confused or very weak. For emergencies in Nairobi call 999 or 0800 723 253." },
  { keys: ["fever"],
    ans: "A fever (temperature above 37.5°C / 99.5°F) is a sign your body is fighting an infection. Common causes include flu, malaria, typhoid, and infections. Stay hydrated, rest, and use paracetamol to reduce temperature. See a doctor if it lasts more than 2 days or exceeds 39°C." },
  { keys: ["headache"],
    ans: "Headaches have many causes including tension, dehydration, fever, sinusitis, or (rarely) more serious conditions. Drink water, rest in a dark room, and take paracetamol if needed. Seek urgent care if the headache is sudden and severe ('thunderclap'), or comes with stiff neck or fever." },
  { keys: ["cough"],
    ans: "Coughs are commonly caused by colds, flu, allergies, or asthma. Honey and warm water can soothe mild coughs. See a doctor if the cough lasts more than 3 weeks, produces blood, or comes with chest pain or shortness of breath." },
];

function getLocalReply(text, lang) {
  const q = text.toLowerCase();
  for (const entry of KB) {
    if (entry.keys.some(k => q.includes(k))) {
      const note = lang === "sw"
        ? "\n\n⚕ Kumbuka: Hii ni habari ya jumla tu. Wasiliana na daktari kwa ushauri wa kitaalamu."
        : "\n\n⚕ This is general information only — not a substitute for professional medical advice.";
      return entry.ans + note;
    }
  }
  return lang === "sw"
    ? "Samahani, sijaelewa vizuri. Jaribu kuuliza kuhusu ugonjwa maalum (mfano: 'malaria ni nini?' au 'dalili za typhoid?'). Kwa tatizo la haraka, wasiliana na daktari mara moja."
    : "I'm not sure about that. Try asking about a specific disease (e.g. 'What is malaria?' or 'symptoms of typhoid'). You can also use the symptom checker on the main screen for AI-powered analysis. For urgent concerns, please see a doctor.";
}

async function getReply(messages, lang) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ messages, lang }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.reply) return { text: data.reply, source: "ai" };
    }
  } catch {
    // backend unreachable or no API key — fall through
  }
  const lastUser = [...messages].reverse().find(m => m.role === "user");
  return { text: getLocalReply(lastUser?.content || "", lang), source: "local" };
}

function TypingDots() {
  return (
    <div style={{ display:"flex", gap:4, padding:"4px 0" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width:7, height:7, borderRadius:"50%", background:"#38bdf8",
          display:"inline-block",
          animation:`cb 1.2s infinite ${i*0.2}s`,
        }}/>
      ))}
      <style>{`@keyframes cb{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}

export default function Chatbot({ onClose }) {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState([
    { role:"assistant", content:t.chatGreeting }
  ]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [usingLocal, setUsingLocal] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { role:"user", content:text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    const apiMsgs = updated.map(m => ({ role:m.role, content:m.content }));
    const { text:reply, source } = await getReply(apiMsgs, lang);
    if (source === "local") setUsingLocal(true);
    setMessages(prev => [...prev, { role:"assistant", content:reply }]);
    setLoading(false);
  };

  const QUICK = ["What is malaria?","Symptoms of typhoid?","When to see a doctor?","What vaccines do I need?"];

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.65)",
      backdropFilter:"blur(4px)", zIndex:200,
      display:"flex", alignItems:"flex-end", justifyContent:"flex-end", padding:24,
    }}>
      <div style={{
        width:"100%", maxWidth:440, height:"84vh", maxHeight:660,
        background:"#0d1528", border:"1px solid rgba(56,189,248,0.2)",
        borderRadius:20, display:"flex", flexDirection:"column",
        boxShadow:"0 30px 80px rgba(0,0,0,0.7)",
      }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#0ea5e9,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🤖</div>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"0.95rem", color:"#e2e8f0" }}>{t.chat}</div>
              <div style={{ fontSize:"0.7rem", color: usingLocal ? "#f59e0b" : "#22c55e" }}>
                ● {usingLocal ? "Offline mode" : "Online"}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#64748b", fontSize:"1.5rem", cursor:"pointer" }}>×</button>
        </div>

        {/* Offline banner */}
        {usingLocal && (
          <div style={{
            margin:"10px 14px 0", background:"rgba(245,158,11,0.08)",
            border:"1px solid rgba(245,158,11,0.25)", borderRadius:8,
            padding:"8px 12px", fontSize:"0.74rem", color:"#fbbf24", lineHeight:1.5, flexShrink:0,
          }}>
            💡 Using built-in knowledge base. For full AI chat, add <strong>ANTHROPIC_API_KEY</strong> to <strong>backend/.env</strong> and restart Flask.
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex:1, overflowY:"auto", padding:"14px 14px 8px",
          display:"flex", flexDirection:"column", gap:10,
          scrollbarWidth:"thin", scrollbarColor:"rgba(56,189,248,0.15) transparent",
        }}>
          {messages.map((m,i) => (
            <div key={i} style={{ alignSelf:m.role==="user"?"flex-end":"flex-start", maxWidth:"86%" }}>
              <div style={{
                background: m.role==="user" ? "linear-gradient(135deg,rgba(14,165,233,0.22),rgba(99,102,241,0.22))" : "rgba(255,255,255,0.05)",
                border: m.role==="user" ? "1px solid rgba(56,189,248,0.28)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: m.role==="user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                padding:"11px 15px", fontSize:"0.86rem",
                color: m.role==="user" ? "#e2e8f0" : "#cbd5e1",
                lineHeight:1.6, whiteSpace:"pre-wrap",
              }}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf:"flex-start" }}>
              <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"14px 14px 14px 4px", padding:"12px 16px" }}>
                <TypingDots/>
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div style={{ padding:"0 12px 8px", display:"flex", flexWrap:"wrap", gap:6, flexShrink:0 }}>
            {QUICK.map((p,i) => (
              <button key={i} onClick={() => setInput(p)} style={{
                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:10, padding:"5px 11px", fontSize:"0.74rem", color:"#64748b",
                cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .18s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(56,189,248,0.4)"; e.currentTarget.style.color="#38bdf8"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.color="#64748b"; }}
              >{p}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ display:"flex", gap:8, padding:"12px 14px 16px", borderTop:"1px solid rgba(255,255,255,0.07)", flexShrink:0 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
            placeholder={t.chatPlaceholder}
            style={{
              flex:1, background:"rgba(255,255,255,0.05)",
              border:"1.5px solid rgba(255,255,255,0.1)", borderRadius:11,
              padding:"11px 14px", color:"#e2e8f0", fontSize:"0.88rem",
              fontFamily:"'DM Sans',sans-serif", outline:"none", transition:"border-color .2s",
            }}
            onFocus={e => { e.currentTarget.style.borderColor="rgba(56,189,248,0.5)"; }}
            onBlur={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; }}
          />
          <button onClick={send} disabled={loading||!input.trim()} style={{
            background:"linear-gradient(135deg,#0ea5e9,#6366f1)", border:"none",
            borderRadius:11, padding:"11px 18px", color:"#fff",
            cursor:loading||!input.trim()?"not-allowed":"pointer",
            fontWeight:700, fontSize:"0.95rem",
            opacity:loading||!input.trim()?0.5:1, transition:"opacity .2s",
          }}>➤</button>
        </div>
      </div>
    </div>
  );
}
