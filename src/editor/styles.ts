export const EDITOR_STYLES = `
.sb-editor { --sb-accent:#2563eb; --sb-accent-bright:#3b82f6; --sb-accent-soft:#dbeafe; --sb-ink:#0f172a; --sb-muted:#64748b; --sb-line:#dbe3ec; --sb-panel:#f8fafc; --sb-workspace:#e8edf3; position:relative; box-sizing:border-box; width:100%; height:100%; min-height:680px; container-type:inline-size; display:flex; flex-direction:column; overflow:hidden; border:1px solid #cbd5e1; border-radius:18px; background:var(--sb-panel); color:var(--sb-ink); box-shadow:0 28px 80px rgba(15,23,42,.24); font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
.sb-editor * { box-sizing:border-box; }
.sb-editor button, .sb-editor input, .sb-editor textarea, .sb-editor select { font:inherit; }
.sb-editor button { cursor:pointer; }
.sb-editor button:focus-visible, .sb-editor input:focus-visible, .sb-editor textarea:focus-visible { outline:3px solid rgba(96,165,250,.45); outline-offset:2px; }
.sb-editor__toolbar { min-height:68px; flex:none; display:flex; align-items:center; gap:12px; padding:11px 16px; border-bottom:1px solid #1e293b; background:#0f172a; color:#fff; }
.sb-editor__surfaces { min-width:0; display:flex; gap:3px; padding:4px; overflow:auto; scrollbar-width:none; border:1px solid #334155; border-radius:11px; background:#172033; }
.sb-editor__surfaces::-webkit-scrollbar { display:none; }
.sb-editor__surface { min-height:36px; border:0; border-radius:7px; padding:8px 13px; background:transparent; color:#94a3b8; font-size:12px; font-weight:750; white-space:nowrap; }
.sb-editor__surface:hover { color:#fff; background:#263449; }
.sb-editor__surface.is-active { background:#fff; color:#1d4ed8; box-shadow:0 2px 9px rgba(0,0,0,.25); }
.sb-editor__actions { display:flex; align-items:center; gap:3px; padding-left:12px; border-left:1px solid #334155; }
.sb-editor__icon-button { width:40px; height:40px; flex:0 0 40px; display:grid; place-items:center; border:0; border-radius:10px; background:transparent; color:#94a3b8; transition:.16s ease; }
.sb-editor__icon-button:hover { background:#253249; color:#fff; }
.sb-editor__icon-button:disabled { cursor:not-allowed; opacity:.35; }
.sb-editor__icon-button svg, .sb-editor__save svg, .sb-editor__mobile-nav svg { width:20px; height:20px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.sb-editor__toolbar-spacer { flex:1; }
.sb-editor__notes-button { position:relative; min-height:40px; display:inline-flex; align-items:center; gap:7px; border:1px solid #334155; border-radius:10px; background:#172033; padding:8px 12px; color:#cbd5e1; font-size:11px; font-weight:800; transition:.16s ease; }
.sb-editor__notes-button:hover { border-color:#475569; background:#253249; color:#fff; }
.sb-editor__notes-button svg { width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.sb-editor__notes-button i { position:absolute; top:5px; right:5px; width:8px; height:8px; display:none; border:2px solid #172033; border-radius:50%; background:#60a5fa; }
.sb-editor__notes-button[data-has-notes="true"] i { display:block; }
.sb-editor__help-button { border:1px solid #334155; }
.sb-editor__save { min-height:40px; display:inline-flex; align-items:center; gap:8px; border:1px solid #60a5fa; border-radius:10px; background:var(--sb-accent); color:#fff; padding:9px 15px; font-size:12px; font-weight:800; box-shadow:0 7px 20px rgba(37,99,235,.34); transition:.16s ease; }
.sb-editor__save:hover { background:#1d4ed8; transform:translateY(-1px); }
.sb-editor__save svg { width:17px; height:17px; }
.sb-editor__body { min-height:0; flex:1; display:grid; grid-template-columns:244px minmax(360px,1fr) 260px; overflow:hidden; background:var(--sb-workspace); }
.sb-editor__toolbox { min-width:0; overflow:auto; overscroll-behavior:contain; padding:20px 14px 26px; border-right:1px solid var(--sb-line); background:#f8fafc; }
.sb-editor__group + .sb-editor__group { margin-top:22px; }
.sb-editor__group-title { margin:0 0 10px 3px; color:#64748b; font-size:10px; font-weight:900; letter-spacing:.14em; text-transform:uppercase; }
.sb-editor__tool-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:6px; }
.sb-editor__group[data-group="objects"] .sb-editor__tool-grid, .sb-editor__group[data-group="equipment"] .sb-editor__tool-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
.sb-editor__tool-list { display:grid; gap:7px; }
.sb-editor__tool { min-width:0; min-height:42px; touch-action:manipulation; border:1px solid #d7e0e9; border-radius:10px; background:#fff; color:#475569; box-shadow:0 1px 2px rgba(15,23,42,.04); transition:.16s ease; }
.sb-editor__tool:hover { z-index:1; border-color:#93c5fd; color:#1d4ed8; box-shadow:0 5px 13px rgba(37,99,235,.1); transform:translateY(-1px); }
.sb-editor__tool:active { transform:scale(.97); }
.sb-editor__tool[draggable="true"] { cursor:grab; }
.sb-editor__tool[draggable="true"]:active { cursor:grabbing; }
.sb-editor__tool.is-dragging { opacity:.48; transform:scale(.95); }
.sb-editor__tool-grid .sb-editor__tool { aspect-ratio:1; display:grid; place-items:center; padding:4px; }
.sb-editor__tool-list .sb-editor__tool { display:flex; align-items:center; gap:10px; width:100%; padding:10px 12px; text-align:left; }
.sb-editor__tool-icon { display:grid; place-items:center; min-width:25px; color:var(--sb-accent); font-size:17px; font-weight:900; }
.sb-editor__tool-label { overflow:hidden; font-size:12px; font-weight:750; text-overflow:ellipsis; white-space:nowrap; }
.sb-editor__tool[data-group="attackers"] .sb-editor__tool-icon, .sb-editor__tool[data-group="players"] .sb-editor__tool-icon { width:28px; height:28px; min-width:28px; border-radius:50%; background:var(--sb-accent); color:#fff; font-size:12px; box-shadow:inset 0 0 0 2px rgba(255,255,255,.86),0 2px 6px rgba(37,99,235,.25); }
.sb-editor__tool[data-group="defenders"] .sb-editor__tool-icon { position:relative; width:24px; height:24px; min-width:24px; border-radius:50%; background:#ef3340; color:#fff; font-size:11px; box-shadow:inset 0 0 0 2px rgba(255,255,255,.88); }
.sb-editor__tool[data-group="defenders"] .sb-editor__tool-icon::before, .sb-editor__tool[data-group="defenders"] .sb-editor__tool-icon::after { content:""; position:absolute; top:8px; width:12px; height:7px; border-top:2px solid #ef3340; border-radius:50%; }
.sb-editor__tool[data-group="defenders"] .sb-editor__tool-icon::before { right:18px; transform:rotate(-18deg); }
.sb-editor__tool[data-group="defenders"] .sb-editor__tool-icon::after { left:18px; transform:rotate(18deg); }
.sb-editor__tool[data-group="attackers"] .sb-editor__tool-label, .sb-editor__tool[data-group="defenders"] .sb-editor__tool-label, .sb-editor__tool[data-group="players"] .sb-editor__tool-label { display:none; }
.sb-editor__tool[data-group="objects"] .sb-editor__tool-label, .sb-editor__tool[data-group="equipment"] .sb-editor__tool-label { max-width:100%; font-size:9px; }
.sb-editor__tool[data-element-type="basketball.ball"] .sb-editor__tool-icon { position:relative; width:23px; height:23px; min-width:23px; overflow:hidden; border:2px solid #431407; border-radius:50%; background:radial-gradient(circle at 30% 24%,#fed7aa 0 8%,#fb923c 28%,#f97316 62%,#9a3412 100%); box-shadow:0 2px 4px rgba(67,20,7,.28); }
.sb-editor__tool[data-element-type="basketball.ball"] .sb-editor__tool-icon::before { content:""; position:absolute; inset:9px -2px auto; height:2px; border-radius:50%; background:#431407; transform:rotate(7deg); }
.sb-editor__tool[data-element-type="basketball.ball"] .sb-editor__tool-icon::after { content:""; position:absolute; inset:-3px 6px; border-right:2px solid #431407; border-left:2px solid #431407; border-radius:50%; transform:rotate(12deg); }
.sb-editor__tool[data-element-type="football.ball"] .sb-editor__tool-icon { position:relative; width:23px; height:23px; min-width:23px; overflow:hidden; border:2px solid #0f172a; border-radius:50%; background:radial-gradient(circle at 30% 24%,#fff 0 18%,#f8fafc 48%,#cbd5e1 100%); box-shadow:0 2px 4px rgba(15,23,42,.25); }
.sb-editor__tool[data-element-type="football.ball"] .sb-editor__tool-icon::before { content:""; position:absolute; top:6px; left:6px; width:8px; height:8px; background:#111827; clip-path:polygon(50% 0,98% 35%,80% 100%,20% 100%,2% 35%); }
.sb-editor__tool[data-element-type="football.ball"] .sb-editor__tool-icon::after { content:""; position:absolute; inset:2px; border:1px solid rgba(15,23,42,.72); border-radius:38% 55% 42% 56%; transform:rotate(32deg); }
.sb-editor__tool[data-element-type="basketball.training-hoop"] .sb-editor__tool-icon { width:25px; height:25px; min-width:25px; border:3px solid #f97316; border-radius:50%; background:transparent; box-shadow:0 0 0 2px #fff,0 2px 5px rgba(15,23,42,.2); }
.sb-editor__tool[data-element-type="basketball.basket"] .sb-editor__tool-icon { position:relative; width:30px; height:25px; min-width:30px; }
.sb-editor__tool[data-element-type="basketball.basket"] .sb-editor__tool-icon::before { content:""; position:absolute; top:5px; left:2px; width:26px; height:5px; border:1px solid #fff; border-radius:999px; background:#475569; box-shadow:0 2px 4px rgba(15,23,42,.2); }
.sb-editor__tool[data-element-type="basketball.basket"] .sb-editor__tool-icon::after { content:""; position:absolute; top:8px; left:9px; width:12px; height:12px; border:3px solid #f97316; border-radius:50%; background:#fff; }
.sb-editor__workspace { min-width:0; min-height:0; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:26px; overflow:auto; overscroll-behavior:contain; background:radial-gradient(circle at 50% 30%,#f8fafc 0,#e8edf3 62%); }
.sb-editor__board-frame { position:relative; width:min(100%,920px); flex:none; padding:9px; overflow:hidden; border:1px solid #d7e0e9; border-radius:15px; background:#fff; box-shadow:0 18px 45px rgba(15,23,42,.17); }
.sb-editor__board-frame.is-drop-target { border-color:#3b82f6; background:#eff6ff; box-shadow:0 0 0 4px rgba(59,130,246,.15),0 18px 45px rgba(15,23,42,.17); }
.sb-editor__board { width:100%; overflow:hidden; border-radius:9px; outline:none; }
.sb-editor__inspector { min-width:0; overflow:auto; overscroll-behavior:contain; padding:20px 16px 26px; border-left:1px solid var(--sb-line); background:#f8fafc; }
.sb-editor__section + .sb-editor__section { margin-top:20px; padding-top:20px; border-top:1px solid var(--sb-line); }
.sb-editor__section-title { margin:0 0 10px 2px; color:#64748b; font-size:10px; font-weight:900; letter-spacing:.14em; text-transform:uppercase; }
.sb-editor__secondary-button { width:100%; min-height:42px; border:1px solid #bfdbfe; border-radius:9px; background:#eff6ff; padding:9px 11px; color:#1d4ed8; font-size:11px; font-weight:800; transition:.15s ease; }
.sb-editor__secondary-button:hover { border-color:#60a5fa; background:#dbeafe; }
.sb-editor__fields { display:grid; gap:10px; margin:0; padding:0; border:0; }
.sb-editor__fields:disabled { opacity:.42; }
.sb-editor__field span { display:block; margin-bottom:5px; color:#64748b; font-size:10px; font-weight:800; }
.sb-editor__field input { width:100%; border:1px solid #d7e0e9; border-radius:9px; background:#fff; padding:10px; color:var(--sb-ink); outline:none; }
.sb-editor__field input:focus { border-color:#60a5fa; box-shadow:0 0 0 3px rgba(59,130,246,.12); }
.sb-editor__color-picker { display:grid; gap:10px; padding:10px; border:1px solid #d7e0e9; border-radius:10px; background:#fff; }
.sb-editor__color-section { display:grid; gap:6px; }
.sb-editor__color-section small { color:#94a3b8; font-size:8px; font-weight:900; letter-spacing:.1em; text-transform:uppercase; }
.sb-editor__color-list { display:flex; flex-wrap:wrap; gap:7px; }
.sb-editor__color { position:relative; width:28px; height:28px; flex:0 0 28px; border:2px solid #fff; border-radius:8px; background:var(--sb-color); box-shadow:0 0 0 1px #cbd5e1; transition:.14s ease; }
.sb-editor__color:hover { transform:scale(1.1); box-shadow:0 0 0 2px #93c5fd; }
.sb-editor__color.is-active { box-shadow:0 0 0 2px #2563eb,0 3px 8px rgba(37,99,235,.25); transform:scale(1.05); }
.sb-editor__color.is-active::after { content:"✓"; position:absolute; inset:0; display:grid; place-items:center; color:#fff; font-size:11px; font-weight:1000; text-shadow:0 1px 3px rgba(0,0,0,.8); }
.sb-editor__hint { margin:8px 0 0; color:#94a3b8; font-size:10px; line-height:1.45; }
.sb-editor__mobile-nav { display:none; }
.sb-editor__toast { position:absolute; z-index:12; top:78px; left:50%; max-width:min(90%,420px); transform:translateX(-50%); border:1px solid #cbd5e1; border-radius:999px; background:rgba(255,255,255,.96); padding:9px 14px; color:#334155; box-shadow:0 10px 30px rgba(15,23,42,.22); backdrop-filter:blur(10px); font-size:11px; font-weight:750; text-align:center; }
.sb-editor__toast[data-tone="success"] { border-color:#86efac; color:#166534; }
.sb-editor__toast[data-tone="error"] { border-color:#fca5a5; color:#991b1b; }
.sb-editor__notes-overlay { position:absolute; z-index:18; inset:0; display:flex; justify-content:flex-end; overflow:hidden; }
.sb-editor__notes-overlay[hidden] { display:none; }
.sb-editor__notes-backdrop { position:absolute; inset:0; width:100%; height:100%; border:0; border-radius:0; background:rgba(15,23,42,.44); padding:0; cursor:default; backdrop-filter:blur(2px); }
.sb-editor__notes-drawer { position:relative; width:min(430px,100%); height:100%; display:flex; flex-direction:column; border-left:1px solid #cbd5e1; background:#f8fafc; box-shadow:-22px 0 60px rgba(15,23,42,.25); animation:sb-notes-enter .2s ease-out; }
.sb-editor__notes-drawer > header { min-height:72px; flex:none; display:flex; align-items:center; justify-content:space-between; gap:20px; border-bottom:1px solid #e2e8f0; background:#fff; padding:14px 18px 14px 22px; }
.sb-editor__notes-drawer h2 { margin:0; font-size:21px; letter-spacing:-.03em; }
.sb-editor__notes-drawer header .sb-editor__icon-button { border:1px solid #e2e8f0; color:#64748b; }
.sb-editor__notes-drawer header .sb-editor__icon-button:hover { background:#f1f5f9; color:#0f172a; }
.sb-editor__notes-content { min-height:0; flex:1; display:flex; padding:20px; }
.sb-editor__notes { width:100%; min-height:100%; resize:none; border:1px solid #cbd5e1; border-radius:14px; background:#fff; padding:18px; color:var(--sb-ink); outline:none; box-shadow:0 3px 14px rgba(15,23,42,.05); font-size:15px; line-height:1.7; }
.sb-editor__notes::placeholder { color:#94a3b8; }
.sb-editor__notes:focus { border-color:#60a5fa; box-shadow:0 0 0 4px rgba(59,130,246,.12),0 8px 24px rgba(15,23,42,.08); }
.sb-editor__notes-drawer footer { min-height:52px; flex:none; display:flex; align-items:center; gap:8px; border-top:1px solid #e2e8f0; background:#fff; padding:12px 22px; color:#64748b; font-size:10px; font-weight:700; }
.sb-editor__notes-drawer footer i { width:8px; height:8px; border-radius:50%; background:#22c55e; box-shadow:0 0 0 3px #dcfce7; }
@keyframes sb-notes-enter { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }
.sb-editor__help { width:min(820px,calc(100% - 32px)); max-height:calc(100% - 32px); margin:auto; overflow:auto; border:0; border-radius:20px; padding:0; background:transparent; color:var(--sb-ink); box-shadow:0 30px 90px rgba(15,23,42,.42); }
.sb-editor__help::backdrop { background:rgba(15,23,42,.68); backdrop-filter:blur(4px); }
.sb-editor__help-card { border:1px solid #dbe3ec; border-radius:20px; background:#fff; padding:24px; }
.sb-editor__help-card > header { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; }
.sb-editor__help-card header .sb-editor__icon-button { border:1px solid #e2e8f0; color:#64748b; }
.sb-editor__help-card header .sb-editor__icon-button:hover { background:#f1f5f9; color:#0f172a; }
.sb-editor__help-eyebrow { display:block; margin-bottom:4px; color:#2563eb; font-size:9px; font-weight:900; letter-spacing:.14em; text-transform:uppercase; }
.sb-editor__help h2 { margin:0; font-size:24px; letter-spacing:-.035em; }
.sb-editor__help-intro { margin:9px 0 22px; color:#64748b; font-size:13px; line-height:1.55; }
.sb-editor__help-grid { display:grid; grid-template-columns:minmax(0,.9fr) minmax(320px,1.1fr); gap:24px; }
.sb-editor__help h3 { margin:0 0 11px; color:#334155; font-size:11px; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }
.sb-editor__help ul { display:grid; gap:10px; margin:0; padding-left:20px; color:#475569; font-size:12px; line-height:1.5; }
.sb-editor__help dl { display:grid; gap:6px; margin:0; }
.sb-editor__help dl > div { min-height:38px; display:flex; align-items:center; justify-content:space-between; gap:16px; border-bottom:1px solid #eef2f7; padding:4px 0; }
.sb-editor__help dt { flex:none; display:flex; align-items:center; gap:4px; }
.sb-editor__help dt b { color:#94a3b8; font-size:9px; }
.sb-editor__help kbd { min-width:25px; min-height:25px; display:inline-grid; place-items:center; border:1px solid #cbd5e1; border-bottom-width:2px; border-radius:6px; background:#f8fafc; padding:3px 6px; color:#334155; font:800 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace; }
.sb-editor__help dd { margin:0; color:#475569; font-size:11px; text-align:right; }

@container (max-width:1180px) {
  .sb-editor__body { grid-template-columns:220px minmax(340px,1fr); grid-template-rows:minmax(360px,1fr) auto; }
  .sb-editor__toolbox { grid-column:1; grid-row:1; }
  .sb-editor__workspace { grid-column:2; grid-row:1; padding:18px; }
  .sb-editor__inspector { grid-column:1/-1; grid-row:2; max-height:230px; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; border-top:1px solid var(--sb-line); border-left:0; padding:15px 18px; }
  .sb-editor__section + .sb-editor__section { margin:0; padding:0; border:0; }
}

@container (max-width:1024px) {
  .sb-editor__toolbar { gap:8px; padding:9px 10px; }
  .sb-editor__actions { gap:1px; padding-left:7px; }
  .sb-editor__icon-button { width:42px; height:42px; flex-basis:42px; }
  .sb-editor__body { display:block; position:relative; overflow:hidden; }
  .sb-editor__toolbox, .sb-editor__workspace, .sb-editor__inspector { display:none; width:100%; height:100%; max-height:none; border:0; }
  .sb-editor[data-mobile-panel="tools"] .sb-editor__toolbox { display:block; padding:18px 18px 90px; }
  .sb-editor[data-mobile-panel="board"] .sb-editor__workspace { display:flex; padding:16px 12px 86px; }
  .sb-editor[data-mobile-panel="inspector"] .sb-editor__inspector { display:block; padding:18px 18px 90px; }
  .sb-editor__tool-grid { grid-template-columns:repeat(5,minmax(58px,1fr)); gap:9px; }
  .sb-editor__group[data-group="objects"] .sb-editor__tool-grid, .sb-editor__group[data-group="equipment"] .sb-editor__tool-grid { grid-template-columns:repeat(4,minmax(74px,1fr)); }
  .sb-editor__tool-list { grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; }
  .sb-editor__tool-grid .sb-editor__tool { min-height:62px; aspect-ratio:auto; }
  .sb-editor__tool-list .sb-editor__tool { min-height:48px; }
  .sb-editor__tool[data-group="objects"] .sb-editor__tool-label, .sb-editor__tool[data-group="equipment"] .sb-editor__tool-label { font-size:11px; }
  .sb-editor__mobile-nav { position:absolute; z-index:10; right:12px; bottom:10px; left:12px; display:grid; grid-template-columns:repeat(3,1fr); gap:4px; border:1px solid rgba(203,213,225,.9); border-radius:16px; background:rgba(255,255,255,.95); padding:5px; box-shadow:0 12px 38px rgba(15,23,42,.25); backdrop-filter:blur(12px); }
  .sb-editor__mobile-nav button { position:relative; min-height:49px; display:flex; align-items:center; justify-content:center; gap:7px; border:0; border-radius:11px; background:transparent; color:#64748b; font-size:11px; font-weight:800; }
  .sb-editor__mobile-nav button.is-active { background:#dbeafe; color:#1d4ed8; }
  .sb-editor__mobile-nav button i { position:absolute; top:7px; right:calc(50% - 30px); width:7px; height:7px; display:none; border:2px solid #fff; border-radius:50%; background:#2563eb; }
  .sb-editor[data-has-selection="true"] .sb-editor__mobile-nav [data-panel="inspector"] i { display:block; }
  .sb-editor__toast { top:72px; }
}

@container (max-width:680px) {
  .sb-editor { border-radius:12px; }
  .sb-editor__toolbar { min-height:112px; flex-wrap:wrap; align-content:center; }
  .sb-editor__surfaces { order:5; width:100%; }
  .sb-editor__surface { flex:1; }
  .sb-editor__toolbar-spacer { display:none; }
  .sb-editor__notes-button { width:42px; min-width:42px; padding:0; justify-content:center; }
  .sb-editor__notes-button span { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
  .sb-editor__notes-button { margin-left:auto; }
  .sb-editor__workspace { justify-content:flex-start; }
  .sb-editor__board-frame { padding:5px; border-radius:11px; }
  .sb-editor__tool-grid { grid-template-columns:repeat(5,minmax(48px,1fr)); }
  .sb-editor__group[data-group="objects"] .sb-editor__tool-grid, .sb-editor__group[data-group="equipment"] .sb-editor__tool-grid { grid-template-columns:repeat(3,minmax(72px,1fr)); }
  .sb-editor__help { width:calc(100% - 16px); max-height:calc(100% - 16px); border-radius:16px; }
  .sb-editor__help-card { padding:18px 15px; border-radius:16px; }
  .sb-editor__help-grid { grid-template-columns:1fr; gap:22px; }
  .sb-editor__help h2 { font-size:21px; }
  .sb-editor__notes-drawer { width:100%; border-left:0; }
  .sb-editor__notes-drawer > header { min-height:64px; padding:11px 12px 11px 18px; }
  .sb-editor__notes-content { padding:12px; }
  .sb-editor__notes { border-radius:12px; padding:15px; font-size:16px; }
  .sb-editor__notes-drawer footer { padding:11px 17px; }
}

@container (max-width:460px) {
  .sb-editor__toolbar { gap:5px; padding:8px; }
  .sb-editor__actions { padding-left:4px; }
  .sb-editor__icon-button { width:38px; height:38px; flex-basis:38px; }
  .sb-editor__notes-button { width:38px; min-width:38px; height:38px; min-height:38px; }
  .sb-editor__save { width:38px; padding:0; justify-content:center; }
  .sb-editor__save span { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
  .sb-editor__mobile-nav { right:8px; bottom:8px; left:8px; }
  .sb-editor__mobile-nav button { gap:5px; font-size:10px; }
  .sb-editor__tool-list { grid-template-columns:1fr; }
  .sb-editor__tool-grid { grid-template-columns:repeat(4,minmax(48px,1fr)); }
  .sb-editor__group[data-group="objects"] .sb-editor__tool-grid, .sb-editor__group[data-group="equipment"] .sb-editor__tool-grid { grid-template-columns:repeat(3,minmax(68px,1fr)); }
  .sb-editor__help dl > div { align-items:flex-start; flex-direction:column; gap:5px; padding:7px 0; }
  .sb-editor__help dd { text-align:left; }
}

@media (pointer:coarse) {
  .sb-editor__tool:hover, .sb-editor__save:hover { transform:none; }
  .sb-editor__color { width:34px; height:34px; flex-basis:34px; }
}
`;

export function mountEditorStyles(): void {
  if (document.getElementById('sportsboard-editor-styles')) return;
  const style = document.createElement('style');
  style.id = 'sportsboard-editor-styles';
  style.textContent = EDITOR_STYLES;
  document.head.append(style);
}
