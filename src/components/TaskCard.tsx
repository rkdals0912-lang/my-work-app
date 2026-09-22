import React from 'react';
import { Task } from '../types';
import { Clock, Repeat, Trash2 } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  '업무': 'bg-blue-100 text-blue-700 border-blue-200',
  '집안일': 'bg-amber-100 text-amber-700 border-amber-200',
  '개인': 'bg-purple-100 text-purple-700 border-purple-200',
  '가족': 'bg-pink-100 text-pink-700 border-pink-200',
  '약속': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '쇼핑': 'bg-orange-100 text-orange-700 border-orange-200',
  '건강/운동': 'bg-teal-100 text-teal-700 border-teal-200',
  '기타': 'bg-slate-100 text-slate-700 border-slate-200',
};

const PRIORITY_DOT: Record<string, string> = {
  '높음': 'bg-red-500',
  '보통': 'bg-yellow-400',
  '낮음': 'bg-slate-300',
};

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onClick: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onClick, onDelete }) => {
  const colorClass = CATEGORY_COLORS[task.category] || CATEGORY_COLORS['기타'];

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border bg-white shadow-sm active:scale-[0.99] transition ${
        task.completed ? 'opacity-50' : ''
      }`}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition ${
          task.completed ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
        }`}
        aria-label="완료 체크"
      >
        {task.completed && <span className="text-white text-xs">✓</span>}
      </button>

      <div className="flex-1 min-w-0" onClick={() => onClick(task)}>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
          <span className={`truncate font-medium text-slate-800 ${task.completed ? 'line-through' : ''}`}>
            {task.title}
          </span>
          {task.routineId && <Repeat className="w-3 h-3 text-slate-400 shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-[11px] px-1.5 py-0.5 rounded border font-medium ${colorClass}`}>
            {task.category}
          </span>
          {task.startTime && (
            <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {task.startTime}
              {task.endTime ? ` - ${task.endTime}` : ''}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="p-1.5 text-slate-300 hover:text-red-500 shrink-0"
        aria-label="삭제"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
