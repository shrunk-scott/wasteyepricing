// Portal Admin — Activity log section.

function ActivityLogAdminSection({ activityLog, setActivityLog, users }) {
  const [query, setQuery] = React.useState("");
  const [filterAction, setFilterAction] = React.useState("all");
  const [filterUser, setFilterUser] = React.useState("all");
  const [range, setRange] = React.useState("all"); // all | 24h | 7d | 30d

  const ACTION_GROUPS = {
    "Quotes": ["quote.draft.create","quote.draft.update","quote.sent","quote.duplicate","quote.delete","quote.status.change"],
    "Auth":   ["auth.login","auth.logout"],
  };

  const ACTION_META = {
    "quote.draft.create":  { label: "Draft created",    color: "var(--warn)",     bg: "var(--warn-bg)" },
    "quote.draft.update":  { label: "Draft updated",    color: "var(--warn)",     bg: "var(--warn-bg)" },
    "quote.sent":          { label: "Quote sent",       color: "var(--pos)",      bg: "var(--pos-bg)" },
    "quote.duplicate":     { label: "Quote duplicated", color: "var(--blue-deep)",bg: "var(--blue-tint)" },
    "quote.delete":        { label: "Quote deleted",    color: "var(--neg)",      bg: "#FEF2F2" },
    "quote.status.change": { label: "Status changed",   color: "var(--blue-deep)",bg: "var(--blue-tint)" },
    "auth.login":          { label: "Signed in",        color: "var(--ink-2)",    bg: "var(--hair-3)" },
    "auth.logout":         { label: "Signed out",       color: "var(--ink-3)",    bg: "var(--hair-3)" },
  };

  const now = Date.now();
  const rangeMs = range === "24h" ? 86400000 : range === "7d" ? 7*86400000 : range === "30d" ? 30*86400000 : Infinity;

  const filtered = activityLog.filter(e => {
    if ((now - e.ts) > rangeMs) return false;
    if (filterAction !== "all" && e.action !== filterAction) return false;
    if (filterUser !== "all" && e.actor !== filterUser) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (e.actor||"").toLowerCase().includes(q)
        || (e.actorName||"").toLowerCase().includes(q)
        || (e.client||"").toLowerCase().includes(q)
        || (e.ref||"").toLowerCase().includes(q)
        || (e.action||"").toLowerCase().includes(q);
  });

  const clearLog = () => {
    window.appConfirm({
      title: "Clear activity log",
      message: "Clear the entire activity log? This can't be undone.",
      confirmLabel: "Clear log",
      destructive: true,
    }, () => setActivityLog([]));
  };

  const exportCSV = () => {
    const headers = ["timestamp","action","actor","actorName","actorRole","client","quoteRef","total","status","from","to"];
    const escape = (v) => {
      if (v == null) return "";
      const s = String(v);
      if (s.includes(",") || s.includes("\"") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const rows = [headers.join(",")];
    for (const e of filtered) {
      rows.push([
        new Date(e.ts).toISOString(),
        e.action,
        e.actor,
        e.actorName,
        e.actorRole,
        e.client || "",
        e.ref || "",
        e.total != null ? e.total : "",
        e.status || "",
        e.from || "",
        e.to || "",
      ].map(escape).join(","));
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmtTime = (ts) => {
    const d = new Date(ts);
    const diff = now - ts;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return Math.floor(diff/60000) + "m ago";
    if (diff < 86400000) return Math.floor(diff/3600000) + "h ago";
    if (diff < 7*86400000) return Math.floor(diff/86400000) + "d ago";
    return d.toLocaleDateString("en-AU", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
  };
  const fmtAbsolute = (ts) => new Date(ts).toLocaleString("en-AU", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

  const renderDetail = (e) => {
    const m = ACTION_META[e.action] || { label: e.action, color: "var(--ink-2)", bg: "var(--hair-3)" };
    if (e.action === "quote.draft.create" || e.action === "quote.draft.update" || e.action === "quote.sent" || e.action === "quote.duplicate" || e.action === "quote.delete") {
      return (
        <>
          <b>{e.client || "Untitled"}</b>
          <span className="ref">{e.ref}</span>
          {e.total != null && <span className="amt">{WEUtil.fmt(e.total)}</span>}
        </>
      );
    }
    if (e.action === "quote.status.change") {
      return <><b>{e.client}</b> <span className="ref">{e.ref}</span> <span className="ref">{e.from} → {e.to}</span></>;
    }
    if (e.action === "auth.login" || e.action === "auth.logout") {
      return <span className="ref">{e.actorRole}</span>;
    }
    return null;
  };

  const css = `
    .pal-toolbar { display:flex; align-items:center; gap:10px; margin-bottom:14px; flex-wrap:wrap; }
    .pal-toolbar .grp { display:flex; gap:4px; padding:3px; background:#fff; border:1px solid var(--hair); border-radius:8px; }
    .pal-toolbar .grp button { padding:7px 11px; background:transparent; border:none; font:inherit; font-size:12px; font-weight:600; color:var(--ink-3); cursor:pointer; border-radius:5px; }
    .pal-toolbar .grp button:hover { background:var(--hair-3); color:var(--ink-2); }
    .pal-toolbar .grp button.on { background:var(--ink); color:#fff; }
    .pal-search { flex:1; min-width:240px; display:flex; align-items:center; gap:9px; padding:8px 12px; background:#fff; border:1.5px solid var(--hair); border-radius:8px; }
    .pal-search:focus-within { border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }
    .pal-search svg { width:15px; height:15px; color:var(--ink-3); flex-shrink:0; }
    .pal-search input { flex:1; border:none; outline:none; background:transparent; font:inherit; font-size:13px; color:var(--ink); min-width:0; }
    .pal-search input::placeholder { color:var(--ink-4); }
    .pal-search .clear { background:transparent; border:none; cursor:pointer; color:var(--ink-3); font-size:15px; padding:2px 4px; }

    .pal-toolbar select { padding:8px 11px; border:1px solid var(--hair); border-radius:7px; font:inherit; font-size:12.5px; background:#fff; color:var(--ink); cursor:pointer; outline:none; }
    .pal-toolbar select:focus { border-color:var(--blue); }

    .pal-toolbar .btn-ghost { padding:8px 12px; background:transparent; color:var(--ink-2); border:1px solid var(--hair); border-radius:7px; font:inherit; font-size:12px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
    .pal-toolbar .btn-ghost:hover { background:var(--hair-3); color:var(--ink); }
    .pal-toolbar .btn-ghost svg { width:13px; height:13px; }
    .pal-toolbar .btn-ghost.danger { color:var(--neg); border-color:#FCA5A5; }
    .pal-toolbar .btn-ghost.danger:hover { background:#FEF2F2; }

    .pal-meta { font-size:12px; color:var(--ink-3); margin-bottom:12px; }
    .pal-meta b { color:var(--ink); }

    .pal-table { background:#fff; border:1px solid var(--hair); border-radius:10px; overflow:hidden; }
    .pal-row {
      display:grid; grid-template-columns:170px 150px 220px 1fr 110px;
      align-items:center; gap:14px;
      padding:11px 18px;
      border-bottom:1px solid var(--hair-2);
      font-size:13px;
    }
    .pal-row:last-child { border-bottom:none; }
    .pal-row.hd {
      background:var(--hair-3);
      font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase;
      color:var(--ink-3); font-weight:700;
      padding:9px 18px;
    }
    .pal-row:not(.hd):hover { background:#FAFCFE; }

    .pal-action-pill { display:inline-flex; align-items:center; padding:3px 9px; font-size:10.5px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; border-radius:11px; }
    .pal-actor { display:flex; align-items:center; gap:8px; min-width:0; }
    .pal-actor .av {
      width:26px; height:26px; border-radius:50%;
      background:linear-gradient(135deg, var(--blue) 0%, var(--blue-deep) 100%); color:#fff;
      display:grid; place-items:center; font-size:10px; font-weight:700; flex-shrink:0;
    }
    .pal-actor .av.admin { background:linear-gradient(135deg, #F59E0B 0%, #B85C00 100%); }
    .pal-actor .av.partner { background:linear-gradient(135deg, #A855F7 0%, #6B21A8 100%); }
    .pal-actor .nm { font-weight:600; line-height:1.2; min-width:0; }
    .pal-actor .em { font-family:'JetBrains Mono',monospace; font-size:10.5px; color:var(--ink-3); margin-top:1px; }
    .pal-detail { display:flex; align-items:center; gap:8px; font-size:12.5px; min-width:0; }
    .pal-detail b { color:var(--ink); }
    .pal-detail .ref { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--ink-3); padding:1px 6px; background:var(--hair-3); border-radius:4px; }
    .pal-detail .amt { font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--ink); font-weight:600; }
    .pal-time { font-size:12px; color:var(--ink-3); font-family:'JetBrains Mono',monospace; }
    .pal-time .abs { font-size:10.5px; color:var(--ink-4); display:block; margin-top:1px; }

    .pal-empty { padding:40px; text-align:center; color:var(--ink-3); font-size:13px; }
    .pal-empty .ttl { font-family:'Source Serif 4',serif; font-size:18px; color:var(--ink); margin-bottom:5px; }
  `;

  const initialsOf = (e) => {
    if (e.actorName) {
      const parts = e.actorName.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
      return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
    }
    return (e.actor||"??").slice(0,2).toUpperCase();
  };

  return (
    <div>
      <style>{css}</style>

      <div className="pal-toolbar">
        <div className="pal-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search actor, client, ref or action…" />
          {query && <button className="clear" onClick={() => setQuery("")}>×</button>}
        </div>
        <div className="grp">
          <button className={range==="24h"?"on":""} onClick={() => setRange("24h")}>24h</button>
          <button className={range==="7d"?"on":""} onClick={() => setRange("7d")}>7d</button>
          <button className={range==="30d"?"on":""} onClick={() => setRange("30d")}>30d</button>
          <button className={range==="all"?"on":""} onClick={() => setRange("all")}>All</button>
        </div>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
          <option value="all">All actions</option>
          {Object.entries(ACTION_GROUPS).map(([g, acts]) => (
            <optgroup key={g} label={g}>
              {acts.map(a => <option key={a} value={a}>{ACTION_META[a]?.label || a}</option>)}
            </optgroup>
          ))}
        </select>
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
          <option value="all">All users</option>
          {users.map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
        </select>
        <button className="btn-ghost" onClick={exportCSV} title="Download visible entries as CSV">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Export CSV
        </button>
        <button className="btn-ghost danger" onClick={clearLog} title="Clear all log entries">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>
          Clear log
        </button>
      </div>

      <div className="pal-meta">
        <b>{filtered.length}</b> of {activityLog.length} entries shown · log capped at {LOG_MAX_ENTRIES} most-recent
      </div>

      {filtered.length === 0 ? (
        <div className="pal-table">
          <div className="pal-empty">
            <div className="ttl">{activityLog.length === 0 ? "No activity yet" : "No matches"}</div>
            <div>{activityLog.length === 0 ? "User actions like quote creation, edits, and sign-ins will appear here as they happen." : "Try different filters or a broader date range."}</div>
          </div>
        </div>
      ) : (
        <div className="pal-table">
          <div className="pal-row hd">
            <div>When</div>
            <div>Action</div>
            <div>Who</div>
            <div>Detail</div>
            <div></div>
          </div>
          {filtered.map((e) => {
            const m = ACTION_META[e.action] || { label: e.action, color: "var(--ink-2)", bg: "var(--hair-3)" };
            return (
              <div className="pal-row" key={e.id} title={fmtAbsolute(e.ts)}>
                <div className="pal-time">{fmtTime(e.ts)}<span className="abs">{new Date(e.ts).toLocaleTimeString("en-AU",{hour:"2-digit",minute:"2-digit"})}</span></div>
                <div><span className="pal-action-pill" style={{color: m.color, background: m.bg}}>{m.label}</span></div>
                <div className="pal-actor">
                  <div className={`av ${e.actorRole || "sales"}`}>{initialsOf(e)}</div>
                  <div style={{minWidth:0, overflow:"hidden"}}>
                    <div className="nm" style={{textOverflow:"ellipsis", overflow:"hidden", whiteSpace:"nowrap"}}>{e.actorName || e.actor}</div>
                    <div className="em" style={{textOverflow:"ellipsis", overflow:"hidden", whiteSpace:"nowrap"}}>{e.actor}</div>
                  </div>
                </div>
                <div className="pal-detail" style={{minWidth:0, overflow:"hidden"}}>{renderDetail(e)}</div>
                <div></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

window.ActivityLogAdminSection = ActivityLogAdminSection;
