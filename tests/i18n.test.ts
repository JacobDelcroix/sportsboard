import { describe, expect, it } from 'vitest';
import { resolveEditorMessages } from '../src/editor/i18n.js';
import { resolveViewerMessages } from '../src/viewer/i18n.js';
import { createBasketballEditor } from '../src/sports/basketball/editor.js';
import { createFootballEditor } from '../src/sports/football/editor.js';
import customEditorCatalog from './fixtures/custom-editor.json';

describe('message catalogs', () => {
  it('uses English by default and ships French', () => {
    expect(resolveEditorMessages().save).toBe('Save');
    expect(resolveEditorMessages('fr').save).toBe('Enregistrer');
    expect(resolveEditorMessages('fr').helpTitle).toBe('Aide de l’éditeur');
    expect(resolveViewerMessages('fr').zoomIn).toBe('Agrandir le terrain');
  });

  it('accepts an application-supplied JSON catalog override', () => {
    const messages = resolveEditorMessages('en', customEditorCatalog);
    expect(messages.save).toBe('Store drill');
    expect(messages.notes).toBe('Coach comments');
    expect(messages.undo).toBe('Undo');
  });

  it('localizes sport-owned labels and accepts sport catalog overrides', () => {
    const french = createBasketballEditor('fr', { cone: 'Cône personnalisé' });
    expect(french.surfaces[0].label).toBe('Demi-terrain');
    expect(french.groups[0].label).toBe('Attaquants');
    expect(french.elements.find(tool => tool.id === 'cone')?.label).toBe('Cône personnalisé');

    const football = createFootballEditor('fr', { ball: 'Mon ballon' });
    expect(football.surfaces[0].label).toBe('Demi-terrain');
    expect(football.groups[0].label).toBe('Joueurs');
    expect(football.elements.find(tool => tool.id === 'ball')?.label).toBe('Mon ballon');
  });
});
