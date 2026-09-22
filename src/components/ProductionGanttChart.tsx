import React, { useState, useMemo } from 'react';
import { SealantTask, TaskStatus, UserProfile } from '../types';
import { 
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle2, 
  Circle,
  Layers, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  CheckSquare,
  User,
  Plus,
  ArrowRight,
  Sparkles,
  HelpCircle,
  ListTodo
} from 'lucide-react';

interface ProductionGanttChartProps {
  tasks: SealantTask[];
  currentUser: UserProfile;
  onSelectTask: (task: SealantTask) => void;
  onQuickStatusChange: (task: SealantTask, status: TaskStatus) => void;
  onQuickToggleComplete?: (task: SealantTask) => void;
  onOpenNewTaskModal?: () => void;
}

type ViewFilterMode = 'MY_TODO' | 'ALL_TASKS' | 'OVERDUE' | 'IN_PROGRESS';
type GroupByMode = 'DATE' | 'STATUS' | 'MANAGER';

export const ProductionGanttChart: React.FC<ProductionGanttChartProps> = ({
  tasks,
  currentUser,
  onSelectTask,
  onQuickStatusChange,
  onQuickToggleComplete,
  onOpenNewTaskModal,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewFilter, setViewFilter] = useState<ViewFilterMode>('MY_TODO');
  const [groupBy, setGroupBy] = useState<GroupByMode>('DATE');
  const [windowOffsetDays, setWindowOffsetDays] = useState(0); // Sliding timeline

  // Base reference date (today: 2026-09-21)
  const todayStr = '2026-09-21';

  // Parse date string to timestamp at midnight
  const parseDateToMs = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
    }
    return new Date(dStr).getTime();
  };

  const todayMs = parseDateToMs(todayStr);

  // Filter tasks based on view mode (내 할일 vs 전체 업무 등)
  const displayedTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (viewFilter === 'MY_TODO') {
        // Matches current user by name or if user is assigned
        return t.manager === currentUser.name;
      }
      if (viewFilter === 'OVERDUE') {
        const due = parseDateToMs(t.dueDate || t.scheduledDate || todayStr);
        return due < todayMs && t.status !== '완료';
      }
      if (viewFilter === 'IN_PROGRESS') {
        return t.status === '진행중' || t.status === '대기';
      }
      return true; // ALL_TASKS
    });
  }, [tasks, viewFilter, currentUser.name, todayMs, todayStr]);

  // Overall statistics for To-do Checklist Header
  const myTasksCount = useMemo(() => {
    return tasks.filter((t) => t.manager === currentUser.name).length;
  }, [tasks, currentUser.name]);

  const stats = useMemo(() => {
    const total = displayedTasks.length;
    const completed = displayedTasks.filter((t) => t.status === '완료').length;
    const inProgress = displayedTasks.filter((t) => t.status === '진행중').length;
    const pending = displayedTasks.filter((t) => t.status === '대기').length;
    const overdue = displayedTasks.filter((t) => {
      const due = parseDateToMs(t.dueDate || t.scheduledDate || todayStr);
      return due < todayMs && t.status !== '완료';
    }).length;
    const dueToday = displayedTasks.filter((t) => {
      const due = t.dueDate || t.scheduledDate || todayStr;
      return due === todayStr && t.status !== '완료';
    }).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, pending, overdue, dueToday, completionRate };
  }, [displayedTasks, todayMs, todayStr]);

  // Determine timeline boundary
  const { minDateMs, maxDateMs, dayList } = useMemo(() => {
    let minMs = todayMs - 2 * 86400000;
    let maxMs = todayMs + 5 * 86400000;

    displayedTasks.forEach((t) => {
      const s = parseDateToMs(t.startDate || t.scheduledDate || todayStr);
      const e = parseDateToMs(t.dueDate || t.scheduledDate || todayStr);
      if (s < minMs) minMs = s;
      if (e > maxMs) maxMs = e;
    });

    minMs = minMs - 86400000;
    maxMs = maxMs + 2 * 86400000;

    const offsetMs = windowOffsetDays * 86400000;
    const effectiveMinMs = minMs + offsetMs;
    const effectiveMaxMs = maxMs + offsetMs;

    const days: { dateStr: string; dayOfWeek: string; isToday: boolean; isPast: boolean; ms: number }[] = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    let curr = effectiveMinMs;
    while (curr <= effectiveMaxMs) {
      const d = new Date(curr);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayOfWeek = dayNames[d.getDay()];

      days.push({
        dateStr,
        dayOfWeek,
        isToday: dateStr === todayStr,
        isPast: curr < todayMs,
        ms: curr,
      });

      curr += 86400000;
    }

    return {
      minDateMs: effectiveMinMs,
      maxDateMs: effectiveMaxMs,
      dayList: days,
    };
  }, [displayedTasks, todayMs, windowOffsetDays, todayStr]);

  // Grouped tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'STATUS') {
      const statusOrder: TaskStatus[] = ['진행중', '대기', '검사대기', '일시보류', '완료'];
      const groups: Record<string, SealantTask[]> = {};
      displayedTasks.forEach((t) => {
        if (!groups[t.status]) groups[t.status] = [];
        groups[t.status].push(t);
      });
      return statusOrder
        .filter((st) => groups[st] && groups[st].length > 0)
        .map((st) => ({ title: `상태: ${st}`, list: groups[st] }));
    }

    if (groupBy === 'MANAGER') {
      const groups: Record<string, SealantTask[]> = {};
      displayedTasks.forEach((t) => {
        const key = t.manager ? `${t.manager} (${t.managerRole || '담당'})` : '미배정 업무';
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
      });
      return Object.entries(groups).map(([title, list]) => ({ title, list }));
    }

    // Default: Group by Due Date Status (지연된 일, 오늘 할 일, 이번 주 예정, 완료된 일)
    const overdueList: SealantTask[] = [];
    const todayList: SealantTask[] = [];
    const upcomingList: SealantTask[] = [];
    const completedList: SealantTask[] = [];

    displayedTasks.forEach((t) => {
      if (t.status === '완료') {
        completedList.push(t);
        return;
      }
      const due = parseDateToMs(t.dueDate || t.scheduledDate || todayStr);
      if (due < todayMs) {
        overdueList.push(t);
      } else if ((t.dueDate || t.scheduledDate) === todayStr) {
        todayList.push(t);
      } else {
        upcomingList.push(t);
      }
    });

    const sections = [];
    if (overdueList.length > 0) {
      sections.push({ title: '🚨 기한 초과 (지연된 할 일)', list: overdueList, alert: true });
    }
    if (todayList.length > 0) {
      sections.push({ title: '📅 오늘까지 완료할 일 (Today To-Do)', list: todayList });
    }
    if (upcomingList.length > 0) {
      sections.push({ title: '⏳ 향후 예정 할 일 (Upcoming)', list: upcomingList });
    }
    if (completedList.length > 0) {
      sections.push({ title: '✅ 완료된 할 일 (Done)', list: completedList });
    }

    if (sections.length === 0) {
      return [{ title: '할 일 목록', list: [] }];
    }

    return sections;
  }, [displayedTasks, groupBy, todayMs, todayStr]);

  // Helper for Gantt bar calculations
  const calculateBarPosition = (task: SealantTask) => {
    const start = parseDateToMs(task.startDate || task.scheduledDate || todayStr);
    const end = parseDateToMs(task.dueDate || task.scheduledDate || todayStr);
    const totalTimelineSpan = maxDateMs - minDateMs + 86400000;

    const clampedStart = Math.max(minDateMs, start);
    const clampedEnd = Math.min(maxDateMs + 86400000, end + 86400000);

    const leftPercent = Math.max(0, ((clampedStart - minDateMs) / totalTimelineSpan) * 100);
    const widthPercent = Math.max(
      3.5,
      ((clampedEnd - clampedStart) / totalTimelineSpan) * 100
    );

    const isOverdue = end < todayMs && task.status !== '완료';
    const isDueToday = (task.dueDate || task.scheduledDate) === todayStr && task.status !== '완료';

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      isOverdue,
      isDueToday,
    };
  };

  // Status color mappings
  const getStatusColor = (status: TaskStatus, isOverdue: boolean) => {
    if (status === '완료') {
      return {
        bg: 'bg-emerald-500',
        track: 'bg-emerald-50/90 border-emerald-300',
        text: 'text-emerald-900',
        badge: 'bg-emerald-600 text-white',
      };
    }
    if (isOverdue) {
      return {
        bg: 'bg-rose-500',
        track: 'bg-rose-50/90 border-rose-300',
        text: 'text-rose-900',
        badge: 'bg-rose-600 text-white',
      };
    }
    switch (status) {
      case '진행중':
        return {
          bg: 'bg-blue-600',
          track: 'bg-blue-50/90 border-blue-300',
          text: 'text-blue-900',
          badge: 'bg-blue-600 text-white',
        };
      case '검사대기':
        return {
          bg: 'bg-purple-600',
          track: 'bg-purple-50/90 border-purple-300',
          text: 'text-purple-900',
          badge: 'bg-purple-600 text-white',
        };
      case '일시보류':
        return {
          bg: 'bg-amber-500',
          track: 'bg-amber-50/90 border-amber-300',
          text: 'text-amber-900',
          badge: 'bg-amber-600 text-white',
        };
      case '대기':
      default:
        return {
          bg: 'bg-slate-400',
          track: 'bg-slate-50 border-slate-300',
          text: 'text-slate-800',
          badge: 'bg-slate-600 text-white',
        };
    }
  };

  // Today marker line position
  const todayPositionPercent = useMemo(() => {
    const totalTimelineSpan = maxDateMs - minDateMs + 86400000;
    const pos = ((todayMs + 43200000 - minDateMs) / totalTimelineSpan) * 100;
    return Math.max(0, Math.min(100, pos));
  }, [todayMs, minDateMs, maxDateMs]);

  // Handle direct check/uncheck
  const handleToggleCheck = (e: React.MouseEvent, task: SealantTask) => {
    e.stopPropagation();
    if (onQuickToggleComplete) {
      onQuickToggleComplete(task);
    } else {
      const nextStatus: TaskStatus = task.status === '완료' ? '진행중' : '완료';
      onQuickStatusChange(task, nextStatus);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs mb-6 overflow-hidden transition-all duration-300">
      
      {/* 1. Header Toolbar (To-Do Gantt Concept) */}
      <div className="p-4 sm:px-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-inner">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                할 일 일정 & 마감 기한 타임라인
                <span className="text-xs font-normal text-slate-400 font-mono hidden sm:inline">(Gantt To-Do)</span>
              </h2>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                👤 {currentUser.name} ({currentUser.role})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              생산 업무와 개인 담당 일정을 체크박스로 직접 완료 체크하고, 마감 기한을 한눈에 조망합니다.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {/* View Filter (내 할일 vs 전체 업무) */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setViewFilter('MY_TODO')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                viewFilter === 'MY_TODO'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>내 할 일 ({myTasksCount})</span>
            </button>
            <button
              onClick={() => setViewFilter('ALL_TASKS')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                viewFilter === 'ALL_TASKS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              전체 업무 ({tasks.length})
            </button>
            <button
              onClick={() => setViewFilter('OVERDUE')}
              className={`px-2 py-1 rounded text-xs font-semibold transition flex items-center gap-1 ${
                viewFilter === 'OVERDUE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-300 hover:text-white'
              }`}
            >
              지연된 일
            </button>
          </div>

          {/* Grouping mode */}
          <div className="hidden md:flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <span className="px-1.5 text-slate-400 text-[11px]">분류:</span>
            <button
              onClick={() => setGroupBy('DATE')}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                groupBy === 'DATE'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              기한별
            </button>
            <button
              onClick={() => setGroupBy('STATUS')}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                groupBy === 'STATUS'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              상태별
            </button>
            <button
              onClick={() => setGroupBy('MANAGER')}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                groupBy === 'MANAGER'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              담당자별
            </button>
          </div>

          {/* Time Navigation */}
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
            <button
              onClick={() => setWindowOffsetDays((prev) => prev - 2)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-l-lg transition"
              title="과거 일정으로 이동"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWindowOffsetDays(0)}
              className="px-2 py-1 text-xs text-slate-300 hover:text-white font-medium"
              title="오늘 기준으로 복귀"
            >
              오늘
            </button>
            <button
              onClick={() => setWindowOffsetDays((prev) => prev + 2)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-r-lg transition"
              title="미래 일정으로 이동"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition"
            title={isCollapsed ? '간트 할일 펼치기' : '간트 할일 접기'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Mini KPI Strip & Checklist Status Summary */}
      {!isCollapsed && (
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs">
          
          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs font-medium text-slate-700">
              <ListTodo className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {viewFilter === 'MY_TODO' ? '내 할 일:' : '선택된 할 일:'}
              </span>
              <span className="font-bold text-slate-900">{stats.total}건</span>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-700 font-bold">{stats.completed}건 완료</span>
              <span className="text-xs text-slate-500 font-normal">({stats.completionRate}%)</span>
            </div>

            {stats.dueToday > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 font-medium text-amber-900">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>오늘 마감(Today):</span>
                <span className="font-bold text-amber-800">{stats.dueToday}건</span>
              </div>
            )}

            {stats.overdue > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-300 font-medium text-rose-900">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>지연 위험(Overdue):</span>
                <span className="font-bold text-rose-700">{stats.overdue}건</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 font-medium text-blue-900">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>진행중:</span>
              <span className="font-bold text-blue-700">{stats.inProgress + stats.pending}건</span>
            </div>
          </div>

          {/* Quick Guide Legend */}
          <div className="flex items-center gap-3 text-[11px] text-slate-600 ml-auto">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> 클릭하여 즉시 완료
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span> 진행중
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> 지연
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> 완료됨
            </span>
            <span className="flex items-center gap-1 text-slate-500 border-l border-slate-300 pl-2">
              <span className="w-1.5 h-3 bg-rose-500 inline-block"></span> 오늘 기준선
            </span>
          </div>
        </div>
      )}

      {/* 3. Gantt Chart Body Canvas */}
      {!isCollapsed && (
        <div className="overflow-x-auto relative">
          <div className="min-w-[880px]">
            
            {/* Header: Timeline Dates Calendar Row */}
            <div className="flex border-b border-slate-200 bg-slate-100/90 text-xs select-none sticky top-0 z-20">
              
              {/* Left Task Column Header */}
              <div className="w-72 sm:w-80 shrink-0 p-2.5 px-4 font-bold text-slate-700 border-r border-slate-200 bg-slate-100 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  할 일 체크 & 업무 내용
                </span>
                <span className="text-[11px] font-normal text-slate-500">진도율/상태</span>
              </div>

              {/* Right Timeline Days Header */}
              <div className="flex-1 relative flex">
                {dayList.map((day) => (
                  <div
                    key={day.dateStr}
                    className={`flex-1 min-w-[50px] p-2 text-center border-r border-slate-200/80 transition ${
                      day.isToday
                        ? 'bg-rose-50 font-bold text-rose-900 border-rose-300/80'
                        : day.isPast
                        ? 'text-slate-500 bg-slate-50/50'
                        : 'text-slate-700 bg-slate-100/60'
                    }`}
                  >
                    <div className="text-[10px] leading-tight font-medium text-slate-400">
                      {day.dayOfWeek}
                    </div>
                    <div className="text-xs font-mono font-semibold">
                      {day.dateStr.slice(5)}
                    </div>
                    {day.isToday && (
                      <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-600 text-white">
                        오늘
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Task Rows Container */}
            <div className="relative divide-y divide-slate-100">
              
              {/* Today Red Marker Vertical Line that cuts across all rows */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-10 w-0.5 bg-rose-500 shadow-xs"
                style={{
                  left: `calc(18rem + (100% - 18rem) * ${todayPositionPercent / 100})`,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-rose-500 -ml-[3px] -mt-1 shadow-sm"></div>
              </div>

              {displayedTasks.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/50">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">해당 필터에 등록된 할 일이 없습니다.</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    '전체 업무'를 선택하거나 새로운 업무 할 일을 추가해보세요.
                  </p>
                  {onOpenNewTaskModal && (
                    <button
                      onClick={onOpenNewTaskModal}
                      className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      새 할 일 / 업무 등록
                    </button>
                  )}
                </div>
              ) : (
                groupedTasks.map((group) => (
                  <div key={group.title}>
                    
                    {/* Group Title Section */}
                    <div className="bg-slate-100/70 px-4 py-1.5 text-xs font-bold text-slate-800 border-y border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>{group.title}</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">
                        {group.list.length}개 할 일
                      </span>
                    </div>

                    {/* Tasks in this group */}
                    {group.list.map((task) => {
                      const { left, width, isOverdue, isDueToday } = calculateBarPosition(task);
                      const color = getStatusColor(task.status, isOverdue);
                      const isCompleted = task.status === '완료';
                      const isMyTask = task.manager === currentUser.name;

                      return (
                        <div
                          key={task.id}
                          className={`flex hover:bg-blue-50/40 transition group items-center relative ${
                            isCompleted ? 'bg-slate-50/40 opacity-75' : ''
                          }`}
                        >
                          {/* Left Info Column with Direct To-Do Checkbox */}
                          <div className="w-72 sm:w-80 shrink-0 p-2.5 px-3 sm:px-4 border-r border-slate-200 flex items-center gap-2.5 min-w-0">
                            
                            {/* Checkbox Button */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleCheck(e, task)}
                              className={`shrink-0 w-5 h-5 rounded flex items-center justify-center transition border ${
                                isCompleted
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                                  : 'bg-white border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-transparent'
                              }`}
                              title={isCompleted ? '진행중으로 다시 변경' : '할 일 완료 체크'}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>

                            {/* Task Info Content */}
                            <div 
                              onClick={() => onSelectTask(task)}
                              className="flex-1 min-w-0 cursor-pointer"
                            >
                              <div className="flex items-center justify-between gap-1.5 mb-0.5">
                                <span className={`font-mono text-[11px] font-bold truncate ${
                                  isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}>
                                  {task.lotNo}
                                </span>
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                                  {task.progress}%
                                </span>
                              </div>

                              <div 
                                className={`text-xs font-semibold truncate ${
                                  isCompleted 
                                    ? 'line-through text-slate-400' 
                                    : 'text-slate-900 group-hover:text-blue-600 transition'
                                }`} 
                                title={task.productName}
                              >
                                {task.productName}
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                                <span className="truncate max-w-[150px] text-slate-600">
                                  {task.stage} • {task.manager}
                                  {isMyTask && (
                                    <span className="ml-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-1 rounded">
                                      나
                                    </span>
                                  )}
                                </span>

                                <span className="font-mono text-[10px] text-slate-400">
                                  ~{task.dueDate?.slice(5) || task.scheduledDate.slice(5)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Gantt Bar Chart Column */}
                          <div className="flex-1 relative h-16 flex items-center px-1 overflow-hidden">
                            
                            {/* Grid Background Columns */}
                            <div className="absolute inset-0 flex pointer-events-none opacity-40">
                              {dayList.map((day) => (
                                <div
                                  key={day.dateStr}
                                  className={`flex-1 border-r border-slate-200 ${
                                    day.isToday ? 'bg-rose-50/50' : ''
                                  }`}
                                />
                              ))}
                            </div>

                            {/* Gantt Bar Card */}
                            <div
                              onClick={() => onSelectTask(task)}
                              style={{ left, width }}
                              className={`absolute h-9 rounded-lg border shadow-xs cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md flex items-center px-2 z-1 overflow-hidden ${
                                isCompleted ? 'opacity-60 bg-slate-100 border-slate-300' : color.track
                              }`}
                              title={`${task.lotNo}: ${task.productName} | 착수: ${task.startDate || task.scheduledDate} ~ 마감: ${task.dueDate || task.scheduledDate} (${task.progress}%)`}
                            >
                              {/* Inner Progress Fill */}
                              <div
                                className={`absolute left-0 top-0 bottom-0 opacity-20 ${color.bg}`}
                                style={{ width: `${task.progress}%` }}
                              />

                              {/* Solid Progress Indicator Bar along bottom */}
                              <div
                                className={`absolute left-0 bottom-0 h-1.5 ${color.bg}`}
                                style={{ width: `${task.progress}%` }}
                              />

                              {/* Bar Content */}
                              <div className="relative z-1 flex items-center justify-between w-full min-w-0 gap-1.5 text-xs font-medium">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-sm ${color.badge}`}>
                                    {task.status}
                                  </span>
                                  <span className={`font-semibold truncate ${
                                    isCompleted ? 'line-through text-slate-500' : color.text
                                  }`}>
                                    {task.productName}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono font-bold">
                                  {isOverdue && !isCompleted ? (
                                    <span className="text-rose-700 bg-rose-100 px-1 rounded flex items-center gap-0.5">
                                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                                      지연
                                    </span>
                                  ) : isDueToday && !isCompleted ? (
                                    <span className="text-amber-800 bg-amber-100 px-1 rounded">
                                      오늘마감
                                    </span>
                                  ) : isCompleted ? (
                                    <span className="text-emerald-700 bg-emerald-100 px-1 rounded">
                                      완료
                                    </span>
                                  ) : null}
                                  <span className="text-slate-700">
                                    {task.dueDate?.slice(5) || task.scheduledDate.slice(5)} 마감
                                  </span>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* 4. Footer Help Text */}
      {!isCollapsed && (
        <div className="p-2.5 px-4 sm:px-6 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>
              좌측의 <strong>체크박스</strong>를 클릭하면 복잡한 절차 없이 해당 할 일이 <strong>즉시 완료/진행중</strong>으로 토글됩니다.
            </span>
          </div>
          <div className="flex items-center gap-3 font-medium text-slate-600">
            <span>'내 할 일' 필터로 본인 업무 우선 점검</span>
            <span>•</span>
            <span>바 클릭 시 상세 진도율/메모/체크포인트 관리</span>
          </div>
        </div>
      )}

    </div>
  );
};
