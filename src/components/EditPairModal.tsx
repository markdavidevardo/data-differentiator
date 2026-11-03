import { Button } from './ui/Button';
import React, { useState, useEffect } from 'react';
import { X, Pencil, Check } from 'lucide-react';
import { MatchedPair, DataEntry, cleanNumberInput } from '../utils/matcher';

interface EditPairModalProps {
  isOpen: boolean;
  pair: MatchedPair | null;
  onClose: () => void;
  onSave: (updates: {
    row1Update?: { id: string; name: string; contribution: number };
    row2Update?: { id: string; name: string; contribution: number };
  }) => void;
}

export const EditPairModal: React.FC<EditPairModalProps> = ({
  isOpen,
  pair,
  onClose,
  onSave,
}) => {
  const [row1Name, setRow1Name] = useState('');
  const [row1Val, setRow1Val] = useState('');
  const [row2Name, setRow2Name] = useState('');
  const [row2Val, setRow2Val] = useState('');

  useEffect(() => {
    if (pair) {
      if (pair.row1Record) {
        setRow1Name(pair.row1Record.name || '');
        setRow1Val(String(pair.row1Record.contribution ?? ''));
      } else {
        setRow1Name('');
        setRow1Val('');
      }

      if (pair.row2Record) {
        setRow2Name(pair.row2Record.name || '');
        setRow2Val(String(pair.row2Record.contribution ?? ''));
      } else {
        setRow2Name('');
        setRow2Val('');
      }
    }
  }, [pair]);

  if (!isOpen || !pair) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: {
      row1Update?: { id: string; name: string; contribution: number };
      row2Update?: { id: string; name: string; contribution: number };
    } = {};

    if (pair.row1Record) {
      payload.row1Update = {
        id: pair.row1Record.id,
        name: row1Name.trim(),
        contribution: cleanNumberInput(row1Val)
      };
    }

    if (pair.row2Record) {
      payload.row2Update = {
        id: pair.row2Record.id,
        name: row2Name.trim(),
        contribution: cleanNumberInput(row2Val)
      };
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/40 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Pencil className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-sm">Edit Record</h3>
          </div>
          <Button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {pair.row1Record && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <span>Dataset A</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-600 dark:text-slate-300 font-medium">Name</label>
                <input
                  type="text"
                  value={row1Name}
                  onChange={e => setRow1Name(e.target.value)}
                  required
                  placeholder="Name"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-600 dark:text-slate-300 font-medium">Value</label>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={row1Val}
                  onChange={e => setRow1Val(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {pair.row2Record && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <span>Dataset B</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-600 dark:text-slate-300 font-medium">Name</label>
                <input
                  type="text"
                  value={row2Name}
                  onChange={e => setRow2Name(e.target.value)}
                  required
                  placeholder="Name"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-600 dark:text-slate-300 font-medium">Value</label>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={row2Val}
                  onChange={e => setRow2Val(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
