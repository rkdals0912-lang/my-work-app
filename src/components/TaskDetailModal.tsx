import React, { useState } from 'react';
import { 
  SealantTask, 
  UserProfile, 
  TaskStatus, 
  ProcessStage, 
  TaskMemo, 
  TaskIssue, 
  TaskCheckpoint,
  AuditLogEntry
} from '../types';
import { PROCESS_STAGES } from '../data/initialData';
import { 
  X, 
  TrendingUp, 
  MessageSquare, 
  AlertTriangle, 
  History, 
  CheckCircle2, 
  Clock, 
  Send, 
  Plus, 
  Save, 
  User, 
  ShieldCheck, 
  AlertCircle,
  FileCheck,
  Layers,
  Calendar,
  Box,
  CornerDownRight,
  Filter,
  Bot,
  Loader2,
  Sparkles
} from 'lucide-react';

interface TaskDetailModalProps {
  task: SealantTask;
  currentUser: UserProfile;
  initialTab?: 'progress' | 'memos' | 'issues' | 'audit';
  onClose: () => void;
  onUpdateTask: (updatedTask: SealantTask, newAuditLog?: AuditLogEntry) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  currentUser,
  initialTab = 'progress',
  onClose,
  onUpdateTask,
}) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'memos' | 'issues' | 'audit'>(initialTab);

  // Editable fields for Progress tab
  const [progressVal, setProgressVal] = useState<number>(task.progress);
  const [statusVal, setStatusVal] = useState<TaskStatus>(task.status);
  const [stageVal, setStageVal] = useState<ProcessStage>(task.stage);
  const [producedQtyVal, setProducedQtyVal] = useState<number>(task.producedQty);
  const [targetQtyVal, setTargetQtyVal] = useState<number>(task.targetQty);
  const [startDateVal, setStartDateVal] = useState<string>(task.startDate || task.scheduledDate || task.createdAt.slice(0, 10));
  const [dueDateVal, setDueDateVal] = useState<string>(task.dueDate || task.scheduledDate || task.createdAt.slice(0, 10));

  // New Memo form state
  const [memoContent, setMemoContent] = useState('');
  const [memoCategory, setMemoCategory] = useState<'할일메모' | '작업지시' | '주의사항' | '일반메모'>('할일메모');

  // New Issue form state
  const [showNewIssueForm, setShowNewIssueForm] = useState(false);
  const [issueCategory, setIssueCategory] = useState<TaskIssue['category']>('진행장애');
  const [issueSeverity, setIssueSeverity] = useState<TaskIssue['severity']>('주의');
  const [issueContent, setIssueContent] = useState('');
  const [issueActionTaken, setIssueActionTaken] = useState('');

  // Checkpoints
  const [checkpoints, setCheckpoints] = useState<TaskCheckpoint[]>(task.checkpoints);
  const [newCheckpointTitle, setNewCheckpointTitle] = useState('');
  const [isAiCheckpointsLoading, setIsAiCheckpointsLoading] = useState(false);

  // AI Checkpoints generator for current task
  const handleGenerateAiCheckpoints = async () => {
    setIsAiCheckpointsLoading(true);
    try {
      const res = await fetch('/api/ai/suggest-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.productName,
          categoryType: task.taskType || 'DAILY',
          context: `현재 상태: ${task.status}, 진행 단계: ${task.stage}, 기존 체크포인트 개수: ${checkpoints.length}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.suggestion?.checkpoints) {
        const timestamp = nowTimestamp();
        const generatedList: TaskCheckpoint[] = data.suggestion.checkpoints.map(
          (text: string, idx: number) => ({
            id: `cp-ai-${Date.now()}-${idx}`,
            title: text,
            completed: false,
          })
        );

        const merged = [...checkpoints, ...generatedList];
        setCheckpoints(merged);

        const auditEntry = {
          id: `audit-${Date.now()}`,
          taskId: task.id,
          taskLotNo: task.lotNo,
          taskTitle: task.productName,
          operator: currentUser.name,
          operatorRole: currentUser.role,
          timestamp,
          actionType: 'CHECKPOINT_TOGGLE' as const,
          description: `Gemini AI 추천 체크포인트 ${generatedList.length}건 자동 생성 및 추가`,
        };

        const updated: SealantTask = {
          ...task,
          checkpoints: merged,
          auditHistory: [auditEntry, ...task.auditHistory],
          updatedAt: timestamp,
        };

        onUpdateTask(updated, auditEntry);
      }
    } catch (err) {
      console.error('Failed to generate checkpoints with AI', err);
    } finally {
      setIsAiCheckpointsLoading(false);
    }
  };

  // Audit filter state
  const [auditFilter, setAuditFilter] = useState<string>('ALL');

  const nowTimestamp = () => {
    const now = new Date();
    return `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
  };

  // Save Progress & Stage changes
  const handleSaveProgressAndStage = () => {
    const timestamp = nowTimestamp();
    const changes: string[] = [];
    let primaryActionType: AuditLogEntry['actionType'] = 'PROGRESS_UPDATE';
    let fieldChanged: string | undefined = undefined;
    let oldValue: string | number | undefined = undefined;
    let newValue: string | number | undefined = undefined;

    if (progressVal !== task.progress) {
      changes.push(`진도율 ${task.progress}% → ${progressVal}%`);
      primaryActionType = 'PROGRESS_UPDATE';
      fieldChanged = 'progress';
      oldValue = task.progress;
      newValue = progressVal;
    }
    if (statusVal !== task.status) {
      changes.push(`상태 '${task.status}' → '${statusVal}'`);
      primaryActionType = 'STATUS_CHANGE';
      fieldChanged = 'status';
      oldValue = task.status;
      newValue = statusVal;
    }
    if (stageVal !== task.stage) {
      changes.push(`공정단계 '${task.stage}' → '${stageVal}'`);
      primaryActionType = 'STAGE_CHANGE';
      fieldChanged = 'stage';
      oldValue = task.stage;
      newValue = stageVal;
    }
    if (producedQtyVal !== task.producedQty) {
      changes.push(`생산수량 ${task.producedQty} → ${producedQtyVal}`);
      primaryActionType = 'QUANTITY_UPDATE';
      fieldChanged = 'producedQty';
      oldValue = task.producedQty;
      newValue = producedQtyVal;
    }
    if (startDateVal !== (task.startDate || task.scheduledDate)) {
      changes.push(`착수일 변경: ${task.startDate || task.scheduledDate} → ${startDateVal}`);
      primaryActionType = 'TASK_EDITED';
    }
    if (dueDateVal !== (task.dueDate || task.scheduledDate)) {
      changes.push(`마감기한 변경: ${task.dueDate || task.scheduledDate} → ${dueDateVal}`);
      primaryActionType = 'TASK_EDITED';
    }

    if (changes.length === 0) {
      return;
    }

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      taskId: task.id,
      taskLotNo: task.lotNo,
      taskTitle: task.productName,
      operator: currentUser.name,
      operatorRole: currentUser.role,
      timestamp,
      actionType: primaryActionType,
      description: changes.join(', '),
      fieldChanged,
      oldValue,
      newValue,
    };

    const updated: SealantTask = {
      ...task,
      progress: progressVal,
      status: statusVal,
      stage: stageVal,
      producedQty: producedQtyVal,
      targetQty: targetQtyVal,
      startDate: startDateVal,
      dueDate: dueDateVal,
      checkpoints,
      updatedAt: timestamp,
      auditHistory: [auditEntry, ...task.auditHistory],
    };

    onUpdateTask(updated, auditEntry);
  };

  // Toggle checkpoint
  const handleToggleCheckpoint = (checkpointId: string) => {
    const timestamp = nowTimestamp();
    let toggledItem: TaskCheckpoint | undefined;
    let newCompleted = false;

    const nextCheckpoints = checkpoints.map((cp) => {
      if (cp.id === checkpointId) {
        newCompleted = !cp.completed;
        toggledItem = {
          ...cp,
          completed: newCompleted,
          completedAt: newCompleted ? timestamp : undefined,
          completedBy: newCompleted ? currentUser.name : undefined,
        };
        return toggledItem;
      }
      return cp;
    });

    setCheckpoints(nextCheckpoints);

    if (toggledItem) {
      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        taskId: task.id,
        taskLotNo: task.lotNo,
        taskTitle: task.productName,
        operator: currentUser.name,
        operatorRole: currentUser.role,
        timestamp,
        actionType: 'CHECKPOINT_TOGGLE',
        description: `체크포인트 [${toggledItem.title}] ${newCompleted ? '완료 확인' : '완료 해제'}`,
      };

      const updated: SealantTask = {
        ...task,
        checkpoints: nextCheckpoints,
        updatedAt: timestamp,
        auditHistory: [auditEntry, ...task.auditHistory],
      };

      onUpdateTask(updated, auditEntry);
    }
  };

  // Add new checkpoint
  const handleAddCheckpoint = () => {
    if (!newCheckpointTitle.trim()) return;
    const newCp: TaskCheckpoint = {
      id: `cp-${Date.now()}`,
      title: newCheckpointTitle.trim(),
      completed: false,
    };
    const nextCheckpoints = [...checkpoints, newCp];
    setCheckpoints(nextCheckpoints);
    setNewCheckpointTitle('');

    const timestamp = nowTimestamp();
    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      taskId: task.id,
      taskLotNo: task.lotNo,
      taskTitle: task.productName,
      operator: currentUser.name,
      operatorRole: currentUser.role,
      timestamp,
      actionType: 'TASK_EDITED',
      description: `공정 체크포인트 추가: [${newCp.title}]`,
    };

    onUpdateTask(
      {
        ...task,
        checkpoints: nextCheckpoints,
        updatedAt: timestamp,
        auditHistory: [auditEntry, ...task.auditHistory],
      },
      auditEntry
    );
  };

  // Add Memo
  const handleAddMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoContent.trim()) return;

    const timestamp = nowTimestamp();
    const newMemo: TaskMemo = {
      id: `memo-${Date.now()}`,
      author: currentUser.name,
      role: currentUser.role,
      content: memoContent.trim(),
      category: memoCategory,
      createdAt: timestamp,
    };

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      taskId: task.id,
      taskLotNo: task.lotNo,
      taskTitle: task.productName,
      operator: currentUser.name,
      operatorRole: currentUser.role,
      timestamp,
      actionType: 'MEMO_ADDED',
      description: `[${memoCategory}] 메모 등록: "${newMemo.content.slice(0, 30)}${newMemo.content.length > 30 ? '...' : ''}"`,
    };

    const updated: SealantTask = {
      ...task,
      memos: [newMemo, ...task.memos],
      updatedAt: timestamp,
      auditHistory: [auditEntry, ...task.auditHistory],
    };

    onUpdateTask(updated, auditEntry);
    setMemoContent('');
  };

  // Add Issue
  const handleAddIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueContent.trim()) return;

    const timestamp = nowTimestamp();
    const newIssue: TaskIssue = {
      id: `issue-${Date.now()}`,
      author: currentUser.name,
      role: currentUser.role,
      category: issueCategory,
      severity: issueSeverity,
      content: issueContent.trim(),
      actionTaken: issueActionTaken.trim() || '현장 점검 및 조치 진행 중',
      resolved: false,
      createdAt: timestamp,
    };

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      taskId: task.id,
      taskLotNo: task.lotNo,
      taskTitle: task.productName,
      operator: currentUser.name,
      operatorRole: currentUser.role,
      timestamp,
      actionType: 'ISSUE_REPORTED',
      description: `특이사항 발생 보고: [${issueSeverity}][${issueCategory}] ${issueContent.slice(0, 35)}`,
    };

    const updated: SealantTask = {
      ...task,
      issues: [newIssue, ...task.issues],
      updatedAt: timestamp,
      auditHistory: [auditEntry, ...task.auditHistory],
    };

    onUpdateTask(updated, auditEntry);
    setIssueContent('');
    setIssueActionTaken('');
    setShowNewIssueForm(false);
  };

  // Resolve Issue
  const handleResolveIssue = (issueId: string, resolutionNote: string) => {
    const timestamp = nowTimestamp();
    let resolvedItem: TaskIssue | undefined;

    const nextIssues = task.issues.map((iss) => {
      if (iss.id === issueId) {
        resolvedItem = {
          ...iss,
          resolved: true,
          resolvedAt: timestamp,
          resolvedBy: currentUser.name,
          actionTaken: resolutionNote || iss.actionTaken,
        };
        return resolvedItem;
      }
      return iss;
    });

    if (resolvedItem) {
      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}`,
        taskId: task.id,
        taskLotNo: task.lotNo,
        taskTitle: task.productName,
        operator: currentUser.name,
        operatorRole: currentUser.role,
        timestamp,
        actionType: 'ISSUE_RESOLVED',
        description: `특이사항 조치 완료: [${resolvedItem.category}] ${resolutionNote || resolvedItem.actionTaken}`,
      };

      const updated: SealantTask = {
        ...task,
        issues: nextIssues,
        updatedAt: timestamp,
        auditHistory: [auditEntry, ...task.auditHistory],
      };

      onUpdateTask(updated, auditEntry);
    }
  };

  // Filtered audit logs
  const filteredAuditLogs = task.auditHistory.filter((log) => {
    if (auditFilter === 'ALL') return true;
    return log.actionType === auditFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-600 font-bold">
                {task.lotNo}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                {task.line}
              </span>
              <span className="text-xs text-slate-400">
                담당: {task.manager} ({task.managerRole})
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {task.productName}
            </h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-slate-50/70 overflow-x-auto gap-4">
          <button
            onClick={() => setActiveTab('progress')}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'progress'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>진도율 & 공정 관리</span>
          </button>

          <button
            onClick={() => setActiveTab('memos')}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'memos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>작업 메모 ({task.memos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('issues')}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'issues'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>
              특이사항 / 이상 ({task.issues.length})
              {task.issues.some((i) => !i.resolved) && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                  미해결
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'audit'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-emerald-600" />
            <span>이력 추적 로그 ({task.auditHistory.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/30">
          
          {/* ================= TAB 1: PROGRESS & PROCESS ================= */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              
              {/* Progress & Stage Status Box */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      실시간 공정 진도 및 상태
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      진도율 변경 시 작업자 이력(Audit Log)에 자동 기록됩니다.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">현재 작업자:</span>
                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                      {currentUser.name} ({currentUser.role})
                    </span>
                  </div>
                </div>

                {/* Progress Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">진도율 조정 (0 ~ 100%)</span>
                    <span className="text-xl font-extrabold text-blue-600">{progressVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressVal}
                    onChange={(e) => setProgressVal(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>0% (대기)</span>
                    <span>25% (배합)</span>
                    <span>50% (탈포/QC)</span>
                    <span>75% (충진)</span>
                    <span>100% (완료)</span>
                  </div>
                </div>

                {/* Status, Stage, Quantity grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      공정 단계 (Stage)
                    </label>
                    <select
                      value={stageVal}
                      onChange={(e) => setStageVal(e.target.value as ProcessStage)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:bg-white focus:border-blue-500"
                    >
                      {PROCESS_STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      작업 상태 (Status)
                    </label>
                    <select
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value as TaskStatus)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:bg-white focus:border-blue-500"
                    >
                      <option value="대기">대기</option>
                      <option value="진행중">진행중</option>
                      <option value="검사대기">검사대기</option>
                      <option value="일시보류">일시보류</option>
                      <option value="완료">완료</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      생산 수량 ({task.unit})
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max={targetQtyVal * 2}
                        value={producedQtyVal}
                        onChange={(e) => setProducedQtyVal(Number(e.target.value))}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:bg-white focus:border-blue-500"
                      />
                      <span className="text-xs text-slate-500 shrink-0">/ {targetQtyVal}</span>
                    </div>
                  </div>
                </div>

                {/* Schedule & Due Date (Gantt Schedule) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      공정 착수일 (시작일)
                    </label>
                    <input
                      type="date"
                      value={startDateVal}
                      onChange={(e) => setStartDateVal(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-md p-1.5 text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      생산 완료 목표일 (마감 기한)
                    </label>
                    <input
                      type="date"
                      value={dueDateVal}
                      onChange={(e) => setDueDateVal(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-md p-1.5 text-slate-800 font-medium"
                    />
                  </div>
                </div>

                {/* Save button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveProgressAndStage}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>진도 및 상태 변경 저장 (이력 기록)</span>
                  </button>
                </div>
              </div>

              {/* Checkpoints Checklist */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      실행 체크포인트 & 세부 공정 단계
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      각 단계를 완료 체크하면 확인자 및 일시가 이력에 영구 보존됩니다.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerateAiCheckpoints}
                      disabled={isAiCheckpointsLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition disabled:opacity-50"
                      title="Gemini AI가 이 작업에 알맞은 추가 세부 실행 단계를 생성합니다"
                    >
                      {isAiCheckpointsLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>AI 생성 중...</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5" />
                          <span>AI 단계 추천 추가</span>
                        </>
                      )}
                    </button>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                      {checkpoints.filter((c) => c.completed).length} / {checkpoints.length} 완료
                    </span>
                  </div>
                </div>

                {/* Checkpoint list */}
                <div className="space-y-2">
                  {checkpoints.map((cp) => (
                    <div
                      key={cp.id}
                      onClick={() => handleToggleCheckpoint(cp.id)}
                      className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                        cp.completed
                          ? 'bg-emerald-50/40 border-emerald-200 text-emerald-900'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={cp.completed}
                          onChange={() => {}} // handled by parent div
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className={`text-xs font-medium ${cp.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                          {cp.title}
                        </span>
                      </div>

                      {cp.completed && (
                        <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{cp.completedBy || currentUser.name} 확인 ({cp.completedAt || nowTimestamp()})</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add new custom checkpoint */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="새 체크포인트 추가 (예: 믹서 rpm 450 설정 확인)..."
                    value={newCheckpointTitle}
                    onChange={(e) => setNewCheckpointTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCheckpoint()}
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddCheckpoint}
                    disabled={!newCheckpointTitle.trim()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition"
                  >
                    추가
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 2: MEMOS ================= */}
          {activeTab === 'memos' && (
            <div className="space-y-5">
              
              {/* Add Memo Box */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  할 일 메모 및 전달사항 등록
                </h3>
                
                <form onSubmit={handleAddMemo} className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">카테고리:</span>
                    {(['할일메모', '작업지시', '주의사항', '일반메모'] as const).map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setMemoCategory(cat)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                          memoCategory === cat
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <textarea
                      rows={3}
                      placeholder="할 일 진행 관련 메모, 유의사항, 후속 작업자 전달사항 등을 작성하세요..."
                      value={memoContent}
                      onChange={(e) => setMemoContent(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      작성자: <span className="font-semibold text-slate-700">{currentUser.name}</span> ({currentUser.role})
                    </span>
                    <button
                      type="submit"
                      disabled={!memoContent.trim()}
                      className="inline-flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>메모 저장</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Memo List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  등록된 메모 기록 ({task.memos.length})
                </h4>

                {task.memos.length === 0 ? (
                  <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
                    등록된 작업 메모가 없습니다.
                  </div>
                ) : (
                  task.memos.map((memo) => {
                    const categoryColors: Record<string, string> = {
                      할일메모: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      작업지시: 'bg-blue-100 text-blue-800 border-blue-200',
                      주의사항: 'bg-amber-100 text-amber-800 border-amber-200',
                      배합주의: 'bg-rose-100 text-rose-800 border-rose-200',
                      설비사항: 'bg-purple-100 text-purple-800 border-purple-200',
                      일반메모: 'bg-slate-100 text-slate-800 border-slate-200',
                    };

                    return (
                      <div
                        key={memo.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${categoryColors[memo.category]}`}>
                              {memo.category}
                            </span>
                            <span className="font-bold text-slate-900">{memo.author}</span>
                            <span className="text-slate-400">({memo.role})</span>
                          </div>
                          <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {memo.createdAt}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-1">
                          {memo.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* ================= TAB 3: ISSUES & EXCEPTIONS ================= */}
          {activeTab === 'issues' && (
            <div className="space-y-5">
              
              {/* Top Banner & Add Button */}
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <div>
                  <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    특이사항, 지연 및 진행 장애 이력 관리
                  </h3>
                  <p className="text-xs text-amber-800/80 mt-0.5">
                    진행 장애, 일정 지연, 품질/설비 이상, 개인 사유 등 특이사항을 기록하고 조치 이력을 추적합니다.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewIssueForm(!showNewIssueForm)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition shrink-0"
                >
                  {showNewIssueForm ? '작성 닫기' : '+ 특이사항 등록'}
                </button>
              </div>

              {/* New Issue Form */}
              {showNewIssueForm && (
                <form onSubmit={handleAddIssue} className="bg-white p-5 rounded-xl border border-amber-300 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">신규 특이사항 등록</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        이상/장애 유형
                      </label>
                      <select
                        value={issueCategory}
                        onChange={(e) => setIssueCategory(e.target.value as TaskIssue['category'])}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                      >
                        <option value="진행장애">진행장애 (돌발 변수/외주 지연)</option>
                        <option value="일정지연">일정지연 (마감 일정 임박/초과)</option>
                        <option value="품질이상">품질이상 (규격 불일치/재작업 필요)</option>
                        <option value="설비이상">설비이상 (장비 고장/소프트웨어 오류)</option>
                        <option value="기타특이사항">기타특이사항 (일상/업무 예외사항)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        심각도 (Severity)
                      </label>
                      <select
                        value={issueSeverity}
                        onChange={(e) => setIssueSeverity(e.target.value as TaskIssue['severity'])}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                      >
                        <option value="경미">경미 (진행 지속 가능)</option>
                        <option value="주의">주의 (점검 및 조치 요망)</option>
                        <option value="심각">심각 (진행 중지 및 긴급 해결 필요)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      이상 발생 내용 (현상 및 원인)
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="구체적인 이상 현상을 기록하세요 (예: 믹서 진공 게이지가 -0.08MPa 이하로 떨어지지 않음)..."
                      value={issueContent}
                      onChange={(e) => setIssueContent(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      초기 조치 사항
                    </label>
                    <input
                      type="text"
                      placeholder="현장에서 즉시 취한 조치 사항 (예: 가스켓 점검 및 보조 진공 펌프 투입)..."
                      value={issueActionTaken}
                      onChange={(e) => setIssueActionTaken(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNewIssueForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={!issueContent.trim()}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      특이사항 등록 및 이력 저장
                    </button>
                  </div>
                </form>
              )}

              {/* Issues List */}
              <div className="space-y-3">
                {task.issues.length === 0 ? (
                  <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
                    현재 등록된 특이사항이나 품질 이상이 없습니다.
                  </div>
                ) : (
                  task.issues.map((issue) => {
                    const severityColors: Record<string, string> = {
                      경미: 'bg-blue-100 text-blue-800 border-blue-200',
                      주의: 'bg-amber-100 text-amber-800 border-amber-200',
                      심각: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
                      '심각(라인정지)': 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
                    };

                    return (
                      <div
                        key={issue.id}
                        className={`p-4 rounded-xl border transition ${
                          issue.resolved
                            ? 'bg-white border-slate-200'
                            : 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-200'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[11px] border ${severityColors[issue.severity]}`}>
                              {issue.severity}
                            </span>
                            <span className="font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                              {issue.category}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              보고자: {issue.author} ({issue.role})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-mono">
                              {issue.createdAt}
                            </span>
                            {issue.resolved ? (
                              <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                조치 완료
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] bg-amber-200 text-amber-900 font-bold">
                                조치 대기중
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="text-xs text-slate-800 font-medium my-1.5 pl-1">
                          {issue.content}
                        </div>

                        {/* Action Taken */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 mt-2 text-xs text-slate-700 flex items-start gap-1.5">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <span className="font-semibold text-slate-800">조치 사항: </span>
                            <span>{issue.actionTaken}</span>
                            {issue.resolved && issue.resolvedAt && (
                              <div className="text-[11px] text-emerald-700 font-medium mt-1">
                                완료 확인: {issue.resolvedBy} ({issue.resolvedAt})
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Resolve Action Button if not resolved */}
                        {!issue.resolved && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => {
                                const note = prompt('최종 조치 및 정상화 내용을 입력하세요:', issue.actionTaken);
                                if (note !== null) {
                                  handleResolveIssue(issue.id, note);
                                }
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                            >
                              ✓ 조치 완료 처리 (이력 기록)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* ================= TAB 4: AUDIT TRAIL LOG ================= */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              
              {/* Audit Header & Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">
                    작업 변경 및 감사 이력 (Audit Trail)
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    총 {task.auditHistory.length}건
                  </span>
                </div>

                {/* Filter by action type */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={auditFilter}
                    onChange={(e) => setAuditFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">전체 이력 유형</option>
                    <option value="CREATED">생성 (CREATED)</option>
                    <option value="STATUS_CHANGE">상태 변경 (STATUS)</option>
                    <option value="PROGRESS_UPDATE">진도율 갱신 (PROGRESS)</option>
                    <option value="STAGE_CHANGE">공정단계 변경 (STAGE)</option>
                    <option value="ISSUE_REPORTED">특이사항 등록 (ISSUE)</option>
                    <option value="ISSUE_RESOLVED">특이사항 조치완료</option>
                    <option value="MEMO_ADDED">메모 추가 (MEMO)</option>
                    <option value="CHECKPOINT_TOGGLE">체크포인트 검증</option>
                  </select>
                </div>
              </div>

              {/* Timeline list */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {filteredAuditLogs.length === 0 ? (
                  <div className="text-xs text-slate-400 py-6 text-center">
                    해당 조건의 이력 내역이 없습니다.
                  </div>
                ) : (
                  filteredAuditLogs.map((log) => {
                    const actionBadgeStyles: Record<string, string> = {
                      CREATED: 'bg-slate-900 text-white',
                      STATUS_CHANGE: 'bg-blue-100 text-blue-800 border-blue-200',
                      PROGRESS_UPDATE: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                      STAGE_CHANGE: 'bg-purple-100 text-purple-800 border-purple-200',
                      ISSUE_REPORTED: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
                      ISSUE_RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold',
                      MEMO_ADDED: 'bg-sky-100 text-sky-800 border-sky-200',
                      CHECKPOINT_TOGGLE: 'bg-teal-100 text-teal-800 border-teal-200',
                      QUANTITY_UPDATE: 'bg-violet-100 text-violet-800 border-violet-200',
                      TASK_EDITED: 'bg-slate-100 text-slate-800 border-slate-200',
                    };

                    return (
                      <div key={log.id} className="relative group">
                        {/* Timeline dot */}
                        <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />
                        
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs group-hover:border-slate-300 transition">
                          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-[10px] rounded border font-semibold ${actionBadgeStyles[log.actionType] || 'bg-slate-100'}`}>
                                {log.actionType}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {log.operator}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                ({log.operatorRole})
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {log.timestamp}
                            </span>
                          </div>

                          <div className="text-xs text-slate-800 font-medium">
                            {log.description}
                          </div>

                          {log.oldValue !== undefined && log.newValue !== undefined && (
                            <div className="mt-1.5 text-[11px] font-mono text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-rose-600">이전: {String(log.oldValue)}</span>
                              <span className="mx-2 text-slate-300">→</span>
                              <span className="text-emerald-600 font-bold">변경: {String(log.newValue)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            마지막 갱신: <span className="font-mono text-slate-700">{task.updatedAt}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
