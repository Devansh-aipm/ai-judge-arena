// Reusable building blocks: ScoreBar, NumberRoll, MetricChip, ModelHeader, etc.

const NumberRoll = ({ value, duration = 700, format = (v) => v, className = "", style }) => {
  const [v, setV] = React.useState(0);
  const startRef = React.useRef(null);
  const fromRef = React.useRef(0);
  React.useEffect(() => {
    fromRef.current = v;
    startRef.current = null;
    let raf;
    const step = (t) => {
      if (!startRef.current) startRef.current = t;
      const k = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setV(fromRef.current + (value - fromRef.current) * eased);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={"numeric " + className} style={style}>{format(v)}</span>;
};

const ScoreBar = ({ value, color = "var(--fg-1)", label, delay = 0, compact }) => {
  const [shown, setShown] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setShown(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{ display: "grid", gap: compact ? 4 : 6 }}>
      {label && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5, color: "var(--fg-2)" }}>
          <span style={{ letterSpacing: 0.1, textTransform: "uppercase", fontSize: 10.5, color: "var(--fg-3)" }}>{label}</span>
          <span className="mono" style={{ color: "var(--fg-1)", fontSize: 11.5, fontWeight: 500 }}>
            <NumberRoll value={shown} format={(v) => v.toFixed(0)} />
          </span>
        </div>
      )}
      <div style={{
        position: "relative", height: compact ? 3 : 4, borderRadius: 999,
        background: "oklch(1 0 0 / 0.06)", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, transformOrigin: "left",
          transform: `scaleX(${shown / 100})`,
          background: `linear-gradient(90deg, ${color}, oklch(1 0 0 / 0.95))`,
          transition: "transform 900ms cubic-bezier(0.16, 1, 0.3, 1)",
          borderRadius: 999,
          boxShadow: `0 0 16px -2px ${color}`,
        }} />
      </div>
    </div>
  );
};

// Mini histogram of scores → average mark for the response header
const ScoreSpark = ({ scores, color }) => {
  const values = Object.values(scores);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 14 }}>
        {values.map((v, i) => (
          <div key={i} style={{
            width: 3, height: `${(v / 100) * 14}px`, borderRadius: 1.5,
            background: color, opacity: 0.5 + (v / 100) * 0.5,
          }} />
        ))}
      </div>
      <span className="mono numeric" style={{ fontSize: 12, color: "var(--fg-1)", fontWeight: 500 }}>
        <NumberRoll value={avg} format={(v) => v.toFixed(1)} />
      </span>
    </div>
  );
};

const MetricChip = ({ label, value, mono = true }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "5px 9px", borderRadius: 7,
    background: "oklch(1 0 0 / 0.03)",
    border: "1px solid var(--line-1)",
    fontSize: 11,
  }}>
    <span style={{ color: "var(--fg-3)", letterSpacing: 0.05 }}>{label}</span>
    <span className={mono ? "mono numeric" : "numeric"} style={{ color: "var(--fg-1)", fontWeight: 500 }}>{value}</span>
  </div>
);

// Animated typing of a string
const useTypewriter = (text, { speed = 12, startDelay = 0, run = true } = {}) => {
  const [out, setOut] = React.useState("");
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    if (!run) { setOut(text); setDone(true); return; }
    setOut(""); setDone(false);
    let i = 0;
    let raf;
    let started = false;
    const begin = () => {
      started = true;
      const tick = () => {
        i += Math.max(1, Math.round(speed / 16));
        if (i >= text.length) { setOut(text); setDone(true); return; }
        setOut(text.slice(0, i));
        raf = setTimeout(tick, 16);
      };
      tick();
    };
    const t = setTimeout(begin, startDelay);
    return () => { clearTimeout(t); clearTimeout(raf); };
  }, [text, run]);
  return [out, done];
};

window.UI = window.UI || {};
Object.assign(window.UI, { NumberRoll, ScoreBar, ScoreSpark, MetricChip, useTypewriter });
