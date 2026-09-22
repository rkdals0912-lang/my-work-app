import React from 'react';
import { UserProfile } from '../types';
import { DEFAULT_USERS } from '../data/initialData';
import { 
  CheckSquare, 
  History, 
  PlusCircle, 
  Download, 
  UserCheck, 
  Clock, 
  RotateCcw,
  Repeat,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onOpenNewTaskModal: () => void;
  onOpenGlobalAuditModal: () => void;
  onOpenRoutineModal?: () => void;
  onExportAuditCSV: () => void;
  onResetData: () => void;
  totalTaskCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSelectUser,
  onOpenNewTaskModal,
  onOpenGlobalAuditModal,
  onOpenRoutineModal,
  onExportAuditCSV,
  onResetData,
  totalTaskCount,
}) => {
  const todayDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-4">
          
          {/* Logo & Info */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-inner text-white font-black tracking-wider">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">TASK TRACKER</span>
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  나의 할 일 & 일상 이력 추적
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  v2.5
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>일상 업무 · 개인 일정 · 현장 작업 실시간 이력 추적기</span>
                <span>•</span>
                <span className="text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {todayDate}
                </span>
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Operator Selector (Crucial for audit tracking who performed which task) */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700">
              <div className="px-2 py-1 text-xs text-slate-400 flex items-center gap-1 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">작업자:</span>
              </div>
              <select
                id="active-user-select"
                value={currentUser.id}
                onChange={(e) => {
                  const found = DEFAULT_USERS.find((u) => u.id === e.target.value);
                  if (found) onSelectUser(found);
                }}
                className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
              >
                {DEFAULT_USERS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role} · {u.shift})
                  </option>
                ))}
              </select>
            </div>

            {/* Global Audit Log */}
            <button
              id="btn-global-audit"
              onClick={onOpenGlobalAuditModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 rounded-lg border border-slate-700 transition shadow-sm"
              title="공장 전체 작업 변경 이력 추적 기록 보기"
            >
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>전체 이력 추적</span>
            </button>

            {/* Routine Automation Button */}
            {onOpenRoutineModal && (
              <button
                id="btn-routine-automation"
                onClick={onOpenRoutineModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-lg shadow-sm border border-indigo-400/30 transition cursor-pointer"
                title="매일/매주 반복 루틴을 기반으로 내일 할 일 자동 편성 및 등록"
              >
                <Repeat className="w-3.5 h-3.5 text-indigo-200" />
                <span>일상 루틴 자동화 (AI)</span>
              </button>
            )}

            {/* Export CSV */}
            <button
              id="btn-export-csv"
              onClick={onExportAuditCSV}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
              title="이력 추적 로그 CSV 파일 내보내기"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">CSV 내보내기</span>
            </button>

            {/* Reset sample data */}
            <button
              id="btn-reset-data"
              onClick={onResetData}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-700 transition"
              title="초기 샘플 데이터 복원"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Add Task Button */}
            <button
              id="btn-new-task"
              onClick={onOpenNewTaskModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>새로운 할 일 등록</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
