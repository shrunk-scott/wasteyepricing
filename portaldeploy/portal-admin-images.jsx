// Portal Admin — Product Images section (image library for quotes)
// Loaded after portal-admin.jsx. Exposes ProductImagesAdminSection to window.

function ProductImagesAdminSection({ tables, setTables, session }) {
  const images = tables.productImages || [];
  const [dragOver, setDragOver] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const useDrive = !!(window.WEBackend && window.WEBackend.getUrl());

  const setImages = (next) => setTables({ ...tables, productImages: next });

  const compressImage = (file, maxDim = 1200, quality = 0.8) =>
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
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => reject(new Error("Couldn't read image"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Couldn't read file"));
      reader.readAsDataURL(file);
    });

  const addFiles = async (files) => {
    setError(null);
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (arr.length === 0) { setError("No image files selected."); return; }
    setUploading(true);
    try {
      const added = [];
      for (const f of arr) {
        if (f.size > 8 * 1024 * 1024) {
          setError(`"${f.name}" is too large (${(f.size/1024/1024).toFixed(1)}MB). Max 8MB per image.`);
          continue;
        }
        const dataUrl = await compressImage(f);
        const base64 = dataUrl.split(",")[1] || dataUrl;
        let img = {
          id: "img_" + Date.now().toString(36) + "_" + Math.floor(Math.random()*1000).toString(36),
          name: f.name.replace(/\.[^.]+$/, "") || "Untitled",
          description: "",
          tags: "",
          dataUrl,
          addedAt: Date.now(),
          addedBy: session?.email || "",
        };
        if (useDrive) {
          try {
            const filename = (f.name.replace(/\.[^.]+$/, "") || "image") + "-" + Date.now() + ".jpg";
            const driveImg = await window.WEBackend.uploadDriveImage(filename, "image/jpeg", base64);
            img.driveFileId = driveImg.id;
            img.driveUrl = driveImg.url;
            img.thumbnailUrl = driveImg.thumbnailUrl;
            img.dataUrl = driveImg.thumbnailUrl; // Use the Drive thumbnail as the display source
          } catch (uErr) {
            console.error("Drive upload failed, keeping local copy:", uErr);
            setError(`Drive upload failed for "${f.name}" (${uErr.message}). Image saved locally instead.`);
          }
        }
        added.push(img);
      }
      setImages([...added, ...images]);
    } catch (e) {
      setError(e.message || "Image upload failed.");
    }
    setUploading(false);
  };

  const onFileInput = (e) => { addFiles(e.target.files); e.target.value = ""; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const updImage = (id, patch) =>
    setImages(images.map(img => img.id === id ? { ...img, ...patch } : img));
  const removeImage = (id) => {
    const img = images.find(x => x.id === id);
    if (!img) return;
    window.appConfirm({
      title: "Remove image",
      message: img.driveFileId
        ? `Remove "${img.name}"? The file will be moved to Drive trash and any quotes attached to it will lose the image.`
        : `Remove "${img.name}" from the product library? Any quotes attached to it will lose the image.`,
      confirmLabel: "Remove",
      destructive: true,
    }, async () => {
      if (img.driveFileId && useDrive) {
        try { await window.WEBackend.deleteDriveImage(img.driveFileId); }
        catch (e) { console.warn("Drive delete failed (file may already be trashed):", e.message); }
      }
      setImages(images.filter(x => x.id !== id));
    });
  };

  const migrateLocalToDrive = async () => {
    if (!useDrive) { setError("Backend not connected — can't migrate."); return; }
    // Local = anything not already in Drive (no driveFileId)
    const localOnly = images.filter(img => !img.driveFileId);
    if (localOnly.length === 0) { setError("No local-only images to migrate. All images are already in Drive."); return; }
    setError(null);
    setUploading(true);
    let migrated = 0;
    let failed = 0;
    const updates = [...images];

    const toBase64 = async (img) => {
      // If it's already a data URL, just strip the prefix
      if ((img.dataUrl||"").startsWith("data:")) {
        return img.dataUrl.split(",")[1] || "";
      }
      // Otherwise fetch it (handles relative paths like assets/products/...)
      const res = await fetch(img.dataUrl);
      if (!res.ok) throw new Error("HTTP " + res.status + " fetching " + img.dataUrl);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1] || "");
        r.onerror = () => reject(new Error("Couldn't read image blob"));
        r.readAsDataURL(blob);
      });
    };

    for (let i = 0; i < updates.length; i++) {
      const img = updates[i];
      if (img.driveFileId) continue;
      try {
        const base64 = await toBase64(img);
        if (!base64) throw new Error("Empty image data");
        const filename = (img.name || "image").replace(/[^A-Za-z0-9_-]+/g, "-").slice(0, 60) + "-" + Date.now() + ".jpg";
        const driveImg = await window.WEBackend.uploadDriveImage(filename, "image/jpeg", base64);
        updates[i] = {
          ...img,
          driveFileId: driveImg.id,
          driveUrl: driveImg.url,
          thumbnailUrl: driveImg.thumbnailUrl,
          dataUrl: driveImg.thumbnailUrl,
        };
        migrated++;
        setImages([...updates]); // progressive update so user can see progress
      } catch (e) {
        console.error("Migrate failed for", img.name, e);
        failed++;
      }
    }
    setUploading(false);
    if (migrated === 0) {
      setError(`Migration failed — none of the ${localOnly.length} local image${localOnly.length===1?"":"s"} uploaded. Check the browser console and Apps Script logs.`);
    } else if (failed > 0) {
      setError(`${migrated} migrated, ${failed} failed. Check the browser console for the failed names.`);
    }
  };

  const refreshFromDrive = async () => {
    if (!useDrive) return;
    setError(null);
    setUploading(true);
    try {
      const driveImages = await window.WEBackend.listDriveImages();
      const driveById = {};
      driveImages.forEach(d => { driveById[d.id] = d; });
      // Merge: keep portal records that match a Drive file, add anything new from Drive, drop records whose Drive file is gone.
      const merged = [];
      const knownIds = new Set();
      for (const img of images) {
        if (img.driveFileId && driveById[img.driveFileId]) {
          merged.push({ ...img, driveUrl: driveById[img.driveFileId].url, thumbnailUrl: driveById[img.driveFileId].thumbnailUrl, dataUrl: driveById[img.driveFileId].thumbnailUrl });
          knownIds.add(img.driveFileId);
        } else if (!img.driveFileId) {
          // Local-only image — keep as-is
          merged.push(img);
        }
      }
      for (const d of driveImages) {
        if (knownIds.has(d.id)) continue;
        merged.push({
          id: "img_drv_" + d.id,
          name: d.name.replace(/\.[^.]+$/, ""),
          description: "",
          tags: "",
          driveFileId: d.id,
          driveUrl: d.url,
          thumbnailUrl: d.thumbnailUrl,
          dataUrl: d.thumbnailUrl,
          addedAt: d.addedAt,
          addedBy: "",
        });
      }
      // Sort by addedAt desc
      merged.sort((a,b) => (b.addedAt||0) - (a.addedAt||0));
      setImages(merged);
    } catch (e) {
      setError("Couldn't refresh from Drive: " + e.message);
    }
    setUploading(false);
  };

  React.useEffect(() => {
    // Auto-refresh from Drive on first mount if backend is configured
    if (useDrive && images.length === 0) refreshFromDrive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSize = images.reduce((a,b) => a + (b.dataUrl||"").length, 0);

  const css = `
    .pim-drop {
      border:2px dashed var(--hair);
      border-radius:12px;
      padding:36px 24px;
      text-align:center;
      background:#fff;
      cursor:pointer;
      transition:all 0.15s;
      margin-bottom:18px;
    }
    .pim-drop:hover { border-color:var(--blue); background:var(--blue-tint); }
    .pim-drop.over { border-color:var(--blue); background:var(--blue-tint); transform:scale(1.005); }
    .pim-drop svg { width:36px; height:36px; color:var(--blue); margin-bottom:10px; }
    .pim-drop .t { font-size:15px; font-weight:600; color:var(--ink); margin-bottom:4px; }
    .pim-drop .s { font-size:12.5px; color:var(--ink-3); }
    .pim-drop input { display:none; }

    .pim-err {
      padding:10px 14px;
      background:#FEF2F2; color:#991B1B;
      border:1px solid #FCA5A5; border-radius:7px;
      font-size:13px; margin-bottom:14px;
    }

    .pim-stat-bar {
      display:flex; gap:14px; align-items:center;
      margin-bottom:14px;
      font-size:12.5px; color:var(--ink-3);
    }
    .pim-stat-bar b { color:var(--ink); }

    .pim-grid {
      display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));
      gap:16px;
    }
    .pim-card {
      background:#fff; border:1px solid var(--hair); border-radius:10px;
      overflow:hidden; display:flex; flex-direction:column;
    }
    .pim-thumb {
      aspect-ratio: 4 / 3;
      background:var(--hair-3);
      display:grid; place-items:center;
      overflow:hidden;
    }
    .pim-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
    .pim-body { padding:12px 14px; display:flex; flex-direction:column; gap:7px; flex:1; }
    .pim-body input, .pim-body textarea {
      width:100%; box-sizing:border-box;
      padding:7px 9px;
      border:1px solid transparent; background:var(--hair-3);
      font:inherit; font-size:13px; color:var(--ink);
      border-radius:5px; outline:none;
      font-family:'Source Sans 3', sans-serif;
      resize:vertical;
    }
    .pim-body input:focus, .pim-body textarea:focus { background:#fff; border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }
    .pim-body .name-input { font-weight:600; font-size:14px; }
    .pim-body .desc { min-height:42px; }
    .pim-meta {
      padding:8px 14px;
      border-top:1px solid var(--hair-2);
      display:flex; align-items:center; justify-content:space-between;
      gap:8px;
      font-size:11px; color:var(--ink-3);
    }
    .pim-meta .by { font-family:'JetBrains Mono',monospace; font-size:10.5px; }
    .pim-meta button {
      background:transparent; border:1px solid var(--hair-2);
      border-radius:5px; padding:5px 9px;
      font:inherit; font-size:11px; font-weight:600;
      color:var(--ink-3); cursor:pointer;
      display:inline-flex; align-items:center; gap:4px;
    }
    .pim-meta button:hover { background:#FEF2F2; color:var(--neg); border-color:#FCA5A5; }
    .pim-meta button svg { width:12px; height:12px; }

    .pim-empty {
      padding:40px 20px; text-align:center;
      background:#fff; border:1px dashed var(--hair); border-radius:10px;
      color:var(--ink-3); font-size:13px;
    }
  `;

  return (
    <div>
      <style>{css}</style>

      <div
        className={`pim-drop ${dragOver?"over":""}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
        <div className="t">Drop product images here, or click to upload</div>
        <div className="s">JPEG / PNG / WebP · up to 8MB each · auto-resized to 1200px max{useDrive ? " · stored in Google Drive" : ""}</div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onFileInput} disabled={uploading} />
      </div>

      {error && <div className="pim-err">{error}</div>}

      <div className="pim-stat-bar">
        <span><b>{images.length}</b> image{images.length===1?"":"s"} in library</span>
        <span>·</span>
        {useDrive ? (
          <>
            <span style={{display:"inline-flex", alignItems:"center", gap:6, color:"var(--blue-deep)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14, height:14}}><path d="M12 2v6m0 0l-3-3m3 3l3-3M5 14l3 7h8l3-7-7-12-7 12z"/></svg>
              <b>Google Drive</b>
            </span>
            <span style={{color:"var(--ink-3)"}}>· {images.filter(i => i.driveFileId).length} in Drive, {images.filter(i => !i.driveFileId).length} local-only</span>
            <span style={{flex:1}}></span>
            <button onClick={migrateLocalToDrive} disabled={uploading || images.filter(i => !i.driveFileId).length === 0} style={{padding:"4px 10px", background:"#fff", border:"1px solid var(--hair)", borderRadius:5, font:"inherit", fontSize:11.5, fontWeight:600, color:"var(--ink-2)", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:5}} title="Upload all local images (including seeded ones) to Google Drive">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:12, height:12}}><path d="M12 3v12M7 8l5-5 5 5M5 21h14"/></svg>
              Migrate local to Drive
            </button>
            <button onClick={refreshFromDrive} disabled={uploading} style={{padding:"4px 10px", background:"#fff", border:"1px solid var(--hair)", borderRadius:5, font:"inherit", fontSize:11.5, fontWeight:600, color:"var(--ink-2)", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:5}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:12, height:12}}><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/></svg>
              {uploading ? "Refreshing…" : "Refresh from Drive"}
            </button>
          </>
        ) : (
          <span><b>{(totalSize/1024/1024).toFixed(2)} MB</b> stored locally</span>
        )}
      </div>

      {images.length === 0 ? (
        <div className="pim-empty">No product images yet. Upload one above to get started — reps can attach these to their quotes.</div>
      ) : (
        <div className="pim-grid">
          {images.map((img) => (
            <div className="pim-card" key={img.id}>
              <div className="pim-thumb">
                <img src={img.dataUrl} alt={img.name} />
              </div>
              <div className="pim-body">
                <input className="name-input" value={img.name} onChange={(e) => updImage(img.id, { name: e.target.value })} placeholder="Image name" />
                <textarea className="desc" value={img.description} onChange={(e) => updImage(img.id, { description: e.target.value })} placeholder="Short description (visible to reps when picking images)" rows={2} />
                <input value={img.tags || ""} onChange={(e) => updImage(img.id, { tags: e.target.value })} placeholder="Tags (comma-separated)" style={{fontSize:11.5, fontFamily:"'JetBrains Mono',monospace"}} />
              </div>
              <div className="pim-meta">
                <span className="by">Added {new Date(img.addedAt).toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"2-digit"})}{img.addedBy ? ` · ${img.addedBy}` : ""}</span>
                <button onClick={() => removeImage(img.id)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.ProductImagesAdminSection = ProductImagesAdminSection;
