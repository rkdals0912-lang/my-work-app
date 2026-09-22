export type TaskCategory =
  | '업무'
  | '집안일'
  | '개인'
  | '가족'
  | '약속'
  | '쇼핑'
  | '건강/운동'
  | '기타'
  | string; // custom categories allowed

export type PriorityLevel = '낮음' | '보통' | '높음';

export type RepeatType = 'NONE' | 'DAILY' | 'WEEKDAYS' | 'WEEKENDS' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export interface Task {
  id: string;
  title: string; // required
  date: string; // YYYY-MM-DD, required
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  category: TaskCategory;
  priority: PriorityLevel;
  completed: boolean;
  completedAt?: string;
  memo?: string;
  repeat: RepeatType;
  repeatWeeklyDays?: number[]; // 0=Sun..6=Sat, for CUSTOM/WEEKLY
  reminderMinutesBefore?: number; // e.g. 10, 30, 60
  routineId?: string; // set if generated from a routine
  createdAt: string;
  updatedAt: string;
}

export interface RoutineDefinition {
  id: string;
  title: string;
  category: TaskCategory;
  priority: PriorityLevel;
  frequency: RepeatType; // DAILY | WEEKDAYS | WEEKENDS | WEEKLY | MONTHLY | CUSTOM
  weeklyDays?: number[]; // for WEEKLY/CUSTOM
  dayOfMonth?: number; // for MONTHLY
  timeOfDay?: string; // HH:mm optional
  memo?: string;
  enabled: boolean;
  createdAt: string;
}

export interface UserPreferences {
  defaultCategories: TaskCategory[];
  customCategories: TaskCategory[];
}
