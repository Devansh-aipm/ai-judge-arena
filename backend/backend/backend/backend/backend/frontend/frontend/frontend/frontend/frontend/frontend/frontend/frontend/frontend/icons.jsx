// Lightweight inline icons (24-grid, 1.5 stroke). Plus original model glyphs.

const ico = (paths, vb = "0 0 24 24") => ({ size = 16, className = "", style }) => (
  <svg width={size} height={size} viewBox={vb} fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
       className={className} style={style}>
    {paths}
  </svg>
);

const Icon = {
  Sparkle: ico(<>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M5.5 18.5l2.8-2.8M15.7 8.3l2.8-2.8" />
  </>),
  Arrow: ico(<>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </>),
  ArrowUp: ico(<>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </>),
  Check: ico(<>
    <path d="M5 12.5l4 4L19 7" />
  </>),
  Crown: ico(<>
    <path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z" />
  </>),
  Bolt: ico(<>
    <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" />
  </>),
  Settings: ico(<>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </>),
  History: ico(<>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3 2" />
  </>),
  Trophy: ico(<>
    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" />
    <path d="M17 5h3a3 3 0 0 1-3 5M7 5H4a3 3 0 0 0 3 5" />
  </>),
  Beaker: ico(<>
    <path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V3" />
    <path d="M7 14h10" />
  </>),
  Plus: ico(<><path d="M12 5v14M5 12h14"/></>),
  Minus: ico(<><path d="M5 12h14"/></>),
  X: ico(<><path d="M6 6l12 12M18 6L6 18"/></>),
  Chevron: ico(<><path d="M6 9l6 6 6-6"/></>),
  ChevronUp: ico(<><path d="M18 15l-6-6-6 6"/></>),
  Copy: ico(<><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></>),
  Share: ico(<><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v14"/></>),
  Filter: ico(<><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/></>),
  Star: ico(<><path d="M12 3l2.7 5.5 6 .9-4.4 4.3 1 6L12 17l-5.4 2.8 1-6L3.3 9.4l6-.9L12 3z"/></>),
  Pin: ico(<><path d="M12 17v5M9 4h6l-1 4 4 3v3H6v-3l4-3-1-4z"/></>),
  Save: ico(<><path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M7 4v5h8V4M7 14h10v6H7z"/></>),
  Export: ico(<><path d="M12 3v12M7 8l5-5 5 5M5 17v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"/></>),
  Compact: ico(<><path d="M4 6h16M4 12h16M4 18h16"/></>),
  Eye: ico(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>),
  Search: ico(<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>),
  Send: ico(<><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></>),
  Lock: ico(<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>),
  Globe: ico(<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>),
  Brain: ico(<><path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5 3 3 0 0 0 2 5v1a3 3 0 0 0 6 0V4a3 3 0 0 0-3 0z"/><path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5 3 3 0 0 1-2 5v1a3 3 0 0 1-6 0"/></>),
  Shield: ico(<><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/></>),
  Target: ico(<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></>),
  Layers: ico(<><path d="M12 2l10 6-10 6L2 8l10-6z"/><path d="M2 14l10 6 10-6M2 11l10 6 10-6"/></>),
  Refresh: ico(<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>),
  Spark: ico(<><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></>),
  Dot: ico(<><circle cx="12" cy="12" r="3" fill="currentColor"/></>),
};

// Original model glyphs (NOT real brand logos).
const ModelGlyph = {
  // C-1 — concentric arcs
  C1: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13" stroke={color} strokeWidth="1.2" opacity="0.35"/>
      <path d="M16 4a12 12 0 0 1 0 24" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M16 9a7 7 0 0 1 0 14" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="16" cy="16" r="2.2" fill={color}/>
    </svg>
  ),
  // G-4 — hexagram
  G4: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <polygon points="16,4 27,22 5,22" stroke={color} strokeWidth="1.4" strokeLinejoin="round" opacity="0.7"/>
      <polygon points="16,28 5,10 27,10" stroke={color} strokeWidth="1.4" strokeLinejoin="round" opacity="0.7"/>
      <circle cx="16" cy="16" r="1.6" fill={color}/>
    </svg>
  ),
  // M-2 — star tetrahedron
  M2: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 3 L29 25 L3 25 Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M16 3 L23 16 L9 16 Z" stroke={color} strokeWidth="1" strokeLinejoin="round" opacity="0.55"/>
      <circle cx="16" cy="20" r="1.6" fill={color}/>
    </svg>
  ),
};

window.Icon = Icon;
window.ModelGlyph = ModelGlyph;
