// Portal Login — split-screen, brand left / form right.
// Stub auth that checks against a hardcoded user list (to be replaced with Google Sheets / OAuth later).

const { useState: useStateLogin, useEffect: useEffectLogin, useRef: useRefLogin } = React;

const PORTAL_USERS = [
  { email: "scott@shrunk.ai",   password: "wasteeye", name: "Scott Horsnell", initials: "SH", role: "owner", title: "Director" },
  { email: "lina@shrunk.ai",    password: "wasteeye", name: "Lina Bryant",    initials: "LB", role: "admin", title: "Sales operations" },
  { email: "jordan@shrunk.ai",  password: "wasteeye", name: "Jordan Park",    initials: "JP", role: "sales", title: "Sales rep · Vic/NSW" },
  { email: "alex@shrunk.ai",    password: "wasteeye", name: "Alex Yoon",      initials: "AY", role: "sales", title: "Sales rep · Qld" },
  { email: "partner@cbre.com",  password: "wasteeye", name: "CBRE Partner",   initials: "CB", role: "partner", title: "Channel partner" },
];

function PortalLogin({ onLogin, users }) {
  const [email, setEmail] = useStateLogin("");
  const [password, setPassword] = useStateLogin("");
  const [error, setError] = useStateLogin(null);
  const [remember, setRemember] = useStateLogin(true);
  const [showDemoMenu, setShowDemoMenu] = useStateLogin(false);
  const [submitting, setSubmitting] = useStateLogin(false);
  const [resetOpen, setResetOpen] = useStateLogin(false);
  const [resetEmail, setResetEmail] = useStateLogin("");
  const [resetState, setResetState] = useStateLogin(null); // null | 'sending' | 'sent' | { error }
  const [helpOpen, setHelpOpen] = useStateLogin(false);
  const [privacyOpen, setPrivacyOpen] = useStateLogin(false);
  const canvasRef = useRefLogin(null);

  const openReset = () => {
    setResetEmail(email || "");
    setResetState(null);
    setResetOpen(true);
  };
  const submitReset = (e) => {
    if (e) e.preventDefault();
    const v = resetEmail.trim().toLowerCase();
    if (!v) { setResetState({ error: "Enter your email address." }); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { setResetState({ error: "That doesn't look like a valid email." }); return; }
    setResetState("sending");
    setTimeout(() => {
      // For demo: we always show "sent" — never reveal whether the email exists
      setResetState("sent");
    }, 700);
  };

  // ── Three.js scene ──
  useEffectLogin(() => {
    if (!window.THREE || !canvasRef.current) return;
    const THREE = window.THREE;
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const resize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle network — ~110 dots in a sphere, lines between close pairs
    const group = new THREE.Group();
    scene.add(group);

    const COUNT = 110;
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const C_CYAN    = new THREE.Color(0x5FA3FF);
    const C_MAGENTA = new THREE.Color(0xE94CD4);
    const C_AZURE   = new THREE.Color(0x7FB3F9);

    const R = 6.4;
    for (let i = 0; i < COUNT; i++) {
      // Random point inside a sphere
      const u = Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const r = R * Math.cbrt(u);
      positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i*3+2] = r * Math.cos(phi);
      velocities[i*3]   = (Math.random() - 0.5) * 0.0035;
      velocities[i*3+1] = (Math.random() - 0.5) * 0.0035;
      velocities[i*3+2] = (Math.random() - 0.5) * 0.0035;
      // Colour by position — mix three brand colors
      const t = (positions[i*3] + R) / (2*R);
      const c = new THREE.Color();
      if (t < 0.5) c.copy(C_AZURE).lerp(C_CYAN, t*2);
      else c.copy(C_CYAN).lerp(C_MAGENTA, (t-0.5)*2);
      colors[i*3]   = c.r;
      colors[i*3+1] = c.g;
      colors[i*3+2] = c.b;
    }

    // Particle dots
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.13,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(pGeo, pMat);
    group.add(points);

    // Larger glow halo (sprite-like) using a bigger PointsMaterial
    const haloMat = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.18,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halos = new THREE.Points(pGeo, haloMat);
    group.add(halos);

    // Connecting lines
    const MAX_LINES = 600;
    const linePos = new Float32Array(MAX_LINES * 2 * 3);
    const lineCol = new Float32Array(MAX_LINES * 2 * 3);
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    lGeo.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));
    lGeo.setDrawRange(0, 0);
    const lMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(lGeo, lMat);
    group.add(lines);

    // Central pulsing ring
    const ringGeo = new THREE.RingGeometry(2.4, 2.55, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x5FA3FF, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.3;
    group.add(ring);

    // Mouse parallax
    let mx = 0, my = 0, tx = 0, ty = 0;
    const onMouse = (e) => {
      const rect = parent.getBoundingClientRect();
      mx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      my = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    };
    parent.addEventListener("mousemove", onMouse);

    // Animation loop
    const LINK_DIST = 2.7;
    const LINK_DIST_SQ = LINK_DIST * LINK_DIST;
    let running = true;
    let frame = 0;
    const animate = () => {
      if (!running) return;
      frame++;

      // Smooth mouse follow
      tx += (mx - tx) * 0.04;
      ty += (my - ty) * 0.04;
      group.rotation.y += 0.0014 + tx * 0.003;
      group.rotation.x = -ty * 0.18;

      // Move particles slowly, bounce within sphere
      const pArr = pGeo.attributes.position.array;
      for (let i = 0; i < COUNT; i++) {
        pArr[i*3]   += velocities[i*3];
        pArr[i*3+1] += velocities[i*3+1];
        pArr[i*3+2] += velocities[i*3+2];
        const x = pArr[i*3], y = pArr[i*3+1], z = pArr[i*3+2];
        const d2 = x*x + y*y + z*z;
        if (d2 > R*R) {
          // Reflect velocity (simple inward push)
          const len = Math.sqrt(d2);
          const nx = x / len, ny = y / len, nz = z / len;
          const dot = velocities[i*3]*nx + velocities[i*3+1]*ny + velocities[i*3+2]*nz;
          velocities[i*3]   -= 2*dot*nx;
          velocities[i*3+1] -= 2*dot*ny;
          velocities[i*3+2] -= 2*dot*nz;
        }
      }
      pGeo.attributes.position.needsUpdate = true;

      // Rebuild lines between close pairs (skip frames for perf)
      if (frame % 2 === 0) {
        let li = 0;
        for (let i = 0; i < COUNT && li < MAX_LINES; i++) {
          for (let j = i + 1; j < COUNT && li < MAX_LINES; j++) {
            const dx = pArr[i*3]   - pArr[j*3];
            const dy = pArr[i*3+1] - pArr[j*3+1];
            const dz = pArr[i*3+2] - pArr[j*3+2];
            const d2 = dx*dx + dy*dy + dz*dz;
            if (d2 < LINK_DIST_SQ) {
              linePos[li*6]   = pArr[i*3];
              linePos[li*6+1] = pArr[i*3+1];
              linePos[li*6+2] = pArr[i*3+2];
              linePos[li*6+3] = pArr[j*3];
              linePos[li*6+4] = pArr[j*3+1];
              linePos[li*6+5] = pArr[j*3+2];
              // Colour interpolated
              lineCol[li*6]   = colors[i*3];
              lineCol[li*6+1] = colors[i*3+1];
              lineCol[li*6+2] = colors[i*3+2];
              lineCol[li*6+3] = colors[j*3];
              lineCol[li*6+4] = colors[j*3+1];
              lineCol[li*6+5] = colors[j*3+2];
              li++;
            }
          }
        }
        lGeo.setDrawRange(0, li * 2);
        lGeo.attributes.position.needsUpdate = true;
        lGeo.attributes.color.needsUpdate = true;
      }

      // Ring pulse
      const pulse = 1 + Math.sin(frame * 0.025) * 0.04;
      ring.scale.set(pulse, pulse, pulse);
      ringMat.opacity = 0.14 + Math.sin(frame * 0.025) * 0.05;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      running = false;
      window.removeEventListener("resize", resize);
      parent.removeEventListener("mousemove", onMouse);
      pGeo.dispose(); pMat.dispose(); haloMat.dispose();
      lGeo.dispose(); lMat.dispose();
      ringGeo.dispose(); ringMat.dispose();
      renderer.dispose();
    };
  }, []);

  const submit = (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setError(null);
    const tryEmail = email.trim().toLowerCase();
    const tryPw = String(password);
    (async () => {
      // If a Sheets backend is configured, try users tab first
      const url = window.WEBackend && window.WEBackend.getUrl();
      if (url) {
        try {
          console.log("[login] querying Sheets backend for users…", url);
          const remote = await window.WEBackend.pullTab("users");
          console.log("[login] backend returned", remote);
          if (Array.isArray(remote) && remote.length) {
            const user = remote.find(u => {
              const ue = String(u.email || "").trim().toLowerCase();
              const up = String(u.password || "");
              return ue === tryEmail && up === tryPw;
            });
            if (user) {
              if (user.suspended === true || user.suspended === "TRUE" || user.suspended === "true" || user.suspended === 1) {
                setError("Account suspended. Contact your admin to restore access.");
                setSubmitting(false);
                return;
              }
              console.log("[login] matched user from Sheets:", user.email);
              onLogin({
                email: String(user.email).trim(),
                name: user.name || user.email,
                initials: user.initials || (String(user.name||"??").slice(0,2).toUpperCase()),
                role: user.role || "sales",
                title: user.title || "",
                loggedInAt: Date.now(),
              }, remember);
              return;
            }
            console.warn("[login] backend reachable, no match for", tryEmail, "— rows:", remote.length);
            setError(`Email or password not recognised in Sheets backend (${remote.length} user${remote.length===1?"":"s"} checked).`);
            setSubmitting(false);
            return;
          }
          console.warn("[login] backend reachable but users tab empty — falling back to local list");
        } catch (err) {
          console.error("[login] Sheets backend error, falling back to local users:", err);
        }
      }
      // Local users fallback (also covers the unconfigured case)
      setTimeout(() => {
        const user = (users && users.length ? users : PORTAL_USERS).find(
          (u) => u.email.toLowerCase() === tryEmail && u.password === password
        );
        if (!user) {
          setError("Email or password not recognised. Try one of the demo accounts on the right.");
          setSubmitting(false);
          return;
        }
        if (user.suspended) {
          setError("Account suspended. Contact your admin to restore access.");
          setSubmitting(false);
          return;
        }
        // Detect if this user came from the hardcoded demo pool — mark session as demo so
        // changes won't be pushed to the production Sheets backend.
        const fromHardcodedDemoPool = PORTAL_USERS.some(d => d.email.toLowerCase() === tryEmail);
        const session = {
          email: user.email, name: user.name, initials: user.initials,
          role: user.role, title: user.title,
          loggedInAt: Date.now(),
          isDemo: fromHardcodedDemoPool,
        };
        onLogin(session, remember);
      }, 350);
    })();
  };

  const useDemo = (u) => {
    setEmail(u.email);
    setPassword(u.password);
    setShowDemoMenu(false);
    setError(null);
  };

  const css = `
    .pl {
      min-height:100vh;
      display:grid; grid-template-columns:1.1fr 1fr;
      font-family:'Source Sans 3',sans-serif;
      -webkit-font-smoothing:antialiased; font-feature-settings:"ss01","tnum";
      background:#fff;
    }
    .pl .serif { font-family:'Source Serif 4',Georgia,serif; }
    .pl .mono  { font-family:'JetBrains Mono',monospace; font-feature-settings:"tnum"; }

    /* ── LEFT: brand panel ── */
    .pl-brand {
      position:relative;
      background:
        radial-gradient(60% 60% at 20% 20%, rgba(95,163,255,0.16) 0%, transparent 60%),
        radial-gradient(50% 50% at 90% 80%, rgba(126,75,255,0.14) 0%, transparent 65%),
        linear-gradient(135deg, #0B2244 0%, #0A1628 50%, #0A1628 100%);
      color:#fff;
      padding:48px 56px;
      display:flex; flex-direction:column;
      overflow:hidden;
    }

    /* Decorative grid in background */
    .pl-brand::before {
      content:""; position:absolute; inset:0;
      background-image:
        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size:48px 48px;
      pointer-events:none;
      mask-image:radial-gradient(ellipse at top, #000 0%, transparent 70%);
    }
    .pl-brand > * { position:relative; }
    .pl-three {
      position:absolute !important; inset:0; width:100%; height:100%;
      z-index:1; pointer-events:none;
      mask-image:radial-gradient(ellipse at 60% 40%, #000 30%, rgba(0,0,0,0.45) 70%, transparent 100%);
      -webkit-mask-image:radial-gradient(ellipse at 60% 40%, #000 30%, rgba(0,0,0,0.45) 70%, transparent 100%);
    }
    .pl-brand-hd, .pl-brand-body, .pl-brand-foot { z-index:2; }

    .pl-brand-hd { display:flex; align-items:center; gap:14px; }
    .pl-brand-logo { height:42px; width:auto; display:block; filter:drop-shadow(0 3px 10px rgba(0,0,0,0.35)); }
    .pl-brand-hd .lbl { font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(255,255,255,0.5); font-weight:700; line-height:1.4; }
    .pl-brand-hd .lbl b { color:#fff; font-weight:700; }

    .pl-brand-body {
      margin-top:auto;
      max-width:540px;
    }
    .pl-brand-body .eyebrow {
      font-size:11px; letter-spacing:0.2em; text-transform:uppercase;
      color:#7FB3F9; font-weight:700; margin-bottom:18px;
      display:inline-flex; align-items:center; gap:10px;
      padding:5px 11px 5px 8px;
      background:rgba(127,179,249,0.08);
      border:1px solid rgba(127,179,249,0.18);
      border-radius:14px;
      opacity:0; animation:plFadeUp 0.6s ease-out 0.15s forwards;
    }
    .pl-brand-body .eyebrow .live-dot {
      width:6px; height:6px; border-radius:50%; background:#5BD08F;
      box-shadow:0 0 0 0 rgba(91,208,143,0.6);
      animation:plPulse 2s ease-in-out infinite;
    }
    @keyframes plPulse {
      0%, 100% { box-shadow:0 0 0 0 rgba(91,208,143,0.5); }
      50%      { box-shadow:0 0 0 6px rgba(91,208,143,0); }
    }
    @keyframes plFadeUp {
      from { opacity:0; transform:translateY(14px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes plWordIn {
      from { opacity:0; transform:translateY(20px); filter:blur(6px); }
      to   { opacity:1; transform:translateY(0); filter:blur(0); }
    }
    @keyframes plShimmer {
      0%   { background-position:-200% center; }
      100% { background-position:200% center; }
    }
    .pl-brand-body h1 {
      font-family:'Source Serif 4',serif; font-size:46px; font-weight:600;
      line-height:1.08; letter-spacing:-0.02em; margin:0 0 18px; color:#fff;
    }
    .pl-brand-body h1 .w {
      display:inline-block; opacity:0; will-change:transform, opacity, filter;
      animation:plWordIn 0.7s cubic-bezier(0.2,0.7,0.3,1) forwards;
    }
    .pl-brand-body h1 .accent {
      background:linear-gradient(90deg, #fff 0%, #7FB3F9 30%, #E94CD4 55%, #fff 80%);
      background-size:200% 100%;
      -webkit-background-clip:text; background-clip:text;
      color:transparent;
      animation:plWordIn 0.7s cubic-bezier(0.2,0.7,0.3,1) forwards, plShimmer 6s linear infinite 1.2s;
    }
    .pl-brand-body p {
      font-size:15.5px; line-height:1.6; color:rgba(255,255,255,0.74);
      margin:0 0 22px; max-width:480px;
      opacity:0; animation:plFadeUp 0.7s ease-out 0.7s forwards;
    }
    .pl-brand-stat {
      display:flex; gap:22px; margin:0 0 28px; padding:14px 0;
      border-top:1px solid rgba(255,255,255,0.1);
      border-bottom:1px solid rgba(255,255,255,0.1);
      opacity:0; animation:plFadeUp 0.7s ease-out 0.85s forwards;
    }
    .pl-brand-stat .s { display:flex; flex-direction:column; gap:2px; }
    .pl-brand-stat .s .v {
      font-family:'JetBrains Mono',monospace; font-size:20px; font-weight:600;
      color:#fff; letter-spacing:-0.01em; line-height:1;
      background:linear-gradient(90deg, #7FB3F9, #fff);
      -webkit-background-clip:text; background-clip:text; color:transparent;
    }
    .pl-brand-stat .s .k {
      font-size:10px; letter-spacing:0.14em; text-transform:uppercase;
      color:rgba(255,255,255,0.55); font-weight:600;
    }
    .pl-brand-stat .div { width:1px; background:rgba(255,255,255,0.1); }

    .pl-feats { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .pl-feat {
      display:flex; gap:13px; align-items:flex-start;
      padding:14px 16px;
      background:linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
      border:1px solid rgba(255,255,255,0.08);
      border-radius:10px;
      position:relative; overflow:hidden;
      opacity:0; transform:translateY(20px);
      animation:plFadeUp 0.6s cubic-bezier(0.2,0.7,0.3,1) forwards;
      transition:border-color 0.25s, transform 0.25s, background 0.25s;
    }
    .pl-feat::before {
      content:""; position:absolute; left:0; top:0; bottom:0; width:2px;
      background:linear-gradient(180deg, #7FB3F9, #E94CD4);
      transform:scaleY(0); transform-origin:top;
      transition:transform 0.3s cubic-bezier(0.2,0.7,0.3,1);
    }
    .pl-feat::after {
      content:""; position:absolute; inset:-1px;
      background:linear-gradient(120deg, transparent 30%, rgba(127,179,249,0.18) 50%, transparent 70%);
      transform:translateX(-100%); pointer-events:none;
      transition:transform 0.7s ease;
    }
    .pl-feat:hover {
      border-color:rgba(127,179,249,0.3);
      background:linear-gradient(135deg, rgba(127,179,249,0.08) 0%, rgba(233,76,212,0.04) 100%);
      transform:translateY(-2px);
    }
    .pl-feat:hover::before { transform:scaleY(1); }
    .pl-feat:hover::after { transform:translateX(100%); }
    .pl-feat:nth-child(1) { animation-delay:1.05s; }
    .pl-feat:nth-child(2) { animation-delay:1.18s; }
    .pl-feat:nth-child(3) { animation-delay:1.31s; }
    .pl-feat .ic {
      width:36px; height:36px; flex-shrink:0;
      background:rgba(255,255,255,0.06);
      border:1px solid rgba(255,255,255,0.12);
      border-radius:8px;
      display:grid; place-items:center;
      color:#7FB3F9;
      transition:color 0.25s, background 0.25s, transform 0.25s;
    }
    .pl-feat .ic svg { width:18px; height:18px; }
    .pl-feat:hover .ic {
      color:#fff;
      background:linear-gradient(135deg, rgba(127,179,249,0.25), rgba(233,76,212,0.18));
      transform:scale(1.08);
    }
    .pl-feat .tt { font-size:14px; font-weight:600; color:#fff; line-height:1.3; }
    .pl-feat .ds { font-size:12.5px; color:rgba(255,255,255,0.6); margin-top:3px; line-height:1.45; }
    .pl-feat:hover .ds { color:rgba(255,255,255,0.85); }

    .pl-brand-foot {
      margin-top:auto;
      padding-top:32px;
      display:flex; justify-content:space-between; align-items:center;
      font-size:11.5px; color:rgba(255,255,255,0.4);
      letter-spacing:0.04em;
    }
    .pl-brand-foot .l { display:flex; align-items:center; gap:14px; }
    .pl-brand-foot .live { display:inline-flex; align-items:center; gap:6px; color:rgba(255,255,255,0.55); }
    .pl-brand-foot .live .d { width:5px; height:5px; background:#5BD08F; border-radius:50%; box-shadow:0 0 0 3px rgba(91,208,143,0.18); }
    .pl-brand-foot .r { font-family:'JetBrains Mono',monospace; }

    /* ── RIGHT: login form ── */
    .pl-form-wrap {
      display:flex; flex-direction:column; justify-content:center;
      padding:48px 64px;
      max-width:540px;
      margin:0 auto;
      width:100%;
      box-sizing:border-box;
    }
    .pl-form-eyebrow {
      font-size:11px; letter-spacing:0.18em; text-transform:uppercase;
      color:var(--blue-deep,#0F3FA8); font-weight:700;
    }
    .pl-form-h {
      font-family:'Source Serif 4',serif; font-size:32px; font-weight:600;
      letter-spacing:-0.015em; margin:6px 0 8px; line-height:1.15;
      color:#0A1628;
    }
    .pl-form-sub {
      font-size:14px; color:#5A6C82; margin:0 0 28px; line-height:1.55;
    }

    .pl-error {
      padding:11px 14px;
      background:#FEF2F2; color:#991B1B;
      border:1px solid #FCA5A5; border-radius:7px;
      font-size:13px; line-height:1.5;
      margin-bottom:16px;
      display:flex; gap:9px;
    }
    .pl-error svg { width:16px; height:16px; flex-shrink:0; margin-top:1px; }

    .pl-field { margin-bottom:14px; }
    .pl-field > label {
      display:block;
      font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase;
      color:#5A6C82; font-weight:700; margin-bottom:7px;
    }
    .pl-input {
      width:100%; box-sizing:border-box;
      padding:13px 15px;
      border:1.5px solid #D5DEEC; border-radius:8px;
      background:#fff;
      font:inherit; font-size:15px; color:#0A1628;
      outline:none; transition:border-color 0.15s, box-shadow 0.15s;
    }
    .pl-input::placeholder { color:#9FAEC4; }
    .pl-input:focus { border-color:#1F5CD9; box-shadow:0 0 0 4px rgba(31,92,217,0.12); }
    .pl-input:disabled { background:#F4F6FA; color:#5A6C82; }

    .pl-row { display:flex; align-items:center; justify-content:space-between; margin:6px 0 22px; }
    .pl-check { display:inline-flex; align-items:center; gap:8px; cursor:pointer; user-select:none; }
    .pl-check input { width:16px; height:16px; accent-color:#1F5CD9; cursor:pointer; }
    .pl-check span { font-size:13px; color:#2A3B52; }
    .pl-fp { font-size:13px; color:#1F5CD9; text-decoration:none; cursor:pointer; background:none; border:none; padding:0; font-family:inherit; }
    .pl-fp:hover { text-decoration:underline; }

    .pl-submit {
      width:100%; padding:14px 18px;
      background:#0A1628; color:#fff;
      border:none; border-radius:8px;
      font:inherit; font-size:14px; font-weight:600;
      letter-spacing:0.04em; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:10px;
      transition:background 0.15s, transform 0.05s;
    }
    .pl-submit:hover { background:#0F3FA8; }
    .pl-submit:active { transform:translateY(1px); }
    .pl-submit:disabled { background:#9FAEC4; cursor:wait; }
    .pl-submit svg { width:16px; height:16px; }

    .pl-spinner {
      width:14px; height:14px; border-radius:50%;
      border:2px solid rgba(255,255,255,0.3); border-top-color:#fff;
      animation:plSpin 0.7s linear infinite;
    }
    @keyframes plSpin { to { transform:rotate(360deg); } }

    .pl-divider {
      display:flex; align-items:center; gap:14px;
      margin:28px 0 18px;
      font-size:11px; letter-spacing:0.14em; text-transform:uppercase;
      color:#9FAEC4; font-weight:600;
    }
    .pl-divider::before, .pl-divider::after {
      content:""; flex:1; height:1px; background:#E5ECF5;
    }

    /* Demo accounts */
    .pl-demo {
      background:#F4F7FB;
      border:1px solid #E5ECF5;
      border-radius:10px;
      padding:16px 18px;
    }
    .pl-demo-h {
      display:flex; align-items:center; justify-content:space-between;
      cursor:pointer;
    }
    .pl-demo-h .ttl {
      font-size:12.5px; font-weight:600; color:#0A1628;
      display:flex; align-items:center; gap:8px;
    }
    .pl-demo-h .ttl svg { width:14px; height:14px; color:#5A6C82; }
    .pl-demo-h .ttl .pill {
      font-size:10px; letter-spacing:0.08em; text-transform:uppercase;
      padding:2px 7px; background:#E4EDFB; color:#0F3FA8;
      border-radius:9px; font-weight:700;
    }
    .pl-demo-h .chev { font-size:14px; color:#5A6C82; }

    .pl-demo-list { display:flex; flex-direction:column; gap:6px; margin-top:12px; }
    .pl-demo-row {
      display:grid; grid-template-columns:32px 1fr auto;
      align-items:center; gap:10px;
      padding:9px 11px;
      background:#fff;
      border:1px solid #E5ECF5;
      border-radius:7px;
      cursor:pointer;
      transition:all 0.1s;
      font:inherit; text-align:left;
      width:100%; box-sizing:border-box;
    }
    .pl-demo-row:hover { background:#E4EDFB; border-color:#1F5CD9; }
    .pl-demo-row .avatar {
      width:30px; height:30px; border-radius:50%;
      background:linear-gradient(135deg, #1F5CD9 0%, #0F3FA8 100%); color:#fff;
      display:grid; place-items:center;
      font-size:11px; font-weight:700; letter-spacing:0.04em;
    }
    .pl-demo-row .nm { font-size:13px; font-weight:600; color:#0A1628; line-height:1.25; }
    .pl-demo-row .em { font-size:11.5px; color:#5A6C82; font-family:'JetBrains Mono',monospace; margin-top:1px; }
    .pl-demo-row .role-pill {
      font-size:10px; padding:2px 8px; border-radius:9px;
      font-weight:700; letter-spacing:0.06em; text-transform:uppercase;
    }
    .pl-demo-row .role-pill.admin   { background:#FEF3E2; color:#B85C00; }
    .pl-demo-row .role-pill.sales   { background:#E4EDFB; color:#0F3FA8; }
    .pl-demo-row .role-pill.partner { background:#F3E8FF; color:#6B21A8; }

    .pl-foot {
      margin-top:32px; padding-top:20px;
      border-top:1px solid #EAEEF4;
      font-size:11.5px; color:#5A6C82;
      display:flex; justify-content:space-between; align-items:center;
      flex-wrap:wrap; gap:10px;
    }
    .pl-foot a { color:#5A6C82; text-decoration:none; }
    .pl-foot a:hover { color:#0A1628; text-decoration:underline; }
    .pl-foot .copy { font-family:'JetBrains Mono',monospace; }

    @media (max-width:980px) {
      .pl { grid-template-columns:1fr; }
      .pl-brand { padding:32px; min-height:auto; }
      .pl-brand-body h1 { font-size:30px; }
      .pl-feats { grid-template-columns:1fr; }
      .pl-form-wrap { padding:36px 28px; }
    }
  `;

  return (
    <div className="pl">
      <style>{css}</style>

      {/* LEFT — brand panel */}
      <div className="pl-brand">
        <canvas ref={canvasRef} className="pl-three"></canvas>
        <div className="pl-brand-hd">
          <img className="pl-brand-logo" src={(window.__resources && window.__resources.shrunkLogo) || "assets/shrunk-logo.png"} alt="Shrunk" />
          <div className="lbl">
            <div><b>WastEye</b></div>
            <div>Sales portal</div>
          </div>
        </div>

        <div className="pl-brand-body">
        </div>

        <div className="pl-brand-foot">
          <div className="l">
            <span className="live"><span className="d"></span>Portal v1.2 · all systems normal</span>
          </div>
          <div className="r">© 2026 Shrunk Innovation Group</div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div className="pl-form-wrap">
        <div className="pl-form-eyebrow">Sign in</div>
        <h2 className="pl-form-h">Welcome back.</h2>
        <p className="pl-form-sub">Use your Shrunk email to access the portal. Reach out to <a href="mailto:scott@shrunk.ai" style={{color:"#1F5CD9", textDecoration:"none"}}>scott@shrunk.ai</a> if you need an account.</p>

        {error && (
          <div className="pl-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={submit}>
          <div className="pl-field">
            <label>Email</label>
            <input
              type="email"
              className="pl-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@shrunk.ai"
              autoFocus
              autoComplete="email"
              disabled={submitting}
            />
          </div>

          <div className="pl-field">
            <label>Password</label>
            <input
              type="password"
              className="pl-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={submitting}
            />
          </div>

          <div className="pl-row">
            <label className="pl-check">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Keep me signed in</span>
            </label>
            <button type="button" className="pl-fp" onClick={openReset}>Forgot password?</button>
          </div>

          <button type="submit" className="pl-submit" disabled={submitting}>
            {submitting ? (
              <>
                <span className="pl-spinner"></span>
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </>
            )}
          </button>
        </form>

        <div className="pl-divider">Quick access · demo accounts</div>

        <div className="pl-demo">
          <div className="pl-demo-h" onClick={() => setShowDemoMenu(!showDemoMenu)}>
            <div className="ttl">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M3 12h2M19 12h2M12 3v2M12 19v2"/></svg>
              Sign in as a demo user
              <span className="pill">prototype</span>
            </div>
            <span className="chev">{showDemoMenu ? "▾" : "▸"}</span>
          </div>
          {showDemoMenu && (
            <div className="pl-demo-list">
              {(users && users.length ? users : PORTAL_USERS).map((u) => (
                <button key={u.email} className="pl-demo-row" onClick={() => useDemo(u)}>
                  <div className="avatar">{u.initials}</div>
                  <div>
                    <div className="nm">{u.name} <span style={{color:"#8B98AD", fontWeight:500, fontSize:12, marginLeft:4}}>· {u.title}</span></div>
                    <div className="em">{u.email}</div>
                  </div>
                  <div className={`role-pill ${u.role}`}>{u.role}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pl-foot">
          <span className="copy">© 2026 Shrunk Innovation Group</span>
          <div style={{display:"flex", gap:14}}>
            <a href="https://shrunk.ai" target="_blank" rel="noopener noreferrer">shrunk.ai</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setHelpOpen(true); }}>Help</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setPrivacyOpen(true); }}>Privacy</a>
          </div>
        </div>
      </div>

      {resetOpen && (
        <PLModal title="Reset your password" onClose={() => setResetOpen(false)}>
          {resetState === "sent" ? (
            <div className="pl-modal-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
              <h3>Check your inbox</h3>
              <p>If <b>{resetEmail}</b> matches an account, a password reset link is on its way. The link expires in 30 minutes.</p>
              <p className="pl-modal-fine">Don't see it? Check spam, or wait a minute — corporate mail filters can hold these. Still nothing after 5 minutes? Email <a href="mailto:scott@shrunk.ai">scott@shrunk.ai</a>.</p>
              <button className="pl-modal-btn primary" onClick={() => setResetOpen(false)}>Done</button>
            </div>
          ) : (
            <form onSubmit={submitReset}>
              <p className="pl-modal-lede">Enter the email address you sign in with. If we find a match, we'll send a reset link to that address.</p>
              <div className="pl-field">
                <label>Email</label>
                <input
                  type="email"
                  className="pl-input"
                  value={resetEmail}
                  onChange={(e) => { setResetEmail(e.target.value); if (resetState && resetState.error) setResetState(null); }}
                  placeholder="you@shrunk.ai"
                  autoFocus
                  disabled={resetState === "sending"}
                />
              </div>
              {resetState && resetState.error && (
                <div className="pl-modal-err">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  {resetState.error}
                </div>
              )}
              <div className="pl-modal-actions">
                <button type="button" className="pl-modal-btn ghost" onClick={() => setResetOpen(false)} disabled={resetState === "sending"}>Cancel</button>
                <button type="submit" className="pl-modal-btn primary" disabled={resetState === "sending"}>
                  {resetState === "sending" ? (<><span className="pl-spinner"></span>Sending…</>) : "Send reset link"}
                </button>
              </div>
            </form>
          )}
        </PLModal>
      )}

      {helpOpen && (
        <PLModal title="Help · WastEye Portal" onClose={() => setHelpOpen(false)}>
          <p className="pl-modal-lede">Quick answers to common sign-in questions.</p>
          <div className="pl-help">
            <div className="pl-help-item">
              <h4>I can't sign in</h4>
              <p>Confirm you're using your <b>@shrunk.ai</b> email, with the password set by your admin. If you've forgotten it, use <b>Forgot password?</b> below the sign-in form.</p>
            </div>
            <div className="pl-help-item">
              <h4>I don't have an account</h4>
              <p>Accounts are created by an admin. Ask <a href="mailto:scott@shrunk.ai">scott@shrunk.ai</a> to add you — they'll set your initial password and tell you what role (admin / sales / partner) you've been given.</p>
            </div>
            <div className="pl-help-item">
              <h4>What does "Keep me signed in" do?</h4>
              <p>Saves your session in this browser so you don't need to sign in on every visit. Untick it on shared computers.</p>
            </div>
            <div className="pl-help-item">
              <h4>I'm an admin — what can I do?</h4>
              <p>Pricing tables, scenarios, the tender library, product images, case studies, users, and the Sheets backend connection — all editable under the Admin tab once signed in.</p>
            </div>
            <div className="pl-help-item">
              <h4>Something looks broken</h4>
              <p>Email <a href="mailto:scott@shrunk.ai">scott@shrunk.ai</a> with a screenshot if you can. The portal is rapidly evolving and feedback shapes the next release.</p>
            </div>
          </div>
          <div className="pl-modal-actions">
            <button className="pl-modal-btn primary" onClick={() => setHelpOpen(false)}>Got it</button>
          </div>
        </PLModal>
      )}

      {privacyOpen && (
        <PLModal title="Privacy · WastEye Portal" onClose={() => setPrivacyOpen(false)}>
          <p className="pl-modal-lede">Plain-English summary of how this portal handles your data. Last updated May 2026.</p>
          <div className="pl-help">
            <div className="pl-help-item">
              <h4>Who's behind this portal</h4>
              <p>Shrunk Innovation Group Pty Ltd (ABN 15 653 930 691), Melbourne, Australia. Contact: <a href="mailto:scott@shrunk.ai">scott@shrunk.ai</a>.</p>
            </div>
            <div className="pl-help-item">
              <h4>What we collect</h4>
              <p>Your sign-in email, name and role. Quotes, tender selections, product image attachments and case studies you create. Timestamps and actions for the activity log.</p>
            </div>
            <div className="pl-help-item">
              <h4>Where it's stored</h4>
              <p>Right now: locally in your browser. Once the Google Sheets backend is connected, the same data is mirrored to a Sheet hosted on Google Cloud in the Sydney region (Australian data residency).</p>
            </div>
            <div className="pl-help-item">
              <h4>Who sees it</h4>
              <p>Other Shrunk staff with admin or sales access. We do <b>not</b> share portal data with third parties. Client data attached to quotes (names, contact details) is treated as your customer's PII and handled per the Australian Privacy Principles.</p>
            </div>
            <div className="pl-help-item">
              <h4>Cookies &amp; tracking</h4>
              <p>No tracking cookies. The portal uses your browser's localStorage to remember your sign-in and unsynced edits. Clearing browser data signs you out and discards anything not yet pushed to the backend.</p>
            </div>
            <div className="pl-help-item">
              <h4>Your rights</h4>
              <p>You can ask to see, correct or delete the data we hold about you. Email <a href="mailto:scott@shrunk.ai">scott@shrunk.ai</a> with the subject "Privacy request" and we'll respond within 30 days.</p>
            </div>
            <div className="pl-help-item">
              <h4>Security</h4>
              <p>Encrypted in transit (TLS 1.2+) and at rest on Google Cloud. Access is restricted to authorised Shrunk personnel. We follow ISO 27001-aligned controls; formal certification is on the FY27 roadmap.</p>
            </div>
          </div>
          <div className="pl-modal-actions">
            <button className="pl-modal-btn primary" onClick={() => setPrivacyOpen(false)}>Close</button>
          </div>
        </PLModal>
      )}
    </div>
  );
}

// ── Login modal helper ──
function PLModal({ title, onClose, children }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <style>{`
        .pl-modal-bg {
          position:fixed; inset:0;
          background:rgba(10,22,40,0.62);
          backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px);
          z-index:300; display:grid; place-items:center; padding:24px;
          animation:plmFade 0.18s ease-out;
        }
        @keyframes plmFade { from { opacity:0; } to { opacity:1; } }
        @keyframes plmRise { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        .pl-modal-box {
          background:#fff; border-radius:14px;
          box-shadow:0 30px 80px -20px rgba(10,22,40,0.55);
          width:min(520px, 100%); max-height:88vh;
          display:flex; flex-direction:column; overflow:hidden;
          animation:plmRise 0.2s cubic-bezier(0.2,0.7,0.3,1);
        }
        .pl-modal-hd {
          padding:18px 24px; border-bottom:1px solid #E5ECF5;
          display:flex; justify-content:space-between; align-items:center;
        }
        .pl-modal-hd .ttl { font-family:'Source Serif 4',serif; font-size:18px; font-weight:600; color:#0A1628; letter-spacing:-0.005em; }
        .pl-modal-hd .x { width:32px; height:32px; padding:0; background:transparent; border:1px solid #D5DEEC; border-radius:7px; color:#5A6C82; cursor:pointer; font-size:17px; line-height:1; display:grid; place-items:center; }
        .pl-modal-hd .x:hover { background:#F4F7FB; color:#0A1628; }
        .pl-modal-body { padding:22px 24px 8px; overflow-y:auto; }
        .pl-modal-lede { font-size:13.5px; line-height:1.55; color:#5A6C82; margin:0 0 16px; }
        .pl-modal-actions { display:flex; justify-content:flex-end; gap:8px; padding:16px 24px 22px; }
        .pl-modal-btn { padding:10px 18px; font:inherit; font-size:13px; font-weight:600; border-radius:8px; cursor:pointer; letter-spacing:0.02em; display:inline-flex; align-items:center; gap:8px; }
        .pl-modal-btn.primary { background:#0A1628; color:#fff; border:none; }
        .pl-modal-btn.primary:hover { background:#0F3FA8; }
        .pl-modal-btn.primary:disabled { background:#9FAEC4; cursor:wait; }
        .pl-modal-btn.ghost { background:#fff; color:#2A3B52; border:1px solid #D5DEEC; }
        .pl-modal-btn.ghost:hover { background:#F4F7FB; }
        .pl-modal-err {
          margin-top:10px; padding:10px 13px;
          background:#FEF2F2; color:#991B1B;
          border:1px solid #FCA5A5; border-radius:7px;
          font-size:13px; display:flex; gap:9px; align-items:center;
        }
        .pl-modal-err svg { width:16px; height:16px; flex-shrink:0; }
        .pl-modal-success { text-align:center; padding:8px 4px 4px; }
        .pl-modal-success svg { width:44px; height:44px; padding:10px; background:#DCFCE7; color:#15803D; border-radius:50%; margin-bottom:14px; }
        .pl-modal-success h3 { font-family:'Source Serif 4',serif; font-size:20px; font-weight:600; margin:0 0 8px; color:#0A1628; }
        .pl-modal-success p { font-size:13.5px; line-height:1.55; color:#5A6C82; margin:0 0 8px; }
        .pl-modal-success .pl-modal-fine { font-size:12px; color:#8B98AD; margin-top:12px; }
        .pl-modal-success .pl-modal-fine a, .pl-help a { color:#1F5CD9; text-decoration:none; }
        .pl-modal-success .pl-modal-fine a:hover, .pl-help a:hover { text-decoration:underline; }
        .pl-modal-success .pl-modal-btn { margin-top:18px; }
        .pl-help { display:flex; flex-direction:column; gap:14px; }
        .pl-help-item h4 { font-family:'Source Serif 4',serif; font-size:14.5px; font-weight:600; color:#0A1628; margin:0 0 4px; }
        .pl-help-item p { font-size:13px; line-height:1.55; color:#2A3B52; margin:0; }
      `}</style>
      <div className="pl-modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true">
        <div className="pl-modal-box">
          <div className="pl-modal-hd">
            <div className="ttl">{title}</div>
            <button className="x" onClick={onClose} title="Close">×</button>
          </div>
          <div className="pl-modal-body">{children}</div>
        </div>
      </div>
    </>
  );
}

window.PortalLogin = PortalLogin;
window.PORTAL_USERS = PORTAL_USERS;
