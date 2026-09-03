export const VIEWER_STYLES = `
.sb-viewer { width:100%; box-sizing:border-box; }
.sb-viewer--standalone { height:100%; min-height:0; }
.sb-viewer *, .sb-viewer *::before, .sb-viewer *::after { box-sizing:border-box; }
.sb-viewer__board { width:100%; overflow:hidden; border-radius:inherit; outline:none; }
.sb-viewer--standalone > .sb-viewer__board { height:100%; min-height:0; container-type:size; display:flex; align-items:center; justify-content:center; }
.sb-canvas { --sb-surface-ratio:1; position:relative; width:100%; overflow:hidden; border-radius:inherit; }
.sb-canvas[data-fit="contain"] { width:min(100%,calc(100cqh*var(--sb-surface-ratio))); }
.sb-canvas__stage { width:100%; overflow:hidden; border-radius:inherit; outline:none; }
.sb-canvas__viewport-controls { position:absolute; z-index:4; right:10px; bottom:10px; display:flex; align-items:center; gap:1px; padding:3px; border:1px solid rgba(203,213,225,.9); border-radius:9px; background:rgba(255,255,255,.92); box-shadow:0 5px 16px rgba(15,23,42,.16); backdrop-filter:blur(9px); font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
.sb-canvas__viewport-controls button { width:28px; height:28px; display:grid; place-items:center; border:0; border-radius:6px; background:transparent; color:#475569; cursor:pointer; font:800 15px/1 inherit; transition:.14s ease; }
.sb-canvas__viewport-controls button:hover:not(:disabled) { background:#e0edff; color:#1d4ed8; }
.sb-canvas__viewport-controls button:disabled { cursor:not-allowed; opacity:.32; }
.sb-canvas__zoom-value { min-width:42px; color:#334155; font-size:9px; font-weight:850; text-align:center; font-variant-numeric:tabular-nums; }
@media (max-width:760px) { .sb-canvas__viewport-controls { right:8px; bottom:8px; } .sb-canvas__viewport-controls button { width:32px; height:32px; } }
@media (pointer:coarse) { .sb-canvas__viewport-controls button { width:34px; height:34px; } }
`;

export function mountViewerStyles(): void {
  if (document.getElementById('sportsboard-viewer-styles')) return;
  const style = document.createElement('style');
  style.id = 'sportsboard-viewer-styles';
  style.textContent = VIEWER_STYLES;
  document.head.append(style);
}
