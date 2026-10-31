import type { DataEntry } from './matcher';
import type { HistorySession } from './history';

export type AppTheme = 'system' | 'light' | 'dark';

export interface AppBackupData {
  version: string;
  exportedAt: string;
  row1: DataEntry[];
  row2: DataEntry[];
  rejectedPairs: string[];
  entryLabel: string;
  historyList: HistorySession[];
  theme?: AppTheme;
}

export const STORAGE_PREFIX = 'data_differentiator_';
const THEMES: AppTheme[] = ['system', 'light', 'dark'];

let idCounter = 0;
const newId = () => `restored_${Date.now()}_${idCounter++}`;

function toEntries(value: unknown): DataEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const raw = item as Record<string, unknown>;
    const name = typeof raw.name === 'string' ? raw.name : '';
    const amount = Number(raw.contribution ?? raw.value ?? 0);
    if (!name.trim()) return [];
    return [{
      ...(raw as Partial<DataEntry>),
      id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
      name,
      contribution: Number.isFinite(amount) ? amount : 0,
    }];
  });
}

function toHistory(value: unknown): HistorySession[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (s): s is HistorySession =>
      !!s && typeof s === 'object' && typeof s.id === 'string' && typeof s.timestamp === 'number'
  ).map(s => ({ ...s, row1Records: toEntries(s.row1Records), row2Records: toEntries(s.row2Records) }));
}

// Throws with a readable message when the file is not a usable backup.
export function parseBackup(text: string): AppBackupData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('This file is not a Data Differentiator backup.');
  }
  const data = parsed as Record<string, unknown>;
  if (!('row1' in data) && !('row2' in data) && !('historyList' in data)) {
    throw new Error('This file is not a Data Differentiator backup.');
  }
  const theme = THEMES.includes(data.theme as AppTheme) ? (data.theme as AppTheme) : undefined;
  return {
    version: String(data.version ?? '1'),
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : new Date().toISOString(),
    row1: toEntries(data.row1),
    row2: toEntries(data.row2),
    rejectedPairs: Array.isArray(data.rejectedPairs) ? data.rejectedPairs.filter(k => typeof k === 'string') : [],
    entryLabel: typeof data.entryLabel === 'string' ? data.entryLabel : '',
    historyList: toHistory(data.historyList),
    theme,
  };
}

export function downloadJson(fileName: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function clearStoredAppData(storage: Storage = localStorage) {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  keys.forEach(key => storage.removeItem(key));
}
