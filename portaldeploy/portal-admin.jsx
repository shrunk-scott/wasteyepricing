// Portal Admin — editable pricing tables, with live preview impact.
// Left rail: sections. Right pane: section-specific editor.

const { useState: useStateAdmin, useMemo: useMemoAdmin } = React;

function PortalAdmin({ tables, setTables, tender, setTender, users, setUsers, quotes, setQuotes, activityLog, setActivityLog, session, onReset, onResetTender, onOpenQuote, section: sectionProp, setSection: setSectionProp }) {
  const [sectionLocal, setSectionLocal] = useStateAdmin("bands");
  const section = sectionProp !== undefined ? sectionProp : sectionLocal;
  const setSection = setSectionProp || setSectionLocal;
  const [expandedTenderCat, setExpandedTenderCat] = useStateAdmin(null);

  // Live preview total for a fixed reference deployment (hospital scenario)
  const previewInput = {
    client: "Preview", quoteRef: "PREVIEW",
    sites: [{ ...WEP.emptySite(), name: "Preview", wifi: 8, fourg: 4, days: 14, mobBand: "CBD" }],
    workshops: 0, trainings: 0, followUp: false,
  };
  const previewDefault = useMemoAdmin(() => WEP.calculate(previewInput, WEP.defaultTables()), []);
  const previewCurrent = useMemoAdmin(() => WEP.calculate(previewInput, tables), [tables]);
  const previewDelta = previewCurrent.total - previewDefault.total;

  // Helpers to mutate tables immutably
  const updArr = (key, idx, patch) =>
    setTables({ ...tables, [key]: tables[key].map((x, i) => i===idx ? { ...x, ...patch } : x) });
  const updAddon = (id, patch) =>
    setTables({ ...tables, addons: { ...tables.addons, [id]: { ...tables.addons[id], ...patch } } });
  const removeAddon = (id) => {
    const a = tables.addons[id];
    if (!a) return;
    const SYSTEM = ["capture15","extended12","rushInstall","workshop","training","followUp"];
    const isSystem = SYSTEM.includes(id);
    const msg = isSystem
      ? `"${a.label}" is a core add-on used by the calculator (${id}). Removing it will stop the calculator from charging this uplift. Continue?`
      : `Remove the add-on "${a.label}"?`;
    window.appConfirm({
      title: isSystem ? "Remove core add-on?" : "Remove add-on?",
      message: msg,
      confirmLabel: "Remove",
      destructive: true,
    }, () => {
      const next = { ...tables.addons };
      delete next[id];
      setTables({ ...tables, addons: next });
    });
  };
  const addAddon = () => {
    const id = "addon_" + Date.now().toString(36).slice(-5);
    setTables({
      ...tables,
      addons: {
        ...tables.addons,
        [id]: { label: "New add-on", unit: "per camera", price: 0, kind: "flat" },
      },
    });
  };
  const updSettings = (patch) =>
    setTables({ ...tables, settings: { ...tables.settings, ...patch } });
  const addScenario = () => {
    const id = "custom_" + Date.now().toString(36);
    setTables({ ...tables, scenarios: [...tables.scenarios, { id, label: "New scenario", sub: "1 site · custom", sites: [{ name: "Site 1", mobBand: "CBD", wifi: 8, fourg: 0, days: 14 }] }] });
  };
  const removeScenario = (idx) => {
    window.appConfirm({
      title: "Remove scenario",
      message: "Remove this scenario? This affects the calculator's scenario carousel.",
      confirmLabel: "Remove",
      destructive: true,
    }, () => setTables({ ...tables, scenarios: tables.scenarios.filter((_, i) => i !== idx) }));
  };
  const updScenarioSite = (scIdx, siteIdx, patch) => {
    const sc = tables.scenarios[scIdx];
    const newSites = sc.sites.map((s, i) => i === siteIdx ? { ...s, ...patch } : s);
    updArr("scenarios", scIdx, { sites: newSites });
  };

  // Tender mutators
  const updTenderCat = (catIdx, patch) => {
    setTender({ ...tender, categories: tender.categories.map((c, i) => i === catIdx ? { ...c, ...patch } : c) });
  };
  const updTenderQ = (catIdx, qIdx, patch) => {
    const cat = tender.categories[catIdx];
    updTenderCat(catIdx, { questions: cat.questions.map((q, i) => i === qIdx ? { ...q, ...patch } : q) });
  };
  const updTenderA = (catIdx, qIdx, aIdx, patch) => {
    const q = tender.categories[catIdx].questions[qIdx];
    updTenderQ(catIdx, qIdx, { answers: q.answers.map((a, i) => i === aIdx ? { ...a, ...patch } : a) });
  };
  const addTenderQ = (catIdx) => {
    const cat = tender.categories[catIdx];
    const newQ = {
      id: "q_" + Date.now().toString(36),
      question: "New question",
      tags: [],
      answers: [{ id: "default", length: "Standard", text: "" }],
    };
    updTenderCat(catIdx, { questions: [...cat.questions, newQ] });
  };
  const removeTenderQ = (catIdx, qIdx) => {
    window.appConfirm({
      title: "Remove question",
      message: "Remove this question and all its answers?",
      confirmLabel: "Remove",
      destructive: true,
    }, () => {
      const cat = tender.categories[catIdx];
      updTenderCat(catIdx, { questions: cat.questions.filter((_, i) => i !== qIdx) });
    });
  };
  const addTenderA = (catIdx, qIdx) => {
    const q = tender.categories[catIdx].questions[qIdx];
    const newA = { id: "a_" + Date.now().toString(36), length: "Alternate", text: "" };
    updTenderQ(catIdx, qIdx, { answers: [...q.answers, newA] });
  };
  const removeTenderA = (catIdx, qIdx, aIdx) => {
    const q = tender.categories[catIdx].questions[qIdx];
    if (q.answers.length <= 1) { alert("Each question needs at least one answer."); return; }
    window.appConfirm({
      title: "Remove answer variant",
      message: "Remove this answer variant?",
      confirmLabel: "Remove",
      destructive: true,
    }, () => updTenderQ(catIdx, qIdx, { answers: q.answers.filter((_, i) => i !== aIdx) }));
  };
  const addTenderCategory = () => {
    const num = String(tender.categories.length + 1).padStart(2, "0");
    const newCat = {
      id: "cat_" + Date.now().toString(36),
      num,
      label: "New category",
      desc: "Description…",
      questions: [],
    };
    setTender({ ...tender, categories: [...tender.categories, newCat] });
    setExpandedTenderCat(newCat.id);
  };
  const removeTenderCategory = (catIdx) => {
    const cat = tender.categories[catIdx];
    window.appConfirm({
      title: "Remove category",
      message: `Remove the "${cat.label}" category and all ${cat.questions.length} of its questions? This can't be undone.`,
      confirmLabel: "Remove category",
      destructive: true,
    }, () => setTender({ ...tender, categories: tender.categories.filter((_, i) => i !== catIdx) }));
  };

  const css = `
    .pa { display:grid; grid-template-columns:260px 1fr; min-height:calc(100vh - 60px); }
    .pa .serif { font-family:'Source Serif 4',serif; }
    .pa .mono { font-family:'JetBrains Mono',monospace; font-feature-settings:"tnum"; }

    /* SIDE NAV */
    .pa-rail {
      background:#fff;
      border-right:1px solid var(--hair);
      padding:24px 0;
      display:flex; flex-direction:column;
    }
    .pa-rail-h { padding:0 22px 14px; }
    .pa-rail-h .ttl { font-family:'Source Serif 4',serif; font-size:18px; font-weight:600; }
    .pa-rail-h .sub { font-size:12px; color:var(--ink-3); margin-top:2px; }

    .pa-section-group { padding:6px 12px; }
    .pa-section-h { padding:10px 10px 4px; font-size:10px; letter-spacing:0.16em; text-transform:uppercase; color:var(--ink-3); font-weight:700; }
    .pa-nav { display:flex; flex-direction:column; gap:1px; }
    .pa-nav button {
      padding:10px 12px; background:transparent; border:none;
      font:inherit; font-size:13.5px; color:var(--ink-2);
      text-align:left; cursor:pointer; border-radius:6px;
      display:grid; grid-template-columns:auto 1fr auto; gap:10px; align-items:center;
    }
    .pa-nav button .ic { width:18px; height:18px; color:var(--ink-3); }
    .pa-nav button .ic svg { width:18px; height:18px; }
    .pa-nav button .cnt { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--ink-4); }
    .pa-nav button:hover { background:var(--blue-tint); color:var(--blue-deep); }
    .pa-nav button:hover .ic, .pa-nav button:hover .cnt { color:var(--blue-deep); }
    .pa-nav button.on { background:var(--ink); color:#fff; }
    .pa-nav button.on .ic, .pa-nav button.on .cnt { color:rgba(255,255,255,0.7); }

    .pa-reset { margin-top:auto; padding:14px 22px; border-top:1px solid var(--hair); }
    .pa-reset button {
      width:100%; padding:9px 12px;
      background:transparent; color:var(--neg);
      border:1px solid var(--hair); border-radius:6px;
      font:inherit; font-size:12px; font-weight:600; cursor:pointer;
      letter-spacing:0.04em;
    }
    .pa-reset button:hover { background:#FEF2F2; border-color:var(--neg); }

    /* CONTENT */
    .pa-content { padding:24px 36px 36px; max-width:1480px; margin:0 auto; box-sizing:border-box; width:100%; }

    .pa-hero {
      display:flex; justify-content:space-between; align-items:flex-end;
      padding-bottom:18px; margin-bottom:18px; border-bottom:1px solid var(--hair);
    }
    .pa-hero .eyebrow { font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--blue-deep); font-weight:700; }
    .pa-hero h1 { font-family:'Source Serif 4',serif; font-size:28px; font-weight:600; letter-spacing:-0.01em; margin:6px 0 0; line-height:1.1; }
    .pa-hero p { font-size:14px; color:var(--ink-3); margin:6px 0 0; max-width:620px; }
    .pa-preview {
      background:#fff; border:1px solid var(--hair); border-radius:10px;
      padding:14px 18px; min-width:260px;
    }
    .pa-preview .lab { font-size:9.5px; letter-spacing:0.16em; text-transform:uppercase; color:var(--ink-3); font-weight:700; }
    .pa-preview .v { font-family:'JetBrains Mono',monospace; font-size:24px; font-weight:600; letter-spacing:-0.01em; margin-top:3px; color:var(--ink); }
    .pa-preview .d { font-size:11.5px; margin-top:6px; display:flex; gap:8px; align-items:center; }
    .pa-preview .d .delta { font-family:'JetBrains Mono',monospace; font-weight:600; }
    .pa-preview .d .delta.up { color:var(--neg); }
    .pa-preview .d .delta.dn { color:var(--pos); }
    .pa-preview .d .ref { color:var(--ink-3); }

    /* Tables */
    .pa-tbl-wrap { background:#fff; border:1px solid var(--hair); border-radius:10px; overflow:hidden; }
    .pa-tbl-h { padding:14px 20px; border-bottom:1px solid var(--hair); display:flex; justify-content:space-between; align-items:center; background:var(--hair-3); gap:18px; }
    .pa-tbl-h .ttl { font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:var(--ink); flex-shrink:0; }
    .pa-tbl-h .help { font-size:12px; color:var(--ink-3); text-align:right; }
    .pa-tbl-scroll { overflow-x:auto; }
    .pa-tbl-scroll::-webkit-scrollbar { height:10px; }
    .pa-tbl-scroll::-webkit-scrollbar-thumb { background:var(--hair); border-radius:5px; }
    .pa-tbl { width:100%; border-collapse:collapse; font-size:13px; min-width:720px; }
    .pa-tbl.wide { min-width:1080px; }
    .pa-tbl th {
      text-align:left; padding:10px 14px;
      font-size:10.5px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-3);
      border-bottom:1px solid var(--hair); background:#fff;
    }
    .pa-tbl th.num { text-align:right; }
    .pa-tbl td { padding:0; border-bottom:1px solid var(--hair-2); vertical-align:middle; }
    .pa-tbl tr:last-child td { border-bottom:none; }
    .pa-tbl tr:hover td { background:#FAFCFE; }

    .pa-cell { padding:8px 14px; display:block; }
    .pa-cell input, .pa-cell select, .pa-cell textarea {
      width:100%; box-sizing:border-box;
      border:1px solid transparent; background:transparent;
      padding:7px 8px;
      font:inherit; font-size:13px; color:var(--ink);
      border-radius:5px; outline:none;
      transition:background 0.1s, border-color 0.1s;
    }
    .pa-cell input.mono, .pa-cell .num input, .pa-tbl td.num input {
      font-family:'JetBrains Mono',monospace; text-align:right; font-feature-settings:"tnum";
    }
    .pa-cell input:hover, .pa-cell select:hover, .pa-cell textarea:hover {
      background:var(--hair-3);
    }
    .pa-cell input:focus, .pa-cell select:focus, .pa-cell textarea:focus {
      background:#fff; border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint);
    }
    .pa-cell input::placeholder { color:var(--ink-4); }

    .pa-tbl td.num { text-align:right; }
    .pa-tbl td.center { text-align:center; }

    .pa-cell-static { padding:14px; color:var(--ink); font-size:13.5px; }
    .pa-cell-static.key { font-weight:600; color:var(--ink); }
    .pa-cell-static.sub { font-size:11.5px; color:var(--ink-3); }
    .pa-cell-static.mono { font-family:'JetBrains Mono',monospace; }

    .pa-prefix-input { position:relative; }
    .pa-prefix-input .pfx { position:absolute; left:8px; top:50%; transform:translateY(-50%); color:var(--ink-3); font-family:'JetBrains Mono',monospace; font-size:13px; pointer-events:none; }
    .pa-prefix-input input { padding-left:22px !important; }

    .pa-suffix-input { position:relative; }
    .pa-suffix-input .sfx { position:absolute; right:14px; top:50%; transform:translateY(-50%); color:var(--ink-3); font-family:'JetBrains Mono',monospace; font-size:13px; pointer-events:none; }

    /* Bands */
    .pa-band-key { display:flex; align-items:center; gap:10px; }
    .pa-band-dot {
      width:8px; height:24px; background:var(--blue);
      flex-shrink:0; border-radius:2px;
    }
    .pa-band-dot.b0 { background:#94A3B8; }
    .pa-band-dot.b1 { background:#60A5FA; }
    .pa-band-dot.b2 { background:#3B82F6; }
    .pa-band-dot.b3 { background:#1D4ED8; }
    .pa-band-dot.b4 { background:#1E3A8A; }
    .pa-band-dot.b5 { background:#0F172A; }

    .pa-rm-btn {
      background:transparent; border:none; color:var(--ink-3);
      cursor:pointer; font-size:16px; padding:8px 10px; line-height:1;
      border-radius:4px;
    }
    .pa-rm-btn:hover { background:#FEF2F2; color:var(--neg); }

    /* Scenarios */
    .pa-sc-wrap { display:flex; flex-direction:column; gap:14px; }
    .pa-sc { background:#fff; border:1px solid var(--hair); border-radius:10px; overflow:visible; }
    .pa-sc-h { padding:12px 18px; background:var(--hair-3); border-bottom:1px solid var(--hair); display:grid; grid-template-columns:auto auto 1fr 1fr auto auto; gap:12px; align-items:center; }
    .pa-sc-h .id { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--ink-3); padding:3px 8px; background:var(--blue-tint); color:var(--blue-deep); border-radius:3px; font-weight:600; }
    .pa-sc-h .id-edit {
      font-family:'JetBrains Mono',monospace; font-size:11px;
      padding:5px 9px; background:var(--blue-tint); color:var(--blue-deep);
      border:1px solid transparent; border-radius:5px; font-weight:600;
      outline:none; width:110px;
    }
    .pa-sc-h .id-edit:hover { background:#fff; border-color:var(--blue-tint); }
    .pa-sc-h .id-edit:focus { background:#fff; border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }
    .pa-sc-h input { background:transparent; border:1px solid transparent; padding:5px 8px; font:inherit; font-size:14px; border-radius:5px; outline:none; }
    .pa-sc-h input.lbl { font-weight:600; }
    .pa-sc-h input.sub { color:var(--ink-3); font-size:12.5px; }
    .pa-sc-h input:hover { background:#fff; border-color:var(--hair); }
    .pa-sc-h input:focus { background:#fff; border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }
    .pa-sc-h .preview { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:600; color:var(--blue-deep); padding:3px 9px; background:var(--blue-tint); border-radius:4px; }

    .pa-sc-icon-btn {
      width:38px; height:38px; padding:0;
      background:#fff; border:1px solid var(--hair); border-radius:8px;
      cursor:pointer; display:grid; place-items:center; color:var(--blue-deep);
      position:relative;
    }
    .pa-sc-icon-btn:hover { border-color:var(--blue); background:var(--blue-tint); }
    .pa-sc-icon-btn svg { width:20px; height:20px; }
    .pa-sc-icon-btn .edit-dot {
      position:absolute; bottom:-3px; right:-3px;
      width:14px; height:14px; border-radius:50%;
      background:var(--blue); color:#fff; font-size:9px;
      display:grid; place-items:center; line-height:1;
      border:1.5px solid #fff;
    }

    .pa-icon-popover {
      position:absolute; z-index:50;
      top:calc(100% + 6px); left:0;
      background:#fff; border:1px solid var(--hair); border-radius:10px;
      box-shadow:0 18px 40px -12px rgba(10,22,40,0.25);
      padding:10px; width:300px;
      display:grid; grid-template-columns:repeat(5, 1fr); gap:6px;
    }
    .pa-icon-popover button {
      aspect-ratio:1; background:#fff; border:1px solid var(--hair); border-radius:6px;
      cursor:pointer; color:var(--ink-2); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
      padding:4px; font:inherit;
    }
    .pa-icon-popover button svg { width:18px; height:18px; }
    .pa-icon-popover button:hover { background:var(--blue-tint); border-color:var(--blue); color:var(--blue-deep); }
    .pa-icon-popover button.on { background:var(--ink); color:#fff; border-color:var(--ink); }
    .pa-icon-popover button .lab { font-size:8.5px; letter-spacing:0.04em; line-height:1; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }

    .pa-sc-add {
      width:100%; padding:14px;
      background:transparent; color:var(--blue-deep);
      border:1px dashed var(--blue); border-radius:10px;
      font:inherit; font-size:13px; font-weight:600;
      cursor:pointer; letter-spacing:0.04em;
    }
    .pa-sc-add:hover { background:var(--blue-tint); }

    /* Settings */
    .pa-settings { display:grid; grid-template-columns:repeat(2, 1fr); gap:16px; }
    .pa-set-card { background:#fff; border:1px solid var(--hair); border-radius:10px; padding:18px 20px; }
    .pa-set-card label { font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); font-weight:700; display:block; margin-bottom:6px; }
    .pa-set-card .desc { font-size:11.5px; color:var(--ink-3); margin-bottom:10px; line-height:1.45; }
    .pa-set-card input, .pa-set-card select {
      width:100%; box-sizing:border-box;
      padding:9px 12px; border:1px solid var(--hair); border-radius:6px;
      font:inherit; font-size:14px; color:var(--ink);
      font-family:'JetBrains Mono',monospace; font-feature-settings:"tnum";
      outline:none; background:#fff;
    }
    .pa-set-card input:focus { border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }

    /* Tender editor */
    .pa-tender { display:flex; flex-direction:column; gap:14px; }
    .pa-t-cat { background:#fff; border:1px solid var(--hair); border-radius:10px; overflow:hidden; }
    .pa-t-cat-h {
      padding:14px 18px; display:flex; justify-content:space-between; align-items:center;
      gap:14px; cursor:pointer; background:var(--hair-3);
      border-bottom:1px solid var(--hair);
    }
    .pa-t-cat-h:hover { background:var(--blue-tint); }
    .pa-t-cat-l { display:flex; align-items:center; gap:14px; min-width:0; flex:1; }
    .pa-t-cat-l .num {
      font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:700;
      padding:5px 10px; background:#fff; color:var(--blue-deep);
      border:1px solid var(--hair); border-radius:5px; flex-shrink:0;
    }
    .pa-t-cat-l .cat-label { font-family:'Source Serif 4',serif; font-size:17px; font-weight:600; color:var(--ink); line-height:1.2; }
    .pa-t-cat-l .cat-desc { font-size:12px; color:var(--ink-3); margin-top:2px; }
    .pa-t-cat-r { display:flex; align-items:center; gap:14px; flex-shrink:0; }
    .pa-t-cat-r .count { font-size:11.5px; color:var(--ink-3); font-family:'JetBrains Mono',monospace; padding:3px 9px; background:#fff; border-radius:3px; border:1px solid var(--hair); }
    .pa-t-cat-r .chev { font-size:13px; color:var(--ink-3); width:14px; text-align:center; }

    .pa-t-cat-body { padding:18px 20px 20px; display:flex; flex-direction:column; gap:14px; }

    .pa-t-meta { display:flex; gap:12px; flex-wrap:wrap; padding-bottom:14px; border-bottom:1px dashed var(--hair); }
    .pa-input {
      width:100%; box-sizing:border-box;
      padding:8px 11px; border:1px solid var(--hair); border-radius:6px;
      font:inherit; font-size:13px; color:var(--ink); outline:none;
      background:#fff;
    }
    .pa-input:hover { border-color:var(--ink-4); }
    .pa-input:focus { border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }

    .pa-fld { display:flex; flex-direction:column; gap:5px; }
    .pa-fld > label { font-size:10px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); font-weight:700; }

    .pa-t-q {
      border:1px solid var(--hair); border-radius:8px;
      padding:14px 16px; background:#FAFBFD;
      display:flex; flex-direction:column; gap:10px;
    }
    .pa-t-q-h { display:flex; gap:8px; align-items:center; }
    .pa-t-q-input {
      flex:1;
      padding:9px 12px; background:#fff;
      border:1px solid var(--hair); border-radius:6px;
      font:inherit; font-size:15px; font-weight:600; color:var(--ink);
      outline:none;
    }
    .pa-t-q-input:focus { border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }

    .pa-t-tags, .pa-t-note-row {
      display:grid; grid-template-columns:120px 1fr; gap:10px; align-items:center;
    }
    .t-label { font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); font-weight:700; }

    .pa-t-answers { display:flex; flex-direction:column; gap:8px; padding-top:6px; border-top:1px dashed var(--hair); }
    .pa-t-a {
      background:#fff; border:1px solid var(--hair); border-radius:6px;
      padding:10px 12px;
      display:flex; flex-direction:column; gap:8px;
    }
    .pa-t-a-h { display:flex; align-items:center; gap:10px; }
    .pa-t-a-length {
      width:240px;
      padding:5px 9px; border:1px solid transparent; background:transparent;
      font:inherit; font-size:11px; font-weight:700;
      letter-spacing:0.08em; text-transform:uppercase; color:var(--ink);
      border-radius:4px; outline:none;
    }
    .pa-t-a-length:hover { background:var(--hair-3); }
    .pa-t-a-length:focus { background:#fff; border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }
    .pa-t-a-h .wc { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--ink-3); margin-left:auto; }
    .pa-t-a-text {
      width:100%; box-sizing:border-box;
      padding:11px 13px; border:1px solid var(--hair); border-radius:6px;
      font:inherit; font-size:13.5px; color:var(--ink); line-height:1.55;
      font-family:'Source Sans 3',sans-serif;
      outline:none; resize:vertical;
      background:var(--hair-3);
    }
    .pa-t-a-text:focus { background:#fff; border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }

    .pa-rm-btn.small { padding:4px 8px; font-size:14px; }

    .pa-t-add-a, .pa-t-add-q {
      padding:8px 12px;
      background:transparent; color:var(--blue-deep);
      border:1px dashed var(--blue); border-radius:6px;
      font:inherit; font-size:12px; font-weight:600;
      cursor:pointer; letter-spacing:0.03em;
    }
    .pa-t-add-a { align-self:flex-start; }
    .pa-t-add-q { padding:10px; margin-top:4px; }
    .pa-t-add-a:hover, .pa-t-add-q:hover { background:var(--blue-tint); }

    /* Tender admin toolbar */
    .pa-tender-wrap { display:flex; flex-direction:column; gap:14px; }
    .pa-t-toolbar {
      display:flex; align-items:center; gap:12px;
      padding:0;
    }
    .pa-t-search {
      flex:1;
      display:flex; align-items:center; gap:9px;
      padding:10px 14px; background:#fff;
      border:1.5px solid var(--hair); border-radius:8px;
      transition:border-color 0.15s, box-shadow 0.15s;
    }
    .pa-t-search:focus-within { border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }
    .pa-t-search svg { width:16px; height:16px; color:var(--ink-3); flex-shrink:0; }
    .pa-t-search input {
      flex:1; border:none; outline:none; background:transparent;
      font:inherit; font-size:14px; color:var(--ink); min-width:0;
    }
    .pa-t-search input::placeholder { color:var(--ink-4); }
    .pa-t-search .clear {
      background:transparent; border:none; cursor:pointer;
      color:var(--ink-3); font-size:18px; padding:2px 6px;
      border-radius:4px;
    }
    .pa-t-search .clear:hover { background:var(--hair-3); color:var(--ink); }
    .pa-t-toolbar-meta {
      font-size:12.5px; color:var(--ink-3);
      white-space:nowrap;
    }
    .pa-t-toolbar-meta b { color:var(--ink); font-weight:600; }
    .pa-t-newcat {
      padding:10px 16px;
      background:var(--ink); color:#fff;
      border:none; border-radius:7px;
      font:inherit; font-size:12.5px; font-weight:600;
      letter-spacing:0.03em; cursor:pointer;
      display:inline-flex; align-items:center; gap:7px;
      white-space:nowrap;
    }
    .pa-t-newcat:hover { background:var(--blue-deep); }
    .pa-t-newcat svg { width:14px; height:14px; }
    .pa-t-newcat-bottom {
      padding:14px;
      background:transparent; color:var(--blue-deep);
      border:1px dashed var(--blue); border-radius:10px;
      font:inherit; font-size:13px; font-weight:600;
      letter-spacing:0.03em; cursor:pointer;
      display:inline-flex; align-items:center; justify-content:center; gap:8px;
    }
    .pa-t-newcat-bottom:hover { background:var(--blue-tint); }
    .pa-t-newcat-bottom svg { width:15px; height:15px; }

    /* Tender highlight + empty states */
    .pa-t-empty {
      padding:48px 24px; text-align:center;
      background:#fff; border:1px dashed var(--hair); border-radius:10px;
    }
    .pa-t-empty svg { width:32px; height:32px; color:var(--ink-4); margin-bottom:10px; }
    .pa-t-empty .ttl { font-family:'Source Serif 4',serif; font-size:18px; font-weight:600; color:var(--ink); margin-bottom:4px; }
    .pa-t-empty .sub { font-size:13px; color:var(--ink-3); }
    .pa-t-empty .lnk { color:var(--blue-deep); cursor:pointer; text-decoration:underline; background:transparent; border:none; font:inherit; padding:0; }
    .pa-t-empty-cat {
      padding:14px 16px;
      background:var(--hair-3); color:var(--ink-3);
      border:1px dashed var(--hair); border-radius:8px;
      font-size:12.5px; text-align:center;
    }

    /* Tender header refinements for delete button */
    .pa-t-cat-h { cursor:default; }
    .pa-t-cat-h:hover { background:var(--blue-tint); }
    .pa-t-cat-r { gap:10px; }
  `;

  const SECTIONS = [
    { id: "bands",     label: "Report fee bands",  group: "Pricing", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="14" width="4" height="7"/><rect x="10" y="9" width="4" height="12"/><rect x="17" y="4" width="4" height="17"/></svg>, count: tables.bands.length },
    { id: "tiers",     label: "Camera rental tiers",  group: "Pricing", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="13" rx="1"/><circle cx="12" cy="12.5" r="3"/></svg>, count: tables.tiers.length },
    { id: "mob",       label: "Mobilisation",      group: "Pricing", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>, count: tables.mob.length },
    { id: "addons",    label: "Add-ons",           group: "Pricing", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14"/></svg>, count: Object.keys(tables.addons).length },
    { id: "scenarios", label: "Scenarios",         group: "Library", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>, count: tables.scenarios.length },
    { id: "images",    label: "Product images",    group: "Library", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>, count: (tables.productImages||[]).length },
    { id: "cases",     label: "Case studies",      group: "Library", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4M8 12h8M8 16h6M8 8h4"/></svg>, count: (tables.caseStudies||[]).length },
    { id: "tender",    label: "Tender library",    group: "Library", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6M9 9h2"/></svg>, count: tender ? tender.categories.reduce((a,c)=>a+c.questions.length,0) : 0 },
    { id: "users",     label: "Users & roles",     group: "People",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="9" r="3.5"/><path d="M3 21c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5"/><circle cx="17" cy="10" r="2.5"/><path d="M21 19c0-2.2-1.8-4-4-4"/></svg>, count: users ? users.length : 0 },
    { id: "insights",  label: "Activity & insights", group: "People",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>, count: quotes ? quotes.length : 0 },
    { id: "log",       label: "Activity log",       group: "People",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></svg>, count: activityLog ? activityLog.length : 0 },
    { id: "settings",  label: "General settings",  group: "Library", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>, count: null },
    { id: "backend",   label: "Backend connection", group: "System", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6"/><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></svg>, count: null, ownerOnly: true },
  ].filter(s => !s.ownerOnly || (session && session.role === "owner"));

  const titles = {
    bands:     { eyebrow: "Pricing · 01", h1: "Report fee bands", lede: "One report is produced per quote. The band is selected by effective camera-days (cameras × deployment days, ×4 if 15-min capture is on)." },
    tiers:     { eyebrow: "Pricing · 02", h1: "Camera rental tiers", lede: "Per-camera prices by tier × duration × connection type. The tier is selected by total cameras across all sites in the quote." },
    mob:       { eyebrow: "Pricing · 03", h1: "Mobilisation bands", lede: "One mobilisation fee per site, charged for install and end-of-deployment retrieval. Additional unplanned visits use the same fee." },
    addons:    { eyebrow: "Pricing · 04", h1: "Add-ons & uplifts", lede: "Optional service uplifts. The follow-up audit applies as a percentage discount on camera rental for a same-scope re-audit." },
    scenarios: { eyebrow: "Library", h1: "Quote scenarios", lede: "Pre-built deployments that appear as quick-fill cards in the calculator. Reorder or edit to match your most common engagements." },
    images:    { eyebrow: "Library", h1: "Product images", lede: "Upload images of cameras, gateways, deliverables or anything else reps might want to attach to a quote. Reps see this library inside the quote builder." },
    cases:     { eyebrow: "Library", h1: "Case studies", lede: "Client success stories reps can attach to a quote to back up their pitch. Add summary, results, sector, and an optional cover image." },
    tender:    { eyebrow: "Library", h1: "Tender library", lede: "Pre-approved answers used in tender submissions. Each question can carry multiple answer lengths so reps can pick the right size for the form field." },
    users:     { eyebrow: "People",  h1: "Users & roles", lede: "Manage who can sign into the portal and what they can see. Admins see everything; sales reps see calculator + tender; partners are read-only externals." },
    insights:  { eyebrow: "People",  h1: "Activity & insights", lede: "See who is building quotes, pipeline value by rep, conversion rates, and trends over time." },
    log:       { eyebrow: "People",  h1: "Activity log",         lede: "Audit trail of every action: quote drafts, sends, deletes, status changes and sign-ins. Filter by user, action type, or time. Export to CSV." },
    settings:  { eyebrow: "Library", h1: "General settings", lede: "Currency, GST, validity period and other calculator defaults." },
    backend:   { eyebrow: "System",  h1: "Backend connection", lede: "Connect the portal to a Google Sheet so every rep shares the same data. Free, no infra to run — paste a script, deploy, drop the URL in." },
  };

  const titleInfo = titles[section];
  const grouped = ["Pricing", "Library", "People", "System"];

  return (
    <div className="pa">
      <style>{css}</style>

      {/* LEFT RAIL */}
      <aside className="pa-rail">
        <div className="pa-rail-h">
          <div className="ttl serif">Admin</div>
          <div className="sub">Tune the calculator without leaving the portal.</div>
        </div>
        {grouped.map((g) => (
          <div className="pa-section-group" key={g}>
            <div className="pa-section-h">{g}</div>
            <div className="pa-nav">
              {SECTIONS.filter(s => s.group === g).map((s) => (
                <button key={s.id} className={section===s.id?"on":""} onClick={() => setSection(s.id)}>
                  <span className="ic">{s.icon}</span>
                  <span>{s.label}</span>
                  {s.count !== null && <span className="cnt">{s.count}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="pa-reset">
          <button onClick={section === "tender" ? onResetTender : onReset}>
            Reset {section === "tender" ? "tender library" : "all tables"} to defaults
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="pa-content">

        <div className="pa-hero">
          <div>
            <div className="eyebrow">{titleInfo.eyebrow}</div>
            <h1>{titleInfo.h1}</h1>
            <p>{titleInfo.lede}</p>
          </div>
          {false && ["bands","tiers","mob","addons","scenarios"].includes(section) && (
          <div className="pa-preview">
            <div className="lab">Sample quote · 12-camera hospital</div>
            <div className="v">{WEUtil.fmt(previewCurrent.total)}</div>
            <div className="d">
              {previewDelta === 0 ? (
                <span className="ref">Matches default pricing</span>
              ) : (
                <>
                  <span className={`delta ${previewDelta>0?"up":"dn"}`}>
                    {previewDelta>0?"+":""}{WEUtil.fmt(previewDelta)}
                  </span>
                  <span className="ref">vs. defaults ({WEUtil.fmt(previewDefault.total)})</span>
                </>
              )}
            </div>
          </div>
          )}
        </div>

        {/* SECTION: BANDS */}
        {section === "bands" && (
          <div className="pa-tbl-wrap">
            <div className="pa-tbl-h">
              <span className="ttl">Report fee bands</span>
              <span className="help">Band is selected by effective camera-days. Bands must be contiguous.</span>
            </div>
            <div className="pa-tbl-scroll">
            <table className="pa-tbl">
              <thead>
                <tr>
                  <th style={{width:160}}>Band</th>
                  <th>Description</th>
                  <th className="num" style={{width:120}}>Min cam-days</th>
                  <th className="num" style={{width:120}}>Max cam-days</th>
                  <th className="num" style={{width:140}}>Fee · AUD</th>
                </tr>
              </thead>
              <tbody>
                {tables.bands.map((b, i) => (
                  <tr key={i}>
                    <td>
                      <div className="pa-band-key">
                        <span className={`pa-band-dot b${i}`}></span>
                        <span className="pa-cell-static key">{b.label}</span>
                      </div>
                    </td>
                    <td><span className="pa-cell"><input value={b.desc} onChange={(e) => updArr("bands", i, { desc: e.target.value })} /></span></td>
                    <td className="num"><span className="pa-cell"><input className="mono" type="number" min="0" value={b.minCD} onChange={(e) => updArr("bands", i, { minCD: +e.target.value || 0 })} /></span></td>
                    <td className="num"><span className="pa-cell"><input className="mono" type="number" min="0" value={b.maxCD} onChange={(e) => updArr("bands", i, { maxCD: +e.target.value || 0 })} /></span></td>
                    <td className="num"><span className="pa-cell pa-prefix-input"><span className="pfx">$</span><input className="mono" type="number" min="0" value={b.fee} onChange={(e) => updArr("bands", i, { fee: +e.target.value || 0 })} /></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* SECTION: TIERS */}
        {section === "tiers" && (
          <div className="pa-tbl-wrap">
            <div className="pa-tbl-h">
              <span className="ttl">Camera rental · per-camera prices</span>
              <span className="help">Tier qualifies at min cameras. Mixed WiFi + 4G fleets apply the tier discount to each unit type.</span>
            </div>
            <div className="pa-tbl-scroll">
            <table className="pa-tbl wide">
              <thead>
                <tr>
                  <th style={{width:110}}>Tier</th>
                  <th className="num" style={{width:80}}>Min cams</th>
                  <th className="num" style={{width:90}}>Discount</th>
                  <th className="num">7d · WiFi</th>
                  <th className="num">7d · 4G</th>
                  <th className="num">14d · WiFi</th>
                  <th className="num">14d · 4G</th>
                  <th className="num">28d · WiFi</th>
                  <th className="num">28d · 4G</th>
                </tr>
              </thead>
              <tbody>
                {tables.tiers.map((t, i) => (
                  <tr key={i}>
                    <td><span className="pa-cell-static key">{t.key}</span></td>
                    <td className="num"><span className="pa-cell"><input className="mono" type="number" min="0" value={t.minCams} onChange={(e) => updArr("tiers", i, { minCams: +e.target.value || 0 })} /></span></td>
                    <td className="num"><span className="pa-cell pa-suffix-input"><span className="sfx">%</span><input className="mono" type="number" min="0" max="100" step="1" value={Math.round(t.disc*100)} onChange={(e) => updArr("tiers", i, { disc: (+e.target.value || 0)/100 })} /></span></td>
                    {[
                      ["r7w","r7g","r14w","r14g","r28w","r28g"],
                    ][0].map((k) => (
                      <td key={k} className="num" style={{minWidth:96}}><span className="pa-cell pa-prefix-input"><span className="pfx">$</span><input className="mono" type="number" min="0" value={t[k]} onChange={(e) => updArr("tiers", i, { [k]: +e.target.value || 0 })} /></span></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* SECTION: MOB */}
        {section === "mob" && (
          <div className="pa-tbl-wrap">
            <div className="pa-tbl-h">
              <span className="ttl">Mobilisation · fee per visit</span>
              <span className="help">Covers install + retrieval. Same fee applies to mid-deployment unplanned visits.</span>
            </div>
            <div className="pa-tbl-scroll">
            <table className="pa-tbl">
              <thead>
                <tr>
                  <th style={{width:140}}>Band</th>
                  <th>Coverage area</th>
                  <th className="num" style={{width:160}}>Fee per visit · AUD</th>
                </tr>
              </thead>
              <tbody>
                {tables.mob.map((m, i) => (
                  <tr key={i}>
                    <td>
                      <div className="pa-band-key">
                        <span className={`pa-band-dot b${i}`}></span>
                        <span className="pa-cell-static key">{m.label}</span>
                      </div>
                    </td>
                    <td><span className="pa-cell"><input value={m.desc} onChange={(e) => updArr("mob", i, { desc: e.target.value })} /></span></td>
                    <td className="num"><span className="pa-cell pa-prefix-input"><span className="pfx">$</span><input className="mono" type="number" min="0" value={m.fee} onChange={(e) => updArr("mob", i, { fee: +e.target.value || 0 })} /></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* SECTION: ADDONS */}
        {section === "addons" && (
          <div className="pa-tbl-wrap">
            <div className="pa-tbl-h">
              <span className="ttl">Add-ons &amp; uplifts</span>
              <span className="help">Core add-ons drive the calculator. Custom add-ons are listed for reference. Follow-up is a fraction (0.10 = 10%).</span>
            </div>
            <div className="pa-tbl-scroll">
            <table className="pa-tbl">
              <thead>
                <tr>
                  <th>Add-on</th>
                  <th style={{width:160}}>Unit</th>
                  <th className="num" style={{width:180}}>Price · AUD</th>
                  <th style={{width:44}}></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tables.addons).map(([id, a]) => {
                  const SYSTEM = ["capture15","extended12","rushInstall","workshop","training","followUp"];
                  const isSystem = SYSTEM.includes(id);
                  return (
                  <tr key={id}>
                    <td>
                      <span className="pa-cell" style={{display:"flex", alignItems:"center", gap:8}}>
                        <input style={{fontWeight:600, flex:1}} value={a.label} onChange={(e) => updAddon(id, { label: e.target.value })} />
                        {isSystem ? (
                          <span style={{fontSize:9, fontWeight:700, letterSpacing:"0.08em", padding:"2px 6px", background:"var(--blue-tint)", color:"var(--blue-deep)", borderRadius:9, textTransform:"uppercase"}}>Core</span>
                        ) : (
                          <span style={{fontSize:9, fontWeight:700, letterSpacing:"0.08em", padding:"2px 6px", background:"var(--hair-3)", color:"var(--ink-3)", borderRadius:9, textTransform:"uppercase"}}>Custom</span>
                        )}
                      </span>
                    </td>
                    <td><span className="pa-cell"><input value={a.unit} onChange={(e) => updAddon(id, { unit: e.target.value })} /></span></td>
                    <td className="num">
                      {id === "followUp" ? (
                        <span className="pa-cell pa-suffix-input">
                          <span className="sfx">%</span>
                          <input className="mono" type="number" min="0" max="100" step="1" value={Math.round(a.price*100)} onChange={(e) => updAddon(id, { price: (+e.target.value || 0)/100 })} style={{paddingRight:26}} />
                        </span>
                      ) : (
                        <span className="pa-cell pa-prefix-input">
                          <span className="pfx">$</span>
                          <input className="mono" type="number" min="0" value={a.price} onChange={(e) => updAddon(id, { price: +e.target.value || 0 })} />
                        </span>
                      )}
                    </td>
                    <td><button className="pa-rm-btn" onClick={() => removeAddon(id)} title={isSystem ? "Remove core add-on (will affect calculator)" : "Remove"}>×</button></td>
                  </tr>
                  );
                })}
                <tr>
                  <td colSpan={4} style={{padding:0}}>
                    <button onClick={addAddon} style={{width:"100%", padding:"12px", background:"transparent", border:"none", borderTop:"1px dashed var(--hair)", font:"inherit", fontSize:13, fontWeight:600, color:"var(--blue-deep)", cursor:"pointer", letterSpacing:"0.03em"}}>＋ Add new add-on or uplift</button>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* SECTION: SCENARIOS */}
        {section === "scenarios" && (
          <div className="pa-sc-wrap">
            {tables.scenarios.map((sc, scIdx) => {
              const tmp = WEP.calculate({ sites: sc.sites.map(x => ({ ...WEP.emptySite(), ...x })), workshops:0, trainings:0, followUp:false }, tables);
              return (
                <div className="pa-sc" key={sc.id}>
                  <div className="pa-sc-h">
                    <ScenarioIconPicker
                      value={sc.iconKey || sc.id}
                      onChange={(k) => updArr("scenarios", scIdx, { iconKey: k })}
                    />
                    <input className="id-edit" value={sc.id} onChange={(e) => updArr("scenarios", scIdx, { id: e.target.value })} title="Scenario key (used internally)" />
                    <input className="lbl" value={sc.label} onChange={(e) => updArr("scenarios", scIdx, { label: e.target.value })} placeholder="Scenario label" />
                    <input className="sub" value={sc.sub} onChange={(e) => updArr("scenarios", scIdx, { sub: e.target.value })} placeholder="Short description" />
                    <span className="preview">{WEUtil.fmt(tmp.total)}</span>
                    <button className="pa-rm-btn" onClick={() => removeScenario(scIdx)} title="Remove scenario">×</button>
                  </div>

                  <div className="pa-tbl-scroll">
                  <table className="pa-tbl" style={{minWidth:760}}>
                    <thead>
                      <tr>
                        <th style={{width:32}}></th>
                        <th style={{minWidth:160}}>Site name</th>
                        <th style={{width:120}}>Mob. band</th>
                        <th className="num" style={{width:90}}>WiFi</th>
                        <th className="num" style={{width:90}}>4G</th>
                        <th className="num" style={{width:90}}>Days</th>
                        <th className="center" style={{width:90}}>15-min</th>
                        <th style={{width:32}}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sc.sites.map((s, siteIdx) => (
                        <tr key={siteIdx}>
                          <td className="center"><span className="pa-cell-static mono" style={{padding:"8px 0"}}>{String(siteIdx+1).padStart(2,"0")}</span></td>
                          <td><span className="pa-cell"><input value={s.name||""} onChange={(e) => updScenarioSite(scIdx, siteIdx, { name: e.target.value })} placeholder={`Site ${siteIdx+1}`} /></span></td>
                          <td><span className="pa-cell"><select value={s.mobBand||"CBD"} onChange={(e) => updScenarioSite(scIdx, siteIdx, { mobBand: e.target.value })}>{tables.mob.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}</select></span></td>
                          <td className="num"><span className="pa-cell"><input className="mono" type="number" min="0" value={s.wifi||0} onChange={(e) => updScenarioSite(scIdx, siteIdx, { wifi: +e.target.value || 0 })} /></span></td>
                          <td className="num"><span className="pa-cell"><input className="mono" type="number" min="0" value={s.fourg||0} onChange={(e) => updScenarioSite(scIdx, siteIdx, { fourg: +e.target.value || 0 })} /></span></td>
                          <td className="num"><span className="pa-cell"><select value={s.days||14} onChange={(e) => updScenarioSite(scIdx, siteIdx, { days: +e.target.value })} className="mono" style={{textAlign:"right"}}>{WEP.DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></span></td>
                          <td className="center"><span className="pa-cell" style={{display:"flex", justifyContent:"center"}}><input type="checkbox" checked={!!s.capture15} onChange={(e) => updScenarioSite(scIdx, siteIdx, { capture15: e.target.checked })} style={{width:18, height:18, accentColor:"var(--blue)", cursor:"pointer"}} /></span></td>
                          <td>
                            {sc.sites.length > 1 && (
                              <button className="pa-rm-btn" onClick={() => window.appConfirm({ title: "Remove site", message: `Remove this site from ${sc.label}?`, confirmLabel: "Remove", destructive: true }, () => updArr("scenarios", scIdx, { sites: sc.sites.filter((_,i)=>i!==siteIdx) }))} title="Remove site">×</button>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={8}>
                          <button
                            onClick={() => updArr("scenarios", scIdx, { sites: [...sc.sites, { name: `Site ${sc.sites.length+1}`, mobBand: "CBD", wifi: 4, fourg: 0, days: 14 }] })}
                            style={{margin:"6px 12px", padding:"6px 12px", background:"transparent", border:"1px dashed var(--hair)", borderRadius:5, font:"inherit", fontSize:12, color:"var(--ink-3)", cursor:"pointer"}}
                          >＋ Add site to this scenario</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  </div>
                </div>
              );
            })}
            <button className="pa-sc-add" onClick={addScenario}>＋ Add new scenario</button>
          </div>
        )}

        {/* SECTION: TENDER */}
        {section === "tender" && tender && (
          <TenderAdminSection
            tender={tender}
            expandedTenderCat={expandedTenderCat}
            setExpandedTenderCat={setExpandedTenderCat}
            updTenderCat={updTenderCat}
            updTenderQ={updTenderQ}
            updTenderA={updTenderA}
            addTenderQ={addTenderQ}
            removeTenderQ={removeTenderQ}
            addTenderA={addTenderA}
            removeTenderA={removeTenderA}
            addTenderCategory={addTenderCategory}
            removeTenderCategory={removeTenderCategory}
          />
        )}

        {/* SECTION: USERS */}
        {section === "users" && (
          <UsersAdminSection users={users} setUsers={setUsers} session={session} />
        )}

        {/* SECTION: PRODUCT IMAGES */}
        {section === "images" && (
          <ProductImagesAdminSection tables={tables} setTables={setTables} session={session} />
        )}

        {/* SECTION: CASE STUDIES */}
        {section === "cases" && (
          <CaseStudiesAdminSection tables={tables} setTables={setTables} session={session} />
        )}

        {/* SECTION: INSIGHTS */}
        {section === "insights" && (
          <InsightsAdminSection quotes={quotes || []} users={users || []} onOpenQuote={onOpenQuote} />
        )}

        {/* SECTION: ACTIVITY LOG */}
        {section === "log" && (
          <ActivityLogAdminSection activityLog={activityLog || []} setActivityLog={setActivityLog} users={users || []} />
        )}

        {/* SECTION: BACKEND */}
        {section === "backend" && session && session.role === "owner" && (
          <BackendSettingsSection
            tables={tables} setTables={setTables}
            tender={tender} setTender={setTender}
            users={users || []} setUsers={setUsers}
            quotes={quotes || []} setQuotes={setQuotes}
            activityLog={activityLog || []} setActivityLog={setActivityLog}
          />
        )}

        {/* SECTION: SETTINGS */}
        {section === "settings" && (
          <div className="pa-settings">
            <div className="pa-set-card">
              <label>Currency</label>
              <div className="desc">Three-letter code shown on the calculator and quote.</div>
              <input value={tables.settings.currency} onChange={(e) => updSettings({ currency: e.target.value.toUpperCase().slice(0,3) })} />
            </div>
            <div className="pa-set-card">
              <label>GST rate</label>
              <div className="desc">Australian GST is 10%. All quote amounts are calculated ex-GST; this drives the inc-GST line on PDFs.</div>
              <div className="pa-suffix-input" style={{position:"relative"}}>
                <span className="sfx" style={{position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color:"var(--ink-3)", fontFamily:"'JetBrains Mono',monospace", pointerEvents:"none"}}>%</span>
                <input type="number" min="0" max="100" step="0.5" value={Math.round(tables.settings.gstRate*1000)/10} onChange={(e) => updSettings({ gstRate: (+e.target.value || 0)/100 })} />
              </div>
            </div>
            <div className="pa-set-card">
              <label>Quote validity</label>
              <div className="desc">How long a quote remains valid after issue, shown on the PDF.</div>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color:"var(--ink-3)", fontFamily:"'JetBrains Mono',monospace", pointerEvents:"none", fontSize:13}}>days</span>
                <input type="number" min="1" max="365" value={tables.settings.quoteValidityDays} onChange={(e) => updSettings({ quoteValidityDays: +e.target.value || 30 })} />
              </div>
            </div>
            <div className="pa-set-card">
              <label>Minimum cameras per quote</label>
              <div className="desc">Quotes below this threshold show a warning. Tier 1 starts at 4 by default.</div>
              <input type="number" min="1" value={tables.settings.minCameras} onChange={(e) => updSettings({ minCameras: +e.target.value || 1 })} />
            </div>
            <div className="pa-set-card" style={{gridColumn:"span 2"}}>
              <label>15-min capture image multiplier</label>
              <div className="desc">15-minute capture mode multiplies image volume. The calculator multiplies effective camera-days by this factor when 15-min mode is on at a site, which can push a deployment up one or more report bands.</div>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color:"var(--ink-3)", fontFamily:"'JetBrains Mono',monospace", pointerEvents:"none", fontSize:13}}>× cam-days</span>
                <input type="number" min="1" step="0.5" value={tables.settings.captureMultiplier} onChange={(e) => updSettings({ captureMultiplier: +e.target.value || 1 })} />
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

window.PortalAdmin = PortalAdmin;

// ── Scenario icon picker ──
function ScenarioIconPicker({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const icons = window.WE_ICONS || {};
  const keys = Object.keys(icons);

  return (
    <div ref={ref} style={{position:"relative"}}>
      <button className="pa-sc-icon-btn" onClick={() => setOpen(!open)} title="Change scenario icon">
        {window.renderIcon ? window.renderIcon(value) : "★"}
        <span className="edit-dot">✎</span>
      </button>
      {open && (
        <div className="pa-icon-popover">
          {keys.map((k) => (
            <button key={k} className={value===k?"on":""} onClick={() => { onChange(k); setOpen(false); }} title={icons[k].label}>
              {window.renderIcon(k)}
              <span className="lab">{icons[k].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
window.ScenarioIconPicker = ScenarioIconPicker;

// ── Users Admin section ──
function UsersAdminSection({ users, setUsers, session }) {
  const [query, setQuery] = React.useState("");
  const [filterRole, setFilterRole] = React.useState("all");
  const [showPasswords, setShowPasswords] = React.useState({});

  const initialsOf = (name) => {
    const parts = (name || "").trim().split(/\s+/);
    if (parts.length === 1) return (parts[0].slice(0,2) || "??").toUpperCase();
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  };

  const updUser = (uid, patch) => {
    // Special handling for role changes: if promoting someone TO owner, demote
    // the existing owner to admin so we always have exactly one Owner.
    if (patch.role && patch.role === "owner") {
      if (!session || session.role !== "owner") {
        alert("Only the Owner can transfer ownership.");
        return;
      }
      const target = users.find(x => x._uid === uid);
      if (!target) return;
      if (target.role === "owner") return; // already owner
      window.appConfirm({
        title: "Transfer ownership",
        message: `Make ${target.name} (${target.email}) the new Owner? You'll be demoted to Admin. This can only be reversed by the new Owner.`,
        confirmLabel: "Transfer ownership",
        destructive: true,
      }, () => {
        setUsers(users.map(u => {
          if (u._uid === uid) return { ...u, role: "owner", initials: u.initials };
          if (u.role === "owner") return { ...u, role: "admin" };
          return u;
        }));
      });
      return;
    }
    setUsers(users.map(u => u._uid === uid ? {
      ...u, ...patch,
      initials: patch.name !== undefined ? initialsOf(patch.name) : u.initials,
    } : u));
  };

  const addUser = () => {
    const id = "new" + Date.now().toString(36).slice(-4);
    const uid = "u_" + Date.now().toString(36);
    const newU = {
      _uid: uid,
      email: `new.${id}@shrunk.ai`,
      password: "wasteeye",
      name: "New User",
      initials: "NU",
      role: "sales",
      title: "Sales rep",
    };
    setUsers([...users, newU]);
  };

  const removeUser = (uid) => {
    const u = users.find(x => x._uid === uid);
    if (!u) return;
    const info = (title, message) => {
      window.appConfirm && window.appConfirm({
        title, message,
        confirmLabel: "OK",
        cancelLabel: "Close",
      }, () => {});
    };
    if (session && session.email === u.email) {
      info("Can't remove yourself", "You can't remove your own account while signed in.");
      return;
    }
    if (u.role === "owner") {
      info("Owner can't be removed", "The Owner account cannot be removed. Transfer ownership to another user first.");
      return;
    }
    if (u.role === "admin" && session && session.role !== "owner") {
      info("Owner-only action", "Only the Owner can remove admin accounts. Contact scott@shrunk.ai.");
      return;
    }
    const adminCount = users.filter(x => x.role === "admin" || x.role === "owner").length;
    if ((u.role === "admin" || u.role === "owner") && adminCount <= 1) {
      info("Last admin", "Can't remove the only admin — promote another user first.");
      return;
    }
    window.appConfirm({
      title: "Remove user",
      message: `Remove ${u.name} (${u.email})? They won't be able to sign in. Click Save in the header afterwards to push this to Sheets.`,
      confirmLabel: "Remove user",
      destructive: true,
    }, () => setUsers(users.filter(x => x._uid !== uid)));
  };

  const togglePw = (uid) => setShowPasswords({ ...showPasswords, [uid]: !showPasswords[uid] });

  const q = query.trim().toLowerCase();
  const filtered = users.filter(u => {
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (!q) return true;
    return (u.name||"").toLowerCase().includes(q)
        || (u.email||"").toLowerCase().includes(q)
        || (u.title||"").toLowerCase().includes(q);
  });

  const counts = {
    all: users.length,
    owner: users.filter(u => u.role === "owner").length,
    admin: users.filter(u => u.role === "admin").length,
    sales: users.filter(u => u.role === "sales").length,
    partner: users.filter(u => u.role === "partner").length,
  };

  const css = `
    .pu-toolbar { display:flex; align-items:center; gap:12px; margin-bottom:14px; flex-wrap:wrap; }
    .pu-search { flex:1; min-width:260px; display:flex; align-items:center; gap:9px; padding:10px 14px; background:#fff; border:1.5px solid var(--hair); border-radius:8px; }
    .pu-search:focus-within { border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }
    .pu-search svg { width:16px; height:16px; color:var(--ink-3); flex-shrink:0; }
    .pu-search input { flex:1; border:none; outline:none; background:transparent; font:inherit; font-size:14px; color:var(--ink); min-width:0; }
    .pu-search input::placeholder { color:var(--ink-4); }
    .pu-search .clear { background:transparent; border:none; cursor:pointer; color:var(--ink-3); font-size:16px; padding:2px 4px; }

    .pu-filters { display:flex; gap:4px; padding:3px; background:#fff; border:1px solid var(--hair); border-radius:8px; }
    .pu-filter { padding:7px 11px; background:transparent; border:none; font:inherit; font-size:12px; font-weight:600; color:var(--ink-3); cursor:pointer; border-radius:5px; display:inline-flex; align-items:center; gap:7px; }
    .pu-filter:hover { background:var(--hair-3); color:var(--ink-2); }
    .pu-filter.on { background:var(--ink); color:#fff; }
    .pu-filter .cnt { font-family:'JetBrains Mono',monospace; font-size:10.5px; padding:1px 6px; background:rgba(0,0,0,0.08); border-radius:9px; }
    .pu-filter.on .cnt { background:rgba(255,255,255,0.18); }

    .pu-add { padding:10px 16px; background:var(--ink); color:#fff; border:none; border-radius:7px; font:inherit; font-size:12.5px; font-weight:600; letter-spacing:0.03em; cursor:pointer; display:inline-flex; align-items:center; gap:7px; }
    .pu-add:hover { background:var(--blue-deep); }
    .pu-add svg { width:14px; height:14px; }

    .pu-tbl-wrap { background:#fff; border:1px solid var(--hair); border-radius:10px; overflow:hidden; }
    .pu-tbl-scroll { overflow-x:auto; }
    .pu-row { display:grid; grid-template-columns:54px 1.5fr 1.5fr 1fr 1.4fr 130px 145px; align-items:center; gap:14px; padding:11px 18px; border-bottom:1px solid var(--hair-2); min-width:1020px; }
    .pu-row:last-child { border-bottom:none; }
    .pu-row.hd { background:var(--hair-3); font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); font-weight:700; padding:9px 18px; border-bottom:1px solid var(--hair); }
    .pu-row:not(.hd):hover { background:#FAFCFE; }

    .pu-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, var(--blue) 0%, var(--blue-deep) 100%); color:#fff; display:grid; place-items:center; font-size:12px; font-weight:700; letter-spacing:0.04em; flex-shrink:0; }
    .pu-avatar.owner   { background:linear-gradient(135deg, #DC2626 0%, #7F1D1D 100%); }
    .pu-avatar.admin   { background:linear-gradient(135deg, #F59E0B 0%, #B85C00 100%); }
    .pu-avatar.partner { background:linear-gradient(135deg, #A855F7 0%, #6B21A8 100%); }

    .pu-owner-pill { font-size:9px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:1px 6px; background:#FEE2E2; color:#991B1B; border-radius:9px; margin-left:6px; }
    .pu-role-select.owner { background-color:#FEE2E2; color:#991B1B; }

    .pu-cell-input { width:100%; box-sizing:border-box; padding:7px 9px; border:1px solid transparent; background:transparent; font:inherit; font-size:13px; color:var(--ink); border-radius:5px; outline:none; }
    .pu-cell-input:hover { background:var(--hair-3); }
    .pu-cell-input:focus { background:#fff; border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }
    .pu-cell-input.mono { font-family:'JetBrains Mono',monospace; font-size:12.5px; }
    .pu-cell-input.name { font-weight:600; }

    .pu-role-select { width:100%; box-sizing:border-box; padding:5px 9px; padding-right:24px; border:1px solid transparent; background:transparent; font:inherit; font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; cursor:pointer; outline:none; border-radius:14px; appearance:none; background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235A6C82' stroke-width='2.5'><path d='M6 9l6 6 6-6'/></svg>"); background-repeat:no-repeat; background-position:right 8px center; }
    .pu-role-select.admin { background-color:var(--warn-bg); color:var(--warn); }
    .pu-role-select.sales { background-color:var(--blue-tint); color:var(--blue-deep); }
    .pu-role-select.partner { background-color:#F3E8FF; color:#6B21A8; }
    .pu-role-select:hover { box-shadow:0 0 0 1px var(--hair) inset; }
    .pu-role-select:focus { box-shadow:0 0 0 2px var(--blue) inset; }

    .pu-pw-cell { display:flex; align-items:center; gap:4px; }
    .pu-pw-input { flex:1; padding:6px 9px; border:1px solid transparent; background:transparent; font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--ink); border-radius:5px; outline:none; letter-spacing:0.04em; min-width:0; width:100%; }
    .pu-pw-input:hover { background:var(--hair-3); }
    .pu-pw-input:focus { background:#fff; border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }
    .pu-pw-toggle { width:26px; height:26px; padding:0; background:transparent; border:1px solid transparent; color:var(--ink-3); cursor:pointer; display:grid; place-items:center; border-radius:4px; flex-shrink:0; }
    .pu-pw-toggle:hover { background:var(--hair-3); color:var(--ink); }
    .pu-pw-toggle svg { width:14px; height:14px; }

    .pu-you-pill { font-size:9px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:1px 6px; background:var(--blue-tint); color:var(--blue-deep); border-radius:9px; margin-left:6px; }

    .pu-rm-btn { width:32px; height:32px; padding:0; background:transparent; border:1px solid var(--hair-2); color:var(--ink-3); cursor:pointer; border-radius:5px; display:grid; place-items:center; }
    .pu-rm-btn:hover { background:#FEF2F2; color:var(--neg); border-color:#FCA5A5; }
    .pu-rm-btn:disabled { opacity:0.3; cursor:not-allowed; }
    .pu-rm-btn:disabled:hover { background:transparent; color:var(--ink-3); border-color:var(--hair-2); }
    .pu-rm-btn svg { width:14px; height:14px; }

    .pu-suspend-btn {
      padding:5px 9px; background:transparent; border:1px solid var(--hair-2); border-radius:5px;
      color:var(--ink-2); cursor:pointer; font:inherit; font-size:11.5px; font-weight:600;
      display:inline-flex; align-items:center; gap:5px; margin-right:6px;
    }
    .pu-suspend-btn svg { width:12px; height:12px; }
    .pu-suspend-btn:hover { background:#FEF3E2; color:var(--warn); border-color:#FCE0AC; }
    .pu-suspend-btn:disabled { opacity:0.35; cursor:not-allowed; }
    .pu-suspend-btn:disabled:hover { background:transparent; color:var(--ink-2); border-color:var(--hair-2); }

    .pu-suspended-pill { font-size:9px; font-weight:700; letter-spacing:0.08em; padding:1px 6px; background:#FEF3E2; color:var(--warn); border-radius:9px; margin-left:6px; text-transform:uppercase; }

    .pu-help { margin-top:14px; padding:12px 14px; background:var(--blue-tint); color:var(--blue-deep); border-left:3px solid var(--blue); border-radius:0 6px 6px 0; font-size:12.5px; line-height:1.55; }
    .pu-help .role { font-weight:700; padding:1px 6px; border-radius:3px; font-size:11px; letter-spacing:0.04em; }
    .pu-help .role.owner   { background:#FEE2E2; color:#991B1B; }
    .pu-help .role.admin   { background:var(--warn-bg); color:var(--warn); }
    .pu-help .role.sales   { background:#fff; color:var(--blue-deep); border:1px solid var(--blue); }
    .pu-help .role.partner { background:#F3E8FF; color:#6B21A8; }

    .pu-empty { padding:40px 24px; text-align:center; background:#fff; border:1px dashed var(--hair); border-radius:10px; color:var(--ink-3); font-size:13px; }
  `;

  if (!users) {
    return <div className="pu-empty">User data hasn't loaded yet — try refreshing.</div>;
  }

  return (
    <div>
      <style>{css}</style>

      <div className="pu-toolbar">
        <div className="pu-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email or title…" />
          {query && <button className="clear" onClick={() => setQuery("")}>×</button>}
        </div>
        <div className="pu-filters">
          <button className={`pu-filter ${filterRole==="all"?"on":""}`} onClick={() => setFilterRole("all")}>All <span className="cnt">{counts.all}</span></button>
          <button className={`pu-filter ${filterRole==="owner"?"on":""}`} onClick={() => setFilterRole("owner")}>Owner <span className="cnt">{counts.owner}</span></button>
          <button className={`pu-filter ${filterRole==="admin"?"on":""}`} onClick={() => setFilterRole("admin")}>Admin <span className="cnt">{counts.admin}</span></button>
          <button className={`pu-filter ${filterRole==="sales"?"on":""}`} onClick={() => setFilterRole("sales")}>Sales <span className="cnt">{counts.sales}</span></button>
          <button className={`pu-filter ${filterRole==="partner"?"on":""}`} onClick={() => setFilterRole("partner")}>Partner <span className="cnt">{counts.partner}</span></button>
        </div>
        <button className="pu-add" onClick={addUser}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
          Invite user
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="pu-empty">No users match the current filter.</div>
      ) : (
        <div className="pu-tbl-wrap">
          <div className="pu-tbl-scroll">
            <div className="pu-row hd">
              <div></div>
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div>Title</div>
              <div>Password</div>
              <div></div>
            </div>
            {filtered.map((u) => {
              const isYou = session && session.email === u.email;
              const isOwner = u.role === "owner";
              const onlyAdmin = (u.role === "admin" || u.role === "owner") && (counts.admin + counts.owner) <= 1;
              const sessionIsOwner = session && session.role === "owner";
              const cannotRemoveAdmin = u.role === "admin" && !sessionIsOwner;
              const uid = u._uid;
              return (
                <div className="pu-row" key={uid}>
                  <div className={`pu-avatar ${u.role}`}>{u.initials}</div>
                  <div>
                    <input className="pu-cell-input name" value={u.name} onChange={(e) => updUser(uid, { name: e.target.value })} />
                    {isYou && <span className="pu-you-pill">You</span>}
                    {u.suspended && <span className="pu-suspended-pill">Suspended</span>}
                    {isOwner && <span className="pu-owner-pill">Owner</span>}
                  </div>
                  <div>
                    <input className="pu-cell-input mono" value={u.email} onChange={(e) => updUser(uid, { email: e.target.value })} disabled={isOwner} title={isOwner ? "Owner email is locked" : ""} />
                  </div>
                  <div>
                    <select className={`pu-role-select ${u.role}`} value={u.role} onChange={(e) => updUser(uid, { role: e.target.value })}
                            disabled={isOwner || (onlyAdmin && (u.role === "admin" || u.role === "owner")) || cannotRemoveAdmin}
                            title={isOwner ? "Owner role can't be changed directly. Promote another user to Owner to transfer." : (cannotRemoveAdmin ? "Only the Owner can change admin roles" : (onlyAdmin ? "Promote another user to admin first" : ""))}>
                      <option value="owner" disabled={!sessionIsOwner && !isOwner}>Owner{!sessionIsOwner && !isOwner ? " (Owner only)" : ""}</option>
                      <option value="admin">Admin</option>
                      <option value="sales">Sales</option>
                      <option value="partner">Partner</option>
                    </select>
                  </div>
                  <div>
                    <input className="pu-cell-input" value={u.title || ""} onChange={(e) => updUser(uid, { title: e.target.value })} placeholder="e.g. Sales rep · Vic" />
                  </div>
                  <div className="pu-pw-cell">
                    <input className="pu-pw-input" type={showPasswords[uid] ? "text" : "password"} value={u.password || ""} onChange={(e) => updUser(uid, { password: e.target.value })} placeholder="set password…" />
                    <button className="pu-pw-toggle" onClick={() => togglePw(uid)} title={showPasswords[uid] ? "Hide" : "Reveal"}>
                      {showPasswords[uid] ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.4 5.2A9.8 9.8 0 0 1 12 5c5 0 9 5 10 7-0.5 1-1.6 2.6-3.3 4M6.3 6.3C3.6 8 2 11 2 12c1 2 5 7 10 7 1.6 0 3-0.4 4.3-1"/></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  <div>
                    <button className="pu-rm-btn"
                            onClick={() => removeUser(uid)}
                            disabled={isYou || isOwner || cannotRemoveAdmin || onlyAdmin}
                            title={isOwner ? "Owner can't be removed" : (isYou ? "Can't remove yourself" : (cannotRemoveAdmin ? "Only the Owner can remove admins" : (onlyAdmin ? "Promote another admin first" : "Remove user")))}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pu-help">
        <b>Role permissions:</b>{" "}
        <span className="role owner">Owner</span> full access, including removing admin accounts.{" "}
        <span className="role admin">Admin</span> sees everything including this tab.{" "}
        <span className="role sales">Sales</span> and <span className="role partner">Partner</span> see the Calculator, Saved Quotes and Tender library — both can build, save and send quotes.
        <br/>
        <span style={{color:"var(--ink-3)", marginTop:6, display:"inline-block"}}>
          Only the Owner can change or remove admin accounts. The Owner account itself is locked from edits and can't be removed via the portal.
        </span>
      </div>
    </div>
  );
}

// ── Tender Admin section (search + add/remove categories, questions, answers) ──
function TenderAdminSection({
  tender, expandedTenderCat, setExpandedTenderCat,
  updTenderCat, updTenderQ, updTenderA,
  addTenderQ, removeTenderQ, addTenderA, removeTenderA,
  addTenderCategory, removeTenderCategory,
}) {
  const [query, setQuery] = React.useState("");

  // For search: compute matching status per category/question
  const q = query.trim().toLowerCase();
  const matchQ = (qst) => {
    if (!q) return true;
    if ((qst.question||"").toLowerCase().includes(q)) return true;
    if ((qst.tags||[]).some(t => t.toLowerCase().includes(q))) return true;
    if ((qst.note||"").toLowerCase().includes(q)) return true;
    if ((qst.answers||[]).some(a => (a.text||"").toLowerCase().includes(q) || (a.length||"").toLowerCase().includes(q))) return true;
    return false;
  };
  const matchCat = (cat) => {
    if (!q) return true;
    if ((cat.label||"").toLowerCase().includes(q) || (cat.desc||"").toLowerCase().includes(q)) return true;
    return cat.questions.some(matchQ);
  };

  // Counts for display
  const visibleCats = tender.categories.filter(matchCat);
  const totalMatchingQs = visibleCats.reduce((a, c) => a + c.questions.filter(matchQ).length, 0);
  const totalAllQs = tender.categories.reduce((a, c) => a + c.questions.length, 0);

  // When a search is active, auto-expand all matching categories
  const isExpanded = (cat) => {
    if (q) return true; // search mode: all matched categories open
    return expandedTenderCat === cat.id || expandedTenderCat === null;
  };

  return (
    <div className="pa-tender-wrap">
      <div className="pa-t-toolbar">
        <div className="pa-t-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories, questions, tags or answer text…"
          />
          {query && (
            <button className="clear" onClick={() => setQuery("")} title="Clear search">×</button>
          )}
        </div>
        <div className="pa-t-toolbar-meta">
          {q ? (
            <><b>{totalMatchingQs}</b> of {totalAllQs} questions match</>
          ) : (
            <><b>{tender.categories.length}</b> categories · <b>{totalAllQs}</b> questions</>
          )}
        </div>
        <button className="pa-t-newcat" onClick={addTenderCategory}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
          New category
        </button>
      </div>

      {visibleCats.length === 0 ? (
        <div className="pa-t-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <div className="ttl">No matches for "{query}"</div>
          <div className="sub">Try a broader keyword, or <button className="lnk" onClick={() => setQuery("")}>clear search</button>.</div>
        </div>
      ) : (
        <div className="pa-tender">
          {tender.categories.map((cat, catIdx) => {
            if (!matchCat(cat)) return null;
            const expanded = isExpanded(cat);
            const matchingQs = cat.questions.filter(matchQ);
            return (
              <div className="pa-t-cat" key={cat.id}>
                <div className="pa-t-cat-h">
                  <div className="pa-t-cat-l" onClick={() => !q && setExpandedTenderCat(expandedTenderCat === cat.id ? null : cat.id)} style={{cursor: q ? "default" : "pointer", flex:1}}>
                    <span className="num">{cat.num}</span>
                    <div>
                      <div className="cat-label">{highlight(cat.label, q)}</div>
                      <div className="cat-desc">{highlight(cat.desc || "", q)}</div>
                    </div>
                  </div>
                  <div className="pa-t-cat-r">
                    <span className="count">
                      {q ? `${matchingQs.length} of ${cat.questions.length} match` : `${cat.questions.length} question${cat.questions.length===1?"":"s"}`}
                    </span>
                    <button className="pa-rm-btn" onClick={(e) => { e.stopPropagation(); removeTenderCategory(catIdx); }} title="Remove category">×</button>
                    {!q && (
                      <span className="chev" onClick={() => setExpandedTenderCat(expandedTenderCat === cat.id ? null : cat.id)} style={{cursor:"pointer"}}>{expanded ? "▾" : "▸"}</span>
                    )}
                  </div>
                </div>

                {expanded && (
                  <div className="pa-t-cat-body">
                    <div className="pa-t-meta">
                      <div className="pa-fld" style={{flex:"0 0 80px"}}>
                        <label>Number</label>
                        <input className="pa-input" value={cat.num} onChange={(e) => updTenderCat(catIdx, { num: e.target.value })} />
                      </div>
                      <div className="pa-fld" style={{flex:"1 1 200px"}}>
                        <label>Category label</label>
                        <input className="pa-input" value={cat.label} onChange={(e) => updTenderCat(catIdx, { label: e.target.value })} />
                      </div>
                      <div className="pa-fld" style={{flex:"2 1 320px"}}>
                        <label>Category description</label>
                        <input className="pa-input" value={cat.desc || ""} onChange={(e) => updTenderCat(catIdx, { desc: e.target.value })} />
                      </div>
                    </div>

                    {cat.questions.length === 0 && !q && (
                      <div className="pa-t-empty-cat">No questions yet in this category. Add one below.</div>
                    )}

                    {cat.questions.map((qst, qIdx) => {
                      if (q && !matchQ(qst)) return null;
                      return (
                        <div className="pa-t-q" key={qst.id}>
                          <div className="pa-t-q-h">
                            <input className="pa-t-q-input" value={qst.question} onChange={(e) => updTenderQ(catIdx, qIdx, { question: e.target.value })} placeholder="Question…" />
                            <button className="pa-rm-btn" onClick={() => removeTenderQ(catIdx, qIdx)} title="Remove question">×</button>
                          </div>

                          <div className="pa-t-tags">
                            <span className="t-label">Search tags</span>
                            <input className="pa-input" placeholder="comma-separated, e.g. privacy, app, data" value={(qst.tags||[]).join(", ")} onChange={(e) => updTenderQ(catIdx, qIdx, { tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })} />
                          </div>

                          <div className="pa-t-note-row">
                            <span className="t-label">Partner note <span style={{color:"var(--ink-4)", fontWeight:500, marginLeft:4}}>(optional)</span></span>
                            <input className="pa-input" placeholder="Shown as a yellow warning callout above the answer…" value={qst.note || ""} onChange={(e) => updTenderQ(catIdx, qIdx, { note: e.target.value || undefined })} />
                          </div>

                          <div className="pa-t-answers">
                            {qst.answers.map((a, aIdx) => (
                              <div className="pa-t-a" key={a.id}>
                                <div className="pa-t-a-h">
                                  <input className="pa-t-a-length" value={a.length} onChange={(e) => updTenderA(catIdx, qIdx, aIdx, { length: e.target.value })} placeholder="e.g. Short · ~80 words" />
                                  <span className="wc">{(a.text||"").trim().split(/\s+/).filter(Boolean).length} words</span>
                                  <button className="pa-rm-btn small" onClick={() => removeTenderA(catIdx, qIdx, aIdx)} title="Remove answer variant">×</button>
                                </div>
                                <textarea
                                  className="pa-t-a-text"
                                  value={a.text}
                                  onChange={(e) => updTenderA(catIdx, qIdx, aIdx, { text: e.target.value })}
                                  placeholder="Pre-approved answer text — what reps will copy into the tender form."
                                  rows={Math.max(3, Math.min(14, Math.ceil((a.text||"").length / 100)))}
                                />
                              </div>
                            ))}
                            <button className="pa-t-add-a" onClick={() => addTenderA(catIdx, qIdx)}>＋ Add answer variant</button>
                          </div>
                        </div>
                      );
                    })}

                    <button className="pa-t-add-q" onClick={() => addTenderQ(catIdx)}>＋ Add question to {cat.label}</button>
                  </div>
                )}
              </div>
            );
          })}

          <button className="pa-t-newcat-bottom" onClick={addTenderCategory}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
            Add new category
          </button>
        </div>
      )}
    </div>
  );
}

// Simple text-highlight helper (case-insensitive, first occurrence)
function highlight(text, q) {
  if (!q || !text) return text || "";
  const lower = String(text).toLowerCase();
  const needle = q.toLowerCase();
  const i = lower.indexOf(needle);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{background:"#FEF3C7", color:"var(--ink)", padding:"0 2px", borderRadius:2}}>{text.slice(i, i + needle.length)}</mark>
      {text.slice(i + needle.length)}
    </>
  );
}
