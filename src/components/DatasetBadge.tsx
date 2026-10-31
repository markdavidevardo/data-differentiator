import React from 'react';

/** Shared marker for Dataset A / Dataset B: a black tile with the dataset letter. */
export const DatasetBadge: React.FC<{ dataset: 'A' | 'B'; size?: 'sm' | 'md' }> = ({ dataset, size = 'md' }) => (
  <span className={`dataset-badge dataset-badge-${size}`} aria-hidden="true">{dataset}</span>
);
