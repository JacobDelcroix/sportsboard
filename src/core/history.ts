import type { BoardDocument } from './types.js';

const copy = <T>(value: T): T => structuredClone(value);
export class History {
  private past: BoardDocument[] = [];
  private future: BoardDocument[] = [];
  constructor(private limit = 100) {}
  push(snapshot: BoardDocument): void { this.past.push(copy(snapshot)); if (this.past.length > this.limit) this.past.shift(); this.future = []; }
  undo(current: BoardDocument): BoardDocument | undefined { const previous = this.past.pop(); if (!previous) return; this.future.push(copy(current)); return copy(previous); }
  redo(current: BoardDocument): BoardDocument | undefined { const next = this.future.pop(); if (!next) return; this.past.push(copy(current)); return copy(next); }
  clear(): void { this.past = []; this.future = []; }
  get canUndo(): boolean { return this.past.length > 0; }
  get canRedo(): boolean { return this.future.length > 0; }
}
