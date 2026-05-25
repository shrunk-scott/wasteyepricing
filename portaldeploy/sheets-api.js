// Google Sheets backend API client.
// Reads/writes via a configured Apps Script web-app endpoint.
// Falls back gracefully if no URL is configured — caller decides what to do.
//
// Endpoint URL is stored at:  localStorage["wep-backend-url"]
// Auto-sync flag at:           localStorage["wep-backend-autosync"]  (truthy/falsy)

(function () {
  const URL_KEY = "wep-backend-url";
  const AUTO_KEY = "wep-backend-autosync";

  function getUrl() {
    try { return (localStorage.getItem(URL_KEY) || "").trim() || null; } catch (e) { return null; }
  }
  function setUrl(url) {
    try {
      if (url) localStorage.setItem(URL_KEY, url.trim());
      else     localStorage.removeItem(URL_KEY);
    } catch (e) {}
  }
  function getAutoSync() {
    try { return localStorage.getItem(AUTO_KEY) === "1"; } catch (e) { return false; }
  }
  function setAutoSync(on) {
    try { localStorage.setItem(AUTO_KEY, on ? "1" : "0"); } catch (e) {}
  }

  async function get(op, params = {}) {
    const url = getUrl();
    if (!url) throw new Error("Backend not configured.");
    const qs = new URLSearchParams({ op, ...params }).toString();
    const res = await fetch(url + "?" + qs, { method: "GET", redirect: "follow" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const body = await res.json();
    if (!body.ok) throw new Error(body.error || "Backend error");
    return body;
  }

  async function post(op, payload = {}) {
    const url = getUrl();
    if (!url) throw new Error("Backend not configured.");
    // Apps Script handles JSON bodies via e.postData.contents.
    // We send Content-Type: text/plain to avoid CORS preflight (Apps Script doesn't OPTIONS).
    const res = await fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ op, ...payload }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const body = await res.json();
    if (!body.ok) throw new Error(body.error || "Backend error");
    return body;
  }

  // High-level operations — return promises.
  function ping()             { return get("ping"); }
  function pull()             { return get("pull").then(r => r.data); }
  function pullTab(tab)       { return get("pullTab", { tab }).then(r => r.rows); }
  function pushAll(data)      { return post("push", { data }); }
  function pushTab(tab, rows) { return post("pushTab", { tab, rows }); }
  function logAction(entry)   { return post("log", { entry }); }

  // ── Drive-backed product images ──
  function listDriveImages()         { return get("listImages").then(r => r.images || []); }
  function uploadDriveImage(name, mime, dataBase64) { return post("uploadImage", { name, mime, dataBase64 }).then(r => r.image); }
  function deleteDriveImage(fileId)  { return post("deleteImage", { fileId }); }
  function sendQuoteEmail(opts)      { return post("sendEmail", opts).then(r => r.sentAt); }

  // Flatten portal state into the row-shape the backend expects.
function flattenForSheet({ tables, tender, quotes, users, activityLog }) {
    const flatTender = [];
    if (tender && tender.categories) {
      for (const cat of tender.categories) {
        for (const q of (cat.questions || [])) {
          for (const a of (q.answers || [])) {
            flatTender.push({
              catId: cat.id, catNum: cat.num, catLabel: cat.label, catDesc: cat.desc || "",
              qId: q.id, question: q.question, tags: (q.tags||[]).join(", "), note: q.note || "",
              answerId: a.id, answerLength: a.length, answerText: a.text,
            });
          }
        }
      }
    }
    const settings = [];
    if (tables && tables.settings) {
      for (const k of Object.keys(tables.settings)) {
        settings.push({ key: k, value: String(tables.settings[k]) });
      }
    }
    const addonsRows = [];
    if (tables && tables.addons) {
      for (const id of Object.keys(tables.addons)) {
        const a = tables.addons[id];
        addonsRows.push({ id, label: a.label, unit: a.unit, price: a.price });
      }
    }
    return {
      quotes:        (quotes || []).map(q => ({ ...q, sites: undefined, input: undefined, sites_json: q.input?.sites || [], input_json: q.input || {} })),
      users:         users || [],
      pricingBands:  (tables && tables.bands) || [],
      pricingTiers:  (tables && tables.tiers) || [],
      mobilisation:  (tables && tables.mob) || [],
      addons:        addonsRows,
      scenarios:     ((tables && tables.scenarios) || []).map(s => ({ id: s.id, label: s.label, sub: s.sub, iconKey: s.iconKey || "", sites_json: s.sites || [] })),
      caseStudies:   (tables && tables.caseStudies) || [],
      productImages: (tables && tables.productImages) || [],
      tender:        flatTender,
      activityLog:   activityLog || [],
      settings,
    };
  }

  // Inverse of flattenForSheet: hydrate portal state from rows pulled from the Sheet.
  // Returns partial { tables, tender, quotes, users, activityLog }. Caller decides what to apply.
  function hydrateFromSheet(remote) {
    if (!remote || typeof remote !== "object") return {};
    const out = {};

    // Users
    if (Array.isArray(remote.users)) {
      out.users = remote.users.map((r, i) => ({
        _uid: r._uid || ("u_pull_" + Date.now().toString(36) + "_" + i),
        email: String(r.email||"").trim(),
        name: r.name || "",
        initials: r.initials || (String(r.name||"??").slice(0,2).toUpperCase()),
        role: r.role || "sales",
        title: r.title || "",
        password: r.password != null ? String(r.password) : "",
        suspended: r.suspended === true || r.suspended === "TRUE" || r.suspended === "true" || r.suspended === 1 || r.suspended === "1",
      })).filter(u => u.email);
    }

    // Tables
    const tables = {};
    if (Array.isArray(remote.pricingBands) && remote.pricingBands.length) {
      tables.bands = remote.pricingBands.map(r => ({
        key: r.key, label: r.label, desc: r.desc,
        minCD: +r.minCD || 0, maxCD: +r.maxCD || 0, fee: +r.fee || 0,
      }));
    }
    if (Array.isArray(remote.pricingTiers) && remote.pricingTiers.length) {
      tables.tiers = remote.pricingTiers.map(r => ({
        key: r.key, minCams: +r.minCams || 0, disc: +r.disc || 0,
        r7w: +r.r7w || 0, r7g: +r.r7g || 0,
        r14w: +r.r14w || 0, r14g: +r.r14g || 0,
        r28w: +r.r28w || 0, r28g: +r.r28g || 0,
      }));
    }
    if (Array.isArray(remote.mobilisation) && remote.mobilisation.length) {
      tables.mob = remote.mobilisation.map(r => ({
        key: r.key, label: r.label, desc: r.desc, fee: +r.fee || 0,
      }));
    }
    if (Array.isArray(remote.addons) && remote.addons.length) {
      tables.addons = {};
      for (const r of remote.addons) {
        tables.addons[r.id] = { label: r.label, unit: r.unit, price: +r.price || 0 };
      }
    }
    if (Array.isArray(remote.scenarios) && remote.scenarios.length) {
      tables.scenarios = remote.scenarios.map(r => ({
        id: r.id, label: r.label, sub: r.sub, iconKey: r.iconKey || "",
        sites: r.sites || [],
      }));
    }
    if (Array.isArray(remote.caseStudies)) {
      tables.caseStudies = remote.caseStudies.map(r => ({
        ...r,
        featured: r.featured === true || r.featured === "TRUE" || r.featured === "true" || r.featured === 1 || r.featured === "1",
        addedAt: +r.addedAt || Date.now(),
      }));
    }
    if (Array.isArray(remote.productImages)) {
      tables.productImages = remote.productImages.map(r => ({ ...r, addedAt: +r.addedAt || Date.now() }));
    }
    if (Array.isArray(remote.settings) && remote.settings.length) {
      tables.settings = {};
      for (const r of remote.settings) {
        let v = r.value;
        if (v === "true") v = true;
        else if (v === "false") v = false;
        else if (!isNaN(+v) && v !== "" && v !== null) v = +v;
        tables.settings[r.key] = v;
      }
    }
    if (Object.keys(tables).length) out.tables = tables;

    // Tender — un-flatten back to nested categories
    if (Array.isArray(remote.tender) && remote.tender.length) {
      const catMap = new Map();
      for (const r of remote.tender) {
        if (!catMap.has(r.catId)) {
          catMap.set(r.catId, {
            id: r.catId, num: r.catNum, label: r.catLabel, desc: r.catDesc || "",
            questions: [],
          });
        }
        const cat = catMap.get(r.catId);
        let q = cat.questions.find(x => x.id === r.qId);
        if (!q) {
          q = { id: r.qId, question: r.question, tags: (r.tags||"").split(",").map(t=>t.trim()).filter(Boolean), note: r.note || undefined, answers: [] };
          if (!q.note) delete q.note;
          cat.questions.push(q);
        }
        q.answers.push({ id: r.answerId, length: r.answerLength, text: r.answerText });
      }
      out.tender = { version: "1.0-sheets", issued: new Date().toISOString().slice(0,10), categories: [...catMap.values()] };
    }

    // Quotes
    if (Array.isArray(remote.quotes)) {
      out.quotes = remote.quotes.map(r => ({
        id: r.id, status: r.status, client: r.client, quoteRef: r.quoteRef,
        total: +r.total || 0, tier: r.tier, bandKey: r.bandKey,
        createdAt: +r.createdAt || 0, updatedAt: +r.updatedAt || 0, sentAt: +r.sentAt || 0,
        createdBy: r.createdBy, createdByName: r.createdByName,
        input: r.input || (r.input_json) || { sites: r.sites || r.sites_json || [], client: r.client, quoteRef: r.quoteRef },
      }));
    }

    // Activity log
    if (Array.isArray(remote.activityLog)) {
      out.activityLog = remote.activityLog.map(r => ({ ...r, ts: +r.ts || 0, total: r.total !== "" ? +r.total : undefined }));
    }

    return out;
  }

  window.WEBackend = {
    getUrl, setUrl, getAutoSync, setAutoSync,
    ping, pull, pullTab, pushAll, pushTab, logAction,
    listDriveImages, uploadDriveImage, deleteDriveImage,
    sendQuoteEmail,
    flattenForSheet, hydrateFromSheet,
  };
})();
