import React, { useEffect, useState } from 'react';
import { QuadrantType } from '../types';
import { QUADRANT_META } from '../data/rulerData';

interface ScanningViewProps {
  photoUrl: string | null;
  isAnalyzing: boolean;
  analyzedQuadrant?: QuadrantType | null;
  expressionName?: string | null;
  onScanComplete: () => void;
}

export const ScanningView: React.FC<ScanningViewProps> = ({
  photoUrl,
  isAnalyzing,
  analyzedQuadrant,
  expressionName,
  onScanComplete
}) => {
  const [scanStep, setScanStep] = useState<number>(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState<boolean>(false);

  const steps = [
    '얼굴 윤곽 및 시각적 특징점 추출 중...',
    '눈매·미간 및 입꼬리 곡률 측정 중...',
    'RULER 2D 감정 지수(유쾌도/에너지) 산출 중...',
    '표정 정밀 분석 및 4분면 매핑 완료!'
  ];

  // Animate through first 3 steps
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setScanStep((prev) => {
        if (prev < 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1200);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(minTimer);
    };
  }, []);

  // When analysis is complete and minimum time elapsed, finish scan
  useEffect(() => {
    if (!isAnalyzing && minTimeElapsed) {
      setScanStep(3);
      const finishTimer = setTimeout(() => {
        onScanComplete();
      }, 700);
      return () => clearTimeout(finishTimer);
    }
  }, [isAnalyzing, minTimeElapsed, onScanComplete]);

  // Safety fallback timeout
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      onScanComplete();
    }, 6000);
    return () => clearTimeout(fallbackTimer);
  }, [onScanComplete]);

  const currentMeta = analyzedQuadrant ? QUADRANT_META[analyzedQuadrant] : null;

  return (
    <section id="viewScanning" className="flex-1 flex flex-col justify-between py-2">
      {/* High Density Diagnostic Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              scanStep === 3 ? 'bg-emerald-500' : 'bg-indigo-600 animate-ping'
            }`}
          />
          <span className="font-bold text-slate-900 tracking-tight">
            {scanStep === 3 ? 'ANALYSIS COMPLETE' : 'AI VISION DIAGNOSTIC'}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          PHASE {scanStep + 1}/4
        </div>
      </div>

      {/* Center Diagnostic Card */}
      <div className="flex flex-col items-center my-auto">
        <div className="relative w-60 h-60 bg-slate-900 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center mb-3 border border-slate-200">
          {photoUrl ? (
            <img src={photoUrl} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span
                className="material-symbols-outlined text-7xl text-slate-600 animate-pulse"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                face
              </span>
            </div>
          )}

          {/* Laser Scanner Line */}
          {scanStep < 3 && (
            <div className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_12px_#6366f1] scanner-line z-10" />
          )}

          {/* Biometric Grid Overlay Box */}
          <div className="absolute inset-3 border border-indigo-400/40 rounded-xl pointer-events-none flex flex-col justify-between p-2">
            <div className="flex justify-between">
              <div className="w-3 h-3 border-t-2 border-l-2 border-indigo-400" />
              <div className="w-3 h-3 border-t-2 border-r-2 border-indigo-400" />
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-indigo-300">
              <span>{scanStep === 3 ? 'MATCH_FOUND' : 'SCANNING...'}</span>
              <span>RULER_GRID</span>
            </div>
            <div className="flex justify-between">
              <div className="w-3 h-3 border-b-2 border-l-2 border-indigo-400" />
              <div className="w-3 h-3 border-b-2 border-r-2 border-indigo-400" />
            </div>
          </div>
        </div>

        {/* Title & Status */}
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          {scanStep === 3
            ? (expressionName ? `표정 인식: ${expressionName}` : '감정 분석 완료!')
            : '표정 속 감정 매핑 중...'}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 text-center">
          {scanStep === 3 && currentMeta
            ? `감정 4분면의 [${currentMeta.koreanName}] 영역에 초기 위치를 지정했습니다`
            : '눈매와 입꼬리의 미세 곡률을 다각도로 분석하고 있습니다'}
        </p>

        {/* Step checklist */}
        <div className="w-full mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
          {steps.map((stepText, idx) => {
            const isDone = scanStep > idx || scanStep === 3;
            const isCurrent = scanStep === idx && scanStep < 3;
            return (
              <div
                key={idx}
                className={`flex items-center gap-2 text-xs transition-colors ${
                  isCurrent
                    ? 'text-indigo-700 font-semibold'
                    : isDone
                    ? 'text-slate-700'
                    : 'text-slate-400'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isDone ? 'check_circle' : isCurrent ? 'hourglass_top' : 'radio_button_unchecked'}
                </span>
                <span>{stepText}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="text-center py-1">
        <span className="text-[11px] font-mono text-slate-400">
          RULER 4-QUADRANT AI VISION ENGINE ACTIVE
        </span>
      </div>
    </section>
  );
};
