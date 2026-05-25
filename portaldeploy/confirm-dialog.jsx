// Confirm dialog React component — listens for window.appConfirm requests.

function AppConfirmDialog() {
  const [req, setReq] = React.useState(null);

  React.useEffect(() => {
    const onReq = (r) => setReq(r);
    if (window.appConfirm) {
      window.appConfirm._listeners.add(onReq);
      return () => window.appConfirm._listeners.delete(onReq);
    }
  }, []);

  if (!req) return null;

  const close = () => setReq(null);
  const onYes = () => { req.onConfirm && req.onConfirm(); close(); };

  const destructive = !!req.destructive;
  const confirmLabel = req.confirmLabel || (destructive ? "Delete" : "Confirm");
  const cancelLabel = req.cancelLabel || "Cancel";
  const title = req.title || (destructive ? "Are you sure?" : "Confirm");

  return (
    <>
      <style>{`
        .acd-bg {
          position:fixed; inset:0;
          background:rgba(10,22,40,0.6);
          backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px);
          z-index:200;
          display:grid; place-items:center;
          padding:20px;
          animation:acdFade 0.15s ease-out;
        }
        @keyframes acdFade { from { opacity:0; } to { opacity:1; } }
        @keyframes acdRise { from { opacity:0; transform:translateY(10px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        .acd-modal {
          background:#fff; border-radius:14px;
          box-shadow:0 30px 80px -20px rgba(10,22,40,0.5);
          max-width:440px; width:100%;
          overflow:hidden;
          animation:acdRise 0.18s cubic-bezier(0.2,0.7,0.3,1);
        }
        .acd-icon {
          width:48px; height:48px; border-radius:50%;
          display:grid; place-items:center;
          margin:24px auto 0;
          background:#FEF2F2; color:#B91C1C;
        }
        .acd-icon.normal { background:#E4EDFB; color:#0F3FA8; }
        .acd-icon svg { width:24px; height:24px; }

        .acd-body { padding:18px 28px 24px; text-align:center; }
        .acd-title {
          font-family:'Source Serif 4',serif; font-size:20px; font-weight:600;
          color:#0A1628; margin:0 0 8px; letter-spacing:-0.005em;
        }
        .acd-msg {
          font-size:14px; line-height:1.55; color:#5A6C82;
          margin:0;
        }
        .acd-actions {
          display:flex; gap:10px; padding:0 24px 24px;
        }
        .acd-btn {
          flex:1; padding:11px 16px;
          font:inherit; font-size:13.5px; font-weight:600;
          letter-spacing:0.02em; cursor:pointer;
          border-radius:8px;
          transition:background 0.15s, transform 0.05s;
        }
        .acd-btn:active { transform:translateY(1px); }
        .acd-btn.cancel {
          background:#fff; color:#2A3B52;
          border:1px solid #D5DEEC;
        }
        .acd-btn.cancel:hover { background:#F4F7FB; }
        .acd-btn.confirm {
          background:#0A1628; color:#fff;
          border:1px solid #0A1628;
        }
        .acd-btn.confirm:hover { background:#0F3FA8; }
        .acd-btn.confirm.destructive {
          background:#B91C1C; border-color:#B91C1C;
        }
        .acd-btn.confirm.destructive:hover { background:#991B1B; }
      `}</style>
      <div className="acd-bg" onClick={(e) => { if (e.target === e.currentTarget) close(); }} role="dialog" aria-modal="true">
        <div className="acd-modal">
          <div className={`acd-icon ${destructive ? "" : "normal"}`}>
            {destructive ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            )}
          </div>
          <div className="acd-body">
            <h3 className="acd-title">{title}</h3>
            <p className="acd-msg">{req.message}</p>
          </div>
          <div className="acd-actions">
            <button className="acd-btn cancel" autoFocus onClick={close}>{cancelLabel}</button>
            <button className={`acd-btn confirm ${destructive ? "destructive" : ""}`} onClick={onYes}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </>
  );
}

window.AppConfirmDialog = AppConfirmDialog;
