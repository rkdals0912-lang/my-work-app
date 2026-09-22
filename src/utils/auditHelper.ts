import { AuditLogEntry, AuditActionType, SealantTask, UserProfile } from '../types';

export function createAuditLog(
  task: SealantTask,
  operator: UserProfile,
  actionType: AuditActionType,
  description: string,
  fieldChanged?: string,
  oldValue?: string | number,
  newValue?: string | number
): AuditLogEntry {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5);
  const timestamp = `${dateStr} ${timeStr}`;

  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    taskId: task.id,
    taskLotNo: task.lotNo,
    taskTitle: task.productName,
    operator: operator.name,
    operatorRole: operator.role,
    timestamp,
    actionType,
    description,
    fieldChanged,
    oldValue,
    newValue,
  };
}

export function exportAuditHistoryToCSV(tasks: SealantTask[]): void {
  // Collect all audit history records from all tasks
  const allLogs: AuditLogEntry[] = [];
  tasks.forEach((t) => {
    t.auditHistory.forEach((log) => allLogs.push(log));
  });

  // Sort descending by timestamp
  allLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const headers = ['일시', '작업Lot번호', '제품명', '작업자', '직책', '작업유형', '변경항목', '변경전', '변경후', '상세내용'];
  const rows = allLogs.map((log) => [
    `"${log.timestamp}"`,
    `"${log.taskLotNo}"`,
    `"${log.taskTitle.replace(/"/g, '""')}"`,
    `"${log.operator}"`,
    `"${log.operatorRole}"`,
    `"${log.actionType}"`,
    `"${log.fieldChanged || '-'}"`,
    `"${log.oldValue !== undefined ? log.oldValue : '-'}"`,
    `"${log.newValue !== undefined ? log.newValue : '-'}"`,
    `"${log.description.replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `TOPSEAL_생산공정_이력추적_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
