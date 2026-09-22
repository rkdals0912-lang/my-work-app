import React, { useState, useMemo } from 'react';
import { SealantTask, TaskStatus, UserProfile } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  CalendarDays,
  CalendarRange
} from 'lucide-react';

interface TaskCalendarViewProps {
  tasks: SealantTask[];
  currentUser: UserProfile;
  onSelectTask: (task: SealantTask) => void;
  onQuickToggleComplete?: (task: SealantTask) => void;
  onOpenNewTaskModal?: () => void;
}

type CalendarMode = 'MONTH' | 'WEEK';
type UrgencyFilter = 'ALL' | 'IMMINENT' | 'OVERDUE' | 'MY_TASKS';

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  currentUser,
  onSelectTask,
  onQuickToggleComplete,
  onOpenNewTaskModal,
}) => {
  // Reference date: 2026-09-21
  const todayStr = '2026-09-21';
  const todayDate = new Date(2026, 8, 21); // Month is 0-indexed: 8 = September

  const [calendarMode, setCalendarMode] = useState<CalendarMode>('MONTH');
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 8 = September (0-11)
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState<Date>(() => {
    // Find Sunday of 2026-09-21
    const d = new Date(2026, 8, 21);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  });

  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('ALL');

  // Format date helper: YYYY-MM-DD
  const formatDateStr = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Imminent calculation: within 2 days from today, or overdue
  const todayMs = new Date(2026, 8, 21).getTime();
  const twoDaysLaterMs = todayMs + 2 * 86400000;

  // Filter tasks based on urgency and user selection
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const dueStr = task.dueDate || task.scheduledDate || todayStr;
      const parts = dueStr.split('-');
      const dueMs = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();

      if (urgencyFilter === 'MY_TASKS') {
        if (task.manager !== currentUser.name) return false;
      } else if (urgencyFilter === 'OVERDUE') {
        if (task.status === '완료' || dueMs >= todayMs) return false;
      } else if (urgencyFilter === 'IMMINENT') {
        // Due today or tomorrow or overdue
        if (task.status === '완료') return false;
        if (dueMs > twoDaysLaterMs) return false;
      }
      return true;
    });
  }, [tasks, urgencyFilter, currentUser.name, todayMs, twoDaysLaterMs, todayStr]);

  // Tasks grouped by due date map: "YYYY-MM-DD" => SealantTask[]
  const tasksByDate = useMemo(() => {
    const map: Record<string, SealantTask[]> = {};
    filteredTasks.forEach((task) => {
      const due = task.dueDate || task.scheduledDate || todayStr;
      if (!map[due]) map[due] = [];
      map[due].push(task);
    });
    return map;
  }, [filteredTasks, todayStr]);

  // Imminent tasks summary for top warning banner
  const imminentTasksSummary = useMemo(() => {
    const overdue = tasks.filter((t) => {
      const due = t.dueDate || t.scheduledDate || todayStr;
      const dueMs = new Date(due).getTime();
      return dueMs < todayMs && t.status !== '완료';
    });

    const dueToday = tasks.filter((t) => {
      const due = t.dueDate || t.scheduledDate || todayStr;
      return due === todayStr && t.status !== '완료';
    });

    const dueTomorrow = tasks.filter((t) => {
      const due = t.dueDate || t.scheduledDate || todayStr;
      const tomorrowStr = '2026-09-22';
      return due === tomorrowStr && t.status !== '완료';
    });

    return {
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
      dueTomorrowCount: dueTomorrow.length,
      totalImminent: overdue.length + dueToday.length + dueTomorrow.length,
    };
  }, [tasks, todayMs, todayStr]);

  // Navigation handlers
  const handlePrev = () => {
    if (calendarMode === 'MONTH') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      const prevWeek = new Date(currentWeekStartDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentWeekStartDate(prevWeek);
    }
  };

  const handleNext = () => {
    if (calendarMode === 'MONTH') {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else {
      const nextWeek = new Date(currentWeekStartDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentWeekStartDate(nextWeek);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(8); // September
    const d = new Date(2026, 8, 21);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    setCurrentWeekStartDate(d);
  };

  // Month days generation
  const monthGridDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 6 = Sat
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        dateStr: formatDateStr(d),
        isCurrentMonth: false,
        isToday: formatDateStr(d) === todayStr,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(currentYear, currentMonth, i);
      days.push({
        date: d,
        dateStr: formatDateStr(d),
        isCurrentMonth: true,
        isToday: formatDateStr(d) === todayStr,
      });
    }

    // Next month padding to fill complete weeks (multiple of 7)
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const d = new Date(currentYear, currentMonth + 1, i);
        days.push({
          date: d,
          dateStr: formatDateStr(d),
          isCurrentMonth: false,
          isToday: formatDateStr(d) === todayStr,
        });
      }
    }

    return days;
  }, [currentYear, currentMonth, todayStr]);

  // Week days generation (7 days from currentWeekStartDate)
  const weekGridDays = useMemo(() => {
    const days: { date: Date; dateStr: string; dayName: string; isToday: boolean }[] = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStartDate);
      d.setDate(currentWeekStartDate.getDate() + i);
      const dateStr = formatDateStr(d);
      days.push({
        date: d,
        dateStr,
        dayName: dayNames[d.getDay()],
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [currentWeekStartDate, todayStr]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs mb-8 overflow-hidden">
      
      {/* Top Header & View Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          {/* Title and date badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-2xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  마감일 캘린더 (월간·주간 일정 뷰)
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  {calendarMode === 'MONTH' ? `${currentYear}년 ${currentMonth + 1}월` : '주간 단위 뷰'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                작업 및 할 일의 마감일과 일정을 직관적으로 파악하고 임박 일정을 사전에 대비합니다.
              </p>
            </div>
          </div>

          {/* Controls: Mode Switcher & Quick Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Urgency Filter Dropdown / Buttons */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold">
              <button
                onClick={() => setUrgencyFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition ${
                  urgencyFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setUrgencyFilter('IMMINENT')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                  urgencyFilter === 'IMMINENT'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
                title="마감 임박 (오늘, 내일, 기한초과)"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>마감 임박 ({imminentTasksSummary.totalImminent})</span>
              </button>
              <button
                onClick={() => setUrgencyFilter('MY_TASKS')}
                className={`px-2.5 py-1 rounded-md transition ${
                  urgencyFilter === 'MY_TASKS'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                내 할 일
              </button>
            </div>

            {/* Mode switch (Month / Week) */}
            <div className="flex items-center bg-slate-200/80 rounded-lg p-0.5 text-xs font-bold text-slate-700">
              <button
                onClick={() => setCalendarMode('MONTH')}
                className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                  calendarMode === 'MONTH' ? 'bg-white text-blue-600 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>월간</span>
              </button>
              <button
                onClick={() => setCalendarMode('WEEK')}
                className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                  calendarMode === 'WEEK' ? 'bg-white text-blue-600 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>주간</span>
              </button>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={handlePrev}
                className="p-1 rounded text-slate-600 hover:bg-slate-100 transition"
                title="이전"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleGoToday}
                className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded"
              >
                오늘
              </button>
              <button
                onClick={handleNext}
                className="p-1 rounded text-slate-600 hover:bg-slate-100 transition"
                title="다음"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Imminent alert ribbon if any imminent or overdue tasks */}
        {imminentTasksSummary.totalImminent > 0 && (
          <div className="mt-3.5 bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200/80 rounded-xl p-2.5 sm:px-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <Flame className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>마감 임박 안내:</strong> 기한초과{' '}
                <span className="font-bold text-rose-600 underline">{imminentTasksSummary.overdueCount}건</span>, 오늘 마감{' '}
                <span className="font-bold text-amber-700 underline">{imminentTasksSummary.dueTodayCount}건</span>, 내일 마감{' '}
                <span className="font-bold text-blue-700 underline">{imminentTasksSummary.dueTomorrowCount}건</span>이 있습니다.
              </span>
            </div>

            <button
              onClick={() => setUrgencyFilter('IMMINENT')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
            >
              임박 작업만 캘린더에 모아보기 →
            </button>
          </div>
        )}
      </div>

      {/* Calendar Grid View: Month or Week */}
      {calendarMode === 'MONTH' ? (
        <div className="p-4 sm:p-5">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-500 mb-2">
            <div className="text-rose-500">일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div className="text-blue-500">토</div>
          </div>

          {/* Month Days Matrix */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {monthGridDays.map((item, idx) => {
              const dayTasks = tasksByDate[item.dateStr] || [];
              const dayOfWeek = item.date.getDay();
              const isPast = item.dateStr < todayStr;
              const hasOverdue = dayTasks.some((t) => t.status !== '완료' && isPast);
              const hasDueToday = item.dateStr === todayStr && dayTasks.some((t) => t.status !== '완료');

              return (
                <div
                  key={idx}
                  className={`min-h-[95px] sm:min-h-[110px] rounded-xl border p-1.5 sm:p-2 flex flex-col justify-between transition ${
                    item.isToday
                      ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
                      : hasDueToday
                      ? 'bg-amber-50/40 border-amber-300'
                      : hasOverdue
                      ? 'bg-rose-50/30 border-rose-300'
                      : item.isCurrentMonth
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-slate-50/60 border-slate-100 opacity-40'
                  }`}
                >
                  {/* Date number header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold ${
                        item.isToday
                          ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center'
                          : dayOfWeek === 0
                          ? 'text-rose-500'
                          : dayOfWeek === 6
                          ? 'text-blue-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {item.date.getDate()}
                    </span>

                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full">
                        {dayTasks.length}건
                      </span>
                    )}
                  </div>

                  {/* Tasks chips list */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map((task) => {
                      const isTaskCompleted = task.status === '완료';
                      const isTaskOverdue = !isTaskCompleted && isPast;
                      const isTaskDueToday = !isTaskCompleted && item.dateStr === todayStr;

                      return (
                        <div
                          key={task.id}
                          onClick={() => onSelectTask(task)}
                          title={`${task.productName} (${task.status}, ${task.priority})`}
                          className={`text-[10px] sm:text-[11px] p-1 rounded-md border font-medium truncate cursor-pointer transition flex items-center gap-1 ${
                            isTaskCompleted
                              ? 'bg-slate-100/90 text-slate-500 border-slate-200 line-through'
                              : isTaskOverdue
                              ? 'bg-rose-100 text-rose-800 border-rose-200 font-bold'
                              : isTaskDueToday
                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                              : task.priority === '긴급'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-50 hover:bg-blue-50 text-slate-800 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isTaskCompleted
                                ? 'bg-emerald-500'
                                : isTaskOverdue
                                ? 'bg-rose-600 animate-pulse'
                                : isTaskDueToday
                                ? 'bg-amber-600'
                                : 'bg-blue-500'
                            }`}
                          />
                          <span className="truncate">{task.productName}</span>
                        </div>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-slate-400 font-medium text-center pt-0.5">
                        +{dayTasks.length - 3}건 더보기
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Week View */
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekGridDays.map((col, idx) => {
              const dayTasks = tasksByDate[col.dateStr] || [];
              const isPast = col.dateStr < todayStr;
              const hasOverdue = dayTasks.some((t) => t.status !== '완료' && isPast);

              return (
                <div
                  key={idx}
                  className={`rounded-xl border flex flex-col p-3 transition ${
                    col.isToday
                      ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
                      : hasOverdue
                      ? 'bg-rose-50/40 border-rose-300'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  {/* Column Date Header */}
                  <div className="border-b border-slate-200/80 pb-2 mb-2 flex items-center justify-between">
                    <div>
                      <span className={`text-xs font-bold block ${
                        col.date.getDay() === 0
                          ? 'text-rose-600'
                          : col.date.getDay() === 6
                          ? 'text-blue-600'
                          : 'text-slate-800'
                      }`}>
                        {col.dayName}요일
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {col.dateStr.slice(5)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {col.isToday && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                          오늘
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                        {dayTasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2 flex-1 min-h-[140px]">
                    {dayTasks.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[11px] text-slate-400 py-6">
                        등록된 마감 작업 없음
                      </div>
                    ) : (
                      dayTasks.map((task) => {
                        const isTaskCompleted = task.status === '완료';
                        const isTaskOverdue = !isTaskCompleted && isPast;
                        const isTaskDueToday = !isTaskCompleted && col.dateStr === todayStr;

                        return (
                          <div
                            key={task.id}
                            onClick={() => onSelectTask(task)}
                            className={`p-2.5 rounded-lg border transition cursor-pointer text-xs ${
                              isTaskCompleted
                                ? 'bg-white border-slate-200 text-slate-400 line-through opacity-70'
                                : isTaskOverdue
                                ? 'bg-white border-rose-300 shadow-2xs text-rose-900 ring-1 ring-rose-400/20'
                                : isTaskDueToday
                                ? 'bg-white border-amber-300 shadow-2xs text-amber-900 ring-1 ring-amber-400/20'
                                : 'bg-white border-slate-200 hover:border-blue-400 shadow-2xs text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-mono text-[10px] text-slate-400 font-bold">
                                {task.lotNo}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                task.priority === '긴급'
                                  ? 'bg-rose-100 text-rose-700'
                                  : task.priority === '우선'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {task.priority}
                              </span>
                            </div>

                            <div className="font-semibold line-clamp-2 leading-snug mb-1.5">
                              {task.productName}
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
                              <span>진도율 {task.progress}%</span>
                              <span className="font-medium text-blue-600">{task.stage}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-slate-700">색상 범례:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span className="text-rose-700 font-semibold">기한 초과 (지연)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-amber-800 font-semibold">오늘 마감</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>정상 진행</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>완료</span>
          </span>
        </div>

        {onOpenNewTaskModal && (
          <button
            onClick={onOpenNewTaskModal}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
          >
            + 특정 날짜에 새 할 일 추가
          </button>
        )}
      </div>

    </div>
  );
};
