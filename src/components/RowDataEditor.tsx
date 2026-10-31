import { Button } from './ui/Button';
import { PageControls, PAGE_SIZE } from './PageControls';
import React, { useState, useEffect, useRef } from 'react';
import { DataEntry, formatValue } from '../utils/matcher';
import { Plus, Trash2, ClipboardPaste } from 'lucide-react';

interface RowDataEditorProps {
  row1: DataEntry[];
  row2: DataEntry[];
  onUpdateRow1: (records: DataEntry[]) => void;
  onUpdateRow2: (records: DataEntry[]) => void;
  onOpenBulkImport: (targetGroup: 'row1' | 'row2') => void;
  agency?: string;
}

export const RowDataEditor: React.FC<RowDataEditorProps> = ({
  row1,
  row2,
  onUpdateRow1,
  onUpdateRow2,
  onOpenBulkImport,
}) => {
  const [page1, setPage1] = useState(0);
  const [page2, setPage2] = useState(0);
  const prevLen1 = useRef(row1.length);
  const prevLen2 = useRef(row2.length);
  // When entries are added (e.g. a second bulk paste), jump to the last page so new rows are visible.
  useEffect(() => {
    const last = Math.max(0, Math.ceil(row1.length / PAGE_SIZE) - 1);
    setPage1(v => (row1.length > prevLen1.current ? last : Math.min(v, last)));
    prevLen1.current = row1.length;
  }, [row1.length]);
  useEffect(() => {
    const last = Math.max(0, Math.ceil(row2.length / PAGE_SIZE) - 1);
    setPage2(v => (row2.length > prevLen2.current ? last : Math.min(v, last)));
    prevLen2.current = row2.length;
  }, [row2.length]);
  const [newR1Name, setNewR1Name] = useState('');
  const [newR1Amount, setNewR1Amount] = useState('');
  const [newR2Name, setNewR2Name] = useState('');
  const [newR2Amount, setNewR2Amount] = useState('');
  const [confirmClearGroup, setConfirmClearGroup] = useState<'row1' | 'row2' | null>(null);

  const handleAddRow1 = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newR1Name.trim().replace(/\s+/g, ' ');
    if (!cleanName) return;
    const amount = parseFloat(newR1Amount.replace(/,/g, '')) || 0;
    const newRecord: DataEntry = {
      id: `r1_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      contribution: amount,
    };
    onUpdateRow1([...row1, newRecord]);
    setNewR1Name('');
    setNewR1Amount('');
  };

  const handleAddRow2 = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newR2Name.trim().replace(/\s+/g, ' ');
    if (!cleanName) return;
    const amount = parseFloat(newR2Amount.replace(/,/g, '')) || 0;
    const newRecord: DataEntry = {
      id: `r2_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      contribution: amount,
    };
    onUpdateRow2([...row2, newRecord]);
    setNewR2Name('');
    setNewR2Amount('');
  };

  const updateRow1Field = (id: string, field: keyof DataEntry, value: any) => {
    const finalVal = field === 'name' ? String(value).replace(/\s{2,}/g, ' ') : value;
    onUpdateRow1(
      row1.map(item => (item.id === id ? { ...item, [field]: finalVal } : item))
    );
  };

  const updateRow2Field = (id: string, field: keyof DataEntry, value: any) => {
    const finalVal = field === 'name' ? String(value).replace(/\s{2,}/g, ' ') : value;
    onUpdateRow2(
      row2.map(item => (item.id === id ? { ...item, [field]: finalVal } : item))
    );
  };

  const deleteRow1 = (id: string) => {
    onUpdateRow1(row1.filter(item => item.id !== id));
  };

  const deleteRow2 = (id: string) => {
    onUpdateRow2(row2.filter(item => item.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col h-full overflow-hidden">
        <div className="p-4 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Dataset A
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {row1.length > 0 && (
              confirmClearGroup === 'row1' ? (
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => {
                      onUpdateRow1([]);
                      setConfirmClearGroup(null);
                    }}
                    className="px-2 py-0.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-colors"
                  >
                    Clear All?
                  </Button>
                  <Button
                    onClick={() => setConfirmClearGroup(null)}
                    className="px-1.5 py-0.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    No
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setConfirmClearGroup('row1')}
                  className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors"
                  title="Clear all records in Dataset A"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )
            )}
            <Button
              onClick={() => onOpenBulkImport('row1')}
              className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Bulk Paste</span>
            </Button>
            <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold rounded">
              {row1.length}
            </span>
          </div>
        </div>

        <form onSubmit={handleAddRow1} className="p-3 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <input
            type="text"
            placeholder="Name"
            value={newR1Name}
            onChange={e => setNewR1Name(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
          />
          <div className="relative w-32 shrink-0">
            <input
              type="text"
              placeholder="Value"
              value={newR1Amount}
              onChange={e => setNewR1Amount(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-slate-800 dark:text-slate-200"
            />
          </div>
          <Button
            type="submit"
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </Button>
        </form>

        <div className="flex-1 overflow-y-auto max-h-[500px]">
          {row1.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-xs font-medium">No records in Dataset A</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Type an entry above or click Bulk Paste to import from Excel or table data.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2 px-3 w-8">#</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3 w-36">Value</th>
                  <th className="py-2 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {row1.slice(page1 * PAGE_SIZE, (page1 + 1) * PAGE_SIZE).map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                      {page1 * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="py-1 px-3">
                      <input
                        type="text"
                        value={rec.name}
                        onChange={e => updateRow1Field(rec.id, 'name', e.target.value)}
                        className="w-full px-2 py-1 bg-transparent hover:bg-slate-100/70 dark:hover:bg-slate-700/70 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 rounded text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors"
                      />
                    </td>
                    <td className="py-1 px-3 font-mono">
                      <input
                        type="number"
                        step="any"
                        value={rec.contribution}
                        onChange={e =>
                          updateRow1Field(rec.id, 'contribution', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 bg-transparent hover:bg-slate-100/70 dark:hover:bg-slate-700/70 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 rounded text-xs text-slate-800 dark:text-slate-200 font-mono tabular-nums transition-colors"
                      />
                    </td>
                    <td className="py-1 px-3 text-center">
                      <Button
                        onClick={() => deleteRow1(rec.id)}
                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Delete entry"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <PageControls page={page1} count={row1.length} onChange={setPage1} />
        <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Dataset A Subtotal:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
            {formatValue(row1.reduce((sum, r) => sum + (r.contribution || 0), 0))}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col h-full overflow-hidden">
        <div className="p-4 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Dataset B
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {row2.length > 0 && (
              confirmClearGroup === 'row2' ? (
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => {
                      onUpdateRow2([]);
                      setConfirmClearGroup(null);
                    }}
                    className="px-2 py-0.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-colors"
                  >
                    Clear All?
                  </Button>
                  <Button
                    onClick={() => setConfirmClearGroup(null)}
                    className="px-1.5 py-0.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    No
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setConfirmClearGroup('row2')}
                  className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors"
                  title="Clear all records in Dataset B"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )
            )}
            <Button
              onClick={() => onOpenBulkImport('row2')}
              className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Bulk Paste</span>
            </Button>
            <span className="text-xs px-2 py-0.5 bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-mono font-semibold rounded">
              {row2.length}
            </span>
          </div>
        </div>

        <form onSubmit={handleAddRow2} className="p-3 bg-blue-50/40 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <input
            type="text"
            placeholder="Name"
            value={newR2Name}
            onChange={e => setNewR2Name(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
          />
          <div className="relative w-32 shrink-0">
            <input
              type="text"
              placeholder="Value"
              value={newR2Amount}
              onChange={e => setNewR2Amount(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-slate-800 dark:text-slate-200"
            />
          </div>
          <Button
            type="submit"
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </Button>
        </form>

        <div className="flex-1 overflow-y-auto max-h-[500px]">
          {row2.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-xs font-medium">No records in Dataset B</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Type an entry above or click Bulk Paste to import comparison data.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2 px-3 w-8">#</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3 w-36">Value</th>
                  <th className="py-2 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {row2.slice(page2 * PAGE_SIZE, (page2 + 1) * PAGE_SIZE).map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                      {page2 * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="py-1 px-3">
                      <input
                        type="text"
                        value={rec.name}
                        onChange={e => updateRow2Field(rec.id, 'name', e.target.value)}
                        className="w-full px-2 py-1 bg-transparent hover:bg-slate-100/70 dark:hover:bg-slate-700/70 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 rounded text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors"
                      />
                    </td>
                    <td className="py-1 px-3 font-mono">
                      <input
                        type="number"
                        step="any"
                        value={rec.contribution}
                        onChange={e =>
                          updateRow2Field(rec.id, 'contribution', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 bg-transparent hover:bg-slate-100/70 dark:hover:bg-slate-700/70 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 rounded text-xs text-blue-900 dark:text-blue-200 font-mono tabular-nums transition-colors"
                      />
                    </td>
                    <td className="py-1 px-3 text-center">
                      <Button
                        onClick={() => deleteRow2(rec.id)}
                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Delete entry"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <PageControls page={page2} count={row2.length} onChange={setPage2} />
        <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Dataset B Subtotal:</span>
          <span className="font-bold text-blue-700 dark:text-blue-300 font-mono tabular-nums">
            {formatValue(row2.reduce((sum, r) => sum + (r.contribution || 0), 0))}
          </span>
        </div>
      </div>
    </div>
  );
};
