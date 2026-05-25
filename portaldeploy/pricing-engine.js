// WasteEye pricing engine — faithful to WasteEye_Pricing_Calculator.xlsx
// Exposes: WE.calculate(input) -> { lines:[], total, meta }

(function () {
  const REPORT_BANDS = [
    { key: "Small",       label: "Small",       desc: "4 cams · 7 or 14 days",                    minCD: 0,    maxCD: 100,   fee: 2200 },
    { key: "Medium",      label: "Medium",      desc: "8 cams · 14 days, or 4 cams · 28 days",    minCD: 100,  maxCD: 175,   fee: 3000 },
    { key: "Large",       label: "Large",       desc: "16 cams · 14 days, or 8 cams · 28 days",   minCD: 175,  maxCD: 350,   fee: 4200 },
    { key: "Extra-large", label: "Extra-large", desc: "30 cams · 14 days, or 16 cams · 28 days",  minCD: 350,  maxCD: 600,   fee: 5500 },
    { key: "Enterprise",  label: "Enterprise",  desc: "50 cams · 14 days, or 30 cams · 28 days",  minCD: 600,  maxCD: 1100,  fee: 7000 },
    { key: "Mega",        label: "Mega",        desc: "50 cams · 28 days, or large 15-min deployments", minCD: 1100, maxCD: 99999, fee: 8500 },
  ];

  // Tier rental: D=7day, 14day, 28day for WiFi and 4G
  const TIERS = [
    { key: "Tier 1", minCams: 4,  disc: 0.00, rates: { 7:{ wifi:300, fourg:420 }, 14:{ wifi:480, fourg:640 }, 28:{ wifi:820, fourg:1050 } } },
    { key: "Tier 2", minCams: 8,  disc: 0.05, rates: { 7:{ wifi:285, fourg:399 }, 14:{ wifi:456, fourg:608 }, 28:{ wifi:779, fourg:998  } } },
    { key: "Tier 3", minCams: 16, disc: 0.10, rates: { 7:{ wifi:270, fourg:378 }, 14:{ wifi:432, fourg:576 }, 28:{ wifi:738, fourg:945  } } },
    { key: "Tier 4", minCams: 30, disc: 0.15, rates: { 7:{ wifi:255, fourg:357 }, 14:{ wifi:408, fourg:544 }, 28:{ wifi:697, fourg:893  } } },
    { key: "Tier 5", minCams: 50, disc: 0.20, rates: { 7:{ wifi:240, fourg:336 }, 14:{ wifi:384, fourg:512 }, 28:{ wifi:656, fourg:840  } } },
  ];

  const MOBILISATION = {
    CBD:      { label: "CBD",      desc: "Within 15 km of Melbourne, Sydney or Brisbane CBD", fee:  400 },
    Metro:    { label: "Metro",    desc: "15 – 50 km from supported CBD",                     fee:  750 },
    Outer:    { label: "Outer",    desc: "50 – 150 km from supported CBD",                    fee: 1500 },
    Regional: { label: "Regional", desc: "150 – 300 km from supported CBD",                   fee: 2500 },
  };

  const ADDONS = {
    capture15:   { label: "15-minute capture interval",   unit: "per camera", price:  75 },
    extended12:  { label: "Extended 12-hour active window", unit: "per camera", price: 100 },
    rushInstall: { label: "Rush install within 5 business days", unit: "per site", price: 500 },
    workshop:    { label: "Recommendations workshop (1 hour)", unit: "per workshop", price: 1500 },
    training:    { label: "Staff training session",       unit: "per session", price:  650 },
    followUp:    { label: "Follow-up audit (3 months)",   unit: "10% off cameras", price: 0.10 },
  };

  const DURATIONS = [7, 14, 28];

  function tierFor(totalCams) {
    let t = null;
    for (const tier of TIERS) if (totalCams >= tier.minCams) t = tier;
    return t; // null if < 4
  }

  function bandFor(effectiveCamDays) {
    for (const b of REPORT_BANDS) {
      if (effectiveCamDays >= b.minCD && effectiveCamDays <= b.maxCD) return b;
    }
    return REPORT_BANDS[REPORT_BANDS.length - 1];
  }

  // input = {
  //   sites: [{ name, mobBand, wifi, fourg, days, capture15, extended12, rushInstall, addVisits }],
  //   workshops, trainings, followUp
  // }
  function calculate(input) {
    const sites = input.sites || [];
    let totalCams = 0;
    let totalCamDays = 0;
    let totalCamDaysEffective = 0;
    for (const s of sites) {
      const cams = (+s.wifi || 0) + (+s.fourg || 0);
      totalCams += cams;
      const cd = cams * (+s.days || 0);
      totalCamDays += cd;
      totalCamDaysEffective += s.capture15 ? cd * 4 : cd;
    }

    const tier = tierFor(totalCams);
    const band = bandFor(totalCamDaysEffective);

    const lines = [];

    // Report fee — one per deployment (the whole quote)
    if (totalCams >= 4) {
      lines.push({
        group: "Report",
        label: "Diagnostic report",
        detail: `${band.label} band · ${totalCamDaysEffective} effective camera-days`,
        amount: band.fee,
        kind: "report",
        bandKey: band.key,
      });
    }

    // Per-site rentals + mobilisation + per-site add-ons
    sites.forEach((s, idx) => {
      const wifi = +s.wifi || 0;
      const fourg = +s.fourg || 0;
      const days = +s.days || 14;
      const mob = MOBILISATION[s.mobBand] || MOBILISATION.CBD;
      const siteLabel = s.name || `Site ${idx + 1}`;

      if (tier && wifi > 0) {
        const unit = tier.rates[days].wifi;
        lines.push({
          group: siteLabel,
          label: "WiFi camera rental",
          detail: `${wifi} × $${unit.toLocaleString()} · ${tier.key}, ${days} days`,
          amount: wifi * unit,
          kind: "rental",
        });
      }
      if (tier && fourg > 0) {
        const unit = tier.rates[days].fourg;
        lines.push({
          group: siteLabel,
          label: "4G camera rental",
          detail: `${fourg} × $${unit.toLocaleString()} · ${tier.key}, ${days} days`,
          amount: fourg * unit,
          kind: "rental",
        });
      }

      lines.push({
        group: siteLabel,
        label: "Mobilisation",
        detail: `${mob.label} band · install + retrieval`,
        amount: mob.fee,
        kind: "mob",
      });

      if (+s.addVisits > 0) {
        lines.push({
          group: siteLabel,
          label: "Additional site visits",
          detail: `${s.addVisits} × ${mob.label} band`,
          amount: +s.addVisits * mob.fee,
          kind: "mob",
        });
      }

      if (s.capture15) {
        const cams = wifi + fourg;
        lines.push({
          group: siteLabel,
          label: "15-min capture interval",
          detail: `${cams} cameras × $${ADDONS.capture15.price}`,
          amount: cams * ADDONS.capture15.price,
          kind: "addon",
        });
      }
      if (s.extended12) {
        const cams = wifi + fourg;
        lines.push({
          group: siteLabel,
          label: "Extended 12-hour window",
          detail: `${cams} cameras × $${ADDONS.extended12.price}`,
          amount: cams * ADDONS.extended12.price,
          kind: "addon",
        });
      }
      if (s.rushInstall) {
        lines.push({
          group: siteLabel,
          label: "Rush install",
          detail: `1 site × $${ADDONS.rushInstall.price}`,
          amount: ADDONS.rushInstall.price,
          kind: "addon",
        });
      }
    });

    // Quote-level add-ons
    if (+input.workshops > 0) {
      lines.push({
        group: "Engagement",
        label: "Recommendations workshops",
        detail: `${input.workshops} × $${ADDONS.workshop.price.toLocaleString()}`,
        amount: +input.workshops * ADDONS.workshop.price,
        kind: "addon",
      });
    }
    if (+input.trainings > 0) {
      lines.push({
        group: "Engagement",
        label: "Staff training sessions",
        detail: `${input.trainings} × $${ADDONS.training.price.toLocaleString()}`,
        amount: +input.trainings * ADDONS.training.price,
        kind: "addon",
      });
    }

    // Follow-up audit discount = 10% off camera rental
    let followUpAmt = 0;
    if (input.followUp) {
      const rentalSubtotal = lines
        .filter((l) => l.kind === "rental")
        .reduce((a, b) => a + b.amount, 0);
      followUpAmt = -Math.round(rentalSubtotal * ADDONS.followUp.price);
      if (followUpAmt !== 0) {
        lines.push({
          group: "Engagement",
          label: "Follow-up audit discount",
          detail: "−10% on camera rental",
          amount: followUpAmt,
          kind: "discount",
        });
      }
    }

    const total = lines.reduce((a, b) => a + b.amount, 0);

    return {
      lines,
      total,
      meta: {
        totalCams,
        totalCamDays,
        effectiveCamDays: totalCamDaysEffective,
        tier: tier ? tier.key : "—",
        tierDiscount: tier ? tier.disc : 0,
        band: band.label,
        bandKey: band.key,
        valid: totalCams >= 4,
      },
    };
  }

  // Pre-built scenarios from the spreadsheet — used for quick-picks
  const SCENARIOS = [
    { id: "cafe",       label: "Small CBD café",      sub: "1 site · 4 WiFi · 7 days",     sites: [{ name: "Café", mobBand: "CBD", wifi: 4, fourg: 0, days: 7 }],  expected: 3800  },
    { id: "hospital",   label: "Regional hospital",   sub: "1 site · 8 WiFi + 4 × 4G · 14 days", sites: [{ name: "Hospital", mobBand: "CBD", wifi: 8, fourg: 4, days: 14 }], expected: 10680 },
    { id: "warehouse",  label: "Logistics warehouse", sub: "1 site · 20 × 4G · 28 days",   sites: [{ name: "Warehouse", mobBand: "Outer", wifi: 0, fourg: 20, days: 28 }], expected: 25900 },
    { id: "office",     label: "Mid-size office",     sub: "1 site · 6 WiFi + 2 × 4G · 14 days", sites: [{ name: "Office", mobBand: "Metro", wifi: 6, fourg: 2, days: 14 }], expected: 7702 },
    { id: "retail",     label: "Retail group",        sub: "3 sites · 30 cams · 28 days",  sites: [
      { name: "Store A", mobBand: "CBD", wifi: 6, fourg: 4, days: 28 },
      { name: "Store B", mobBand: "CBD", wifi: 6, fourg: 4, days: 28 },
      { name: "Store C", mobBand: "CBD", wifi: 6, fourg: 4, days: 28 },
    ], expected: 31462 },
    { id: "regional",   label: "Regional manufacturing", sub: "1 site · 16 × 4G · 28 days · Regional", sites: [{ name: "Plant", mobBand: "Regional", wifi: 0, fourg: 16, days: 28 }], expected: 23120 },
    { id: "hifreq",     label: "High-frequency audit",  sub: "1 site · 12 WiFi · 14 days · 15-min",
      sites: [{ name: "Site", mobBand: "CBD", wifi: 12, fourg: 0, days: 14, capture15: true }], expected: 13772 },
    { id: "multi",      label: "Enterprise multi-site",  sub: "5 sites · 40 cams · 28 days", sites: Array.from({length:5}).map((_,i)=>({ name: `Site ${i+1}`, mobBand: "Metro", wifi: 5, fourg: 3, days: 28 })), expected: 43266 },
  ];

  function emptySite() {
    return { name: "", mobBand: "CBD", wifi: 8, fourg: 4, days: 14, capture15: false, extended12: false, rushInstall: false, addVisits: 0 };
  }

  function defaultInput() {
    return {
      client: "",
      quoteRef: "WE-" + String(Math.floor(1000 + Math.random()*9000)),
      sites: [{ ...emptySite(), name: "Main site" }],
      workshops: 0,
      trainings: 0,
      followUp: false,
    };
  }

  window.WE = {
    REPORT_BANDS, TIERS, MOBILISATION, ADDONS, DURATIONS, SCENARIOS,
    calculate, tierFor, bandFor, emptySite, defaultInput,
  };
})();
