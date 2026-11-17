import React from 'react';
import { RULER_INFO } from '../data/rulerData';
import { soundFx } from '../utils/audio';

interface RulerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulerGuideModal: React.FC<RulerGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const rulerSteps = [
    { id: 'recognizing', letter: 'R', title: 'Recognizing (인식)', desc: '자신과 타인의 신체 신호, 표정, 음성 톤에서 감정을 알아차립니다.' },
    { id: 'understanding', letter: 'U', title: 'Understanding (이해)', desc: '감정이 왜 일어났는지 원인과 맥락을 파악합니다.' },
    { id: 'labeling', letter: 'L', title: 'Labeling (라벨링)', desc: '정확하고 미세한 감정 어휘(예: 단순한 화남 대신 "억울함", "조마조마함")로 명명합니다.' },
    { id: 'expressing', letter: 'E', title: 'Expressing (표현)', desc: '자신의 감정을 상황에 맞게 건강하고 정직하게 표현합니다.' },
    { id: 'regulating', letter: 'R', title: 'Regulating (조절)', desc: '상황과 목표에 맞는 호흡, 관점 전환, 자기돌봄 전략을 적용합니다.' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-xl border border-slate-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">school</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">RULER 감정 가이드</h3>
              <span className="text-[10px] text-slate-500 font-mono">YALE CENTER FOR EMOTIONAL INTELLIGENCE</span>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playTap();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1 text-xs text-slate-700">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <h4 className="font-bold text-xs text-indigo-700 mb-1">{RULER_INFO.institute}</h4>
            <p className="leading-relaxed text-[11px] text-slate-600">{RULER_INFO.description}</p>
          </div>

          {/* 5 RULER Steps */}
          <div>
            <h5 className="font-bold text-xs text-slate-900 mb-1.5 flex items-center gap-1 uppercase tracking-wider text-[11px]">
              <span className="material-symbols-outlined text-[15px] text-indigo-600">checklist</span>
              RULER 5대 감정 역량
            </h5>
            <div className="space-y-1">
              {rulerSteps.map((step) => (
                <div key={step.id} className="flex gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="w-5 h-5 bg-slate-900 text-white font-mono font-bold rounded flex items-center justify-center text-[10px] shrink-0">
                    {step.letter}
                  </span>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{step.title}</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Quadrants Summary */}
          <div>
            <h5 className="font-bold text-xs text-slate-900 mb-1.5 flex items-center gap-1 uppercase tracking-wider text-[11px]">
              <span className="material-symbols-outlined text-[15px] text-indigo-600">grid_view</span>
              4분면의 의미와 활용
            </h5>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="p-2 bg-rose-50 text-rose-950 rounded-lg font-medium border border-rose-200">
                <div className="font-bold mb-0.5 font-mono">RED (불안·분노)</div>
                <div>에너지↑ 유쾌↓: 호흡과 그라운딩으로 안정화</div>
              </div>
              <div className="p-2 bg-amber-50 text-amber-950 rounded-lg font-medium border border-amber-200">
                <div className="font-bold mb-0.5 font-mono">YELLOW (신남·열정)</div>
                <div>에너지↑ 유쾌↑: 창의성, 리더십, 도전과 협력</div>
              </div>
              <div className="p-2 bg-sky-50 text-sky-950 rounded-lg font-medium border border-sky-200">
                <div className="font-bold mb-0.5 font-mono">BLUE (피로·슬픔)</div>
                <div>에너지↓ 유쾌↓: 깊은 성찰, 휴식과 치유 필요</div>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-950 rounded-lg font-medium border border-emerald-200">
                <div className="font-bold mb-0.5 font-mono">GREEN (편안·차분)</div>
                <div>에너지↓ 유쾌↑: 이성적 판단, 경청, 평화로운 교감</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => {
              soundFx.playTap();
              onClose();
            }}
            className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 cursor-pointer shadow-xs"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
