// Portal Calculator — V4 forked to BLUE palette, pulls live pricing tables from props.
// Layout: scenario carousel · 2-col config + sticky breakdown rail.

const { useState: useStateCalc, useMemo: useMemoCalc, useEffect: useEffectCalc } = React;

function PortalCalculator({ tables, input: ctrlInput, setInput: ctrlSetInput, activeQuote, onSaveDraft, onMarkSent, onNewQuote, onViewQuotes, session }) {
  // Support both controlled (from PortalApp) and uncontrolled standalone use.
  const [localInput, setLocalInput] = useStateCalc(() => ctrlInput || {
    client: "GreenTrack Retail Group",
    quoteRef: "WE-" + new Date().getFullYear() + "-" + String(Math.floor(100 + Math.random()*900)),
    sites: [{ ...WEP.emptySite(), name: "Flagship store · Collins St", wifi: 6, fourg: 2, days: 14, mobBand: "CBD" }],
    workshops: 0, trainings: 0, followUp: false,
    attachedImages: [],
    attachedCases: [],
  });
  const input = ctrlInput || localInput;
  const setInput = ctrlSetInput
    ? (updater) => ctrlSetInput((cur) => typeof updater === "function" ? updater(cur) : updater)
    : setLocalInput;
  const [activeSc, setActiveSc] = useStateCalc(null);
  const [activeSite, setActiveSite] = useStateCalc(0);
  const [scenariosOpen, setScenariosOpen] = useStateCalc(false);
  const [emailOpen, setEmailOpen] = useStateCalc(false);

  const result = useMemoCalc(() => WEP.calculate(input, tables), [input, tables]);

  const setSite = (i, patch) =>
    setInput((s) => ({ ...s, sites: s.sites.map((x, k) => (k === i ? { ...x, ...patch } : x)) }));
  const addSite = () => {
    setInput((s) => ({ ...s, sites: [...s.sites, { ...WEP.emptySite(), name: `Site ${s.sites.length + 1}` }] }));
    setActiveSite(input.sites.length);
  };
  const removeSite = (i) => {
    const s = input.sites[i];
    if (!confirm(`Remove ${s.name || `site ${i+1}`} from this quote?`)) return;
    setInput((s) => ({ ...s, sites: s.sites.filter((_, k) => k !== i) }));
    setActiveSite(0);
  };
  const applyScenario = (sc) => {
    setInput((s) => ({ ...s, sites: sc.sites.map((x) => ({ ...WEP.emptySite(), ...x })), workshops:0, trainings:0, followUp:false }));
    setActiveSc(sc.id);
    setActiveSite(0);
  };

  const ICONS = {
    cafe:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 8h10v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z"/><path d="M15 10h2a2 2 0 0 1 0 4h-2"/><path d="M8 4v2M11 4v2"/></svg>,
    hospital:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 21V8l7-5 7 5v13"/><path d="M10 21v-5h4v5"/><path d="M12 9v4M10 11h4"/></svg>,
    warehouse: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21V9l9-5 9 5v12"/><path d="M7 21v-8h10v8"/><path d="M7 17h10"/></svg>,
    office:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="3" width="14" height="18"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/></svg>,
    retail:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 8h16l-1 12H5L4 8z"/><path d="M9 8V5a3 3 0 0 1 6 0v3"/></svg>,
    regional:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 19h18"/><path d="M5 19V11l5-3 5 3v8"/><path d="M15 19V8l4 2v9"/></svg>,
    hifreq:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
    multi:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>,
  };

  const css = `
    .pc { padding:24px 36px 36px; max-width:1480px; margin:0 auto; }
    .pc .serif { font-family:'Source Serif 4',serif; }
    .pc .mono { font-family:'JetBrains Mono',monospace; font-feature-settings:"tnum"; }

    /* Page hero */
    .pc-hero { display:flex; align-items:flex-end; justify-content:space-between; padding-bottom:18px; margin-bottom:18px; border-bottom:1px solid var(--hair); }
    .pc-hero-l .eyebrow { font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--blue-deep); font-weight:700; }
    .pc-hero-l h1 { font-family:'Source Serif 4',serif; font-size:30px; font-weight:600; letter-spacing:-0.01em; margin:6px 0 0; line-height:1.1; }
    .pc-hero-l p { font-size:14px; color:var(--ink-3); margin:6px 0 0; max-width:520px; }
    .pc-hero-r { display:flex; align-items:center; gap:12px; }
    .pc-hero-r .ref { font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--ink-3); padding:6px 11px; background:#fff; border:1px solid var(--hair); border-radius:6px; }
    .pc-hero-r input { padding:7px 11px; border:1px solid var(--hair); border-radius:6px; font:inherit; font-size:13px; background:#fff; outline:none; min-width:240px; }
    .pc-hero-r input:focus { border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }
    .pc-hero-r label { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-3); font-weight:700; }

    /* Scenario carousel */
    .pc-sc-section { margin-bottom:6px; }
    .pc-sc-toggle {
      width:100%; padding:10px 14px;
      background:#fff; border:1px solid var(--hair); border-radius:9px;
      font:inherit; font-size:13px; font-weight:600; color:var(--ink-2);
      cursor:pointer; display:flex; align-items:center; justify-content:space-between;
      transition:border-color 0.15s, background 0.15s;
    }
    .pc-sc-toggle:hover { border-color:var(--blue); background:var(--blue-tint); color:var(--blue-deep); }
    .pc-sc-toggle .l { display:flex; align-items:center; gap:9px; }
    .pc-sc-toggle .l svg { width:16px; height:16px; color:var(--blue-deep); }
    .pc-sc-toggle .cnt { font-family:'JetBrains Mono',monospace; font-size:10.5px; padding:2px 7px; background:var(--blue-tint); color:var(--blue-deep); border-radius:9px; font-weight:700; }
    .pc-sc-toggle .r { display:flex; align-items:center; gap:7px; font-size:11.5px; color:var(--ink-3); font-weight:500; letter-spacing:0.04em; text-transform:uppercase; }
    .pc-sc-toggle .chev { font-size:13px; color:var(--ink-3); }
    .pc-sc-row { display:flex; gap:10px; overflow-x:auto; padding:14px 0 16px; scrollbar-width:none; }
    .pc-sc-row::-webkit-scrollbar { display:none; }
    .pc-sc-card {
      flex-shrink:0; width:200px; padding:16px 16px 14px;
      background:#fff; border:1px solid var(--hair); border-radius:10px;
      cursor:pointer; transition:all 0.15s; text-align:left; font:inherit; font-family:inherit;
    }
    .pc-sc-card:hover { border-color:var(--blue); transform:translateY(-2px); box-shadow:0 6px 18px -8px rgba(31,92,217,0.25); }
    .pc-sc-card.on { background:var(--navy); border-color:var(--navy); color:#fff; }
    .pc-sc-card .ic { width:32px; height:32px; border-radius:50%; background:var(--blue-tint); color:var(--blue-deep); display:grid; place-items:center; margin-bottom:10px; }
    .pc-sc-card .ic svg { width:16px; height:16px; }
    .pc-sc-card.on .ic { background:rgba(255,255,255,0.12); color:#fff; }
    .pc-sc-card .scl { font-size:14px; font-weight:600; margin-bottom:3px; line-height:1.25; }
    .pc-sc-card .scs { font-size:11.5px; color:var(--ink-3); line-height:1.4; min-height:32px; margin-bottom:8px; }
    .pc-sc-card.on .scs { color:rgba(255,255,255,0.6); }
    .pc-sc-card .scp { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:600; color:var(--blue-deep); }
    .pc-sc-card.on .scp { color:var(--azure); }

    /* Body grid */
    .pc-grid { display:grid; grid-template-columns:1fr 420px; gap:20px; }
    .pc-col { display:flex; flex-direction:column; gap:14px; }

    /* Section card */
    .pc-sec { background:#fff; border:1px solid var(--hair); border-radius:10px; padding:20px 24px; }
    .pc-sec-h { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
    .pc-sec-t { font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:var(--blue-deep); display:flex; align-items:center; gap:8px; }
    .pc-sec-t .n { font-family:'JetBrains Mono',monospace; padding:2px 7px; background:var(--blue-tint); border-radius:3px; font-size:10.5px; }
    .pc-sec-x { font-size:12px; color:var(--ink-3); }

    /* Site tabs */
    .pc-stabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
    .pc-stab { padding:7px 13px; background:transparent; border:1px solid var(--hair); border-radius:18px; font:inherit; font-size:12.5px; color:var(--ink-2); cursor:pointer; display:inline-flex; align-items:center; gap:7px; }
    .pc-stab .id { font-family:'JetBrains Mono',monospace; font-size:10.5px; color:var(--ink-3); }
    .pc-stab.on { background:var(--ink); color:#fff; border-color:var(--ink); }
    .pc-stab.on .id { color:rgba(255,255,255,0.6); }
    .pc-stab:hover:not(.on) { border-color:var(--blue); color:var(--blue-deep); }
    .pc-stab .x { width:14px; height:14px; border-radius:50%; display:none; align-items:center; justify-content:center; margin-left:2px; background:rgba(255,255,255,0.18); }
    .pc-stab.on .x { display:inline-flex; }
    .pc-stab-add { padding:7px 13px; background:var(--blue-tint); color:var(--blue-deep); border:1px dashed var(--blue); border-radius:18px; font:inherit; font-size:12.5px; cursor:pointer; font-weight:600; }
    .pc-stab-add:hover { background:var(--blue); color:#fff; }

    /* Inputs / cards */
    .pc-fld { display:flex; flex-direction:column; gap:6px; }
    .pc-fld > label { font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); font-weight:700; }
    .pc-name-wrap { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; margin-left:-10px; border:1px solid transparent; border-radius:7px; transition:border-color 0.15s, background 0.15s; cursor:text; }
    .pc-name-wrap:hover { border-color:var(--hair); background:#fff; }
    .pc-name-wrap:focus-within { border-color:var(--blue); background:#fff; box-shadow:0 0 0 3px var(--blue-tint); }
    .pc-name-input { background:transparent; border:none; outline:none; font:inherit; font-size:18px; font-weight:600; color:var(--ink); padding:0; flex:1; min-width:280px; }
    .pc-name-input::placeholder { color:var(--ink-4); font-weight:500; font-style:italic; }
    .pc-name-pencil { width:14px; height:14px; color:var(--ink-4); flex-shrink:0; opacity:0; transition:opacity 0.15s; }
    .pc-name-wrap:hover .pc-name-pencil, .pc-name-wrap:focus-within .pc-name-pencil { opacity:1; }
    .pc-name-wrap:focus-within .pc-name-pencil { color:var(--blue); }

    .pc-grid4 { display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; }
    .pc-cam-card { background:var(--hair-3); border:1px solid var(--hair-2); border-radius:8px; padding:14px 16px; }
    .pc-cam-card .lab { font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); font-weight:700; margin-bottom:8px; display:flex; align-items:center; gap:6px; }
    .pc-cam-card .ct { display:flex; align-items:center; gap:0; }
    .pc-cam-card .ct button { width:30px; height:30px; background:#fff; border:1px solid var(--hair); color:var(--ink-2); cursor:pointer; font:inherit; border-radius:6px; }
    .pc-cam-card .ct button:hover { background:var(--blue-tint); color:var(--blue-deep); border-color:var(--blue); }
    .pc-cam-card .ct .n { flex:1; text-align:center; font-family:'JetBrains Mono',monospace; font-size:28px; font-weight:600; }

    .pc-pills { display:flex; gap:6px; flex-wrap:wrap; }
    .pc-pill { padding:9px 14px; background:#fff; border:1px solid var(--hair); border-radius:20px; font:inherit; font-size:13px; color:var(--ink-2); cursor:pointer; }
    .pc-pill.on { background:var(--blue); color:#fff; border-color:var(--blue); }
    .pc-pill:hover:not(.on) { border-color:var(--blue); color:var(--blue-deep); }

    .pc-mob-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; }
    .pc-mob { padding:10px 12px; background:#fff; border:1px solid var(--hair); border-radius:8px; cursor:pointer; }
    .pc-mob.on { background:var(--ink); color:#fff; border-color:var(--ink); }
    .pc-mob:hover:not(.on) { border-color:var(--blue); }
    .pc-mob .mn { font-size:13px; font-weight:600; }
    .pc-mob .mp { font-family:'JetBrains Mono',monospace; font-size:11.5px; color:var(--ink-3); }
    .pc-mob.on .mp { color:rgba(255,255,255,0.65); }

    .pc-state-grid { display:grid; grid-template-columns:repeat(8, 1fr); gap:6px; }
    .pc-state {
      padding:9px 6px; background:#fff;
      border:1px solid var(--hair); border-radius:8px;
      cursor:pointer; font:inherit; font-size:12.5px; font-weight:700;
      color:var(--ink-2); letter-spacing:0.06em;
      font-family:'JetBrains Mono',monospace;
    }
    .pc-state:hover:not(.on) { border-color:var(--blue); color:var(--blue-deep); }
    .pc-state.on { background:var(--ink); color:#fff; border-color:var(--ink); }
    .pc-state.unavailable {
      opacity:0.4; cursor:not-allowed;
      background:repeating-linear-gradient(135deg, #fff 0 6px, var(--hair-3) 6px 12px);
      color:var(--ink-4);
    }
    .pc-state.unavailable:hover { border-color:var(--hair); color:var(--ink-4); }
    @media (max-width:1100px) {
      .pc-state-grid { grid-template-columns:repeat(4, 1fr); }
    }

    .pc-ao-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; }
    .pc-ao { padding:14px 16px; background:var(--hair-3); border:1px solid var(--hair-2); border-radius:8px; cursor:pointer; display:grid; grid-template-columns:auto 1fr auto; gap:10px; align-items:center; }
    .pc-ao .check { width:18px; height:18px; border:1.5px solid var(--ink-4); border-radius:5px; background:#fff; display:grid; place-items:center; }
    .pc-ao.on { background:var(--blue-tint); border-color:var(--blue); }
    .pc-ao.on .check { background:var(--blue); border-color:var(--blue); color:#fff; }
    .pc-ao.on .check::after { content:"✓"; font-size:11px; line-height:1; }
    .pc-ao .ttl { font-size:13px; font-weight:600; line-height:1.25; }
    .pc-ao .sub { font-size:11px; color:var(--ink-3); margin-top:1px; }
    .pc-ao .pr { font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--ink-3); }
    .pc-ao.on .pr { color:var(--blue-deep); font-weight:600; }

    .pc-step { display:inline-flex; align-items:center; border:1px solid var(--hair); border-radius:18px; background:#fff; }
    .pc-step button { width:32px; height:32px; border:none; background:transparent; cursor:pointer; font:inherit; color:var(--ink-2); }
    .pc-step button:hover { color:var(--blue-deep); }
    .pc-step .n { width:32px; text-align:center; font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:600; }

    /* RAIL */
    .pc-rail { background:var(--ink); color:#fff; border-radius:12px; padding:26px 26px 22px; display:flex; flex-direction:column; box-shadow:0 18px 40px -20px rgba(10,22,40,0.45); align-self:stretch; box-sizing:border-box; }
    .pc-rail .top { display:flex; justify-content:space-between; align-items:flex-start; }
    .pc-rail .lab { font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(255,255,255,0.55); font-weight:700; margin-bottom:4px; }
    .pc-rail .client { font-family:'Source Serif 4',serif; font-size:18px; font-weight:600; line-height:1.2; }
    .pc-rail .ref { font-family:'JetBrains Mono',monospace; font-size:11.5px; color:rgba(255,255,255,0.55); margin-top:2px; }
    .pc-rail .live-pill { display:inline-flex; align-items:center; gap:6px; padding:4px 9px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.18); border-radius:16px; font-size:10.5px; color:rgba(255,255,255,0.8); letter-spacing:0.06em; }
    .pc-rail .live-pill .d { width:5px; height:5px; background:#5FA3FF; border-radius:50%; box-shadow:0 0 0 3px rgba(95,163,255,0.2); }

    .pc-rail .total { padding:22px 0 18px; border-bottom:1px solid rgba(255,255,255,0.14); margin-top:18px; }
    .pc-rail .total .v {
      font-family:'Source Serif 4',serif; font-size:54px; font-weight:600;
      letter-spacing:-0.025em; line-height:1; color:#fff;
      font-feature-settings:"tnum"; display:flex; align-items:baseline; gap:8px;
    }
    .pc-rail .total .v .cur { font-size:18px; color:rgba(255,255,255,0.5); font-family:'Source Sans 3',sans-serif; font-weight:500; }
    .pc-rail .total .x { font-size:12px; color:rgba(255,255,255,0.55); margin-top:8px; }

    .pc-rail .metas { display:grid; grid-template-columns:1fr 1fr; gap:14px 0; padding:16px 0; border-bottom:1px solid rgba(255,255,255,0.14); }
    .pc-rail .metas .k { font-size:9.5px; letter-spacing:0.16em; text-transform:uppercase; color:rgba(255,255,255,0.5); font-weight:700; margin-bottom:3px; }
    .pc-rail .metas .v { font-size:13.5px; font-weight:600; }
    .pc-rail .metas .acc { color:var(--azure); }

    .pc-rail .lines { flex:1; min-height:0; padding:14px 0 4px; font-size:12.5px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.18) transparent; }
    .pc-rail .lr { display:grid; grid-template-columns:1fr auto; gap:8px; padding:5px 0; border-bottom:1px dotted rgba(255,255,255,0.06); }
    .pc-rail .lr:last-child { border-bottom:none; }
    .pc-rail .lr .lbl { color:rgba(255,255,255,0.82); font-size:12px; }
    .pc-rail .lr .dt { font-size:10.5px; color:rgba(255,255,255,0.42); margin-top:1px; font-family:'JetBrains Mono',monospace; }
    .pc-rail .lr .am { font-family:'JetBrains Mono',monospace; color:#fff; font-weight:600; font-size:12.5px; }
    .pc-rail .lr.discount .lbl, .pc-rail .lr.discount .am { color:#7FB3F9; }
    .pc-rail .empty { color:rgba(255,255,255,0.4); font-size:12px; text-align:center; padding:24px 10px; }

    .pc-rail .actions { display:flex; gap:8px; margin-top:16px; position:relative; }
    .pc-btn { flex:1; padding:11px 14px; font:inherit; font-size:11.5px; letter-spacing:0.08em; text-transform:uppercase; font-weight:700; border:1px solid rgba(255,255,255,0.25); background:transparent; color:#fff; cursor:pointer; border-radius:8px; text-align:center; }
    .pc-btn:disabled { opacity:0.4; cursor:not-allowed; }
    .pc-btn:disabled:hover { background:transparent; }
    .pc-btn.solid { background:var(--blue); color:#fff; border-color:var(--blue); }
    .pc-btn.solid:hover { background:var(--blue-deep); }
    .pc-btn:not(.solid):hover { background:rgba(255,255,255,0.08); }

    .pc-warn { padding:10px 13px; background:#FEF3E2; color:var(--warn); border:1px solid #FCE0AC; border-radius:7px; font-size:12px; margin-bottom:14px; }

    /* Image picker */
    .pc-img-empty {
      padding:20px; border:1px dashed var(--hair-2); border-radius:8px;
      text-align:center; color:var(--ink-3); font-size:13px;
      background:var(--hair-3);
    }
    .pc-img-empty button {
      margin-top:8px; padding:8px 14px;
      background:var(--ink); color:#fff; border:none; border-radius:6px;
      font:inherit; font-size:12px; font-weight:600; cursor:pointer;
      letter-spacing:0.03em;
      display:inline-flex; align-items:center; gap:6px;
    }
    .pc-img-empty button:hover { background:var(--blue-deep); }
    .pc-img-empty button svg { width:13px; height:13px; }
    .pc-img-thumbs { display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:10px; }
    .pc-img-thumb {
      position:relative; aspect-ratio:4/3;
      border:1px solid var(--hair); border-radius:8px; overflow:hidden;
      background:var(--hair-3);
    }
    .pc-img-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
    .pc-img-thumb .nm {
      position:absolute; left:0; right:0; bottom:0;
      padding:6px 8px;
      background:linear-gradient(180deg, transparent, rgba(0,0,0,0.7));
      color:#fff; font-size:11px; font-weight:600;
      line-height:1.2;
      overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
    }
    .pc-img-thumb .rm {
      position:absolute; top:6px; right:6px;
      width:22px; height:22px; border-radius:50%;
      background:rgba(0,0,0,0.55); color:#fff;
      border:none; cursor:pointer;
      display:grid; place-items:center; font-size:13px; line-height:1;
      opacity:0; transition:opacity 0.15s;
    }
    .pc-img-thumb:hover .rm { opacity:1; }
    .pc-img-thumb .rm:hover { background:var(--neg); }
    .pc-img-add {
      aspect-ratio:4/3;
      border:1.5px dashed var(--hair); border-radius:8px;
      background:transparent; cursor:pointer;
      display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;
      color:var(--blue-deep); font:inherit; font-size:12px; font-weight:600;
    }
    .pc-img-add:hover { background:var(--blue-tint); border-color:var(--blue); }
    .pc-img-add svg { width:22px; height:22px; }

    /* Image picker modal */
    .pc-modal-bg {
      position:fixed; inset:0; background:rgba(10,22,40,0.55);
      backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px);
      z-index:100; display:grid; place-items:center; padding:20px;
    }
    .pc-modal {
      background:#fff; border-radius:14px; width:min(900px, 100%);
      max-height:85vh; display:flex; flex-direction:column; overflow:hidden;
      box-shadow:0 30px 80px -20px rgba(10,22,40,0.5);
    }
    .pc-modal-h { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid var(--hair); gap:12px; }
    .pc-modal-h .ttl { font-family:'Source Serif 4',serif; font-size:20px; font-weight:600; }
    .pc-modal-h .x { background:transparent; border:1px solid var(--hair); border-radius:7px; width:34px; height:34px; cursor:pointer; font-size:18px; color:var(--ink-2); }
    .pc-modal-h .x:hover { background:var(--hair-3); }
    .pc-modal-search {
      padding:14px 24px; border-bottom:1px solid var(--hair-2); display:flex; align-items:center; gap:9px;
    }
    .pc-modal-search svg { width:16px; height:16px; color:var(--ink-3); }
    .pc-modal-search input {
      flex:1; border:none; outline:none; font:inherit; font-size:14px;
    }
    .pc-modal-body { flex:1; overflow:auto; padding:20px 24px; }
    .pc-modal-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:14px; }
    .pc-modal-card {
      border:2px solid var(--hair); border-radius:10px; overflow:hidden; cursor:pointer;
      background:#fff; transition:all 0.15s; position:relative;
    }
    .pc-modal-card:hover { border-color:var(--blue); transform:translateY(-2px); box-shadow:0 8px 20px -10px rgba(31,92,217,0.25); }
    .pc-modal-card.on { border-color:var(--blue); }
    .pc-modal-card.on::after {
      content:"✓"; position:absolute; top:8px; right:8px;
      width:26px; height:26px; border-radius:50%;
      background:var(--blue); color:#fff; font-size:14px; font-weight:700;
      display:grid; place-items:center;
      box-shadow:0 4px 10px rgba(31,92,217,0.3);
    }
    .pc-modal-card .mt { aspect-ratio:4/3; background:var(--hair-3); }
    .pc-modal-card .mt img { width:100%; height:100%; object-fit:cover; display:block; }
    .pc-modal-card .mb { padding:10px 12px; }
    .pc-modal-card .mn { font-size:13px; font-weight:600; color:var(--ink); line-height:1.3; }
    .pc-modal-card .md { font-size:11px; color:var(--ink-3); margin-top:3px; line-height:1.4; }
    .pc-modal-foot {
      padding:14px 24px; border-top:1px solid var(--hair);
      display:flex; align-items:center; justify-content:space-between; gap:10px;
      background:var(--hair-3);
    }
    .pc-modal-foot .meta { font-size:12.5px; color:var(--ink-3); }
    .pc-modal-foot .meta b { color:var(--ink); }
    .pc-modal-foot button {
      padding:10px 18px; font:inherit; font-size:13px; font-weight:600;
      border-radius:7px; cursor:pointer; letter-spacing:0.03em;
    }
    .pc-modal-foot button.done {
      background:var(--ink); color:#fff; border:none;
    }
    .pc-modal-foot button.done:hover { background:var(--blue-deep); }
    .pc-modal-empty {
      padding:60px 20px; text-align:center; color:var(--ink-3); font-size:14px;
    }
    .pc-modal-empty .ttl { font-family:'Source Serif 4',serif; font-size:18px; color:var(--ink); margin-bottom:6px; }

    /* Quote status banner */
    .pc-quote-banner {
      display:flex; align-items:center; justify-content:space-between;
      gap:14px; padding:11px 16px;
      background:#fff; border:1px solid var(--hair); border-radius:10px;
      margin-bottom:16px;
      font-size:13px;
    }
    .pc-quote-banner.draft { border-color:#FCE0AC; background:#FFFBF0; }
    .pc-quote-banner.sent { border-color:#BBF7D0; background:#F0FDF4; }
    .pc-quote-banner-l { display:flex; align-items:center; gap:10px; }
    .pc-quote-banner .status-chip {
      display:inline-flex; align-items:center; gap:6px;
      padding:3px 9px;
      font-size:10.5px; font-weight:700;
      letter-spacing:0.06em; text-transform:uppercase;
      border-radius:11px;
    }
    .pc-quote-banner .status-chip .d { width:5px; height:5px; border-radius:50%; background:currentColor; }
    .pc-quote-banner.draft .status-chip { background:var(--warn-bg); color:var(--warn); }
    .pc-quote-banner.sent .status-chip { background:var(--pos-bg); color:var(--pos); }
    .pc-quote-banner.new { border-color:var(--blue-tint); background:var(--blue-tint); color:var(--blue-deep); }
    .pc-quote-banner.new .status-chip { background:#fff; color:var(--blue-deep); }
    .pc-quote-banner .lbl-tx { color:var(--ink-2); }
    .pc-quote-banner .lbl-tx b { color:var(--ink); }
    .pc-quote-banner .lbl-tx .ts { color:var(--ink-3); font-family:'JetBrains Mono',monospace; font-size:11.5px; margin-left:6px; }
    .pc-quote-banner-r { display:flex; gap:8px; }
    .pc-quote-banner-btn {
      padding:6px 11px; background:transparent;
      border:1px solid currentColor;
      border-radius:5px;
      font:inherit; font-size:11.5px; font-weight:600;
      letter-spacing:0.02em; cursor:pointer;
      display:inline-flex; align-items:center; gap:5px;
      color:var(--ink-2);
    }
    .pc-quote-banner-btn:hover { background:rgba(0,0,0,0.05); }
    .pc-quote-banner-btn svg { width:13px; height:13px; }
  `;

  const site = input.sites[activeSite] || input.sites[0];
  const totalStr = WEUtil.fmtPlain(result.total);

  return (
    <div className="pc">
      <style>{css}</style>

      {/* HERO */}
      <div className="pc-hero">
        <div className="pc-hero-l">
          <div className="eyebrow">{activeQuote ? `Editing ${activeQuote.status}` : "Quote builder · new"}</div>
          <h1 className="serif">{activeQuote ? (activeQuote.client || "Untitled quote") : "Build a WastEye quote"}</h1>
          <p>Start from a similar deployment or build from scratch. Pricing recalculates live from current admin tables.</p>
        </div>
        <div className="pc-hero-r">
          <label>Client</label>
          <input value={input.client} onChange={(e) => setInput({ ...input, client: e.target.value })} placeholder="Client name" />
          <span className="ref">{input.quoteRef}</span>
        </div>
      </div>

      {/* QUOTE STATUS BANNER */}
      {activeQuote ? (
        <div className={`pc-quote-banner ${activeQuote.status}`}>
          <div className="pc-quote-banner-l">
            <span className="status-chip"><span className="d"></span>{activeQuote.status}</span>
            <span className="lbl-tx">
              {activeQuote.status === "draft"
                ? <>You're editing a saved <b>draft</b>. Changes save when you tap "Save changes".</>
                : <>This quote was <b>sent</b>{activeQuote.sentAt ? ` on ${new Date(activeQuote.sentAt).toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"})}` : ""}. Changes won't update the sent record — use "Re-send" to issue a new version.</>
              }
              <span className="ts">{activeQuote.quoteRef}</span>
            </span>
          </div>
          <div className="pc-quote-banner-r">
            <button className="pc-quote-banner-btn" onClick={onViewQuotes}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 4h14v16l-7-3-7 3z"/></svg>
              All quotes
            </button>
            <button className="pc-quote-banner-btn" onClick={onNewQuote}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              New quote
            </button>
          </div>
        </div>
      ) : (
        onSaveDraft && (
          <div className="pc-quote-banner new">
            <div className="pc-quote-banner-l">
              <span className="status-chip"><span className="d"></span>NEW</span>
              <span className="lbl-tx">Not saved yet — hit <b>Save as draft</b> below to keep this quote, or <b>Send</b> to record it as sent.</span>
            </div>
            <div className="pc-quote-banner-r">
              <button className="pc-quote-banner-btn" onClick={onViewQuotes} style={{color:"var(--blue-deep)"}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 4h14v16l-7-3-7 3z"/></svg>
                Saved quotes
              </button>
            </div>
          </div>
        )
      )}

      {/* SCENARIO STRIP */}
      <div className="pc-sc-section">
        <button className="pc-sc-toggle" onClick={() => setScenariosOpen(!scenariosOpen)}>
          <span className="l">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Quick-fill scenarios <span className="cnt">{tables.scenarios.length}</span>
          </span>
          <span className="r">
            {scenariosOpen ? "Hide" : "Show"}
            <span className="chev">{scenariosOpen ? "▾" : "▸"}</span>
          </span>
        </button>
        {scenariosOpen && (
          <div className="pc-sc-row">
            {tables.scenarios.map((sc) => {
              const tmp = WEP.calculate({ sites: sc.sites.map(x => ({ ...WEP.emptySite(), ...x })), workshops:0, trainings:0, followUp:false }, tables);
              return (
                <button key={sc.id} className={`pc-sc-card ${activeSc===sc.id?"on":""}`} onClick={() => activeSc===sc.id ? setActiveSc(null) : applyScenario(sc)} title={activeSc===sc.id ? "Click to clear scenario selection" : ""}>
                  <div className="ic">{window.renderIcon ? window.renderIcon(sc.iconKey || sc.id) : (ICONS[sc.id] || ICONS.office)}</div>
                  <div className="scl">{sc.label}</div>
                  <div className="scs">{sc.sub}</div>
                  <div className="scp">{WEUtil.fmt(tmp.total)}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="pc-grid">

        {/* LEFT */}
        <div className="pc-col">

          {/* Sites */}
          <div className="pc-sec">
            <div className="pc-sec-h">
              <span className="pc-sec-t"><span className="n">01</span>Sites &amp; cameras</span>
              <span className="pc-sec-x">{result.meta.totalCams} cameras across {input.sites.length} site{input.sites.length>1?"s":""}</span>
            </div>

            <div className="pc-stabs">
              {input.sites.map((s, i) => (
                <button key={i} className={`pc-stab ${activeSite===i?"on":""}`} onClick={() => setActiveSite(i)}>
                  <span className="id">{String(i+1).padStart(2,"0")}</span>
                  {s.name || `Site ${i+1}`}
                  {input.sites.length > 1 && (
                    <span className="x" onClick={(e) => { e.stopPropagation(); removeSite(i); }}>×</span>
                  )}
                </button>
              ))}
              <button className="pc-stab-add" onClick={addSite}>＋ Site</button>
            </div>

            {site && (
              <>
                <div className="pc-fld" style={{marginBottom:14}}>
                  <label>Site name <span style={{textTransform:"none", letterSpacing:0, fontSize:11, color:"var(--ink-4)", fontWeight:500, marginLeft:6}}>· click to edit</span></label>
                  <div className="pc-name-wrap">
                    <input className="pc-name-input" value={site.name}
                           onChange={(e) => setSite(activeSite, { name: e.target.value })}
                           placeholder={`Untitled · Site ${activeSite+1}`} />
                    <svg className="pc-name-pencil" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4l6 6L9 21H3v-6L14 4z"/></svg>
                  </div>
                </div>

                <div className="pc-grid4" style={{marginBottom:14}}>
                  <div className="pc-cam-card">
                    <div className="lab">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12.5C7 9 9 7 12 7s5 2 7 5.5"/><circle cx="12" cy="14" r="2.5"/></svg>
                      WiFi cameras
                    </div>
                    <div className="ct">
                      <button onClick={() => setSite(activeSite, { wifi: Math.max(0, site.wifi-1) })}>−</button>
                      <span className="n">{site.wifi}</span>
                      <button onClick={() => setSite(activeSite, { wifi: site.wifi+1 })}>+</button>
                    </div>
                  </div>
                  <div className="pc-cam-card">
                    <div className="lab">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 17h2v3H4zM10 13h2v7h-2zM16 9h2v11h-2z"/></svg>
                      4G cameras
                    </div>
                    <div className="ct">
                      <button onClick={() => setSite(activeSite, { fourg: Math.max(0, site.fourg-1) })}>−</button>
                      <span className="n">{site.fourg}</span>
                      <button onClick={() => setSite(activeSite, { fourg: site.fourg+1 })}>+</button>
                    </div>
                  </div>
                  <div className="pc-cam-card" style={{gridColumn:"span 2"}}>
                    <div className="lab">Duration</div>
                    <div className="pc-pills">
                      {WEP.DURATIONS.map((d) => (
                        <button key={d} className={`pc-pill ${site.days===d?"on":""}`} onClick={() => setSite(activeSite, { days: d })}>{d} days</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pc-fld" style={{marginBottom:14}}>
                  <label>State</label>
                  <div className="pc-state-grid">
                    {[
                      { code: "NSW", available: true },
                      { code: "VIC", available: true },
                      { code: "QLD", available: true },
                      { code: "ACT", available: true },
                      { code: "TAS", available: true },
                      { code: "WA",  available: false },
                      { code: "SA",  available: false },
                      { code: "NT",  available: false },
                    ].map(({code, available}) => (
                      <button key={code}
                        className={`pc-state ${site.state===code?"on":""} ${!available?"unavailable":""}`}
                        onClick={() => available && setSite(activeSite, { state: code })}
                        disabled={!available}
                        title={available ? `Deployment available in ${code}` : `${code} not currently available for deployment — contact scott@shrunk.ai for special arrangements`}>
                        {code}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pc-fld">
                  <label>Mobilisation · distance from supported CBD</label>
                  <div className="pc-mob-grid">
                    {tables.mob.map((m) => (
                      <button key={m.key} className={`pc-mob ${site.mobBand===m.key?"on":""}`} onClick={() => setSite(activeSite, { mobBand: m.key })}
                        title={`${m.label} — ${m.desc}. $${m.fee.toLocaleString()} per visit. Covers install and end-of-deployment retrieval.`}>
                        <div className="mn">{m.label}</div>
                        <div className="mp">${m.fee.toLocaleString()} · per visit</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Add-ons */}
          <div className="pc-sec">
            <div className="pc-sec-h">
              <span className="pc-sec-t"><span className="n">02</span>Site uplifts <span style={{opacity:0.5, marginLeft:6, fontWeight:500}}>· {site?.name || `Site ${activeSite+1}`}</span></span>
              <span className="pc-sec-x">Optional</span>
            </div>
            {site && (
              <div className="pc-ao-grid">
                <div className={`pc-ao ${site.capture15?"on":""}`} onClick={() => setSite(activeSite, { capture15: !site.capture15 })}
                  title={`15-minute capture interval — cameras snap 4× more frequently (every 15 min instead of every 30 min), producing 32 images/cam/day. Pushes deployments up one or two report bands. +$${tables.addons.capture15.price} per camera.`}>
                  <div className="check"></div>
                  <div>
                    <div className="ttl">15-min capture</div>
                    <div className="sub">32 images/cam/day</div>
                  </div>
                  <div className="pr">+${tables.addons.capture15.price}/cam</div>
                </div>
                <div className={`pc-ao ${site.extended12?"on":""}`} onClick={() => setSite(activeSite, { extended12: !site.extended12 })}
                  title={`Extended 12-hour active window — standard capture runs for 8 hours/day; this extends it to 12 hours, useful for double-shift or evening operations. +$${tables.addons.extended12.price} per camera.`}>
                  <div className="check"></div>
                  <div>
                    <div className="ttl">Extended 12h window</div>
                    <div className="sub">Beyond standard hours</div>
                  </div>
                  <div className="pr">+${tables.addons.extended12.price}/cam</div>
                </div>
                <div className={`pc-ao ${site.rushInstall?"on":""}`} onClick={() => setSite(activeSite, { rushInstall: !site.rushInstall })}
                  title={`Rush install — deploy within 5 business days of signed SOW (standard lead time is 2–3 weeks). +$${tables.addons.rushInstall.price} flat fee per site.`}>
                  <div className="check"></div>
                  <div>
                    <div className="ttl">Rush install</div>
                    <div className="sub">≤ 5 business days</div>
                  </div>
                  <div className="pr">+${tables.addons.rushInstall.price}</div>
                </div>
              </div>
            )}
          </div>

          {/* Engagement */}
          {/* Engagement */}
          <div className="pc-sec">
            <div className="pc-sec-h">
              <span className="pc-sec-t"><span className="n">03</span>Engagement</span>
              <span className="pc-sec-x">Quote-level</span>
            </div>
            <div className="pc-ao-grid">
              <div className="pc-ao" style={{cursor:"default"}}
                title={`Recommendations workshop — 1-hour session with stakeholders to walk through audit findings and proposed interventions. On-site or remote. $${tables.addons.workshop.price.toLocaleString()} each.`}>
                <div style={{width:18}}></div>
                <div>
                  <div className="ttl">Recommendations workshops</div>
                  <div className="sub">${tables.addons.workshop.price.toLocaleString()} · 1 hour each</div>
                </div>
                <div className="pc-step">
                  <button onClick={() => setInput({ ...input, workshops: Math.max(0, input.workshops-1) })}>−</button>
                  <span className="n">{input.workshops}</span>
                  <button onClick={() => setInput({ ...input, workshops: input.workshops+1 })}>+</button>
                </div>
              </div>
              <div className="pc-ao" style={{cursor:"default"}}
                title={`Staff training — hands-on session for cleaners and front-of-house staff covering waste segregation, contamination drivers, and proper bin use. $${tables.addons.training.price.toLocaleString()} per session.`}>
                <div style={{width:18}}></div>
                <div>
                  <div className="ttl">Staff training</div>
                  <div className="sub">${tables.addons.training.price.toLocaleString()} · per session</div>
                </div>
                <div className="pc-step">
                  <button onClick={() => setInput({ ...input, trainings: Math.max(0, input.trainings-1) })}>−</button>
                  <span className="n">{input.trainings}</span>
                  <button onClick={() => setInput({ ...input, trainings: input.trainings+1 })}>+</button>
                </div>
              </div>
              <div className={`pc-ao ${input.followUp?"on":""}`} onClick={() => setInput({ ...input, followUp: !input.followUp })}
                title={`Follow-up audit — a same-site, same-scope re-audit at the 3-month mark to measure progress against the baseline. Applies ${Math.round(tables.addons.followUp.price*100)}% discount on camera rental.`}>
                <div className="check"></div>
                <div>
                  <div className="ttl">Follow-up audit</div>
                  <div className="sub">3 months · same scope</div>
                </div>
                <div className="pr">−{Math.round(tables.addons.followUp.price*100)}% cams</div>
              </div>
            </div>
          </div>

          {/* Product images */}
          <div className="pc-sec">
            <div className="pc-sec-h">
              <span className="pc-sec-t"><span className="n">04</span>Product images</span>
              <span className="pc-sec-x">Attach to this quote</span>
            </div>
            <PCImagePicker
              library={tables.productImages || []}
              selected={input.attachedImages || []}
              onChange={(ids) => setInput({ ...input, attachedImages: ids })}
            />
          </div>

          {/* Case studies */}
          <div className="pc-sec">
            <div className="pc-sec-h">
              <span className="pc-sec-t"><span className="n">05</span>Case studies</span>
              <span className="pc-sec-x">Back up the pitch</span>
            </div>
            <PCCasePicker
              library={tables.caseStudies || []}
              selected={input.attachedCases || []}
              onChange={(ids) => setInput({ ...input, attachedCases: ids })}
            />
          </div>
        </div>

        {/* RAIL */}
        <div className="pc-rail">
          <div className="top">
            <div>
              <div className="lab">Quote · ex-GST · {tables.settings.currency}</div>
              <div className="client serif">{input.client || "—"}</div>
              <div className="ref">{input.quoteRef}</div>
            </div>
          </div>

          {!result.meta.valid && (
            <div className="pc-warn" style={{marginTop:18}}>Minimum <b>{tables.settings.minCameras} cameras</b> required. Currently {result.meta.totalCams}.</div>
          )}

          <div className="total">
            <div className="v"><span className="cur">$</span>{totalStr}</div>
            <div className="x">Excludes GST · validity {tables.settings.quoteValidityDays} days</div>
          </div>

          <div className="metas">
            <div>
              <div className="k">Cameras</div>
              <div className="v">{result.meta.totalCams}</div>
            </div>
            <div>
              <div className="k">Sites</div>
              <div className="v">{input.sites.length}</div>
            </div>
            <div>
              <div className="k">Report band</div>
              <div className="v">{result.meta.band}</div>
            </div>
            <div>
              <div className="k">Tier</div>
              <div className="v">{result.meta.tier} {result.meta.tierDiscount>0 && <span className="acc">−{Math.round(result.meta.tierDiscount*100)}%</span>}</div>
            </div>
          </div>

          <div className="lines">
            {result.lines.length === 0 ? (
              <div className="empty">Configure a site to populate the breakdown.</div>
            ) : (
              result.lines.map((l, i) => (
                <div key={i} className={`lr ${l.kind==="discount"?"discount":""}`}>
                  <div>
                    <div className="lbl">{l.label}</div>
                    <div className="dt">{l.group} · {l.detail}</div>
                  </div>
                  <div className="am">{WEUtil.fmt(l.amount)}</div>
                </div>
              ))
            )}
          </div>

          <div className="actions">
            {(() => {
              const hasClient = !!(input.client && input.client.trim());
              const hasRef = !!(input.quoteRef && input.quoteRef.trim());
              const hasSites = (input.sites||[]).every(s => (s.name||"").trim());
              const blockers = [];
              if (!hasClient) blockers.push("client name");
              if (!hasRef) blockers.push("quote reference");
              if (!hasSites) blockers.push("all site names");
              if (!result.meta.valid) blockers.push(`min ${tables.settings.minCameras} cameras`);
              const canSave = result.meta.valid && hasClient && hasRef && hasSites;
              const canSend = canSave;
              const blockerMsg = blockers.length ? `Missing: ${blockers.join(", ")}.` : "";
              return (
                <>
                  {blockers.length > 0 && (
                    <div style={{position:"absolute", bottom:"calc(100% + 8px)", left:0, right:0, padding:"7px 10px", background:"#FEF3E2", color:"var(--warn)", border:"1px solid #FCE0AC", borderRadius:7, fontSize:11.5, lineHeight:1.4, fontWeight:500, letterSpacing:0.02}}>
                      ⚠ {blockerMsg}
                    </div>
                  )}
                  <button className="pc-btn" title="Generate a printable PDF — opens in a new window" onClick={() => {
                    if (window.exportQuotePdf) window.exportQuotePdf({ input, result, tables, session });
                  }} disabled={!canSave}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14, height:14, marginRight:6, verticalAlign:"middle"}}>
                      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h2M13 13h2M9 17h2M13 17h2"/>
                    </svg>
                    PDF
                  </button>
                  <button className="pc-btn" onClick={() => canSave && onSaveDraft && onSaveDraft(input)} disabled={!canSave} title={canSave ? "" : blockerMsg}>
                    {activeQuote && activeQuote.status === "draft" ? "Save changes" : "Save as draft"}
                  </button>
                  <button className="pc-btn solid" onClick={() => { if (canSend) setEmailOpen(true); }} disabled={!canSend} title={canSend ? "" : blockerMsg}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14, height:14, marginRight:6, verticalAlign:"middle"}}>
                      <path d="M22 2L11 13"/>
                      <path d="M22 2l-7 20-4-9-9-4z"/>
                    </svg>
                    {activeQuote && activeQuote.status === "sent" ? "Re-send" : "Send"}
                  </button>
                </>
              );
            })()}
          </div>
        </div>

      </div>

      {emailOpen && (
        <QuoteEmailModal
          input={input}
          result={result}
          tables={tables}
          session={session}
          onClose={() => setEmailOpen(false)}
          onSent={() => { if (onMarkSent) onMarkSent(input); }}
        />
      )}
    </div>
  );
}

window.PortalCalculator = PortalCalculator;

// ── Product image picker (used inside the calculator) ──
function PCImagePicker({ library, selected, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const attachedImages = library.filter(img => selected.includes(img.id));

  const filtered = library.filter(img => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (img.name||"").toLowerCase().includes(q)
        || (img.description||"").toLowerCase().includes(q)
        || (img.tags||"").toLowerCase().includes(q);
  });

  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter(x => x !== id));
    else onChange([...selected, id]);
  };
  const remove = (id) => onChange(selected.filter(x => x !== id));

  return (
    <>
      {attachedImages.length === 0 ? (
        <div className="pc-img-empty">
          <div>No images attached to this quote yet.</div>
          {library.length === 0 ? (
            <div style={{marginTop:6, fontSize:11.5}}>Admin hasn't uploaded any product images yet.</div>
          ) : (
            <button onClick={() => setOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
              Browse library ({library.length})
            </button>
          )}
        </div>
      ) : (
        <div className="pc-img-thumbs">
          {attachedImages.map(img => (
            <div key={img.id} className="pc-img-thumb">
              <img src={img.dataUrl} alt={img.name} />
              <div className="nm">{img.name}</div>
              <button className="rm" onClick={() => remove(img.id)} title="Remove from quote">×</button>
            </div>
          ))}
          {library.length > attachedImages.length && (
            <button className="pc-img-add" onClick={() => setOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Add more
            </button>
          )}
        </div>
      )}

      {open && (
        <div className="pc-modal-bg" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="pc-modal">
            <div className="pc-modal-h">
              <div className="ttl">Product image library</div>
              <button className="x" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="pc-modal-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, description or tag…" />
              {query && <button onClick={() => setQuery("")} style={{background:"transparent", border:"none", cursor:"pointer", color:"var(--ink-3)", fontSize:16, padding:"2px 6px"}}>×</button>}
            </div>
            <div className="pc-modal-body">
              {filtered.length === 0 ? (
                <div className="pc-modal-empty">
                  <div className="ttl">{library.length === 0 ? "Library is empty" : "No matches"}</div>
                  <div>{library.length === 0 ? "Admin can upload images in Admin · Product images." : `Try a different search.`}</div>
                </div>
              ) : (
                <div className="pc-modal-grid">
                  {filtered.map(img => (
                    <button
                      key={img.id}
                      className={`pc-modal-card ${selected.includes(img.id)?"on":""}`}
                      onClick={() => toggle(img.id)}
                    >
                      <div className="mt"><img src={img.dataUrl} alt={img.name} /></div>
                      <div className="mb">
                        <div className="mn">{img.name}</div>
                        {img.description && <div className="md">{img.description}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="pc-modal-foot">
              <div className="meta"><b>{selected.length}</b> attached · <b>{library.length}</b> in library</div>
              <button className="done" onClick={() => setOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

window.PCImagePicker = PCImagePicker;

// ── Case study picker ──
function PCCasePicker({ library, selected, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [sectorFilter, setSectorFilter] = React.useState("all");

  const attached = library.filter(c => selected.includes(c.id));

  const sectors = [...new Set(library.map(c => c.sector).filter(Boolean))].sort();

  const filtered = library.filter(c => {
    if (sectorFilter !== "all" && c.sector !== sectorFilter) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (c.title||"").toLowerCase().includes(q)
        || (c.client||"").toLowerCase().includes(q)
        || (c.summary||"").toLowerCase().includes(q)
        || (c.results||"").toLowerCase().includes(q)
        || (c.tags||"").toLowerCase().includes(q);
  }).sort((a,b) => (b.featured?1:0) - (a.featured?1:0));

  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter(x => x !== id));
    else onChange([...selected, id]);
  };
  const remove = (id) => onChange(selected.filter(x => x !== id));

  return (
    <>
      <style>{`
        .pc-cs-empty { padding:20px; border:1px dashed var(--hair-2); border-radius:8px; text-align:center; color:var(--ink-3); font-size:13px; background:var(--hair-3); }
        .pc-cs-empty button { margin-top:8px; padding:8px 14px; background:var(--ink); color:#fff; border:none; border-radius:6px; font:inherit; font-size:12px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
        .pc-cs-empty button:hover { background:var(--blue-deep); }
        .pc-cs-empty button svg { width:13px; height:13px; }

        .pc-cs-list { display:flex; flex-direction:column; gap:10px; }
        .pc-cs-chip {
          display:grid; grid-template-columns:56px 1fr auto auto; gap:14px; align-items:center;
          padding:11px 14px; background:#fff;
          border:1px solid var(--hair); border-radius:9px;
        }
        .pc-cs-chip .img { width:56px; height:42px; border-radius:5px; background:var(--hair-3); overflow:hidden; display:grid; place-items:center; color:var(--ink-4); font-size:10px; }
        .pc-cs-chip .img img { width:100%; height:100%; object-fit:cover; }
        .pc-cs-chip .body { min-width:0; }
        .pc-cs-chip .body .t { font-family:'Source Serif 4',serif; font-size:14px; font-weight:600; color:var(--ink); line-height:1.3; }
        .pc-cs-chip .body .s { font-size:11.5px; color:var(--ink-3); margin-top:2px; }
        .pc-cs-chip .sector { font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:3px 8px; border-radius:9px; background:var(--blue-tint); color:var(--blue-deep); }
        .pc-cs-chip .rm { width:28px; height:28px; border:1px solid var(--hair); border-radius:5px; background:transparent; color:var(--ink-3); cursor:pointer; font-size:16px; }
        .pc-cs-chip .rm:hover { background:#FEF2F2; color:var(--neg); border-color:#FCA5A5; }
        .pc-cs-add { padding:10px 14px; background:transparent; border:1.5px dashed var(--hair); color:var(--blue-deep); border-radius:8px; font:inherit; font-size:12.5px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:7px; align-self:flex-start; }
        .pc-cs-add:hover { background:var(--blue-tint); border-color:var(--blue); }
        .pc-cs-add svg { width:14px; height:14px; }

        .pc-cs-modal-grid { display:grid; grid-template-columns:1fr; gap:10px; }
        .pc-cs-modal-card {
          display:grid; grid-template-columns:80px 1fr auto; gap:14px; align-items:center;
          padding:12px 14px; border:2px solid var(--hair); border-radius:9px; cursor:pointer;
          background:#fff; text-align:left; font:inherit; width:100%; box-sizing:border-box;
          transition:all 0.15s; position:relative;
        }
        .pc-cs-modal-card:hover { border-color:var(--blue); transform:translateY(-1px); }
        .pc-cs-modal-card.on { border-color:var(--blue); background:var(--blue-tint); }
        .pc-cs-modal-card.on::after { content:"✓"; position:absolute; top:10px; right:14px; width:22px; height:22px; border-radius:50%; background:var(--blue); color:#fff; font-size:12px; font-weight:700; display:grid; place-items:center; }
        .pc-cs-modal-card .img { width:80px; height:60px; border-radius:6px; background:var(--hair-3); overflow:hidden; display:grid; place-items:center; color:var(--ink-4); font-size:10px; }
        .pc-cs-modal-card .img img { width:100%; height:100%; object-fit:cover; }
        .pc-cs-modal-card .body { min-width:0; }
        .pc-cs-modal-card .body .t { font-family:'Source Serif 4',serif; font-size:15px; font-weight:600; color:var(--ink); line-height:1.3; }
        .pc-cs-modal-card .body .c { font-size:12px; color:var(--ink-3); margin-top:2px; }
        .pc-cs-modal-card .body .sum { font-size:11.5px; color:var(--ink-3); margin-top:5px; line-height:1.4; max-width:none; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .pc-cs-modal-card .sector { font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:3px 8px; border-radius:9px; background:var(--hair-3); color:var(--ink-2); }
        .pc-cs-modal-card.on .sector { background:#fff; color:var(--blue-deep); }
        .pc-cs-featured { display:inline-flex; align-items:center; gap:4px; font-size:9.5px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:2px 7px; border-radius:9px; background:#FEF3C7; color:#92400E; margin-right:5px; }

        .pc-cs-modal-filter { display:flex; gap:6px; flex-wrap:wrap; padding:8px 24px 12px; border-bottom:1px solid var(--hair-2); }
        .pc-cs-modal-filter button { padding:5px 12px; background:transparent; border:1px solid var(--hair); border-radius:14px; font:inherit; font-size:12px; color:var(--ink-3); cursor:pointer; }
        .pc-cs-modal-filter button:hover { background:var(--hair-3); }
        .pc-cs-modal-filter button.on { background:var(--ink); color:#fff; border-color:var(--ink); }
      `}</style>

      {attached.length === 0 ? (
        <div className="pc-cs-empty">
          <div>No case studies attached to this quote yet.</div>
          {library.length === 0 ? (
            <div style={{marginTop:6, fontSize:11.5}}>Admin hasn't added any case studies yet.</div>
          ) : (
            <button onClick={() => setOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
              Browse library ({library.length})
            </button>
          )}
        </div>
      ) : (
        <div className="pc-cs-list">
          {attached.map(c => (
            <div className="pc-cs-chip" key={c.id}>
              <div className="img">{c.dataUrl ? <img src={c.dataUrl} alt={c.title} /> : <span>case</span>}</div>
              <div className="body">
                <div className="t">{c.title}</div>
                <div className="s">{c.client || "—"}{c.tags ? ` · ${c.tags}` : ""}</div>
              </div>
              <span className="sector">{c.sector}</span>
              <button className="rm" onClick={() => remove(c.id)} title="Remove from quote">×</button>
            </div>
          ))}
          {library.length > attached.length && (
            <button className="pc-cs-add" onClick={() => setOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Add more case studies
            </button>
          )}
        </div>
      )}

      {open && (
        <div className="pc-modal-bg" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="pc-modal">
            <div className="pc-modal-h">
              <div className="ttl">Case study library</div>
              <button className="x" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="pc-modal-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by client, title, results, tag…" />
              {query && <button onClick={() => setQuery("")} style={{background:"transparent", border:"none", cursor:"pointer", color:"var(--ink-3)", fontSize:16, padding:"2px 6px"}}>×</button>}
            </div>
            {sectors.length > 0 && (
              <div className="pc-cs-modal-filter">
                <button className={sectorFilter==="all"?"on":""} onClick={() => setSectorFilter("all")}>All sectors</button>
                {sectors.map(s => (
                  <button key={s} className={sectorFilter===s?"on":""} onClick={() => setSectorFilter(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                ))}
              </div>
            )}
            <div className="pc-modal-body">
              {filtered.length === 0 ? (
                <div className="pc-modal-empty">
                  <div className="ttl">{library.length === 0 ? "Library is empty" : "No matches"}</div>
                  <div>{library.length === 0 ? "Admin can add case studies in Admin · Case studies." : "Try a different search or sector."}</div>
                </div>
              ) : (
                <div className="pc-cs-modal-grid">
                  {filtered.map(c => (
                    <button
                      key={c.id}
                      className={`pc-cs-modal-card ${selected.includes(c.id)?"on":""}`}
                      onClick={() => toggle(c.id)}
                    >
                      <div className="img">{c.dataUrl ? <img src={c.dataUrl} alt={c.title} /> : <span>case</span>}</div>
                      <div className="body">
                        <div className="t">
                          {c.featured && <span className="pc-cs-featured">★ Featured</span>}
                          {c.title}
                        </div>
                        <div className="c">{c.client || "—"}</div>
                        {c.summary && <div className="sum">{c.summary}</div>}
                      </div>
                      <span className="sector">{c.sector}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="pc-modal-foot">
              <div className="meta"><b>{selected.length}</b> attached · <b>{library.length}</b> in library</div>
              <button className="done" onClick={() => setOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

window.PCCasePicker = PCCasePicker;

