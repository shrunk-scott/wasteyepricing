// Shared scenario icon library — JSX so SVG children are React elements (not innerHTML).
// Exposes window.WE_ICONS and window.renderIcon for use across the portal.

(function () {
  const I = ({ children }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );

  const ICONS = {
    cafe:      { label: "Café",           render: () => <I><path d="M5 8h10v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z"/><path d="M15 10h2a2 2 0 0 1 0 4h-2"/><path d="M8 4v2M11 4v2"/></I> },
    hospital:  { label: "Hospital",       render: () => <I><path d="M5 21V8l7-5 7 5v13"/><path d="M10 21v-5h4v5"/><path d="M12 9v4M10 11h4"/></I> },
    warehouse: { label: "Warehouse",      render: () => <I><path d="M3 21V9l9-5 9 5v12"/><path d="M7 21v-8h10v8"/><path d="M7 17h10"/></I> },
    office:    { label: "Office",         render: () => <I><rect x="5" y="3" width="14" height="18"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/></I> },
    retail:    { label: "Retail",         render: () => <I><path d="M4 8h16l-1 12H5L4 8z"/><path d="M9 8V5a3 3 0 0 1 6 0v3"/></I> },
    regional:  { label: "Regional",       render: () => <I><path d="M3 19h18"/><path d="M5 19V11l5-3 5 3v8"/><path d="M15 19V8l4 2v9"/></I> },
    hifreq:    { label: "High-frequency", render: () => <I><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></I> },
    multi:     { label: "Multi-site",     render: () => <I><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></I> },
    school:    { label: "School",         render: () => <I><path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v6c0 1.5 2.5 3 5 3s5-1.5 5-3v-6"/></I> },
    factory:   { label: "Factory",        render: () => <I><path d="M3 21V11l5 3V11l5 3V8l8 4v9z"/><path d="M9 21v-4M14 21v-4M19 21v-4"/></I> },
    hotel:     { label: "Hotel",          render: () => <I><path d="M3 21h18"/><path d="M5 21V8h14v13"/><path d="M9 12h6M9 16h6"/><path d="M9 5V3h6v2"/></I> },
    apartment: { label: "Apartment",      render: () => <I><rect x="4" y="2" width="16" height="20"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 22v-3h4v3"/></I> },
    stadium:   { label: "Stadium",        render: () => <I><ellipse cx="12" cy="12" rx="10" ry="5"/><path d="M2 12c0 3.5 4 5 10 5s10-1.5 10-5"/></I> },
    market:    { label: "Market",         render: () => <I><path d="M3 9h18l-2 12H5z"/><path d="M3 9l3-5h12l3 5"/><path d="M9 13v4M15 13v4"/></I> },
    transit:   { label: "Transit",        render: () => <I><rect x="4" y="3" width="16" height="14" rx="2"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/><path d="M4 9h16M8 17l-2 4M16 17l2 4"/></I> },
    care:      { label: "Aged care",      render: () => <I><path d="M12 21c-3-2.5-9-6-9-12a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-6 9.5-9 12z"/></I> },
    lab:       { label: "Laboratory",     render: () => <I><path d="M10 2v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-11V2"/><path d="M8 2h8"/><path d="M6 14h12"/></I> },
    park:      { label: "Park / Outdoor", render: () => <I><path d="M12 2l6 9h-4l4 7H6l4-7H6z"/><path d="M12 18v4"/></I> },
    venue:     { label: "Venue / Event",  render: () => <I><path d="M3 7l9-4 9 4-9 4z"/><path d="M7 9v7M17 9v7M3 7v10l9 4 9-4V7"/></I> },
    cleaning:  { label: "Cleaning",       render: () => <I><path d="M4 17l5-5 8 8 3-3-8-8 5-5"/><path d="M14 4l6 6"/><path d="M2 22l3-3"/></I> },
    package:   { label: "Logistics",      render: () => <I><rect x="3" y="7" width="18" height="13"/><path d="M3 7l9-5 9 5"/><path d="M3 7l9 5 9-5"/><path d="M12 12v8"/></I> },
    star:      { label: "Generic",        render: () => <I><circle cx="12" cy="12" r="9"/><path d="M12 7l1.6 3.4 3.4.5-2.5 2.4.6 3.7-3.1-1.7-3.1 1.7.6-3.7L7 10.9l3.4-.5z"/></I> },
  };

  function renderIcon(key) {
    const def = ICONS[key] || ICONS.star;
    return def.render();
  }

  window.WE_ICONS = ICONS;
  window.renderIcon = renderIcon;
})();
