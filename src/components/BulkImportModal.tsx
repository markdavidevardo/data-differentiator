import { Button } from './ui/Button';
import React, { useState, useRef, useEffect } from 'react';
import { parsePastedRecords, DataEntry, formatValue } from '../utils/matcher';
import { X, ClipboardPaste, Check } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGroup: 'row1' | 'row2';
  agency?: string;
  onImport: (records: DataEntry[], targetGroup: 'row1' | 'row2', mode: 'append' | 'replace') => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  targetGroup,
  onImport,
}) => {
  const [rawText, setRawText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('replace');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  // Paste feedback: green flash on the rows the last Ctrl+V added.
  const [flashFrom, setFlashFrom] = useState<number | null>(null);
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    if (flashFrom === null) return;
    const t = setTimeout(() => setFlashFrom(null), 1500);
    return () => clearTimeout(t);
  }, [flashFrom, flashKey]);

  if (!isOpen) return null;

  const parsed = parsePastedRecords(rawText);
  const totalAmount = parsed.reduce((sum, r) => sum + r.contribution, 0);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const before = parsed.length;
    // Count rows from the clipboard itself so every Ctrl+V gives feedback,
    // even when the same entries are pasted twice.
    const clipCount = parsePastedRecords(e.clipboardData.getData('text')).length;
    // The paste event fires before the value updates, so read it on the next tick.
    setTimeout(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const after = parsePastedRecords(ta.value).length;
      const added = clipCount > 0 ? clipCount : after - before;
      if (added > 0) {
        setFlashFrom(Math.max(0, after - added));
        setFlashKey(k => k + 1);
        // Scroll the preview so the newly pasted rows are visible.
        const preview = previewRef.current;
        if (preview) preview.scrollTop = preview.scrollHeight;
      }
    }, 0);
  };

  const handleConfirm = () => {
    if (parsed.length > 0) {
      onImport(parsed, targetGroup, importMode);
      setRawText('');
      setFlashFrom(null);
      onClose();
    }
  };

  const groupLabel =
    targetGroup === 'row1'
      ? 'Dataset A'
      : 'Dataset B';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardPaste className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-sm">Bulk Paste & Import into {groupLabel}</h3>
              <p className="text-xs text-slate-300">
                Paste rows from Excel, TSV, or CSV (Panel 1: String, Panel 2: Numerical Value)
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4 min-w-0">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Paste Raw Data:
            </label>
            <textarea
              ref={textareaRef}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              onPaste={handlePaste}
              placeholder={`Copy and paste directly from Excel or tables. Formats accepted:\nSurname\tFirst Name\tMiddle Name\t1000.00\nSURNAME    FIRST NAME    MIDDLE NAME    1000.00\nSurname, First Name Middle Name 1000.00\nName 1000`}
              rows={6}
              className="block w-full resize-y p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Automatically combines Surname, First Name, and Middle Name even when separated by wide spaces or tabs.
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Import Mode:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="text-blue-600 dark:text-blue-400 focus:ring-blue-500"
              />
              <span>Replace existing entries</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="importMode"
                value="append"
                checked={importMode === 'append'}
                onChange={() => setImportMode('append')}
                className="text-blue-600 dark:text-blue-400 focus:ring-blue-500"
              />
              <span>Append to existing entries</span>
            </label>
          </div>

          {parsed.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/50">
              <div className="px-3 py-2 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Preview: Analyzed Entries ({parsed.length})</span>
                <span className="font-mono tabular-nums text-blue-700 dark:text-blue-300">
                  Total Value: {formatValue(totalAmount)}
                </span>
              </div>
              <div ref={previewRef} className="max-h-40 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="py-1 px-3 w-8">#</th>
                      <th className="py-1 px-3">Panel 1 (Full Name String)</th>
                      <th className="py-1 px-3 text-right w-28">Panel 2 (Value)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {parsed.map((rec, i) => (
                      <tr
                        key={i}
                        className={`hover:bg-slate-100/50 dark:hover:bg-slate-700/50 ${flashFrom !== null && i >= flashFrom ? 'paste-flash-row' : ''}`}
                      >
                        <td className="py-1.5 px-3 text-slate-400 font-mono text-[11px] w-8">
                          {i + 1}
                        </td>
                        <td className="py-1.5 px-3 font-medium text-slate-800 dark:text-slate-200">{rec.name}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300 font-semibold tabular-nums w-28">
                          {formatValue(rec.contribution)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <Button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={parsed.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirm Import ({parsed.length})</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
