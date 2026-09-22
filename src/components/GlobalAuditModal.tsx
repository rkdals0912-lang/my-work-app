import React, { useState } from 'react';
import { SealantTask, AuditLogEntry, AuditActionType } from '../types';
import { 
  X, 
  History, 
  Download, 
  Search, 
  Filter, 
  Clock, 
  Calendar, 
  User, 
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { exportAuditHistoryToCSV } from '../utils/auditHelper';

interface GlobalAuditModalProps {
  tasks: SealantTask[];
  onClose: () => void;
}

export const GlobalAuditModal: React.FC<GlobalAuditModalProps> = ({ tasks, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('ALL');
  const [selectedOperator, setSelectedOperator] = useState<string>('ALL');
  const [selectedLotNo, setSelectedLotNo] = useState<string>('ALL');

  // Collect all logs
  const allLogs: AuditLogEntry[] = [];
  tasks.forEach((t) => {
    t.auditHistory.forEach((log) => allLogs.push(log));
  });

  // Extract distinct operators and lots
  const operators = Array.from(new Set(allLogs.map((l) => l.operator))).sort();
  const lotNumbers = Array.from(new Set(tasks.map((t) => t.lotNo))).sort();

  // Filter logs
  const filteredLogs = allLogs.filter((log) => {
    if (selectedActionType !== 'ALL' && log.actionType !== selectedActionType) return false;
    if (selectedOperator !== 'ALL' && log.operator !== selectedOperator) return false;
    if (selectedLotNo !== 'ALL' && log.taskLotNo !== selectedLotNo) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${log.taskLotNo} ${log.taskTitle} ${log.operator} ${log.description} ${log.actionType}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  // Sort descending by timestamp
  filteredLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  나의 할 일 & 전체 작업 이력 추적 (Audit Trail)
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {filteredLogs.length} / {allLogs.length}건
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                일상 할 일 및 업무 작업의 상태 변경, 체크포인트 실행, 메모, 특이사항 발생 및 조치 내역을 실시간 추적합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportAuditHistoryToCSV(tasks)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg border border-slate-700 transition"
              title="현재 이력 전체를 CSV 엑셀 파일로 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>CSV 내보내기</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="내용, 작업자, Lot 번호 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Action Type filter */}
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="ALL">전체 작업유형 (All Types)</option>
              <option value="ISSUE_REPORTED">🚨 특이사항 발생 (ISSUE_REPORTED)</option>
              <option value="ISSUE_RESOLVED">✅ 특이사항 조치완료 (ISSUE_RESOLVED)</option>
              <option value="PROGRESS_UPDATE">📈 진도율 갱신 (PROGRESS_UPDATE)</option>
              <option value="STATUS_CHANGE">🔄 상태 변경 (STATUS_CHANGE)</option>
              <option value="STAGE_CHANGE">🏭 공정단계 변경 (STAGE_CHANGE)</option>
              <option value="CHECKPOINT_TOGGLE">☑️ 체크포인트 검증 (CHECKPOINT)</option>
              <option value="MEMO_ADDED">📝 작업메모 추가 (MEMO_ADDED)</option>
              <option value="QUANTITY_UPDATE">📦 수량 변경 (QUANTITY_UPDATE)</option>
              <option value="CREATED">📋 생산작업 등록 (CREATED)</option>
            </select>

            {/* Operator filter */}
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="ALL">전체 작업자 (All Operators)</option>
              {operators.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>

            {/* Lot filter */}
            <select
              value={selectedLotNo}
              onChange={(e) => setSelectedLotNo(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none font-mono"
            >
              <option value="ALL">전체 Lot No</option>
              {lotNumbers.map((lot) => (
                <option key={lot} value={lot}>{lot}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/40">
          {filteredLogs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
              조건에 일치하는 이력 로그가 없습니다.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLogs.map((log) => {
                return (
                  <div
                    key={log.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${actionBadgeStyles[log.actionType] || 'bg-slate-100 text-slate-700'}`}>
                          {log.actionType}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {log.taskLotNo}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-xs">
                          {log.taskTitle}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {log.operator} <span className="text-slate-400 font-normal">({log.operatorRole})</span>
                        </span>
                        <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {log.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-800 font-medium pl-1">
                      {log.description}
                    </div>

                    {log.oldValue !== undefined && log.newValue !== undefined && (
                      <div className="mt-1.5 text-[11px] font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-100 inline-flex items-center gap-2">
                        <span className="text-slate-500 font-sans font-medium">변경 내역:</span>
                        <span className="text-rose-600 line-through">{String(log.oldValue)}</span>
                        <span className="text-slate-300">→</span>
                        <span className="text-emerald-700 font-bold">{String(log.newValue)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            TOPSEAL Traceability Engine • ISO 9001 / 품질 감사 준수
          </span>
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
