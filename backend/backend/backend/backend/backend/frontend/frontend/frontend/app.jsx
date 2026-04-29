// app.jsx — Root app wired to the Judge Arena backend API.
// Replaces the static mock data with real /api/* calls.

const {
  AppShell, HistoryView, LeaderboardView, BenchmarksView,
  AJA: D, Particles,
} = window;

// ── API client ──────────────────────────────────────────────────────────────

const API_BASE = window.JUDGE_API_BASE || "";

const api = {
  async runArena(prompt) {
    const res = await fetch(`${API_BASE}/api/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Arena run failed");
    }
    return res.json();
  },
  async getHistory(limit = 50, offset = 0) {
    const res = await fetch(`${API_BASE}/api/history?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error("Failed to load history");
    return res.json();
  },
  async getLeaderboard() {
    const res = await fetch(`${API_BASE}/api/leaderboard`);
    if (!res.ok) throw new Error("Failed to load leaderboard");
    return res.json();
  },
  async getStatus() {
    const res = await fetch(`${API_BASE}/api/status`);
    if (!res.ok) return null;
    return res.json();
  },
};

// ── Map API response to the shape ResponseCard expects ──────────────────────

function mapApiResponse(apiResp) {
  // apiResp: ModelResponseOut from backend
  return {
    bodyShort: apiResp.body,
    bodyFull:  apiResp.body,
    streamed:  apiResp.body,
    scores: {
      truthfulness: apiResp.scores.truthfulness,
      reasoning:    apiResp.scores.reasoning,
      safety:       apiResp.scores.safety,
      clarity:      apiResp.scores.clarity,
    },
    tokens:    apiResp.tokens,
    latencyMs: apiResp.latency_ms,
    cost:      apiResp.cost_usd,
  };
}

// Model id used by backend → frontend model id in AJA.MODELS
const MODEL_ID_MAP = { claude: "c1", gpt: "g4", gemini: "m2" };

// ── Run state hook ───────────────────────────────────────────────────────────

const useRunState = () => {
  const [state, setState] = React.useState({
    phase: "idle",    // "idle" | "running" | "streaming" | "done" | "error"
    responses: {},
    winnerId: null,
    verdict: null,
    error: null,
  });

  const run = React.useCallback(async (prompt) => {
    setState(s => ({
      ...s,
      phase: "running",
      error: null,
      responses: {
        c1: { bodyShort: "", bodyFull: "", streamed: "", scores: {}, tokens: 0, latencyMs: 0, cost: 0 },
        g4: { bodyShort: "", bodyFull: "", streamed: "", scores: {}, tokens: 0, latencyMs: 0, cost: 0 },
        m2: { bodyShort: "", bodyFull: "", streamed: "", scores: {}, tokens: 0, latencyMs: 0, cost: 0 },
      },
      winnerId: null,
      verdict: null,
    }));

    try {
      const data = await api.runArena(prompt);

      // Build responses map
      const responses = {};
      for (const r of data.responses) {
        const frontendId = MODEL_ID_MAP[r.model_id] || r.model_id;
        responses[frontendId] = mapApiResponse(r);
      }

      // Animate streaming into place
      setState(s => ({
        ...s,
        phase: "streaming",
        responses,
        winnerId: MODEL_ID_MAP[data.verdict.winner_id] || data.verdict.winner_id,
        verdict: data.verdict,
      }));

      // Short pause so streaming shimmer is visible, then mark done
      await new Promise(r => setTimeout(r, 600));

      setState(s => ({ ...s, phase: "done" }));
    } catch (err) {
      setState(s => ({
        ...s,
        phase: "error",
        error: err.message || "Something went wrong",
      }));
    }
  }, []);

  return [state, setState, run];
};

// ── Notification toast ───────────────────────────────────────────────────────

const Toast = ({ message, type = "error", onDismiss }) => (
  <div style={{
    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
    zIndex: 100, display: "flex", alignItems: "center", gap: 12,
    padding: "12px 18px", borderRadius: 12,
    background: type === "error"
      ? "linear-gradient(135deg, oklch(0.30 0.12 25), oklch(0.22 0.08 25))"
      : "linear-gradient(135deg, oklch(0.22 0.10 165), oklch(0.16 0.06 165))",
    border: `1px solid ${type === "error" ? "oklch(0.50 0.14 25 / 0.4)" : "oklch(0.60 0.14 165 / 0.4)"}`,
    boxShadow: "0 20px 60px -20px oklch(0 0 0 / 0.8)",
    color: "var(--fg-0)", fontSize: 13,
  }}>
    <span>{message}</span>
    <button
      onClick={onDismiss}
      style={{ background: "none", border: "none", color: "var(--fg-2)", cursor: "pointer", padding: 0 }}>
      ✕
    </button>
  </div>
);

// ── Status badge (mock vs live) ──────────────────────────────────────────────

const useStatus = () => {
  const [status, setStatus] = React.useState(null);
  React.useEffect(() => {
    api.getStatus().then(setStatus).catch(() => null);
  }, []);
  return status;
};

// ── Save run handler ─────────────────────────────────────────────────────────

const useSaveRun = () => {
  const [saved, setSaved] = React.useState(false);
  const save = React.useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, []);
  return [saved, save];
};

// ── App ───────────────────────────────────────────────────────────────────────

const App = () => {
  const [active, setActive]   = React.useState("compare");
  const [compact, setCompact] = React.useState(false);
  const [prompt, setPrompt]   = React.useState(
    "Explain attention vs. recurrence in plain English, then give a 3-bullet tradeoff."
  );
  const [runState, setRunState, run] = useRunState();
  const [toast, setToast] = React.useState(null);
  const [savedRun, triggerSave] = useSaveRun();
  const status = useStatus();

  const handleRun = React.useCallback(() => {
    if (!prompt.trim()) return;
    run(prompt);
  }, [prompt, run]);

  // Surface errors as toasts
  React.useEffect(() => {
    if (runState.phase === "error") {
      setToast({ message: runState.error, type: "error" });
    }
  }, [runState.phase, runState.error]);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div className="bg-field"/>
      <div className="bg-grid"/>
      <Particles density={70} intensity={0.2}/>
      <div className="bg-noise"/>

      <div style={{ position: "relative", zIndex: 2 }}>
        <AppShell.TopBar
          active={active}
          setActive={setActive}
          compact={compact}
          setCompact={setCompact}
          status={status}
        />

        <main style={{
          maxWidth: 1340, margin: "0 auto",
          padding: compact ? "20px 24px 80px" : "32px 28px 96px",
        }}>
          {active === "compare" && (
            <AppShell.CompareView
              compact={compact}
              prompt={prompt}
              setPrompt={setPrompt}
              runState={runState}
              onRun={handleRun}
              onSave={triggerSave}
              savedRun={savedRun}
            />
          )}
          {active === "history"     && <HistoryView apiClient={api}/>}
          {active === "leaderboard" && <LeaderboardView apiClient={api}/>}
          {active === "benchmarks"  && <BenchmarksView/>}
        </main>

        <footer style={{
          maxWidth: 1340, margin: "0 auto",
          padding: "24px 28px 40px",
          display: "flex", alignItems: "center", gap: 12,
          fontSize: 11.5, color: "var(--fg-3)",
          borderTop: "1px solid var(--line-1)",
        }}>
          <span className="mono">judge-arena.dev</span>
          <span style={{ width: 2, height: 2, borderRadius: 999, background: "var(--fg-4)" }} />
          <span>Independent · No model maker has access</span>
          <div style={{ flex: 1 }} />
          {status && (
            <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
              mode: <span style={{ color: status.mode === "live" ? "var(--accent-aurora)" : "var(--accent-amber)" }}>
                {status.mode}
              </span>
            </span>
          )}
          <span className="mono">All systems operational</span>
          <span style={{
            width: 7, height: 7, borderRadius: 999,
            background: "var(--accent-aurora)",
            boxShadow: "0 0 8px var(--accent-aurora)",
          }}/>
        </footer>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
