import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// AI Task Assistant Endpoint
// Recommends stage, priority, checkpoints, tips, and urgency reason based on task title
app.post('/api/ai/suggest-task', async (req, res) => {
  try {
    const { title, categoryType, context } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `당신은 업무 및 제조 공정 생산관리/일상 할 일 플래너 전문 AI 어시스턴트입니다.
사용자가 입력한 '할 일 제목(또는 작업명)'과 '분류(일상할일/개인업무/정비점검/일반업무)'를 분석하여,
가장 최적화된 진행 단계, 실행 우선순위(보통/우선/긴급), 구체적인 실행 체크포인트 목록(3~5개), 유의사항/메모를 JSON 형태로 제안하세요.

규칙:
1. priority: '보통', '우선', '긴급' 중 하나를 선택하세요.
2. recommendedStage: '준비/계획', '진행/실행', '점검/검토', '보완/조치', '완료/보고', '원료계량', '진공배합', '탈포공정', '품질검사', '자동충진', '포장적재', '출고대기' 중 가장 적합한 하나를 선택하세요.
3. checkpoints: 실행 가능한 실천 항목을 구체적인 문장(3~5개)으로 작성하세요.
4. advice: 작업을 효율적이고 안전하게 완수하기 위한 핵심 조언 1~2줄.
5. estimatedDuration: 예상 소요 시간 (예: '30분', '2시간', '1일').`;

    const prompt = `할 일 제목: "${title.trim()}"
분류: ${categoryType || '일반'}
추가 메모/맥락: ${context || '없음'}

위 정보를 바탕으로 최적의 우선순위, 추천 진행단계, 세부 체크포인트와 조언을 제안해주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priority: {
              type: Type.STRING,
              description: "우선순위 ('보통', '우선', '긴급')",
            },
            priorityReason: {
              type: Type.STRING,
              description: '우선순위를 그렇게 선정한 구체적 이유',
            },
            recommendedStage: {
              type: Type.STRING,
              description: '추천 진행 단계',
            },
            estimatedDuration: {
              type: Type.STRING,
              description: '예상 소요 시간',
            },
            checkpoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '실행해야 할 구체적인 3~5개 단계별 체크포인트',
            },
            advice: {
              type: Type.STRING,
              description: '작업 수행 시 유의사항 및 실행 팁',
            },
          },
          required: [
            'priority',
            'priorityReason',
            'recommendedStage',
            'checkpoints',
            'advice',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, suggestion: parsed });
  } catch (error: any) {
    console.error('Gemini Task Suggestion Error:', error);
    return res.status(500).json({
      error: error.message || 'AI 작업 보조 분석 중 오류가 발생했습니다.',
    });
  }
});

// AI Daily Briefing Endpoint
// Analyzes current tasks and generates 3-bullet concise morning/daily briefing
app.post('/api/ai/daily-briefing', async (req, res) => {
  try {
    const { tasksSummary } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `당신은 탑씰 생산현장 및 개인 업무 총괄 AI 브리퍼입니다.
주어진 할 일 및 작업 현황(전체 개수, 오늘 마감 건수, 지연 건수, 미해결 특이사항 등)을 요약하여
오늘 하루 집중해야 할 핵심 실행 가이드와 주의사항을 3개의 정돈된 불릿포인트(Markdown)로 간결 명료하게 작성하세요.`;

    const prompt = `현재 업무 및 할 일 현황 데이터:
${JSON.stringify(tasksSummary || {}, null, 2)}

오늘의 AI 브리핑 요약 3줄을 작성해주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            briefingTitle: { type: Type.STRING, description: '한 줄 헤드라인' },
            bullets: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '핵심 실천 항목 3줄',
            },
            encouragement: { type: Type.STRING, description: '응원 메시지' },
          },
          required: ['briefingTitle', 'bullets'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, briefing: parsed });
  } catch (error: any) {
    console.error('Gemini Daily Briefing Error:', error);
    return res.status(500).json({
      error: error.message || 'AI 일일 브리핑 생성 중 오류가 발생했습니다.',
    });
  }
});

// AI Routine Automation Endpoint
// Analyzes user routines, today's unfinished tasks, and tomorrow's target date
// Generates tailored, structured tasks for tomorrow with customized checkpoints and advice
app.post('/api/ai/generate-routine-tasks', async (req, res) => {
  try {
    const { routines, tomorrowDate, unfinishedTasks, userPrompt } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `당신은 업무 및 루틴 자동화 총괄 AI 비서입니다.
사용자가 등록해 둔 '매일/매주 반복 일상 루틴' 목록과 '오늘 미완료된 잔여 작업', 그리고 목표 날짜(내일)를 분석하여,
내일 수행해야 할 맞춤형 신규 할 일 목록(JSON 형태)을 생성하세요.

규칙:
1. 사용자가 활성화(enabled: true)한 루틴 중에서, 내일의 요일/빈도에 부합하거나 내일 꼭 해야 하는 루틴을 선별하고, 필요시 오늘 미완료된 잔여 작업을 내일의 과제로 적절히 승계/보완하세요.
2. 각 할 일마다 다음 속성을 생성합니다:
   - title: 명확한 실행형 제목 (예: "오전 일일 업무 점검 및 우선순위 일정 조율")
   - taskType: 'DAILY' | 'WORK' | 'MAINTENANCE' | 'PERSONAL'
   - line: 분류 또는 수행 장소 (예: "개인 업무", "현장 / 공장동", "1호기 배합실")
   - priority: '보통' | '우선' | '긴급'
   - stage: '준비/계획' | '진행/실행' | '점검/검토' | '보완/조치' | '완료/보고'
   - checkpoints: 내일 실행해야 할 구체적인 2~4개 세부 체크포인트 문장 목록
   - memo: 내일 작업을 위한 핵심 팁이나 유의사항 메모
   - timeOfDay: '오전' | '오후' | '퇴근전' | '상시'
   - rationale: 해당 작업을 내일 추천하는 구체적 이유 (예: "화요일 정기 루틴 및 전일 미결사항 반영")
3. summaryRationale: 전체 생성된 내일 일정 계획에 대한 AI의 종합 브리핑 한 줄.
4. 한국어로 정중하고 명확하게 작성하세요.`;

    const prompt = `내일 날짜: ${tomorrowDate || '내일'}
사용자 추가 지시사항: ${userPrompt || '기본 루틴에 맞춰 내일의 할 일을 자동 편성해주세요.'}

[등록된 반복 루틴 목록]
${JSON.stringify(routines || [], null, 2)}

[오늘 미완료 잔여 작업 현황]
${JSON.stringify(unfinishedTasks || [], null, 2)}

위 데이터를 종합하여 내일 수행할 맞춤형 자동 할 일 목록을 생성해주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryRationale: {
              type: Type.STRING,
              description: '내일 일정에 대한 AI 종합 계획 브리핑',
            },
            generatedTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: '할 일 제목' },
                  taskType: {
                    type: Type.STRING,
                    description: 'DAILY | WORK | MAINTENANCE | PERSONAL',
                  },
                  line: { type: Type.STRING, description: '장소 또는 업무 영역' },
                  priority: {
                    type: Type.STRING,
                    description: '보통 | 우선 | 긴급',
                  },
                  stage: {
                    type: Type.STRING,
                    description: '준비/계획 | 진행/실행 | 점검/검토 | 보완/조치 | 완료/보고',
                  },
                  checkpoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '세부 실행 체크포인트 목록',
                  },
                  memo: { type: Type.STRING, description: '작업 메모/유의사항' },
                  timeOfDay: { type: Type.STRING, description: '오전 | 오후 | 퇴근전 | 상시' },
                  rationale: { type: Type.STRING, description: '추천 이유' },
                },
                required: ['title', 'taskType', 'priority', 'stage', 'checkpoints'],
              },
              description: '내일 등록할 할 일 목록',
            },
          },
          required: ['summaryRationale', 'generatedTasks'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, plan: parsed });
  } catch (error: any) {
    console.error('Gemini Routine Automation Error:', error);
    return res.status(500).json({
      error: error.message || 'AI 루틴 자동화 할 일 생성 중 오류가 발생했습니다.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
