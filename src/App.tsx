/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { SealantTask, UserProfile, TaskStatus, ProcessStage, AuditLogEntry, RoutineDefinition } from './types';
import { INITIAL_TASKS, DEFAULT_USERS, PROCESS_STAGES } from './data/initialData';
import { INITIAL_ROUTINES } from './data/initialRoutines';
import { createAuditLog, exportAuditHistoryToCSV } from './utils/auditHelper';
import { Header } from './components/Header';
import { MetricsBar } from './components/MetricsBar';
import { TodaySummary } from './components/TodaySummary';
import { ProductionGanttChart } from './components/ProductionGanttChart';
import { FilterBar } from './components/FilterBar';
import { TaskCard } from './components/TaskCard';
import { TaskDetailModal } from './components/TaskDetailModal';
import { GlobalAuditModal } from './components/GlobalAuditModal';
import { NewTaskModal } from './components/NewTaskModal';
import { RoutineAutomationModal } from './components/RoutineAutomationModal';
import { TaskCalendarView } from './components/TaskCalendarView';
import { 
  PlusCircle, 
  AlertTriangle, 
  FilterX, 
  CheckCircle2, 
  Layers, 
  ShieldAlert,
  ClipboardList,
  Calendar,
  LayoutGrid,
  BarChart2
} from 'lucide-react';

const STORAGE_KEY = 'TOPSEAL_PRODUCTION_TASKS_v2';
const USER_STORAGE_KEY = 'TOPSEAL_ACTIVE_USER_v2';
const ROUTINE_STORAGE_KEY = 'TOPSEAL_ROUTINES_v1';

export default function App() {
  // Load tasks from LocalStorage or initialize with default realistic dataset
  const [tasks, setTasks] = useState<SealantTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved tasks', e);
    }
    return INITIAL_TASKS;
  });

  // Current active operator
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('Failed to parse saved user', e);
    }
    return DEFAULT_USERS[0]; // 김성민 과장
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedLine, setSelectedLine] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('NEWEST');

  // Main View Layout: 'DASHBOARD' (Gantt + Cards), 'CALENDAR' (Monthly/Weekly Calendar), 'LIST_ONLY'
  const [mainViewMode, setMainViewMode] = useState<'DASHBOARD' | 'CALENDAR' | 'LIST_ONLY'>('DASHBOARD');

  // Modals state
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<{
    task: SealantTask;
    initialTab?: 'progress' | 'memos' | 'issues' | 'audit';
  } | null>(null);
  const [isGlobalAuditOpen, setIsGlobalAuditOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);

  // User Routine Definitions State
  const [routines, setRoutines] = useState<RoutineDefinition[]>(() => {
    try {
      const savedRoutines = localStorage.getItem(ROUTINE_STORAGE_KEY);
      if (savedRoutines) {
        return JSON.parse(savedRoutines);
      }
    } catch (e) {
      console.error('Failed to parse saved routines', e);
    }
    return INITIAL_ROUTINES;
  });

  // Sync routines to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(routines));
    } catch (e) {
      console.error('Failed to save routines', e);
    }
  }, [routines]);

  // Sync tasks to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }, [tasks]);

  // Sync user to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
    } catch (e) {
      console.error('Failed to save current user', e);
    }
  }, [currentUser]);

  // Extract distinct production lines
  const lines = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.line))).filter(Boolean);
  }, [tasks]);

  // Total unresolved issues across all tasks
  const unresolvedIssueCount = useMemo(() => {
    return tasks.reduce((sum, task) => {
      return sum + task.issues.filter((i) => !i.resolved).length;
    }, 0);
  }, [tasks]);

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Status tab filter
        if (selectedStatus === 'ISSUE') {
          if (!task.issues.some((i) => !i.resolved)) return false;
        } else if (selectedStatus === 'URGENT') {
          if (task.priority !== '긴급') return false;
        } else if (selectedStatus !== 'ALL') {
          if (task.status !== selectedStatus) return false;
        }

        // Line filter
        if (selectedLine !== 'ALL' && task.line !== selectedLine) {
          return false;
        }

        // Stage filter
        if (selectedStage !== 'ALL' && task.stage !== selectedStage) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match = `${task.lotNo} ${task.productName} ${task.manager} ${task.line}`.toLowerCase();
          if (!match.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'PROGRESS_DESC') return b.progress - a.progress;
        if (sortBy === 'PROGRESS_ASC') return a.progress - b.progress;
        if (sortBy === 'PRIORITY') {
          const pOrder: Record<string, number> = { 긴급: 3, 우선: 2, 보통: 1 };
          return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
        }
        if (sortBy === 'ISSUES') {
          const aIssues = a.issues.filter((i) => !i.resolved).length;
          const bIssues = b.issues.filter((i) => !i.resolved).length;
          return bIssues - aIssues;
        }
        // Default NEWEST
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [tasks, selectedStatus, selectedLine, selectedStage, searchQuery, sortBy]);

  // Update task handler (from detail modal or quick updates)
  const handleUpdateTask = (updatedTask: SealantTask, newAuditLog?: AuditLogEntry) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );

    // If modal is open, keep modal task state synced
    if (selectedTaskForDetail && selectedTaskForDetail.task.id === updatedTask.id) {
      setSelectedTaskForDetail({
        ...selectedTaskForDetail,
        task: updatedTask,
      });
    }
  };

  // Quick progress change with audit logging
  const handleQuickProgressChange = (task: SealantTask, delta: number) => {
    const newProgress = Math.max(0, Math.min(100, task.progress + delta));
    if (newProgress === task.progress) return;

    const autoStatus: TaskStatus = newProgress === 100 ? '완료' : task.status === '대기' ? '진행중' : task.status;
    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;

    const auditEntry = createAuditLog(
      task,
      currentUser,
      'PROGRESS_UPDATE',
      `빠른 진도율 조정: ${task.progress}% → ${newProgress}%${newProgress === 100 ? ' (작업 100% 완료)' : ''}`,
      'progress',
      task.progress,
      newProgress
    );

    const updated: SealantTask = {
      ...task,
      progress: newProgress,
      status: autoStatus,
      updatedAt: timestamp,
      auditHistory: [auditEntry, ...task.auditHistory],
    };

    handleUpdateTask(updated, auditEntry);
  };

  // Quick status change with audit logging
  const handleQuickStatusChange = (task: SealantTask, status: TaskStatus) => {
    if (task.status === status) return;
    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;

    const auditEntry = createAuditLog(
      task,
      currentUser,
      'STATUS_CHANGE',
      `작업 상태 변경: '${task.status}' → '${status}'`,
      'status',
      task.status,
      status
    );

    const updated: SealantTask = {
      ...task,
      status,
      updatedAt: timestamp,
      auditHistory: [auditEntry, ...task.auditHistory],
    };

    handleUpdateTask(updated, auditEntry);
  };

  // Quick toggle task complete/pending for To-Do Gantt Checklist
  const handleQuickToggleComplete = (task: SealantTask) => {
    const isCompleted = task.status === '완료';
    const nextStatus: TaskStatus = isCompleted ? '진행중' : '완료';
    const nextProgress = isCompleted ? 50 : 100;
    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;

    const auditEntry = createAuditLog(
      task,
      currentUser,
      'STATUS_CHANGE',
      `할 일 체크박스 토글: '${task.status}' → '${nextStatus}' (진도율 ${nextProgress}%)`,
      'status',
      task.status,
      nextStatus
    );

    const updated: SealantTask = {
      ...task,
      status: nextStatus,
      progress: nextProgress,
      updatedAt: timestamp,
      auditHistory: [auditEntry, ...task.auditHistory],
    };

    handleUpdateTask(updated, auditEntry);
  };

  // Quick stage change with audit logging
  const handleQuickStageChange = (task: SealantTask, stage: ProcessStage) => {
    if (task.stage === stage) return;
    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;

    const auditEntry = createAuditLog(
      task,
      currentUser,
      'STAGE_CHANGE',
      `공정 단계 변경: '${task.stage}' → '${stage}'`,
      'stage',
      task.stage,
      stage
    );

    const updated: SealantTask = {
      ...task,
      stage,
      updatedAt: timestamp,
      auditHistory: [auditEntry, ...task.auditHistory],
    };

    handleUpdateTask(updated, auditEntry);
  };

  // Create new task handler
  const handleCreateTask = (newTask: SealantTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  // Batch create tasks handler (from AI Routine Automation)
  const handleBatchCreateTasks = (newTasksList: SealantTask[]) => {
    setTasks((prev) => [...newTasksList, ...prev]);
  };

  // Reset to default initial factory sample data
  const handleResetData = () => {
    if (window.confirm('초기 탑씰 공장 샘플 데이터로 복원하시겠습니까? (현재 변경사항은 초기화됩니다)')) {
      setTasks(INITIAL_TASKS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. Industrial Header & Active Operator Bar */}
      <Header
        currentUser={currentUser}
        onSelectUser={setCurrentUser}
        onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
        onOpenGlobalAuditModal={() => setIsGlobalAuditOpen(true)}
        onOpenRoutineModal={() => setIsRoutineModalOpen(true)}
        onExportAuditCSV={() => exportAuditHistoryToCSV(tasks)}
        onResetData={handleResetData}
        totalTaskCount={tasks.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Unresolved Issue Alert Ribbon (if any active issues) */}
        {unresolvedIssueCount > 0 && selectedStatus !== 'ISSUE' && (
          <div 
            onClick={() => setSelectedStatus('ISSUE')}
            className="mb-4 bg-amber-500/10 border border-amber-300 rounded-xl p-3 flex items-center justify-between text-amber-900 cursor-pointer hover:bg-amber-500/20 transition"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 animate-pulse" />
              <div className="text-xs">
                <span className="font-bold">공정 특이사항 알림:</span> 현재{' '}
                <span className="font-bold underline">{unresolvedIssueCount}건</span>의 미해결 공정 이상/품질 점검 사항이 있습니다.
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-800 underline">
              특이사항 작업 필터링 보기 →
            </span>
          </div>
        )}

        {/* 1. Today Work Summary (오늘의 작업 요약) */}
        <TodaySummary
          tasks={tasks}
          onFilterByStatus={(status) => {
            setSelectedStatus(status);
          }}
          onSelectTask={(task, tab) => {
            setSelectedTaskForDetail({
              task,
              initialTab: tab || 'progress',
            });
          }}
          onOpenRoutineModal={() => setIsRoutineModalOpen(true)}
        />

        {/* 2. Top Factory KPI Metrics */}
        <MetricsBar
          tasks={tasks}
          onFilterByStatus={(status) => {
            setSelectedStatus(status);
          }}
        />

        {/* 3. View Switcher Tabs: Gantt & Board vs. Calendar vs. List Only */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 px-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>화면 모드:</span>
            </span>
            <div className="inline-flex bg-slate-100 p-1 rounded-lg text-xs font-bold">
              <button
                id="btn-view-dashboard"
                onClick={() => setMainViewMode('DASHBOARD')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
                  mainViewMode === 'DASHBOARD'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>간트 진도표 + 카드</span>
              </button>
              <button
                id="btn-view-calendar"
                onClick={() => setMainViewMode('CALENDAR')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
                  mainViewMode === 'CALENDAR'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>마감일 캘린더 뷰 (월간/주간)</span>
              </button>
              <button
                id="btn-view-list-only"
                onClick={() => setMainViewMode('LIST_ONLY')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
                  mainViewMode === 'LIST_ONLY'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>작업 카드 리스트만</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium px-2">
            총 <span className="font-bold text-slate-900">{tasks.length}건</span>의 작업 및 루틴 이력 추적 중
          </div>
        </div>

        {/* 4. Calendar View (When CALENDAR mode is active) */}
        {mainViewMode === 'CALENDAR' && (
          <TaskCalendarView
            tasks={tasks}
            currentUser={currentUser}
            onSelectTask={(task) => {
              setSelectedTaskForDetail({
                task,
                initialTab: 'progress',
              });
            }}
            onQuickToggleComplete={handleQuickToggleComplete}
            onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
          />
        )}

        {/* 5. Production Gantt Chart (When DASHBOARD mode is active) */}
        {mainViewMode === 'DASHBOARD' && (
          <ProductionGanttChart
            tasks={tasks}
            currentUser={currentUser}
            onSelectTask={(task) => {
              setSelectedTaskForDetail({
                task,
                initialTab: 'progress',
              });
            }}
            onQuickStatusChange={handleQuickStatusChange}
            onQuickToggleComplete={handleQuickToggleComplete}
            onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
          />
        )}

        {/* 4. Search & Multi-criteria Filter Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          selectedLine={selectedLine}
          onSelectLine={setSelectedLine}
          selectedStage={selectedStage}
          onSelectStage={setSelectedStage}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          lines={lines}
          unresolvedIssueCount={unresolvedIssueCount}
        />

        {/* 4. Task Grid or Empty View */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <FilterX className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              해당 조건의 할 일 및 작업이 없습니다
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              검색어나 필터 조건을 변경하거나, 일상/업무에 필요한 새로운 할 일을 등록해 보세요.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('ALL');
                  setSelectedLine('ALL');
                  setSelectedStage('ALL');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                필터 초기화
              </button>
              <button
                onClick={() => setIsNewTaskModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
              >
                + 새 할 일 등록
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onOpenDetail={(targetTask, initialTab) => {
                  setSelectedTaskForDetail({
                    task: targetTask,
                    initialTab: initialTab || 'progress',
                  });
                }}
                onQuickProgressChange={handleQuickProgressChange}
                onQuickStatusChange={handleQuickStatusChange}
                onQuickStageChange={handleQuickStageChange}
                onQuickAddIssue={(targetTask) => {
                  setSelectedTaskForDetail({
                    task: targetTask,
                    initialTab: 'issues',
                  });
                }}
                onQuickAddMemo={(targetTask) => {
                  setSelectedTaskForDetail({
                    task: targetTask,
                    initialTab: 'memos',
                  });
                }}
              />
            ))}
          </div>
        )}

      </main>

      {/* 5. Modals */}
      {/* Detailed Task Modal (Progress, Memos, Issues, Audit Trail) */}
      {selectedTaskForDetail && (
        <TaskDetailModal
          task={selectedTaskForDetail.task}
          currentUser={currentUser}
          initialTab={selectedTaskForDetail.initialTab}
          onClose={() => setSelectedTaskForDetail(null)}
          onUpdateTask={handleUpdateTask}
        />
      )}

      {/* Global Factory-wide Audit Log Modal */}
      {isGlobalAuditOpen && (
        <GlobalAuditModal
          tasks={tasks}
          onClose={() => setIsGlobalAuditOpen(false)}
        />
      )}

      {/* New Task Creation Modal */}
      {isNewTaskModalOpen && (
        <NewTaskModal
          currentUser={currentUser}
          onClose={() => setIsNewTaskModalOpen(false)}
          onCreateTask={handleCreateTask}
        />
      )}

      {/* Routine Automation & Tomorrow Task Generation Modal */}
      {isRoutineModalOpen && (
        <RoutineAutomationModal
          routines={routines}
          currentUser={currentUser}
          currentTasks={tasks}
          onClose={() => setIsRoutineModalOpen(false)}
          onSaveRoutines={setRoutines}
          onBatchCreateTasks={handleBatchCreateTasks}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">탑씰(TopSeal) 실란트 제조공장</span>
            <span>•</span>
            <span>스마트 생산관리 및 이력 추적 시스템</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Audit Trail Active • Data Stored Securely in Local Engine
          </div>
        </div>
      </footer>

    </div>
  );
}
