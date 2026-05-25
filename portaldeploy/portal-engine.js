// Portal pricing engine — pure: calculate(input, tables) -> result.
// All tables editable via the Admin view. Defaults below mirror pricing-engine.js
// (which still serves the design-canvas comparison, untouched).

(function () {
  const DURATIONS = [7, 14, 28];

  const DEFAULT_REPORT_BANDS = [
    { key: "Small",       label: "Small",       desc: "4 cams · 7 or 14 days",                    minCD: 0,    maxCD: 100,   fee: 2200 },
    { key: "Medium",      label: "Medium",      desc: "8 cams · 14 days, or 4 cams · 28 days",    minCD: 100,  maxCD: 175,   fee: 3000 },
    { key: "Large",       label: "Large",       desc: "16 cams · 14 days, or 8 cams · 28 days",   minCD: 175,  maxCD: 350,   fee: 4200 },
    { key: "Extra-large", label: "Extra-large", desc: "30 cams · 14 days, or 16 cams · 28 days",  minCD: 350,  maxCD: 600,   fee: 5500 },
    { key: "Enterprise",  label: "Enterprise",  desc: "50 cams · 14 days, or 30 cams · 28 days",  minCD: 600,  maxCD: 1100,  fee: 7000 },
    { key: "Mega",        label: "Mega",        desc: "50 cams · 28 days, or large 15-min deployments", minCD: 1100, maxCD: 99999, fee: 8500 },
  ];

  const DEFAULT_TIERS = [
    { key: "Tier 1", minCams: 4,  disc: 0.00, r7w: 300, r7g: 420, r14w: 480, r14g: 640, r28w: 820, r28g: 1050 },
    { key: "Tier 2", minCams: 8,  disc: 0.05, r7w: 285, r7g: 399, r14w: 456, r14g: 608, r28w: 779, r28g: 998  },
    { key: "Tier 3", minCams: 16, disc: 0.10, r7w: 270, r7g: 378, r14w: 432, r14g: 576, r28w: 738, r28g: 945  },
    { key: "Tier 4", minCams: 30, disc: 0.15, r7w: 255, r7g: 357, r14w: 408, r14g: 544, r28w: 697, r28g: 893  },
    { key: "Tier 5", minCams: 50, disc: 0.20, r7w: 240, r7g: 336, r14w: 384, r14g: 512, r28w: 656, r28g: 840  },
  ];

  const DEFAULT_MOBILISATION = [
    { key: "CBD",      label: "CBD",      desc: "Within 15 km of Melbourne, Sydney or Brisbane CBD", fee:  400 },
    { key: "Metro",    label: "Metro",    desc: "15 – 50 km from supported CBD",                     fee:  750 },
    { key: "Outer",    label: "Outer",    desc: "50 – 150 km from supported CBD",                    fee: 1500 },
    { key: "Regional", label: "Regional", desc: "150 – 300 km from supported CBD",                   fee: 2500 },
  ];

  const DEFAULT_ADDONS = {
    capture15:   { label: "15-minute capture interval",          unit: "per camera",    price:  75 },
    extended12:  { label: "Extended 12-hour active window",      unit: "per camera",    price: 100 },
    rushInstall: { label: "Rush install within 5 business days", unit: "per site",      price: 500 },
    workshop:    { label: "Recommendations workshop (1 hour)",   unit: "per workshop",  price: 1500 },
    training:    { label: "Staff training session",              unit: "per session",   price:  650 },
    followUp:    { label: "Follow-up audit · 3 months",          unit: "% off cameras", price: 0.10 },
  };

  const DEFAULT_SCENARIOS = [
    { id: "cafe",      label: "Small CBD café",         sub: "1 site · 4 WiFi · 7 days",   sites: [{ name: "Café", mobBand: "CBD", wifi: 4, fourg: 0, days: 7 }] },
    { id: "hospital",  label: "Regional hospital",      sub: "1 site · 8 WiFi + 4 × 4G · 14 days", sites: [{ name: "Hospital", mobBand: "CBD", wifi: 8, fourg: 4, days: 14 }] },
    { id: "warehouse", label: "Logistics warehouse",    sub: "1 site · 20 × 4G · 28 days", sites: [{ name: "Warehouse", mobBand: "Outer", wifi: 0, fourg: 20, days: 28 }] },
    { id: "office",    label: "Mid-size office",        sub: "1 site · 6 WiFi + 2 × 4G · 14 days", sites: [{ name: "Office", mobBand: "Metro", wifi: 6, fourg: 2, days: 14 }] },
    { id: "retail",    label: "Retail group",           sub: "3 sites · 30 cams · 28 days", sites: [
      { name: "Store A", mobBand: "CBD", wifi: 6, fourg: 4, days: 28 },
      { name: "Store B", mobBand: "CBD", wifi: 6, fourg: 4, days: 28 },
      { name: "Store C", mobBand: "CBD", wifi: 6, fourg: 4, days: 28 },
    ]},
    { id: "regional",  label: "Regional manufacturing", sub: "1 site · 16 × 4G · 28 days · Regional", sites: [{ name: "Plant", mobBand: "Regional", wifi: 0, fourg: 16, days: 28 }] },
    { id: "hifreq",    label: "High-frequency audit",   sub: "1 site · 12 WiFi · 14 days · 15-min", sites: [{ name: "Site", mobBand: "CBD", wifi: 12, fourg: 0, days: 14, capture15: true }] },
    { id: "multi",     label: "Enterprise multi-site",  sub: "5 sites · 40 cams · 28 days", sites: Array.from({length:5}).map((_,i)=>({ name: `Site ${i+1}`, mobBand: "Metro", wifi: 5, fourg: 3, days: 28 })) },
  ];

  const DEFAULT_SETTINGS = {
    currency: "AUD",
    gstRate: 0.10,
    quoteValidityDays: 30,
    minCameras: 4,
    captureMultiplier: 4, // 15-min mode multiplies camera-days for report band
  };

  function defaultTables() {
    return {
      bands: clone(DEFAULT_REPORT_BANDS),
      tiers: clone(DEFAULT_TIERS),
      mob:   clone(DEFAULT_MOBILISATION),
      addons: clone(DEFAULT_ADDONS),
      scenarios: clone(DEFAULT_SCENARIOS),
      settings: clone(DEFAULT_SETTINGS),
    };
  }
  function clone(x){ return JSON.parse(JSON.stringify(x)); }

  function tierFor(totalCams, tiers) {
    let chosen = null;
    for (const t of tiers) if (totalCams >= t.minCams) chosen = t;
    return chosen;
  }
  function bandFor(camDays, bands) {
    for (const b of bands) if (camDays >= b.minCD && camDays <= b.maxCD) return b;
    return bands[bands.length-1];
  }
  function unitRate(tier, days, type) {
    // type: "wifi" | "fourg"
    const key = `r${days}${type==="wifi"?"w":"g"}`;
    return tier[key] || 0;
  }
  function mobFor(key, mob) {
    return mob.find(m => m.key === key) || mob[0];
  }

  function calculate(input, T) {
    const tables = T || defaultTables();
    const sites = input.sites || [];
    let totalCams = 0, totalCamDays = 0, effectiveCamDays = 0;
    for (const s of sites) {
      const cams = (+s.wifi || 0) + (+s.fourg || 0);
      totalCams += cams;
      const cd = cams * (+s.days || 0);
      totalCamDays += cd;
      effectiveCamDays += s.capture15 ? cd * tables.settings.captureMultiplier : cd;
    }
    const tier = tierFor(totalCams, tables.tiers);
    const band = bandFor(effectiveCamDays, tables.bands);
    const lines = [];

    if (totalCams >= tables.settings.minCameras) {
      lines.push({
        group: "Report", label: "Diagnostic report",
        detail: `${band.label} band · ${effectiveCamDays.toLocaleString()} effective camera-days`,
        amount: band.fee, kind: "report",
      });
    }

    sites.forEach((s, idx) => {
      const wifi = +s.wifi || 0;
      const fourg = +s.fourg || 0;
      const days = +s.days || 14;
      const m = mobFor(s.mobBand, tables.mob);
      const siteLabel = s.name || `Site ${idx+1}`;
      if (tier && wifi > 0) {
        const u = unitRate(tier, days, "wifi");
        lines.push({ group: siteLabel, label: "WiFi camera rental", detail: `${wifi} × $${u.toLocaleString()} · ${tier.key}, ${days} days`, amount: wifi * u, kind: "rental" });
      }
      if (tier && fourg > 0) {
        const u = unitRate(tier, days, "fourg");
        lines.push({ group: siteLabel, label: "4G camera rental", detail: `${fourg} × $${u.toLocaleString()} · ${tier.key}, ${days} days`, amount: fourg * u, kind: "rental" });
      }
      lines.push({ group: siteLabel, label: "Mobilisation", detail: `${m.label} band · install + retrieval`, amount: m.fee, kind: "mob" });
      if (+s.addVisits > 0) {
        lines.push({ group: siteLabel, label: "Additional site visits", detail: `${s.addVisits} × ${m.label}`, amount: +s.addVisits * m.fee, kind: "mob" });
      }
      if (s.capture15) {
        const c = wifi + fourg;
        lines.push({ group: siteLabel, label: "15-min capture interval", detail: `${c} cams × $${tables.addons.capture15.price}`, amount: c * tables.addons.capture15.price, kind: "addon" });
      }
      if (s.extended12) {
        const c = wifi + fourg;
        lines.push({ group: siteLabel, label: "Extended 12h window", detail: `${c} cams × $${tables.addons.extended12.price}`, amount: c * tables.addons.extended12.price, kind: "addon" });
      }
      if (s.rushInstall) {
        lines.push({ group: siteLabel, label: "Rush install", detail: `1 site × $${tables.addons.rushInstall.price}`, amount: tables.addons.rushInstall.price, kind: "addon" });
      }
    });

    if (+input.workshops > 0) {
      lines.push({ group: "Engagement", label: "Recommendations workshops", detail: `${input.workshops} × $${tables.addons.workshop.price.toLocaleString()}`, amount: +input.workshops * tables.addons.workshop.price, kind: "addon" });
    }
    if (+input.trainings > 0) {
      lines.push({ group: "Engagement", label: "Staff training sessions", detail: `${input.trainings} × $${tables.addons.training.price.toLocaleString()}`, amount: +input.trainings * tables.addons.training.price, kind: "addon" });
    }

    if (input.followUp) {
      const rentalSub = lines.filter(l => l.kind === "rental").reduce((a,b) => a + b.amount, 0);
      const fa = -Math.round(rentalSub * tables.addons.followUp.price);
      if (fa !== 0) {
        lines.push({ group: "Engagement", label: "Follow-up audit discount", detail: `−${Math.round(tables.addons.followUp.price*100)}% on camera rental`, amount: fa, kind: "discount" });
      }
    }

    const total = lines.reduce((a,b) => a + b.amount, 0);
    return {
      lines, total,
      meta: {
        totalCams, totalCamDays, effectiveCamDays,
        tier: tier ? tier.key : "—",
        tierDiscount: tier ? tier.disc : 0,
        band: band.label, bandKey: band.key,
        valid: totalCams >= tables.settings.minCameras,
      },
    };
  }

  function emptySite() {
    return { name: "", state: "VIC", mobBand: "CBD", wifi: 8, fourg: 4, days: 14, capture15: false, extended12: false, rushInstall: false, addVisits: 0 };
  }
  function defaultInput() {
    return {
      client: "",
      quoteRef: "WE-" + String(Math.floor(1000 + Math.random()*9000)),
      sites: [{ ...emptySite(), name: "Main site" }],
      workshops: 0, trainings: 0, followUp: false,
    };
  }

  window.WEP = {
    DURATIONS, defaultTables, calculate, emptySite, defaultInput,
    DEFAULT_REPORT_BANDS, DEFAULT_TIERS, DEFAULT_MOBILISATION, DEFAULT_ADDONS, DEFAULT_SCENARIOS, DEFAULT_SETTINGS,
  };
})();
