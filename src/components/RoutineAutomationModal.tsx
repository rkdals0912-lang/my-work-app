import React, { useState } from 'react';
import { 
  RoutineDefinition, 
  RoutineFrequency, 
  TaskCategoryType, 
  PriorityLevel, 
  ProcessStage, 
  UserProfile, 
  SealantTask 
} from '../types';
import { PROCESS_STAGES } from '../data/initialData';
import { 
  X, 
  Repeat, 
  Sparkles, 
  Bot, 
  Calendar, 
  Clock, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Check, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  ListTodo
} from 'lucide-react';

interface RoutineAutomationModalProps {
  routines: RoutineDefinition[];
  currentUser: UserProfile;
  currentTasks: SealantTask[];
  onClose: () => void;
  onSaveRoutines: (updatedRoutines: RoutineDefinition[]) => void;
  onBatchCreateTasks: (newTasks: SealantTask[]) => void;
}

interface GeneratedAiTask {
  title: string;
  taskType: TaskCategoryType;
  line: string;
  priority: PriorityLevel;
  stage: ProcessStage;
  checkpoints: string[];
  memo?: string;
  timeOfDay?: string;
  rationale?: string;
  selected?: boolean;
}

export const RoutineAutomationModal: React.FC<RoutineAutomationModalProps> = ({
  routines,
  currentUser,
  currentTasks,
  onClose,
  onSaveRoutines,
  onBatchCreateTasks,
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'manage'>('generate');
  const [routineList, setRoutineList] = useState<RoutineDefinition[]>(routines);

  // Tomorrow calculation (based on today 2026-09-21)
  const today = new Date();
  const tomorrowDateObj = new Date(today);
  tomorrowDateObj.setDate(today.getDate() + 1);
  const tomorrowDateStr = tomorrowDateObj.toISOString().slice(0, 10);
  const tomorrowDayName = ['일', '월', '화', '수', '목', '금', '토'][tomorrowDateObj.getDay()];

  const [targetDate, setTargetDate] = useState<string>(tomorrowDateStr);
  const [userPrompt, setUserPrompt] = useState('');
  const [includeUnfinished, setIncludeUnfinished] = useState(true);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<{
    summaryRationale: string;
    tasks: GeneratedAiTask[];
  } | null>(null);

  // Routine Management Form State (for adding/editing routine)
  const [isAddingRoutine, setIsAddingRoutine] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFreq, setNewFreq] = useState<RoutineFrequency>('DAILY');
  const [newCategory, setNewCategory] = useState<TaskCategoryType>('DAILY');
  const [newLine, setNewLine] = useState('개인 업무');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('보통');
  const [newStage, setNewStage] = useState<ProcessStage>('진행/실행');
  const [newTimeOfDay, setNewTimeOfDay] = useState<'오전' | '오후' | '퇴근전' | '상시'>('오전');
  const [newMemo, setNewMemo] = useState('');
  const [newCheckpoints, setNewCheckpoints] = useState<string[]>(['']);

  // Toggle routine active/inactive
  const handleToggleRoutine = (id: string) => {
    const updated = routineList.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    setRoutineList(updated);
    onSaveRoutines(updated);
  };

  // Delete routine
  const handleDeleteRoutine = (id: string) => {
    const updated = routineList.filter((r) => r.id !== id);
    setRoutineList(updated);
    onSaveRoutines(updated);
  };

  // Add new routine definition
  const handleCreateNewRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const filteredCp = newCheckpoints.map((c) => c.trim()).filter(Boolean);

    const newDef: RoutineDefinition = {
      id: `routine-${Date.now()}`,
      title: newTitle.trim(),
      frequency: newFreq,
      weeklyDays: newFreq === 'WEEKDAYS' ? [1, 2, 3, 4, 5] : newFreq === 'WEEKENDS' ? [0, 6] : [0, 1, 2, 3, 4, 5, 6],
      categoryType: newCategory,
      line: newLine.trim() || '개인 업무',
      priority: newPriority,
      stage: newStage,
      targetQty: 1,
      unit: '건',
      timeOfDay: newTimeOfDay,
      memoTemplate: newMemo.trim(),
      checkpointsTemplate: filteredCp.length > 0 ? filteredCp : ['기본 실행 점검'],
      enabled: true,
    };

    const updated = [...routineList, newDef];
    setRoutineList(updated);
    onSaveRoutines(updated);

    // Reset form
    setNewTitle('');
    setNewMemo('');
    setNewCheckpoints(['']);
    setIsAddingRoutine(false);
  };

  // Call Gemini AI Routine Generator
  const handleGenerateTomorrowTasks = async () => {
    setIsGenerating(true);
    setAiError(null);

    try {
      const unfinishedTasks = includeUnfinished
        ? currentTasks
            .filter((t) => t.status !== '완료')
            .map((t) => ({
              title: t.productName,
              status: t.status,
              priority: t.priority,
              progress: `${t.progress}%`,
              line: t.line,
            }))
        : [];

      const payload = {
        routines: routineList.filter((r) => r.enabled),
        tomorrowDate: `${targetDate} (${tomorrowDayName}요일)`,
        unfinishedTasks,
        userPrompt: userPrompt.trim() || undefined,
      };

      const res = await fetch('/api/ai/generate-routine-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI 루틴 할 일 생성에 실패했습니다.');
      }

      const tasksWithSelection = (data.plan.generatedTasks || []).map((t: any) => ({
        ...t,
        selected: true,
      }));

      setGeneratedPlan({
        summaryRationale: data.plan.summaryRationale || '내일의 일상 루틴과 미결 작업이 균형 있게 편성되었습니다.',
        tasks: tasksWithSelection,
      });
    } catch (err: any) {
      console.error('Failed to generate tomorrow tasks', err);
      setAiError(err.message || 'AI 작업 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle selection of generated task
  const handleToggleTaskSelect = (idx: number) => {
    if (!generatedPlan) return;
    const updated = [...generatedPlan.tasks];
    updated[idx].selected = !updated[idx].selected;
    setGeneratedPlan({ ...generatedPlan, tasks: updated });
  };

  // Register selected tasks to real task tracker
  const handleRegisterTasks = () => {
    if (!generatedPlan) return;
    const selectedTasks = generatedPlan.tasks.filter((t) => t.selected !== false);
    if (selectedTasks.length === 0) {
      setAiError('등록할 할 일을 최소 1개 이상 선택해주세요.');
      return;
    }

    const timestamp = `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`;
    const dateCode = targetDate.slice(2).replace(/-/g, '');

    const newTasksList: SealantTask[] = selectedTasks.map((t, index) => {
      const randomSuffix = Math.floor(10 + Math.random() * 90) + index;
      const lotNo = `MY-${dateCode}-${randomSuffix}`;
      const taskId = `task-ai-routine-${Date.now()}-${index}`;

      const cps = (t.checkpoints || []).map((cpTitle, cpIdx) => ({
        id: `cp-${taskId}-${cpIdx}`,
        title: cpTitle,
        completed: false,
      }));

      const auditLog = {
        id: `audit-${Date.now()}-${index}`,
        taskId,
        taskLotNo: lotNo,
        taskTitle: t.title,
        operator: currentUser.name,
        operatorRole: currentUser.role,
        timestamp,
        actionType: 'CREATED' as const,
        description: `[Gemini 루틴 자동화] ${targetDate} 내일 할 일 자동 등록 (${t.rationale || '루틴 기반'})`,
      };

      const newTask: SealantTask = {
        id: taskId,
        lotNo,
        productName: t.title,
        taskType: t.taskType || 'DAILY',
        productCategory: t.taskType === 'DAILY' ? 'daily_todo' : t.taskType === 'MAINTENANCE' ? 'maintenance' : 'factory_work',
        line: t.line || '개인 업무',
        shift: currentUser.shift === '야간조' ? '야간조' : '상시',
        manager: currentUser.name,
        managerRole: currentUser.role,
        targetQty: 1,
        producedQty: 0,
        unit: '건',
        progress: 0,
        status: '진행중',
        priority: t.priority || '보통',
        stage: t.stage || '준비/계획',
        checkpoints: cps,
        memos: t.memo ? [
          {
            id: `memo-${Date.now()}-${index}`,
            author: `${currentUser.name} (AI 자동편성)`,
            role: currentUser.role,
            category: '할일메모',
            content: `[AI 루틴 메모] ${t.memo}`,
            createdAt: timestamp,
          }
        ] : [],
        issues: [],
        auditHistory: [auditLog],
        scheduledDate: targetDate,
        startDate: targetDate,
        dueDate: targetDate,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      return newTask;
    });

    onBatchCreateTasks(newTasksList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl max-h-[94vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-inner">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">일상 루틴 & 내일 할 일 자동화</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  Gemini AI Routine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                매일/매주 반복되는 루틴과 전일 미결 업무를 분석하여 내일의 할 일을 자동 생성 및 등록합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('generate')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'generate'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>내일 할 일 AI 자동 생성 및 일괄 등록</span>
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'manage'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>나의 반복 루틴 관리 ({routineList.length}건)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'generate' ? (
            <div className="space-y-5">
              
              {/* Target Date & Options */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">생성 대상 날짜:</span>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-xs text-blue-700 bg-blue-100 font-semibold px-2 py-0.5 rounded">
                      {tomorrowDayName}요일
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeUnfinished}
                        onChange={(e) => setIncludeUnfinished(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>오늘 미완료 잔여 과제 연계 반영</span>
                    </label>
                  </div>
                </div>

                {/* Additional instructions */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    AI 특별 요청 사항 (선택)
                  </label>
                  <input
                    type="text"
                    placeholder="예: 내일 오후 품질 심사가 예정되어 있으니 관련 사전 준비를 우선순위로 포함해줘"
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Routine status chips */}
                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500 font-medium">활성 루틴:</span>
                  {routineList.filter((r) => r.enabled).map((r) => (
                    <span key={r.id} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-medium">
                      {r.title}
                    </span>
                  ))}
                  {routineList.filter((r) => r.enabled).length === 0 && (
                    <span className="text-rose-600">활성화된 루틴이 없습니다. '반복 루틴 관리' 탭에서 루틴을 켜주세요.</span>
                  )}
                </div>

                {/* Generate Button */}
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleGenerateTomorrowTasks}
                    disabled={isGenerating || routineList.filter((r) => r.enabled).length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Gemini AI가 내일 할 일 설계 및 분석 중...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Gemini AI 호출하여 내일 할 일 자동 편성</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {aiError && (
                <div className="text-xs text-rose-600 flex items-center gap-2 bg-rose-50 p-3 rounded-lg border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* AI Generated Plan Results */}
              {generatedPlan && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {/* Summary Banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-950">
                      <div className="font-bold mb-0.5">내일 일정 편성 가이드</div>
                      <div className="leading-relaxed text-blue-900">{generatedPlan.summaryRationale}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      편성된 할 일 목록 ({generatedPlan.tasks.filter((t) => t.selected !== false).length} / {generatedPlan.tasks.length}건 선택됨)
                    </span>
                    <div className="text-[11px] text-slate-500">
                      체크박스로 등록할 항목을 선택하거나 제외할 수 있습니다.
                    </div>
                  </div>

                  {/* Task list cards */}
                  <div className="space-y-2.5">
                    {generatedPlan.tasks.map((task, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleToggleTaskSelect(idx)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer ${
                          task.selected !== false
                            ? 'bg-white border-blue-300 ring-1 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={task.selected !== false}
                              onChange={() => {}} // handled by parent
                              className="w-4 h-4 text-blue-600 rounded mt-0.5 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900">
                                  {task.title}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  task.priority === '긴급'
                                    ? 'bg-rose-100 text-rose-700'
                                    : task.priority === '우선'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {task.priority}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                  {task.stage}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  • {task.line}
                                </span>
                                {task.timeOfDay && (
                                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                                    {task.timeOfDay}
                                  </span>
                                )}
                              </div>

                              {task.rationale && (
                                <p className="text-[11px] text-slate-500 mt-1">
                                  💡 {task.rationale}
                                </p>
                              )}

                              {/* Checkpoints preview */}
                              {task.checkpoints && task.checkpoints.length > 0 && (
                                <div className="mt-2 pl-2 border-l-2 border-slate-200 space-y-0.5">
                                  {task.checkpoints.map((cp, cIdx) => (
                                    <div key={cIdx} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>{cp}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {task.memo && (
                                <div className="mt-1.5 text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded">
                                  메모: {task.memo}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Register Action Bar */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      등록 시 내일 날짜({targetDate})의 신규 할 일 및 이력 추적 로그가 생성됩니다.
                    </div>
                    <button
                      type="button"
                      onClick={handleRegisterTasks}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>선택한 {generatedPlan.tasks.filter((t) => t.selected !== false).length}건 내일 할 일로 일괄 등록</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* Manage Routines Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">반복 일상 루틴 설정</h3>
                  <p className="text-[11px] text-slate-500">매일 또는 매주 정기적으로 수행해야 하는 고정 루틴을 관리합니다.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingRoutine(!isAddingRoutine)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 루틴 추가</span>
                </button>
              </div>

              {/* Add New Routine Form */}
              {isAddingRoutine && (
                <form onSubmit={handleCreateNewRoutine} className="bg-slate-50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <div className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    새로운 반복 루틴 등록
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        루틴 제목 *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="예: 퇴근 전 이메일 및 명일 계획 수립"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-medium focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        반복 주기
                      </label>
                      <select
                        value={newFreq}
                        onChange={(e) => setNewFreq(e.target.value as RoutineFrequency)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-medium"
                      >
                        <option value="DAILY">매일 (월~일)</option>
                        <option value="WEEKDAYS">평일 매일 (월~금)</option>
                        <option value="WEEKLY">주간 특정 요일</option>
                        <option value="WEEKENDS">주말 (토~일)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        분류 영역
                      </label>
                      <input
                        type="text"
                        value={newLine}
                        onChange={(e) => setNewLine(e.target.value)}
                        placeholder="예: 개인 업무, 현장 사무실"
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        권장 시간대
                      </label>
                      <select
                        value={newTimeOfDay}
                        onChange={(e) => setNewTimeOfDay(e.target.value as any)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                      >
                        <option value="오전">오전</option>
                        <option value="오후">오후</option>
                        <option value="퇴근전">퇴근 전</option>
                        <option value="상시">상시</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        우선순위
                      </label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                      >
                        <option value="보통">보통</option>
                        <option value="우선">우선</option>
                        <option value="긴급">긴급</option>
                      </select>
                    </div>
                  </div>

                  {/* Checkpoints inputs */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        기본 실행 체크포인트 (선택)
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewCheckpoints([...newCheckpoints, ''])}
                        className="text-[10px] text-blue-600 font-bold hover:underline"
                      >
                        + 단계 추가
                      </button>
                    </div>
                    <div className="space-y-1">
                      {newCheckpoints.map((cp, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder={`체크포인트 ${cIdx + 1}`}
                            value={cp}
                            onChange={(e) => {
                              const updated = [...newCheckpoints];
                              updated[cIdx] = e.target.value;
                              setNewCheckpoints(updated);
                            }}
                            className="flex-1 text-xs bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800"
                          />
                          {newCheckpoints.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setNewCheckpoints(newCheckpoints.filter((_, i) => i !== cIdx))}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsAddingRoutine(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                    >
                      루틴 저장
                    </button>
                  </div>
                </form>
              )}

              {/* Routine list */}
              <div className="space-y-2">
                {routineList.map((routine) => (
                  <div
                    key={routine.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                      routine.enabled ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={routine.enabled}
                        onChange={() => handleToggleRoutine(routine.id)}
                        className="w-4 h-4 text-blue-600 rounded mt-0.5 cursor-pointer"
                        title={routine.enabled ? '루틴 비활성화' : '루틴 활성화'}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${routine.enabled ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                            {routine.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                            {routine.frequency === 'DAILY'
                              ? '매일'
                              : routine.frequency === 'WEEKDAYS'
                              ? '평일 매일'
                              : routine.frequency === 'WEEKLY'
                              ? '매주'
                              : '주말'}
                          </span>
                          {routine.timeOfDay && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {routine.timeOfDay}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                          <span>영역: {routine.line}</span>
                          <span>•</span>
                          <span>우선순위: {routine.priority}</span>
                          <span>•</span>
                          <span>체크포인트 {routine.checkpointsTemplate.length}단계</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteRoutine(routine.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                      title="루틴 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
