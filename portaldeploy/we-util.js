// Shared utilities for all variations
window.WEUtil = {
  fmt(n) {
    if (n == null || isNaN(n)) return "—";
    const neg = n < 0;
    const v = Math.abs(Math.round(n));
    return (neg ? "−" : "") + "$" + v.toLocaleString("en-AU");
  },
  fmtPlain(n) {
    return (Math.round(n)).toLocaleString("en-AU");
  },
  // Group line items by .group
  groupLines(lines) {
    const map = new Map();
    for (const l of lines) {
      if (!map.has(l.group)) map.set(l.group, []);
      map.get(l.group).push(l);
    }
    return [...map.entries()].map(([group, items]) => ({
      group,
      items,
      subtotal: items.reduce((a, b) => a + b.amount, 0),
    }));
  },
};
