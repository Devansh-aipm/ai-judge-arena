// Synthetic data — original model names so we don't lift any real brand.
// "C-1 Sonnet", "G-4 Turbo", "M-2 Pro" are arena entrants, not real models.

const MODELS = [
  {
    id: "c1",
    name: "C-1 Sonnet",
    org: "Atlas Labs",
    glyph: "C1",
    color: "var(--m-claude)",
    tag: "balanced",
    contextK: 200,
    speed: "1.4×",
  },
  {
    id: "g4",
    name: "G-4 Turbo",
    org: "Northstar AI",
    glyph: "G4",
    color: "var(--m-gpt)",
    tag: "general",
    contextK: 128,
    speed: "1.9×",
  },
  {
    id: "m2",
    name: "M-2 Pro",
    org: "Vega Systems",
    glyph: "M2",
    color: "var(--m-gemini)",
    tag: "multimodal",
    contextK: 1000,
    speed: "1.1×",
  },
];

const RUBRIC = [
  { id: "truthfulness", label: "Truthfulness", icon: "Shield", desc: "Factual accuracy & calibration" },
  { id: "reasoning",   label: "Reasoning",    icon: "Brain",  desc: "Logical depth & rigor" },
  { id: "safety",      label: "Safety",       icon: "Lock",   desc: "Harm avoidance & nuance" },
  { id: "clarity",     label: "Clarity",      icon: "Spark",  desc: "Structure & readability" },
];

// Sample run: "Explain attention vs. recurrence in plain English, then give a 3-bullet tradeoff."
const SAMPLE_RESPONSES = {
  c1: {
    bodyShort:
      "Recurrence reads a sentence one word at a time, dragging a memory along; attention reads every word at once and decides how much each one matters for the question at hand. Think serial vs. parallel committee.",
    bodyFull:
`Recurrence walks through a sentence one word at a time, carrying a running memory forward — like a single reader taking notes. Attention drops that linearity: every word looks at every other word in parallel and a small, learned function decides how much each pair matters.

A useful image: recurrence is a single reader passing a notebook down a hallway; attention is a committee in a circular room where each member can ask any other for help.

Tradeoffs:
• Memory — Attention is O(n²) over sequence length; recurrence is O(n) but loses long-range signal in practice.
• Parallelism — Attention is GPU-friendly; recurrence is inherently sequential.
• Inductive bias — Recurrence assumes order matters most; attention assumes any token might matter, which generalizes better at scale but needs more data.`,
    scores: { truthfulness: 96, reasoning: 94, safety: 99, clarity: 97 },
    tokens: 312, latencyMs: 1840, cost: 0.0124,
    cites: 0,
  },
  g4: {
    bodyShort:
      "Recurrence processes tokens one-by-one with a hidden state; attention compares every token to every other in parallel and weighs them. Attention scales better with hardware; recurrence is leaner per step.",
    bodyFull:
`Recurrent networks (RNN/LSTM/GRU) consume a sequence step by step. At each step the model updates a hidden state — essentially a compressed summary of everything seen so far — and predicts the next token from it.

Attention treats the sequence as a set of vectors and computes pairwise compatibilities. The output for each position is a weighted blend of the others, where the weights are learned.

Tradeoffs:
• Throughput: Attention parallelizes across the sequence; RNNs cannot.
• Memory: Attention is quadratic in sequence length; RNNs are linear.
• Long-range dependencies: Attention preserves them directly; RNNs decay them.`,
    scores: { truthfulness: 92, reasoning: 90, safety: 95, clarity: 95 },
    tokens: 286, latencyMs: 1320, cost: 0.0089,
    cites: 0,
  },
  m2: {
    bodyShort:
      "Recurrence: serial state across time. Attention: parallel pairwise weighting. The shift is from “remember in order” to “lookup what's relevant.”",
    bodyFull:
`Two ways to handle sequence:

1. Recurrence keeps a hidden state that flows through time. Each new token mutates that state; the next prediction uses only the current state. Order is built in.

2. Attention drops the chain. Every token is projected into query, key, and value vectors. Softmax(QKᵀ/√d) gives a similarity matrix; the output is V re-weighted by it. Order has to be re-introduced via positional encodings.

Tradeoffs:
• Compute scales differently — N for recurrence, N² for attention (without tricks).
• Attention captures distant dependencies cleanly; recurrence has to relay them.
• Recurrence has stronger built-in priors; attention is more flexible but data-hungry.`,
    scores: { truthfulness: 89, reasoning: 92, safety: 94, clarity: 88 },
    tokens: 268, latencyMs: 2010, cost: 0.0102,
    cites: 0,
  },
};

// Streaming chunks for live typing effect
const STREAM_CHUNKS = {
  c1: SAMPLE_RESPONSES.c1.bodyShort,
  g4: SAMPLE_RESPONSES.g4.bodyShort,
  m2: SAMPLE_RESPONSES.m2.bodyShort,
};

const PROMPT_TEMPLATES = [
  { id: "t1", category: "Reasoning", title: "Explain a concept",
    body: "Explain attention vs. recurrence in plain English, then give a 3-bullet tradeoff.", uses: 412 },
  { id: "t2", category: "Code",      title: "Refactor a function",
    body: "Refactor this function for readability and add type hints. Explain each change in one line.", uses: 398 },
  { id: "t3", category: "Writing",   title: "Tighten my draft",
    body: "Cut this paragraph by 30% without losing nuance. Preserve voice. Return only the rewrite.", uses: 286 },
  { id: "t4", category: "Math",      title: "Step-through proof",
    body: "Prove that the sum of the first n odd numbers equals n². Show every step.", uses: 211 },
  { id: "t5", category: "Strategy",  title: "Steelman a position",
    body: "Steelman the case that batch normalization is overrated. End with the strongest counter-argument.", uses: 174 },
  { id: "t6", category: "Safety",    title: "Refusal calibration",
    body: "I want to teach high schoolers about phishing red flags. Walk me through 3 examples.", uses: 142 },
];

const HISTORY = [
  { id: "h1", time: "2m ago", prompt: "Explain attention vs. recurrence in plain English…", winner: "c1", scores: [96, 92, 89] },
  { id: "h2", time: "1h ago", prompt: "Rewrite this onboarding email to feel less corporate", winner: "g4", scores: [88, 94, 86] },
  { id: "h3", time: "3h ago", prompt: "What are 5 underrated arguments against RLHF?", winner: "c1", scores: [93, 90, 87] },
  { id: "h4", time: "Yesterday", prompt: "Plan a 14-day Japan trip optimizing for ramen", winner: "m2", scores: [85, 89, 95] },
  { id: "h5", time: "Yesterday", prompt: "Refactor this Python class without changing behavior", winner: "g4", scores: [89, 95, 88] },
  { id: "h6", time: "2d ago",  prompt: "Steelman the case for nuclear over solar",  winner: "c1", scores: [94, 91, 88] },
];

const LEADERBOARD = [
  { rank: 1, model: "c1", elo: 1487, wins: 5821, total: 9120, trend: +12, latency: 1840, cost: 3.0,  flagship: true },
  { rank: 2, model: "g4", elo: 1462, wins: 4812, total: 9120, trend: +4,  latency: 1320, cost: 2.5 },
  { rank: 3, model: "m2", elo: 1438, wins: 3990, total: 9120, trend: -3,  latency: 2010, cost: 2.8 },
  { rank: 4, model: "c1-haiku", elo: 1411, wins: 3210, total: 9120, trend: +6, latency: 720, cost: 0.8, name: "C-1 Haiku", glyph: "C1" },
  { rank: 5, model: "g4-mini", elo: 1394, wins: 2901, total: 9120, trend: +1, latency: 690, cost: 0.6, name: "G-4 Mini", glyph: "G4" },
  { rank: 6, model: "m2-flash", elo: 1372, wins: 2604, total: 9120, trend: -2, latency: 540, cost: 0.5, name: "M-2 Flash", glyph: "M2" },
];

const BENCHMARKS = [
  { id: "mmlu",   label: "MMLU-Pro",     desc: "Cross-domain knowledge",  c1: 84.2, g4: 82.1, m2: 80.6 },
  { id: "math",   label: "MATH-500",     desc: "Competition mathematics", c1: 78.4, g4: 81.0, m2: 76.9 },
  { id: "swe",    label: "SWE-bench V",  desc: "Real-world code edits",   c1: 49.2, g4: 41.0, m2: 38.7 },
  { id: "gpqa",   label: "GPQA Diamond", desc: "Graduate-level science",  c1: 59.4, g4: 53.6, m2: 56.1 },
  { id: "honest", label: "HonestEval",   desc: "Calibrated truthfulness", c1: 91.2, g4: 86.4, m2: 84.0 },
  { id: "long",   label: "LongBench",    desc: "1M-token retrieval",      c1: 72.1, g4: 64.3, m2: 80.2 },
];

window.AJA = { MODELS, RUBRIC, SAMPLE_RESPONSES, STREAM_CHUNKS, PROMPT_TEMPLATES, HISTORY, LEADERBOARD, BENCHMARKS };
