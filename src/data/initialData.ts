import { Task } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');
const today = new Date();
const fmt = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const now = new Date().toISOString();
let seq = 1;
const id = () => `task-${seq++}`;

export const initialTasks: Task[] = [
  { id: id(), title: '출근', date: fmt(0), startTime: '08:30', category: '업무', priority: '보통', completed: false, repeat: 'NONE', createdAt: now, updatedAt: now },
  { id: id(), title: '거래처 메일 확인', date: fmt(0), category: '업무', priority: '보통', completed: false, repeat: 'NONE', createdAt: now, updatedAt: now },
  { id: id(), title: '점심 약속', date: fmt(0), startTime: '12:00', category: '약속', priority: '보통', completed: false, repeat: 'NONE', createdAt: now, updatedAt: now },
  { id: id(), title: '장보기', date: fmt(0), startTime: '19:00', category: '쇼핑', priority: '낮음', completed: false, repeat: 'NONE', createdAt: now, updatedAt: now },
  { id: id(), title: '세탁기 돌리기', date: fmt(0), category: '집안일', priority: '낮음', completed: false, repeat: 'NONE', createdAt: now, updatedAt: now },
  { id: id(), title: '운동', date: fmt(0), startTime: '20:00', category: '건강/운동', priority: '보통', completed: false, repeat: 'NONE', createdAt: now, updatedAt: now },
  { id: id(), title: '아이와 놀아주기', date: fmt(0), category: '가족', priority: '높음', completed: false, repeat: 'NONE', createdAt: now, updatedAt: now },
  { id: id(), title: '치과 예약', date: fmt(2), startTime: '14:30', category: '약속', priority: '보통', completed: false, repeat: 'NONE', createdAt: now, updatedAt: now },
  { id: id(), title: '보고서 제출', date: fmt(1), category: '업무', priority: '높음', completed: false, repeat: 'NONE', createdAt: now, updatedAt: now },
  { id: id(), title: '어제 할 일 예시 (완료)', date: fmt(-1), category: '개인', priority: '보통', completed: true, completedAt: now, repeat: 'NONE', createdAt: now, updatedAt: now },
];
