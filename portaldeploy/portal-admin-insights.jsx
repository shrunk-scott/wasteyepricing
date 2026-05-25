// Portal Admin — Activity & Insights section
// Attached to portal-admin.jsx via window globals; this file appended after PortalAdmin loads.

function InsightsAdminSection({ quotes, users, onOpenQuote }) {
  const [range, setRange] = React.useState("all"); // all | 30d | 7d
  const [userFilter, setUserFilter] = React.useState("all");

  const now = Date.now();
  const rangeMs = range === "7d" ? 7*86400000 : range === "30d" ? 30*86400000 : Infinity;
  const inRange = (ts) => (now - ts) <= rangeMs;

  const scopedQuotes = React.useMemo(() => {
    return quotes.filter(q => {
      if (!inRange(q.createdAt || q.updatedAt || 0)) return false;
      if (userFilter !== "all" && q.createdBy !== userFilter) return false;
      return true;
    });
  }, [quotes, range, userFilter]);

  // KPIs
  const totalCount = scopedQuotes.length;
  const draftCount = scopedQuotes.filter(q => q.status === "draft").length;
  const sentCount  = scopedQuotes.filter(q => q.status === "sent").length;
  const totalValue = scopedQuotes.reduce((a,b) => a + (b.total||0), 0);
  const sentValue  = scopedQuotes.filter(q => q.status==="sent").reduce((a,b) => a + (b.total||0), 0);
  const draftValue = scopedQuotes.filter(q => q.status==="draft").reduce((a,b) => a + (b.total||0), 0);
  const avgValue   = totalCount ? Math.round(totalValue / totalCount) : 0;
  const conversionRate = totalCount ? Math.round((sentCount / totalCount) * 100) : 0;

  // By user
  const byUser = React.useMemo(() => {
    const map = new Map();
    for (const q of scopedQuotes) {
      const key = q.createdBy || "unknown";
      if (!map.has(key)) {
        const u = users.find(x => x.email === key);
        map.set(key, {
          email: key,
          name: u ? u.name : (q.createdByName || key),
          initials: u ? u.initials : "??",
          role: u ? u.role : "—",
          draft: 0, sent: 0, total: 0, sentVal: 0, draftVal: 0,
        });
      }
      const r = map.get(key);
      r.total += q.total || 0;
      if (q.status === "draft") { r.draft++; r.draftVal += q.total||0; }
      else if (q.status === "sent") { r.sent++; r.sentVal += q.total||0; }
    }
    return [...map.values()].sort((a,b) => b.total - a.total);
  }, [scopedQuotes, users]);

  // Top clients
  const topClients = React.useMemo(() => {
    const map = new Map();
    for (const q of scopedQuotes) {
      const k = (q.client||"Untitled").trim();
      if (!map.has(k)) map.set(k, { client: k, count: 0, total: 0, lastTs: 0 });
      const r = map.get(k);
      r.count++;
      r.total += q.total||0;
      r.lastTs = Math.max(r.lastTs, q.updatedAt||q.createdAt||0);
    }
    return [...map.values()].sort((a,b) => b.total - a.total).slice(0, 8);
  }, [scopedQuotes]);

  // Timeline — last 14 days, count + value
  const timeline = React.useMemo(() => {
    const days = 14;
    const buckets = [];
    const dayMs = 86400000;
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = days - 1; i >= 0; i--) {
      const start = today.getTime() - i*dayMs;
      const end = start + dayMs;
      const inDay = scopedQuotes.filter(q => (q.createdAt||0) >= start && (q.createdAt||0) < end);
      buckets.push({
        ts: start,
        count: inDay.length,
        value: inDay.reduce((a,b)=>a+(b.total||0), 0),
        sent: inDay.filter(q=>q.status==="sent").length,
      });
    }
    return buckets;
  }, [scopedQuotes]);

  const timelineMax = Math.max(1, ...timeline.map(b => b.value));
  const timelineMaxCount = Math.max(1, ...timeline.map(b => b.count));

  // Recent quotes (last 10)
  const recent = React.useMemo(() => {
    return [...scopedQuotes].sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0)).slice(0, 10);
  }, [scopedQuotes]);

  const fmtDate = (ts) => {
    if (!ts) return "—";
    const d = new Date(ts);
    const diff = (now - ts);
    if (diff < 60000) return "just now";
    if (diff < 3600000) return Math.floor(diff/60000) + "m ago";
    if (diff < 86400000) return Math.floor(diff/3600000) + "h ago";
    if (diff < 7*86400000) return Math.floor(diff/86400000) + "d ago";
    return d.toLocaleDateString("en-AU", { day:"2-digit", month:"short" });
  };

  const css = `
    .pi-toolbar { display:flex; align-items:center; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
    .pi-toolbar .grp { display:flex; gap:4px; padding:3px; background:#fff; border:1px solid var(--hair); border-radius:8px; }
    .pi-toolbar .grp button { padding:7px 12px; background:transparent; border:none; font:inherit; font-size:12.5px; font-weight:600; color:var(--ink-3); cursor:pointer; border-radius:5px; }
    .pi-toolbar .grp button:hover { background:var(--hair-3); color:var(--ink-2); }
    .pi-toolbar .grp button.on { background:var(--ink); color:#fff; }
    .pi-toolbar .lab { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-3); font-weight:700; }
    .pi-toolbar select { padding:7px 10px; border:1px solid var(--hair); border-radius:6px; font:inherit; font-size:12.5px; color:var(--ink); background:#fff; cursor:pointer; outline:none; }

    .pi-kpis { display:grid; grid-template-columns:repeat(5, 1fr); gap:12px; margin-bottom:18px; }
    .pi-kpi { background:#fff; border:1px solid var(--hair); border-radius:10px; padding:14px 16px; }
    .pi-kpi .lab { font-size:10px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); font-weight:700; }
    .pi-kpi .v { font-family:'JetBrains Mono',monospace; font-size:24px; font-weight:600; color:var(--ink); margin-top:5px; letter-spacing:-0.005em; }
    .pi-kpi .v.draft { color:var(--warn); }
    .pi-kpi .v.sent { color:var(--pos); }
    .pi-kpi .sub { font-size:11px; color:var(--ink-3); margin-top:3px; }

    .pi-grid { display:grid; grid-template-columns:1.5fr 1fr; gap:14px; margin-bottom:14px; }
    .pi-card { background:#fff; border:1px solid var(--hair); border-radius:10px; overflow:hidden; }
    .pi-card-h { padding:12px 18px; border-bottom:1px solid var(--hair-2); display:flex; justify-content:space-between; align-items:center; }
    .pi-card-h .ttl { font-size:11px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink); }
    .pi-card-h .meta { font-size:11.5px; color:var(--ink-3); font-family:'JetBrains Mono',monospace; }

    /* Timeline chart */
    .pi-chart { padding:18px 18px 14px; }
    .pi-chart-bars { display:flex; align-items:flex-end; gap:6px; height:120px; }
    .pi-bar { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; }
    .pi-bar .bar { width:100%; background:linear-gradient(180deg, var(--blue) 0%, var(--blue-deep) 100%); border-radius:3px 3px 0 0; min-height:2px; position:relative; transition:opacity 0.15s; }
    .pi-bar .bar:hover { opacity:0.8; }
    .pi-bar .bar .tip { position:absolute; bottom:calc(100% + 4px); left:50%; transform:translateX(-50%); background:var(--ink); color:#fff; padding:4px 8px; font-size:11px; font-family:'JetBrains Mono',monospace; border-radius:4px; opacity:0; pointer-events:none; white-space:nowrap; z-index:2; }
    .pi-bar .bar:hover .tip { opacity:1; }
    .pi-bar .bar.empty { background:var(--hair-2); }
    .pi-bar .dy { font-family:'JetBrains Mono',monospace; font-size:9.5px; color:var(--ink-3); margin-top:5px; }

    /* Tables */
    .pi-tbl { width:100%; border-collapse:collapse; font-size:12.5px; }
    .pi-tbl th { text-align:left; padding:9px 14px; font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-3); background:var(--hair-3); border-bottom:1px solid var(--hair); }
    .pi-tbl th.num { text-align:right; }
    .pi-tbl td { padding:10px 14px; border-bottom:1px solid var(--hair-2); vertical-align:middle; }
    .pi-tbl td.num { text-align:right; font-family:'JetBrains Mono',monospace; }
    .pi-tbl tr:last-child td { border-bottom:none; }
    .pi-tbl tr:hover td { background:#FAFCFE; }

    .pi-u { display:flex; align-items:center; gap:10px; }
    .pi-u .av { width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg, var(--blue) 0%, var(--blue-deep) 100%); color:#fff; display:grid; place-items:center; font-size:11px; font-weight:700; flex-shrink:0; }
    .pi-u .av.admin { background:linear-gradient(135deg, #F59E0B 0%, #B85C00 100%); }
    .pi-u .av.partner { background:linear-gradient(135deg, #A855F7 0%, #6B21A8 100%); }
    .pi-u .nm { font-weight:600; color:var(--ink); }
    .pi-u .em { font-family:'JetBrains Mono',monospace; font-size:10.5px; color:var(--ink-3); margin-top:1px; }

    .pi-bar-mini { display:inline-flex; align-items:center; gap:8px; }
    .pi-bar-mini .bm { width:60px; height:6px; background:var(--hair-2); border-radius:3px; overflow:hidden; }
    .pi-bar-mini .bm .fill { height:100%; background:var(--blue); border-radius:3px; }
    .pi-bar-mini .pct { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--ink-3); }

    .pi-status-chip { display:inline-flex; align-items:center; gap:5px; padding:2px 8px; font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; border-radius:10px; }
    .pi-status-chip .d { width:5px; height:5px; border-radius:50%; background:currentColor; }
    .pi-status-chip.draft { background:var(--warn-bg); color:var(--warn); }
    .pi-status-chip.sent { background:var(--pos-bg); color:var(--pos); }

    .pi-open-btn { padding:5px 10px; background:transparent; border:1px solid var(--hair); color:var(--ink-2); border-radius:5px; font:inherit; font-size:11.5px; font-weight:600; cursor:pointer; }
    .pi-open-btn:hover { background:var(--blue-tint); color:var(--blue-deep); border-color:var(--blue); }

    .pi-empty { padding:30px 20px; text-align:center; color:var(--ink-3); font-size:13px; }
  `;

  return (
    <div>
      <style>{css}</style>

      {/* Toolbar */}
      <div className="pi-toolbar">
        <span className="lab">Range</span>
        <div className="grp">
          <button className={range==="7d"?"on":""} onClick={() => setRange("7d")}>Last 7 days</button>
          <button className={range==="30d"?"on":""} onClick={() => setRange("30d")}>Last 30 days</button>
          <button className={range==="all"?"on":""} onClick={() => setRange("all")}>All time</button>
        </div>
        <span className="lab" style={{marginLeft:10}}>User</span>
        <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
          <option value="all">All users ({quotes.length})</option>
          {users.map(u => (
            <option key={u.email} value={u.email}>{u.name} ({u.email})</option>
          ))}
        </select>
        <div style={{marginLeft:"auto", fontSize:11.5, color:"var(--ink-3)"}}>
          Showing <b style={{color:"var(--ink)"}}>{scopedQuotes.length}</b> of {quotes.length} quotes
        </div>
      </div>

      {/* KPIs */}
      <div className="pi-kpis">
        <div className="pi-kpi">
          <div className="lab">Total quotes</div>
          <div className="v">{totalCount}</div>
          <div className="sub">{draftCount} draft · {sentCount} sent</div>
        </div>
        <div className="pi-kpi">
          <div className="lab">Pipeline value</div>
          <div className="v">{WEUtil.fmt(totalValue)}</div>
          <div className="sub">All saved quotes</div>
        </div>
        <div className="pi-kpi">
          <div className="lab">Sent value</div>
          <div className="v sent">{WEUtil.fmt(sentValue)}</div>
          <div className="sub">{sentCount} quote{sentCount===1?"":"s"} sent</div>
        </div>
        <div className="pi-kpi">
          <div className="lab">Draft value</div>
          <div className="v draft">{WEUtil.fmt(draftValue)}</div>
          <div className="sub">{draftCount} draft{draftCount===1?"":"s"}</div>
        </div>
        <div className="pi-kpi">
          <div className="lab">Avg quote · Send rate</div>
          <div className="v">{WEUtil.fmt(avgValue)}</div>
          <div className="sub">{conversionRate}% sent</div>
        </div>
      </div>

      <div className="pi-grid">
        {/* Timeline */}
        <div className="pi-card">
          <div className="pi-card-h">
            <span className="ttl">New quotes · last 14 days</span>
            <span className="meta">{timeline.reduce((a,b)=>a+b.count,0)} quotes · {WEUtil.fmt(timeline.reduce((a,b)=>a+b.value,0))}</span>
          </div>
          <div className="pi-chart">
            <div className="pi-chart-bars">
              {timeline.map((b, i) => {
                const h = b.value > 0 ? Math.max(2, (b.value / timelineMax) * 100) : 0;
                const dy = new Date(b.ts);
                return (
                  <div className="pi-bar" key={i}>
                    <div className={`bar ${b.count===0?"empty":""}`} style={{height: `${h}%`}}>
                      <div className="tip">
                        {dy.toLocaleDateString("en-AU",{day:"2-digit",month:"short"})} · {b.count} quote{b.count===1?"":"s"} · {WEUtil.fmt(b.value)}
                      </div>
                    </div>
                    <div className="dy">{dy.toLocaleDateString("en-AU",{day:"2-digit"})}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top clients */}
        <div className="pi-card">
          <div className="pi-card-h">
            <span className="ttl">Top clients by value</span>
            <span className="meta">{topClients.length} unique</span>
          </div>
          {topClients.length === 0 ? (
            <div className="pi-empty">No quotes in this range yet.</div>
          ) : (
            <table className="pi-tbl">
              <thead><tr><th>Client</th><th className="num">Quotes</th><th className="num">Value</th></tr></thead>
              <tbody>
                {topClients.map((c, i) => (
                  <tr key={i}>
                    <td><b>{c.client}</b><div style={{fontSize:10.5, color:"var(--ink-3)", marginTop:2}}>Last activity {fmtDate(c.lastTs)}</div></td>
                    <td className="num">{c.count}</td>
                    <td className="num"><b>{WEUtil.fmt(c.total)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* By user */}
      <div className="pi-card" style={{marginBottom:14}}>
        <div className="pi-card-h">
          <span className="ttl">Quotes by user</span>
          <span className="meta">{byUser.length} active rep{byUser.length===1?"":"s"}</span>
        </div>
        {byUser.length === 0 ? (
          <div className="pi-empty">No quotes recorded for this range.</div>
        ) : (
          <table className="pi-tbl">
            <thead>
              <tr>
                <th>User</th>
                <th className="num">Drafts</th>
                <th className="num">Sent</th>
                <th className="num">Sent value</th>
                <th className="num">Draft value</th>
                <th className="num">Total</th>
                <th>Send rate</th>
              </tr>
            </thead>
            <tbody>
              {byUser.map((r) => {
                const totalQ = r.draft + r.sent;
                const pct = totalQ ? Math.round((r.sent / totalQ) * 100) : 0;
                return (
                  <tr key={r.email}>
                    <td>
                      <div className="pi-u">
                        <div className={`av ${r.role}`}>{r.initials}</div>
                        <div>
                          <div className="nm">{r.name}</div>
                          <div className="em">{r.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num">{r.draft}</td>
                    <td className="num">{r.sent}</td>
                    <td className="num"><b style={{color:"var(--pos)"}}>{WEUtil.fmt(r.sentVal)}</b></td>
                    <td className="num" style={{color:"var(--warn)"}}>{WEUtil.fmt(r.draftVal)}</td>
                    <td className="num"><b>{WEUtil.fmt(r.total)}</b></td>
                    <td>
                      <span className="pi-bar-mini">
                        <span className="bm"><span className="fill" style={{width: pct+"%"}}></span></span>
                        <span className="pct">{pct}%</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent activity */}
      <div className="pi-card">
        <div className="pi-card-h">
          <span className="ttl">Recent quote activity</span>
          <span className="meta">Showing {recent.length} of {scopedQuotes.length}</span>
        </div>
        {recent.length === 0 ? (
          <div className="pi-empty">No quote activity yet — drafts and sent quotes will appear here as reps build them.</div>
        ) : (
          <table className="pi-tbl">
            <thead>
              <tr>
                <th>Client / Ref</th>
                <th>Status</th>
                <th>Created by</th>
                <th>Updated</th>
                <th className="num">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recent.map((q) => {
                const u = users.find(x => x.email === q.createdBy);
                return (
                  <tr key={q.id}>
                    <td>
                      <b>{q.client || <span style={{color:"var(--ink-4)"}}>Unnamed</span>}</b>
                      <div style={{fontSize:10.5, color:"var(--ink-3)", marginTop:2, fontFamily:"'JetBrains Mono',monospace"}}>{q.quoteRef}</div>
                    </td>
                    <td><span className={`pi-status-chip ${q.status}`}><span className="d"></span>{q.status}</span></td>
                    <td>
                      {q.createdBy ? (
                        <div className="pi-u">
                          <div className={`av ${u?.role || "sales"}`} style={{width:24, height:24, fontSize:9}}>
                            {u?.initials || (q.createdByName||"??").slice(0,2).toUpperCase()}
                          </div>
                          <div className="em">{q.createdByName || q.createdBy}</div>
                        </div>
                      ) : <span style={{color:"var(--ink-4)", fontSize:11}}>—</span>}
                    </td>
                    <td style={{fontSize:11.5, color:"var(--ink-3)"}}>{fmtDate(q.updatedAt)}</td>
                    <td className="num"><b>{WEUtil.fmt(q.total)}</b></td>
                    <td><button className="pi-open-btn" onClick={() => onOpenQuote && onOpenQuote(q.id)}>Open</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

window.InsightsAdminSection = InsightsAdminSection;
