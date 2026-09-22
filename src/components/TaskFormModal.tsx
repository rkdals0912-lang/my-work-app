import React, { useState, useEffect } from 'react';
import { Task, TaskCategory, PriorityLevel, RepeatType } from '../types';
import { X } from 'lucide-react';

const DEFAULT_CATEGORIES: TaskCategory[] = ['업무', '집안일', '개인', '가족', '약속', '쇼핑', '건강/운동', '기타'];
const REPEAT_LABELS: Record<RepeatType, string> = {
  NONE: '반복 없음',
  DAILY: '매일',
  WEEKDAYS: '평일',
  WEEKENDS: '주말',
  WEEKLY: '매주',
  MONTHLY: '매월',
  CUSTOM: '사용자 지정',
};
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n: number) => String(n).padStart(2, '0');
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

interface TaskFormModalProps {
  task?: Task | null;
  initialDate?: string;
  categories: TaskCategory[];
  onSave: (task: Task) => void;
  onClose: () => void;
  onAddCategory: (category: string) => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({ task, initialDate, categories, onSave, onClose, onAddCategory }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [date, setDate] = useState(task?.date || initialDate || todayStr());
  const [startTime, setStartTime] = useState(task?.startTime || '');
  const [endTime, setEndTime] = useState(task?.endTime || '');
  const [category, setCategory] = useState<TaskCategory>(task?.category || '개인');
  const [priority, setPriority] = useState<PriorityLevel>(task?.priority || '보통');
  const [memo, setMemo] = useState(task?.memo || '');
  const [repeat, setRepeat] = useState<RepeatType>(task?.repeat || 'NONE');
  const [weeklyDays, setWeeklyDays] = useState<number[]>(task?.repeatWeeklyDays || []);
  const [reminder, setReminder] = useState<number | ''>(task?.reminderMinutesBefore ?? '');
  const [newCategory, setNewCategory] = useState('');
  const [showMore, setShowMore] = useState(!!task);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]));

  const toggleDay = (d: number) => {
    setWeeklyDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    const now = new Date().toISOString();
    const saved: Task = {
      id: task?.id || `task-${Date.now()}`,
      title: title.trim(),
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      category,
      priority,
      completed: task?.completed || false,
      completedAt: task?.completedAt,
      memo: memo || undefined,
      repeat,
      repeatWeeklyDays: repeat === 'WEEKLY' || repeat === 'CUSTOM' ? weeklyDays : undefined,
      reminderMinutesBefore: reminder === '' ? undefined : Number(reminder),
      routineId: task?.routineId,
      createdAt: task?.createdAt || now,
      updatedAt: now,
    };
    onSave(saved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-slate-800">{task ? '할 일 수정' : '할 일 추가'}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500">무엇을 할까요?</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 장보기"
              className="mt-1 w-full px-3 py-2.5 text-base border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500">날짜</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50"
              >
                {allCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {!showMore && (
            <button
              type="button"
              onClick={() => setShowMore(true)}
              className="text-sm text-blue-600 font-medium"
            >
              + 시간, 우선순위, 반복 등 자세히 입력
            </button>
          )}

          {showMore && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">시작 시간</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">종료 시간</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">우선순위</label>
                <div className="mt-1 flex gap-2">
                  {(['낮음', '보통', '높음'] as PriorityLevel[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border ${
                        priority === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">반복</label>
                <select value={repeat} onChange={(e) => setRepeat(e.target.value as RepeatType)} className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50">
                  {Object.entries(REPEAT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                {(repeat === 'WEEKLY' || repeat === 'CUSTOM') && (
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {WEEKDAY_LABELS.map((label, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => toggleDay(idx)}
                        className={`w-9 h-9 rounded-full text-xs font-semibold border ${
                          weeklyDays.includes(idx) ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">알림</label>
                <select value={reminder} onChange={(e) => setReminder(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50">
                  <option value="">알림 없음</option>
                  <option value={10}>10분 전</option>
                  <option value={30}>30분 전</option>
                  <option value={60}>1시간 전</option>
                  <option value={1440}>1일 전</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">메모</label>
                <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 resize-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">새 카테고리 추가</label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="예: 육아"
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCategory.trim()) {
                        onAddCategory(newCategory.trim());
                        setCategory(newCategory.trim());
                        setNewCategory('');
                      }
                    }}
                    className="px-3 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl"
                  >
                    추가
                  </button>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-sm">
            저장
          </button>
        </form>
      </div>
    </div>
  );
};
