import type { ElementDefinition, SurfaceDefinition } from './types.js';

export class Registry {
  private elements = new Map<string, ElementDefinition>();
  private surfaces = new Map<string, SurfaceDefinition>();
  registerElement(type: string, definition: ElementDefinition): this { this.elements.set(type, definition); return this; }
  registerSurface(type: string, definition: SurfaceDefinition): this { this.surfaces.set(type, definition); return this; }
  getElement(type: string): ElementDefinition { const value = this.elements.get(type); if (!value) throw new Error(`Unknown element type: ${type}`); return value; }
  getSurface(type: string): SurfaceDefinition { const value = this.surfaces.get(type); if (!value) throw new Error(`Unknown surface type: ${type}`); return value; }
}
