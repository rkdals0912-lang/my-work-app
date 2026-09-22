import React, { useState, useMemo } from 'react';
import { Task } from '../types';
import { TaskCard } from './TaskCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = toDateStr(new Date());

interface TaskCalendarViewProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onClickTask: (task: Task) => void;
  onDelete: (id: string) => void;
  onAddForDate: (date: string) => void;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({ tasks, onToggle, onClickTask, onDelete, onAddForDate }) => {
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(todayStr);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      (map[t.date] ||= []).push(t);
    }
    return map;
  }, [tasks]);

  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const selectedTasks = (tasksByDate[selected] || []).sort((a, b) => (a.startTime || '99') > (b.startTime || '99') ? 1 : -1);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3 px-1">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1.5 text-slate-400 hover:text-slate-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-800">{year}년 {month + 1}월</span>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1.5 text-slate-400 hover:text-slate-700">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 mb-1">
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((date, idx) => {
            if (!date) return <div key={idx} />;
            const ds = toDateStr(date);
            const dayTasks = tasksByDate[ds] || [];
            const hasIncomplete = dayTasks.some((t) => !t.completed);
            const isSelected = ds === selected;
            const isToday = ds === todayStr;
            return (
              <button
                key={idx}
                onClick={() => setSelected(ds)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative ${
                  isSelected ? 'bg-blue-600 text-white font-bold' : isToday ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'
                }`}
              >
                {date.getDate()}
                {dayTasks.length > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : hasIncomplete ? 'bg-blue-500' : 'bg-slate-300'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-sm font-bold text-slate-700">{selected} 일정</h3>
          <button onClick={() => onAddForDate(selected)} className="text-xs font-semibold text-blue-600">+ 추가</button>
        </div>
        {selectedTasks.length === 0 ? (
          <p className="text-sm text-slate-400 px-1">등록된 일정이 없어요.</p>
        ) : (
          <div className="space-y-2">
            {selectedTasks.map((t) => (
              <TaskCard key={t.id} task={t} onToggle={onToggle} onClick={onClickTask} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
