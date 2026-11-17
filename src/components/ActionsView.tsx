import React, { useState, useEffect } from 'react';
import { QuadrantType, MoodLogEntry, StudentAccount, UserProfile } from '../types';
import { QUADRANT_META, getDetailedSubZoneFeedback } from '../data/rulerData';
import { soundFx } from '../utils/audio';

interface ActionsViewProps {
  quadrant: QuadrantType;
  x: number;
  y: number;
  aiComment: string;
  photoUrl: string | null;
  currentStudent: StudentAccount | null;
  currentUser: UserProfile | null;
  onRestart: () => void;
  onSaveToJournal: (entry: MoodLogEntry) => void;
}

export const ActionsView: React.FC<ActionsViewProps> = ({
  quadrant,
  x,
  y,
  aiComment,
  photoUrl,
  currentStudent,
  currentUser,
  onRestart,
  onSaveToJournal
}) => {
  const currentMeta = QUADRANT_META[quadrant];
  const [selectedWord, setSelectedWord] = useState<string>(currentMeta.words[0] || '기쁨');
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [isAddingWord, setIsAddingWord] = useState<boolean>(false);
  const [newWordInput, setNewWordInput] = useState<string>('');
  const [reflectionNote, setReflectionNote] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Sub-quadrant fine-grained feedback
  const subZoneFeedback = getDetailedSubZoneFeedback(quadrant, x, y, selectedWord);

  // Breathing state
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [breathSecondsLeft, setBreathSecondsLeft] = useState<number>(4);
  const [breathCycleCount, setBreathCycleCount] = useState<number>(0);

  // Sync selected word when quadrant changes
  useEffect(() => {
    setSelectedWord(currentMeta.words[0] || '');
    setIsSaved(false);
  }, [quadrant, currentMeta.words]);

  // Breathing timer loop
  useEffect(() => {
    if (!isBreathingActive) return;

    const timer = setInterval(() => {
      setBreathSecondsLeft((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Phase transitions (4-4-4-4 box breathing)
        if (breathPhase === 'inhale') {
          soundFx.playChime(660);
          setBreathPhase('hold');
          return 4;
        } else if (breathPhase === 'hold') {
          soundFx.playChime(528);
          setBreathPhase('exhale');
          return 4;
        } else if (breathPhase === 'exhale') {
          soundFx.playChime(440);
          setBreathPhase('rest');
          return 4;
        } else {
          soundFx.playChime(528);
          setBreathPhase('inhale');
          setBreathCycleCount((c) => c + 1);
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBreathingActive, breathPhase]);

  const handleAddCustomWord = () => {
    if (newWordInput.trim()) {
      const clean = newWordInput.trim().replace(/^#/, '');
      if (!customWords.includes(clean) && !currentMeta.words.includes(clean)) {
        setCustomWords((prev) => [...prev, clean]);
        setSelectedWord(clean);
      }
      setNewWordInput('');
      setIsAddingWord(false);
      soundFx.playTap();
    }
  };

  const handleSave = () => {
    soundFx.playTap();
    const entry: MoodLogEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      quadrant,
      selectedWord,
      x,
      y,
      pleasantness: x,
      energy: 100 - y,
      aiComment,
      reflectionNote: reflectionNote.trim() || undefined,
      photoUrl: photoUrl || undefined,
      studentId: currentStudent?.id || currentUser?.studentId || currentUser?.uid,
      studentName: currentStudent?.name || currentUser?.displayName || '학생',
      studentCode: currentStudent?.studentCode || 'STU-LOCAL',
      grade: currentStudent?.grade,
      classRoom: currentStudent?.classRoom,
      studentNumber: currentStudent?.studentNumber,
      teacherUid: currentStudent?.teacherUid,
      userUid: currentUser?.uid,
      userEmail: currentUser?.email || undefined
    };
    onSaveToJournal(entry);
    setIsSaved(true);
  };

  const getBreathPhaseKorean = () => {
    switch (breathPhase) {
      case 'inhale':
        return '들이쉬고 (Inhale)...';
      case 'hold':
        return '잠시 멈추고 (Hold)...';
      case 'exhale':
        return '천천히 내쉬고 (Exhale)...';
      case 'rest':
        return '편안하게 쉬고 (Rest)...';
    }
  };

  const allWords = [...currentMeta.words, ...customWords];

  return (
    <section id="viewActions" className="flex-1 flex flex-col justify-between py-1 pb-4">
      <div className="space-y-3">
        {/* High Density Status Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${currentMeta.pinColorClass}`} />
            <span className="font-bold text-slate-900 tracking-tight">
              EMOTIONAL LABELING & CARE ({quadrant})
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            STEP 4/4
          </span>
        </div>

        {/* Current Student Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
              {currentStudent ? currentStudent.name.slice(0, 1) : '학'}
            </div>
            <div>
              <span className="font-bold text-slate-900">
                {currentStudent
                  ? `${currentStudent.name} 학생 (${currentStudent.grade} ${currentStudent.classRoom} ${currentStudent.studentNumber})`
                  : currentUser?.displayName
                  ? `${currentUser.displayName} 학생`
                  : '학생 (게스트 모드)'}
              </span>
              <span className="text-[10px] text-slate-500 ml-1.5 font-mono">
                {currentStudent ? currentStudent.studentCode : '누적 기록 중'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded">
            개별 감정일기 누적
          </span>
        </div>

        {/* Title Header with Sub-Quadrant Zone Badge */}
        <div className="text-center my-0.5 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-800">
            <span>{subZoneFeedback.zoneTag}</span>
            <span className="text-slate-400">•</span>
            <span className="text-indigo-600 font-semibold">{subZoneFeedback.zoneName}</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            내 감정에 가장 알맞은 단어 선택
          </h3>
          <p className="text-xs text-slate-500">
            정확한 감정 라벨링은 정서 조절과 회복탄력성의 첫걸음입니다
          </p>
        </div>

        {/* Emotion Word Chips */}
        <div id="wordChipsContainer" className="flex flex-wrap gap-1.5 justify-center py-1">
          {allWords.map((word, idx) => {
            const isSelected = selectedWord === word;
            return (
              <button
                key={`${word}-${idx}`}
                type="button"
                onClick={() => {
                  soundFx.playTap();
                  setSelectedWord(word);
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? `${currentMeta.bgClass} ${currentMeta.textColor} ${currentMeta.borderClass} font-bold shadow-xs scale-105`
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                #{word}
              </button>
            );
          })}

          {/* Add custom emotion word */}
          {isAddingWord ? (
            <div className="flex items-center gap-1 bg-white border border-indigo-400 rounded-lg px-2 py-1">
              <span className="text-xs text-indigo-600 font-bold">#</span>
              <input
                type="text"
                autoFocus
                value={newWordInput}
                onChange={(e) => setNewWordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCustomWord();
                  if (e.key === 'Escape') setIsAddingWord(false);
                }}
                placeholder="직접 입력"
                className="w-16 text-xs text-slate-900 outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={handleAddCustomWord}
                className="text-[10px] bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded"
              >
                확인
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                soundFx.playTap();
                setIsAddingWord(true);
              }}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              단어 추가
            </button>
          )}
        </div>

        {/* Precise Fine-grained 4-Quadrant Psychological Analysis */}
        <div className="bg-slate-900 text-white rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-amber-400">psychology</span>
              <span className="text-xs font-bold text-slate-100">
                4분면 세분화 정밀 심리 분석
              </span>
            </div>
            <span className="text-[10px] font-mono bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded border border-slate-700">
              쾌적도 {x}% · 에너지 {100 - y}%
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {subZoneFeedback.customWordHint}
          </p>

          <div className="text-[11px] text-slate-400 bg-slate-800/80 p-2 rounded-lg border border-slate-700/80 space-y-1">
            <div className="text-slate-300 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-indigo-400">vital_signs</span>
              신체 및 신경 상태 진단
            </div>
            <div className="leading-snug text-slate-300">{subZoneFeedback.intensityDesc}</div>
            <div className="text-[10px] text-slate-400 pt-0.5">{subZoneFeedback.neuroState}</div>
          </div>
        </div>

        {/* Action Suggestion & Interactive Care Guide (Fine-tuned to Sub-Zone) */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg ${currentMeta.iconBgClass} flex items-center justify-center shrink-0 border ${currentMeta.borderClass}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {currentMeta.icon}
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                {subZoneFeedback.strategyTitle}
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                {currentMeta.careActivityDesc}
              </p>
            </div>
          </div>

          {/* Actionable Multi-step Strategies */}
          <div className="space-y-1.5 pt-0.5">
            {subZoneFeedback.strategySteps.map((step, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200/80 p-2 rounded-lg flex items-start gap-2 text-xs">
                <span className="material-symbols-outlined text-[16px] text-indigo-600 shrink-0 mt-0.5">
                  {step.icon}
                </span>
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">{step.title}</div>
                  <div className="text-[11px] text-slate-600 leading-relaxed">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Breathing Module */}
          <div id="breatheModule" className="w-full mt-3 pt-2.5 border-t border-slate-200/70 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-2 px-1">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-indigo-600">air</span>
                4-4-4 안심 상자 호흡
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFx.playTap();
                  if (!isBreathingActive) {
                    soundFx.playChime(528);
                  }
                  setIsBreathingActive(!isBreathingActive);
                }}
                className={`text-xs font-bold px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  isBreathingActive
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-900 text-white shadow-xs'
                }`}
              >
                {isBreathingActive ? '일시정지' : '호흡 시작'}
              </button>
            </div>

            {/* Breathing Visual Orb */}
            <div className="relative my-1 flex flex-col items-center">
              <div
                className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 border-white shadow-xs transition-all duration-1000 ${
                  quadrant === 'RED'
                    ? 'bg-rose-200 text-rose-950'
                    : quadrant === 'YELLOW'
                    ? 'bg-amber-200 text-amber-950'
                    : quadrant === 'BLUE'
                    ? 'bg-sky-200 text-sky-950'
                    : 'bg-emerald-200 text-emerald-950'
                } ${
                  isBreathingActive
                    ? breathPhase === 'inhale'
                      ? 'scale-120 duration-4000 shadow-md'
                      : breathPhase === 'hold'
                      ? 'scale-120'
                      : breathPhase === 'exhale'
                      ? 'scale-90 duration-4000'
                      : 'scale-95'
                    : 'scale-100'
                }`}
              >
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  {isBreathingActive ? `${breathSecondsLeft}s` : 'BREATHE'}
                </span>
                <span className="text-[10px] font-medium opacity-80">
                  {isBreathingActive ? breathPhase : '터치 시작'}
                </span>
              </div>

              <span className="text-xs font-medium text-slate-700 mt-1.5">
                {isBreathingActive ? getBreathPhaseKorean() : '들이쉬고... 내쉬고... 편안하게'}
              </span>
              {breathCycleCount > 0 && (
                <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                  CYCLES COMPLETED: {breathCycleCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Reflection Note Input */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 shadow-2xs">
          <label className="text-xs font-bold text-slate-900 block mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-indigo-600">edit_note</span>
            오늘 마음에 남기고 싶은 한 줄 감정 일기
          </label>
          <input
            type="text"
            value={reflectionNote}
            onChange={(e) => setReflectionNote(e.target.value)}
            placeholder="예: 프로젝트를 끝내서 뿌듯하다, 충분히 쉬어가기"
            className="w-full bg-white text-slate-900 text-xs rounded-lg px-3 py-2 border border-slate-200 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="space-y-1.5 mt-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaved}
          className={`w-full font-semibold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            isSaved
              ? 'bg-emerald-600 text-white cursor-default'
              : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-[0.99]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isSaved ? 'check_circle' : 'bookmark_add'}
          </span>
          {isSaved ? '감정 일기에 누적 기록되었습니다' : '감정 일기에 기록하기'}
        </button>

        <button
          id="btnRestart"
          type="button"
          onClick={() => {
            soundFx.playTap();
            onRestart();
          }}
          className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 rounded-xl border border-slate-200 transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <span className="material-symbols-outlined text-[16px]">replay</span>
          새로운 표정 측정하기
        </button>
      </div>
    </section>
  );
};
