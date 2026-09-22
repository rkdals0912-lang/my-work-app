import React from 'react';
import { PlusCircle, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onOpenNewTaskModal: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewTaskModal, onResetData }) => {
  const todayDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-extrabold text-lg tracking-tight">나의 하루</div>
          <div className="text-xs text-slate-400">{todayDate}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onResetData}
            title="샘플 데이터 초기화"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenNewTaskModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>할 일 추가</span>
          </button>
        </div>
      </div>
    </header>
  );
};
