// In-app confirmation dialog. Mounted at app root by portal-app.jsx.
// Usage: window.appConfirm("Message", () => doStuff());
//        window.appConfirm({ title, message, confirmLabel, cancelLabel, destructive }, onConfirm);

(function () {
  const listeners = new Set();
  let currentRequest = null;

  function appConfirm(opts, onConfirm) {
    if (typeof opts === "string") opts = { message: opts };
    currentRequest = {
      ...opts,
      onConfirm: () => { try { onConfirm && onConfirm(); } finally {} },
    };
    listeners.forEach(fn => fn(currentRequest));
  }
  appConfirm._listeners = listeners;
  appConfirm._consume = () => { const r = currentRequest; currentRequest = null; return r; };

  window.appConfirm = appConfirm;
})();
