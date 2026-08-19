import { describe, expect, it } from 'vitest';
import {
  defineSportsBoardEditorElement,
  defineSportsBoardViewerElement,
  SportsBoardEditorElement,
  SportsBoardViewerElement
} from '../src/element/index.js';

describe('custom element entry point', () => {
  it('can be imported during server-side rendering without a DOM', () => {
    expect(typeof SportsBoardEditorElement).toBe('function');
    expect(typeof SportsBoardViewerElement).toBe('function');
  });

  it('reports when registration is requested without a custom element registry', () => {
    expect(() => defineSportsBoardEditorElement()).toThrow('Custom elements are not available');
    expect(() => defineSportsBoardViewerElement()).toThrow('Custom elements are not available');
  });
});
