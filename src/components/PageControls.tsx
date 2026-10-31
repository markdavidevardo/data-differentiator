import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
export const PAGE_SIZE = 100;
export function PageControls({ page, count, onChange }: { page: number; count: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (pages <= 1) return null;
  return <div className="page-controls"><span>{page * PAGE_SIZE + 1}–{Math.min(count, (page + 1) * PAGE_SIZE)} of {count}</span><Button aria-label="Previous page" title="Previous page" disabled={page === 0} onClick={() => onChange(page - 1)}><ChevronLeft size={16} /></Button><span>{page + 1} / {pages}</span><Button aria-label="Next page" title="Next page" disabled={page >= pages - 1} onClick={() => onChange(page + 1)}><ChevronRight size={16} /></Button></div>;
}
