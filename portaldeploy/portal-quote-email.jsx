// Email composition modal for quote sending.
// Renders a polished compose form, builds HTML body from the live calculator state,
// and hands off to window.WEBackend.sendQuoteEmail when the user clicks Send.

function QuoteEmailModal({ input, result, tables, session, onClose, onSent }) {
  const [to, setTo] = React.useState("");
  const [cc, setCc] = React.useState("");
  const [subject, setSubject] = React.useState(() =>
    input.client
      ? `WastEye quote · ${input.client} · ${input.quoteRef}`
      : `WastEye quote · ${input.quoteRef}`
  );
  const [intro, setIntro] = React.useState(() => defaultIntro(input, session));
  const [showPreview, setShowPreview] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState(null); // null | { kind, msg }

  const backendReady = !!(window.WEBackend && window.WEBackend.getUrl());

  const bodyHtml = buildHtmlBody({ input, result, tables, session, intro });

  const trySend = async () => {
    setStatus(null);
    if (!to.trim()) { setStatus({ kind: "err", msg: "Recipient email is required." }); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+/.test(to.trim().split(",")[0])) {
      setStatus({ kind: "err", msg: "That doesn't look like a valid email address." });
      return;
    }
    if (!backendReady) {
      setStatus({ kind: "err", msg: "Backend not connected. Have an admin connect the Sheets backend (Admin → Backend connection) so emails can be sent." });
      return;
    }
    if (session && session.isDemo) {
      setStatus({ kind: "ok", msg: `Demo mode — quote NOT actually sent. Sign in with a Sheets account to email for real.` });
      setBusy(false);
      onSent && onSent({ to, cc, subject });
      setTimeout(() => onClose && onClose(), 1800);
      return;
    }
    setBusy(true);
    try {
      await window.WEBackend.sendQuoteEmail({
        to: to.trim(),
        cc: cc.trim().split(",").map(s => s.trim()).filter(Boolean),
        subject,
        bodyHtml,
        fromName: "Shrunk · WastEye",
        replyTo: session && session.email ? session.email : "",
      });
      setStatus({ kind: "ok", msg: `Quote sent to ${to}.` });
      setBusy(false);
      onSent && onSent({ to, cc, subject });
      setTimeout(() => onClose && onClose(), 1500);
    } catch (e) {
      setStatus({ kind: "err", msg: "Email send failed: " + e.message });
      setBusy(false);
    }
  };

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !busy) onClose && onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  return (
    <>
      <style>{`
        .qem-bg {
          position:fixed; inset:0; background:rgba(10,22,40,0.62);
          backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px);
          z-index:200; display:grid; place-items:center; padding:24px;
          animation:qemFade 0.18s ease-out;
        }
        @keyframes qemFade { from { opacity:0; } to { opacity:1; } }
        @keyframes qemRise { from { opacity:0; transform:translateY(14px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        .qem-box {
          background:#fff; border-radius:14px;
          box-shadow:0 30px 80px -20px rgba(10,22,40,0.5);
          width:min(720px, 100%); max-height:90vh;
          display:flex; flex-direction:column; overflow:hidden;
          animation:qemRise 0.2s cubic-bezier(0.2,0.7,0.3,1);
        }
        .qem-hd { padding:18px 24px; border-bottom:1px solid var(--hair); display:flex; align-items:center; justify-content:space-between; }
        .qem-hd .l { display:flex; align-items:center; gap:10px; }
        .qem-hd .l svg { width:20px; height:20px; color:var(--blue-deep); }
        .qem-hd .ttl { font-family:'Source Serif 4',serif; font-size:18px; font-weight:600; color:var(--ink); }
        .qem-hd .meta { font-size:11px; color:var(--ink-3); font-family:'JetBrains Mono',monospace; }
        .qem-hd .x { width:32px; height:32px; padding:0; background:transparent; border:1px solid var(--hair); border-radius:7px; color:var(--ink-3); cursor:pointer; font-size:17px; line-height:1; }
        .qem-hd .x:hover { background:var(--hair-3); color:var(--ink); }

        .qem-body { flex:1; min-height:0; overflow-y:auto; padding:18px 24px; }
        .qem-row { display:grid; grid-template-columns:80px 1fr; gap:12px; align-items:center; margin-bottom:10px; }
        .qem-row label { font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); font-weight:700; }
        .qem-row input, .qem-row textarea {
          width:100%; box-sizing:border-box;
          padding:9px 12px;
          border:1.5px solid var(--hair); border-radius:7px;
          font:inherit; font-size:13.5px; color:var(--ink); outline:none;
          background:#fff;
        }
        .qem-row textarea { resize:vertical; min-height:90px; line-height:1.55; }
        .qem-row input:focus, .qem-row textarea:focus { border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-tint); }
        .qem-row .hint { font-size:11.5px; color:var(--ink-3); margin-top:3px; }

        .qem-preview {
          margin-top:14px; padding:0; background:var(--hair-3); border:1px solid var(--hair); border-radius:9px;
          overflow:hidden;
        }
        .qem-preview .head {
          padding:9px 13px; background:#fff; border-bottom:1px solid var(--hair);
          font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); font-weight:700;
          display:flex; justify-content:space-between; align-items:center;
        }
        .qem-preview .head button { background:transparent; border:none; color:var(--blue-deep); cursor:pointer; font:inherit; font-size:11.5px; font-weight:600; letter-spacing:0.02em; text-transform:none; }
        .qem-preview .head button:hover { text-decoration:underline; }
        .qem-preview iframe { width:100%; border:none; background:#fff; display:block; }

        .qem-status {
          margin:14px 0 0; padding:10px 13px; border-radius:7px; font-size:13px; display:flex; gap:9px; align-items:center;
        }
        .qem-status svg { width:16px; height:16px; flex-shrink:0; }
        .qem-status.ok  { background:#DCFCE7; color:#15803D; border:1px solid #BBF7D0; }
        .qem-status.err { background:#FEF2F2; color:#991B1B; border:1px solid #FCA5A5; }

        .qem-warn {
          padding:10px 13px; background:#FEF3E2; color:#B85C00; border:1px solid #FCE0AC; border-radius:7px; font-size:12.5px; line-height:1.5; margin-bottom:14px;
        }

        .qem-foot { padding:14px 24px; border-top:1px solid var(--hair); display:flex; align-items:center; justify-content:space-between; gap:10px; background:var(--hair-3); }
        .qem-foot .info { font-size:11.5px; color:var(--ink-3); }
        .qem-foot .info b { color:var(--ink); }
        .qem-foot .actions { display:flex; gap:8px; }
        .qem-btn { padding:10px 18px; font:inherit; font-size:13px; font-weight:600; border-radius:8px; cursor:pointer; letter-spacing:0.02em; display:inline-flex; align-items:center; gap:7px; }
        .qem-btn svg { width:14px; height:14px; }
        .qem-btn.primary { background:var(--ink); color:#fff; border:none; }
        .qem-btn.primary:hover { background:var(--blue-deep); }
        .qem-btn.ghost { background:#fff; color:var(--ink-2); border:1px solid var(--hair); }
        .qem-btn.ghost:hover { background:var(--hair-3); color:var(--ink); }
        .qem-btn:disabled { opacity:0.5; cursor:not-allowed; }

        .qem-spinner { width:13px; height:13px; border-radius:50%; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; animation:qemSpin 0.7s linear infinite; }
        @keyframes qemSpin { to { transform:rotate(360deg); } }
      `}</style>

      <div className="qem-bg" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose && onClose(); }} role="dialog" aria-modal="true">
        <div className="qem-box">
          <div className="qem-hd">
            <div className="l">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>
              <div>
                <div className="ttl">Send quote · {input.client || "Untitled"}</div>
                <div className="meta">{input.quoteRef} · {WEUtil.fmt(result.total)}</div>
              </div>
            </div>
            <button className="x" onClick={onClose} disabled={busy}>×</button>
          </div>

          <div className="qem-body">
            {!backendReady && (
              <div className="qem-warn">
                <b>Backend not connected.</b> Email sending requires the Google Sheets backend. Ask an admin to set it up in Admin → Backend connection.
              </div>
            )}

            <div className="qem-row">
              <label>To</label>
              <div>
                <input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@client.com" autoFocus disabled={busy} />
              </div>
            </div>

            <div className="qem-row">
              <label>CC</label>
              <div>
                <input type="text" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="optional · comma-separated" disabled={busy} />
              </div>
            </div>

            <div className="qem-row">
              <label>Subject</label>
              <div>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={busy} />
              </div>
            </div>

            <div className="qem-row" style={{alignItems:"flex-start"}}>
              <label>Intro</label>
              <div>
                <textarea value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="Personal note that opens the email" rows={4} disabled={busy} />
                <div className="hint">The intro is followed by an auto-generated quote breakdown — see preview below.</div>
              </div>
            </div>

            <div className="qem-preview">
              <div className="head">
                <span>Email preview</span>
                <button onClick={() => setShowPreview(!showPreview)}>{showPreview ? "Hide" : "Show"}</button>
              </div>
              {showPreview && (
                <iframe srcDoc={bodyHtml} sandbox="" style={{height: 480}} title="Email preview" />
              )}
            </div>

            {status && (
              <div className={`qem-status ${status.kind}`}>
                {status.kind === "ok" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                )}
                {status.msg}
              </div>
            )}
          </div>

          <div className="qem-foot">
            <div className="info">
              Sent from <b>{session?.email || "you"}</b> · reply-to your inbox
            </div>
            <div className="actions">
              <button className="qem-btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
              <button className="qem-btn primary" onClick={trySend} disabled={busy}>
                {busy ? (<><span className="qem-spinner"></span>Sending…</>) : (<>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>
                  Send email
                </>)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function defaultIntro(input, session) {
  const greet = input.client ? `Hi ${input.client.split(/[\s,&\/]/)[0]} team,` : "Hi there,";
  return `${greet}

Please find your WastEye audit quote below. The breakdown shows the cameras, deployment duration, and any add-ons we've scoped in.

Quote reference: ${input.quoteRef}
Validity: 30 days from issue.

Happy to walk through any of this — just reply to this email.

${session && session.name ? session.name : ""}
${session && session.title ? session.title : ""}`;
}

function buildHtmlBody({ input, result, tables, session, intro }) {
  const lines = result.lines || [];
  const fmt = (n) => "AUD " + (Math.round(n)).toLocaleString("en-AU");
  const escape = (s) => String(s || "").replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;" }[c]));
  const introHtml = escape(intro).replace(/\n/g, "<br>");

  const lineRows = lines.map(l => `
    <tr style="border-bottom:1px solid #EEF2FA;">
      <td style="padding:8px 0; font-size:13px; color:#0A1628; vertical-align:top;">
        <div style="font-weight:600;">${escape(l.label)}</div>
        <div style="font-size:11.5px; color:#5A6C82; margin-top:2px;">${escape(l.group)} · ${escape(l.detail)}</div>
      </td>
      <td style="padding:8px 0 8px 16px; font-size:13px; color:${l.kind === "discount" ? "#15803D" : "#0A1628"}; text-align:right; vertical-align:top; font-family:'SFMono-Regular',Menlo,Consolas,monospace; font-weight:600; white-space:nowrap;">${fmt(l.amount)}</td>
    </tr>
  `).join("");

  const sitesHtml = (input.sites || []).map((s, i) => `
    <div style="padding:7px 12px; background:#F4F7FB; border-radius:6px; margin-bottom:6px; font-size:12.5px; color:#2A3B52;">
      <b>${escape(s.name || `Site ${i+1}`)}</b>
      <span style="color:#5A6C82;"> · ${(+s.wifi||0)} WiFi + ${(+s.fourg||0)} 4G · ${s.days||14} days · ${escape(s.state||"VIC")} · ${escape(s.mobBand||"CBD")} band</span>
    </div>
  `).join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>WastEye Quote · ${escape(input.client)}</title></head>
<body style="margin:0; padding:24px 0; background:#F4F7FB; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif; color:#0A1628;">
  <table cellspacing="0" cellpadding="0" border="0" style="max-width:640px; margin:0 auto; background:#fff; border-radius:12px; box-shadow:0 12px 30px -10px rgba(10,22,40,0.18); overflow:hidden;">
    <tr><td style="padding:22px 28px; background:#0A1628; color:#fff;">
      <div style="font-size:11px; letter-spacing:0.18em; color:#7FB3F9; font-weight:700; text-transform:uppercase; margin-bottom:6px;">Shrunk · WastEye</div>
      <div style="font-family:Georgia,serif; font-size:22px; font-weight:600; letter-spacing:-0.01em;">Your WastEye quote</div>
      <div style="font-family:'SFMono-Regular',Menlo,Consolas,monospace; font-size:12px; color:rgba(255,255,255,0.6); margin-top:3px;">${escape(input.quoteRef)}</div>
    </td></tr>

    <tr><td style="padding:22px 28px;">
      <div style="font-size:14px; line-height:1.6; color:#2A3B52;">${introHtml}</div>
    </td></tr>

    <tr><td style="padding:0 28px 8px;">
      <div style="font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase; color:#5A6C82; font-weight:700; margin-bottom:8px;">Sites</div>
      ${sitesHtml || '<div style="font-size:12.5px; color:#5A6C82;">—</div>'}
    </td></tr>

    <tr><td style="padding:14px 28px 0;">
      <div style="font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase; color:#5A6C82; font-weight:700; margin-bottom:6px;">Line items</div>
      <table cellspacing="0" cellpadding="0" border="0" style="width:100%;">${lineRows}</table>
    </td></tr>

    <tr><td style="padding:18px 28px 22px;">
      <table cellspacing="0" cellpadding="0" border="0" style="width:100%;">
        <tr>
          <td style="padding:14px 0 0; border-top:2px solid #0A1628;">
            <div style="font-size:11px; letter-spacing:0.18em; color:#5A6C82; font-weight:700; text-transform:uppercase;">Total · ex-GST</div>
          </td>
          <td style="padding:14px 0 0; border-top:2px solid #0A1628; text-align:right; font-family:Georgia,serif; font-size:30px; font-weight:600; letter-spacing:-0.015em; color:#0A1628;">${fmt(result.total)}</td>
        </tr>
      </table>
      <div style="font-size:11.5px; color:#5A6C82; margin-top:6px;">All prices in Australian Dollars, excluding GST · Quote validity 30 days · ${escape(result.meta.band)} report band · ${escape(result.meta.tier)}</div>
    </td></tr>

    <tr><td style="padding:18px 28px 22px; background:#F4F7FB; border-top:1px solid #E5ECF5;">
      <div style="font-size:13px; color:#2A3B52; line-height:1.6;">
        <b>${escape(session?.name || "Shrunk WastEye")}</b> · <a href="mailto:${escape(session?.email||"scott@shrunk.ai")}" style="color:#1F5CD9; text-decoration:none;">${escape(session?.email||"scott@shrunk.ai")}</a><br>
        <span style="color:#5A6C82;">Shrunk Innovation Group · ABN 15 653 930 691 · <a href="https://shrunk.ai" style="color:#5A6C82; text-decoration:none;">shrunk.ai</a></span>
      </div>
    </td></tr>
  </table>
</body></html>`;
}

window.QuoteEmailModal = QuoteEmailModal;
