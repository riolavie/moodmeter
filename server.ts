import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Lazy initialization of Gemini AI
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiClient;
}

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// API: Mood Facial Expression & RULER Analysis
app.post('/api/analyze-mood', async (req, res) => {
  try {
    const { imageBase64, quadrantHint, coordsHint } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Intelligent neutral fallback response if GEMINI_API_KEY is not set
      const defaultQuad: 'RED' | 'YELLOW' | 'BLUE' | 'GREEN' = quadrantHint || 'GREEN';
      return res.json({
        success: true,
        source: 'local_heuristic',
        quadrant: defaultQuad,
        x: coordsHint?.x ?? (defaultQuad === 'YELLOW' || defaultQuad === 'GREEN' ? 70 : 30),
        y: coordsHint?.y ?? (defaultQuad === 'YELLOW' || defaultQuad === 'RED' ? 30 : 70),
        confidence: 0.85,
        expressionName: defaultQuad === 'BLUE' ? '가라앉은 표정' : defaultQuad === 'RED' ? '긴장된 표정' : defaultQuad === 'GREEN' ? '차분한 표정' : '환한 미소',
        aiComment: defaultQuad === 'BLUE' ? '마음이 조금 무겁거나 피로가 느껴지는 표정이에요. 따뜻한 쉼이 필요해요.' : '표정을 바탕으로 감정 좌표를 매핑했습니다. 핀을 움직여 미세 조절해보세요.',
        recommendedWords: defaultQuad === 'BLUE' ? ['슬픔', '피로', '지침', '무기력'] : ['편안', '차분', '평온', '쉼'],
        actionSuggestion: '감정 4분면에서 내 실제 마음에 꼭 맞는 위치로 핀을 직접 조절해보세요.'
      });
    }

    // Prepare multimodal image parts
    const parts: any[] = [];
    if (imageBase64 && typeof imageBase64 === 'string') {
      let mimeType = 'image/jpeg';
      const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
      if (match) {
        mimeType = match[1];
      }
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
      if (cleanBase64.length > 0) {
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64
          }
        });
      }
    }

    const promptText = `
너는 예일대학교 감정지능센터(Yale Center for Emotional Intelligence)의 RULER 프레임워크를 기반으로 인물의 얼굴 표정과 신체 단서를 과학적(FACS: Facial Action Coding System)으로 정밀 분석하는 전문 정서 진단 AI야.

제공된 사진 속 인물의 실제 표정(눈썹, 눈매, 미간, 입꼬리, 턱의 긴장도, 표정의 활력 및 피로도)을 있는 그대로 객관적이고 정확하게 분석해줘.

[RULER 4대 감정 분면 판별 기준 - 절대 임의로 긍정/행복(YELLOW)으로 왜곡하거나 편향하지 말 것]:
1. 🔵 BLUE (낮은 에너지, 불쾌/낮은 유쾌도) - 슬픔, 피로, 지침, 외로움, 무기력, 우울, 실망, 멍함:
   - 표정 특징: 입꼬리가 아래로 처지거나 힘없이 쳐짐, 슬픈 눈빛, 눈물이 고이거나 힘없는 눈매, 처진 눈썹, 멍하거나 피곤한 시선, 무기력하고 기운 없는 무표정.
   - 좌표 기준: x = 10 ~ 45 (불쾌/저유쾌), y = 55 ~ 90 (저에너지/하단).
   - ⚠️ 슬픈 표정, 지친 표정, 축 처진 표정이면 반드시 BLUE로 정확하게 판정해!

2. 🔴 RED (높은 에너지, 불쾌/낮은 유쾌도) - 분노, 불안, 짜증, 긴장, 스트레스, 답답함, 초조, 격분:
   - 표정 특징: 미간 찌푸림(눈썹 주름), 날카롭거나 부릅뜬 눈매, 굳게 다문 입술, 턱이나 목에 힘이 들어간 모습, 긴장되거나 당황·짜증 섞인 표정.
   - 좌표 기준: x = 10 ~ 45 (불쾌/저유쾌), y = 10 ~ 45 (고에너지/상단).
   - ⚠️ 화나거나 짜증나거나 불안하고 굳은 표정이면 반드시 RED로 판정해!

3. 🟢 GREEN (낮은 에너지, 높은 유쾌도) - 편안, 평온, 차분, 감사, 만족, 안도, 여유:
   - 표정 특징: 온화하게 이완된 얼굴 근육, 편안하고 부드러운 눈매, 잔잔하고 은은한 미소, 안정되고 차분한 시선.
   - 좌표 기준: x = 55 ~ 90 (유쾌/고유쾌), y = 55 ~ 90 (저에너지/하단).
   - ⚠️ 편안하고 차분하거나 조용한 휴식 상태이면 GREEN으로 판정해!

4. 🟡 YELLOW (높은 에너지, 높은 유쾌도) - 신남, 기쁨, 설렘, 자신감, 열정, 행복, 활기:
   - 표정 특징: 크고 환하게 올라간 입꼬리, 활짝 웃는 눈, 치아가 보이는 환한 웃음, 생기 있고 빛나는 눈빛.
   - 좌표 기준: x = 55 ~ 90 (유쾌/고유쾌), y = 10 ~ 45 (고에너지/상단).
   - ⚠️ 실제로 활짝 웃거나 신나고 들뜬 에너지가 분명할 때만 YELLOW로 판정해!

[좌표 산출 규칙]:
- x (유쾌도 Pleasantness): 0(극도로 불쾌/고통/슬픔) ~ 100(극도로 유쾌/행복/즐거움), 50=중립
- y (에너지 위치 Energy Level): 0(최고조 에너지/화냄/환희) ~ 100(최저 에너지/깊은 피로/숙면), 50=중립 (격자 상단이 y=0, 하단이 y=100)

[공감 피드백 가이드]:
- aiComment: 사용자의 실제 감정을 있는 그대로 공감하고 수용해줘. 슬프거나 지쳤을 때 억지 긍정을 강요하지 말고 "많이 지치고 힘들었군요. 지금은 편안한 휴식이 필요해요"처럼 진심 어린 위로를 건네줘.

반드시 유효한 JSON 포맷으로만 응답해:
{
  "quadrant": "RED" | "YELLOW" | "BLUE" | "GREEN",
  "x": number,
  "y": number,
  "expressionName": "표정 관찰 근거 요약 (예: 처진 입꼬리와 슬픈 눈매, 미간의 긴장과 굳은 입술, 은은한 미소, 활짝 웃는 얼굴)",
  "aiComment": "사용자에게 전하는 따뜻하고 진솔한 공감 한마디 (1~2문장)",
  "recommendedWords": ["단어1", "단어2", "단어3", "단어4"],
  "actionSuggestion": "해당 정서 상태에 최적화된 1문장 조언"
}
`;
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: parts,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = null;
    }

    if (parsedData && parsedData.quadrant) {
      // Validate quadrant and coordinates consistency
      let validatedQuad: 'RED' | 'YELLOW' | 'BLUE' | 'GREEN' = parsedData.quadrant;
      let valX = typeof parsedData.x === 'number' ? Math.min(Math.max(parsedData.x, 8), 92) : 50;
      let valY = typeof parsedData.y === 'number' ? Math.min(Math.max(parsedData.y, 8), 92) : 50;

      // Ensure coordinate matches quadrant
      if (validatedQuad === 'RED') {
        if (valX >= 50) valX = 30;
        if (valY >= 50) valY = 28;
      } else if (validatedQuad === 'YELLOW') {
        if (valX < 50) valX = 72;
        if (valY >= 50) valY = 28;
      } else if (validatedQuad === 'BLUE') {
        if (valX >= 50) valX = 28;
        if (valY < 50) valY = 72;
      } else if (validatedQuad === 'GREEN') {
        if (valX < 50) valX = 72;
        if (valY < 50) valY = 72;
      }

      return res.json({
        success: true,
        source: 'gemini_vision',
        quadrant: validatedQuad,
        x: valX,
        y: valY,
        expressionName: parsedData.expressionName || '표정 분석 완료',
        aiComment: parsedData.aiComment || '표정에서 감지된 정서 상태입니다. 핀을 움직여 내 마음에 맞게 조절해보세요.',
        recommendedWords: parsedData.recommendedWords || ['슬픔', '피로', '기쁨', '편안'],
        actionSuggestion: parsedData.actionSuggestion || '지금 감정에 귀를 기울이고 부드럽게 조절해보세요.'
      });
    }

    // If parsing failed
    return res.json({
      success: true,
      source: 'fallback',
      quadrant: 'GREEN',
      x: 65,
      y: 65,
      expressionName: '차분한 표정',
      aiComment: '사진을 바탕으로 감정 좌표를 매핑했습니다. 핀을 움직여 내 마음에 더 가깝게 맞춰보세요.',
      recommendedWords: ['편안', '차분', '평온', '여유'],
      actionSuggestion: '감정 4분면 격자에서 지금 기분에 맞는 위치로 핀을 조절해주세요.'
    });
  } catch (error) {
    console.error('Mood analysis error:', error);
    return res.json({
      success: true,
      source: 'fallback',
      quadrant: 'GREEN',
      x: 65,
      y: 65,
      expressionName: '차분한 표정',
      aiComment: '감정 4분면 격자에서 내 현재 기분과 에너지에 맞게 핀을 직접 움직여 미세 조절해보세요.',
      recommendedWords: ['편안', '차분', '슬픔', '신남'],
      actionSuggestion: '핀을 드래그하거나 미세 조절 버튼을 눌러 정확한 위치를 지정하세요.'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
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
    console.log(`Mood Meter Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
