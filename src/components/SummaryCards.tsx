import React from 'react';
import { ReconciliationSummary, formatValue } from '../utils/matcher';
import { CheckCircle2, UserMinus, UserPlus, ArrowRightLeft, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from './ui/Button';
interface SummaryCardsProps { summary: ReconciliationSummary; activeFilter: string; onFilterChange: (filter: string) => void; }
export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, activeFilter, onFilterChange }) => {
  const positive = summary.netAmountDifference > 0;
  const categories = [
    { key: 'IDENTICAL', label: 'Identical', hint: 'Same name and value', value: summary.identicalCount, Icon: CheckCircle2 },
    { key: 'VALUES_CHANGED', label: 'Values changed', hint: 'Same name, new value', value: summary.changedContributionCount, Icon: ArrowRightLeft },
    { key: 'DATASET_A_ONLY', label: 'Dataset A only', hint: 'Missing in Dataset B', value: summary.row1OnlyCount, Icon: UserMinus },
    { key: 'DATASET_B_ONLY', label: 'Dataset B only', hint: 'Missing in Dataset A', value: summary.row2OnlyCount, Icon: UserPlus },
  ];
  return <section className="summary-section">
    <div className="totals-grid">
      <div className="total-item"><p><span className="dataset-dot" aria-hidden="true" />Dataset A total</p><div><strong>{formatValue(summary.row1TotalAmount)}</strong><span>{summary.row1TotalCount} entries</span></div></div>
      <div className="total-item"><p><span className="dataset-dot" aria-hidden="true" />Dataset B total</p><div><strong>{formatValue(summary.row2TotalAmount)}</strong><span>{summary.row2TotalCount} entries</span></div></div>
      <div className="total-item net-total"><p>{positive ? <TrendingUp size={17} /> : <TrendingDown size={17} />}Net difference (B − A)</p><div><strong>{positive ? '+' : ''}{formatValue(summary.netAmountDifference)}</strong><span>{summary.netAmountDifference === 0 ? 'No net change' : positive ? 'Net increase' : 'Net decrease'}</span></div></div>
    </div>
    <div className="category-grid">{categories.map(({ key, label, hint, value, Icon }) => <Button key={key} data-status={key} className={`category-item ${activeFilter === key ? 'selected' : ''}`} aria-pressed={activeFilter === key} onClick={() => onFilterChange(activeFilter === key ? 'ALL' : key)}><span className="category-icon"><Icon size={21} /></span><span><strong>{value}</strong><span className="category-label">{label}</span><small>{hint}</small></span></Button>)}</div>
  </section>;
};
