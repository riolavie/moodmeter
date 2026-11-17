import React from 'react';
import { soundFx } from '../utils/audio';
import { StudentAccount, UserProfile } from '../types';

interface TopAppBarProps {
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onOpenHistory: () => void;
  onOpenTeacherPortal: () => void;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  currentUser: UserProfile | null;
  currentStudent: StudentAccount | null;
  historyCount: number;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onOpenSettings,
  onOpenGuide,
  onOpenHistory,
  onOpenTeacherPortal,
  onOpenAuthModal,
  onSignOut,
  currentUser,
  currentStudent,
  historyCount
}) => {
  const isTeacher = currentUser?.role === 'teacher';

  return (
    <header className="w-full top-0 bg-white/95 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 py-2.5 z-20 border-b border-slate-200 shadow-2xs">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            grid_view
          </span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-xs sm:text-sm tracking-tight text-slate-900">
              Mood Meter
            </h1>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
              RULER
            </span>
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:block leading-none">
            {currentStudent
              ? `${currentStudent.grade} ${currentStudent.classRoom} ${currentStudent.studentNumber} ${currentStudent.name}`
              : currentUser?.displayName || '감정일기 & AI 진단'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* User / Student Identity Tag */}
        <button
          type="button"
          onClick={() => {
            soundFx.playTap();
            onOpenAuthModal();
          }}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
            currentStudent
              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-2xs'
              : isTeacher
              ? 'bg-amber-50 border-amber-200 text-amber-950 shadow-2xs'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
          title="계정 정보 및 변경"
        >
          <span className="material-symbols-outlined text-[15px] text-indigo-600">
            {currentStudent ? 'face' : isTeacher ? 'school' : 'person'}
          </span>
          <span className="text-[11px] max-w-[70px] sm:max-w-[100px] truncate">
            {currentStudent
              ? currentStudent.name
              : currentUser?.displayName || '게스트'}
          </span>
        </button>

        {/* Teacher Portal Button (if teacher or available) */}
        {isTeacher && (
          <button
            id="btnTeacherPortal"
            type="button"
            onClick={() => {
              soundFx.playTap();
              onOpenTeacherPortal();
            }}
            title="교사용 포털 대시보드"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[14px]">dashboard</span>
            <span className="hidden sm:inline">포털</span>
          </button>
        )}

        {/* History / Log button */}
        <button
          id="btnHeaderHistory"
          onClick={() => {
            soundFx.playTap();
            onOpenHistory();
          }}
          title="감정 일기 기록 보기"
          className="relative text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors rounded-lg p-1.5 border border-slate-200 bg-white"
          aria-label="감정 일기 히스토리"
        >
          <span className="material-symbols-outlined text-[17px]">history_edu</span>
          {historyCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[15px] h-3.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-xs">
              {historyCount > 9 ? '9+' : historyCount}
            </span>
          )}
        </button>

        {/* RULER Guide button */}
        <button
          id="btnHeaderGuide"
          onClick={() => {
            soundFx.playTap();
            onOpenGuide();
          }}
          title="RULER 가이드"
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors rounded-lg p-1.5 border border-slate-200 bg-white"
          aria-label="RULER 프레임워크 가이드"
        >
          <span className="material-symbols-outlined text-[17px]">info</span>
        </button>

        {/* Settings button */}
        <button
          id="btnHeaderSettings"
          onClick={() => {
            soundFx.playTap();
            onOpenSettings();
          }}
          title="설정"
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors rounded-lg p-1.5 border border-slate-200 bg-white"
          aria-label="설정"
        >
          <span className="material-symbols-outlined text-[17px]">settings</span>
        </button>

        {/* Logout button */}
        <button
          id="btnHeaderLogout"
          onClick={() => {
            soundFx.playTap();
            onSignOut();
          }}
          title="로그아웃 & 첫 화면으로 이동"
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors rounded-lg p-1.5 border border-rose-200 bg-white cursor-pointer"
          aria-label="로그아웃"
        >
          <span className="material-symbols-outlined text-[17px]">logout</span>
        </button>
      </div>
    </header>
  );
};
