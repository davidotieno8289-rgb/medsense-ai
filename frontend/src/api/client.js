import axios from "axios";

const api = axios.create({
  baseURL:         "/api",
  withCredentials: true,
  headers:         { "Content-Type": "application/json" },
});

// ── Symptoms ──────────────────────────────────────────────────────────────────
export const fetchSymptoms  = (q = "")  => api.get(`/symptoms${q ? `?q=${q}` : ""}`);
export const fetchSuggestions = (symptoms) => api.post("/suggestions", { symptoms });

// ── Prediction ────────────────────────────────────────────────────────────────
export const predictDiseases = (symptoms) => api.post("/predict", { symptoms });

// ── History ───────────────────────────────────────────────────────────────────
export const fetchHistory    = (limit = 20) => api.get(`/history?limit=${limit}`);
export const clearHistory    = ()           => api.delete("/history");

// ── Feedback ─────────────────────────────────────────────────────────────────
export const submitFeedback  = (data) => api.post("/feedback", data);

// ── Chat ─────────────────────────────────────────────────────────────────────
export const sendChatMessage = (messages, lang = "en") =>
  api.post("/chat", { messages, lang });

// ── Health ────────────────────────────────────────────────────────────────────
export const checkHealth = () => api.get("/health");

export default api;
