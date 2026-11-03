import { Button } from './ui/Button';
import React, { useRef, useState } from 'react';
import {
  X, Settings, Download, Upload, User, Info, ExternalLink, Database, CheckCircle2, AlertCircle,
  AlertTriangle, FileJson, GitCompare, Palette, Sun, Moon, MonitorSmartphone, Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { DataEntry } from '../utils/matcher';
import { HistorySession } from '../utils/history';
import { AppBackupData, AppTheme, downloadJson, parseBackup } from '../utils/backup';

export type { AppTheme, AppBackupData };

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  row1: DataEntry[];
  row2: DataEntry[];
  rejectedPairs: string[];
  entryLabel: string;
  historyList: HistorySession[];
  currentTheme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  onRestoreBackup: (data: AppBackupData) => void;
  onClearAppData: () => void;
}

type Notice = { type: 'success' | 'error'; message: string };

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  row1,
  row2,
  rejectedPairs,
  entryLabel,
  historyList,
  currentTheme,
  onChangeTheme,
  onRestoreBackup,
  onClearAppData,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'data' | 'about'>('appearance');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pendingBackup, setPendingBackup] = useState<{ name: string; data: AppBackupData } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const flash = (next: Notice) => {
    setNotice(next);
    window.setTimeout(() => setNotice(current => (current === next ? null : current)), 5000);
  };

  const handleExport = () => {
    const backup: AppBackupData = {
      version: '2',
      exportedAt: new Date().toISOString(),
      row1,
      row2,
      rejectedPairs,
      entryLabel,
      historyList,
      theme: currentTheme,
    };
    downloadJson(`Data_Differentiator_Backup_${new Date().toISOString().slice(0, 10)}.json`, backup);
    flash({ type: 'success', message: 'Backup file downloaded.' });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      setPendingBackup({ name: file.name, data: parseBackup(await file.text()) });
      setNotice(null);
    } catch (err) {
      flash({ type: 'error', message: `Could not read ${file.name}: ${err instanceof Error ? err.message : 'unknown error'}` });
    }
  };

  const confirmRestore = () => {
    if (!pendingBackup) return;
    const { data } = pendingBackup;
    onRestoreBackup(data);
    setPendingBackup(null);
    flash({
      type: 'success',
      message: `Restored ${data.row1.length} Dataset A entries, ${data.row2.length} Dataset B entries and ${data.historyList.length} history sessions.`,
    });
  };

  const confirmClearAppData = () => {
    onClearAppData();
    setConfirmClear(false);
    flash({ type: 'success', message: 'All app data was cleared.' });
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Settings" className="settings-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="settings-dialog bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">Settings</h3>
              <p className="text-xs text-slate-300">
                Appearance, backups and app information
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close Settings"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="px-5 pt-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold shrink-0">
          <Button
            onClick={() => setActiveTab('appearance')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'appearance'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Appearance</span>
          </Button>
          <Button
            onClick={() => setActiveTab('data')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'data'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Backup & Restore</span>
          </Button>
          <Button
            onClick={() => setActiveTab('about')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'about'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About</span>
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  Choose how the app looks. Auto follows your Windows light/dark setting.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'system', label: 'Auto', hint: 'Match Windows', Icon: MonitorSmartphone },
                    { value: 'light', label: 'Light', hint: 'Always light', Icon: Sun },
                    { value: 'dark', label: 'Dark', hint: 'Always dark', Icon: Moon },
                  ] as const).map(({ value, label, hint, Icon }) => {
                    const selected = currentTheme === value;
                    return (
                      <Button
                        key={value}
                        onClick={() => onChangeTheme(value)}
                        aria-pressed={selected}
                        className={`theme-choice p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all active:scale-95 ${
                          selected
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        <span className={`theme-preview preview-${value}`} aria-hidden="true"><span className="preview-brand"/><span className="preview-rail"/><span className="preview-content"><i/><i/><i/><b/><b/></span></span>
                        <span className="theme-label">{label}{selected ? <CheckCircle2 size={19}/> : <span className="theme-radio"/>}</span>
                        <span className="text-[10px] opacity-70">{hint}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="settings-data space-y-5">
              {notice && (
                <p className={`settings-notice ${notice.type}`} role="status">
                  {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{notice.message}</span>
                </p>
              )}

              <section className="settings-card">
                <h4><Download className="w-4 h-4" />Back up</h4>
                <p>Save both datasets, "Not Match" choices, the comparison name, history and theme in one JSON file.</p>
                <Button onClick={handleExport} className="primary-action">
                  <FileJson className="w-4 h-4" />Download backup (JSON)
                </Button>
              </section>

              <section className="settings-card">
                <h4><Upload className="w-4 h-4" />Restore</h4>
                <p>Load a backup file. It replaces the current workspace and history; you can undo the workspace part afterwards.</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-hidden="true"
                  tabIndex={-1}
                />
                {pendingBackup ? (
                  <div className="settings-confirm">
                    <p>
                      Restore <strong>{pendingBackup.name}</strong>? It has {pendingBackup.data.row1.length} Dataset A entries,{' '}
                      {pendingBackup.data.row2.length} Dataset B entries and {pendingBackup.data.historyList.length} history sessions.
                    </p>
                    <div>
                      <Button className="text-action" onClick={() => setPendingBackup(null)}>Cancel</Button>
                      <Button className="primary-action" onClick={confirmRestore}>Restore</Button>
                    </div>
                  </div>
                ) : (
                  <Button className="secondary-action" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4" />Choose JSON backup file
                  </Button>
                )}
              </section>

              <section className="settings-card danger">
                <h4><Trash2 className="w-4 h-4" />Clear app data</h4>
                <p>Delete both datasets, "Not Match" choices, all saved history and your theme choice. This cannot be undone, so download a backup first if you may need it.</p>
                {confirmClear ? (
                  <div className="settings-confirm">
                    <p><AlertTriangle className="w-4 h-4 inline-block mr-1" />Delete everything? There are {row1.length + row2.length} entries and {historyList.length} history sessions.</p>
                    <div>
                      <Button className="text-action" onClick={() => setConfirmClear(false)}>Cancel</Button>
                      <Button className="danger-action" onClick={confirmClearAppData}>Yes, delete everything</Button>
                    </div>
                  </div>
                ) : (
                  <Button className="danger-outline-action" onClick={() => setConfirmClear(true)}>
                    <Trash2 className="w-4 h-4" />Clear app data
                  </Button>
                )}
              </section>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-white shadow-xs">
                  <GitCompare className="w-6 h-6 rotate-90" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Data Differentiator
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold">
                    Version 1.2.0
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    High-speed fuzzy string comparison and numerical value differentiation engine.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
                <div className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                  Developed by:
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    Mark David Evardo
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href="https://www.facebook.com/markdavidevardo"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => {
                        const api = window.electronAPI;
                        if (api?.openExternal) {
                          e.preventDefault();
                          api.openExternal(e.currentTarget.href);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center gap-1.5 transition-all shadow-xs text-xs"
                      title="Connect on Facebook"
                    >
                      <span>Connect on Facebook</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Built to empower fast, zero-condition data differentiation across alphanumeric identifiers, rearranged names, and numerical values without restrictive matching constraints.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <Button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Done
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
