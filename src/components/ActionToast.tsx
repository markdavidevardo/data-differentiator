import React, { useEffect } from 'react';
import { CheckCircle2, Info, Redo2, Undo2, X } from 'lucide-react';
import { Button } from './ui/Button';

export interface ToastMessage {
  id: number;
  kind: 'action' | 'undo' | 'redo' | 'info';
  text: string;
  // Steps still available in the same direction after an undo/redo.
  remaining?: number;
}

interface ActionToastProps {
  message: ToastMessage | null;
  onDismiss: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

const TITLES: Record<ToastMessage['kind'], string> = {
  action: 'Done',
  undo: 'Undone',
  redo: 'Redone',
  info: '',
};

export function ActionToast({ message, onDismiss, onUndo, onRedo }: ActionToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, message.kind === 'info' ? 2500 : 5000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  const Icon = message.kind === 'undo' ? Undo2 : message.kind === 'redo' ? Redo2 : message.kind === 'info' ? Info : CheckCircle2;
  const follow =
    message.kind === 'undo' ? { label: 'Redo', run: onRedo, Icon: Redo2 }
    : message.kind === 'action' || message.kind === 'redo' ? { label: 'Undo', run: onUndo, Icon: Undo2 }
    : null;

  return (
    <div className="action-toast" role="status" aria-live="polite" key={message.id}>
      <span className={`action-toast-icon kind-${message.kind}`}><Icon size={17} /></span>
      <div className="action-toast-text">
        {TITLES[message.kind] && <strong>{TITLES[message.kind]}</strong>}
        <span>{message.text}</span>
        {message.remaining !== undefined && (
          <small>
            {message.remaining === 0
              ? `No more steps to ${message.kind === 'undo' ? 'undo' : 'redo'}`
              : `${message.remaining} more ${message.remaining === 1 ? 'step' : 'steps'} to ${message.kind === 'undo' ? 'undo' : 'redo'}`}
          </small>
        )}
      </div>
      {follow?.run && (
        <Button className="action-toast-button" onClick={follow.run}>
          <follow.Icon size={15} />{follow.label}
        </Button>
      )}
      <Button className="action-toast-close" aria-label="Dismiss" onClick={onDismiss}><X size={15} /></Button>
    </div>
  );
}
