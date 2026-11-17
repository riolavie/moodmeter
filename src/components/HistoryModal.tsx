import React from 'react';
import { MoodLogEntry, StudentAccount } from '../types';
import { QUADRANT_META } from '../data/rulerData';
import { soundFx } from '../utils/audio';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: MoodLogEntry[];
  currentStudent: StudentAccount | null;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  entries,
  currentStudent,
  onClearHistory
}) => {
  if (!isOpen) return null;

  // Calculate statistics
  const total = entries.length;
  const counts = {
    RED: entries.filter((e) => e.quadrant === 'RED').length,
    YELLOW: entries.filter((e) => e.quadrant === 'YELLOW').length,
    BLUE: entries.filter((e) => e.quadrant === 'BLUE').length,
    GREEN: entries.filter((e) => e.quadrant === 'GREEN').length
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-xl border border-slate-200 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">history_edu</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {currentStudent ? `${currentStudent.name} 학생의 감정일기` : '나의 감정일기 기록'}
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                {currentStudent
                  ? `${currentStudent.grade} ${currentStudent.classRoom} ${currentStudent.studentNumber} (ID: ${currentStudent.studentCode})`
                  : 'EMOTIONAL LOG TELEMETRY'}
              </span>
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

        {/* Quadrant Distribution Stats */}
        {total > 0 && (
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex justify-between">
              <span>누적 감정 분포 비율</span>
              <span className="text-indigo-600 font-mono">총 {total}건 기록</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
              <div className="bg-rose-100 text-rose-950 p-1.5 rounded-lg font-bold border border-rose-200">
                <div className="text-[9px] font-mono">RED</div>
                <div className="text-xs font-mono">{Math.round((counts.RED / total) * 100)}%</div>
              </div>
              <div className="bg-amber-100 text-amber-950 p-1.5 rounded-lg font-bold border border-amber-200">
                <div className="text-[9px] font-mono">YELLOW</div>
                <div className="text-xs font-mono">{Math.round((counts.YELLOW / total) * 100)}%</div>
              </div>
              <div className="bg-sky-100 text-sky-950 p-1.5 rounded-lg font-bold border border-sky-200">
                <div className="text-[9px] font-mono">BLUE</div>
                <div className="text-xs font-mono">{Math.round((counts.BLUE / total) * 100)}%</div>
              </div>
              <div className="bg-emerald-100 text-emerald-950 p-1.5 rounded-lg font-bold border border-emerald-200">
                <div className="text-[9px] font-mono">GREEN</div>
                <div className="text-xs font-mono">{Math.round((counts.GREEN / total) * 100)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Entry List */}
        <div className="flex-1 overflow-y-auto my-3 space-y-2.5 pr-1">
          {entries.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-1.5 block">
                sentiment_neutral
              </span>
              <p className="text-xs font-medium text-slate-600">아직 누적된 감정일기 기록이 없습니다.</p>
              <p className="text-[11px] mt-0.5 text-slate-400">
                표정을 측정하거나 감정 분면을 선택하고 일기를 저장해보세요.
              </p>
            </div>
          ) : (
            entries.map((entry) => {
              const meta = QUADRANT_META[entry.quadrant];
              const dateStr = new Date(entry.timestamp).toLocaleString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              return (
                <div
                  key={entry.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-indigo-300 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full inline-block ${meta.pinColorClass}`}
                      />
                      <span className="font-bold text-xs text-slate-900">
                        #{entry.selectedWord}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {meta.koreanName}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{dateStr}</span>
                  </div>

                  {/* Reflection Note */}
                  {entry.reflectionNote && (
                    <p className="text-xs text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200/60 leading-relaxed font-medium">
                      &ldquo;{entry.reflectionNote}&rdquo;
                    </p>
                  )}

                  {/* Teacher Feedback Note if present */}
                  {entry.teacherFeedback && (
                    <div className="bg-indigo-50 border border-indigo-200/80 rounded-lg p-2 text-xs">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-900 mb-0.5">
                        <span className="material-symbols-outlined text-[13px] text-indigo-600">favorite</span>
                        <span>선생님의 따뜻한 한마디 ({entry.teacherFeedbackAuthor || '선생님'})</span>
                      </div>
                      <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                        {entry.teacherFeedback}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          {entries.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('모든 감정 기록을 삭제하시겠습니까?')) {
                  onClearHistory();
                }
              }}
              className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">delete</span>
              기록 비우기
            </button>
          )}
          <button
            onClick={() => {
              soundFx.playTap();
              onClose();
            }}
            className="ml-auto bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 cursor-pointer shadow-xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
