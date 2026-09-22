import React from 'react';
import { Search, SlidersHorizontal, AlertCircle, Sparkles } from 'lucide-react';
import { PROCESS_STAGES } from '../data/initialData';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: string;
  onSelectStatus: (s: string) => void;
  selectedLine: string;
  onSelectLine: (l: string) => void;
  selectedStage: string;
  onSelectStage: (st: string) => void;
  sortBy: string;
  onSortByChange: (sb: string) => void;
  lines: string[];
  unresolvedIssueCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onSelectStatus,
  selectedLine,
  onSelectLine,
  selectedStage,
  onSelectStage,
  sortBy,
  onSortByChange,
  lines,
  unresolvedIssueCount,
}) => {
  const statusTabs = [
    { id: 'ALL', label: '전체 할 일' },
    { id: '진행중', label: '진행중' },
    { id: 'ISSUE', label: `특이사항 발생 (${unresolvedIssueCount})`, alert: unresolvedIssueCount > 0 },
    { id: 'URGENT', label: '긴급 할 일' },
    { id: '검사대기', label: '검토/검사' },
    { id: '대기', label: '대기' },
    { id: '완료', label: '완료' },
  ];

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 space-y-3.5">
      
      {/* Top row: Status Tabs */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 min-w-max">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  isActive
                    ? tab.alert
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-900 text-white shadow-xs'
                    : tab.alert
                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.alert && <AlertCircle className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick count indicator */}
        <div className="hidden lg:flex items-center text-xs text-slate-400 font-mono">
          <span>Daily & Task Audit Tracker</span>
        </div>
      </div>

      {/* Bottom row: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="식별 번호, 할 일 제목, 담당자, 장소 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Line / Place Filter */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedLine}
            onChange={(e) => onSelectLine(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          >
            <option value="ALL">전체 구분/장소</option>
            {lines.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => onSelectStage(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          >
            <option value="ALL">전체 진행단계</option>
            {PROCESS_STAGES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="text-xs bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="NEWEST">최신 등록순</option>
              <option value="PROGRESS_DESC">진도율 높은순</option>
              <option value="PROGRESS_ASC">진도율 낮은순</option>
              <option value="PRIORITY">우선순위순</option>
              <option value="ISSUES">특이사항순</option>
            </select>
          </div>
        </div>

      </div>

    </div>
  );
};
