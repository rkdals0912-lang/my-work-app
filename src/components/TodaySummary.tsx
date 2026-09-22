import React from 'react';
import { Task } from '../types';
import { TaskCard } from './TaskCard';

const pad = (n: number) => String(n).padStart(2, '0');
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

interface TodaySummaryProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onClickTask: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TodaySummary: React.FC<TodaySummaryProps> = ({ tasks, onToggle, onClickTask, onDelete }) => {
  const today = todayStr();
  const todayTasks = tasks.filter((t) => t.date === today);
  const scheduled = todayTasks.filter((t) => t.startTime).sort((a, b) => (a.startTime! > b.startTime! ? 1 : -1));
  const unscheduled = todayTasks.filter((t) => !t.startTime);
  const completedCount = todayTasks.filter((t) => t.completed).length;
  const totalCount = todayTasks.length;
  const pct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const incomplete = todayTasks.filter((t) => !t.completed);

  const weekday = new Date().toLocaleDateString('ko-KR', { weekday: 'long' });

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-slate-700">오늘의 할 일 · {weekday}</span>
          <span className="text-sm font-bold text-blue-600">{completedCount} / {totalCount}</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-right text-xs text-slate-400 mt-1">{pct}% 완료</div>
      </div>

      {scheduled.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-1">시간별 일정</h3>
          <div className="space-y-2">
            {scheduled.map((t) => (
              <TaskCard key={t.id} task={t} onToggle={onToggle} onClick={onClickTask} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-1">오늘 할 일</h3>
        {unscheduled.length === 0 ? (
          <p className="text-sm text-slate-400 px-1">등록된 할 일이 없어요.</p>
        ) : (
          <div className="space-y-2">
            {unscheduled.map((t) => (
              <TaskCard key={t.id} task={t} onToggle={onToggle} onClick={onClickTask} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>

      {incomplete.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-700">아직 완료하지 못한 항목이 {incomplete.length}개 있어요.</p>
        </div>
      )}
    </div>
  );
};
