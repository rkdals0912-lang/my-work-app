export type TaskStatus = '대기' | '진행중' | '검사대기' | '일시보류' | '완료';
export type PriorityLevel = '보통' | '우선' | '긴급';
export type TaskCategoryType = 'DAILY' | 'WORK' | 'MAINTENANCE' | 'PERSONAL';

export type ProcessStage = 
  | '준비/계획'
  | '진행/실행'
  | '점검/검토'
  | '보완/조치'
  | '완료/보고'
  | '원료계량' 
  | '진공배합' 
  | '탈포공정' 
  | '품질검사' 
  | '자동충진' 
  | '포장적재' 
  | '출고대기';

export type ProductCategory = 
  | 'daily_todo'        // 일상/개인 할 일
  | 'factory_work'      // 현장/업무 할 일
  | 'maintenance'       // 설비/환경 정비
  | 'modified_silicone' // 변성 실리콘
  | 'silicone'          // 실리콘
  | 'acrylic'           // 수성 아크릴
  | 'urethane'          // 우레탄
  | 'firestop';         // 방화용

export interface TaskCheckpoint {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface TaskMemo {
  id: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
  category: '할일메모' | '작업지시' | '주의사항' | '일반메모' | '배합주의' | '설비사항';
}

export interface TaskIssue {
  id: string;
  author: string;
  role: string;
  category: 
    | '진행장애' 
    | '일정지연' 
    | '품질이상' 
    | '설비이상' 
    | '기타특이사항' 
    | '충진노즐에러' 
    | '기포/탈포불량' 
    | '점도이상' 
    | '수분/경화이상' 
    | '원료부족';
  severity: '경미' | '주의' | '심각';
  content: string;
  actionTaken: string;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type AuditActionType =
  | 'CREATED'
  | 'STATUS_CHANGE'
  | 'PROGRESS_UPDATE'
  | 'STAGE_CHANGE'
  | 'CHECKPOINT_TOGGLE'
  | 'MEMO_ADDED'
  | 'ISSUE_REPORTED'
  | 'ISSUE_RESOLVED'
  | 'QUANTITY_UPDATE'
  | 'TASK_EDITED';

export interface AuditLogEntry {
  id: string;
  taskId: string;
  taskLotNo: string;
  taskTitle: string;
  operator: string;
  operatorRole: string;
  timestamp: string;
  actionType: AuditActionType;
  description: string;
  fieldChanged?: string;
  oldValue?: string | number;
  newValue?: string | number;
}

export interface SealantTask {
  id: string;
  lotNo: string; // 할 일 식별 번호 (예: TODO-01, TS260921-01)
  productName: string; // 할 일 제목 (예: 믹서기 정기 필터 점검, 원자재 발주서 승인, 일상 점검)
  taskType?: TaskCategoryType; // DAILY (일상할일), WORK (공장업무), MAINTENANCE (정비), PERSONAL (개인)
  productCategory: ProductCategory;
  line: string; // 구분/장소 (예: 개인 업무, 현장 사무실, 1호기 배합실, 일상 루틴)
  shift: '주간조' | '야간조' | '상시';
  manager: string;
  managerRole: string;
  targetQty: number;
  producedQty: number;
  unit: string;
  progress: number; // 0 - 100
  status: TaskStatus;
  priority: PriorityLevel;
  stage: ProcessStage;
  checkpoints: TaskCheckpoint[];
  memos: TaskMemo[];
  issues: TaskIssue[];
  auditHistory: AuditLogEntry[];
  scheduledDate: string;
  startDate?: string;
  dueDate?: string;
  targetShipDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  shift: '주간조' | '야간조';
}

export type RoutineFrequency = 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'WEEKENDS';

export interface RoutineDefinition {
  id: string;
  title: string;
  frequency: RoutineFrequency;
  weeklyDays?: number[]; // 0 for Sunday, 1 for Monday, etc.
  categoryType: TaskCategoryType;
  line: string;
  priority: PriorityLevel;
  stage: ProcessStage;
  targetQty: number;
  unit: string;
  memoTemplate?: string;
  checkpointsTemplate: string[];
  enabled: boolean;
  timeOfDay?: '오전' | '오후' | '퇴근전' | '상시';
}
