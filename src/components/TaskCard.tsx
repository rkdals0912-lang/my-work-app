import React from 'react';
import { SealantTask, ProcessStage, TaskStatus } from '../types';
import { PROCESS_STAGES } from '../data/initialData';
import { 
  AlertTriangle, 
  MessageSquare, 
  History, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  User,
  Box
} from 'lucide-react';

interface TaskCardProps {
  task: SealantTask;
  onOpenDetail: (task: SealantTask, initialTab?: 'progress' | 'memos' | 'issues' | 'audit') => void;
  onQuickProgressChange: (task: SealantTask, delta: number) => void;
  onQuickStatusChange: (task: SealantTask, status: TaskStatus) => void;
  onQuickStageChange: (task: SealantTask, stage: ProcessStage) => void;
  onQuickAddIssue: (task: SealantTask) => void;
  onQuickAddMemo: (task: SealantTask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onOpenDetail,
  onQuickProgressChange,
  onQuickStatusChange,
  onQuickStageChange,
  onQuickAddIssue,
  onQuickAddMemo,
}) => {
  const unresolvedIssues = task.issues.filter((i) => !i.resolved);
  const currentStageIndex = PROCESS_STAGES.indexOf(task.stage);

  // Status badge styling
  const statusStyles: Record<TaskStatus, { bg: string; text: string; border: string }> = {
    진행중: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    검사대기: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    일시보류: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    완료: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    대기: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  };

  const priorityStyles = {
    긴급: 'bg-rose-100 text-rose-800 border-rose-200',
    우선: 'bg-amber-100 text-amber-800 border-amber-200',
    보통: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div 
      className={`bg-white rounded-xl border transition-all duration-200 shadow-xs hover:shadow-sm ${
        unresolvedIssues.length > 0
          ? 'border-amber-300 ring-1 ring-amber-200/60'
          : task.status === '진행중'
          ? 'border-blue-200'
          : 'border-slate-200'
      }`}
    >
      {/* Top Header */}
      <div className="p-4 sm:p-5 pb-3 border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          
          {/* Lot & Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-100 shadow-xs">
              {task.lotNo}
            </span>
            {task.taskType && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                task.taskType === 'DAILY'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : task.taskType === 'PERSONAL'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : task.taskType === 'MAINTENANCE'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {task.taskType === 'DAILY' ? '일상할일' : task.taskType === 'PERSONAL' ? '개인' : task.taskType === 'MAINTENANCE' ? '정비/점검' : '업무'}
              </span>
            )}
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${priorityStyles[task.priority]}`}>
              {task.priority === '긴급' && '🚨 '}
              {task.priority}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${statusStyles[task.status].bg} ${statusStyles[task.status].text} ${statusStyles[task.status].border}`}>
              {task.status}
            </span>
          </div>

          {/* Quick status selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">상태:</span>
            <select
              value={task.status}
              onChange={(e) => onQuickStatusChange(task, e.target.value as TaskStatus)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="대기">대기</option>
              <option value="진행중">진행중</option>
              <option value="검사대기">검사대기</option>
              <option value="일시보류">일시보류</option>
              <option value="완료">완료</option>
            </select>
          </div>
        </div>

        {/* Product Name */}
        <h3 
          onClick={() => onOpenDetail(task)}
          className="text-base font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer flex items-center justify-between"
        >
          <span>{task.productName}</span>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </h3>

        {/* Facility Info Meta */}
        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1.5 text-xs text-slate-500">
          <div className="flex items-center gap-1 text-slate-600">
            <Box className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{task.line}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>{task.manager} ({task.managerRole})</span>
          </div>
          <span>•</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
            {task.shift}
          </span>
          <span>•</span>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>
              {task.startDate || task.scheduledDate} ~ {task.dueDate || task.scheduledDate}
            </span>
          </div>
        </div>
      </div>

      {/* Process Stage Stepper (진행 단계) */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50/60 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-700">진행 단계:</span>
            <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
              {task.stage}
            </span>
          </div>
          
          {/* Quick Stage advance */}
          <div className="flex items-center gap-1 text-xs">
            <select
              value={task.stage}
              onChange={(e) => onQuickStageChange(task, e.target.value as ProcessStage)}
              className="text-xs bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none"
            >
              {PROCESS_STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Visual Mini Stepper */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {PROCESS_STAGES.map((stage, idx) => {
            const isPassed = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <div 
                key={stage}
                onClick={() => onQuickStageChange(task, stage)}
                title={`공정 단계 변경: ${stage}`}
                className={`flex-1 min-w-[50px] text-center py-1 px-1 rounded text-[10px] font-medium cursor-pointer transition ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : isPassed
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-slate-200/70 text-slate-500 hover:bg-slate-300'
                }`}
              >
                {stage}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress & Quantity Section */}
      <div className="p-4 sm:p-5 py-3.5 space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1 text-slate-700 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>진도율</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-extrabold text-sm text-slate-900">{task.progress}%</span>
              <span className="text-[11px] text-slate-500">
                ({task.producedQty.toLocaleString()} / {task.targetQty.toLocaleString()} {task.unit})
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div 
              className={`h-2.5 rounded-full transition-all duration-300 ${
                task.progress === 100
                  ? 'bg-emerald-500'
                  : task.progress >= 60
                  ? 'bg-blue-600'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${task.progress}%` }}
            />
          </div>

          {/* Quick Progress adjustment buttons */}
          <div className="flex items-center justify-between mt-2 pt-1">
            <span className="text-[11px] text-slate-400">진도율 빠른조정:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onQuickProgressChange(task, -10)}
                disabled={task.progress <= 0}
                className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded text-slate-700 font-medium disabled:opacity-40 transition"
              >
                -10%
              </button>
              <button
                onClick={() => onQuickProgressChange(task, 10)}
                disabled={task.progress >= 100}
                className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded text-slate-700 font-medium disabled:opacity-40 transition"
              >
                +10%
              </button>
              <button
                onClick={() => onQuickProgressChange(task, 100 - task.progress)}
                disabled={task.progress >= 100}
                className="px-2 py-0.5 text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-semibold border border-emerald-200 transition"
              >
                100% 완료
              </button>
            </div>
          </div>
        </div>

        {/* Checkpoint Preview */}
        {task.checkpoints.length > 0 && (
          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-700">체크포인트 (세부 실행):</span>
              <span className="text-slate-500 font-mono">
                {task.checkpoints.filter((c) => c.completed).length} / {task.checkpoints.length} 완료
              </span>
            </div>
            <div className="truncate text-slate-500">
              다음 예정:{' '}
              <span className="text-slate-700 font-medium">
                {task.checkpoints.find((c) => !c.completed)?.title || '모든 체크포인트 완료됨'}
              </span>
            </div>
          </div>
        )}

        {/* Unresolved Issue Alert Box if any */}
        {unresolvedIssues.length > 0 && (
          <div 
            onClick={() => onOpenDetail(task, 'issues')}
            className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 flex items-start gap-2 cursor-pointer hover:bg-amber-100/80 transition"
          >
            <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0 animate-bounce" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">
                  특이사항 발생 ({unresolvedIssues.length}건 미해결)
                </span>
                <span className="text-[10px] text-amber-700 underline font-semibold">조치하기</span>
              </div>
              <p className="text-[11px] text-amber-800 truncate mt-0.5">
                [{unresolvedIssues[0].category}] {unresolvedIssues[0].content}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Action Bar */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50 rounded-b-xl border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        
        {/* Count Badges (Click to jump to respective tab in detail modal) */}
        <div className="flex items-center gap-2">
          {/* Memos Button */}
          <button
            onClick={() => onOpenDetail(task, 'memos')}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 font-medium px-2 py-1 rounded hover:bg-white transition"
            title="작업 메모 보기 / 작성"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>메모 ({task.memos.length})</span>
          </button>

          {/* Issues Button */}
          <button
            onClick={() => onOpenDetail(task, 'issues')}
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition ${
              unresolvedIssues.length > 0
                ? 'text-amber-700 bg-amber-100/80 hover:bg-amber-200'
                : 'text-slate-600 hover:text-amber-600 hover:bg-white'
            }`}
            title="특이사항 및 품질 이상 관리"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${unresolvedIssues.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>특이사항 ({task.issues.length})</span>
          </button>

          {/* Audit Trail Button */}
          <button
            onClick={() => onOpenDetail(task, 'audit')}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-700 font-medium px-2 py-1 rounded hover:bg-white transition"
            title="작업 변경 이력 추적 타임라인 열기"
          >
            <History className="w-3.5 h-3.5 text-emerald-600" />
            <span>이력 ({task.auditHistory.length})</span>
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => onOpenDetail(task, 'progress')}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <span>상세 관리</span>
          <ArrowRight className="w-3 h-3" />
        </button>

      </div>

    </div>
  );
};
