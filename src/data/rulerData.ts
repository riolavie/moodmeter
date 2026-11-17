import { QuadrantMeta, QuadrantType } from '../types';

export interface SubZoneFeedback {
  zoneId: string;
  zoneName: string;
  zoneTag: string;
  intensityDesc: string;
  neuroState: string;
  customWordHint: string;
  strategyTitle: string;
  strategySteps: { title: string; desc: string; icon: string }[];
  teacherClassroomTip: string;
}

/**
 * Calculate precise sub-quadrant zone and fine-grained feedback based on (x, y) coordinates and emotion word
 * x: 0 (Extreme Unpleasant) ~ 100 (Extreme Pleasant)
 * y: 0 (Peak High Energy) ~ 100 (Deep Low Energy)
 */
export function getDetailedSubZoneFeedback(
  quadrant: QuadrantType,
  x: number,
  y: number,
  word?: string
): SubZoneFeedback {
  // 1. RED QUADRANT (x < 50, y < 50)
  if (quadrant === 'RED' || (x < 50 && y < 50)) {
    // Zone A: Extreme High Energy + Extreme Low Pleasantness (격발/분노)
    if (x < 30 && y < 30) {
      return {
        zoneId: 'RED_EXTREME_FIRE',
        zoneName: '고에너지 격발 영역 (분노 · 격분)',
        zoneTag: '🚨 급격한 흥분 & 열기',
        intensityDesc: '신체 혈류와 맥박이 급상승하며 자율신경계가 비상 경보(투쟁/도피)를 울린 상태입니다.',
        neuroState: '편도체가 과활성화되어 즉각적인 말이나 충동적 행동이 나오기 쉬우므로 즉각적인 안전 브레이크가 필요합니다.',
        customWordHint: word ? `"${word}" 상태는 내 경계선이 침범당했다고 느낄 때 오는 정당한 신호예요.` : '화가 치밀어 오를 때는 감정을 억누르기보다 안전하게 식히는 것이 우선입니다.',
        strategyTitle: 'RULER 긴급 쿨다운 & 메타 모먼트(Meta-Moment)',
        strategySteps: [
          {
            title: '1단계: 3초 메타 모먼트 (멈춤)',
            desc: '말이나 행동을 멈추고 눈을 감은 뒤 "내가 가장 존경받고 싶은 내 모습"을 3초간 떠올립니다.',
            icon: 'pause_circle'
          },
          {
            title: '2단계: 차가운 감각 자극',
            desc: '시원한 물을 한 컵 천천히 마시거나 손목과 목덜미에 찬물을 대어 뇌의 온도를 낮춥니다.',
            icon: 'water_drop'
          },
          {
            title: '3단계: 4-7-8 소화기 호흡',
            desc: '코로 4초 들이마시고, 7초 숨을 멈추었다가, 입으로 8초간 길게 후- 내쉽니다 (3회 반복).',
            icon: 'air'
          }
        ],
        teacherClassroomTip: '즉각적인 훈계보다 자극을 분리하고 5분간 마음을 가라앉힐 수 있는 진정 공간(Peace Corner)을 제공해주세요.'
      };
    }

    // Zone B: High Energy + Moderate Pleasantness (불안/긴장/초조)
    if (y < 30) {
      return {
        zoneId: 'RED_ANXIETY_TENSION',
        zoneName: '고에너지 긴장 영역 (불안 · 초조 · 과부하)',
        zoneTag: '⚡ 압박감 & 신경 과민',
        intensityDesc: '다가올 과제나 상황에 대한 부담감으로 온몸의 근육과 신경이 팽팽하게 조여진 상태입니다.',
        neuroState: '미래에 대한 불확실성으로 교감신경이 긴장하여 심장이 쿵쾅거리고 호흡이 얕아져 있습니다.',
        customWordHint: word ? `"${word}" 느낌은 내가 이 일을 잘해내고 싶다는 책임감의 반증이기도 해요.` : '초조할 때는 생각을 머릿속에만 두지 말고 밖으로 꺼내어 크기를 줄여야 합니다.',
        strategyTitle: 'RULER 신체 그라운딩 & 우선순위 재정렬',
        strategySteps: [
          {
            title: '1단계: 5-4-3-2-1 신체 그라운딩',
            desc: '주변에서 눈에 보이는 3가지 물건의 색깔을 속으로 말하며 현재 순간에 발을 붙입니다.',
            icon: 'center_focus_strong'
          },
          {
            title: '2단계: 근육 이완 기법 (점진적 긴장 해소)',
            desc: '어깨를 귀까지 잔뜩 웅크렸다가 "툭" 하고 털어내며 숨을 크게 내쉬기를 4회 실시합니다.',
            icon: 'self_improvement'
          },
          {
            title: '3단계: 지금 당장 할 일 1개만 정하기',
            desc: '통제할 수 없는 걱정은 내려두고, 지금 5분 안에 할 수 있는 가장 작은 1가지만 실행합니다.',
            icon: 'check_circle'
          }
        ],
        teacherClassroomTip: '과제의 단계를 작게 쪼개어 안내해주시고, "충분히 잘하고 있어"라는 확신을 주는 짧은 격려를 건네주세요.'
      };
    }

    // Zone C: Moderate Energy + Low Pleasantness (짜증/답답함/불만)
    return {
      zoneId: 'RED_FRUSTRATION_IRRITATION',
      zoneName: '중도 에너지 마찰 영역 (짜증 · 답답함 · 불만)',
      zoneTag: '🧱 소통 장애 & 답답한 마찰',
      intensityDesc: '일이 내 뜻대로 풀리지 않거나 오해가 생겨 마음에 불씨가 찌뿌둥하게 걸려 있는 상태입니다.',
      neuroState: '에너지가 폭발적이진 않지만 잔잔한 인지적 스트레스가 누적되어 집중력을 방해하고 있습니다.',
      customWordHint: word ? `"${word}" 상태일 땐 사소한 일에도 날카롭게 반응할 수 있으니 내 마음을 먼저 알아채주세요.` : '답답한 마음은 환기와 관점 전환을 통해 부드럽게 풀 수 있습니다.',
      strategyTitle: 'RULER 나-전달법 표현 & 시야 환기',
      strategySteps: [
        {
          title: '1단계: 원인 한 줄 적기',
          desc: '왜 답답한지 "누구 때문에"가 아니라 "어떤 상황 때문인지" 종이에 한 문장으로 적어봅니다.',
          icon: 'edit_note'
        },
        {
          title: '2단계: I-Message (나-전달법) 준비',
          desc: '"나는 ~한 상황일 때 ~한 기분이 들어"처럼 비난 없이 내 상태를 건강하게 전달할 문장을 다듬습니다.',
          icon: 'record_voice_over'
        },
        {
          title: '3단계: 창밖 먼 곳 바라보기',
          desc: '1분간 먼 산이나 하늘을 응시하며 굳어 있던 뇌의 시각적 초점을 넓혀줍니다.',
          icon: 'nature'
        }
      ],
      teacherClassroomTip: '학생의 억울한 점을 끝까지 경청해주시고, 상호 합의 가능한 대안을 스스로 고르도록 유도해주세요.'
    };
  }

  // 2. YELLOW QUADRANT (x >= 50, y < 50)
  if (quadrant === 'YELLOW' || (x >= 50 && y < 50)) {
    // Zone A: Extreme High Energy + High Pleasantness (환희/신남/열광)
    if (x > 75 && y < 25) {
      return {
        zoneId: 'YELLOW_PEAK_EUPHORIA',
        zoneName: '초고에너지 환희 영역 (신남 · 열광 · 활력 만점)',
        zoneTag: '🎉 넘치는 에너지 & 축제 모드',
        intensityDesc: '도파민과 엔도르핀이 폭발하여 어떤 도전이든 해낼 수 있을 것 같은 눈부신 상태입니다.',
        neuroState: '전두엽의 창의력과 외향적 연결 욕구가 극대화되어 아이디어와 행동력이 번뜩이고 있습니다.',
        customWordHint: word ? `"${word}" 마음은 최고의 선물이에요! 이 멋진 파도를 친구들과 함께 타보세요.` : '에너지가 넘칠 때는 창작과 팀워크에서 놀라운 결과를 만들어낼 수 있습니다.',
        strategyTitle: 'RULER 창의 발산 & 긍정 에너지 전파',
        strategySteps: [
          {
            title: '1단계: 반짝이는 아이디어 스케치',
            desc: '지금 머릿속에 맴도는 재미있는 발상이나 하고 싶은 계획을 메모장에 빠르게 남깁니다.',
            icon: 'lightbulb'
          },
          {
            title: '2단계: 친구에게 하이파이브 & 칭찬',
            desc: '옆 사람에게 밝은 미소와 함께 진심 어린 응원의 한마디를 나누어 긍정 바이러스를 퍼뜨립니다.',
            icon: 'handshake'
          },
          {
            title: '3단계: 템포 조절 (충동 방지)',
            desc: '너무 들떠서 중요한 규칙이나 디테일을 놓치지 않도록 3번 깊게 숨을 고릅니다.',
            icon: 'tune'
          }
        ],
        teacherClassroomTip: '모둠 발표나 창의적 협동 활동의 리더 역할을 부여하여 에너지를 긍정적으로 승화시켜주세요.'
      };
    }

    // Zone B: High Energy + Moderate High Pleasantness (자신감/몰입/의욕)
    if (y < 30) {
      return {
        zoneId: 'YELLOW_CONFIDENT_FLOW',
        zoneName: '고에너지 도전 영역 (자신감 · 성취감 · 몰입)',
        zoneTag: '🎯 목표 집중 & 최상의 컨디션',
        intensityDesc: '높은 자기효능감과 뚜렷한 목표 의식으로 최고의 집중력을 발휘할 수 있는 상태입니다.',
        neuroState: '뇌의 실행 기능(Executive Function)이 최적화되어 어려운 과제 해결에 가장 적합합니다.',
        customWordHint: word ? `"${word}" 상태는 학습과 성장을 위한 골든 타임입니다.` : '자신감이 차오른 지금, 미뤄두었던 가장 도전적인 과제에 뛰어들어보세요.',
        strategyTitle: 'RULER 최고 몰입(Flow) 달성 전략',
        strategySteps: [
          {
            title: '1단계: 가장 까다로운 과제 먼저 끝내기',
            desc: '오늘 할 일 중 가장 어렵고 많은 집중이 필요한 일을 지금 즉시 시작합니다.',
            icon: 'bolt'
          },
          {
            title: '2단계: 성공 요인 한 줄 기록',
            desc: '내가 오늘 왜 이렇게 잘하고 있는지, 나만의 성공 패턴을 짧게 일기에 새깁니다.',
            icon: 'task_alt'
          },
          {
            title: '3단계: 동료의 어려움 도와주기',
            desc: '어려워하는 친구에게 배운 내용을 친절하게 설명해주며 내 지식을 더욱 단단하게 만듭니다.',
            icon: 'groups'
          }
        ],
        teacherClassroomTip: '심화 탐구 과제나 도전적 퀴즈를 제시하여 지적 호기심과 성취감을 한 단계 더 높여주세요.'
      };
    }

    // Zone C: Moderate High Energy + Pleasant (호기심/설렘/유쾌)
    return {
      zoneId: 'YELLOW_SPARK_CURIOSITY',
      zoneName: '온화한 활기 영역 (호기심 · 즐거움 · 기대감)',
      zoneTag: '✨ 즐거운 탐구 & 설레는 시작',
      intensityDesc: '새로운 것에 대한 호기심과 밝은 설렘이 적절한 활력과 조화를 이루고 있는 상태입니다.',
      neuroState: '스트레스 없이 인지적 유연성이 높아져 새로운 정보와 친구의 의견을 스펀지처럼 흡수합니다.',
      customWordHint: word ? `"${word}" 기분은 오늘 하루를 배움과 즐거움으로 가득 채워줄 열쇠예요.` : '궁금한 것을 적극적으로 질문하고 탐구해보세요.',
      strategyTitle: 'RULER 질문 탐색 & 유쾌한 소통',
      strategySteps: [
        {
          title: '1단계: 호기심 질문 던지기',
          desc: '오늘 배우는 내용이나 주변 세상에 대해 "왜 그럴까?" 질문 1가지를 만들어봅니다.',
          icon: 'help_outline'
        },
        {
          title: '2단계: 즐거운 대화 나누기',
          desc: '짝꿍과 오늘 기대되는 일이나 재미있는 일상 이야기를 1분간 나눕니다.',
          icon: 'forum'
        }
      ],
      teacherClassroomTip: '자유로운 질문과 브레인스토밍을 장려하고, 학생의 엉뚱하지만 참신한 생각을 칭찬해주세요.'
    };
  }

  // 3. BLUE QUADRANT (x < 50, y >= 50)
  if (quadrant === 'BLUE' || (x < 50 && y >= 50)) {
    // Zone A: Deep Low Pleasantness + Low Energy (깊은 슬픔/외로움/상심)
    if (x < 25 && y > 75) {
      return {
        zoneId: 'BLUE_DEEP_GRIEF',
        zoneName: '깊은 상실 영역 (슬픔 · 외로움 · 마음의 상처)',
        zoneTag: '🌧️ 따뜻한 위로와 보살핌 필요',
        intensityDesc: '마음의 상처나 소외감으로 인해 심리적 에너지가 크게 가라앉아 있는 상태입니다.',
        neuroState: '고립감과 우울 정서로 인해 의욕이 저하되어 있으므로 억지 격려보다 안전한 수용과 공감이 필요합니다.',
        customWordHint: word ? `"${word}" 감정은 결코 부끄러운 것이 아니에요. 내 마음에 쉼과 눈물이 필요하다는 진실한 신호입니다.` : '힘든 마음을 혼자 짊어지지 말고 주변에 손을 내밀어보세요.',
        strategyTitle: 'RULER 자기 자비(Self-Compassion) & 연결',
        strategySteps: [
          {
            title: '1단계: 따뜻한 자기 위로 (나 안아주기)',
            desc: '가슴에 두 손을 얹고 "오늘 참 많이 힘들었구나, 내가 내 편이 되어줄게"라고 속삭여줍니다.',
            icon: 'favorite'
          },
          {
            title: '2단계: 신뢰하는 사람에게 털어놓기',
            desc: '선생님이나 믿을 수 있는 가족, 친구에게 "나 지금 조금 속상해"라고 짧게 표현해봅니다.',
            icon: 'support_agent'
          },
          {
            title: '3단계: 따뜻한 온기 채우기',
            desc: '따뜻한 온수를 마시거나 담요를 덮고 부드러운 온기를 느끼며 몸을 녹입니다.',
            icon: 'local_cafe'
          }
        ],
        teacherClassroomTip: '조용한 눈맞춤과 함께 방과 후 또는 쉬는 시간에 개별 상담을 진행하고 든든한 지지자가 되어주세요.'
      };
    }

    // Zone B: Moderate Low Energy (피로/탈진/무기력/번아웃)
    if (y > 75) {
      return {
        zoneId: 'BLUE_PHYSICAL_FATIGUE',
        zoneName: '신체적 탈진 영역 (피곤함 · 지침 · 에너지 고갈)',
        zoneTag: '🔋 배터리 충전 신호 (휴식 필수)',
        intensityDesc: '수면 부족이나 과도한 일정으로 신체 배터리가 5% 미만으로 떨어진 방전 상태입니다.',
        neuroState: '뇌에 젖산과 피로 물질이 쌓여 인지 판단 속도가 느려지고 멍해지기 쉽습니다.',
        customWordHint: word ? `"${word}" 상태일 땐 나를 다그치지 말고 온전한 쉼을 허락해주세요.` : '지금 필요한 것은 채찍질이 아니라 따뜻한 충전입니다.',
        strategyTitle: 'RULER 10분 마이크로 충전 & 긴장 완화',
        strategySteps: [
          {
            title: '1단계: 눈 감고 10분 마이크로 쉼표',
            desc: '책상에 편안히 기대어 눈을 감고 잡념 없이 호흡에만 귀를 기울입니다.',
            icon: 'bedtime'
          },
          {
            title: '2단계: 목과 척추 스트레칭',
            desc: '고개를 좌우로 천천히 젖히며 뻐근한 목과 어깨의 혈액순환을 도와줍니다.',
            icon: 'accessibility_new'
          },
          {
            title: '3단계: 비본질적 과제 미루기',
            desc: '오늘 꼭 하지 않아도 되는 사소한 일은 내일로 과감히 넘기고 일찍 잠자리에 들 준비를 합니다.',
            icon: 'schedule'
          }
        ],
        teacherClassroomTip: '무리한 발표나 체육 활동을 강요하지 않고, 가벼운 스트레칭과 수분 섭취를 권장해주세요.'
      };
    }

    // Zone C: Mild Low Energy (서운함/시무룩/공허)
    return {
      zoneId: 'BLUE_MELANCHOLY_DISAPPOINT',
      zoneName: '침울 영역 (서운함 · 아쉬움 · 시무룩)',
      zoneTag: '🍂 작은 회복의 걸음',
      intensityDesc: '기대에 미치지 못한 결과나 작은 오해로 마음 한구석이 헛헛하고 쓸쓸한 상태입니다.',
      neuroState: '의욕이 가볍게 침체되어 있으나 작은 성공 경험과 위로로 빠르게 회복할 수 있는 탄력성이 남아있습니다.',
      customWordHint: word ? `"${word}" 기분은 나를 돌아보고 성찰할 수 있는 깊이 있는 시간으로 바뀔 수 있어요.` : '나를 미소 짓게 만드는 사소한 행복을 찾아보세요.',
      strategyTitle: 'RULER 소소한 성취 & 위로 한 스푼',
      strategySteps: [
        {
          title: '1단계: 좋아하는 음악 1곡 듣기',
          desc: '마음을 편안하게 감싸주는 잔잔한 멜로디에 온전히 집중해봅니다.',
          icon: 'headphones'
        },
        {
          title: '2단계: 1분 작은 정리 미션',
          desc: '필통이나 책상 위를 1분간 깔끔하게 정돈하며 환경 통제감을 되찾습니다.',
          icon: 'cleaning_services'
        }
      ],
      teacherClassroomTip: '학생의 작은 노력과 성실함을 구체적으로 짚어서 칭찬해주시면 빠르게 회복합니다.'
    };
  }

  // 4. GREEN QUADRANT (x >= 50, y >= 50)
  // Zone A: Deep Low Energy + High Pleasantness (깊은 평온/고요)
  if (x > 75 && y > 75) {
    return {
      zoneId: 'GREEN_SERENITY_PEACE',
      zoneName: '깊은 평온 영역 (평온 · 고요 · 내면의 안식)',
      zoneTag: '🌿 맑은 호수 같은 평정심',
      intensityDesc: '바람 한 점 없는 호수처럼 몸과 마음이 완벽한 조화와 안정에 도달한 최상의 평화 상태입니다.',
      neuroState: '부교감신경계가 우세하여 심박수가 안정되고 이성적 판단과 타인에 대한 경청 능력이 최고조입니다.',
      customWordHint: word ? `"${word}" 상태는 마음의 뿌리가 깊고 튼튼하게 내려앉았음을 보여줘요.` : '이 고요하고 맑은 감각을 온전히 음미해보세요.',
      strategyTitle: 'RULER 마음챙김 심화 & 사색의 시간',
      strategySteps: [
        {
          title: '1단계: 잔잔한 들숨 날숨 감각 음미',
          desc: '코끝을 스치는 숨결의 시원함과 따뜻함을 판단 없이 1분간 관찰합니다.',
          icon: 'self_improvement'
        },
        {
          title: '2단계: 좋은 글귀나 책 한 구절 읽기',
          desc: '마음에 깊은 울림을 주는 문장 하나를 골라 천천히 곱씹어봅니다.',
          icon: 'menu_book'
        },
        {
          title: '3단계: 차분한 경청자 되기',
          desc: '친구나 가족의 말에 끼어들지 않고 온전한 집중으로 고개를 끄덕여줍니다.',
          icon: 'hearing'
        }
      ],
      teacherClassroomTip: '깊이 있는 독서, 글쓰기, 예술 활동에 가장 이상적인 타이밍이므로 차분한 몰입 환경을 조성해주세요.'
    };
  }

  // Zone B: High Pleasantness + Moderate Energy (감사/충만/다정함)
  if (x > 70) {
    return {
      zoneId: 'GREEN_GRATITUDE_WARMTH',
      zoneName: '충만한 감사 영역 (감사 · 다정함 · 만족감)',
      zoneTag: '💖 따뜻한 연결감 & 풍요로운 마음',
      intensityDesc: '주변 사람과 세상에 대한 고마움으로 가슴 한편이 훈훈하게 채워진 상태입니다.',
      neuroState: '옥시토신과 세로토닌이 풍부하게 분비되어 대인 관계 신뢰도와 사회적 공감 능력이 극대화되어 있습니다.',
      customWordHint: word ? `"${word}" 마음은 나뿐만 아니라 주변 모든 사람을 행복하게 만드는 마법입니다.` : '감사의 마음을 표현하면 행복이 두 배로 커집니다.',
      strategyTitle: 'RULER 감사 표현 & 따뜻한 나눔',
      strategySteps: [
        {
          title: '1단계: 3줄 감사 일기 남기기',
          desc: '오늘 나를 도와주었거나 기분 좋게 해준 3가지 순간을 구체적으로 적어봅니다.',
          icon: 'edit_heart'
        },
        {
          title: '2단계: 고마운 사람에게 쪽지 전하기',
          desc: '친구, 부모님, 선생님께 "고마워요"라는 한 줄 메시지나 포스트잇을 건넵니다.',
          icon: 'mail'
        }
      ],
      teacherClassroomTip: '학급 내 칭찬 릴레이나 감사 쪽지 나누기 활동을 연계하여 훈훈한 학급 문화를 만들어주세요.'
    };
  }

  // Zone C: Moderate Green (편안함/여유/차분함)
  return {
    zoneId: 'GREEN_COMFORTABLE_EASE',
    zoneName: '편안한 일상 영역 (편안함 · 여유 · 순조로움)',
    zoneTag: '🍃 순조로운 하루 & 여유로운 호흡',
    intensityDesc: '특별한 걱정 없이 일과를 안정적이고 편안하게 소화해내고 있는 쾌적한 상태입니다.',
    neuroState: '인지적 부하가 적어 계획을 세우거나 복습 및 정리 활동을 차근차근 진행하기에 좋습니다.',
    customWordHint: word ? `"${word}" 마음으로 하루를 보내는 것은 매우 소중한 행복입니다.` : '편안한 페이스를 유지하며 다음 계획을 차분히 이어가세요.',
    strategyTitle: 'RULER 차분한 일정 정리 & 기분 좋은 여유',
    strategySteps: [
      {
        title: '1단계: 하루 체크리스트 점검',
        desc: '오늘 남은 일정을 무리 없이 정돈하고 우선순위를 부드럽게 확인합니다.',
        icon: 'playlist_add_check'
      },
      {
        title: '2단계: 가벼운 기지개 켜기',
        desc: '두 팔을 위로 번쩍 들어 기지개를 켜며 몸의 쾌적함을 온몸으로 느껴봅니다.',
        icon: 'wb_sunny'
      }
    ],
    teacherClassroomTip: '꾸준한 학습 습관을 다지고 스스로 오늘 목표를 계획해보는 자기주도 활동을 독려해주세요.'
  };
}

export const QUADRANT_META: Record<QuadrantType, QuadrantMeta> = {
  RED: {
    type: 'RED',
    koreanName: '불안 · 분노',
    englishName: 'High Energy · Low Pleasantness',
    themeColor: '#ba1a1a',
    textColor: '#ba1a1a',
    bgClass: 'bg-[#ffdad6] text-[#93000a] border-red-200',
    borderClass: 'border-red-300',
    iconBgClass: 'bg-[#ba1a1a] text-white',
    pinColorClass: 'bg-[#ba1a1a]',
    icon: 'local_fire_department',
    energyText: '에너지 ↑',
    pleasantnessText: '유쾌 ↓',
    energyLevel: 'high',
    pleasantnessLevel: 'unpleasant',
    title: '불꽃 같은 마음 가라앉히기',
    desc: '지금 올라온 뜨거운 에너지를 천천히 호흡하며 차분하게 비워봐요.',
    careActivityTitle: '4-4-4 안정 상자 호흡 & 근육 이완',
    careActivityDesc: '천천히 숨을 들이마시고 내쉬며 몸에 들어간 힘을 풀어줍니다. 차분한 템포로 마음의 열기를 내려보세요.',
    breatheMode: true,
    words: ['화남', '짜증남', '불안함', '답답함', '억울함', '조마조마함', '초조함', '분노', '당황함', '긴장됨'],
    tips: [
      '잠시 자리를 벗어나 찬물을 한 잔 마셔보세요.',
      '눈을 감고 4초 들숨, 4초 멈춤, 4초 날숨을 3회 반복해보세요.',
      '지금 떠오르는 생각을 그대로 종이에 적어 비워보세요.'
    ]
  },
  YELLOW: {
    type: 'YELLOW',
    koreanName: '신남 · 열정',
    englishName: 'High Energy · High Pleasantness',
    themeColor: '#735c00',
    textColor: '#735c00',
    bgClass: 'bg-[#ffe086]/70 text-[#4e3e00] border-amber-200',
    borderClass: 'border-amber-300',
    iconBgClass: 'bg-[#cda721] text-white',
    pinColorClass: 'bg-[#cda721]',
    icon: 'bolt',
    energyText: '에너지 ↑',
    pleasantnessText: '유쾌 ↑',
    energyLevel: 'high',
    pleasantnessLevel: 'pleasant',
    title: '멋진 에너지 나누기',
    desc: '신나고 기쁜 마음을 오늘 공부와 친구 칭찬에 가득 담아보세요!',
    careActivityTitle: '긍정 에너지 나누기 & 아이디어 기록',
    careActivityDesc: '밝고 솟구치는 활력을 새로운 도전이나 소중한 사람들과의 따뜻한 대화에 연결해 보세요.',
    breatheMode: false,
    words: ['신남', '기쁨', '설렘', '자신감', '유쾌함', '호기심', '열정적', '뿌듯함', '의욕적', '행복함'],
    tips: [
      '오늘 꼭 해보고 싶었던 멋진 목표 하나를 시작해보세요.',
      '주변 사람에게 감사하거나 기분 좋은 칭찬 한마디를 건네보세요.',
      '번뜩이는 아이디어를 메모 앱이나 다이어리에 기록해보세요.'
    ]
  },
  BLUE: {
    type: 'BLUE',
    koreanName: '피로 · 슬픔',
    englishName: 'Low Energy · Low Pleasantness',
    themeColor: '#005596',
    textColor: '#005596',
    bgClass: 'bg-[#dce9ff] text-[#0b1c30] border-blue-200',
    borderClass: 'border-blue-300',
    iconBgClass: 'bg-[#4648d4] text-white',
    pinColorClass: 'bg-[#4648d4]',
    icon: 'water_drop',
    energyText: '에너지 ↓',
    pleasantnessText: '유쾌 ↓',
    energyLevel: 'low',
    pleasantnessLevel: 'unpleasant',
    title: '따뜻한 햇살 충전하기',
    desc: '마음이 지치고 슬플 땐 잠시 어깨를 펴고 따뜻한 온기를 느껴봐요.',
    careActivityTitle: '따뜻한 티타임 & 부드러운 스트레칭',
    careActivityDesc: '지친 자신을 스스로 다독여주는 시간입니다. 무리하지 않고 천천히 몸을 쉬어가세요.',
    breatheMode: false,
    words: ['피곤함', '슬픔', '외로움', '속상함', '귀찮음', '서운함', '지침', '무기력', '우울함', '공허함'],
    tips: [
      '따뜻한 차나 물을 천천히 음미하며 마셔보세요.',
      '조용한 음악을 틀고 어깨와 목을 부드럽게 돌려보세요.',
      '"오늘은 이만큼도 충분히 잘했어"라고 스스로에게 말해주세요.'
    ]
  },
  GREEN: {
    type: 'GREEN',
    koreanName: '편안 · 차분',
    englishName: 'Low Energy · High Pleasantness',
    themeColor: '#006c4b',
    textColor: '#006c4b',
    bgClass: 'bg-[#64f9bc]/40 text-[#005137] border-emerald-200',
    borderClass: 'border-emerald-300',
    iconBgClass: 'bg-[#006c4b] text-white',
    pinColorClass: 'bg-[#006c4b]',
    icon: 'eco',
    energyText: '에너지 ↓',
    pleasantnessText: '유쾌 ↑',
    energyLevel: 'low',
    pleasantnessLevel: 'pleasant',
    title: '평온한 마음 지켜가기',
    desc: '지금의 편안하고 감사한 기분을 소중하게 간직해 보세요.',
    careActivityTitle: '마음 챙김 명상 & 감사 한 줄 쓰기',
    careActivityDesc: '잔잔하고 온화한 감정의 파도를 음미하며 오늘 감사했던 작은 순간 하나를 남겨보세요.',
    breatheMode: false,
    words: ['편안함', '차분함', '고마움', '아늑함', '만족스러움', '다정함', '평온함', '안도감', '여유로움', '감사함'],
    tips: [
      '지금 이 순간 느껴지는 소리와 숨결에 집중해 보세요.',
      '오늘 나를 미소 짓게 만든 작은 순간을 떠올려보세요.',
      '좋아하는 책의 한 구절을 읽거나 편안한 자세로 휴식하세요.'
    ]
  }
};

export const PRESET_EXPRESSIONS = [
  {
    id: 'happy',
    label: '환한 미소 😊',
    subtitle: '기쁨과 활력 가득',
    quadrant: 'YELLOW' as QuadrantType,
    x: 78,
    y: 25,
    word: '신남',
    aiComment: '환한 미소에서 반짝이는 활기와 즐거움이 느껴져요! 오늘 멋진 하루를 만들어가기에 최고의 에너지입니다.',
    avatarEmoji: '😄'
  },
  {
    id: 'calm',
    label: '온화한 미소 🌿',
    subtitle: '안정과 평온함',
    quadrant: 'GREEN' as QuadrantType,
    x: 75,
    y: 75,
    word: '편안함',
    aiComment: '표정에서 깊은 안정감과 부드러운 평온함이 전해져요. 마음에 잔잔한 여유가 깃들어 있네요.',
    avatarEmoji: '😌'
  },
  {
    id: 'stressed',
    label: '긴장/불안 ⚡',
    subtitle: '높은 긴장과 압박',
    quadrant: 'RED' as QuadrantType,
    x: 22,
    y: 28,
    word: '불안함',
    aiComment: '눈가와 미간의 긴장감에서 불꽃처럼 솟아오른 스트레스와 부담감이 감지됩니다. 잠시 호흡으로 열기를 식혀볼까요?',
    avatarEmoji: '😣'
  },
  {
    id: 'tired',
    label: '피로/지침 🌙',
    subtitle: '휴식이 필요한 상태',
    quadrant: 'BLUE' as QuadrantType,
    x: 28,
    y: 78,
    word: '피곤함',
    aiComment: '지친 눈빛과 내려앉은 어깨에서 피로감이 느껴져요. 오늘 열심히 달려온 나에게 따뜻한 쉼을 선물해주세요.',
    avatarEmoji: '😔'
  }
];

export const RULER_INFO = {
  title: 'RULER 감정 지능 프레임워크란?',
  institute: 'Yale Center for Emotional Intelligence',
  description: 'RULER는 예일대학교 감정지능센터에서 개발한 과학적 감정 학습 모델입니다. 자신의 감정을 인지하고(Recognizing), 원인을 이해하며(Understanding), 이름을 붙이고(Labeling), 적절히 표현하며(Expressing), 현명하게 조절하는(Regulating) 5단계를 실천합니다.',
  quadrantsExplanation: [
    { title: 'RED (불안·분노)', desc: '높은 에너지 + 낮은 유쾌도: 위기 대처와 집중력에 유용하지만 오래 지속되면 소모적입니다.' },
    { title: 'YELLOW (신남·열정)', desc: '높은 에너지 + 높은 유쾌도: 창의적 발상, 협동, 동기부여와 도전에 최적입니다.' },
    { title: 'BLUE (피로·슬픔)', desc: '낮은 에너지 + 낮은 유쾌도: 자기 성찰, 공감, 휴식의 신호로 마음을 돌볼 때입니다.' },
    { title: 'GREEN (편안·차분)', desc: '낮은 에너지 + 높은 유쾌도: 명료한 판단, 경청, 평화로운 관계 유지에 좋습니다.' }
  ]
};
