// Backend (Google Sheets) settings section for the admin.

function BackendSettingsSection({ tables, setTables, tender, setTender, quotes, setQuotes, users, setUsers, activityLog, setActivityLog }) {
  const [url, setUrl] = React.useState(window.WEBackend ? window.WEBackend.getUrl() || "" : "");
  const [autoSync, setAutoSync] = React.useState(window.WEBackend ? window.WEBackend.getAutoSync() : false);
  const [status, setStatus] = React.useState(null); // { kind: 'ok'|'err'|'pending', msg, detail }
  const [busy, setBusy] = React.useState(false);
  const [lastPush, setLastPush] = React.useState(null);

  React.useEffect(() => {
    if (window.WEBackend) window.WEBackend.setUrl(url);
  }, [url]);
  React.useEffect(() => {
    if (window.WEBackend) window.WEBackend.setAutoSync(autoSync);
  }, [autoSync]);

  const setStatusPending = (msg) => setStatus({ kind: "pending", msg });
  const setStatusOk      = (msg, detail) => setStatus({ kind: "ok", msg, detail });
  const setStatusErr     = (msg, detail) => setStatus({ kind: "err", msg, detail });

  const testConnection = async () => {
    if (!url.trim()) { setStatusErr("Add a web-app URL first."); return; }
    setBusy(true);
    setStatusPending("Pinging backend…");
    try {
      const res = await window.WEBackend.ping();
      setStatusOk(`Connected · ${(res.tabs||[]).length} tabs ready`, `Server time: ${new Date(res.ts).toLocaleTimeString()}`);
    } catch (e) {
      setStatusErr("Couldn't reach the backend", e.message);
    }
    setBusy(false);
  };

  const pushAll = async () => {
    if (!url.trim()) { setStatusErr("Add a web-app URL first."); return; }
    setBusy(true);
    setStatusPending("Pushing portal state to Google Sheets…");
    try {
      const flat = window.WEBackend.flattenForSheet({ tables, tender, quotes, users, activityLog });
      await window.WEBackend.pushAll(flat);
      const counts = Object.entries(flat).map(([k,v]) => `${k}: ${v.length}`).join(" · ");
      setStatusOk("Push complete", counts);
      setLastPush(Date.now());
    } catch (e) {
      setStatusErr("Push failed", e.message);
    }
    setBusy(false);
  };

  const pullAll = async () => {
    if (!url.trim()) { setStatusErr("Add a web-app URL first."); return; }
    if (!window.appConfirm) return;
    window.appConfirm({
      title: "Pull from Google Sheets",
      message: "This replaces your current portal data (users, pricing, scenarios, tender library, quotes, etc.) with whatever is in the Sheet right now. Any unsaved local edits will be lost.",
      confirmLabel: "Pull from Sheets",
    }, async () => {
      setBusy(true);
      setStatusPending("Pulling from Google Sheets…");
      try {
        const remote = await window.WEBackend.pull();
        const hydrated = window.WEBackend.hydrateFromSheet(remote);
        const counts = [];
        if (hydrated.users && setUsers) { setUsers(hydrated.users); counts.push(`users: ${hydrated.users.length}`); }
        if (hydrated.tables && setTables) { setTables(prev => ({ ...prev, ...hydrated.tables })); counts.push(`tables: ${Object.keys(hydrated.tables).length}`); }
        if (hydrated.tender && hydrated.tender.categories.length && setTender) { setTender(hydrated.tender); counts.push(`tender: ${hydrated.tender.categories.length} cats`); }
        if (hydrated.quotes && setQuotes) { setQuotes(hydrated.quotes); counts.push(`quotes: ${hydrated.quotes.length}`); }
        if (hydrated.activityLog && setActivityLog) { setActivityLog(hydrated.activityLog); counts.push(`log: ${hydrated.activityLog.length}`); }
        setStatusOk("Pull complete", counts.join(" · ") || "Nothing pulled");
      } catch (e) {
        setStatusErr("Pull failed", e.message);
      }
      setBusy(false);
    });
  };

  const css = `
    .bs-wrap { display:flex; flex-direction:column; gap:14px; }
    .bs-card { background:#fff; border:1px solid var(--hair); border-radius:10px; padding:18px 22px; }
    .bs-card .lab { font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--blue-deep); font-weight:700; margin-bottom:4px; }
    .bs-card h3 { font-family:'Source Serif 4',serif; font-size:18px; font-weight:600; margin:0 0 6px; }
    .bs-card p { font-size:13.5px; color:var(--ink-3); line-height:1.55; margin:0 0 14px; }
    .bs-card p a { color:var(--blue-deep); text-decoration:none; }
    .bs-card p a:hover { text-decoration:underline; }

    .bs-field { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
    .bs-field label { font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); font-weight:700; }
    .bs-field input {
      width:100%; box-sizing:border-box;
      padding:11px 13px;
      border:1.5px solid var(--hair); border-radius:8px;
      font:inherit; font-size:13px; color:var(--ink);
      font-family:'JetBrains Mono',monospace; font-feature-settings:"tnum";
      outline:none; background:#fff;
    }
    .bs-field input:focus { border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }
    .bs-field .help { font-size:11.5px; color:var(--ink-3); line-height:1.5; margin-top:2px; }

    .bs-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .bs-btn {
      padding:10px 16px; font:inherit; font-size:12.5px; font-weight:600;
      border-radius:7px; cursor:pointer; letter-spacing:0.03em;
      display:inline-flex; align-items:center; gap:7px;
    }
    .bs-btn svg { width:14px; height:14px; }
    .bs-btn.primary { background:var(--ink); color:#fff; border:none; }
    .bs-btn.primary:hover { background:var(--blue-deep); }
    .bs-btn.ghost { background:#fff; color:var(--ink-2); border:1px solid var(--hair); }
    .bs-btn.ghost:hover { background:var(--blue-tint); color:var(--blue-deep); border-color:var(--blue); }
    .bs-btn:disabled { opacity:0.5; cursor:not-allowed; }

    .bs-status { margin-top:14px; padding:11px 14px; border-radius:8px; font-size:13px; line-height:1.45; display:flex; gap:10px; align-items:flex-start; }
    .bs-status svg { width:16px; height:16px; flex-shrink:0; margin-top:1px; }
    .bs-status.ok { background:var(--pos-bg); color:var(--pos); border:1px solid #BBF7D0; }
    .bs-status.err { background:#FEF2F2; color:#991B1B; border:1px solid #FCA5A5; }
    .bs-status.pending { background:var(--blue-tint); color:var(--blue-deep); border:1px solid #BFDBFE; }
    .bs-status .body { flex:1; min-width:0; }
    .bs-status .msg { font-weight:600; }
    .bs-status .detail { font-size:11.5px; color:inherit; opacity:0.75; margin-top:2px; font-family:'JetBrains Mono',monospace; word-break:break-word; }

    .bs-tog {
      display:flex; align-items:flex-start; gap:12px;
      padding:14px 16px;
      background:var(--hair-3); border:1px solid var(--hair-2); border-radius:8px;
    }
    .bs-tog input { width:18px; height:18px; accent-color:var(--blue); margin-top:2px; flex-shrink:0; cursor:pointer; }
    .bs-tog .body label { font-size:13px; font-weight:600; cursor:pointer; }
    .bs-tog .body .help { font-size:11.5px; color:var(--ink-3); margin-top:3px; line-height:1.45; }

    .bs-step { display:flex; gap:14px; align-items:flex-start; padding:10px 0; border-bottom:1px solid var(--hair-2); }
    .bs-step:last-child { border-bottom:none; }
    .bs-step .num { flex-shrink:0; width:24px; height:24px; border-radius:50%; background:var(--blue-tint); color:var(--blue-deep); font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:700; display:grid; place-items:center; }
    .bs-step .txt { font-size:13px; line-height:1.55; color:var(--ink-2); }
    .bs-step .txt code { font-family:'JetBrains Mono',monospace; font-size:11.5px; padding:1px 5px; background:var(--hair-3); border-radius:3px; color:var(--ink); }
  `;

  return (
    <div className="bs-wrap">
      <style>{css}</style>

      <div className="bs-card">
        <div className="lab">Backend connection</div>
        <h3>Google Sheets backend</h3>
        <p>
          Move portal data off this browser and onto a shared Google Sheet so every rep sees the same prices,
          quotes and tender answers. Setup takes ~10 minutes — paste the script, deploy as a web app,
          drop the URL below. Full guide in <code>backend/README.md</code>.
        </p>

        <div className="bs-field">
          <label>Apps Script web-app URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycb…/exec"
            spellCheck={false}
          />
          <div className="help">Paste the URL Google gives you after <b>Deploy → New deployment → Web app → Deploy</b>. Must end in <code>/exec</code> (not <code>/dev</code>).</div>
        </div>

        <div className="bs-actions">
          <button className="bs-btn ghost" onClick={testConnection} disabled={busy || !url.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v3M12 19v3M5 12H2M22 12h-3"/><circle cx="12" cy="12" r="4"/></svg>
            Test connection
          </button>
          <button className="bs-btn primary" onClick={pushAll} disabled={busy || !url.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12M7 8l5-5 5 5M5 21h14"/></svg>
            Push to Sheets
          </button>
          <button className="bs-btn ghost" onClick={pullAll} disabled={busy || !url.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21V9M7 16l5 5 5-5M5 3h14"/></svg>
            Pull from Sheets
          </button>
          {lastPush && <span style={{alignSelf:"center", fontSize:12, color:"var(--ink-3)"}}>Last push: {new Date(lastPush).toLocaleTimeString()}</span>}
        </div>

        {status && (
          <div className={`bs-status ${status.kind}`}>
            {status.kind === "ok" && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>}
            {status.kind === "err" && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>}
            {status.kind === "pending" && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></path></svg>}
            <div className="body">
              <div className="msg">{status.msg}</div>
              {status.detail && <div className="detail">{status.detail}</div>}
            </div>
          </div>
        )}
      </div>

      <div className="bs-card">
        <div className="lab">Sync mode</div>
        <h3>Auto-pull on load · auto-push on change</h3>
        <p>When on, the portal pulls from Sheets the moment you sign in, then auto-pushes ~600ms after every edit. Other admins see your changes when they next sign in or reload.</p>
        <div className="bs-tog">
          <input type="checkbox" id="bs-autosync" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} />
          <div className="body">
            <label htmlFor="bs-autosync">Auto-sync (auto-pull on load + auto-push on change)</label>
            <div className="help">Turn this on for shared use. Leave off if you want full control over when changes go live in Sheets.</div>
          </div>
        </div>
      </div>

      <div className="bs-card">
        <div className="lab">Quick reference</div>
        <h3>Setup, in 4 steps</h3>
        <div>
          <div className="bs-step"><div className="num">1</div><div className="txt">Create an empty Google Sheet named <b>WastEye Backend</b> (sheets.new). Don't add tabs — the script does it.</div></div>
          <div className="bs-step"><div className="num">2</div><div className="txt">In the Sheet: <b>Extensions → Apps Script</b>. Replace the default code with the contents of <code>backend/sheets-backend.gs</code>. Save.</div></div>
          <div className="bs-step"><div className="num">3</div><div className="txt"><b>Deploy → New deployment → Web app</b>. Execute as: <b>Me</b>. Who has access: <b>Anyone</b>. Deploy. Authorise when asked.</div></div>
          <div className="bs-step"><div className="num">4</div><div className="txt">Copy the deployment URL (ends in <code>/exec</code>), paste above, click <b>Test connection</b>, then <b>Push current state</b>.</div></div>
        </div>
      </div>
    </div>
  );
}

window.BackendSettingsSection = BackendSettingsSection;
