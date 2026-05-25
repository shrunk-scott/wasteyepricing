// Portal Tender Library — searchable pre-approved tender responses with per-answer copy buttons.

const { useState: useStateT, useMemo: useMemoT, useRef: useRefT } = React;

function PortalTender({ tender }) {
  const [query, setQuery] = useStateT("");
  const [activeCat, setActiveCat] = useStateT("all");
  const [recentCopy, setRecentCopy] = useStateT(null); // answer id that was just copied
  const searchRef = useRefT(null);

  // Build a flat searchable index. Each entry = { catId, catLabel, catNum, q, answer }
  const allEntries = useMemoT(() => {
    const out = [];
    for (const cat of tender.categories) {
      for (const q of cat.questions) {
        for (const a of q.answers) {
          out.push({
            catId: cat.id, catLabel: cat.label, catNum: cat.num, catDesc: cat.desc,
            qId: q.id, question: q.question, tags: q.tags || [], note: q.note || null,
            answer: a,
          });
        }
      }
    }
    return out;
  }, [tender]);

  // Group results by question (so multiple-length answers stay together)
  const filtered = useMemoT(() => {
    const q = query.trim().toLowerCase();
    let pool = allEntries;
    if (activeCat !== "all") pool = pool.filter(e => e.catId === activeCat);
    if (!q) return pool;
    return pool.filter(e =>
      e.question.toLowerCase().includes(q) ||
      e.answer.text.toLowerCase().includes(q) ||
      e.tags.some(t => t.toLowerCase().includes(q)) ||
      e.catLabel.toLowerCase().includes(q)
    );
  }, [allEntries, query, activeCat]);

  // Group filtered into question buckets, preserving order
  const grouped = useMemoT(() => {
    const map = new Map();
    for (const e of filtered) {
      const key = e.catId + "::" + e.qId;
      if (!map.has(key)) {
        map.set(key, { catId: e.catId, catLabel: e.catLabel, catNum: e.catNum, qId: e.qId, question: e.question, note: e.note, tags: e.tags, answers: [] });
      }
      map.get(key).answers.push(e.answer);
    }
    return [...map.values()];
  }, [filtered]);

  // Category counts (always reflect *current search*, not active filter, so user can see where matches are)
  const catCounts = useMemoT(() => {
    const q = query.trim().toLowerCase();
    const counts = { all: 0 };
    for (const cat of tender.categories) counts[cat.id] = 0;
    for (const e of allEntries) {
      const matches = !q || e.question.toLowerCase().includes(q) ||
        e.answer.text.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q)) ||
        e.catLabel.toLowerCase().includes(q);
      if (matches) {
        counts.all++;
        counts[e.catId]++;
      }
    }
    return counts;
  }, [allEntries, query]);

  const totalQuestions = useMemoT(() => tender.categories.reduce((a, c) => a + c.questions.length, 0), [tender]);

  const copyText = async (text, answerKey) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed"; ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e2) {}
      document.body.removeChild(ta);
    }
    setRecentCopy(answerKey);
    setTimeout(() => setRecentCopy((cur) => cur === answerKey ? null : cur), 1800);
  };

  const highlight = (text, q) => {
    if (!q.trim()) return text;
    const lower = text.toLowerCase();
    const needle = q.trim().toLowerCase();
    const i = lower.indexOf(needle);
    if (i < 0) return text;
    return <>{text.slice(0, i)}<mark>{text.slice(i, i+needle.length)}</mark>{text.slice(i+needle.length)}</>;
  };

  const wordCount = (text) => text.trim().split(/\s+/).length;

  // Cmd/Ctrl-K focuses search
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setQuery("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const css = `
    .pt { display:grid; grid-template-columns:280px 1fr; min-height:calc(100vh - 60px); }
    .pt .serif { font-family:'Source Serif 4',serif; }
    .pt .mono { font-family:'JetBrains Mono',monospace; font-feature-settings:"tnum"; }

    /* ── LEFT RAIL — categories ── */
    .pt-rail {
      background:#fff;
      border-right:1px solid var(--hair);
      padding:24px 0;
      display:flex; flex-direction:column;
    }
    .pt-rail-h { padding:0 22px 16px; }
    .pt-rail-h .ttl { font-family:'Source Serif 4',serif; font-size:18px; font-weight:600; }
    .pt-rail-h .sub { font-size:12px; color:var(--ink-3); margin-top:3px; line-height:1.45; }
    .pt-rail-h .meta { font-size:11px; color:var(--ink-3); margin-top:8px; font-family:'JetBrains Mono',monospace; letter-spacing:0.04em; padding:4px 8px; background:var(--hair-3); border-radius:4px; display:inline-block; }

    .pt-section-h { padding:14px 22px 6px; font-size:10px; letter-spacing:0.16em; text-transform:uppercase; color:var(--ink-3); font-weight:700; }
    .pt-cats { display:flex; flex-direction:column; gap:1px; padding:0 12px; }
    .pt-cat {
      padding:9px 12px; background:transparent; border:none;
      font:inherit; font-size:13.5px; color:var(--ink-2);
      text-align:left; cursor:pointer; border-radius:6px;
      display:grid; grid-template-columns:auto 1fr auto; gap:10px; align-items:center;
    }
    .pt-cat .num { font-family:'JetBrains Mono',monospace; font-size:10.5px; color:var(--ink-4); padding:2px 6px; background:var(--hair-3); border-radius:3px; font-weight:600; }
    .pt-cat .lbl { line-height:1.3; }
    .pt-cat .cnt { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--ink-4); }
    .pt-cat:hover { background:var(--blue-tint); color:var(--blue-deep); }
    .pt-cat:hover .num, .pt-cat:hover .cnt { color:var(--blue-deep); }
    .pt-cat:hover .num { background:#fff; }
    .pt-cat.on { background:var(--ink); color:#fff; }
    .pt-cat.on .num { background:rgba(255,255,255,0.15); color:#fff; }
    .pt-cat.on .cnt { color:rgba(255,255,255,0.7); }
    .pt-cat.empty { opacity:0.4; }

    .pt-rail-foot { margin-top:auto; padding:14px 22px; border-top:1px solid var(--hair); }
    .pt-rail-foot .kbd-row { display:flex; gap:6px; align-items:center; font-size:11.5px; color:var(--ink-3); }
    .pt-rail-foot .kbd {
      font-family:'JetBrains Mono',monospace; font-size:10.5px;
      padding:2px 6px; background:var(--hair-3); border:1px solid var(--hair);
      border-radius:4px; color:var(--ink-2);
    }

    /* ── CONTENT ── */
    .pt-content { padding:24px 36px 36px; max-width:1480px; margin:0 auto; min-width:0; box-sizing:border-box; width:100%; }

    /* Hero */
    .pt-hero { display:flex; align-items:flex-end; justify-content:space-between; padding-bottom:18px; margin-bottom:18px; border-bottom:1px solid var(--hair); gap:24px; }
    .pt-hero-l .eyebrow { font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--blue-deep); font-weight:700; }
    .pt-hero-l h1 { font-family:'Source Serif 4',serif; font-size:30px; font-weight:600; letter-spacing:-0.01em; margin:6px 0 0; line-height:1.1; }
    .pt-hero-l p { font-size:14px; color:var(--ink-3); margin:6px 0 0; max-width:560px; line-height:1.5; }
    .pt-hero-r { display:flex; flex-direction:column; align-items:flex-end; gap:6px; font-size:11px; color:var(--ink-3); flex-shrink:0; }
    .pt-hero-r .pill {
      display:inline-flex; align-items:center; gap:6px;
      padding:5px 10px; background:var(--blue-tint); color:var(--blue-deep);
      border:1px solid var(--blue-tint); border-radius:14px;
      font-size:11px; letter-spacing:0.04em; font-weight:600;
    }
    .pt-hero-r .pill .d { width:5px; height:5px; background:currentColor; border-radius:50%; }
    .pt-hero-r .meta { font-family:'JetBrains Mono',monospace; }

    /* Search bar */
    .pt-search-bar {
      display:flex; align-items:center; gap:10px;
      padding:13px 16px;
      background:#fff;
      border:1.5px solid var(--hair); border-radius:10px;
      margin-bottom:16px;
      transition:border-color 0.15s, box-shadow 0.15s;
    }
    .pt-search-bar:focus-within { border-color:var(--blue); box-shadow:0 0 0 4px var(--blue-tint); }
    .pt-search-bar .sicon { width:18px; height:18px; color:var(--ink-3); flex-shrink:0; }
    .pt-search-bar input {
      flex:1; border:none; outline:none; background:transparent;
      font:inherit; font-size:15px; color:var(--ink);
      min-width:0;
    }
    .pt-search-bar input::placeholder { color:var(--ink-4); }
    .pt-search-bar .clear {
      background:transparent; border:none; cursor:pointer;
      color:var(--ink-3); font-size:18px; line-height:1; padding:2px 6px;
      border-radius:4px;
    }
    .pt-search-bar .clear:hover { background:var(--hair-3); color:var(--ink); }
    .pt-search-bar .shortcut {
      font-family:'JetBrains Mono',monospace; font-size:11px;
      padding:3px 8px; background:var(--hair-3); border:1px solid var(--hair);
      border-radius:5px; color:var(--ink-3);
    }

    /* Results bar */
    .pt-results-bar {
      display:flex; align-items:center; justify-content:space-between;
      padding:0 4px 14px;
      font-size:12.5px; color:var(--ink-3);
    }
    .pt-results-bar .count { font-weight:500; }
    .pt-results-bar .count b { color:var(--ink); font-weight:600; }
    .pt-results-bar .tag-row { display:flex; gap:6px; align-items:center; }

    /* Question card */
    .pt-q { background:#fff; border:1px solid var(--hair); border-radius:10px; margin-bottom:14px; overflow:hidden; }
    .pt-q-hd { padding:18px 24px 14px; border-bottom:1px solid var(--hair-2); }
    .pt-q-hd .cat-pill {
      display:inline-flex; align-items:center; gap:6px;
      padding:3px 9px; background:var(--blue-tint); color:var(--blue-deep);
      border-radius:4px; font-size:10.5px; font-weight:700; letter-spacing:0.06em;
      text-transform:uppercase; margin-bottom:8px;
    }
    .pt-q-hd .cat-pill .num { font-family:'JetBrains Mono',monospace; }
    .pt-q-hd h3 {
      font-family:'Source Serif 4',serif; font-size:20px; font-weight:600;
      letter-spacing:-0.005em; margin:0; line-height:1.25; color:var(--ink);
    }
    .pt-q-hd h3 mark { background:#FEF3C7; color:var(--ink); padding:0 2px; border-radius:2px; }
    .pt-q-tags { margin-top:10px; display:flex; gap:5px; flex-wrap:wrap; }
    .pt-q-tags .tag {
      font-size:10.5px; color:var(--ink-3);
      padding:2px 7px; background:var(--hair-3); border-radius:10px;
    }
    .pt-q-tags .tag mark { background:#FEF3C7; color:var(--ink); padding:0 1px; border-radius:2px; }

    .pt-q-note {
      margin:14px 24px 0;
      padding:10px 13px;
      background:var(--warn-bg); color:var(--warn);
      border-left:3px solid var(--warn); border-radius:0 4px 4px 0;
      font-size:12.5px; line-height:1.5;
      display:flex; gap:9px;
    }
    .pt-q-note .ic { width:16px; height:16px; flex-shrink:0; margin-top:1px; }

    /* Answer */
    .pt-a { padding:14px 24px 18px; border-top:1px solid var(--hair-2); }
    .pt-a:first-of-type { border-top:none; }
    .pt-a-hd { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px; }
    .pt-a-hd .left { display:flex; align-items:center; gap:10px; }
    .pt-a-hd .length-pill {
      font-size:10.5px; font-weight:700; letter-spacing:0.08em;
      text-transform:uppercase; color:var(--ink);
      padding:3px 9px; background:#fff; border:1px solid var(--ink);
      border-radius:4px;
    }
    .pt-a-hd .wc {
      font-family:'JetBrains Mono',monospace; font-size:11px;
      color:var(--ink-3);
    }
    .pt-a-hd .copy-btn {
      display:inline-flex; align-items:center; gap:6px;
      padding:7px 12px;
      background:#fff; color:var(--ink-2);
      border:1px solid var(--hair); border-radius:6px;
      font:inherit; font-size:12px; font-weight:600;
      cursor:pointer; transition:all 0.15s;
      letter-spacing:0.02em;
    }
    .pt-a-hd .copy-btn:hover {
      background:var(--blue); color:#fff; border-color:var(--blue);
    }
    .pt-a-hd .copy-btn svg { width:14px; height:14px; }
    .pt-a-hd .copy-btn.copied {
      background:var(--pos-bg); color:var(--pos); border-color:var(--pos);
    }
    .pt-a-hd .copy-btn.copied:hover {
      background:var(--pos-bg); color:var(--pos); border-color:var(--pos);
    }

    .pt-a-text {
      font-size:14px; line-height:1.6; color:var(--ink);
      white-space:pre-wrap;
      padding:12px 14px;
      background:var(--hair-3);
      border-radius:8px;
      border:1px solid var(--hair-2);
      font-family:'Source Sans 3',sans-serif;
    }
    .pt-a-text mark { background:#FEF3C7; color:var(--ink); padding:0 2px; border-radius:2px; }

    /* Empty state */
    .pt-empty {
      padding:60px 24px; text-align:center;
      color:var(--ink-3); font-size:14px;
      background:#fff; border:1px dashed var(--hair); border-radius:10px;
    }
    .pt-empty .ic { width:32px; height:32px; margin:0 auto 10px; color:var(--ink-4); }
    .pt-empty .ttl { font-family:'Source Serif 4',serif; font-size:18px; color:var(--ink); margin-bottom:4px; }
    .pt-empty .lnk {
      color:var(--blue-deep); cursor:pointer; text-decoration:underline;
      background:transparent; border:none; font:inherit; padding:0;
    }
  `;

  return (
    <div className="pt">
      <style>{css}</style>

      {/* LEFT RAIL */}
      <aside className="pt-rail">
        <div className="pt-rail-h">
          <div className="ttl serif">Tender library</div>
          <div className="sub">Pre-approved answers for tender questions, ready to copy into submission forms.</div>
          <div className="meta">v{tender.version} · {tender.issued}</div>
        </div>

        <div className="pt-section-h">Browse</div>
        <div className="pt-cats">
          <button className={`pt-cat ${activeCat==="all"?"on":""}`} onClick={() => setActiveCat("all")}>
            <span className="num">ALL</span>
            <span className="lbl">All categories</span>
            <span className="cnt">{catCounts.all || 0}</span>
          </button>
          {tender.categories.map((cat) => (
            <button key={cat.id} className={`pt-cat ${activeCat===cat.id?"on":""} ${catCounts[cat.id]===0 && query?"empty":""}`} onClick={() => setActiveCat(cat.id)}>
              <span className="num">{cat.num}</span>
              <span className="lbl">{cat.label}</span>
              <span className="cnt">{catCounts[cat.id] || 0}</span>
            </button>
          ))}
        </div>

        <div className="pt-rail-foot">
          <div className="kbd-row">
            <span className="kbd">⌘K</span>
            <span>Quick search</span>
          </div>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="pt-content">

        <div className="pt-hero">
          <div className="pt-hero-l">
            <div className="eyebrow">Sales · Tender support</div>
            <h1>Tender response library</h1>
            <p>Search across {totalQuestions} pre-approved answers. Copy any response straight into your tender submission form — answer lengths are sized to typical question boxes.</p>
          </div>
          <div className="pt-hero-r">
            <span className="pill"><span className="d"></span>Approved &amp; current</span>
            <span className="meta">{tender.categories.length} categories · {allEntries.length} response variants</span>
          </div>
        </div>

        {/* SEARCH */}
        <div className="pt-search-bar">
          <svg className="sicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions, keywords or answer text — try 'privacy', 'iso', 'payment'…"
          />
          {query && (
            <button className="clear" onClick={() => setQuery("")} title="Clear search">×</button>
          )}
          <span className="shortcut">⌘K</span>
        </div>

        <div className="pt-results-bar">
          <span className="count">
            {grouped.length === 0 ? (
              <>No matches</>
            ) : (
              <><b>{grouped.length}</b> question{grouped.length===1?"":"s"} · <b>{filtered.length}</b> response variant{filtered.length===1?"":"s"}{query && <> matching <b>"{query}"</b></>}{activeCat !== "all" && <> in <b>{tender.categories.find(c=>c.id===activeCat)?.label}</b></>}</>
            )}
          </span>
          {(query || activeCat !== "all") && (
            <button className="pt-empty lnk" style={{padding:0, background:"transparent", border:"none"}}
                    onClick={() => { setQuery(""); setActiveCat("all"); }}>
              Clear filters
            </button>
          )}
        </div>

        {/* RESULTS */}
        {grouped.length === 0 ? (
          <div className="pt-empty">
            <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <div className="ttl">Nothing matches "{query}"</div>
            <div>Try a broader keyword, or <button className="lnk" onClick={() => { setQuery(""); setActiveCat("all"); }}>clear filters</button> to see everything.</div>
          </div>
        ) : (
          grouped.map((g, gIdx) => (
            <div key={g.catId + g.qId + gIdx} className="pt-q">
              <div className="pt-q-hd">
                <div className="cat-pill">
                  <span className="num">{g.catNum}</span>
                  <span>{g.catLabel}</span>
                </div>
                <h3>{highlight(g.question, query)}</h3>
                {g.tags && g.tags.length > 0 && (
                  <div className="pt-q-tags">
                    {g.tags.map((t, i) => (
                      <span key={i} className="tag">{highlight(t, query)}</span>
                    ))}
                  </div>
                )}
              </div>
              {g.note && (
                <div className="pt-q-note">
                  <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>
                  <div><b>Partner note:</b> {g.note}</div>
                </div>
              )}
              {g.answers.map((a, aIdx) => {
                const key = `${g.catId}/${g.qId}/${a.id}`;
                const isCopied = recentCopy === key;
                return (
                  <div key={a.id + aIdx} className="pt-a">
                    <div className="pt-a-hd">
                      <div className="left">
                        <span className="length-pill">{a.length}</span>
                        <span className="wc">{wordCount(a.text)} words · {a.text.length} chars</span>
                      </div>
                      <button className={`copy-btn ${isCopied?"copied":""}`} onClick={() => copyText(a.text, key)}>
                        {isCopied ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7"/></svg>
                            Copied
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="pt-a-text">{highlight(a.text, query)}</div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </main>
    </div>
  );
}

window.PortalTender = PortalTender;
