// app-shell.jsx — Main app shell + Compare view (wired to backend)

const { Icon: II, ModelGlyph: MGI, AJA: DD, UI: UU, ResponseCard } = window;

const TABS = [
  { id: "compare",     label: "Compare",     icon: "Sparkle" },
  { id: "history",     label: "History",     icon: "History" },
  { id: "leaderboard", label: "Leaderboard", icon: "Trophy" },
  { id: "benchmarks",  label: "Benchmarks",  icon: "Beaker" },
];

const SegmentedTabs = ({ tabs, active, onChange }) => {
  const refs = React.useRef({});
  const [ind, setInd] = React.useState({ x: 0, w: 0 });
  React.useLayoutEffect(() => {
    const el = refs.current[active];
    if (el) setInd({ x: el.offsetLeft, w: el.offsetWidth });
  }, [active]);
  return (
    <div style={{
      position: "relative", display: "inline-flex",
      padding: 4, borderRadius: 999,
      background: "oklch(1 0 0 / 0.025)", border: "1px solid var(--line-2)",
    }}>
      <div style={{
        position: "absolute", top: 4, bottom: 4, left: ind.x, width: ind.w,
        background: "linear-gradient(180deg, oklch(1 0 0 / 0.10), oklch(1 0 0 / 0.04))",
        borderRadius: 999, border: "1px solid var(--line-2)",
        boxShadow: "0 1px 0 oklch(1 0 0 / 0.06) inset, 0 6px 18px -6px oklch(0 0 0 / 0.6)",
        transition: "left 320ms var(--ease), width 320ms var(--ease)",
      }} />
      {tabs.map(t => {
        const Ic = II[t.icon];
        return (
          <button
            key={t.id}
            ref={el => refs.current[t.id] = el}
            onClick={() => onChange(t.id)}
            style={{
              position: "relative", zIndex: 1,
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 32, padding: "0 14px", borderRadius: 999,
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500, letterSpacing: -0.005,
              color: active === t.id ? "var(--fg-0)" : "var(--fg-2)",
              transition: "color 200ms var(--ease)",
            }}>
            <Ic size={14}/> {t.label}
          </button>
        );
      })}
    </div>
  );
};

const TopBar = ({ active, setActive, compact, setCompact, status }) => (
  <header style={{
    position: "sticky", top: 0, zIndex: 30,
    padding: "14px 28px",
    display: "flex", alignItems: "center", gap: 16,
    background: "linear-gradient(180deg, oklch(0.12 0.008 260 / 0.85), oklch(0.12 0.008 260 / 0.4))",
    backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
    borderBottom: "1px solid var(--line-1)",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: "linear-gradient(135deg, oklch(0.82 0.16 165), oklch(0.74 0.17 285))",
        display: "grid", placeItems: "center",
        boxShadow: "0 0 0 1px oklch(1 0 0 / 0.15) inset, 0 0 28px -6px oklch(0.74 0.17 285 / 0.6)",
      }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M2 12 L8 2 L14 12 Z" stroke="oklch(0.14 0 0)" strokeWidth="1.6" strokeLinejoin="round"/>
          <circle cx="8" cy="9.5" r="1.4" fill="oklch(0.14 0 0)"/>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: -0.01, color: "var(--fg-0)" }}>Judge Arena</div>
        <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)", marginTop: -1, letterSpacing: 0.05 }}>
          v0.4{status ? (
            <span style={{ color: status.mode === "live" ? "var(--accent-aurora)" : "var(--accent-amber)" }}>
              {" "}· {status.mode}
            </span>
          ) : " · connecting…"}
        </div>
      </div>
    </div>
    <div style={{ width: 1, height: 24, background: "var(--line-1)", margin: "0 8px" }} />
    <SegmentedTabs tabs={TABS} active={active} onChange={setActive} />
    <div style={{ flex: 1 }} />
    <button className="btn focus-ring" data-variant="ghost" onClick={() => setCompact(!compact)}>
      <II.Compact size={14}/> {compact ? "Comfortable" : "Compact"}
    </button>
    <button className="btn focus-ring" data-variant="ghost"><II.Settings size={14}/></button>
    <div style={{
      width: 30, height: 30, borderRadius: 999,
      background: "linear-gradient(135deg, oklch(0.50 0.08 285), oklch(0.40 0.06 165))",
      border: "1px solid var(--line-2)",
      display: "grid", placeItems: "center", fontSize: 11, color: "white", fontWeight: 600,
    }}>EM</div>
  </header>
);

const PromptComposer = ({ onRun, isRunning, prompt, setPrompt, compact }) => {
  const taRef = React.useRef(null);
  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(220, ta.scrollHeight) + "px";
  }, [prompt]);

  const onKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isRunning && prompt.trim()) onRun();
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div aria-hidden style={{
        position: "absolute", inset: -22, borderRadius: 32,
        background: "radial-gradient(60% 50% at 50% 0%, oklch(0.74 0.17 285 / 0.18), transparent 60%), radial-gradient(40% 40% at 90% 100%, oklch(0.82 0.16 165 / 0.10), transparent 60%)",
        filter: "blur(20px)", pointerEvents: "none",
      }} />
      <div className="glass" style={{ position: "relative", borderRadius: 22, padding: 6 }}>
        <div style={{ padding: compact ? "12px 14px 8px" : "16px 18px 10px", display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="pill" style={{ borderColor: "oklch(0.74 0.17 285 / 0.4)", color: "var(--fg-1)" }}>
              <II.Sparkle size={11}/> Prompt
            </span>
            <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>3 judges enabled</span>
            <div style={{ flex: 1 }} />
            <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
              {prompt.length} <span style={{ color: "var(--fg-4)" }}>/ 8,000</span>
            </span>
          </div>
          <textarea
            ref={taRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask anything. The arena will route your prompt to all three models, score the responses, and surface the winner."
            rows={3}
            style={{
              width: "100%", resize: "none", border: "none", outline: "none",
              background: "transparent", color: "var(--fg-0)",
              fontSize: 17, lineHeight: 1.55, letterSpacing: -0.01,
              fontWeight: 400, padding: 0, minHeight: 64,
            }}
          />
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 12px 10px 18px",
          borderTop: "1px solid var(--line-1)",
        }}>
          <button className="btn" data-variant="ghost"><II.Layers size={13}/> Templates</button>
          <button className="btn" data-variant="ghost"><II.Target size={13}/> Rubric · 4</button>
          <button className="btn" data-variant="ghost"><II.Brain size={13}/> Judge: auto</button>
          <div style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginRight: 6 }}>⌘⏎</span>
          <button
            className="btn focus-ring"
            data-variant="primary"
            disabled={isRunning || !prompt.trim()}
            onClick={onRun}
            style={{
              height: 40, padding: "0 18px", fontSize: 13.5, fontWeight: 600,
              opacity: (isRunning || !prompt.trim()) ? 0.55 : 1,
              cursor: (isRunning || !prompt.trim()) ? "not-allowed" : "pointer",
            }}>
            {isRunning ? (
              <>
                <span style={{ width: 10, height: 10, borderRadius: 999, border: "1.5px solid currentColor", borderTopColor: "transparent", animation: "aurora-spin 800ms linear infinite", display: "inline-block" }}/>
                Running arena…
              </>
            ) : (<><II.Bolt size={14}/> Run Arena</>)}
          </button>
        </div>
      </div>
    </div>
  );
};

const TemplateChips = ({ onPick }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
    {DD.PROMPT_TEMPLATES.slice(0, 5).map(t => (
      <button key={t.id} className="focus-ring" onClick={() => onPick(t)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 12px 8px 10px", borderRadius: 999,
          background: "oklch(1 0 0 / 0.025)", border: "1px solid var(--line-1)",
          color: "var(--fg-2)", fontSize: 12, cursor: "pointer", transition: "all 180ms var(--ease)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "oklch(1 0 0 / 0.05)"; e.currentTarget.style.color = "var(--fg-0)"; e.currentTarget.style.borderColor = "var(--line-3)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "oklch(1 0 0 / 0.025)"; e.currentTarget.style.color = "var(--fg-2)"; e.currentTarget.style.borderColor = "var(--line-1)"; }}>
        <span className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: 0.06, textTransform: "uppercase" }}>{t.category}</span>
        <span style={{ width: 1, height: 11, background: "var(--line-2)" }}/>
        <span>{t.title}</span>
      </button>
    ))}
  </div>
);

const RunSummary = ({ runState, onSave, savedRun }) => {
  if (runState.phase !== "done") return null;
  const winner = DD.MODELS.find(m => m.id === runState.winnerId);
  const v = runState.verdict;
  if (!winner || !v) return null;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ verdict: v, responses: runState.responses }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `arena-run-${Date.now()}.json`; a.click();
  };

  return (
    <div className="glass-soft rise-in" style={{
      padding: "14px 18px", borderRadius: 14,
      display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="cap">Verdict</span>
        <span style={{ fontSize: 13.5, color: "var(--fg-1)" }}>
          <strong style={{ color: "var(--fg-0)", fontWeight: 600 }}>{winner.name}</strong> wins by{" "}
          <strong style={{ color: "var(--accent-aurora)", fontWeight: 600 }}>+{v.margin?.toFixed(1) || "—"} pts</strong> against the field.
        </span>
      </div>
      <div style={{ width: 1, height: 18, background: "var(--line-2)" }}/>
      <span className="mono numeric" style={{ fontSize: 11.5, color: "var(--fg-2)" }}>
        {(v.total_latency_ms / 1000).toFixed(1)}s · {v.total_tokens?.toLocaleString()} tokens · ${v.total_cost_usd?.toFixed(4)}
      </span>
      <div style={{ flex: 1 }}/>
      <button className="btn" data-variant="ghost" onClick={onSave} style={{ color: savedRun ? "var(--accent-aurora)" : undefined }}>
        <II.Save size={13}/> {savedRun ? "Saved ✓" : "Save run"}
      </button>
      <button className="btn" data-variant="ghost" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
        <II.Share size={13}/> Share
      </button>
      <button className="btn" data-variant="ghost" onClick={handleExport}><II.Export size={13}/> Export</button>
    </div>
  );
};

const ErrorCard = ({ message }) => (
  <div className="rise-in" style={{
    padding: "24px 28px", borderRadius: 18,
    background: "linear-gradient(180deg, oklch(0.22 0.08 25 / 0.4), oklch(0.15 0.04 25 / 0.3))",
    border: "1px solid oklch(0.50 0.14 25 / 0.35)",
    textAlign: "center", color: "var(--fg-1)",
  }}>
    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Arena run failed</div>
    <div style={{ fontSize: 13, color: "var(--fg-2)" }}>{message}</div>
    <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 12 }}>
      Check the backend is running and your .env is configured correctly.
    </div>
  </div>
);

const CompareView = ({ compact, prompt, setPrompt, runState, onRun, onSave, savedRun }) => {
  const [expanded, setExpanded] = React.useState({});
  const idle       = runState.phase === "idle";
  const isRunning  = runState.phase === "running" || runState.phase === "streaming";
  const hasResults = runState.phase === "done";
  const hasError   = runState.phase === "error";

  return (
    <div style={{ display: "grid", gap: 32, paddingTop: idle ? 56 : 24, transition: "padding 360ms var(--ease)" }}>
      {/* Hero */}
      <div style={{
        textAlign: "center",
        maxHeight: idle ? 600 : 0, opacity: idle ? 1 : 0,
        overflow: "hidden", transition: "max-height 480ms var(--ease), opacity 320ms var(--ease)",
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <span className="pill" style={{ background: "oklch(0.74 0.17 285 / 0.10)", borderColor: "oklch(0.74 0.17 285 / 0.3)", color: "var(--fg-1)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent-aurora)", boxShadow: "0 0 8px var(--accent-aurora)" }}/>
            <span className="mono" style={{ fontSize: 10.5 }}>NEW</span>
            Multi-judge consensus is now live
          </span>
        </div>
        <h1 style={{ margin: 0, fontFamily: "Inter Tight", fontSize: "clamp(40px, 6vw, 76px)", fontWeight: 500, lineHeight: 1.02, letterSpacing: -0.035, color: "var(--fg-0)" }}>
          One prompt. Three minds.<br/>
          <span style={{ background: "linear-gradient(120deg, oklch(0.82 0.16 165), oklch(0.96 0.04 200) 40%, oklch(0.74 0.17 285))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", fontStyle: "italic", fontWeight: 400 }}>
            One verdict.
          </span>
        </h1>
        <p style={{ margin: "20px auto 0", maxWidth: 560, fontSize: 16, lineHeight: 1.55, color: "var(--fg-2)", letterSpacing: -0.005 }}>
          Run any prompt against the frontier. Truthfulness, reasoning, safety, and clarity — graded in real time, by an independent judge model.
        </p>
      </div>

      {/* Composer */}
      <div style={{ maxWidth: 880, margin: "0 auto", width: "100%" }}>
        <PromptComposer onRun={onRun} isRunning={isRunning} prompt={prompt} setPrompt={setPrompt} compact={compact}/>
      </div>

      {/* Templates */}
      {idle && (
        <div style={{ maxWidth: 880, margin: "-8px auto 0", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}><span className="cap">or try a template</span></div>
          <TemplateChips onPick={(t) => setPrompt(t.body)} />
        </div>
      )}

      {/* Error */}
      {hasError && (
        <div style={{ maxWidth: 880, margin: "0 auto", width: "100%" }}>
          <ErrorCard message={runState.error} />
        </div>
      )}

      {/* Run summary */}
      {hasResults && (
        <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%" }}>
          <RunSummary runState={runState} onSave={onSave} savedRun={savedRun}/>
        </div>
      )}

      {/* Cards grid */}
      {(isRunning || hasResults) && (
        <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          {DD.MODELS.map((m, i) => {
            const r = runState.responses[m.id];
            if (!r) return null;
            const isWinner = hasResults && runState.winnerId === m.id;
            return (
              <div key={m.id} style={{ animationDelay: `${i * 80}ms` }} className="rise-in">
                <ResponseCard
                  model={m} response={r}
                  isWinner={isWinner} isStreaming={isRunning}
                  expanded={!!expanded[m.id]}
                  onToggle={() => setExpanded(p => ({ ...p, [m.id]: !p[m.id] }))}
                  compact={compact}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Idle stats */}
      {idle && (
        <div style={{ maxWidth: 880, margin: "32px auto 8px", width: "100%", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderTop: "1px solid var(--line-1)", borderBottom: "1px solid var(--line-1)" }}>
          {[
            { k: "1.4M", l: "prompts judged" },
            { k: "9,120", l: "votes this week" },
            { k: "3", l: "models in arena" },
            { k: "live", l: "scoring engine" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "20px 18px", borderLeft: i ? "1px solid var(--line-1)" : "none", textAlign: "center" }}>
              <div className="mono numeric" style={{ fontSize: 22, color: "var(--fg-0)", fontWeight: 500, letterSpacing: -0.02 }}>{s.k}</div>
              <div className="cap" style={{ marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

window.AppShell = { TopBar, CompareView };
