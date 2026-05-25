// Portal Quotes — list of saved quotations (draft + sent) with filters, search, per-quote actions.

const { useState: useStateQ, useMemo: useMemoQ } = React;

function PortalQuotes({ quotes, tables, onOpen, onNew, onDuplicate, onDelete, onSetStatus }) {
  const [filter, setFilter] = useStateQ("all"); // all | draft | sent
  const [query, setQuery] = useStateQ("");
  const [sort, setSort] = useStateQ("updated"); // updated | created | total | client

  const counts = useMemoQ(() => {
    return {
      all: quotes.length,
      draft: quotes.filter(q => q.status === "draft").length,
      sent: quotes.filter(q => q.status === "sent").length,
    };
  }, [quotes]);

  const filtered = useMemoQ(() => {
    const q = query.trim().toLowerCase();
    let list = quotes;
    if (filter !== "all") list = list.filter(x => x.status === filter);
    if (q) {
      list = list.filter(x =>
        (x.client || "").toLowerCase().includes(q) ||
        (x.quoteRef || "").toLowerCase().includes(q) ||
        (x.input.sites || []).some(s => (s.name||"").toLowerCase().includes(q))
      );
    }
    const sorted = [...list];
    if (sort === "updated") sorted.sort((a,b) => b.updatedAt - a.updatedAt);
    else if (sort === "created") sorted.sort((a,b) => b.createdAt - a.createdAt);
    else if (sort === "total") sorted.sort((a,b) => (b.total||0) - (a.total||0));
    else if (sort === "client") sorted.sort((a,b) => (a.client||"").localeCompare(b.client||""));
    return sorted;
  }, [quotes, filter, query, sort]);

  const totals = useMemoQ(() => {
    const draftTotal = quotes.filter(q => q.status === "draft").reduce((a,b) => a + (b.total||0), 0);
    const sentTotal  = quotes.filter(q => q.status === "sent").reduce((a,b) => a + (b.total||0), 0);
    return { draftTotal, sentTotal };
  }, [quotes]);

  const fmtDate = (ts) => {
    if (!ts) return "—";
    const d = new Date(ts);
    const now = Date.now();
    const diffMs = now - ts;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "2-digit" });
  };
  const fmtDateLong = (ts) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
  };

  const css = `
    .pq { padding:24px 36px 48px; max-width:1480px; margin:0 auto; }
    .pq .serif { font-family:'Source Serif 4',serif; }
    .pq .mono { font-family:'JetBrains Mono',monospace; font-feature-settings:"tnum"; }

    /* Hero */
    .pq-hero { display:flex; align-items:flex-end; justify-content:space-between; padding-bottom:18px; margin-bottom:18px; border-bottom:1px solid var(--hair); gap:24px; }
    .pq-hero-l .eyebrow { font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--blue-deep); font-weight:700; }
    .pq-hero-l h1 { font-family:'Source Serif 4',serif; font-size:30px; font-weight:600; letter-spacing:-0.01em; margin:6px 0 0; line-height:1.1; }
    .pq-hero-l p { font-size:14px; color:var(--ink-3); margin:6px 0 0; max-width:560px; line-height:1.5; }
    .pq-new {
      padding:11px 18px; background:var(--ink); color:#fff;
      border:none; border-radius:8px;
      font:inherit; font-size:13px; font-weight:600;
      letter-spacing:0.04em; cursor:pointer;
      display:inline-flex; align-items:center; gap:8px;
    }
    .pq-new:hover { background:var(--blue-deep); }
    .pq-new svg { width:16px; height:16px; }

    /* Stats strip */
    .pq-stats { display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; margin-bottom:18px; }
    .pq-stat {
      background:#fff; border:1px solid var(--hair); border-radius:10px;
      padding:14px 16px;
    }
    .pq-stat .lab { font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); font-weight:700; }
    .pq-stat .v { font-family:'JetBrains Mono',monospace; font-size:24px; font-weight:600; color:var(--ink); margin-top:5px; letter-spacing:-0.005em; }
    .pq-stat .v .sub { font-family:'Source Sans 3',sans-serif; font-size:12px; color:var(--ink-3); margin-left:6px; font-weight:500; }
    .pq-stat .v.sent { color:var(--pos); }
    .pq-stat .v.draft { color:var(--warn); }

    /* Toolbar */
    .pq-toolbar { display:flex; align-items:center; gap:12px; margin-bottom:14px; flex-wrap:wrap; }
    .pq-search {
      flex:1; min-width:280px;
      display:flex; align-items:center; gap:9px;
      padding:9px 14px; background:#fff;
      border:1.5px solid var(--hair); border-radius:8px;
      transition:border-color 0.15s, box-shadow 0.15s;
    }
    .pq-search:focus-within { border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }
    .pq-search svg { width:16px; height:16px; color:var(--ink-3); flex-shrink:0; }
    .pq-search input {
      flex:1; border:none; outline:none; background:transparent;
      font:inherit; font-size:14px; color:var(--ink); min-width:0;
    }
    .pq-search input::placeholder { color:var(--ink-4); }
    .pq-search .clear { background:transparent; border:none; cursor:pointer; color:var(--ink-3); font-size:16px; padding:2px 4px; }
    .pq-search .clear:hover { color:var(--ink); }

    .pq-filters { display:flex; gap:4px; padding:3px; background:#fff; border:1px solid var(--hair); border-radius:8px; }
    .pq-filter {
      padding:7px 12px; background:transparent; border:none;
      font:inherit; font-size:12.5px; font-weight:600; color:var(--ink-3);
      cursor:pointer; border-radius:5px;
      display:inline-flex; align-items:center; gap:7px;
    }
    .pq-filter:hover { background:var(--hair-3); color:var(--ink-2); }
    .pq-filter.on { background:var(--ink); color:#fff; }
    .pq-filter .cnt {
      font-family:'JetBrains Mono',monospace; font-size:11px;
      padding:1px 6px; background:rgba(0,0,0,0.08); border-radius:9px;
    }
    .pq-filter.on .cnt { background:rgba(255,255,255,0.18); }

    .pq-sort { display:flex; align-items:center; gap:8px; }
    .pq-sort label { font-size:11px; color:var(--ink-3); letter-spacing:0.04em; }
    .pq-sort select {
      padding:7px 10px; border:1px solid var(--hair); border-radius:6px;
      font:inherit; font-size:12.5px; color:var(--ink); background:#fff;
      cursor:pointer; outline:none;
    }

    /* Quote list table */
    .pq-table { background:#fff; border:1px solid var(--hair); border-radius:10px; overflow:visible; }
    .pq-row {
      display:grid;
      grid-template-columns:60px 1.6fr 1fr 1fr 1fr 1.1fr auto;
      align-items:center;
      gap:14px;
      padding:14px 20px;
      border-bottom:1px solid var(--hair-2);
      transition:background 0.1s;
    }
    .pq-row:last-child { border-bottom:none; }
    .pq-row.hd {
      background:var(--hair-3);
      font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase;
      color:var(--ink-3); font-weight:700;
      padding:9px 20px;
      border-bottom:1px solid var(--hair);
    }
    .pq-row:not(.hd):hover { background:#FAFCFE; }

    .pq-status {
      display:inline-flex; align-items:center; gap:6px;
      padding:4px 10px;
      font-size:11px; font-weight:700;
      letter-spacing:0.06em; text-transform:uppercase;
      border-radius:14px;
      width:fit-content;
    }
    .pq-status .d { width:6px; height:6px; border-radius:50%; background:currentColor; }
    .pq-status.draft { background:var(--warn-bg); color:var(--warn); }
    .pq-status.sent { background:var(--pos-bg); color:var(--pos); }

    .pq-cell { font-size:13px; color:var(--ink); min-width:0; }
    .pq-cell.client { font-weight:600; line-height:1.3; }
    .pq-cell.client .ref { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--ink-3); margin-top:3px; font-weight:500; }
    .pq-cell.meta { font-size:12px; color:var(--ink-2); }
    .pq-cell.meta .sub { font-size:11px; color:var(--ink-3); margin-top:2px; }
    .pq-cell.amount { font-family:'JetBrains Mono',monospace; font-size:15px; font-weight:600; color:var(--ink); text-align:right; }
    .pq-cell.amount .band { font-family:'Source Sans 3',sans-serif; font-size:10.5px; color:var(--ink-3); font-weight:500; margin-top:2px; text-align:right; }

    .pq-actions { display:flex; gap:4px; justify-content:flex-end; }
    .pq-act {
      padding:6px 10px; background:transparent; color:var(--ink-2);
      border:1px solid var(--hair); border-radius:5px;
      font:inherit; font-size:11.5px; font-weight:600; cursor:pointer;
      display:inline-flex; align-items:center; gap:5px;
    }
    .pq-act svg { width:13px; height:13px; }
    .pq-act:hover { background:var(--blue-tint); color:var(--blue-deep); border-color:var(--blue); }
    .pq-act.primary { background:var(--ink); color:#fff; border-color:var(--ink); }
    .pq-act.primary:hover { background:var(--blue-deep); border-color:var(--blue-deep); }
    .pq-act.danger:hover { background:#FEF2F2; color:var(--neg); border-color:var(--neg); }
    .pq-act.success:hover { background:var(--pos-bg); color:var(--pos); border-color:var(--pos); }

    .pq-menu { position:relative; }
    .pq-menu-btn {
      width:28px; height:28px; padding:0; background:transparent;
      border:1px solid var(--hair); border-radius:5px;
      color:var(--ink-3); cursor:pointer;
      display:grid; place-items:center;
    }
    .pq-menu-btn:hover { background:var(--hair-3); color:var(--ink); }
    .pq-menu-btn svg { width:14px; height:14px; }
    .pq-menu-pop {
      position:absolute; top:calc(100% + 4px); right:0;
      background:#fff; border:1px solid var(--hair); border-radius:6px;
      box-shadow:0 8px 24px -10px rgba(10,22,40,0.2);
      min-width:160px; z-index:50; padding:4px;
    }
    .pq-menu-pop button {
      display:flex; width:100%; align-items:center; gap:8px;
      padding:7px 10px; background:transparent; border:none;
      font:inherit; font-size:12.5px; color:var(--ink-2); cursor:pointer;
      text-align:left; border-radius:4px;
    }
    .pq-menu-pop button:hover { background:var(--blue-tint); color:var(--blue-deep); }
    .pq-menu-pop button.danger:hover { background:#FEF2F2; color:var(--neg); }
    .pq-menu-pop button svg { width:14px; height:14px; }
    .pq-menu-pop .div { height:1px; background:var(--hair-2); margin:4px 0; }

    /* Empty state */
    .pq-empty {
      padding:60px 24px; text-align:center;
      background:#fff; border:1px dashed var(--hair); border-radius:10px;
    }
    .pq-empty svg { width:36px; height:36px; color:var(--ink-4); margin-bottom:12px; }
    .pq-empty .ttl { font-family:'Source Serif 4',serif; font-size:20px; font-weight:600; color:var(--ink); margin-bottom:4px; }
    .pq-empty .sub { font-size:13.5px; color:var(--ink-3); max-width:380px; margin:0 auto 18px; line-height:1.5; }
    .pq-empty .pq-new { background:var(--blue); }

    /* Index column */
    .pq-num { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--ink-4); text-align:center; font-weight:600; }
  `;

  return (
    <div className="pq">
      <style>{css}</style>

      <div className="pq-hero">
        <div className="pq-hero-l">
          <div className="eyebrow">Sales · Quote workspace</div>
          <h1>Saved quotes</h1>
          <p>Pick up a draft, follow up on a sent quote, or duplicate an existing one as a starting point.</p>
        </div>
        <button className="pq-new" onClick={onNew}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
          New quote
        </button>
      </div>

      <div className="pq-stats">
        <div className="pq-stat">
          <div className="lab">Total quotes</div>
          <div className="v">{quotes.length}</div>
        </div>
        <div className="pq-stat">
          <div className="lab">Drafts</div>
          <div className="v draft">{counts.draft} <span className="sub">· {WEUtil.fmt(totals.draftTotal)}</span></div>
        </div>
        <div className="pq-stat">
          <div className="lab">Sent</div>
          <div className="v sent">{counts.sent} <span className="sub">· {WEUtil.fmt(totals.sentTotal)}</span></div>
        </div>
        <div className="pq-stat">
          <div className="lab">Pipeline value</div>
          <div className="v">{WEUtil.fmt(totals.draftTotal + totals.sentTotal)}</div>
        </div>
      </div>

      <div className="pq-toolbar">
        <div className="pq-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by client, reference or site…" />
          {query && <button className="clear" onClick={() => setQuery("")}>×</button>}
        </div>

        <div className="pq-filters">
          <button className={`pq-filter ${filter==="all"?"on":""}`} onClick={() => setFilter("all")}>All <span className="cnt">{counts.all}</span></button>
          <button className={`pq-filter ${filter==="draft"?"on":""}`} onClick={() => setFilter("draft")}>Drafts <span className="cnt">{counts.draft}</span></button>
          <button className={`pq-filter ${filter==="sent"?"on":""}`} onClick={() => setFilter("sent")}>Sent <span className="cnt">{counts.sent}</span></button>
        </div>

        <div className="pq-sort">
          <label>Sort</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="updated">Last updated</option>
            <option value="created">Date created</option>
            <option value="total">Total amount</option>
            <option value="client">Client name</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="pq-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>
          <div className="ttl">{quotes.length === 0 ? "No quotes yet" : "No matches"}</div>
          <div className="sub">
            {quotes.length === 0
              ? "Save a draft from the quote calculator, or send a quote to a client — they'll show up here, ready to pick back up."
              : "Try a different search or filter."}
          </div>
          {quotes.length === 0 && (
            <button className="pq-new" onClick={onNew}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
              Start a new quote
            </button>
          )}
        </div>
      ) : (
        <div className="pq-table">
          <div className="pq-row hd">
            <div className="pq-num">#</div>
            <div>Client</div>
            <div>Status</div>
            <div>Created</div>
            <div>Last updated</div>
            <div style={{textAlign:"right"}}>Total · ex-GST</div>
            <div style={{textAlign:"right"}}>Actions</div>
          </div>
          {filtered.map((q, i) => (
            <QuoteRow
              key={q.id}
              idx={i+1}
              quote={q}
              fmtDate={fmtDate}
              fmtDateLong={fmtDateLong}
              onOpen={() => onOpen(q.id)}
              onDuplicate={() => onDuplicate(q.id)}
              onDelete={() => onDelete(q.id)}
              onSetStatus={(status) => onSetStatus(q.id, status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuoteRow({ idx, quote, fmtDate, fmtDateLong, onOpen, onDuplicate, onDelete, onSetStatus }) {
  const [menuOpen, setMenuOpen] = useStateQ(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const totalCams = (quote.input.sites || []).reduce((a,b) => a + (+b.wifi||0) + (+b.fourg||0), 0);
  const numSites = (quote.input.sites || []).length;

  return (
    <div className="pq-row">
      <div className="pq-num">{String(idx).padStart(2, "0")}</div>

      <div className="pq-cell client">
        <div>{quote.client || <span style={{color:"var(--ink-4)", fontStyle:"italic"}}>Unnamed client</span>}</div>
        <div className="ref">{quote.quoteRef}</div>
      </div>

      <div>
        <span className={`pq-status ${quote.status}`}>
          <span className="d"></span>
          {quote.status}
        </span>
      </div>

      <div className="pq-cell meta">
        <div>{fmtDateLong(quote.createdAt)}</div>
        <div className="sub">{numSites} site{numSites===1?"":"s"} · {totalCams} cams</div>
      </div>

      <div className="pq-cell meta">
        <div>{fmtDate(quote.updatedAt)}</div>
        <div className="sub">{quote.bandKey || "—"} band · {quote.tier || "—"}</div>
      </div>

      <div className="pq-cell amount">
        {WEUtil.fmt(quote.total)}
        <div className="band">{quote.input.sites?.length || 0} site · {totalCams} cams</div>
      </div>

      <div className="pq-actions">
        <button className="pq-act primary" onClick={onOpen}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4h5v5M19 4l-7 7M19 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/></svg>
          Open
        </button>
        <div className="pq-menu" ref={menuRef}>
          <button className="pq-menu-btn" onClick={() => setMenuOpen(!menuOpen)} title="More actions">
            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18" cy="12" r="1.7"/></svg>
          </button>
          {menuOpen && (
            <div className="pq-menu-pop">
              {quote.status === "draft" ? (
                <button className="success" onClick={() => { onSetStatus("sent"); setMenuOpen(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                  Mark as sent
                </button>
              ) : (
                <button onClick={() => { onSetStatus("draft"); setMenuOpen(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h13l-2-3H5L3 7zM3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7"/></svg>
                  Move back to draft
                </button>
              )}
              <button onClick={() => { onDuplicate(); setMenuOpen(false); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>
                Duplicate
              </button>
              <div className="div"></div>
              <button className="danger" onClick={() => { window.appConfirm({ title: "Delete quote", message: "Delete this quote? This can't be undone.", confirmLabel: "Delete", destructive: true }, () => { onDelete(); setMenuOpen(false); }); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.PortalQuotes = PortalQuotes;
