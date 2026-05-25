// WastEye Portal — shell, navigation, pricing-table state, localStorage persistence.

const { useState: useStateApp, useEffect: useEffectApp, useMemo: useMemoApp, useCallback: useCallbackApp, useRef: useRefApp } = React;

const STORAGE_KEY = "wep-tables-v1";
const TENDER_STORAGE_KEY = "wep-tender-v1";
const QUOTES_STORAGE_KEY = "wep-quotes-v1";
const SESSION_KEY = "wep-session-v1";
const USERS_STORAGE_KEY = "wep-users-v1";
const LOG_STORAGE_KEY = "wep-activity-log-v1";
const LOG_MAX_ENTRIES = 500;

function loadTables() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const d = WEP.defaultTables();
      d.productImages = defaultProductImages();
      d.caseStudies = [];
      return d;
    }
    const parsed = JSON.parse(raw);
    // Shallow merge with defaults for forward-compat
    const d = WEP.defaultTables();
    return {
      ...d,
      ...parsed,
      settings: { ...d.settings, ...(parsed.settings||{}) },
      productImages: (parsed.productImages && parsed.productImages.length) ? parsed.productImages : defaultProductImages(),
      caseStudies: parsed.caseStudies || [],
    };
  } catch (e) {
    const d = WEP.defaultTables();
    d.productImages = defaultProductImages();
    d.caseStudies = [];
    return d;
  }
}

function defaultProductImages() {
  const base = Date.now();
  const resourceKeys = {
    "wasteeye-cam-installed-1.jpg": "prodCamInstalled1",
    "wasteeye-cam-installed-2.jpg": "prodCamInstalled2",
    "wasteeye-bin-mounted.jpg": "prodBinMounted",
    "wasteeye-cam-unit-front.jpg": "prodCamUnitFront",
    "wasteeye-cam-unit-side.jpg": "prodCamUnitSide",
    "wasteeye-cam-unit-back.jpg": "prodCamUnitBack",
  };
  const seed = (i, name, description, file, tags) => ({
    id: "img_seed_" + i,
    name,
    description,
    tags,
    dataUrl: (window.__resources && window.__resources[resourceKeys[file]]) || ("assets/products/" + file),
    addedAt: base - i * 1000,
    addedBy: "scott@shrunk.ai",
  });
  return [
    seed(1, "WastEye camera · installed in bin housing",   "WastEye camera mounted inside the lid of a commercial bin, angled at the waste stream.", "wasteeye-cam-installed-1.jpg", "camera, installed, bin"),
    seed(2, "Bin housing with camera fitted",                "Side view of a bin lid with the WastEye camera retracted into the housing.", "wasteeye-cam-installed-2.jpg", "camera, bin, housing"),
    seed(3, "WastEye assembled in commercial bin",          "Full commercial bin (blue interior) with WastEye camera mounted in the lid.", "wasteeye-bin-mounted.jpg", "bin, deployment, full"),
    seed(4, "WastEye camera unit · front (lens + LED)",     "Standalone camera unit showing the camera lens and indicator LED on the front face.", "wasteeye-cam-unit-front.jpg", "camera, hardware, unit, front"),
    seed(5, "WastEye camera unit · 3/4 view",               "Three-quarter view of the camera unit showing the carbon-finish housing and rear vent.", "wasteeye-cam-unit-side.jpg", "camera, hardware, unit"),
    seed(6, "WastEye camera unit · back panel",             "Back of the camera unit showing the power switch and access screws.", "wasteeye-cam-unit-back.jpg", "camera, hardware, unit, back"),
  ];
}

function loadTender() {
  try {
    const raw = localStorage.getItem(TENDER_STORAGE_KEY);
    if (!raw) return window.tenderDefault();
    return JSON.parse(raw);
  } catch (e) {
    return window.tenderDefault();
  }
}

function loadQuotes() {
  try {
    const raw = localStorage.getItem(QUOTES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) { return []; }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    const list = raw
      ? JSON.parse(raw)
      : (window.PORTAL_USERS ? JSON.parse(JSON.stringify(window.PORTAL_USERS)) : []);
    // Ensure every user has a stable internal id so editing the email field
    // doesn't unmount the row (which would steal focus after each keystroke).
    return list.map((u, i) => u._uid ? u : { ...u, _uid: "u_" + Date.now().toString(36) + "_" + i });
  } catch (e) {
    const list = window.PORTAL_USERS ? JSON.parse(JSON.stringify(window.PORTAL_USERS)) : [];
    return list.map((u, i) => ({ ...u, _uid: "u_seed_" + i }));
  }
}

function loadLog() {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) { return []; }
}

function newId() {
  return "q_" + Date.now().toString(36) + "_" + Math.floor(Math.random()*1000).toString(36);
}

function PortalApp() {
  const [session, setSession] = useStateApp(() => loadSession());
  const [view, setView] = useStateApp("calculator");
  const [adminSection, setAdminSection] = useStateApp("bands");
  const [tables, setTables] = useStateApp(() => loadTables());
  const [tender, setTender] = useStateApp(() => loadTender());
  const [quotes, setQuotes] = useStateApp(() => loadQuotes());
  const [users, setUsers] = useStateApp(() => loadUsers());
  const [activityLog, setActivityLog] = useStateApp(() => loadLog());
  const [activeQuoteId, setActiveQuoteId] = useStateApp(null); // currently loaded quote in calculator
  const [calcInput, setCalcInput] = useStateApp(() => WEP.defaultInput());
  const [calcKey, setCalcKey] = useStateApp(0); // bump to force calculator remount
  const [savedAt, setSavedAt] = useStateApp(null);
  const [dirty, setDirty] = useStateApp(false);
  const [toast, setToast] = useStateApp(null);
  const [pulledOnce, setPulledOnce] = useStateApp(false);
  const [syncStatus, setSyncStatus] = useStateApp(null); // "pulling" | "pushing" | "ok" | "err" | null
  const [syncError, setSyncError] = useStateApp(null);

  // ── AUTO-PULL on first sign-in (when backend is configured — skipped for demo sessions) ──
  useEffectApp(() => {
    if (!session) return;
    if (session.isDemo) { setPulledOnce(true); return; } // demo: never touch the production sheet
    if (pulledOnce) return;
    const url = window.WEBackend && window.WEBackend.getUrl();
    if (!url) return;
    let cancelled = false;
    (async () => {
      setSyncStatus("pulling");
      try {
        const remote = await window.WEBackend.pull();
        const h = window.WEBackend.hydrateFromSheet(remote);
        if (cancelled) return;
        if (h.users && h.users.length) setUsers(h.users);
        if (h.tables) setTables(prev => ({ ...prev, ...h.tables }));
        if (h.tender && h.tender.categories.length) setTender(h.tender);
        if (h.quotes) setQuotes(h.quotes);
    // After successful pull, mark not dirty
        if (h.activityLog) setActivityLog(h.activityLog);
        setSyncStatus("ok");
        setSyncError(null);
        setLastSyncAt(Date.now());
        setSheetsDirty(false);
        skipNextDirtyRef.current = true;
        setTimeout(() => setSyncStatus(null), 1800);
      } catch (e) {
        setSyncStatus("err");
        setSyncError("Sheets pull failed on load: " + e.message + " — using local cache.");
      }
      setPulledOnce(true);
    })();
    return () => { cancelled = true; };
  }, [session, pulledOnce]);

  // Auto-save to localStorage on every change (always; Sheets push is gated on the Save button)
  useEffectApp(() => {
    setDirty(true);
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
        localStorage.setItem(TENDER_STORAGE_KEY, JSON.stringify(tender));
        localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(quotes));
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(activityLog));
        setSavedAt(Date.now());
        setDirty(false);
      } catch (e) {}
    }, 400);
    return () => clearTimeout(t);
  }, [tables, tender, quotes, users, activityLog]);

  // Track whether there are unpushed changes vs the last Sheets sync
  const [sheetsDirty, setSheetsDirty] = useStateApp(false);
  const [lastSyncAt, setLastSyncAt] = useStateApp(null);
  const skipNextDirtyRef = useRefApp(false);
  const lastPushedRef = useRefApp(null); // snapshot of last-pushed flat state, used to diff which tabs changed
  useEffectApp(() => {
    // Skip the first run after a successful pull (we just pulled, not dirty)
    if (skipNextDirtyRef.current) { skipNextDirtyRef.current = false; return; }
    if ((window.WEBackend && window.WEBackend.getUrl())) setSheetsDirty(true);
  }, [tables, tender, quotes, users, activityLog]);

  const saveSync = async () => {
    const url = window.WEBackend && window.WEBackend.getUrl();
    if (!url) { showToast("Backend not connected — sign in as Owner to connect Sheets.", "info"); return; }
    if (session && session.isDemo) {
      showToast("Demo mode — changes saved locally only, not pushed to Sheets.", "info");
      setSheetsDirty(false);
      setSyncStatus("ok");
      setTimeout(() => setSyncStatus(null), 1500);
      return;
    }
    setSyncStatus("pushing");
    setSyncError(null);
    try {
      // Push-only Save: the auto-pull on sign-in gave us a fresh baseline; subsequent saves
      // just push our current state. (No pull-first roundtrip = much faster Save.)
      // If another admin saved while we were editing, last-write-wins on overlapping tabs.
      const flat = window.WEBackend.flattenForSheet({ tables, tender, quotes, users, activityLog });

      // Diff against last-pushed snapshot — only push tabs that actually changed.
      const prev = lastPushedRef.current || {};
      const changedTabs = {};
      for (const k of Object.keys(flat)) {
        const a = JSON.stringify(flat[k]);
        if (a !== prev[k]) changedTabs[k] = flat[k];
      }
      if (Object.keys(changedTabs).length === 0) {
        setSyncStatus("ok");
        setLastSyncAt(Date.now());
        setSheetsDirty(false);
        skipNextDirtyRef.current = true;
        showToast("Already in sync", "success");
        setTimeout(() => setSyncStatus(null), 1200);
        return;
      }
      // Push changed tabs in parallel
      await Promise.all(Object.entries(changedTabs).map(([tab, rows]) =>
        window.WEBackend.pushTab(tab, rows)
      ));
      // Update snapshot
      const snap = {};
      for (const k of Object.keys(flat)) snap[k] = JSON.stringify(flat[k]);
      lastPushedRef.current = snap;
      setSyncStatus("ok");
      setLastSyncAt(Date.now());
      setSheetsDirty(false);
      skipNextDirtyRef.current = true;
      showToast(`Saved ${Object.keys(changedTabs).length} tab${Object.keys(changedTabs).length===1?"":"s"} to Sheets`, "success");
      setTimeout(() => setSyncStatus(null), 1500);
    } catch (e) {
      setSyncStatus("err");
      setSyncError("Save failed: " + e.message);
      showToast("Save failed: " + e.message, "info");
      console.error("saveSync error:", e);
    }
  };

  const showToast = (msg, kind) => {
    setToast({ msg, kind, id: Date.now() });
    setTimeout(() => setToast(null), 2400);
  };

  const logAction = (action, details = {}) => {
    const entry = {
      id: "log_" + Date.now().toString(36) + "_" + Math.floor(Math.random()*1000).toString(36),
      ts: Date.now(),
      action,
      actor: session ? session.email : "anonymous",
      actorName: session ? session.name : "",
      actorRole: session ? session.role : "",
      ...details,
    };
    setActivityLog(prev => [entry, ...prev].slice(0, LOG_MAX_ENTRIES));
  };

  const resetTables = () => {
    window.appConfirm({
      title: "Reset pricing tables",
      message: "Reset all pricing tables to defaults? This cannot be undone.",
      confirmLabel: "Reset",
      destructive: true,
    }, () => setTables(WEP.defaultTables()));
  };
  const resetTender = () => {
    window.appConfirm({
      title: "Reset tender library",
      message: "Reset tender library to defaults? Any custom answers will be lost.",
      confirmLabel: "Reset",
      destructive: true,
    }, () => setTender(window.tenderDefault()));
  };

  // ── Quotes helpers ────────────────────────────────────────────────
  const computeSnapshot = (input) => {
    const result = WEP.calculate(input, tables);
    return {
      total: result.total,
      bandKey: result.meta.bandKey,
      tier: result.meta.tier,
    };
  };

  // Save current calc as draft (creates if new, updates if loaded)
  const saveAsDraft = (input) => {
    const snap = computeSnapshot(input);
    const now = Date.now();
    if (activeQuoteId) {
      setQuotes(qs => qs.map(q => q.id === activeQuoteId ? { ...q, ...snap, client: input.client, quoteRef: input.quoteRef, input: input, updatedAt: now } : q));
      logAction("quote.draft.update", { quoteId: activeQuoteId, client: input.client, ref: input.quoteRef, total: snap.total });
      showToast("Draft updated", "success");
    } else {
      const id = newId();
      const q = { id, status: "draft", client: input.client, quoteRef: input.quoteRef, input, ...snap, createdAt: now, updatedAt: now, createdBy: session.email, createdByName: session.name };
      setQuotes(qs => [q, ...qs]);
      setActiveQuoteId(id);
      logAction("quote.draft.create", { quoteId: id, client: input.client, ref: input.quoteRef, total: snap.total });
      showToast("Draft saved", "success");
    }
  };

  // Save current calc as sent
  const markSent = (input) => {
    const snap = computeSnapshot(input);
    const now = Date.now();
    if (activeQuoteId) {
      setQuotes(qs => qs.map(q => q.id === activeQuoteId ? { ...q, ...snap, client: input.client, quoteRef: input.quoteRef, input, status: "sent", updatedAt: now, sentAt: q.sentAt || now } : q));
      logAction("quote.sent", { quoteId: activeQuoteId, client: input.client, ref: input.quoteRef, total: snap.total });
    } else {
      const id = newId();
      const q = { id, status: "sent", client: input.client, quoteRef: input.quoteRef, input, ...snap, createdAt: now, updatedAt: now, sentAt: now, createdBy: session.email, createdByName: session.name };
      setQuotes(qs => [q, ...qs]);
      setActiveQuoteId(id);
      logAction("quote.sent", { quoteId: id, client: input.client, ref: input.quoteRef, total: snap.total });
    }
    showToast("Quote sent · saved to history", "success");
  };

  const newQuote = () => {
    setCalcInput(WEP.defaultInput());
    setActiveQuoteId(null);
    setCalcKey(k => k + 1);
    setView("calculator");
  };

  const openQuote = (id) => {
    const q = quotes.find(x => x.id === id);
    if (!q) return;
    // Sales/partner can only open their own quotes (defense in depth — UI already filters)
    if (!isAdmin && q.createdBy !== session.email) {
      showToast("You can only open your own quotes.", "info");
      return;
    }
    setCalcInput(JSON.parse(JSON.stringify(q.input)));
    setActiveQuoteId(id);
    setCalcKey(k => k + 1);
    setView("calculator");
  };

  const duplicateQuote = (id) => {
    const src = quotes.find(x => x.id === id);
    if (!src) return;
    const now = Date.now();
    const newQ = {
      id: newId(),
      status: "draft",
      client: src.client + " (copy)",
      quoteRef: "WE-" + new Date().getFullYear() + "-" + String(Math.floor(100 + Math.random()*900)),
      input: { ...JSON.parse(JSON.stringify(src.input)), client: src.client + " (copy)" },
      total: src.total, bandKey: src.bandKey, tier: src.tier,
      createdAt: now, updatedAt: now,
    };
    setQuotes(qs => [newQ, ...qs]);
    logAction("quote.duplicate", { quoteId: newQ.id, sourceId: id, client: newQ.client, ref: newQ.quoteRef });
    showToast("Quote duplicated as draft", "success");
  };

  const deleteQuote = (id) => {
    const q = quotes.find(x => x.id === id);
    if (!q) return;
    if (!isAdmin && q.createdBy !== session.email) {
      showToast("You can only delete your own quotes.", "info");
      return;
    }
    setQuotes(qs => qs.filter(q => q.id !== id));
    if (activeQuoteId === id) { setActiveQuoteId(null); }
    if (q) logAction("quote.delete", { quoteId: id, client: q.client, ref: q.quoteRef, status: q.status, total: q.total });
    showToast("Quote deleted", "info");
  };

  const setQuoteStatus = (id, status) => {
    const now = Date.now();
    const q = quotes.find(x => x.id === id);
    setQuotes(qs => qs.map(q => q.id === id ? { ...q, status, updatedAt: now, sentAt: status === "sent" ? (q.sentAt || now) : q.sentAt } : q));
    if (q) logAction("quote.status.change", { quoteId: id, client: q.client, ref: q.quoteRef, from: q.status, to: status });
    showToast(`Marked as ${status}`, "success");
  };

  const activeQuote = quotes.find(q => q.id === activeQuoteId);

  const handleLogin = (newSession, remember) => {
    setSession(newSession);
    if (remember) {
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(newSession)); } catch(e) {}
    }
    // Direct-log the login (logAction needs a session)
    const entry = {
      id: "log_" + Date.now().toString(36),
      ts: Date.now(),
      action: "auth.login",
      actor: newSession.email,
      actorName: newSession.name,
      actorRole: newSession.role,
    };
    setActivityLog(prev => [entry, ...prev].slice(0, LOG_MAX_ENTRIES));
    // Owner + admin land on Admin → Activity & insights; everyone else on Calculator
    if (newSession.role === "admin" || newSession.role === "owner") {
      setAdminSection("insights");
      setView("admin");
    } else {
      setView("calculator");
    }
  };

  const handleLogout = () => {
    window.appConfirm({
      title: "Sign out",
      message: "Sign out of the portal?",
      confirmLabel: "Sign out",
    }, () => {
      if (session) logAction("auth.logout");
      setSession(null);
      try { localStorage.removeItem(SESSION_KEY); } catch(e) {}
    });
  };

  // Gate the app behind login
  if (!session) {
    return <PortalLogin onLogin={handleLogin} users={users} />;
  }

  // Role-based visibility
  const isAdmin = session.role === "admin" || session.role === "owner";
  // If non-admin lands on admin view (e.g. via deep link), bounce to calculator
  if (!isAdmin && view === "admin") {
    setTimeout(() => setView("calculator"), 0);
  }

  const css = `
    :root {
      --ink:#0A1628; --ink-2:#2A3B52; --ink-3:#5A6C82; --ink-4:#8B98AD;
      --hair:#D5DEEC; --hair-2:#E5ECF5; --hair-3:#EEF2FA;
      --page:#EEF2FA; --panel:#FFFFFF;
      --navy:#0B2E5C; --navy-2:#1A4A88; --navy-tint:#DCE7F5;
      --blue:#1F5CD9; --blue-2:#3C7AE8; --blue-tint:#E4EDFB; --blue-deep:#0F3FA8;
      --sky:#7FB3F9; --azure:#5FA3FF;
      --pos:#15803D; --pos-bg:#DCFCE7;
      --neg:#B91C1C;
      --warn:#B85C00; --warn-bg:#FEF3E2;
    }
    body { background:var(--page); color:var(--ink); }
    .wep {
      min-height:100vh;
      font-family:'Source Sans 3',sans-serif;
      -webkit-font-smoothing:antialiased;
      font-feature-settings:"ss01","tnum";
      display:flex; flex-direction:column;
    }
    .wep .serif { font-family:'Source Serif 4',Georgia,serif; }
    .wep .mono { font-family:'JetBrains Mono',monospace; font-feature-settings:"tnum"; }

    /* ── Top navigation ─────────────────────────────────────── */
    .wep-top {
      background:#fff;
      border-bottom:1px solid var(--hair);
      position:sticky;
      top:0;
      z-index:20;
      box-shadow:0 1px 3px rgba(10,22,40,0.04);
      padding:0 32px;
      display:flex; align-items:center; gap:32px;
      height:60px;
      flex-shrink:0;
    }
    .wep-brand { display:flex; align-items:center; gap:14px; padding-right:14px; border-right:1px solid var(--hair); margin-right:8px; }
    .wep-logo { height:38px; width:auto; display:block; }
    .wep-brand-wm { line-height:1.2; }
    .wep-brand-sub { font-size:12px; color:var(--ink-3); letter-spacing:0.04em; font-weight:500; }

    .wep-nav { display:flex; gap:4px; margin-left:8px; }
    .wep-nav button {
      padding:8px 14px; background:transparent; border:none;
      font:inherit; font-size:14px; font-weight:500; color:var(--ink-3);
      cursor:pointer; border-radius:7px; display:inline-flex; align-items:center; gap:8px;
    }
    .wep-nav button:hover { background:var(--blue-tint); color:var(--blue-deep); }
    .wep-nav button.on { background:var(--ink); color:#fff; }
    .wep-nav button.on:hover { background:var(--ink); }
    .wep-nav button svg { width:16px; height:16px; }
    .wep-nav-count {
      font-family:'JetBrains Mono',monospace; font-size:10.5px;
      padding:1px 6px; background:rgba(0,0,0,0.06); border-radius:9px;
      color:var(--ink-3); font-weight:600;
    }
    .wep-nav button.on .wep-nav-count { background:rgba(255,255,255,0.15); color:rgba(255,255,255,0.85); }
    .wep-nav-pill {
      display:inline-flex; align-items:center; gap:5px;
      padding:1px 7px; font-size:10px; font-weight:700;
      letter-spacing:0.06em; text-transform:uppercase;
      border-radius:9px;
    }
    .wep-nav-pill .d { width:5px; height:5px; border-radius:50%; background:currentColor; }
    .wep-nav-pill.draft { background:var(--warn-bg); color:var(--warn); }
    .wep-nav-pill.sent { background:var(--pos-bg); color:var(--pos); }
    .wep-nav button.on .wep-nav-pill { background:rgba(255,255,255,0.12); color:#fff; }

    /* Toast */
    .wep-toast {
      position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
      padding:11px 18px; background:var(--ink); color:#fff;
      border-radius:9px; box-shadow:0 12px 30px -10px rgba(10,22,40,0.4);
      font-size:13px; font-weight:500;
      display:flex; align-items:center; gap:10px;
      z-index:50;
      animation:wepToastIn 0.2s ease-out;
    }
    .wep-toast .d { width:7px; height:7px; border-radius:50%; background:#5BD08F; }
    .wep-toast.success .d { background:#5BD08F; }
    .wep-toast.info .d { background:var(--sky); }
    @keyframes wepToastIn { from { transform:translate(-50%, 8px); opacity:0; } to { transform:translate(-50%, 0); opacity:1; } }

    .wep-top-r { margin-left:auto; display:flex; align-items:center; gap:14px; }
    .wep-savepill {
      display:inline-flex; align-items:center; gap:7px;
      padding:6px 11px;
      background:var(--blue-tint); color:var(--blue-deep);
      border:1px solid var(--blue-tint); border-radius:14px;
      font-size:11.5px; font-weight:500; letter-spacing:0.02em;
    }
    .wep-savepill.dirty { background:var(--warn-bg); color:var(--warn); border-color:var(--warn-bg); }
    .wep-savepill.saved { background:var(--pos-bg); color:var(--pos); border-color:var(--pos-bg); }
    .wep-savepill .d { width:6px; height:6px; border-radius:50%; background:currentColor; }

    /* Save button (manual sync with Sheets) */
    .wep-save-btn {
      display:inline-flex; align-items:center; gap:7px;
      padding:7px 13px;
      border:1px solid transparent; border-radius:7px;
      font:inherit; font-size:12.5px; font-weight:600;
      cursor:pointer; letter-spacing:0.02em;
      transition:background 0.15s, border-color 0.15s, transform 0.05s;
    }
    .wep-save-btn:active:not(:disabled) { transform:translateY(1px); }
    .wep-save-btn.dirty {
      background:var(--ink); color:#fff; border-color:var(--ink);
      animation:wepSavePulse 2s ease-in-out infinite;
    }
    .wep-save-btn.dirty:hover { background:var(--blue-deep); border-color:var(--blue-deep); }
    .wep-save-btn.dirty .wep-save-dot {
      width:7px; height:7px; border-radius:50%; background:#FFA500;
      box-shadow:0 0 0 0 rgba(255,165,0,0.4);
      animation:wepSaveDotPulse 1.5s ease-in-out infinite;
    }
    .wep-save-btn.synced {
      background:var(--pos-bg); color:var(--pos); border-color:var(--pos-bg);
    }
    .wep-save-btn.synced svg { color:var(--pos); }
    .wep-save-btn.busy { background:var(--blue-tint); color:var(--blue-deep); border-color:var(--blue-tint); cursor:wait; }
    .wep-save-spinner {
      width:12px; height:12px; border-radius:50%;
      border:2px solid rgba(31,92,217,0.25); border-top-color:var(--blue-deep);
      animation:wepSpin 0.7s linear infinite;
    }
    @keyframes wepSpin { to { transform:rotate(360deg); } }
    @keyframes wepSavePulse {
      0%,100% { box-shadow:0 0 0 0 rgba(255,165,0,0); }
      50%     { box-shadow:0 0 0 4px rgba(255,165,0,0.18); }
    }
    @keyframes wepSaveDotPulse {
      0%,100% { box-shadow:0 0 0 0 rgba(255,165,0,0.5); }
      50%     { box-shadow:0 0 0 5px rgba(255,165,0,0); }
    }
    .wep-user {
      display:flex; align-items:center; gap:10px;
      font-size:13px; color:var(--ink-2);
      padding-left:14px; border-left:1px solid var(--hair);
    }
    .wep-user .avatar {
      width:32px; height:32px; border-radius:50%;
      background:linear-gradient(135deg, var(--blue) 0%, var(--blue-deep) 100%); color:#fff;
      display:grid; place-items:center;
      font-size:11px; font-weight:700; letter-spacing:0.04em;
    }
    .wep-user-tx { line-height:1.25; }
    .wep-role-pill {
      display:inline-block;
      padding:1px 7px; border-radius:9px;
      font-size:9.5px; font-weight:700;
      letter-spacing:0.06em; text-transform:uppercase;
    }
    .wep-role-pill.owner   { background:#FEE2E2; color:#991B1B; }
    .wep-role-pill.admin   { background:var(--warn-bg); color:var(--warn); }
    .wep-role-pill.sales   { background:var(--blue-tint); color:var(--blue-deep); }
    .wep-role-pill.partner { background:#F3E8FF; color:#6B21A8; }
    .wep-signout {
      width:32px; height:32px; padding:0;
      background:transparent; border:1px solid var(--hair);
      border-radius:7px; color:var(--ink-3); cursor:pointer;
      display:grid; place-items:center;
      margin-left:4px;
    }
    .wep-signout svg { width:15px; height:15px; }
    .wep-signout:hover { background:#FEF2F2; color:#B91C1C; border-color:#FCA5A5; }

    /* Main viewport */
    .wep-body { flex:1; min-height:0; overflow:auto; }

    /* Footer */
    .wep-footer {
      background:var(--ink);
      color:rgba(255,255,255,0.7);
      flex-shrink:0;
      padding:18px 32px;
      display:flex; align-items:center; justify-content:space-between;
      font-size:12.5px; letter-spacing:0.02em;
      gap:24px; flex-wrap:wrap;
    }
    .wep-footer-l { display:flex; align-items:center; gap:16px; }
    .wep-footer-tx { display:flex; align-items:center; gap:12px; }
    .wep-footer-tx .co { color:#fff; font-weight:600; letter-spacing:0.04em; }
    .wep-footer-tx .sep, .wep-footer-r .sep { color:rgba(255,255,255,0.25); }
    .wep-footer-tx .rights { color:rgba(255,255,255,0.55); }
    .wep-footer-tx .copy { font-family:'JetBrains Mono',monospace; font-size:11.5px; color:rgba(255,255,255,0.6); }
    .wep-footer-r { display:flex; align-items:center; gap:12px; font-size:12px; color:rgba(255,255,255,0.55); }
    .wep-footer-r a { color:rgba(255,255,255,0.85); text-decoration:none; transition:color 0.15s; }
    .wep-footer-r a:hover { color:#fff; text-decoration:underline; }
    .wep-footer-r .abn { font-family:'JetBrains Mono',monospace; font-size:11px; }
  `;

  return (
    <div className="wep">
      <style>{css}</style>

      <header className="wep-top">
        <div className="wep-brand">
          <img className="wep-logo" src={(window.__resources && window.__resources.shrunkLogo) || "assets/shrunk-logo.png"} alt="Shrunk" />
          <div className="wep-brand-wm">
            <div className="wep-brand-sub">WastEye · Sales portal</div>
          </div>
        </div>

        <nav className="wep-nav">
          <button className={view==="calculator"?"on":""} onClick={() => setView("calculator")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h3M13 11h3M8 15h3M13 15h3M8 19h3M13 19h3"/></svg>
            Quote calculator
            {activeQuote && (
              <span className={`wep-nav-pill ${activeQuote.status}`}>
                <span className="d"></span>{activeQuote.status}
              </span>
            )}
          </button>
          <button className={view==="quotes"?"on":""} onClick={() => setView("quotes")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M5 4h14v16l-7-3-7 3z"/></svg>
            Saved quotes
            {quotes.length > 0 && <span className="wep-nav-count">{quotes.length}</span>}
          </button>
          <button className={view==="tender"?"on":""} onClick={() => setView("tender")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6M9 9h2"/></svg>
            Tender library
          </button>
          {isAdmin && (
            <button className={view==="admin"?"on":""} onClick={() => setView("admin")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 4v3M12 17v3M5 12H2M22 12h-3M6.3 6.3l-2-2M19.7 19.7l-2-2M6.3 17.7l-2 2M19.7 6.3l-2 2"/><circle cx="12" cy="12" r="3.5"/></svg>
              Admin
            </button>
          )}
        </nav>

        <div className="wep-top-r">
          {(window.WEBackend && window.WEBackend.getUrl()) && (
            <button
              className={`wep-save-btn ${sheetsDirty ? "dirty" : "synced"} ${syncStatus==="pulling"||syncStatus==="pushing" ? "busy" : ""}`}
              onClick={saveSync}
              disabled={syncStatus==="pulling" || syncStatus==="pushing"}
              title={sheetsDirty ? "You have unsynced changes — click to pull latest + push yours" : "All changes saved to Sheets"}
            >
              {syncStatus === "pulling" ? (
                <><span className="wep-save-spinner"></span>Pulling…</>
              ) : syncStatus === "pushing" ? (
                <><span className="wep-save-spinner"></span>Saving…</>
              ) : sheetsDirty ? (
                <><span className="wep-save-dot"></span>Save changes</>
              ) : (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{width:14, height:14}}><path d="M5 13l4 4L19 7"/></svg>Synced</>
              )}
            </button>
          )}
          <span className={`wep-savepill ${syncStatus === "err" ? "dirty" : dirty ? "dirty" : (savedAt?"saved":"")}`} title={syncError || ""}>
            <span className="d"></span>
            {syncStatus === "pulling" ? "Pulling from Sheets…" :
             syncStatus === "pushing" ? "Pushing to Sheets…" :
             syncStatus === "ok" ? "Synced" :
             syncStatus === "err" ? "Sync error — see Backend connection" :
             dirty ? "Saving…" : (savedAt ? "Saved" : "Defaults loaded")}
          </span>
          <div className="wep-user">
            <div className="avatar">{session.initials}</div>
            <div className="wep-user-tx">
              <div style={{fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6}}>
                {session.name}
                {session.isDemo && <span style={{fontSize:9, fontWeight:700, padding:"1px 6px", background:"#FEF3C7", color:"#92400E", borderRadius:9, letterSpacing:"0.08em", textTransform:"uppercase"}}>Demo</span>}
              </div>
              <div style={{fontSize:11, color:"var(--ink-3)"}}>
                <span className={`wep-role-pill ${session.role}`}>{session.role}</span>
                {session.title && <span style={{marginLeft:6}}>{session.title}</span>}
              </div>
            </div>
            <button className="wep-signout" onClick={handleLogout} title="Sign out">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M15 16l5-4-5-4M20 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>
            </button>
          </div>
        </div>
      </header>

      <div className="wep-body">
        {view === "calculator" && (
          <PortalCalculator
            key={calcKey}
            tables={tables}
            input={calcInput}
            setInput={setCalcInput}
            activeQuote={activeQuote}
            onSaveDraft={saveAsDraft}
            onMarkSent={markSent}
            onNewQuote={newQuote}
            onViewQuotes={() => setView("quotes")}
            session={session}
          />
        )}
        {view === "quotes" && (
          <PortalQuotes
            quotes={isAdmin ? quotes : quotes.filter(q => q.createdBy === session.email)}
            tables={tables}
            onOpen={openQuote}
            onNew={newQuote}
            onDuplicate={duplicateQuote}
            onDelete={deleteQuote}
            onSetStatus={setQuoteStatus}
          />
        )}
        {view === "tender"     && <PortalTender tender={tender} />}
        {view === "admin"      && <PortalAdmin tables={tables} setTables={setTables} tender={tender} setTender={setTender} users={users} setUsers={setUsers} quotes={quotes} setQuotes={setQuotes} activityLog={activityLog} setActivityLog={setActivityLog} session={session} onReset={resetTables} onResetTender={resetTender} onOpenQuote={openQuote} section={adminSection} setSection={setAdminSection} />}
      </div>

      {toast && (
        <div className={`wep-toast ${toast.kind || "info"}`}>
          <span className="d"></span>
          {toast.msg}
        </div>
      )}

      <AppConfirmDialog />

      <footer className="wep-footer">
        <div className="wep-footer-l">
          <div className="wep-footer-tx">
            <span className="copy">© 2026</span>
            <span className="sep">|</span>
            <span className="co">Shrunk Innovation Group</span>
            <span className="sep">|</span>
            <span className="rights">All Rights Reserved</span>
          </div>
        </div>
        <div className="wep-footer-r">
          {isAdmin && (
            <>
              <a href="https://shrunk.ai" target="_blank" rel="noopener noreferrer">shrunk.ai</a>
              <span className="sep">·</span>
              <a href="mailto:scott@shrunk.ai">scott@shrunk.ai</a>
              <span className="sep">·</span>
            </>
          )}
          <span className="abn">ABN 15 653 930 691</span>
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PortalApp />);
