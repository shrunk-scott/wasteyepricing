// Quote PDF generation — renders the quote into a print-optimised HTML document
// in a new browser window, then triggers the native print dialog so the user can
// "Save as PDF" (or actually print).
//
// No external libraries needed. Works in any modern browser. Output is a clean,
// professional-looking 1-page A4 quote.

(function () {
  function fmt(n) {
    if (n == null || isNaN(n)) return "—";
    const neg = n < 0;
    const v = Math.abs(Math.round(n));
    return (neg ? "−" : "") + "$" + v.toLocaleString("en-AU");
  }
  function escape(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;" }[c]));
  }

  function buildQuotePdfHtml({ input, result, tables, session }) {
    const lines = result.lines || [];
    const sites = input.sites || [];

    // Group line items by site/category for clearer presentation
    const grouped = {};
    for (const l of lines) {
      const k = l.group || "Other";
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(l);
    }

    const issueDate = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" });
    const validityDays = (tables && tables.settings && tables.settings.quoteValidityDays) || 30;
    const expiry = new Date(Date.now() + validityDays * 86400000).toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" });

    const groupSection = (groupName, items) => {
      const rows = items.map(l => `
        <tr class="line">
          <td class="label">
            <div class="ttl">${escape(l.label)}</div>
            <div class="detail">${escape(l.detail)}</div>
          </td>
          <td class="amt ${l.kind === "discount" ? "discount" : ""}">${fmt(l.amount)}</td>
        </tr>
      `).join("");
      const subtotal = items.reduce((a, b) => a + b.amount, 0);
      return `
        <div class="group">
          <div class="group-h">
            <span class="group-name">${escape(groupName)}</span>
            <span class="group-sub">subtotal · ${fmt(subtotal)}</span>
          </div>
          <table class="lines">
            <colgroup><col><col style="width:130px;"></colgroup>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    };

    const sitesSummary = sites.map((s, i) => `
      <tr>
        <td class="num">${String(i+1).padStart(2,"0")}</td>
        <td><b>${escape(s.name || `Site ${i+1}`)}</b></td>
        <td>${(+s.wifi||0)} WiFi · ${(+s.fourg||0)} 4G</td>
        <td>${s.days||14} days</td>
        <td>${escape(s.state || "—")}</td>
        <td>${escape(s.mobBand || "—")}</td>
        ${s.capture15 || s.extended12 || s.rushInstall ? `<td class="addons">${[s.capture15?"15-min":"",s.extended12?"12h":"",s.rushInstall?"Rush":""].filter(Boolean).join(" · ")}</td>` : `<td class="addons">—</td>`}
      </tr>
    `).join("");

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>WastEye Quote · ${escape(input.client || "")} · ${escape(input.quoteRef || "")}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }

  * { box-sizing:border-box; }
  html, body { margin:0; padding:0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    color:#0A1628;
    background:#fff;
    font-size:11px;
    line-height:1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .serif { font-family: "Source Serif 4", Georgia, "Times New Roman", serif; }
  .mono  { font-family: "SF Mono", Menlo, Consolas, "Roboto Mono", monospace; }

  /* Header band */
  .hdr {
    display:flex; justify-content:space-between; align-items:flex-end;
    padding-bottom:14px;
    border-bottom:3px solid #0A1628;
    margin-bottom:18px;
  }
  .hdr-l .eyebrow {
    font-size:9px; letter-spacing:0.2em; text-transform:uppercase;
    color:#1F5CD9; font-weight:700; margin-bottom:4px;
  }
  .hdr-l h1 {
    font-family: "Source Serif 4", Georgia, serif;
    font-size:24px; font-weight:600; letter-spacing:-0.015em;
    margin:0; line-height:1.1; color:#0A1628;
  }
  .hdr-l .lede {
    font-size:11px; color:#5A6C82; margin-top:5px;
  }
  .hdr-r { text-align:right; min-width:200px; }
  .hdr-r .ref { font-family: monospace; font-size:11px; font-weight:600; color:#0A1628; }
  .hdr-r .dates { font-size:10px; color:#5A6C82; line-height:1.6; margin-top:4px; }

  /* Issue / validity bar */
  .meta-strip {
    display:flex; gap:0; margin-bottom:18px;
    border:1px solid #D5DEEC; border-radius:5px;
    overflow:hidden;
  }
  .meta-strip > div {
    flex:1; padding:9px 12px; border-right:1px solid #D5DEEC;
  }
  .meta-strip > div:last-child { border-right:none; }
  .meta-strip .k {
    font-size:8.5px; letter-spacing:0.16em; text-transform:uppercase;
    color:#5A6C82; font-weight:700; margin-bottom:2px;
  }
  .meta-strip .v {
    font-size:13px; font-weight:600; color:#0A1628;
  }
  .meta-strip .v.accent { color:#1F5CD9; }

  /* Sites table */
  .sec-h {
    font-size:10px; letter-spacing:0.16em; text-transform:uppercase;
    color:#5A6C82; font-weight:700; margin:18px 0 7px;
    display:flex; align-items:center; gap:8px;
  }
  .sec-h .num {
    font-family: monospace; font-size:9px; padding:2px 6px;
    background:#0A1628; color:#fff; border-radius:3px; font-weight:600;
  }

  table.sites {
    width:100%; border-collapse:collapse;
    border:1px solid #D5DEEC; border-radius:5px; overflow:hidden;
  }
  table.sites thead { background:#F4F7FB; }
  table.sites th, table.sites td { padding:7px 10px; text-align:left; font-size:10.5px; border-bottom:1px solid #EAEEF4; }
  table.sites th {
    font-size:8.5px; letter-spacing:0.14em; text-transform:uppercase;
    color:#5A6C82; font-weight:700;
  }
  table.sites tr:last-child td { border-bottom:none; }
  table.sites td.num { font-family: monospace; color:#8B98AD; width:30px; }
  table.sites td.addons { font-family: monospace; font-size:10px; color:#5A6C82; }

  /* Line items */
  .group { margin-bottom:10px; }
  .group-h {
    display:flex; justify-content:space-between; align-items:baseline;
    padding:6px 0 4px; border-bottom:1px solid #0A1628;
    margin-bottom:2px;
  }
  .group-name {
    font-family:"Source Serif 4", Georgia, serif;
    font-size:12px; font-weight:600;
    letter-spacing:0.04em; text-transform:uppercase;
  }
  .group-sub { font-family: monospace; font-size:9.5px; color:#5A6C82; }
  table.lines { width:100%; border-collapse:collapse; }
  table.lines td {
    padding:6px 0; border-bottom:1px dotted #EAEEF4; vertical-align:top;
  }
  table.lines tr:last-child td { border-bottom:none; }
  table.lines .ttl { font-size:11px; font-weight:500; color:#0A1628; }
  table.lines .detail { font-size:9.5px; color:#5A6C82; margin-top:1px; }
  table.lines .amt {
    text-align:right; font-family: monospace; font-size:11px;
    font-weight:600; color:#0A1628; white-space:nowrap;
  }
  table.lines .amt.discount { color:#15803D; }

  /* Total */
  .total {
    margin-top:14px; padding-top:12px;
    border-top:3px solid #0A1628;
    display:flex; justify-content:space-between; align-items:baseline;
  }
  .total .lbl {
    font-size:9.5px; letter-spacing:0.2em; text-transform:uppercase;
    color:#5A6C82; font-weight:700;
  }
  .total .lbl b { color:#0A1628; }
  .total .amt {
    font-family: "Source Serif 4", Georgia, serif;
    font-size:32px; font-weight:600; letter-spacing:-0.02em;
    color:#0A1628; line-height:1;
  }
  .total .amt .cur { font-family:inherit; font-size:14px; font-weight:500; color:#5A6C82; margin-right:6px; }

  .fine {
    font-size:9.5px; color:#5A6C82; line-height:1.6;
    margin-top:6px;
  }

  /* Footer */
  .ftr {
    margin-top:24px; padding-top:14px; border-top:1px solid #D5DEEC;
    display:flex; justify-content:space-between; align-items:flex-end;
    font-size:9.5px; color:#5A6C82;
  }
  .ftr .l b { color:#0A1628; font-size:11px; }
  .ftr .r { text-align:right; font-family: monospace; }
  .ftr a { color:#5A6C82; text-decoration:none; }

  /* Hide controls on print */
  @media print {
    .controls { display:none !important; }
  }
  .controls {
    position:fixed; top:14px; right:14px;
    background:#0A1628; color:#fff;
    padding:10px 14px; border-radius:8px;
    box-shadow:0 8px 24px -10px rgba(10,22,40,0.4);
    z-index:1000;
    font-family:inherit; font-size:12px; font-weight:600;
    display:flex; gap:8px; align-items:center;
  }
  .controls button {
    padding:8px 14px; background:#fff; color:#0A1628;
    border:none; border-radius:6px; font:inherit;
    font-size:11.5px; font-weight:600; cursor:pointer;
  }
  .controls button.ghost {
    background:transparent; color:#fff;
    border:1px solid rgba(255,255,255,0.3);
  }
  .controls button:hover { opacity:0.9; }
</style>
</head>
<body>

  <div class="controls">
    <span>Quote ready</span>
    <button onclick="window.print()">Save as PDF / Print</button>
    <button class="ghost" onclick="window.close()">Close</button>
  </div>

  <header class="hdr">
    <div class="hdr-l">
      <div class="eyebrow">Shrunk · WastEye</div>
      <h1>Quote · ${escape(input.client || "[Client]")}</h1>
      <div class="lede">Continuous photographic evidence of what's in your bins — analysed by AI, delivered as a decision-ready report.</div>
    </div>
    <div class="hdr-r">
      <div class="ref">${escape(input.quoteRef || "")}</div>
      <div class="dates">
        Issued · ${escape(issueDate)}<br>
        Valid until · ${escape(expiry)}<br>
        Prices in AUD, ex-GST
      </div>
    </div>
  </header>

  <div class="meta-strip">
    <div><div class="k">Cameras</div><div class="v">${result.meta.totalCams}</div></div>
    <div><div class="k">Sites</div><div class="v">${sites.length}</div></div>
    <div><div class="k">Effective cam-days</div><div class="v mono">${(result.meta.effectiveCamDays||0).toLocaleString()}</div></div>
    <div><div class="k">Report band</div><div class="v accent">${escape(result.meta.band)}</div></div>
    <div><div class="k">Volume tier</div><div class="v accent">${escape(result.meta.tier)} ${result.meta.tierDiscount>0?`<span style="font-weight:400; font-size:11px; color:#5A6C82;"> · −${Math.round(result.meta.tierDiscount*100)}%</span>`:""}</div></div>
  </div>

  <div class="sec-h"><span class="num">01</span>Deployment sites</div>
  <table class="sites">
    <thead>
      <tr>
        <th></th>
        <th>Site</th>
        <th>Cameras</th>
        <th>Duration</th>
        <th>State</th>
        <th>Mob. band</th>
        <th>Site add-ons</th>
      </tr>
    </thead>
    <tbody>${sitesSummary}</tbody>
  </table>

  <div class="sec-h"><span class="num">02</span>Pricing breakdown</div>
  ${Object.entries(grouped).map(([k, items]) => groupSection(k, items)).join("")}

  <div class="total">
    <div>
      <div class="lbl">Total · <b>ex-GST</b></div>
      <div class="fine">All prices in Australian Dollars. ${(tables.settings.gstRate||0.1) ? `Add GST (${Math.round((tables.settings.gstRate||0.1)*100)}%) for inc-GST: ${fmt(result.total * (1 + (tables.settings.gstRate||0.1)))}.` : ""}</div>
    </div>
    <div class="amt"><span class="cur">$</span>${(Math.round(result.total)).toLocaleString("en-AU")}</div>
  </div>

  <footer class="ftr">
    <div class="l">
      <b>${escape(session?.name || "Shrunk · WastEye")}</b><br>
      ${escape(session?.title || "")}<br>
      <a href="mailto:${escape(session?.email || "scott@shrunk.ai")}">${escape(session?.email || "scott@shrunk.ai")}</a>
    </div>
    <div class="r">
      Shrunk Innovation Group Pty Ltd<br>
      ABN 15 653 930 691<br>
      shrunk.ai
    </div>
  </footer>

</body>
</html>`;
  }

  function exportQuotePdf({ input, result, tables, session }) {
    const html = buildQuotePdfHtml({ input, result, tables, session });
    // Open in new window, write HTML, trigger print
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) {
      alert("Pop-up blocked. Please allow pop-ups for this site to download the PDF.");
      return false;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Give the browser a moment to render before triggering print
    w.addEventListener("load", () => {
      setTimeout(() => {
        try { w.focus(); w.print(); } catch (e) {}
      }, 250);
    });
    return true;
  }

  window.exportQuotePdf = exportQuotePdf;
})();
