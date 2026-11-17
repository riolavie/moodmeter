import React, { useRef, useCallback } from 'react';
import { QuadrantType } from '../types';
import { QUADRANT_META, getDetailedSubZoneFeedback } from '../data/rulerData';
import { soundFx } from '../utils/audio';

interface MoodMeterGridProps {
  x: number; // 0 to 100 (pleasantness)
  y: number; // 0 to 100 (energy)
  quadrant: QuadrantType;
  aiComment: string;
  expressionName?: string | null;
  initialAiCoords?: { x: number; y: number; quadrant: QuadrantType; expressionName?: string } | null;
  onUpdateCoords: (x: number, y: number) => void;
  onConfirm: () => void;
}

export const MoodMeterGrid: React.FC<MoodMeterGridProps> = ({
  x,
  y,
  quadrant,
  aiComment,
  expressionName,
  initialAiCoords,
  onUpdateCoords,
  onConfirm
}) => {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const currentMeta = QUADRANT_META[quadrant];
  const subZone = getDetailedSubZoneFeedback(quadrant, x, y);

  // Update pin position based on client interaction coordinates
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    soundFx.playTap();
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();

    const updateFromEvent = (clientX: number, clientY: number) => {
      const rawX = ((clientX - rect.left) / rect.width) * 100;
      const rawY = ((clientY - rect.top) / rect.height) * 100;
      const clampedX = Math.min(Math.max(rawX, 8), 92);
      const clampedY = Math.min(Math.max(rawY, 8), 92);
      onUpdateCoords(clampedX, clampedY);
    };

    updateFromEvent(e.clientX, e.clientY);

    const onPointerMove = (ev: PointerEvent) => {
      updateFromEvent(ev.clientX, ev.clientY);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Stepper Fine-tuning (Nudge)
  const nudge = (deltaX: number, deltaY: number) => {
    soundFx.playTap();
    const newX = Math.min(Math.max(x + deltaX, 8), 92);
    const newY = Math.min(Math.max(y + deltaY, 8), 92);
    onUpdateCoords(newX, newY);
  };

  // Quadrant Centroid Quick Snap
  const snapToQuadrant = (targetQuad: QuadrantType) => {
    soundFx.playTap();
    if (targetQuad === 'RED') onUpdateCoords(28, 28);
    else if (targetQuad === 'YELLOW') onUpdateCoords(72, 28);
    else if (targetQuad === 'BLUE') onUpdateCoords(28, 72);
    else if (targetQuad === 'GREEN') onUpdateCoords(72, 72);
  };

  // Reset to initial AI detected position
  const handleResetToAi = () => {
    if (initialAiCoords) {
      soundFx.playSave();
      onUpdateCoords(initialAiCoords.x, initialAiCoords.y);
    }
  };

  const getAxisDescription = useCallback(() => {
    const energyLabel = y < 50 ? '고에너지' : '저에너지';
    const pleasantLabel = x >= 50 ? '고유쾌' : '저유쾌(불쾌)';
    return `${energyLabel} · ${pleasantLabel}`;
  }, [x, y]);

  // Is pin adjusted away from AI initial recommendation?
  const hasAdjustedFromAi =
    initialAiCoords &&
    (Math.abs(initialAiCoords.x - x) > 3 || Math.abs(initialAiCoords.y - y) > 3);

  return (
    <section id="viewMoodMeter" className="flex-1 flex flex-col justify-between py-1 space-y-2">
      {/* High Density Telemetry Header */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${currentMeta.pinColorClass}`} />
            <span className="font-bold text-slate-900 tracking-tight">
              {currentMeta.koreanName} ({quadrant})
            </span>
            {expressionName && (
              <span className="hidden sm:inline-block text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium border border-indigo-100">
                표정: {expressionName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              유쾌: {Math.round(x)}% | 에너지: {Math.round(100 - y)}%
            </span>
          </div>
        </div>

        {/* Title & Guidance */}
        <div className="text-center my-1.5">
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 mb-1">
            <span className="material-symbols-outlined text-[14px]">touch_app</span>
            AI 표정 분석 완료 · 핀을 직접 드래그하여 미세 조정하세요
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            RULER 2D 감정 4분면
          </h3>
        </div>

        {/* Axis Labels & Grid Container */}
        <div className="relative mt-1">
          {/* Top Axis Label */}
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-1">
            <span>불쾌 (Low Pleasant)</span>
            <span className="text-indigo-600 font-mono flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]">arrow_upward</span>
              HIGH ENERGY (에너지 고)
            </span>
            <span>유쾌 (High Pleasant)</span>
          </div>

          {/* Quadrant Grid 2x2 */}
          <div
            ref={gridRef}
            id="moodGrid"
            onPointerDown={handlePointerDown}
            className="w-full aspect-square grid grid-cols-2 grid-rows-2 rounded-2xl overflow-hidden border border-slate-300 shadow-sm relative cursor-crosshair gap-1.5 bg-slate-200 p-1.5 select-none touch-none"
          >
            {/* Top-Left: RED (High Energy, Low Pleasantness) */}
            <div
              className={`p-3 flex flex-col justify-between rounded-xl bg-rose-100/90 text-rose-950 transition-all ${
                quadrant === 'RED' ? 'ring-2 ring-rose-600 shadow-sm bg-rose-100' : 'opacity-85'
              }`}
            >
              <div className="flex justify-between items-center text-[11px] font-bold tracking-wider">
                <span className="bg-rose-200/80 px-1.5 py-0.5 rounded text-[10px]">RED</span>
                <span className="material-symbols-outlined text-[16px] text-rose-700">local_fire_department</span>
              </div>
              <div className="text-center font-bold text-sm sm:text-base leading-tight text-rose-950">불안 · 분노</div>
              <div className="text-[10px] font-medium text-rose-800 text-center font-mono">고에너지 · 불쾌</div>
            </div>

            {/* Top-Right: YELLOW (High Energy, High Pleasantness) */}
            <div
              className={`p-3 flex flex-col justify-between rounded-xl bg-amber-100/90 text-amber-950 transition-all ${
                quadrant === 'YELLOW' ? 'ring-2 ring-amber-600 shadow-sm bg-amber-100' : 'opacity-85'
              }`}
            >
              <div className="flex justify-between items-center text-[11px] font-bold tracking-wider">
                <span className="bg-amber-200/80 px-1.5 py-0.5 rounded text-[10px]">YELLOW</span>
                <span className="material-symbols-outlined text-[16px] text-amber-700">bolt</span>
              </div>
              <div className="text-center font-bold text-sm sm:text-base leading-tight text-amber-950">신남 · 열정</div>
              <div className="text-[10px] font-medium text-amber-800 text-center font-mono">고에너지 · 유쾌</div>
            </div>

            {/* Bottom-Left: BLUE (Low Energy, Low Pleasantness) */}
            <div
              className={`p-3 flex flex-col justify-between rounded-xl bg-sky-100/90 text-sky-950 transition-all ${
                quadrant === 'BLUE' ? 'ring-2 ring-sky-600 shadow-sm bg-sky-100' : 'opacity-85'
              }`}
            >
              <div className="flex justify-between items-center text-[11px] font-bold tracking-wider">
                <span className="bg-sky-200/80 px-1.5 py-0.5 rounded text-[10px]">BLUE</span>
                <span className="material-symbols-outlined text-[16px] text-sky-700">water_drop</span>
              </div>
              <div className="text-center font-bold text-sm sm:text-base leading-tight text-sky-950">피로 · 슬픔</div>
              <div className="text-[10px] font-medium text-sky-800 text-center font-mono">저에너지 · 불쾌</div>
            </div>

            {/* Bottom-Right: GREEN (Low Energy, High Pleasantness) */}
            <div
              className={`p-3 flex flex-col justify-between rounded-xl bg-emerald-100/90 text-emerald-950 transition-all ${
                quadrant === 'GREEN' ? 'ring-2 ring-emerald-600 shadow-sm bg-emerald-100' : 'opacity-85'
              }`}
            >
              <div className="flex justify-between items-center text-[11px] font-bold tracking-wider">
                <span className="bg-emerald-200/80 px-1.5 py-0.5 rounded text-[10px]">GREEN</span>
                <span className="material-symbols-outlined text-[16px] text-emerald-700">eco</span>
              </div>
              <div className="text-center font-bold text-sm sm:text-base leading-tight text-emerald-950">편안 · 차분</div>
              <div className="text-[10px] font-medium text-emerald-800 text-center font-mono">저에너지 · 유쾌</div>
            </div>

            {/* Ghost Initial AI reticle if moved */}
            {hasAdjustedFromAi && initialAiCoords && (
              <div
                style={{ left: `${initialAiCoords.x}%`, top: `${initialAiCoords.y}%` }}
                className="absolute w-7 h-7 border-2 border-dashed border-indigo-600/70 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 animate-pulse"
                title="AI 최초 감지 위치"
              >
                <span className="text-[9px] font-bold text-indigo-800 bg-white/90 px-1 rounded shadow-2xs">
                  AI
                </span>
              </div>
            )}

            {/* Draggable Active Mood Pin Reticle */}
            <div
              id="moodPin"
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute w-8 h-8 bg-white border-2 border-slate-900 rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform active:scale-125 pointer-events-none z-20"
            >
              <div
                id="pinInner"
                className={`w-4 h-4 rounded-full transition-colors ${currentMeta.pinColorClass} shadow-inner animate-pulse`}
              />
            </div>
          </div>

          {/* Bottom Axis Label */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 mt-1 font-mono">
            <span>RULER 2D GRID</span>
            <span className="font-semibold text-indigo-700">{getAxisDescription()}</span>
            <span className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]">arrow_downward</span>
              LOW ENERGY (에너지 저)
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Zone Realtime Psychological State Telemetry */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <span className="material-symbols-outlined text-[16px] text-indigo-600">psychology</span>
            <span>{subZone.zoneName}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            {subZone.zoneTag}
          </span>
        </div>
        <p className="text-[11px] text-slate-600 mt-1 leading-snug">
          {subZone.intensityDesc}
        </p>
      </div>

      {/* Fine-Tuning Controls (D-Pad & Quadrant Snappers) */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1 text-[11px]">
            <span className="material-symbols-outlined text-[15px] text-indigo-600">tune</span>
            좌표 미세 조절 (Step Nudge)
          </span>
          {initialAiCoords && hasAdjustedFromAi && (
            <button
              type="button"
              onClick={handleResetToAi}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 cursor-pointer bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[13px]">restart_alt</span>
              AI 최초 위치 복원
            </button>
          )}
        </div>

        {/* 4-Way Stepper Buttons Grid */}
        <div className="grid grid-cols-3 gap-1.5 text-xs font-medium">
          <div />
          <button
            type="button"
            onClick={() => nudge(0, -6)}
            className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 py-1.5 rounded-lg border border-slate-200 cursor-pointer text-[11px]"
            title="에너지를 더 높입니다"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
            에너지 ↑
          </button>
          <div />

          <button
            type="button"
            onClick={() => nudge(-6, 0)}
            className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 py-1.5 rounded-lg border border-slate-200 cursor-pointer text-[11px]"
            title="유쾌도를 낮춥니다 (더 불쾌/슬픔)"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            불쾌 ←
          </button>
          <button
            type="button"
            onClick={() => {
              if (initialAiCoords) handleResetToAi();
              else snapToQuadrant(quadrant);
            }}
            className="flex items-center justify-center gap-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1.5 rounded-lg border border-indigo-200 cursor-pointer text-[11px] font-semibold"
          >
            <span className="material-symbols-outlined text-[13px]">center_focus_strong</span>
            중심 정렬
          </button>
          <button
            type="button"
            onClick={() => nudge(6, 0)}
            className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 py-1.5 rounded-lg border border-slate-200 cursor-pointer text-[11px]"
            title="유쾌도를 높입니다 (더 기쁨/편안)"
          >
            유쾌 →
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>

          <div />
          <button
            type="button"
            onClick={() => nudge(0, 6)}
            className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 py-1.5 rounded-lg border border-slate-200 cursor-pointer text-[11px]"
            title="에너지를 더 낮춥니다"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
            에너지 ↓
          </button>
          <div />
        </div>

        {/* 4 Quadrants Quick Jump Bar */}
        <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => snapToQuadrant('RED')}
            className={`py-1 px-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer text-center ${
              quadrant === 'RED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            🔴 불안·분노
          </button>
          <button
            type="button"
            onClick={() => snapToQuadrant('YELLOW')}
            className={`py-1 px-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer text-center ${
              quadrant === 'YELLOW'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            🟡 신남·열정
          </button>
          <button
            type="button"
            onClick={() => snapToQuadrant('BLUE')}
            className={`py-1 px-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer text-center ${
              quadrant === 'BLUE'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
            }`}
          >
            🔵 피로·슬픔
          </button>
          <button
            type="button"
            onClick={() => snapToQuadrant('GREEN')}
            className={`py-1 px-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer text-center ${
              quadrant === 'GREEN'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            🟢 편안·차분
          </button>
        </div>
      </div>

      {/* AI Insight Comment Card */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5 shadow-2xs">
        <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-indigo-600">auto_awesome</span>
          AI 감정 분석 브리핑
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-normal">
          {aiComment || currentMeta.desc}
        </p>
      </div>

      {/* Confirm Button */}
      <button
        id="btnConfirmMood"
        type="button"
        onClick={() => {
          soundFx.playTap();
          onConfirm();
        }}
        className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
      >
        <span className="material-symbols-outlined text-[18px]">check_circle</span>
        이 좌표로 감정 확정 및 케어 가이드 확인
      </button>
    </section>
  );
};
