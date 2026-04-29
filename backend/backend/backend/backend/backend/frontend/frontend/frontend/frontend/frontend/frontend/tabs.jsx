// tabs.jsx — History / Leaderboard / Benchmarks wired to backend API

const { Icon: I2, ModelGlyph: MG2, AJA: D2, UI: U2 } = window;

// ── History ──────────────────────────────────────────────────────────────────

const HistoryView = ({ apiClient }) => {
  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState(D2.HISTORY); // pre-populate with sample
  const [total, setTotal] = React.useState(D2.HISTORY.length);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!apiClient) return;
    setLoading(true);
    apiClient.getHistory(50, 0).then(data => {
      if (data.items?.length) {
        setItems(data.items.map(item => ({
          id: item.run_id,
          time: formatRelativeTime(item.created_at),
          prompt: item.prompt,
          winner: item.winner_id,
          winnerName: item.winner_name,
          scores: Object.values(item.scores || {}).map(v => Math.round(v)),
        })));
        setTotal(data.total);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(h =>
    (h.prompt || "").toLowerCase().includes(q.toLowerCase())
  );

  const MODEL_ID_MAP_REV = { c1: "c1", g4: "g4", m2: "m2", claude: "c1", gpt: "g4", gemini: "m2" };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 12, background: "oklch(1 0 0 / 0.03)", border: "1px solid var(--line-2)" }}>
          <I2.Search size={14}/>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${total} saved runs`}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "var(--fg-0)" }}
          />
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>⌘K</span>
        </div>
        <button className="btn"><I2.Filter size={13}/> All time</button>
        <button className="btn" onClick={() => {
          const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
          const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
          a.download = "arena-history.json"; a.click();
        }}><I2.Export size={13}/> Export</button>
      </div>

      <div className="glass-soft" style={{ borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 150px 130px 60px", padding: "10px 16px", fontSize: 10.5, letterSpacing: 0.1, textTransform: "uppercase", color: "var(--fg-3)", borderBottom: "1px solid var(--line-1)" }}>
          <span>When</span><span>Prompt</span><span>Winner</span><span>Top scores</span><span/>
        </div>
        {loading && (
          <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>
            Loading…
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>
            No runs yet. Go run the arena!
          </div>
        )}
        {!loading && filtered.map((h, i) => {
          const frontendId = MODEL_ID_MAP_REV[h.winner] || h.winner;
          const w = D2.MODELS.find(m => m.id === frontendId) || { name: h.winnerName || "—", color: "white", glyph: "C1" };
          const Glyph = MG2[w.glyph] || MG2.C1;
          return (
            <div key={h.id || i}
              style={{ display: "grid", gridTemplateColumns: "100px 1fr 150px 130px 60px", padding: "14px 16px", alignItems: "center", borderBottom: i < filtered.length - 1 ? "1px solid var(--line-1)" : "none", cursor: "pointer", transition: "background 160ms var(--ease)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "oklch(1 0 0 / 0.02)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span className="mono" style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{h.time}</span>
              <span style={{ fontSize: 13.5, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 16 }}>{h.prompt}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 8, color: w.color }}>
                <Glyph size={16} color="currentColor"/>
                <span style={{ fontSize: 12.5, color: "var(--fg-1)" }}>{w.name}</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {(h.scores || []).slice(0, 3).map((s, idx) => (
                  <div key={idx} style={{ width: 26, height: 18, borderRadius: 4, background: "linear-gradient(180deg, oklch(1 0 0 / 0.06), oklch(1 0 0 / 0.02))", border: "1px solid var(--line-1)", display: "grid", placeItems: "center", fontSize: 10, color: "var(--fg-2)" }} className="mono numeric">{s}</div>
                ))}
              </span>
              <button className="icon-btn"><I2.Arrow size={13}/></button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Leaderboard ───────────────────────────────────────────────────────────────

const LeaderboardView = ({ apiClient }) => {
  const [entries, setEntries] = React.useState(null);
  const [totalRuns, setTotalRuns] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  // Map backend model_id to frontend AJA model
  const MODEL_ID_MAP_REV = { claude: "c1", gpt: "g4", gemini: "m2" };

  React.useEffect(() => {
    if (!apiClient) return;
    setLoading(true);
    apiClient.getLeaderboard().then(data => {
      if (data.entries?.length) {
        setEntries(data.entries);
        setTotalRuns(data.total_runs);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Fall back to static data
  const displayEntries = entries || D2.LEADERBOARD.map(row => {
    const m = D2.MODELS.find(x => x.id === row.model) || {};
    return {
      rank: row.rank,
      model_id: row.model,
      model_name: row.name || m.name,
      org: m.org || "—",
      wins: row.wins,
      total: row.total,
      win_rate: row.wins / row.total,
      avg_score: 91,
      avg_latency_ms: row.latency,
      avg_cost_usd: row.cost / 1000,
      elo: row.elo,
    };
  });

  const max = Math.max(...displayEntries.map(e => e.elo));
  const min = Math.min(...displayEntries.map(e => e.elo));

  const getGlyph = (model_id) => {
    const fId = MODEL_ID_MAP_REV[model_id] || model_id;
    const m = D2.MODELS.find(x => x.id === fId);
    return m ? MG2[m.glyph] : MG2.C1;
  };
  const getColor = (model_id) => {
    const fId = MODEL_ID_MAP_REV[model_id] || model_id;
    const m = D2.MODELS.find(x => x.id === fId);
    return m ? m.color : "var(--fg-2)";
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: -0.02 }}>Live ELO leaderboard</h2>
        <span className="pill">
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent-aurora)", boxShadow: "0 0 8px var(--accent-aurora)" }}/>
          {totalRuns ? `${totalRuns.toLocaleString()} runs` : "9,120 votes"} · updated live
        </span>
        <div style={{ flex: 1 }}/>
        <button className="btn"><I2.Globe size={13}/> Public</button>
        <button className="btn"><I2.Filter size={13}/> All tasks</button>
      </div>

      {loading && (
        <div style={{ padding: "32px", textAlign: "center", color: "var(--fg-3)" }}>Loading leaderboard…</div>
      )}

      <div className="glass-soft" style={{ borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 90px 130px 110px 110px 90px", padding: "10px 18px", fontSize: 10.5, letterSpacing: 0.1, textTransform: "uppercase", color: "var(--fg-3)", borderBottom: "1px solid var(--line-1)" }}>
          <span>Rank</span><span>Model</span><span>ELO</span><span>Win rate</span><span>Avg score</span><span>Latency</span><span>$/run</span>
        </div>
        {displayEntries.map((row, i) => {
          const Glyph = getGlyph(row.model_id);
          const color = getColor(row.model_id);
          const winRate = ((row.win_rate || 0) * 100);
          const flagship = row.rank === 1;
          return (
            <div key={row.model_id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 90px 130px 110px 110px 90px", padding: "16px 18px", alignItems: "center", borderBottom: i < displayEntries.length - 1 ? "1px solid var(--line-1)" : "none", background: flagship ? "linear-gradient(90deg, oklch(0.82 0.16 165 / 0.04), transparent)" : "transparent" }}>
              <span className="mono numeric" style={{ fontSize: 14, color: flagship ? "var(--accent-aurora)" : "var(--fg-2)", fontWeight: 500 }}>
                {String(row.rank).padStart(2, "0")}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color, display: "inline-flex" }}><Glyph size={20} color="currentColor"/></span>
                <span>
                  <div style={{ fontSize: 13.5, color: "var(--fg-0)", fontWeight: 500 }}>{row.model_name}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 1 }}>{row.org}</div>
                </span>
                {flagship && <I2.Crown size={12} style={{ color: "var(--accent-aurora)" }}/>}
              </span>
              <span className="mono numeric" style={{ fontSize: 14.5, color: "var(--fg-0)", fontWeight: 500 }}>{row.elo}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 60, height: 3, borderRadius: 999, background: "oklch(1 0 0 / 0.06)", overflow: "hidden" }}>
                  <div style={{ width: `${winRate}%`, height: "100%", background: color, opacity: 0.85 }}/>
                </div>
                <span className="mono numeric" style={{ fontSize: 11.5, color: "var(--fg-2)" }}>{winRate.toFixed(1)}%</span>
              </span>
              <span className="mono numeric" style={{ fontSize: 11.5, color: "var(--fg-2)" }}>
                {row.avg_score?.toFixed(1) || "—"}
              </span>
              <span className="mono numeric" style={{ fontSize: 11.5, color: "var(--fg-2)" }}>
                {Math.round(row.avg_latency_ms || 0)}ms
              </span>
              <span className="mono numeric" style={{ fontSize: 11.5, color: "var(--fg-2)" }}>
                ${(row.avg_cost_usd || 0).toFixed(4)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Benchmarks (static) ───────────────────────────────────────────────────────

const BenchmarksView = () => (
  <div style={{ display: "grid", gap: 16 }}>
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: -0.02 }}>Public benchmarks</h2>
      <span className="pill"><I2.Beaker size={11}/> 6 suites · 8,400 runs</span>
      <div style={{ flex: 1 }}/>
      <button className="btn"><I2.Refresh size={13}/> Re-run</button>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
      {D2.BENCHMARKS.map(b => {
        const max = Math.max(b.c1, b.g4, b.m2);
        return (
          <div key={b.id} className="glass-soft" style={{ padding: 18, borderRadius: 14, display: "grid", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-0)" }}>{b.label}</div>
                <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 3 }}>{b.desc}</div>
              </div>
              <span className="mono numeric pill">{max.toFixed(1)}</span>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {D2.MODELS.map(m => {
                const v = b[m.id];
                const MGlyph = MG2[m.glyph];
                return (
                  <div key={m.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr 50px", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11.5, color: "var(--fg-2)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: m.color, display: "inline-flex" }}><MGlyph size={12} color="currentColor"/></span>
                      {m.id.toUpperCase()}
                    </span>
                    <div style={{ height: 4, borderRadius: 999, background: "oklch(1 0 0 / 0.05)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${v}%`, background: `linear-gradient(90deg, ${m.color}, oklch(1 0 0 / 0.85))`, opacity: v === max ? 1 : 0.65 }}/>
                    </div>
                    <span className="mono numeric" style={{ fontSize: 11.5, color: v === max ? "var(--fg-0)" : "var(--fg-2)", textAlign: "right", fontWeight: v === max ? 600 : 400 }}>
                      {v.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ── Utility ───────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

window.HistoryView = HistoryView;
window.LeaderboardView = LeaderboardView;
window.BenchmarksView = BenchmarksView;
