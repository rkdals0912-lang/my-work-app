import { RoutineDefinition } from '../types';

const now = new Date().toISOString();
let seq = 1;
const id = () => `routine-${seq++}`;

export const initialRoutines: RoutineDefinition[] = [
  { id: id(), title: '아침 약 복용', category: '건강/운동', priority: '보통', frequency: 'DAILY', timeOfDay: '08:00', enabled: true, createdAt: now },
  { id: id(), title: '물 마시기', category: '건강/운동', priority: '낮음', frequency: 'DAILY', enabled: true, createdAt: now },
  { id: id(), title: '자기 전 내일 일정 확인', category: '개인', priority: '보통', frequency: 'DAILY', timeOfDay: '22:00', enabled: true, createdAt: now },
  { id: id(), title: '장보기', category: '쇼핑', priority: '보통', frequency: 'WEEKLY', weeklyDays: [1], enabled: true, createdAt: now },
  { id: id(), title: '청소', category: '집안일', priority: '보통', frequency: 'WEEKLY', weeklyDays: [6], enabled: true, createdAt: now },
  { id: id(), title: '다음 주 일정 정리', category: '개인', priority: '보통', frequency: 'WEEKLY', weeklyDays: [0], enabled: true, createdAt: now },
  { id: id(), title: '카드값 확인', category: '기타', priority: '높음', frequency: 'MONTHLY', dayOfMonth: 1, enabled: true, createdAt: now },
  { id: id(), title: '정기 결제 확인', category: '기타', priority: '보통', frequency: 'MONTHLY', dayOfMonth: 25, enabled: true, createdAt: now },
];
