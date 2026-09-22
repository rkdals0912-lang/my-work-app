import React, { useState } from 'react';
import { RoutineDefinition, TaskCategory, PriorityLevel, RepeatType } from '../types';
import { X, Plus, Trash2, Repeat } from 'lucide-react';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const FREQ_LABELS: Record<string, string> = { DAILY: '매일', WEEKDAYS: '평일', WEEKENDS: '주말', WEEKLY: '매주', MONTHLY: '매월', CUSTOM: '사용자 지정' };

interface RoutineModalProps {
  routines: RoutineDefinition[];
  categories: TaskCategory[];
  onAdd: (routine: RoutineDefinition) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const RoutineModal: React.FC<RoutineModalProps> = ({ routines, categories, onAdd, onToggle, onDelete, onClose }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('개인');
  const [priority, setPriority] = useState<PriorityLevel>('보통');
  const [frequency, setFrequency] = useState<RepeatType>('DAILY');
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [timeOfDay, setTimeOfDay] = useState('');

  const toggleDay = (d: number) => setWeeklyDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({
      id: `routine-${Date.now()}`,
      title: title.trim(),
      category,
      priority,
      frequency,
      weeklyDays: frequency === 'WEEKLY' || frequency === 'CUSTOM' ? weeklyDays : undefined,
      dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : undefined,
      timeOfDay: timeOfDay || undefined,
      enabled: true,
      createdAt: new Date().toISOString(),
    });
    setTitle('');
    setWeeklyDays([]);
  };

  const grouped = {
    DAILY: routines.filter((r) => r.frequency === 'DAILY' || r.frequency === 'WEEKDAYS' || r.frequency === 'WEEKENDS'),
    WEEKLY: routines.filter((r) => r.frequency === 'WEEKLY' || r.frequency === 'CUSTOM'),
    MONTHLY: routines.filter((r) => r.frequency === 'MONTHLY'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 pb-2 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5"><Repeat className="w-4 h-4 text-blue-600" />반복 루틴</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 pb-6 space-y-5">
          <div className="bg-slate-50 rounded-xl p-3 space-y-2.5">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="새 루틴 (예: 아침 약 복용)" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            <div className="grid grid-cols-2 gap-2">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={priority} onChange={(e) => setPriority(e.target.value as PriorityLevel)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg">
                {(['낮음', '보통', '높음'] as PriorityLevel[]).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as RepeatType)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
              {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {(frequency === 'WEEKLY' || frequency === 'CUSTOM') && (
              <div className="flex gap-1.5 flex-wrap">
                {WEEKDAY_LABELS.map((label, idx) => (
                  <button key={idx} onClick={() => toggleDay(idx)} className={`w-8 h-8 rounded-full text-xs font-semibold border ${weeklyDays.includes(idx) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>{label}</button>
                ))}
              </div>
            )}
            {frequency === 'MONTHLY' && (
              <input type="number" min={1} max={31} value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="매월 며칠" />
            )}
            <input type="time" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            <button onClick={handleAdd} className="w-full py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-1"><Plus className="w-4 h-4" />루틴 추가</button>
          </div>

          {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((group) => (
            grouped[group].length > 0 && (
              <div key={group}>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">{group === 'DAILY' ? '매일/평일/주말' : group === 'WEEKLY' ? '매주' : '매월'}</h3>
                <div className="space-y-1.5">
                  {grouped[group].map((r) => (
                    <div key={r.id} className="flex items-center gap-2 p-2.5 bg-white border border-slate-100 rounded-lg">
                      <button onClick={() => onToggle(r.id)} className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${r.enabled ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                        {r.enabled && <span className="text-white text-[10px]">✓</span>}
                      </button>
                      <span className={`flex-1 text-sm ${r.enabled ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{r.title}</span>
                      <span className="text-[10px] text-slate-400">{r.timeOfDay}</span>
                      <button onClick={() => onDelete(r.id)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};
