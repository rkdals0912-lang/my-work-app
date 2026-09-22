import React from 'react';
import { SealantTask } from '../types';
import { 
  ClipboardList, 
  PlayCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Gauge, 
  CalendarDays 
} from 'lucide-react';

interface MetricsBarProps {
  tasks: SealantTask[];
  onFilterByStatus?: (status: string) => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ tasks, onFilterByStatus }) => {
  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === '진행중').length;
  const completed = tasks.filter((t) => t.status === '완료').length;
  const pending = tasks.filter((t) => t.status === '대기').length;
  const inspection = tasks.filter((t) => t.status === '검사대기').length;

  // Unresolved issues across all tasks
  const unresolvedIssues = tasks.reduce((sum, task) => {
    return sum + task.issues.filter((i) => !i.resolved).length;
  }, 0);

  // Today due count
  const todayStr = '2026-09-21';
  const dueTodayCount = tasks.filter((t) => {
    const due = t.dueDate || t.scheduledDate || todayStr;
    return due === todayStr;
  }).length;

  // Average progress
  const avgProgress = total > 0 
    ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / total) 
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      
      {/* 1. 총 할 일 */}
      <div 
        onClick={() => onFilterByStatus && onFilterByStatus('ALL')}
        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition cursor-pointer"
      >
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold">총 등록된 할 일</span>
          <ClipboardList className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold tracking-tight text-slate-900">{total}</span>
          <span className="text-xs text-slate-500 font-medium">건</span>
        </div>
        <div className="mt-1.5 flex items-center text-[11px] text-slate-500">
          <span>대기 {pending}건</span>
          <span className="mx-1">•</span>
          <span>검사/검토 {inspection}건</span>
        </div>
      </div>

      {/* 2. 현재 진행중 */}
      <div 
        onClick={() => onFilterByStatus && onFilterByStatus('진행중')}
        className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs hover:border-blue-300 transition cursor-pointer"
      >
        <div className="flex items-center justify-between text-blue-700 mb-1.5">
          <span className="text-xs font-semibold">진행중인 할 일</span>
          <PlayCircle className="w-4 h-4 text-blue-500" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold tracking-tight text-blue-700">{inProgress}</span>
          <span className="text-xs text-blue-600 font-medium">건 실행중</span>
        </div>
        <div className="mt-1.5 text-[11px] text-blue-600/80 font-medium">
          현재 활성 진행 중
        </div>
      </div>

      {/* 3. 특이사항/지연 장애 */}
      <div 
        onClick={() => onFilterByStatus && onFilterByStatus('ISSUE')}
        className={`p-3.5 rounded-xl border shadow-xs transition cursor-pointer ${
          unresolvedIssues > 0 
            ? 'bg-amber-50/50 border-amber-300 hover:border-amber-400' 
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-amber-700 mb-1.5">
          <span className="text-xs font-semibold">특이사항 / 장애</span>
          <AlertTriangle className={`w-4 h-4 ${unresolvedIssues > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`} />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className={`text-2xl font-bold tracking-tight ${unresolvedIssues > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
            {unresolvedIssues}
          </span>
          <span className="text-xs text-amber-600 font-medium">건 미해결</span>
        </div>
        <div className="mt-1.5 text-[11px] text-amber-700 font-medium flex items-center gap-1">
          {unresolvedIssues > 0 ? (
            <span className="text-amber-800 font-semibold underline">조치 확인 필요</span>
          ) : (
            <span className="text-emerald-600">모든 특이사항 해결완료</span>
          )}
        </div>
      </div>

      {/* 4. 완료 건수 */}
      <div 
        onClick={() => onFilterByStatus && onFilterByStatus('완료')}
        className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs hover:border-emerald-300 transition cursor-pointer"
      >
        <div className="flex items-center justify-between text-emerald-700 mb-1.5">
          <span className="text-xs font-semibold">완료된 할 일</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold tracking-tight text-emerald-700">{completed}</span>
          <span className="text-xs text-emerald-600 font-medium">건 완료</span>
        </div>
        <div className="mt-1.5 text-[11px] text-emerald-600/90 font-medium">
          성공적으로 종료됨
        </div>
      </div>

      {/* 5. 평균 진도율 */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold">전체 평균 진도율</span>
          <Gauge className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold tracking-tight text-slate-900">{avgProgress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
          <div 
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${avgProgress}%` }}
          />
        </div>
      </div>

      {/* 6. 오늘 마감 일정 */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold">오늘 마감 기한</span>
          <CalendarDays className="w-4 h-4 text-blue-500" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold tracking-tight text-slate-900">{dueTodayCount}</span>
          <span className="text-xs text-slate-500 font-medium">건 예정</span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-500 font-mono">
          기준일: 2026-09-21
        </div>
      </div>

    </div>
  );
};
