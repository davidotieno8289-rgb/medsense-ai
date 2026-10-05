import { createContext, useContext, useState } from "react";

export const translations = {
  en: {
    appName:          "MedSense AI",
    tagline:          "Intelligent Symptom Analysis",
    disclaimer:       "⚠ For informational purposes only. Not a substitute for professional medical advice.",
    searchPlaceholder:"Search symptoms (e.g. fever, headache...)",
    selectedSymptoms: "Selected Symptoms",
    clearAll:         "Clear All",
    analyze:          "Analyze Symptoms",
    analyzing:        "Analyzing...",
    results:          "Diagnosis Results",
    confidence:       "Confidence",
    severity:         "Severity",
    relatedSymptoms:  "Related Symptoms",
    suggestedAction:  "Suggested Action",
    hospitals:        "Nearby Hospitals",
    history:          "History",
    chat:             "AI Assistant",
    chatPlaceholder:  "Ask about your symptoms...",
    send:             "Send",
    newAnalysis:      "← New Analysis",
    mild:             "Mild",
    moderate:         "Moderate",
    severe:           "Severe",
    critical:         "Critical",
    noSymptoms:       "Please select at least one symptom.",
    langToggle:       "Swahili",
    topConditions:    "Top Predicted Conditions",
    suggestions:      "Smart Suggestions",
    add:              "+ Add",
    icdCode:          "ICD Code",
    matchedSymptoms:  "Your matching symptoms",
    feedbackQ:        "Was this helpful?",
    correct:          "✓ Accurate",
    wrong:            "✗ Inaccurate",
    unsure:           "? Not Sure",
    thanksFeedback:   "Thanks for the feedback!",
    noHistory:        "No past analyses found.",
    chatGreeting:     "Hello! I'm MedSense AI. Describe your symptoms or ask anything about health.",
    modelNotReady:    "ML model not trained yet. Run: python -m ml.train",
    connecting:       "Connecting to server...",
    serverError:      "Could not connect to backend. Is the Flask server running?",
  },
  sw: {
    appName:          "MedSense AI",
    tagline:          "Uchambuzi wa Dalili kwa Akili Bandia",
    disclaimer:       "⚠ Kwa madhumuni ya habari tu. Si mbadala wa ushauri wa daktari.",
    searchPlaceholder:"Tafuta dalili (mfano: homa, maumivu ya kichwa...)",
    selectedSymptoms: "Dalili Zilizochaguliwa",
    clearAll:         "Futa Zote",
    analyze:          "Changanua Dalili",
    analyzing:        "Inachunguza...",
    results:          "Matokeo ya Uchunguzi",
    confidence:       "Uhakika",
    severity:         "Ukali",
    relatedSymptoms:  "Dalili Zinazohusiana",
    suggestedAction:  "Hatua Inayopendekezwa",
    hospitals:        "Hospitali Zilizo Karibu",
    history:          "Historia",
    chat:             "Msaidizi wa AI",
    chatPlaceholder:  "Uliza kuhusu dalili zako...",
    send:             "Tuma",
    newAnalysis:      "← Uchambuzi Mpya",
    mild:             "Ndogo",
    moderate:         "Wastani",
    severe:           "Kali",
    critical:         "Hatari",
    noSymptoms:       "Tafadhali chagua dalili moja angalau.",
    langToggle:       "English",
    topConditions:    "Magonjwa Yanayowezekana Zaidi",
    suggestions:      "Mapendekezo ya Dalili",
    add:              "+ Ongeza",
    icdCode:          "Nambari ya ICD",
    matchedSymptoms:  "Dalili zako zinazolingana",
    feedbackQ:        "Je, matokeo yalikuwa sahihi?",
    correct:          "✓ Sahihi",
    wrong:            "✗ Siyo Sahihi",
    unsure:           "? Sijui",
    thanksFeedback:   "Asante kwa maoni yako!",
    noHistory:        "Hakuna uchambuzi uliopita.",
    chatGreeting:     "Habari! Mimi ni MedSense AI. Elezea dalili zako au niulize swali lolote.",
    modelNotReady:    "Mfano bado haujafunzwa. Endesha: python -m ml.train",
    connecting:       "Inaunganisha seva...",
    serverError:      "Haiwezi kuunganika. Je, seva ya Flask inaendesha?",
  },
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState("en");
  const t = translations[lang];
  const toggle = () => setLang(l => l === "en" ? "sw" : "en");
  return (
    <LangContext.Provider value={{ lang, t, toggle }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
