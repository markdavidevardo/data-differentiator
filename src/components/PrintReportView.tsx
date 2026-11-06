import { Button } from './ui/Button';
import { PageControls, PAGE_SIZE } from './PageControls';
import React, { useState, useEffect } from 'react';
import { MatchedPair, ReconciliationSummary, formatValue } from '../utils/matcher';
import { Download, FileText, Tag, Loader2 } from 'lucide-react';
import type jsPDF from 'jspdf';

interface PrintReportViewProps {
  pairs: MatchedPair[];
  summary: ReconciliationSummary;
  category?: string;
  sheetTitle?: string;
  onChangeSheetTitle?: (title: string) => void;
  onChangeCategory?: (cat: string) => void;
  onBack?: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  pairs,
  summary,
  sheetTitle = 'Data Differentiation',
  onChangeSheetTitle,
}) => {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [pairs]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const signed = (value: number) => `${value > 0 ? '+' : ''}${formatValue(value)}`;

  const generatePdfDocument = async (): Promise<jsPDF> => {
    const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc = new JsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const left = 40;
    const contentWidth = pageWidth - left * 2;

    // Long titles wrap instead of running off the page.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(24, 33, 47);
    const title = (sheetTitle.trim() || 'Data Differentiation Report').toUpperCase();
    const titleLines: string[] = doc.splitTextToSize(title, contentWidth).slice(0, 2);
    doc.text(titleLines, left, 45);
    let y = 45 + (titleLines.length - 1) * 19;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated ${currentDate}  |  Data Differentiator`, left, y + 16);

    const boxTop = y + 30;
    const boxHeight = 62;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(left, boxTop, contentWidth, boxHeight, 4, 4, 'FD');

    const columnWidth = contentWidth / 4;
    const columns: Array<{ label: string; value: string; note: string; color: [number, number, number] }> = [
      { label: 'Dataset A total', value: formatValue(summary.row1TotalAmount), note: `${summary.row1TotalCount} records`, color: [30, 41, 59] },
      { label: 'Dataset B total', value: formatValue(summary.row2TotalAmount), note: `${summary.row2TotalCount} records`, color: [30, 41, 59] },
      {
        label: 'Net difference (B - A)',
        value: signed(summary.netAmountDifference),
        note: summary.netAmountDifference === 0 ? 'No net change' : summary.netAmountDifference > 0 ? 'Net increase' : 'Net decrease',
        color: [30, 41, 59],
      },
    ];
    columns.forEach((col, i) => {
      const x = left + 12 + i * columnWidth;
      const maxWidth = columnWidth - 20;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(col.label, x, boxTop + 17);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...col.color);
      doc.text(doc.splitTextToSize(col.value, maxWidth)[0], x, boxTop + 33);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(col.note, x, boxTop + 48);
    });

    const bx = left + 12 + 3 * columnWidth;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Breakdown', bx, boxTop + 17);
    doc.setFont('helvetica', 'bold');
    ([
      [summary.identicalCount, 'Identical', [22, 128, 61]],
      [summary.changedContributionCount, 'Values changed', [29, 78, 216]],
      [summary.row1OnlyCount, 'Dataset A only', [180, 83, 9]],
      [summary.row2OnlyCount, 'Dataset B only', [126, 34, 206]],
    ] as [number, string, [number, number, number]][]).forEach(([n, label, c], i) => {
      const y = boxTop + 27 + i * 8.5;
      doc.setTextColor(...c);
      doc.text(String(n), bx + 14, y, { align: 'right' });
      doc.text(label, bx + 18, y);
    });
    doc.setFont('helvetica', 'normal');

    const statusLabel: Record<MatchedPair['status'], string> = {
      IDENTICAL: 'Identical',
      VALUES_CHANGED: 'Values changed',
      DATASET_A_ONLY: 'Dataset A only',
      DATASET_B_ONLY: 'Dataset B only',
    };
    const statusColor: Record<MatchedPair['status'], [number, number, number]> = {
      IDENTICAL: [22, 128, 61],
      VALUES_CHANGED: [29, 78, 216],
      DATASET_A_ONLY: [180, 83, 9],
      DATASET_B_ONLY: [126, 34, 206],
    };

    const body = pairs.map((p, idx) => {
      let difference = 0;
      if (p.status === 'VALUES_CHANGED') difference = p.contributionDifference;
      else if (p.status === 'DATASET_A_ONLY') difference = -(p.row1Record?.contribution || 0);
      else if (p.status === 'DATASET_B_ONLY') difference = p.row2Record?.contribution || 0;
      return [
        String(idx + 1),
        p.row1Record ? `${p.row1Record.name}\n${formatValue(p.row1Record.contribution)}` : '-',
        p.row2Record ? `${p.row2Record.name}\n${formatValue(p.row2Record.contribution)}` : '-',
        p.row1Record && p.row2Record ? `${p.nameSimilarityScore}%` : '-',
        difference === 0 ? '0.00' : signed(difference),
        statusLabel[p.status],
      ];
    });

    autoTable(doc, {
      startY: boxTop + boxHeight + 14,
      margin: { left, right: left, top: 40, bottom: 44 },
      head: [['#', 'Dataset A', 'Dataset B', 'Match', 'Difference', 'Status']],
      body,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, valign: 'middle' },
      alternateRowStyles: { fillColor: [246, 248, 251] },
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 5, overflow: 'linebreak', valign: 'middle', textColor: [30, 41, 59], lineWidth: 0 },
      columnStyles: {
        0: { cellWidth: 26, halign: 'center', textColor: [148, 163, 184] },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 44, halign: 'center' },
        4: { cellWidth: 70, halign: 'right' },
        5: { cellWidth: 74, halign: 'center' },
      },
      didParseCell: data => {
        if (data.section !== 'body') return;
        const pair = pairs[data.row.index];
        if (data.column.index === 5) {
          data.cell.styles.textColor = statusColor[pair.status];
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 4 && pair.status !== 'IDENTICAL') {
          data.cell.styles.textColor = statusColor[pair.status];
        }
      },

    });

    // Page numbers are written after the table so the total is known.
    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${page} of ${totalPages}`, pageWidth / 2, pageHeight - 22, { align: 'center' });
    }

    return doc;
  };

  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    try {
      const doc = await generatePdfDocument();
      const sanitizedTitle = (sheetTitle.trim() || 'Data_Differentiation_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`${sanitizedTitle}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCSV = () => {
    const metadataHeader = [
      ['Application', 'Data Differentiator'],
      ['Sheet Name', sheetTitle.trim() || 'Data Differentiation'],
      ['Generated Date', currentDate],
      ['Dataset A Total', `${formatValue(summary.row1TotalAmount)} (${summary.row1TotalCount} records)`],
      ['Dataset B Total', `${formatValue(summary.row2TotalAmount)} (${summary.row2TotalCount} records)`],
      ['Net Value Difference (B - A)', `${summary.netAmountDifference > 0 ? '+' : ''}${formatValue(summary.netAmountDifference)}`],
      ['Status Breakdown', `Identical: ${summary.identicalCount} | Values Changed: ${summary.changedContributionCount} | Dataset A Only: ${summary.row1OnlyCount} | Dataset B Only: ${summary.row2OnlyCount}`],
      ['', ''] // blank separator line
    ];

    const metaLines = metadataHeader
      .map(row => row[0] === '' ? '' : `"${row[0]}","${(row[1] || '').replace(/"/g, '""')}"`)
      .join('\n');

    const headers = [
      'Status',
      'Dataset A: Name',
      'Dataset A: Value',
      'Dataset B: Name',
      'Dataset B: Value',
      'Value Difference',
      'Similarity Score (%)',
      'Distinct Common Parts',
      'Notes/Explanation'
    ];

    const rows = pairs.map(p => [
      `"${p.status}"`,
      `"${(p.row1Record?.name || '').replace(/"/g, '""')}"`,
      p.row1Record?.contribution || 0,
      `"${(p.row2Record?.name || '').replace(/"/g, '""')}"`,
      p.row2Record?.contribution || 0,
      p.contributionDifference,
      `${p.nameSimilarityScore}%`,
      p.distinctSimilaritiesCount,
      `"${(p.matchExplanation || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = `${metaLines}\n${headers.map(h => `"${h}"`).join(',')}\n${rows.map(r => r.join(',')).join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = (sheetTitle.trim() || 'Data_Differentiation').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `${sanitizedTitle}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-4">
      <div className="no-print bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <Tag className="w-3.5 h-3.5" />
            <label htmlFor="sheet-name-input" className="font-semibold text-slate-600 dark:text-slate-300">
              Sheet Name:
            </label>
            <input
              id="sheet-name-input"
              type="text"
              value={sheetTitle}
              onChange={e => onChangeSheetTitle && onChangeSheetTitle(e.target.value)}
              placeholder="Name for this sheet..."
              className="w-48 px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-60"
            title="Export as professional PDF document"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>Export PDF</span>
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm print:shadow-none print:border-none print:p-0 print:bg-white print:text-slate-800">
        <div className="border-b-2 border-slate-900 dark:border-slate-200 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                {sheetTitle.trim() || 'Data Differentiation'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Generated Date: {currentDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg mb-6 text-xs">
          <div>
            <div className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">Dataset A:</div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100 font-mono">
              {formatValue(summary.row1TotalAmount)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{summary.row1TotalCount} records</div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">Dataset B:</div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100 font-mono">
              {formatValue(summary.row2TotalAmount)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{summary.row2TotalCount} records</div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">Net Value Difference:</div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100 font-mono">
              {summary.netAmountDifference > 0 ? '+' : ''}
              {formatValue(summary.netAmountDifference)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {summary.changedContributionCount} values changed
            </div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">Dataset Breakdown:</div>
            <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs font-semibold">
              <span className="text-right font-mono text-emerald-700 dark:text-emerald-300">{summary.identicalCount}</span>
              <span className="text-emerald-700 dark:text-emerald-300">Identical Matches</span>
              <span className="text-right font-mono text-blue-700 dark:text-blue-300">{summary.changedContributionCount}</span>
              <span className="text-blue-700 dark:text-blue-300">Values Changed</span>
              <span className="text-right font-mono text-amber-700 dark:text-amber-300">{summary.row1OnlyCount}</span>
              <span className="text-amber-700 dark:text-amber-300">Dataset A Only</span>
              <span className="text-right font-mono text-purple-600 dark:text-purple-300">{summary.row2OnlyCount}</span>
              <span className="text-purple-600 dark:text-purple-300">Dataset B Only</span>
            </div>
          </div>
        </div>

        <PageControls page={page} count={pairs.length} onChange={setPage} />
        <div className="mb-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 dark:border-slate-600 bg-slate-100/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold uppercase text-[10px]">
                <th className="py-2 px-2 w-8">#</th>
                <th className="py-2 px-2">Dataset A name</th>
                <th className="py-2 px-2 text-right">Dataset A value</th>
                <th className="py-2 px-2">Dataset B name</th>
                <th className="py-2 px-2 text-right">Dataset B value</th>
                <th className="py-2 px-2 text-right">Difference</th>
                <th className="py-2 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {pairs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 text-[11px]">
                  <td className="py-2 px-2 text-slate-400 dark:text-slate-500 font-mono">{page * PAGE_SIZE + idx + 1}</td>
                  <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-100">
                    {p.row1Record?.name || <span className="text-slate-400 dark:text-slate-500 italic">None</span>}
                  </td>
                  <td className="py-2 px-2 text-right font-mono">
                    {p.row1Record ? formatValue(p.row1Record.contribution) : '—'}
                  </td>
                  <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-100">
                    {p.row2Record?.name || <span className="text-slate-400 dark:text-slate-500 italic">None</span>}
                  </td>
                  <td className="py-2 px-2 text-right font-mono">
                    {p.row2Record ? formatValue(p.row2Record.contribution) : '—'}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-semibold">
                    {p.status === 'IDENTICAL' ? (
                      <span className="text-emerald-700 dark:text-emerald-300">0.00</span>
                    ) : p.status === 'VALUES_CHANGED' ? (
                      <span className="text-blue-700 dark:text-blue-300">
                        {p.contributionDifference > 0 ? '+' : ''}
                        {formatValue(p.contributionDifference)}
                      </span>
                    ) : p.status === 'DATASET_A_ONLY' ? (
                      <span className="text-amber-700 dark:text-amber-300">
                        -{formatValue(p.row1Record?.contribution || 0)}
                      </span>
                    ) : (
                      <span className="text-purple-600 dark:text-purple-300">
                        +{formatValue(p.row2Record?.contribution || 0)}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="font-semibold text-[10px]">
                      {p.status === 'IDENTICAL' && 'Unchanged'}
                      {p.status === 'VALUES_CHANGED' && 'Values Changed'}
                      {p.status === 'DATASET_A_ONLY' && 'Dataset A Only'}
                      {p.status === 'DATASET_B_ONLY' && 'Dataset B Only'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
