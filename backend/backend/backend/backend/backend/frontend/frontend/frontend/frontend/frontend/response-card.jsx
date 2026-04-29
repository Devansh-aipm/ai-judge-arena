// ResponseCard — model header, body, scores, expand/collapse, winner.

const { Icon, ModelGlyph, AJA, UI } = window;
const { ScoreBar, MetricChip, ScoreSpark, useTypewriter, NumberRoll } = UI;

const ModelHeader = ({ model, isWinner, isStreaming, latencyMs }) => {
  const Glyph = ModelGlyph[model.glyph];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
      <div style={{
        position: "relative",
        width: 38, height: 38, borderRadius: 12,
        display: "grid", placeItems: "center",
        background: "linear-gradient(180deg, oklch(1 0 0 / 0.05), oklch(1 0 0 / 0.02))",
        border: "1px solid var(--line-2)",
        color: model.color,
        flexShrink: 0,
      }}>
        <Glyph size={22} color="currentColor" />
        {isStreaming && (
          <span style={{
            position: "absolute", inset: -2, borderRadius: 14,
            border: "1px solid transparent",
            background: `conic-gradient(from 0deg, transparent 60%, ${model.color} 80%, transparent 100%)`,
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor", maskComposite: "exclude",
            padding: 1, animation: "aurora-spin 2.6s linear infinite",
            opacity: 0.9,
          }} />
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h3 style={{
            margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: -0.01,
            color: "var(--fg-0)", whiteSpace: "nowrap",
          }}>{model.name}</h3>
          {isWinner && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 7px", borderRadius: 999, fontSize: 10,
              fontWeight: 600, letterSpacing: 0.06, textTransform: "uppercase",
              color: "oklch(0.16 0.01 260)",
              background: "linear-gradient(180deg, oklch(0.92 0.13 165), oklch(0.78 0.14 165))",
              boxShadow: "0 0 24px -4px oklch(0.82 0.16 165 / 0.6)",
            }}>
              <Icon.Crown size={10}/> Winner
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{model.org}</span>
          <span style={{ width: 2, height: 2, borderRadius: 999, background: "var(--fg-4)" }} />
          <span className="mono numeric" style={{ fontSize: 11, color: "var(--fg-3)" }}>
            {isStreaming ? "streaming…" : `${(latencyMs/1000).toFixed(2)}s`}
          </span>
        </div>
      </div>
    </div>
  );
};

const ResponseBody = ({ text, expanded, isStreaming, fullText }) => {
  return (
    <div style={{
      position: "relative",
      fontSize: 13.5, lineHeight: 1.65, color: "var(--fg-1)",
      whiteSpace: "pre-wrap", wordBreak: "break-word",
      maxHeight: expanded ? 9999 : 168,
      overflow: "hidden",
      transition: "max-height 380ms var(--ease)",
      letterSpacing: -0.003,
    }}>
      {expanded ? fullText : text}
      {isStreaming && <span className="caret"/>}
      {!expanded && !isStreaming && (
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 70,
          background: "linear-gradient(180deg, transparent, oklch(0.175 0.010 260) 90%)",
          pointerEvents: "none",
        }}/>
      )}
    </div>
  );
};

const ResponseCard = ({ model, response, isWinner, isStreaming, expanded, onToggle, compact }) => {
  const visibleText = isStreaming
    ? response.streamed
    : response.bodyShort;

  return (
    <div className="rise-in" style={{
      position: "relative",
      background: "linear-gradient(180deg, oklch(1 0 0 / 0.035), oklch(1 0 0 / 0.012) 40%, oklch(1 0 0 / 0) 100%), oklch(0.175 0.010 260 / 0.65)",
      backdropFilter: "blur(18px) saturate(1.1)",
      WebkitBackdropFilter: "blur(18px) saturate(1.1)",
      border: "1px solid " + (isWinner ? "oklch(0.82 0.16 165 / 0.45)" : "var(--line-2)"),
      boxShadow: isWinner
        ? "0 0 0 1px oklch(0.82 0.16 165 / 0.20) inset, 0 0 80px -20px oklch(0.82 0.16 165 / 0.35), 0 30px 80px -30px oklch(0 0 0 / 0.6)"
        : "0 1px 0 oklch(1 0 0 / 0.06) inset, 0 30px 80px -40px oklch(0 0 0 / 0.6)",
      borderRadius: 18,
      padding: compact ? "16px 16px 12px" : "20px 20px 16px",
      display: "flex", flexDirection: "column", gap: compact ? 12 : 14,
      transition: "border-color 240ms var(--ease), box-shadow 240ms var(--ease)",
      overflow: "hidden",
    }}>
      {/* top edge highlight */}
      <div aria-hidden style={{
        position: "absolute", top: 0, left: 16, right: 16, height: 1,
        background: isWinner
          ? "linear-gradient(90deg, transparent, oklch(0.82 0.16 165 / 0.5), transparent)"
          : "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.18), transparent)",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <ModelHeader
          model={model}
          isWinner={isWinner}
          isStreaming={isStreaming}
          latencyMs={response.latencyMs}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {!isStreaming && (
            <button className="icon-btn focus-ring" title="Copy"><Icon.Copy size={14}/></button>
          )}
          {!isStreaming && (
            <button className="icon-btn focus-ring" title="Pin"><Icon.Pin size={14}/></button>
          )}
        </div>
      </div>

      {/* Body */}
      {isStreaming && !response.streamed ? (
        <div style={{ display: "grid", gap: 8, padding: "4px 0" }}>
          <div className="shimmer-line" style={{ width: "92%" }} />
          <div className="shimmer-line" style={{ width: "78%" }} />
          <div className="shimmer-line" style={{ width: "84%" }} />
        </div>
      ) : (
        <ResponseBody
          text={visibleText}
          fullText={response.bodyFull}
          expanded={expanded}
          isStreaming={isStreaming}
        />
      )}

      {!isStreaming && (
        <button
          onClick={onToggle}
          className="focus-ring"
          style={{
            alignSelf: "flex-start", marginTop: -2,
            background: "transparent", border: "none", padding: 0,
            color: "var(--fg-2)", fontSize: 12, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
          <span>{expanded ? "Collapse" : "Read full response"}</span>
          {expanded ? <Icon.ChevronUp size={12}/> : <Icon.Chevron size={12}/>}
        </button>
      )}

      {/* Hairline */}
      <div className="hairline"/>

      {/* Scores */}
      {!isStreaming && (
        <div style={{ display: "grid", gap: compact ? 8 : 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="cap">Evaluation</span>
            <ScoreSpark scores={response.scores} color={model.color}/>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: compact ? "1fr 1fr" : "1fr",
            gap: compact ? "8px 18px" : 10,
          }}>
            {AJA.RUBRIC.map((r, i) => (
              <ScoreBar
                key={r.id}
                label={r.label}
                value={response.scores[r.id]}
                color={model.color}
                delay={120 + i * 90}
                compact={compact}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer metrics */}
      {!isStreaming && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
          <MetricChip label="tok" value={response.tokens}/>
          <MetricChip label="ms"  value={response.latencyMs}/>
          <MetricChip label="$"   value={"$" + response.cost.toFixed(4)}/>
        </div>
      )}
    </div>
  );
};

window.ResponseCard = ResponseCard;
