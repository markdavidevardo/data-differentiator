import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Undo2, Redo2, Tag, BookmarkPlus, Check } from 'lucide-react';
import { Button } from './ui/Button';

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      toggleMaximize: () => void;
      close: () => void;
      openExternal?: (url: string) => void;
      onMaximizedChange: (cb: (maximized: boolean) => void) => () => void;
    };
  }
}
interface WindowsTitleBarProps {
  onUndo: () => void; onRedo: () => void; undoLabel?: string; redoLabel?: string;
  entryLabel: string; onChangeLabel: (label: string) => void; onSave: () => void; canSave: boolean; saveSuccess: string | null;
}
export const WindowsTitleBar: React.FC<WindowsTitleBarProps> = ({ onUndo, onRedo, undoLabel, redoLabel, entryLabel, onChangeLabel, onSave, canSave, saveSuccess }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const api = window.electronAPI;
  useEffect(() => api?.onMaximizedChange(setIsMaximized), [api]);
  return <header className="window-bar title-drag">
    <div className="window-brand" title="Author: Mark David Evardo"><img src="./favicon.svg" alt="" /><span>Data Differentiator</span></div>
    <div className="comparison-tools title-drag-zone">
      <div className="undo-tools">
        <Button className="icon-button" onClick={onUndo} disabled={!undoLabel} title={undoLabel ? `Undo: ${undoLabel} (Ctrl+Z)` : 'Nothing to undo'} aria-label="Undo"><Undo2 size={19} /></Button>
        <Button className="icon-button" onClick={onRedo} disabled={!redoLabel} title={redoLabel ? `Redo: ${redoLabel} (Ctrl+Y)` : 'Nothing to redo'} aria-label="Redo"><Redo2 size={19} /></Button>
      </div>
      <div className="comparison-name"><Tag size={17} /><input aria-label="Comparison name" value={entryLabel} onChange={e => onChangeLabel(e.target.value)} placeholder="Name this comparison" /></div>
      <Button className="save-comparison" disabled={!canSave} onClick={onSave}>{saveSuccess ? <Check size={17} /> : <BookmarkPlus size={17} />}<span>{saveSuccess || 'Save to History'}</span></Button>
    </div>
    {api && <div className="window-tools title-no-drag"><Button className="window-control" title="Minimize" aria-label="Minimize" onClick={() => api.minimize()}><Minus size={17} /></Button><Button className="window-control" title={isMaximized ? 'Restore' : 'Maximize'} aria-label={isMaximized ? 'Restore' : 'Maximize'} onClick={() => api.toggleMaximize()}>{isMaximized ? <Copy size={14} /> : <Square size={14} />}</Button><Button className="window-control close-window" title="Close" aria-label="Close" onClick={() => api.close()}><X size={18} /></Button></div>}
  </header>;
};
