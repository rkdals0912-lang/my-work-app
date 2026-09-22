import React, { useState, useEffect, useMemo } from 'react';
import { Task, RoutineDefinition, TaskCategory } from './types';
import { initialTasks } from './data/initialData';
import { initialRoutines } from './data/initialRoutines';
import { ensureRoutineTasks } from './utils/routineHelper';
import { Header } from './components/Header';
import { TodaySummary } from './components/TodaySummary';
import { TaskCalendarView } from './components/TaskCalendarView';
import { TaskCard } from './components/TaskCard';
import { FilterBar, StatusFilter } from './components/FilterBar';
import { TaskFormModal } from './components/TaskFormModal';
import { RoutineModal } from './components/RoutineModal';
import { CalendarDays, ListChecks, Repeat, Sun } from 'lucide-react';

type Tab = 'today' | 'calendar' | 'tasks' | 'routines';

const TASKS_KEY = 'planner_tasks_v1';
const ROUTINES_KEY = 'planner_routines_v1';
const CATEGORIES_KEY = 'planner_categories_v1';

const pad = (n: number) => String(n).padStart(2, '0');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('today');
  const [tasks, setTasks] = useState<Task[]>(() => loadJSON(TASKS_KEY, initialTasks));
  const [routines, setRoutines] = useState<RoutineDefinition[]>(() => loadJSON(ROUTINES_KEY, initialRoutines));
  const [customCategories, setCustomCategories] = useState<TaskCategory[]>(() => loadJSON(CATEGORIES_KEY, []));

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('전체');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | '전체'>('전체');

  // Persist
  useEffect(() => { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines)); }, [routines]);
  useEffect(() => { localStorage.setItem(CATEGORIES_KEY, JSON.stringify(customCategories)); }, [customCategories]);

  // Generate routine-based tasks for the surrounding window (past 7 days .. next 30 days)
  useEffect(() => {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const end = new Date();
    end.setDate(end.getDate() + 30);
    const generated = ensureRoutineTasks(routines, tasks, start, end);
    if (generated.length > 0) {
      setTasks((prev) => [...prev, ...generated]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routines]);

  const allCategories = useMemo(() => {
    const base: TaskCategory[] = ['업무', '집안일', '개인', '가족', '약속', '쇼핑', '건강/운동', '기타'];
    return Array.from(new Set([...base, ...customCategories]));
  }, [customCategories]);

  const handleToggle = (id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t));
  };

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSave = (task: Task) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [...prev, task];
    });
    setModalOpen(false);
    setEditingTask(null);
    setPrefillDate(undefined);
  };

  const handleOpenNew = (date?: string) => {
    setEditingTask(null);
    setPrefillDate(date);
    setModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleAddCategory = (cat: string) => {
    setCustomCategories((prev) => (prev.includes(cat) ? prev : [...prev, cat]));
  };

  const handleReset = () => {
    if (!window.confirm('샘플 데이터로 초기화할까요? 현재 데이터는 사라집니다.')) return;
    setTasks(initialTasks);
    setRoutines(initialRoutines);
    setCustomCategories([]);
  };

  const filteredTasks = useMemo(() => {
    let list = [...tasks];
    if (statusFilter === '오늘') list = list.filter((t) => t.date === todayStr());
    else if (statusFilter === '미완료') list = list.filter((t) => !t.completed);
    else if (statusFilter === '완료') list = list.filter((t) => t.completed);
    if (categoryFilter !== '전체') list = list.filter((t) => t.category === categoryFilter);
    return list.sort((a, b) => (a.date + (a.startTime || '')).localeCompare(b.date + (b.startTime || '')));
  }, [tasks, statusFilter, categoryFilter]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header onOpenNewTaskModal={() => handleOpenNew()} onResetData={handleReset} />

      <main className="max-w-3xl mx-auto px-4 py-4">
        {tab === 'today' && (
          <TodaySummary tasks={tasks} onToggle={handleToggle} onClickTask={handleOpenEdit} onDelete={handleDelete} />
        )}

        {tab === 'calendar' && (
          <TaskCalendarView tasks={tasks} onToggle={handleToggle} onClickTask={handleOpenEdit} onDelete={handleDelete} onAddForDate={(d) => handleOpenNew(d)} />
        )}

        {tab === 'tasks' && (
          <div className="space-y-4">
            <FilterBar
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              categories={allCategories}
            />
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <p className="text-sm text-slate-400 px-1 py-6 text-center">해당하는 할 일이 없어요.</p>
              ) : (
                filteredTasks.map((t) => (
                  <TaskCard key={t.id} task={t} onToggle={handleToggle} onClick={handleOpenEdit} onDelete={handleDelete} />
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'routines' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-sm text-slate-600 mb-3">반복되는 루틴을 등록하면 매일 자동으로 오늘의 할 일에 생성됩니다.</p>
            <button onClick={() => setRoutineModalOpen(true)} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5">
              <Repeat className="w-4 h-4" /> 루틴 관리하기
            </button>
            <div className="mt-4 space-y-1.5">
              {routines.filter((r) => r.enabled).map((r) => (
                <div key={r.id} className="text-sm text-slate-600 flex items-center justify-between px-1 py-1.5 border-b border-slate-50 last:border-0">
                  <span>{r.title}</span>
                  <span className="text-xs text-slate-400">{r.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30">
        <div className="max-w-3xl mx-auto grid grid-cols-4">
          {([
            { key: 'today', label: '오늘', icon: Sun },
            { key: 'calendar', label: '캘린더', icon: CalendarDays },
            { key: 'tasks', label: '할 일', icon: ListChecks },
            { key: 'routines', label: '루틴', icon: Repeat },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${tab === key ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {modalOpen && (
        <TaskFormModal
          task={editingTask}
          initialDate={prefillDate}
          categories={allCategories}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingTask(null); setPrefillDate(undefined); }}
          onAddCategory={handleAddCategory}
        />
      )}

      {routineModalOpen && (
        <RoutineModal
          routines={routines}
          categories={allCategories}
          onAdd={(r) => setRoutines((prev) => [...prev, r])}
          onToggle={(id) => setRoutines((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r))}
          onDelete={(id) => setRoutines((prev) => prev.filter((r) => r.id !== id))}
          onClose={() => setRoutineModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
