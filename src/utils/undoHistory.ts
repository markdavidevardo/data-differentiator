import type { DataEntry } from './matcher';

export interface WorkspaceSnapshot {
  row1: DataEntry[];
  row2: DataEntry[];
  rejectedPairs: string[];
  /** Dataset A id -> Dataset B id links the user made by hand. */
  manualPairs?: Record<string, string>;
}

export interface UndoEntry {
  label: string;
  snapshot: WorkspaceSnapshot;
  at: number;
}

export interface UndoState {
  past: UndoEntry[];
  future: UndoEntry[];
}

export const UNDO_LIMIT = 50;
const MERGE_WINDOW_MS = 1500;

export const emptyUndoState = (): UndoState => ({ past: [], future: [] });

// Stores the state from *before* an action. Rapid repeats of the same action
// (typing in a cell) collapse into one step so a single undo reverts them all.
export function recordChange(
  state: UndoState,
  before: WorkspaceSnapshot,
  label: string,
  now = Date.now()
): UndoState {
  const last = state.past[state.past.length - 1];
  if (last && last.label === label && now - last.at < MERGE_WINDOW_MS) {
    const past = [...state.past];
    past[past.length - 1] = { ...last, at: now };
    return { past, future: [] };
  }
  const past = [...state.past, { label, snapshot: before, at: now }].slice(-UNDO_LIMIT);
  return { past, future: [] };
}

export interface StepResult {
  state: UndoState;
  restore: WorkspaceSnapshot;
  label: string;
}

export function undoStep(state: UndoState, current: WorkspaceSnapshot, now = Date.now()): StepResult | null {
  const entry = state.past[state.past.length - 1];
  if (!entry) return null;
  return {
    state: {
      past: state.past.slice(0, -1),
      future: [{ label: entry.label, snapshot: current, at: now }, ...state.future].slice(0, UNDO_LIMIT),
    },
    restore: entry.snapshot,
    label: entry.label,
  };
}

export function redoStep(state: UndoState, current: WorkspaceSnapshot, now = Date.now()): StepResult | null {
  const entry = state.future[0];
  if (!entry) return null;
  return {
    state: {
      // `at: 0` keeps a redone step from merging with the next edit.
      past: [...state.past, { label: entry.label, snapshot: current, at: 0 }].slice(-UNDO_LIMIT),
      future: state.future.slice(1),
    },
    restore: entry.snapshot,
    label: entry.label,
  };
}

const plural = (n: number) => `${n} ${n === 1 ? 'entry' : 'entries'}`;

export function describeListChange(dataset: string, before: DataEntry[], after: DataEntry[]): string {
  if (after.length === 0 && before.length > 0) return `Cleared ${dataset}`;
  if (after.length > before.length) return `Added ${plural(after.length - before.length)} to ${dataset}`;
  if (after.length < before.length) return `Removed ${plural(before.length - after.length)} from ${dataset}`;
  return `Edited ${dataset}`;
}
