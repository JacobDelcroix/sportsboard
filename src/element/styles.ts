const ELEMENT_STYLES = `
:where(sports-board-editor, sports-board-viewer) {
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

:where(sports-board-editor) > .sb-editor,
:where(sports-board-viewer) > .sb-viewer {
  width: 100%;
  height: 100%;
}
`;

export function mountElementStyles(): void {
  if (document.getElementById('sportsboard-element-styles')) return;
  const style = document.createElement('style');
  style.id = 'sportsboard-element-styles';
  style.textContent = ELEMENT_STYLES;
  document.head.append(style);
}
