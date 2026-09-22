import React, { useMemo, useState } from 'react';
import { SealantTask, TaskMemo, TaskIssue, TaskStatus } from '../types';
import { 
  CalendarClock, 
  PlayCircle, 
  MessageSquareText, 
  AlertOctagon, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  Flame, 
  Sparkles, 
  Clock, 
  FileText,
  ShieldAlert,
  Bot,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Repeat
} from 'lucide-react';

interface TodaySummaryProps {
  tasks: SealantTask[];
  onFilterByStatus: (status: TaskStatus | 'ALL' | 'ISSUE') => void;
  onSelectTask: (task: SealantTask, tab?: 'progress' | 'memos' | 'issues' | 'audit') => void;
  onOpenRoutineModal?: () => void;
}

export const TodaySummary: React.FC<TodaySummaryProps> = ({
  tasks,
  onFilterByStatus,
  onSelectTask,
  onOpenRoutineModal,
}) => {
  // Reference date: 2026-09-21 (Today)
  const todayStr = '2026-09-21';

  // Calculations for Today's Work Summary
  const summary = useMemo(() => {
    // 1. Tasks due today (and overdue check)
    const dueTodayTasks = tasks.filter((t) => {
      const due = t.dueDate || t.scheduledDate || todayStr;
      return due === todayStr;
    });

    const dueTodayCompleted = dueTodayTasks.filter((t) => t.status === '완료').length;
    const dueTodayPending = dueTodayTasks.filter((t) => t.status !== '완료').length;

    // Overdue tasks
    const overdueTasks = tasks.filter((t) => {
      const due = t.dueDate || t.scheduledDate || todayStr;
      return due < todayStr && t.status !== '완료';
    });

    // 2. Active In-Progress Tasks
    const inProgressTasks = tasks.filter((t) => t.status === '진행중');
    const waitingInspectionTasks = tasks.filter((t) => t.status === '검사대기');
    const avgProgress = inProgressTasks.length > 0
      ? Math.round(inProgressTasks.reduce((acc, t) => acc + t.progress, 0) / inProgressTasks.length)
      : 0;

    // 3. Memos & Issues created Today (or latest)
    const allMemosToday: { memo: TaskMemo; task: SealantTask }[] = [];
    const allIssuesToday: { issue: TaskIssue; task: SealantTask }[] = [];

    tasks.forEach((task) => {
      task.memos.forEach((m) => {
        if (m.createdAt.startsWith(todayStr)) {
          allMemosToday.push({ memo: m, task });
        }
      });
      task.issues.forEach((iss) => {
        if (iss.createdAt.startsWith(todayStr)) {
          allIssuesToday.push({ issue: iss, task });
        }
      });
    });

    // Active unresolved issues overall
    const totalUnresolvedIssues = tasks.reduce(
      (acc, t) => acc + t.issues.filter((i) => !i.resolved).length,
      0
    );

    return {
      dueTodayTasks,
      dueTodayCompleted,
      dueTodayPending,
      overdueCount: overdueTasks.length,
      inProgressTasks,
      waitingInspectionTasks,
      avgProgress,
      allMemosToday,
      allIssuesToday,
      totalUnresolvedIssues,
    };
  }, [tasks, todayStr]);

  // AI Briefing States
  const [isAiBriefingLoading, setIsAiBriefingLoading] = useState(false);
  const [aiBriefing, setAiBriefing] = useState<{
    briefingTitle: string;
    bullets: string[];
    encouragement?: string;
  } | null>(null);
  const [isBriefingOpen, setIsBriefingOpen] = useState(true);

  const handleFetchAiBriefing = async () => {
    setIsAiBriefingLoading(true);
    try {
      const summaryPayload = {
        totalTasks: tasks.length,
        todayDueCount: summary.dueTodayTasks.length,
        todayPendingCount: summary.dueTodayPending,
        overdueCount: summary.overdueCount,
        inProgressCount: summary.inProgressTasks.length,
        unresolvedIssuesCount: summary.totalUnresolvedIssues,
        sampleTasks: tasks.slice(0, 5).map((t) => ({
          title: t.productName,
          status: t.status,
          priority: t.priority,
          progress: `${t.progress}%`,
        })),
      };

      const res = await fetch('/api/ai/daily-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasksSummary: summaryPayload }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAiBriefing(data.briefing);
        setIsBriefingOpen(true);
      }
    } catch (e) {
      console.error('Failed to fetch AI briefing', e);
    } finally {
      setIsAiBriefingLoading(false);
    }
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Title Header with Today Date indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            오늘 나의 할 일 & 작업 요약
            <span className="text-xs font-normal text-slate-500 font-mono">
              ({todayStr})
            </span>
          </h2>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-2">
          {onOpenRoutineModal && (
            <button
              onClick={onOpenRoutineModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
              title="매일/매주 반복 루틴을 바탕으로 내일 할 일 자동 편성"
            >
              <Repeat className="w-3.5 h-3.5 text-indigo-200" />
              <span>내일 할 일 루틴 자동화 (AI)</span>
            </button>
          )}
          <button
            onClick={handleFetchAiBriefing}
            disabled={isAiBriefingLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            {isAiBriefingLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>AI 브리핑 분석 중...</span>
              </>
            ) : (
              <>
                <Bot className="w-3.5 h-3.5" />
                <span>Gemini 일일 브리핑 생성</span>
              </>
            )}
          </button>
          <span className="inline-flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" /> 실시간 할 일 집계
          </span>
        </div>
      </div>

      {/* AI Daily Briefing Banner (when active) */}
      {aiBriefing && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-indigo-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {aiBriefing.briefingTitle || '오늘의 Gemini AI 종합 실행 브리핑'}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 border border-blue-400/30 font-normal">
                    AI 분석 리포트
                  </span>
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleFetchAiBriefing}
                title="브리핑 새로고침"
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAiBriefingLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsBriefingOpen(!isBriefingOpen)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
              >
                {isBriefingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isBriefingOpen && (
            <div className="mt-3 space-y-2 text-xs text-blue-100">
              <ul className="space-y-1.5">
                {aiBriefing.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
              {aiBriefing.encouragement && (
                <div className="pt-2 border-t border-indigo-700/40 text-[11px] text-blue-300/90 font-medium">
                  💡 {aiBriefing.encouragement}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3 Main Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CARD 1: 오늘 마감 기한 작업 현황 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-700">오늘 마감 기한 할 일</h3>
                  <p className="text-[11px] text-slate-400">당일 처리 완료 예정 항목</p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800">
                오늘 마감
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {summary.dueTodayTasks.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">건 예정</span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs font-bold text-amber-700">
                {summary.dueTodayPending}건 남음
              </span>
              <span className="text-xs text-emerald-600 font-medium">
                ({summary.dueTodayCompleted}건 완료)
              </span>
            </div>

            {/* Sublist preview of today due tasks */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              {summary.dueTodayTasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-1">오늘 마감으로 설정된 작업이 없습니다.</p>
              ) : (
                summary.dueTodayTasks.slice(0, 2).map((task) => (
                  <div 
                    key={task.id}
                    onClick={() => onSelectTask(task, 'progress')}
                    className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50 hover:bg-amber-50/70 border border-slate-100 cursor-pointer transition"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-mono text-[10px] text-slate-500 font-bold block">{task.lotNo}</span>
                      <span className="text-slate-800 font-medium truncate block max-w-[170px]">{task.productName}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        task.status === '완료' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {task.status} ({task.progress}%)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card footer note / action */}
          <div className="pt-3 mt-2 flex items-center justify-between border-t border-slate-100 text-[11px]">
            {summary.overdueCount > 0 ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" />
                기한 초과 {summary.overdueCount}건 주의
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                지연 작업 없음
              </span>
            )}
            <button
              onClick={() => onFilterByStatus('진행중')}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
            >
              진행 관리 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* CARD 2: 진행중인 작업 현황 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                  <PlayCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-700">진행중인 할 일 현황</h3>
                  <p className="text-[11px] text-slate-400">현재 집중 처리 및 실행 중인 항목</p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-100 text-blue-800">
                실시간 실행
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono">
                {summary.inProgressTasks.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">건 진행중</span>
              {summary.waitingInspectionTasks.length > 0 && (
                <>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-xs font-medium text-purple-700">
                    검사대기 {summary.waitingInspectionTasks.length}건
                  </span>
                </>
              )}
            </div>

            {/* Progress gauge for active in-progress jobs */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> 가동 작업 평균 진도율
                </span>
                <span className="font-extrabold font-mono text-blue-700">{summary.avgProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${summary.avgProgress}%` }}
                />
              </div>

              {/* In-progress task mini tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {summary.inProgressTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onSelectTask(task, 'progress')}
                    className="text-[10px] px-2 py-1 rounded bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-700 font-medium truncate max-w-[130px] transition"
                    title={`${task.lotNo} (${task.productName})`}
                  >
                    {task.lotNo.slice(-6)}: {task.stage} ({task.progress}%)
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card footer note / action */}
          <div className="pt-3 mt-2 flex items-center justify-between border-t border-slate-100 text-[11px]">
            <span className="text-slate-500">
              총 {tasks.length}개 작업 중 가동률 {Math.round((summary.inProgressTasks.length / (tasks.length || 1)) * 100)}%
            </span>
            <button
              onClick={() => onFilterByStatus('진행중')}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
            >
              진행 목록 보기 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* CARD 3: 오늘 등록된 메모 및 특이사항 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
                  <MessageSquareText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-700">오늘 등록된 메모 / 특이사항</h3>
                  <p className="text-[11px] text-slate-400">현장 지시사항 및 이상 조치 내역</p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-purple-100 text-purple-800">
                소통 & 이슈
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {summary.allMemosToday.length + summary.allIssuesToday.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">건 기록</span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs font-semibold text-blue-700">
                메모 {summary.allMemosToday.length}건
              </span>
              <span className="text-xs font-semibold text-amber-700">
                특이사항 {summary.allIssuesToday.length}건
              </span>
            </div>

            {/* List of recent today's memos or issues */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              {summary.allIssuesToday.length > 0 ? (
                summary.allIssuesToday.slice(0, 2).map(({ issue, task }) => (
                  <div
                    key={issue.id}
                    onClick={() => onSelectTask(task, 'issues')}
                    className="flex items-start gap-1.5 p-1.5 rounded-lg bg-amber-50/70 border border-amber-200/80 cursor-pointer hover:bg-amber-100/60 transition text-xs"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-amber-900 truncate">[{issue.category}] {task.lotNo}</span>
                        <span className="text-amber-700 font-mono">{issue.createdAt.slice(11, 16)}</span>
                      </div>
                      <p className="text-[11px] text-slate-700 truncate">{issue.content}</p>
                    </div>
                  </div>
                ))
              ) : summary.allMemosToday.length > 0 ? (
                summary.allMemosToday.slice(0, 2).map(({ memo, task }) => (
                  <div
                    key={memo.id}
                    onClick={() => onSelectTask(task, 'memos')}
                    className="flex items-start gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer hover:bg-blue-50/60 transition text-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-800 truncate">[{memo.category}] {memo.author}</span>
                        <span className="text-slate-400 font-mono">{memo.createdAt.slice(11, 16)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">{memo.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-2 text-center text-xs text-slate-400">
                  오늘 등록된 신규 메모나 특이사항이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* Card footer note / action */}
          <div className="pt-3 mt-2 flex items-center justify-between border-t border-slate-100 text-[11px]">
            <span className="text-amber-700 font-medium">
              전체 미해결 특이사항: <strong>{summary.totalUnresolvedIssues}건</strong>
            </span>
            <button
              onClick={() => onFilterByStatus('ISSUE')}
              className="text-amber-700 hover:text-amber-900 font-medium flex items-center gap-0.5"
            >
              특이사항 관리 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
