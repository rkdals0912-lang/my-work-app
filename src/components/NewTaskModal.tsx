import React, { useState } from 'react';
import { SealantTask, UserProfile, PriorityLevel, ProcessStage, ProductCategory, TaskCategoryType } from '../types';
import { PROCESS_STAGES, DEFAULT_USERS } from '../data/initialData';
import { 
  X, 
  PlusCircle, 
  CheckSquare, 
  Briefcase, 
  Calendar, 
  Clock, 
  Sparkles,
  Bot,
  Loader2,
  Check,
  AlertCircle,
  ArrowRight,
  Lightbulb
} from 'lucide-react';

interface NewTaskModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onCreateTask: (newTask: SealantTask) => void;
}

// Preset quick templates for daily & personal tasks
const QUICK_DAILY_TEMPLATES = [
  {
    title: '오전 일일 업무 점검 및 계획 수립',
    category: 'daily_todo' as ProductCategory,
    taskType: 'DAILY' as TaskCategoryType,
    line: '개인 업무 (오피스)',
    unit: '건',
    qty: 1,
    priority: '보통' as PriorityLevel,
    stage: '진행/실행' as ProcessStage,
    memo: '당일 우선순위 할 일 3가지 선별 및 일정 조율',
    checkpoints: ['오늘 할 일 목록 작성', '중요 회의 및 마감 시간 확인', '이메일 및 긴급 연락 회신'],
  },
  {
    title: '생산 라인 일상 순회 및 안전 환경 점검',
    category: 'factory_work' as ProductCategory,
    taskType: 'WORK' as TaskCategoryType,
    line: '현장 / 공장동',
    unit: '회',
    qty: 1,
    priority: '우선' as PriorityLevel,
    stage: '진행/실행' as ProcessStage,
    memo: '라인 내 소화전, 비상구 및 폐기물 분리수거 상태 확인',
    checkpoints: ['원료 보관창고 온·습도 점검', '배합기 모터 이음 및 누유 점검', '작업자 안전 보호구 착용 확인'],
  },
  {
    title: '원자재 재고 파악 및 다음 주 소요분 발주 요청',
    category: 'factory_work' as ProductCategory,
    taskType: 'WORK' as TaskCategoryType,
    line: '현장 사무실',
    unit: '건',
    qty: 1,
    priority: '우선' as PriorityLevel,
    stage: '준비/계획' as ProcessStage,
    memo: '탄산칼슘 및 실리콘 폴리머 드럼 잔량 전수 카운트',
    checkpoints: ['원자재 입출고 대장 검토', '안전 재고 수량 비교', '구매팀 발주의뢰서 기안 상신'],
  },
  {
    title: '진공 탈포 믹서기 정기 필터 세척 및 교체',
    category: 'maintenance' as ProductCategory,
    taskType: 'MAINTENANCE' as TaskCategoryType,
    line: '1호기 배합실',
    unit: '대',
    qty: 1,
    priority: '보통' as PriorityLevel,
    stage: '진행/실행' as ProcessStage,
    memo: '세척 후 에어건으로 건조 후 재체결',
    checkpoints: ['설비 전원 차단(LOTO) 확인', '신규 필터 교체', '무부하 시운전 및 진공도 측정'],
  },
  {
    title: '퇴근 전 일일 업무 일지 작성 및 인수인계',
    category: 'daily_todo' as ProductCategory,
    taskType: 'DAILY' as TaskCategoryType,
    line: '개인 업무',
    unit: '회',
    qty: 1,
    priority: '보통' as PriorityLevel,
    stage: '점검/검토' as ProcessStage,
    memo: '내일 진행할 핵심 작업 3가지 메모 남겨두기',
    checkpoints: ['당일 완료 작업 체크', '미결 과제 이월 사유 정리', '야간조/동료 인수인계 전달'],
  },
];

interface AISuggestionResult {
  priority: PriorityLevel;
  priorityReason: string;
  recommendedStage: ProcessStage;
  estimatedDuration?: string;
  checkpoints: string[];
  advice: string;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  currentUser,
  onClose,
  onCreateTask,
}) => {
  const [taskCategoryType, setTaskCategoryType] = useState<TaskCategoryType>('DAILY');
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const dateCode = todayStr.slice(2).replace(/-/g, '');
  const randomSuffix = Math.floor(10 + Math.random() * 90);

  const [lotNo, setLotNo] = useState(`MY-${dateCode}-${randomSuffix}`);
  const [title, setTitle] = useState('');
  const [line, setLine] = useState('개인 업무');
  const [priority, setPriority] = useState<PriorityLevel>('보통');
  const [manager, setManager] = useState(currentUser.name);
  const [managerRole, setManagerRole] = useState(currentUser.role);
  const [shift, setShift] = useState<'주간조' | '야간조' | '상시'>('상시');
  const [stage, setStage] = useState<ProcessStage>('진행/실행');
  const [startDate, setStartDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(todayStr);
  const [unit, setUnit] = useState('건');
  const [targetQty, setTargetQty] = useState<number>(1);
  const [initialMemo, setInitialMemo] = useState('');
  const [checkpointInputs, setCheckpointInputs] = useState<string[]>(['']);

  // AI Assistant States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestionResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleApplyTemplate = (tmpl: typeof QUICK_DAILY_TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setTaskCategoryType(tmpl.taskType);
    setLine(tmpl.line);
    setUnit(tmpl.unit);
    setTargetQty(tmpl.qty);
    setPriority(tmpl.priority);
    setStage(tmpl.stage);
    setInitialMemo(tmpl.memo);
    setCheckpointInputs(tmpl.checkpoints);
    setAiSuggestion(null);
    setAiError(null);
  };

  const handleAddCheckpointInput = () => {
    setCheckpointInputs([...checkpointInputs, '']);
  };

  const handleRemoveCheckpointInput = (index: number) => {
    setCheckpointInputs(checkpointInputs.filter((_, i) => i !== index));
  };

  const handleUpdateCheckpointInput = (index: number, val: string) => {
    const updated = [...checkpointInputs];
    updated[index] = val;
    setCheckpointInputs(updated);
  };

  // Call Gemini API to recommend checkpoints and priority
  const handleRequestAiSuggestion = async () => {
    if (!title.trim()) {
      setAiError('할 일 제목을 먼저 입력해주세요.');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/suggest-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          categoryType: taskCategoryType,
          context: `${line ? `장소/분류: ${line}, ` : ''}${initialMemo ? `기존메모: ${initialMemo}` : ''}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI 분석 요청에 실패했습니다.');
      }

      setAiSuggestion(data.suggestion);
    } catch (err: any) {
      console.error('Failed to get AI suggestions:', err);
      setAiError(err.message || 'AI 작업 보조 호출 중 오류가 발생했습니다.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Apply AI suggestion to current form fields
  const handleApplyAiSuggestion = () => {
    if (!aiSuggestion) return;

    if (aiSuggestion.priority) {
      setPriority(aiSuggestion.priority);
    }
    if (aiSuggestion.recommendedStage && PROCESS_STAGES.includes(aiSuggestion.recommendedStage)) {
      setStage(aiSuggestion.recommendedStage);
    }
    if (aiSuggestion.checkpoints && aiSuggestion.checkpoints.length > 0) {
      setCheckpointInputs(aiSuggestion.checkpoints);
    }
    if (aiSuggestion.advice) {
      const adviceNote = `[AI 권장 팁] ${aiSuggestion.advice}`;
      setInitialMemo((prev) => (prev ? `${prev}\n\n${adviceNote}` : adviceNote));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const timestamp = `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`;
    const dateStr = new Date().toISOString().slice(0, 10);

    const finalCheckpoints = checkpointInputs
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t, idx) => ({
        id: `cp-${Date.now()}-${idx}`,
        title: t,
        completed: false,
      }));

    const initialAudit = {
      id: `audit-${Date.now()}`,
      taskId: `task-${Date.now()}`,
      taskLotNo: lotNo,
      taskTitle: title.trim(),
      operator: currentUser.name,
      operatorRole: currentUser.role,
      timestamp,
      actionType: 'CREATED' as const,
      description: `[${taskCategoryType}] 신규 할 일 등록 (식별번호: ${lotNo}, 담당: ${manager})`,
    };

    const newTask: SealantTask = {
      id: `task-${Date.now()}`,
      lotNo: lotNo.trim(),
      productName: title.trim(),
      taskType: taskCategoryType,
      productCategory: (taskCategoryType === 'DAILY' ? 'daily_todo' : taskCategoryType === 'MAINTENANCE' ? 'maintenance' : 'factory_work') as ProductCategory,
      line: line.trim() || '개인 업무',
      shift,
      manager,
      managerRole,
      targetQty: targetQty > 0 ? targetQty : 1,
      producedQty: 0,
      unit: unit || '건',
      progress: 0,
      status: '진행중',
      priority,
      stage,
      checkpoints: finalCheckpoints,
      memos: initialMemo.trim()
        ? [
            {
              id: `memo-${Date.now()}`,
              author: currentUser.name,
              role: currentUser.role,
              category: '할일메모',
              content: initialMemo.trim(),
              createdAt: timestamp,
            },
          ]
        : [],
      issues: [],
      auditHistory: [initialAudit],
      scheduledDate: startDate || dateStr,
      startDate: startDate || dateStr,
      dueDate: dueDate || dateStr,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    onCreateTask(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                나의 할 일 등록 및 이력 추적
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Gemini AI 지원
                </span>
              </h2>
              <p className="text-xs text-slate-400">일상 업무, 개인 일정, 현장 점검 등 나의 모든 할 일과 이력을 기록합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Quick Preset Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                추천 일상 및 업무 할 일 템플릿 (원클릭 입력)
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_DAILY_TEMPLATES.map((tmpl) => (
                <button
                  type="button"
                  key={tmpl.title}
                  onClick={() => handleApplyTemplate(tmpl)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition ${
                    title === tmpl.title
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-bold truncate">{tmpl.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                    <span className="font-medium text-blue-600">{tmpl.line}</span>
                    <span>•</span>
                    <span>우선순위: {tmpl.priority}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Task Type Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              할 일 유형 구분
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                { id: 'DAILY', label: '일상 할 일', icon: Clock },
                { id: 'WORK', label: '업무/현장', icon: Briefcase },
                { id: 'MAINTENANCE', label: '정비/점검', icon: CheckSquare },
                { id: 'PERSONAL', label: '개인/기타', icon: Calendar },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTaskCategoryType(item.id as TaskCategoryType);
                    if (item.id === 'DAILY') setLine('개인 업무');
                    else if (item.id === 'WORK') setLine('현장 업무');
                    else if (item.id === 'MAINTENANCE') setLine('정비/점검');
                    else setLine('개인 일정');
                  }}
                  className={`py-2 px-3 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition ${
                    taskCategoryType === item.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title & AI Assistant Trigger */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900">
                할 일 제목 (내용) <span className="text-rose-500">*</span>
              </label>

              {/* Gemini AI Trigger Button */}
              <button
                type="button"
                onClick={handleRequestAiSuggestion}
                disabled={isAiLoading || !title.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                title="입력한 제목을 분석하여 최적 단계, 우선순위 및 체크포인트를 자동 제안합니다"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Gemini 분석 중...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5" />
                    <span>Gemini AI 공정·우선순위 자동추천</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="예: 실란트 2호기 라인 정기 소모품 교체 및 클리닝, 월간 영업보고서 결재 상신 등"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (aiError) setAiError(null);
              }}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium focus:border-blue-500 focus:outline-none"
            />

            {aiError && (
              <div className="text-xs text-rose-600 flex items-center gap-1.5 bg-rose-50 p-2 rounded-lg border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {/* AI Suggestion Preview Box */}
            {aiSuggestion && (
              <div className="mt-2 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-slate-800 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Gemini AI 추천 결과</span>
                    {aiSuggestion.estimatedDuration && (
                      <span className="text-[11px] font-normal text-blue-700 bg-white/80 px-2 py-0.5 rounded-full border border-blue-200">
                        예상 소요: {aiSuggestion.estimatedDuration}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyAiSuggestion}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition"
                  >
                    <Check className="w-3 h-3" />
                    <span>추천 내용 양식에 즉시 적용</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/90 p-2.5 rounded-lg border border-blue-100">
                    <span className="font-semibold text-slate-500 block text-[11px] mb-0.5">추천 우선순위</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        aiSuggestion.priority === '긴급'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : aiSuggestion.priority === '우선'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {aiSuggestion.priority}
                      </span>
                      <span className="text-[11px] text-slate-600">{aiSuggestion.priorityReason}</span>
                    </div>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-lg border border-blue-100">
                    <span className="font-semibold text-slate-500 block text-[11px] mb-0.5">추천 진행 단계</span>
                    <div className="font-bold text-blue-900">{aiSuggestion.recommendedStage}</div>
                  </div>
                </div>

                {/* Recommended checkpoints */}
                {aiSuggestion.checkpoints && aiSuggestion.checkpoints.length > 0 && (
                  <div className="bg-white/90 p-2.5 rounded-lg border border-blue-100">
                    <span className="font-semibold text-slate-500 block text-[11px] mb-1">
                      추천 세부 실행 체크포인트 ({aiSuggestion.checkpoints.length}단계):
                    </span>
                    <ul className="space-y-1 text-slate-700">
                      {aiSuggestion.checkpoints.map((cp, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                          <span className="text-blue-600 font-bold font-mono">{idx + 1}.</span>
                          <span>{cp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI advice */}
                {aiSuggestion.advice && (
                  <div className="text-[11px] text-slate-600 flex items-start gap-1.5 bg-white/70 p-2 rounded-lg">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{aiSuggestion.advice}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Lot / ID No */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                할 일 식별 코드 (ID)
              </label>
              <input
                type="text"
                required
                value={lotNo}
                onChange={(e) => setLotNo(e.target.value)}
                className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:border-blue-500"
              />
            </div>

            {/* Line / Place */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                장소 / 카테고리
              </label>
              <input
                type="text"
                required
                value={line}
                onChange={(e) => setLine(e.target.value)}
                placeholder="예: 개인 업무, 현장 사무실, 1호기 배합실"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:border-blue-500"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                우선순위
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-medium focus:bg-white focus:border-blue-500"
              >
                <option value="보통">보통 (일반)</option>
                <option value="우선">우선 (중요)</option>
                <option value="긴급">🚨 긴급 (당일 즉시 처리)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Manager */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                담당자
              </label>
              <select
                value={manager}
                onChange={(e) => {
                  setManager(e.target.value);
                  const u = DEFAULT_USERS.find((usr) => usr.name === e.target.value);
                  if (u) setManagerRole(u.role);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-medium"
              >
                {DEFAULT_USERS.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Shift */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                근무 형태
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as '주간조' | '야간조' | '상시')}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-medium"
              >
                <option value="상시">상시 / 일반</option>
                <option value="주간조">주간조</option>
                <option value="야간조">야간조</option>
              </select>
            </div>

            {/* Stage */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                진행 단계
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as ProcessStage)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-medium"
              >
                {PROCESS_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Timeline Schedule Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-blue-50/40 p-3 rounded-xl border border-blue-100">
            <div>
              <label className="block text-xs font-semibold text-blue-900 mb-1">
                시작일
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs bg-white border border-blue-200 rounded-lg p-2 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-blue-900 mb-1">
                완료 목표일 (마감일)
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs bg-white border border-blue-200 rounded-lg p-2 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Sub-checkpoints (세부 체크포인트) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                세부 실행 체크포인트 (진도 추적용)
              </label>
              <button
                type="button"
                onClick={handleAddCheckpointInput}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
              >
                + 항목 추가
              </button>
            </div>
            
            <div className="space-y-1.5">
              {checkpointInputs.map((cp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    placeholder={`실행 단계 ${idx + 1} (예: 자료 취합, 현장 점검, 완료 보고)`}
                    value={cp}
                    onChange={(e) => handleUpdateCheckpointInput(idx, e.target.value)}
                    className="flex-1 text-xs bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  {checkpointInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCheckpointInput(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Initial Memo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              메모 및 참고사항 (선택사항)
            </label>
            <textarea
              rows={2}
              placeholder="진행 시 유의사항이나 관련 메모를 작성해 두세요."
              value={initialMemo}
              onChange={(e) => setInitialMemo(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              할 일 등록 및 이력 추적 시작
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
