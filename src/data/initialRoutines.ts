import { RoutineDefinition } from '../types';

export const INITIAL_ROUTINES: RoutineDefinition[] = [
  {
    id: 'routine-daily-morning',
    title: '오전 일일 업무 점검 및 당일 우선순위 일정 조율',
    frequency: 'WEEKDAYS', // 평일 매일
    weeklyDays: [1, 2, 3, 4, 5],
    categoryType: 'DAILY',
    line: '개인 업무 (오피스)',
    priority: '우선',
    stage: '준비/계획',
    targetQty: 1,
    unit: '건',
    timeOfDay: '오전',
    memoTemplate: '당일 핵심 마감 일정 3가지 점검 및 주요 유관부서 회신',
    checkpointsTemplate: [
      '오늘 마감할 긴급 업무 및 일정 확인',
      '수신 이메일 및 긴급 연락 회신',
      '당일 작업 우선순위 확정 및 투두리스트 갱신',
    ],
    enabled: true,
  },
  {
    id: 'routine-safety-patrol',
    title: '생산 현장 일상 순회 및 환경·안전 수칙 점검',
    frequency: 'DAILY', // 매일
    weeklyDays: [0, 1, 2, 3, 4, 5, 6],
    categoryType: 'WORK',
    line: '현장 / 공장동',
    priority: '우선',
    stage: '진행/실행',
    targetQty: 1,
    unit: '회',
    timeOfDay: '오전',
    memoTemplate: '작업자 안전보호구 착용 및 비상탈출구 통로 적재물 유무 확인',
    checkpointsTemplate: [
      '원료 보관창고 온·습도 및 환기 상태 점검',
      '배합기 모터 이음 및 누유 점검',
      '현장 안전 보호구(방진마스크, 장갑 등) 착용 확인',
    ],
    enabled: true,
  },
  {
    id: 'routine-equipment-maintenance',
    title: '진공 탈포 믹서기 정기 필터 세척 및 교체',
    frequency: 'WEEKLY', // 매주 금요일
    weeklyDays: [5], // Friday
    categoryType: 'MAINTENANCE',
    line: '1호기 배합실',
    priority: '보통',
    stage: '진행/실행',
    targetQty: 1,
    unit: '대',
    timeOfDay: '오후',
    memoTemplate: '세척 후 에어건으로 건조 후 재체결',
    checkpointsTemplate: [
      '설비 전원 차단(LOTO) 확인',
      '필터 망 분리 및 유기용제 잔여물 세척',
      '무부하 시운전 및 진공도 게이지 측정',
    ],
    enabled: true,
  },
  {
    id: 'routine-inventory-check',
    title: '주간 원자재 재고 실사 및 다음 주 소요분 발주 요청',
    frequency: 'WEEKLY', // 매주 수요일
    weeklyDays: [3], // Wednesday
    categoryType: 'WORK',
    line: '원자재 창고 / 현장 사무실',
    priority: '우선',
    stage: '점검/검토',
    targetQty: 1,
    unit: '건',
    timeOfDay: '오후',
    memoTemplate: '탄산칼슘 및 실리콘 폴리머 드럼 잔량 전수 카운트',
    checkpointsTemplate: [
      '원자재 입출고 대장 전산 수량 비교',
      '안전 재고 수량 대비 부족분 계산',
      '구매팀 발주의뢰서 기안 상신',
    ],
    enabled: true,
  },
  {
    id: 'routine-daily-closing',
    title: '퇴근 전 일일 업무 일지 작성 및 내일 할 일 정리',
    frequency: 'WEEKDAYS', // 평일 매일
    weeklyDays: [1, 2, 3, 4, 5],
    categoryType: 'DAILY',
    line: '개인 업무',
    priority: '보통',
    stage: '점검/검토',
    targetQty: 1,
    unit: '회',
    timeOfDay: '퇴근전',
    memoTemplate: '미결 과제 원인 분석 및 인수인계 사항 기록',
    checkpointsTemplate: [
      '당일 완료된 할 일 상태 최종 체크',
      '미결 과제 이월 사유 및 내일 진행계획 메모',
      '동료 또는 야간조 인수인계 사항 전달',
    ],
    enabled: true,
  },
];
