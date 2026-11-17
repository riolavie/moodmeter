import React from 'react';
import { soundFx } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  mirrorCamera: boolean;
  onToggleMirror: (mirror: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  mirrorCamera,
  onToggleMirror
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">settings</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">시스템 환경 설정</h3>
              <span className="text-[10px] text-slate-500 font-mono">SYSTEM PREFERENCES</span>
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

        {/* Setting Options */}
        <div className="my-3 space-y-2 text-xs text-slate-900">
          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-indigo-600 text-[18px]">
                {soundEnabled ? 'volume_up' : 'volume_off'}
              </span>
              <div>
                <div className="font-bold text-xs text-slate-900">효과음 및 차임벨 알림</div>
                <div className="text-[10px] text-slate-500">셔터 소리 및 호흡 주기 안내음</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => {
                  soundFx.setSoundEnabled(e.target.checked);
                  onToggleSound(e.target.checked);
                  if (e.target.checked) soundFx.playTap();
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>

          {/* Camera Mirroring Toggle */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-indigo-600 text-[18px]">flip</span>
              <div>
                <div className="font-bold text-xs text-slate-900">전면 카메라 좌우 반전 (거울 모드)</div>
                <div className="text-[10px] text-slate-500">거울을 보듯 자연스러운 실시간 미리보기</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mirrorCamera}
                onChange={(e) => {
                  soundFx.playTap();
                  onToggleMirror(e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>

          {/* Contact & Support Email */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-slate-700 space-y-1.5">
            <div className="font-bold text-indigo-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-indigo-600">mail</span>
                문의 및 지원 (Contact)
              </span>
              <a
                href="mailto:riolavie0516@naver.com"
                className="text-indigo-600 hover:text-indigo-800 underline font-medium text-[11px]"
              >
                메일 보내기
              </a>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-indigo-200/60 font-mono text-[11px]">
              <span className="material-symbols-outlined text-[13px] text-slate-400">alternate_email</span>
              <span className="font-semibold text-slate-800 select-all">riolavie0516@naver.com</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500">
              오류 제보, 기능 건의 및 교육용 라이선스 관련 문의는 위 이메일로 연락주세요.
            </p>
          </div>

          {/* App info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-indigo-600">info</span>
              Mood Meter v1.0 (High Density Edition)
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500">Yale Center for Emotional Intelligence의 RULER 정서 지능 이론을 바탕으로 제작되었습니다.</p>
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
            저장 후 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
