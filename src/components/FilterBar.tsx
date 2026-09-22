import React from 'react';
import { TaskCategory } from '../types';

export type StatusFilter = '전체' | '오늘' | '미완료' | '완료';

interface FilterBarProps {
  statusFilter: StatusFilter;
  onStatusChange: (f: StatusFilter) => void;
  categoryFilter: TaskCategory | '전체';
  onCategoryChange: (c: TaskCategory | '전체') => void;
  categories: TaskCategory[];
}

export const FilterBar: React.FC<FilterBarProps> = ({ statusFilter, onStatusChange, categoryFilter, onCategoryChange, categories }) => {
  const statuses: StatusFilter[] = ['전체', '오늘', '미완료', '완료'];
  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className={`shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-full border transition ${
              statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        <button
          onClick={() => onCategoryChange('전체')}
          className={`shrink-0 px-3 py-1 text-[11px] font-medium rounded-full border ${
            categoryFilter === '전체' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'
          }`}
        >
          전체
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => onCategoryChange(c)}
            className={`shrink-0 px-3 py-1 text-[11px] font-medium rounded-full border ${
              categoryFilter === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
};
