export const VIEWER_STYLES = `
.sb-viewer { width:100%; box-sizing:border-box; }
.sb-viewer *, .sb-viewer *::before, .sb-viewer *::after { box-sizing:border-box; }
.sb-viewer__board { width:100%; overflow:hidden; border-radius:inherit; outline:none; }
.sb-canvas { position:relative; width:100%; overflow:hidden; border-radius:inherit; }
.sb-canvas__stage { width:100%; overflow:hidden; border-radius:inherit; outline:none; }
.sb-canvas__viewport-controls { position:absolute; z-index:4; bottom:20px; left:20px; display:flex; align-items:center; gap:3px; padding:4px; border:1px solid rgba(203,213,225,.9); border-radius:11px; background:rgba(255,255,255,.92); box-shadow:0 7px 22px rgba(15,23,42,.18); backdrop-filter:blur(9px); font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
.sb-canvas__viewport-controls button { width:36px; height:36px; display:grid; place-items:center; border:0; border-radius:8px; background:transparent; color:#475569; cursor:pointer; font:800 18px/1 inherit; transition:.14s ease; }
.sb-canvas__viewport-controls button:hover:not(:disabled) { background:#e0edff; color:#1d4ed8; }
.sb-canvas__viewport-controls button:disabled { cursor:not-allowed; opacity:.32; }
.sb-canvas__zoom-value { min-width:58px; color:#334155; font-size:11px; font-weight:850; text-align:center; font-variant-numeric:tabular-nums; }
@media (max-width:760px) { .sb-canvas__viewport-controls { bottom:15px; left:15px; } .sb-canvas__viewport-controls button { width:40px; height:40px; } }
`;

export function mountViewerStyles(): void {
  if (document.getElementById('sportsboard-viewer-styles')) return;
  const style = document.createElement('style');
  style.id = 'sportsboard-viewer-styles';
  style.textContent = VIEWER_STYLES;
  document.head.append(style);
}
