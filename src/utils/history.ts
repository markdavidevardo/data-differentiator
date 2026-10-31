import type { EmployeeRecord } from './matcher';

export interface HistorySession {
  id: string;
  timestamp: number;
  dateFormatted: string;
  category: 'SSS' | 'PhilHealth' | 'Pag-IBIG' | 'General';
  title: string;
  notes?: string;
  row1Count: number;
  row1TotalAmount: number;
  row2Count: number;
  row2TotalAmount: number;
  netVariance: number;
  identicalCount: number;
  changedCount: number;
  row1OnlyCount: number;
  row2OnlyCount: number;
  row1Records: EmployeeRecord[];
  row2Records: EmployeeRecord[];
  manualPairsMap?: Record<string, string>;
}

const STORAGE_KEY = 'data_differentiator_history_v2';

export function getHistory(): HistorySession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistorySession(
  sessionData: Omit<HistorySession, 'id' | 'timestamp' | 'dateFormatted'>
): HistorySession {
  const current = getHistory();
  const newSession: HistorySession = {
    ...sessionData,
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    dateFormatted: new Date().toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  const updated = [newSession, ...current].slice(0, 50); // Keep last 50 sessions
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save history to localStorage', e);
  }
  return newSession;
}

export function deleteHistorySession(id: string): HistorySession[] {
  const current = getHistory();
  const updated = current.filter(item => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update history', e);
  }
  return updated;
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear history', e);
  }
}
