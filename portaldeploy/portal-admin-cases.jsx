// Portal Admin — Case Studies section.
// Each case study: id, title, client, sector, summary, results, dataUrl (optional image),
// link (optional), tags, addedAt, addedBy.

function CaseStudiesAdminSection({ tables, setTables, session }) {
  const studies = tables.caseStudies || [];
  const [openId, setOpenId] = React.useState(null); // expanded card
  const [error, setError] = React.useState(null);
  const [query, setQuery] = React.useState("");
  const [filterSector, setFilterSector] = React.useState("all");

  const setStudies = (next) => setTables({ ...tables, caseStudies: next });

  const SECTORS = ["healthcare", "education", "commercial", "logistics", "manufacturing", "retail", "government", "other"];

  const addStudy = () => {
    const newS = {
      id: "cs_" + Date.now().toString(36) + "_" + Math.floor(Math.random()*1000).toString(36),
      title: "New case study",
      client: "",
      sector: "commercial",
      summary: "",
      results: "",
      dataUrl: "",
      link: "",
      tags: "",
      featured: false,
      addedAt: Date.now(),
      addedBy: session?.email || "",
    };
    setStudies([newS, ...studies]);
    setOpenId(newS.id);
  };

  const updStudy = (id, patch) =>
    setStudies(studies.map(s => s.id === id ? { ...s, ...patch } : s));

  const removeStudy = (id) => {
    const s = studies.find(x => x.id === id);
    if (!s) return;
    window.appConfirm({
      title: "Remove case study",
      message: `Remove the case study "${s.title}"? Any quotes attached to it will lose the link.`,
      confirmLabel: "Remove",
      destructive: true,
    }, () => setStudies(studies.filter(x => x.id !== id)));
  };

  const compressImage = (file, maxDim = 1000, quality = 0.78) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim/width, maxDim/height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => reject(new Error("Couldn't read image"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Couldn't read file"));
      reader.readAsDataURL(file);
    });

  const onImage = async (id, file) => {
    if (!file) return;
    setError(null);
    if (file.size > 8 * 1024 * 1024) {
      setError("Image too large — max 8MB.");
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      updStudy(id, { dataUrl });
    } catch (e) {
      setError(e.message || "Image upload failed.");
    }
  };

  const q = query.trim().toLowerCase();
  const filtered = studies.filter(s => {
    if (filterSector !== "all" && s.sector !== filterSector) return false;
    if (!q) return true;
    return (s.title||"").toLowerCase().includes(q)
        || (s.client||"").toLowerCase().includes(q)
        || (s.summary||"").toLowerCase().includes(q)
        || (s.results||"").toLowerCase().includes(q)
        || (s.tags||"").toLowerCase().includes(q);
  });

  const sectorCounts = SECTORS.reduce((a, s) => { a[s] = studies.filter(x => x.sector === s).length; return a; }, { all: studies.length });

  const css = `
    .pcs-toolbar { display:flex; align-items:center; gap:12px; margin-bottom:14px; flex-wrap:wrap; }
    .pcs-search { flex:1; min-width:240px; display:flex; align-items:center; gap:9px; padding:10px 14px; background:#fff; border:1.5px solid var(--hair); border-radius:8px; }
    .pcs-search:focus-within { border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }
    .pcs-search svg { width:16px; height:16px; color:var(--ink-3); flex-shrink:0; }
    .pcs-search input { flex:1; border:none; outline:none; background:transparent; font:inherit; font-size:14px; color:var(--ink); min-width:0; }
    .pcs-search input::placeholder { color:var(--ink-4); }
    .pcs-search .clear { background:transparent; border:none; cursor:pointer; color:var(--ink-3); font-size:16px; padding:2px 4px; }

    .pcs-sector-select {
      padding:9px 12px; border:1px solid var(--hair); border-radius:8px;
      font:inherit; font-size:13px; color:var(--ink); background:#fff;
      cursor:pointer; outline:none; min-width:200px;
    }
    .pcs-sector-select:focus { border-color:var(--blue); }

    .pcs-add { padding:10px 16px; background:var(--ink); color:#fff; border:none; border-radius:8px; font:inherit; font-size:12.5px; font-weight:600; letter-spacing:0.03em; cursor:pointer; display:inline-flex; align-items:center; gap:7px; }
    .pcs-add:hover { background:var(--blue-deep); }
    .pcs-add svg { width:14px; height:14px; }

    .pcs-err { padding:10px 14px; background:#FEF2F2; color:#991B1B; border:1px solid #FCA5A5; border-radius:7px; font-size:13px; margin-bottom:14px; }

    .pcs-meta-row {
      display:flex; gap:14px; align-items:center; margin-bottom:14px;
      font-size:12.5px; color:var(--ink-3);
    }
    .pcs-meta-row b { color:var(--ink); }

    .pcs-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(380px, 1fr)); gap:14px; }
    .pcs-card { background:#fff; border:1px solid var(--hair); border-radius:10px; overflow:hidden; transition:all 0.15s; }
    .pcs-card:hover { border-color:var(--ink-4); }

    .pcs-card-h { display:grid; grid-template-columns:auto 1fr auto auto; gap:12px; align-items:center; padding:14px 16px; cursor:pointer; }
    .pcs-card-h:hover { background:var(--hair-3); }
    .pcs-card-h .num { font-family:'JetBrains Mono',monospace; font-size:11px; padding:3px 8px; background:var(--blue-tint); color:var(--blue-deep); border-radius:4px; font-weight:600; }
    .pcs-card-h .ttl-block { min-width:0; }
    .pcs-card-h .ttl-block .ttl { font-family:'Source Serif 4',serif; font-size:16px; font-weight:600; color:var(--ink); line-height:1.3; }
    .pcs-card-h .ttl-block .sub { font-size:11.5px; color:var(--ink-3); margin-top:2px; }
    .pcs-card-h .sector-pill { font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:3px 8px; border-radius:9px; background:var(--hair-3); color:var(--ink-2); }
    .pcs-card-h .chev { color:var(--ink-3); font-size:13px; }

    .pcs-card-body { padding:14px 16px; border-top:1px solid var(--hair-2); display:flex; flex-direction:column; gap:12px; }

    .pcs-field { display:flex; flex-direction:column; gap:5px; }
    .pcs-field > label { font-size:10px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); font-weight:700; }
    .pcs-field input, .pcs-field textarea, .pcs-field select {
      width:100%; box-sizing:border-box;
      padding:8px 11px;
      border:1px solid transparent; background:var(--hair-3);
      font:inherit; font-size:13px; color:var(--ink);
      border-radius:6px; outline:none; font-family:'Source Sans 3',sans-serif;
      resize:vertical;
    }
    .pcs-field input:focus, .pcs-field textarea:focus, .pcs-field select:focus { background:#fff; border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }
    .pcs-field textarea { min-height:60px; line-height:1.5; }
    .pcs-field input.title-input { font-size:16px; font-weight:600; font-family:'Source Serif 4',serif; }

    .pcs-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .pcs-row.three { grid-template-columns:1fr 1fr 1fr; }

    .pcs-image-block { display:flex; gap:14px; align-items:flex-start; }
    .pcs-image-preview {
      width:140px; height:90px; flex-shrink:0;
      background:var(--hair-3); border:1px solid var(--hair); border-radius:7px;
      overflow:hidden; display:grid; place-items:center;
      color:var(--ink-4); font-size:11px;
    }
    .pcs-image-preview img { width:100%; height:100%; object-fit:cover; display:block; }
    .pcs-image-actions { display:flex; flex-direction:column; gap:6px; flex:1; }
    .pcs-image-actions label.upload {
      padding:7px 12px; background:#fff; color:var(--blue-deep);
      border:1px solid var(--blue); border-radius:5px;
      font:inherit; font-size:12px; font-weight:600;
      cursor:pointer; display:inline-flex; align-items:center; gap:6px;
      width:fit-content;
    }
    .pcs-image-actions label.upload:hover { background:var(--blue-tint); }
    .pcs-image-actions label.upload input { display:none; }
    .pcs-image-actions button.rm-img {
      padding:7px 12px; background:transparent; color:var(--neg);
      border:1px solid #FCA5A5; border-radius:5px;
      font:inherit; font-size:12px; cursor:pointer; width:fit-content;
    }
    .pcs-image-actions button.rm-img:hover { background:#FEF2F2; }
    .pcs-image-actions .help { font-size:11px; color:var(--ink-3); line-height:1.4; margin-top:4px; }

    .pcs-card-foot {
      padding:10px 16px; background:var(--hair-3); border-top:1px solid var(--hair-2);
      display:flex; align-items:center; justify-content:space-between;
      font-size:11px; color:var(--ink-3);
    }
    .pcs-card-foot .meta { font-family:'JetBrains Mono',monospace; }
    .pcs-card-foot button.delete {
      padding:6px 11px; background:transparent; color:var(--neg);
      border:1px solid #FCA5A5; border-radius:5px;
      font:inherit; font-size:11.5px; font-weight:600;
      cursor:pointer; display:inline-flex; align-items:center; gap:5px;
    }
    .pcs-card-foot button.delete:hover { background:#FEF2F2; }
    .pcs-card-foot button.delete svg { width:12px; height:12px; }

    .pcs-card-foot label.feat {
      display:inline-flex; align-items:center; gap:6px; cursor:pointer;
      font-size:11.5px; color:var(--ink-2); font-weight:500;
    }
    .pcs-card-foot label.feat input { accent-color:var(--blue); cursor:pointer; }

    .pcs-empty {
      padding:40px 20px; text-align:center;
      background:#fff; border:1px dashed var(--hair); border-radius:10px;
      color:var(--ink-3); font-size:13.5px;
    }
    .pcs-empty .ttl { font-family:'Source Serif 4',serif; font-size:18px; color:var(--ink); margin-bottom:6px; }
    .pcs-empty button.pcs-add { margin-top:14px; }
  `;

  return (
    <div>
      <style>{css}</style>

      <div className="pcs-toolbar">
        <div className="pcs-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search case studies, clients, results…" />
          {query && <button className="clear" onClick={() => setQuery("")}>×</button>}
        </div>
        <select className="pcs-sector-select" value={filterSector} onChange={(e) => setFilterSector(e.target.value)}>
          <option value="all">All sectors ({sectorCounts.all})</option>
          {SECTORS.map(s => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({sectorCounts[s] || 0})
            </option>
          ))}
        </select>
        <button className="pcs-add" onClick={addStudy}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
          New case study
        </button>
      </div>

      {error && <div className="pcs-err">{error}</div>}

      <div className="pcs-meta-row">
        <span><b>{filtered.length}</b> of {studies.length} case stud{studies.length===1?"y":"ies"} shown</span>
        <span>·</span>
        <span><b>{studies.filter(s => s.featured).length}</b> featured</span>
      </div>

      {filtered.length === 0 ? (
        <div className="pcs-empty">
          <div className="ttl">{studies.length === 0 ? "No case studies yet" : "No matches"}</div>
          <div>{studies.length === 0 ? "Add your first case study so reps can attach client wins to their quotes." : "Try clearing the search or sector filter."}</div>
          {studies.length === 0 && (
            <button className="pcs-add" onClick={addStudy}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
              Add your first case study
            </button>
          )}
        </div>
      ) : (
        <div className="pcs-grid">
          {filtered.map((s, i) => {
            const open = openId === s.id;
            return (
              <div className="pcs-card" key={s.id}>
                <div className="pcs-card-h" onClick={() => setOpenId(open ? null : s.id)}>
                  <span className="num">{String(i+1).padStart(2,"0")}</span>
                  <div className="ttl-block">
                    <div className="ttl">{s.title || "Untitled case study"}</div>
                    <div className="sub">{s.client || "—"}</div>
                  </div>
                  <span className="sector-pill">{s.sector}</span>
                  <span className="chev">{open ? "▾" : "▸"}</span>
                </div>

                {open && (
                  <div className="pcs-card-body">
                    <div className="pcs-field">
                      <label>Title</label>
                      <input className="title-input" value={s.title} onChange={(e) => updStudy(s.id, { title: e.target.value })} />
                    </div>

                    <div className="pcs-row three">
                      <div className="pcs-field">
                        <label>Client</label>
                        <input value={s.client} onChange={(e) => updStudy(s.id, { client: e.target.value })} placeholder="e.g. Eastern Health" />
                      </div>
                      <div className="pcs-field">
                        <label>Sector</label>
                        <select value={s.sector} onChange={(e) => updStudy(s.id, { sector: e.target.value })}>
                          {SECTORS.map(sec => <option key={sec} value={sec}>{sec.charAt(0).toUpperCase() + sec.slice(1)}</option>)}
                        </select>
                      </div>
                      <div className="pcs-field">
                        <label>Tags</label>
                        <input value={s.tags} onChange={(e) => updStudy(s.id, { tags: e.target.value })} placeholder="comma, separated, tags" style={{fontFamily:"'JetBrains Mono',monospace", fontSize:12}} />
                      </div>
                    </div>

                    <div className="pcs-field">
                      <label>Summary · the challenge</label>
                      <textarea value={s.summary} onChange={(e) => updStudy(s.id, { summary: e.target.value })} placeholder="What problem did the client need solved?" />
                    </div>

                    <div className="pcs-field">
                      <label>Results &amp; outcomes</label>
                      <textarea value={s.results} onChange={(e) => updStudy(s.id, { results: e.target.value })} placeholder="Key outcomes, metrics, savings, behavioural changes…" />
                    </div>

                    <div className="pcs-field">
                      <label>External link (PDF, blog, etc.)</label>
                      <input value={s.link} onChange={(e) => updStudy(s.id, { link: e.target.value })} placeholder="https://…" style={{fontFamily:"'JetBrains Mono',monospace", fontSize:12}} />
                    </div>

                    <div className="pcs-field">
                      <label>Cover image</label>
                      <div className="pcs-image-block">
                        <div className="pcs-image-preview">
                          {s.dataUrl ? <img src={s.dataUrl} alt={s.title} /> : <span>No image</span>}
                        </div>
                        <div className="pcs-image-actions">
                          <label className="upload">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                            {s.dataUrl ? "Replace image" : "Upload image"}
                            <input type="file" accept="image/*" onChange={(e) => { onImage(s.id, e.target.files[0]); e.target.value=""; }} />
                          </label>
                          {s.dataUrl && (
                            <button className="rm-img" onClick={() => updStudy(s.id, { dataUrl: "" })}>Remove image</button>
                          )}
                          <div className="help">JPEG / PNG / WebP up to 8MB · auto-resized to 1000px.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pcs-card-foot">
                  <label className="feat">
                    <input type="checkbox" checked={!!s.featured} onChange={(e) => updStudy(s.id, { featured: e.target.checked })} />
                    Featured · pin to top of picker
                  </label>
                  <span className="meta">
                    Added {new Date(s.addedAt).toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"2-digit"})}
                  </span>
                  <button className="delete" onClick={(e) => { e.stopPropagation(); removeStudy(s.id); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

window.CaseStudiesAdminSection = CaseStudiesAdminSection;
