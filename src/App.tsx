/**
 * Data Differentiator
 * SPDX-License-Identifier: Apache-2.0
 * Copyright (c) Mark David Evardo
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightLeft, AlertTriangle, ClipboardPaste, Download, LayoutDashboard, History, Trash2, Settings, Moon, Sun, Table2, X } from 'lucide-react';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { SummaryCards } from './components/SummaryCards';
import { DiffTable } from './components/DiffTable';
import { RowDataEditor } from './components/RowDataEditor';
import { BulkImportModal } from './components/BulkImportModal';
import { EditPairModal } from './components/EditPairModal';
import { PrintReportView } from './components/PrintReportView';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { ManualMatchModal } from './components/ManualMatchModal';
import { ActionToast, type ToastMessage } from './components/ActionToast';
import { Button } from './components/ui/Button';
import { DataEntry, MatchedPair, differentiateGroups, normalizeName } from './utils/matcher';
import { getHistory, saveHistorySession, HistorySession } from './utils/history';
import { AppBackupData, AppTheme, clearStoredAppData } from './utils/backup';
import { changeThemeSmoothly } from './utils/themeTransition';
import {
  WorkspaceSnapshot,
  describeListChange,
  emptyUndoState,
  recordChange,
  redoStep,
  undoStep,
} from './utils/undoHistory';

type Tab = 'diff' | 'editor' | 'report';

const KEYS = {
  row1: 'data_differentiator_row1',
  row2: 'data_differentiator_row2',
  rejected: 'data_differentiator_rejected_pairs',
  manual: 'data_differentiator_manual_pairs',
  theme: 'data_differentiator_theme',
  history: 'data_differentiator_history_v2',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

const loadWorkspace = (): WorkspaceSnapshot => ({
  row1: readJson<DataEntry[]>(KEYS.row1, []),
  row2: readJson<DataEntry[]>(KEYS.row2, []),
  rejectedPairs: readJson<string[]>(KEYS.rejected, []),
  manualPairs: readJson<Record<string, string>>(KEYS.manual, {}),
});

const quote = (name?: string) => `“${(name || '').trim() || 'Untitled'}”`;

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(loadWorkspace);
  const { row1, row2, rejectedPairs } = workspace;
  const manualPairs = workspace.manualPairs ?? {};
  const [undo, setUndo] = useState(emptyUndoState);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [entryLabel, setEntryLabel] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('diff');
  const [visitedTabs, setVisitedTabs] = useState(() => new Set<Tab>(['diff']));
  const [activeFilter, setActiveFilter] = useState('ALL');
  const tabScroll = useRef<Record<string, number>>({});

  const [historyList, setHistoryList] = useState<HistorySession[]>(() => getHistory());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<MatchedPair | null>(null);
  const [matchingPair, setMatchingPair] = useState<MatchedPair | null>(null);
  const [bulkImportTarget, setBulkImportTarget] = useState<'row1' | 'row2' | null>(null);
  const [theme, setTheme] = useState<AppTheme>(
    () => (localStorage.getItem(KEYS.theme) as AppTheme) || 'system'
  );

  // Theme changes made by the user (toggle button, Settings) animate as one smooth reveal.
  const changeTheme = useCallback((next: AppTheme) => {
    const root = document.documentElement;
    const willBeDark =
      next === 'dark' || (next === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    changeThemeSmoothly(() => {
      root.classList.toggle('dark', willBeDark);
      setTheme(next);
    }, root.classList.contains('dark') !== willBeDark);
  }, []);

  const switchTab = (tab: Tab) => {
    const scroll = document.getElementById('app-scroll');
    if (scroll) tabScroll.current[activeTab] = scroll.scrollTop;
    setVisitedTabs(prev => new Set([...prev, tab]));
    setActiveTab(tab);
    requestAnimationFrame(() => {
      if (scroll) scroll.scrollTop = tabScroll.current[tab] || 0;
    });
  };

  const dismissToast = useCallback(() => setToast(null), []);
  const showToast = (message: Omit<ToastMessage, 'id'>) => setToast({ ...message, id: Date.now() });

  // Every change to the datasets or "not match" list goes through here so it can be undone.
  const commit = (next: Partial<WorkspaceSnapshot>, label: string, announce = false) => {
    setUndo(prev => recordChange(prev, workspace, label));
    setWorkspace(prev => ({ ...prev, ...next }));
    if (announce) showToast({ kind: 'action', text: label });
  };

  const handleUndo = useCallback(() => {
    const step = undoStep(undo, workspace);
    if (!step) {
      showToast({ kind: 'info', text: 'Nothing to undo' });
      return;
    }
    setUndo(step.state);
    setWorkspace(step.restore);
    showToast({ kind: 'undo', text: step.label, remaining: step.state.past.length });
  }, [undo, workspace]);

  const handleRedo = useCallback(() => {
    const step = redoStep(undo, workspace);
    if (!step) {
      showToast({ kind: 'info', text: 'Nothing to redo' });
      return;
    }
    setUndo(step.state);
    setWorkspace(step.restore);
    showToast({ kind: 'redo', text: step.label, remaining: step.state.future.length });
  }, [undo, workspace]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  useEffect(() => {
    localStorage.setItem(KEYS.theme, theme);
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => root.classList.toggle('dark', theme === 'dark' || (theme === 'system' && media.matches));
    apply();
    if (theme !== 'system') return;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  // Saving is debounced while editing and flushed when the window closes.
  useEffect(() => {
    const persist = () => {
      try {
        localStorage.setItem(KEYS.row1, JSON.stringify(row1));
        localStorage.setItem(KEYS.row2, JSON.stringify(row2));
        localStorage.setItem(KEYS.rejected, JSON.stringify(rejectedPairs));
        localStorage.setItem(KEYS.manual, JSON.stringify(manualPairs));
      } catch (error) {
        console.error('Workspace save failed', error);
      }
    };
    const timer = window.setTimeout(persist, 250);
    window.addEventListener('pagehide', persist);
    window.addEventListener('beforeunload', persist);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pagehide', persist);
      window.removeEventListener('beforeunload', persist);
    };
  }, [row1, row2, rejectedPairs, manualPairs]);

  const { pairs, summary } = useMemo(
    () => differentiateGroups(row1, row2, { minDistinctTokens: 2, minScoreThreshold: 65, rejectedPairs, manualPairs }),
    [row1, row2, rejectedPairs, manualPairs]
  );

  const refreshHistory = () => setHistoryList(getHistory());

  const handleBulkImport = (records: DataEntry[], target: 'row1' | 'row2', mode: 'append' | 'replace') => {
    const dataset = target === 'row1' ? 'Dataset A' : 'Dataset B';
    const current = workspace[target];
    const next = mode === 'append' ? [...current, ...records] : records;
    const label = mode === 'append'
      ? `Pasted ${records.length} ${records.length === 1 ? 'entry' : 'entries'} into ${dataset}`
      : `Replaced ${dataset} with ${records.length} ${records.length === 1 ? 'entry' : 'entries'}`;
    commit({ [target]: next }, label, true);
  };

  const handleUnmatchPair = (pair: MatchedPair) => {
    if (!pair.row1Record || !pair.row2Record) return;
    const idKey = `${pair.row1Record.id}:::${pair.row2Record.id}`;
    const nameKey = `${normalizeName(pair.row1Record.name)}:::${normalizeName(pair.row2Record.name)}`;
    const next = [...new Set([...rejectedPairs, idKey, nameKey])];
    const nextManual = { ...manualPairs };
    if (nextManual[pair.row1Record.id] === pair.row2Record.id) delete nextManual[pair.row1Record.id];
    commit(
      { rejectedPairs: next, manualPairs: nextManual },
      `Marked ${quote(pair.row1Record.name)} and ${quote(pair.row2Record.name)} as not a match`,
      true
    );
  };

  const handleManualMatch = (source: MatchedPair, target: DataEntry) => {
    const a = source.row1Record ?? target;
    const b = source.row2Record ?? target;
    const idKey = `${a.id}:::${b.id}`;
    const nameKey = `${normalizeName(a.name)}:::${normalizeName(b.name)}`;
    const nextManual = Object.fromEntries(
      Object.entries(manualPairs).filter(([r1, r2]) => r1 !== a.id && r2 !== b.id)
    );
    nextManual[a.id] = b.id;
    commit(
      { manualPairs: nextManual, rejectedPairs: rejectedPairs.filter(k => k !== idKey && k !== nameKey) },
      `Matched ${quote(a.name)} with ${quote(b.name)}`,
      true
    );
  };

  // Unmatched entries from the dataset opposite the one being matched.
  const matchCandidates = useMemo(() => {
    if (!matchingPair) return [];
    const wantA = !matchingPair.row1Record;
    return pairs
      .filter(p => (wantA ? p.status === 'DATASET_A_ONLY' : p.status === 'DATASET_B_ONLY'))
      .map(p => (wantA ? p.row1Record : p.row2Record))
      .filter((e): e is DataEntry => !!e);
  }, [matchingPair, pairs]);

  const handleSaveEditedPair = (updates: {
    row1Update?: { id: string; name: string; contribution: number };
    row2Update?: { id: string; name: string; contribution: number };
  }) => {
    const apply = (list: DataEntry[], u?: { id: string; name: string; contribution: number }) =>
      u ? list.map(item => (item.id === u.id ? { ...item, name: u.name, contribution: u.contribution } : item)) : list;
    const name = updates.row1Update?.name || updates.row2Update?.name;
    commit(
      { row1: apply(row1, updates.row1Update), row2: apply(row2, updates.row2Update) },
      `Edited ${quote(name)}`,
      true
    );
  };

  const handleDeletePair = (pair: MatchedPair) => {
    commit(
      {
        row1: pair.row1Record ? row1.filter(item => item.id !== pair.row1Record?.id) : row1,
        row2: pair.row2Record ? row2.filter(item => item.id !== pair.row2Record?.id) : row2,
      },
      `Deleted ${quote(pair.row1Record?.name || pair.row2Record?.name)}`,
      true
    );
  };

  const handleConfirmClearWorkspace = () => {
    commit({ row1: [], row2: [], rejectedPairs: [], manualPairs: {} }, 'Cleared the workspace', true);
    setEntryLabel('');
    setActiveFilter('ALL');
    setIsClearConfirmOpen(false);
  };

  const handleRestoreBackup = (backup: AppBackupData) => {
    commit({ row1: backup.row1, row2: backup.row2, rejectedPairs: backup.rejectedPairs, manualPairs: {} }, 'Restored a backup file');
    setEntryLabel(backup.entryLabel);
    setActiveFilter('ALL');
    localStorage.setItem(KEYS.history, JSON.stringify(backup.historyList));
    setHistoryList(backup.historyList);
    if (backup.theme) setTheme(backup.theme);
  };

  const handleClearAppData = () => {
    clearStoredAppData();
    setWorkspace({ row1: [], row2: [], rejectedPairs: [], manualPairs: {} });
    setUndo(emptyUndoState());
    setHistoryList([]);
    setEntryLabel('');
    setActiveFilter('ALL');
    setTheme('system');
    showToast({ kind: 'info', text: 'All app data was cleared' });
  };

  const handleSaveToHistory = () => {
    if (row1.length === 0 && row2.length === 0) return;
    saveHistorySession({
      category: 'General',
      title: entryLabel.trim() || 'Data Differentiator Comparison',
      notes: `Differentiated ${row1.length} Dataset A vs ${row2.length} Dataset B entries`,
      row1Count: row1.length,
      row1TotalAmount: summary.row1TotalAmount,
      row2Count: row2.length,
      row2TotalAmount: summary.row2TotalAmount,
      netVariance: summary.netAmountDifference,
      identicalCount: summary.identicalCount,
      changedCount: summary.changedContributionCount,
      row1OnlyCount: summary.row1OnlyCount,
      row2OnlyCount: summary.row2OnlyCount,
      row1Records: [...row1],
      row2Records: [...row2],
    });
    refreshHistory();
    setSaveSuccessMsg('Saved to History!');
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  const handleRestoreSession = (session: HistorySession) => {
    commit(
      { row1: session.row1Records || [], row2: session.row2Records || [], manualPairs: {} },
      `Opened ${quote(session.title)} from History`,
      true
    );
    if (session.title) setEntryLabel(session.title);
    switchTab('diff');
  };

  const lastUndo = undo.past[undo.past.length - 1]?.label;
  const nextRedo = undo.future[0]?.label;

  return (
    <div className="app-shell">
      <WindowsTitleBar
        entryLabel={entryLabel}
        onChangeLabel={setEntryLabel}
        onSave={handleSaveToHistory}
        canSave={row1.length > 0 || row2.length > 0}
        saveSuccess={saveSuccessMsg}
        onUndo={handleUndo}
        onRedo={handleRedo}
        undoLabel={lastUndo}
        redoLabel={nextRedo}
      />

      <div className="desktop-workspace">
        <nav className="navigation-rail" aria-label="Main navigation">
          {([
            { key: 'diff', label: 'Dashboard', Icon: LayoutDashboard },
            { key: 'editor', label: 'Data Editor', Icon: Table2 },
            { key: 'report', label: 'Export', Icon: Download },
          ] as const).map(({ key, label, Icon }) => (
            <Button
              key={key}
              aria-label={label}
              className={`rail-item ${activeTab === key ? 'active' : ''}`}
              aria-current={activeTab === key ? 'page' : undefined}
              onClick={() => switchTab(key)}
            >
              <span className="rail-icon">
                <Icon size={22} />
                {key === 'diff' && pairs.length > 0 && <span className="count-badge">{pairs.length}</span>}
              </span>
              <span>{label}</span>
            </Button>
          ))}
          <Button className="rail-item" aria-label="History" title="History" onClick={() => setIsHistoryOpen(true)}>
            <span className="rail-icon"><History size={22} />{historyList.length > 0 && <span className="count-badge">{historyList.length}</span>}</span>
            <span>History</span>
          </Button>
          <Button className="rail-item" aria-label="Clear workspace" title="Clear workspace" onClick={() => setIsClearConfirmOpen(true)}>
            <span className="rail-icon"><Trash2 size={22} /></span><span>Trash</span>
          </Button>
          <Button className="rail-item" aria-label="Settings" title="Settings" onClick={() => setIsSettingsOpen(true)}>
            <span className="rail-icon"><Settings size={22} /></span><span>Settings</span>
          </Button>
          <Button
            className="icon-button theme-toggle"
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            aria-label="Toggle theme"
            onClick={() => changeTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Moon size={21} /> : <Sun size={21} />}
          </Button>
        </nav>

        <main id="app-scroll" className="workspace-content">
          {visitedTabs.has('diff') && (
            <div hidden={activeTab !== 'diff'} className="tab-panel" data-tab="diff">
              <div className="page-heading">
                <h1>Dashboard</h1>
                <p>
                  {pairs.length
                    ? 'What matches, what changed and what is missing between your two datasets.'
                    : 'Your comparison results will show up here.'}
                </p>
              </div>
              {pairs.length ? (
                <>
                  <SummaryCards summary={summary} activeFilter={activeFilter} onFilterChange={setActiveFilter} />
                  <DiffTable
                    pairs={pairs}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    onEditPair={setEditingPair}
                    onDeletePair={handleDeletePair}
                    onUnmatchPair={handleUnmatchPair}
                    onManualMatch={setMatchingPair}
                  />
                </>
              ) : (
                <section className="empty-workspace">
                  <div className="comparison-illustration" aria-hidden="true">
                    <div className="illustrated-list"><i /><i /><i /><i /></div>
                    <div className="illustrated-list"><i /><i /><i /><i /></div>
                    <span><ArrowRightLeft size={28} /></span>
                  </div>
                  <h2>Compare two lists in seconds</h2>
                  <div className="empty-actions">
                    <Button className="primary-action" onClick={() => setBulkImportTarget('row1')}>
                      <ClipboardPaste size={18} />Paste Dataset A
                    </Button>
                    <Button className="secondary-action" onClick={() => setBulkImportTarget('row2')}>
                      <ClipboardPaste size={18} />Paste Dataset B
                    </Button>
                    <Button className="text-action" onClick={() => switchTab('editor')}>
                      <Table2 size={18} />Type entries manually
                    </Button>
                  </div>
                </section>
              )}
            </div>
          )}

          {visitedTabs.has('editor') && (
            <div hidden={activeTab !== 'editor'} className="tab-panel" data-tab="editor">
              <div className="page-heading heading-with-action">
                <div>
                  <h1>Data Editor</h1>
                  <p>Dataset A and Dataset B</p>
                </div>
                <Button className="primary-action" onClick={() => switchTab('diff')}>
                  <ArrowRightLeft size={17} />View differences
                </Button>
              </div>
              <RowDataEditor
                row1={row1}
                row2={row2}
                onUpdateRow1={next => commit({ row1: next }, describeListChange('Dataset A', row1, next))}
                onUpdateRow2={next => commit({ row2: next }, describeListChange('Dataset B', row2, next))}
                onOpenBulkImport={setBulkImportTarget}
              />
            </div>
          )}

          {visitedTabs.has('report') && (
            <div hidden={activeTab !== 'report'} className="tab-panel" data-tab="report">
              <div className="page-heading">
                <h1>Export</h1>
                <p>{pairs.length} comparison entries</p>
              </div>
              <PrintReportView pairs={pairs} summary={summary} sheetTitle={entryLabel} onChangeSheetTitle={setEntryLabel} />
            </div>
          )}
        </main>
      </div>

      <ManualMatchModal
        key={matchingPair?.id}
        pair={matchingPair}
        candidates={matchCandidates}
        onClose={() => setMatchingPair(null)}
        onMatch={handleManualMatch}
      />

      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-600/40 border border-red-400/40 flex items-center justify-center text-red-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-sm">Clear Workspace Data?</h3>
              </div>
              <Button
                onClick={() => setIsClearConfirmOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-5 space-y-4 text-xs text-slate-700 dark:text-slate-300">
              <p className="leading-relaxed">
                Clear all entries in <strong>Dataset A</strong> and <strong>Dataset B</strong>?
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                Saved sessions in <strong>History</strong> are kept, and you can bring the entries back with Undo.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => setIsClearConfirmOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmClearWorkspace}
                  className="danger-action px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Yes, Clear Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <EditPairModal isOpen={!!editingPair} pair={editingPair} onClose={() => setEditingPair(null)} onSave={handleSaveEditedPair} />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        row1={row1}
        row2={row2}
        rejectedPairs={rejectedPairs}
        entryLabel={entryLabel}
        historyList={historyList}
        currentTheme={theme}
        onChangeTheme={changeTheme}
        onRestoreBackup={handleRestoreBackup}
        onClearAppData={handleClearAppData}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyList={historyList}
        onRefreshHistory={refreshHistory}
        onRestoreSession={handleRestoreSession}
      />

      {bulkImportTarget && (
        <BulkImportModal
          isOpen
          onClose={() => setBulkImportTarget(null)}
          targetGroup={bulkImportTarget}
          onImport={handleBulkImport}
        />
      )}

      <ActionToast
        message={toast}
        onDismiss={dismissToast}
        onUndo={undo.past.length ? handleUndo : undefined}
        onRedo={undo.future.length ? handleRedo : undefined}
      />
    </div>
  );
}
