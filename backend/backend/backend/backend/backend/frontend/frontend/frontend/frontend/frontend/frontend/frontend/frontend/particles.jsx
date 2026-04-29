// Subtle, slow-drifting particles. Additive light.
const Particles = ({ density = 60, intensity = 0.18 }) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, w, h, dpr;
    const parts = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = [
      [200, 230, 255],
      [180, 255, 220],
      [220, 200, 255],
      [255, 240, 220],
    ];
    for (let i = 0; i < density; i++) {
      parts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.06,
        vy: -0.03 - Math.random() * 0.08,
        r: 0.4 + Math.random() * 1.6,
        a: 0.05 + Math.random() * intensity,
        c: colors[Math.floor(Math.random() * colors.length)],
        ph: Math.random() * Math.PI * 2,
      });
    }

    const tick = (t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.ph += 0.01;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        const flicker = 0.7 + Math.sin(p.ph) * 0.3;
        const a = p.a * flicker;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
        grad.addColorStop(0, `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${a})`);
        grad.addColorStop(1, `rgba(${p.c[0]},${p.c[1]},${p.c[2]},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 8, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [density, intensity]);

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed", inset: 0, width: "100%", height: "100%",
        zIndex: 0, pointerEvents: "none",
      }}
    />
  );
};

window.Particles = Particles;
