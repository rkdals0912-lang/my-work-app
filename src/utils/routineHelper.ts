import { RoutineDefinition, Task } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');
export const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Does a routine apply on the given date? */
export function routineAppliesOn(routine: RoutineDefinition, date: Date): boolean {
  if (!routine.enabled) return false;
  const dow = date.getDay(); // 0=Sun..6=Sat
  switch (routine.frequency) {
    case 'DAILY':
      return true;
    case 'WEEKDAYS':
      return dow >= 1 && dow <= 5;
    case 'WEEKENDS':
      return dow === 0 || dow === 6;
    case 'WEEKLY':
    case 'CUSTOM':
      return (routine.weeklyDays || []).includes(dow);
    case 'MONTHLY':
      return date.getDate() === (routine.dayOfMonth || 1);
    default:
      return false;
  }
}

/** Create a Task instance from a routine for a specific date, if one doesn't already exist. */
export function generateTaskFromRoutine(routine: RoutineDefinition, date: Date): Task {
  const now = new Date().toISOString();
  return {
    id: `${routine.id}_${toDateStr(date)}`,
    title: routine.title,
    date: toDateStr(date),
    startTime: routine.timeOfDay,
    category: routine.category,
    priority: routine.priority,
    completed: false,
    memo: routine.memo,
    repeat: 'NONE',
    routineId: routine.id,
    createdAt: now,
    updatedAt: now,
  };
}

/** For a set of routines and a date range, generate any missing task instances. */
export function ensureRoutineTasks(
  routines: RoutineDefinition[],
  existingTasks: Task[],
  rangeStart: Date,
  rangeEnd: Date
): Task[] {
  const existingIds = new Set(existingTasks.map((t) => t.id));
  const generated: Task[] = [];
  const cursor = new Date(rangeStart);
  while (cursor <= rangeEnd) {
    for (const routine of routines) {
      if (routineAppliesOn(routine, cursor)) {
        const candidate = generateTaskFromRoutine(routine, cursor);
        if (!existingIds.has(candidate.id)) {
          generated.push(candidate);
          existingIds.add(candidate.id);
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return generated;
}
