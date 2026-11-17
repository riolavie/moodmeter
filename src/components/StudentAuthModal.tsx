import React, { useState } from 'react';
import { UserProfile, StudentAccount } from '../types';
import { verifyStudentLogin, updateUserRole } from '../utils/firestoreService';
import { soundFx } from '../utils/audio';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  currentStudent: StudentAccount | null;
  studentsList: StudentAccount[];
  onGoogleSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSelectStudent: (student: StudentAccount | null) => void;
}

export const StudentAuthModal: React.FC<StudentAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentStudent,
  studentsList,
  onGoogleSignIn,
  onSignOut,
  onSelectStudent
}) => {
  const [tab, setTab] = useState<'quick' | 'code' | 'google'>('quick');
  const [inputCode, setInputCode] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!inputCode.trim()) {
      setErrorMsg('학생 아이디(코드)를 입력해주세요.');
      return;
    }

    setIsVerifying(true);
    try {
      const student = await verifyStudentLogin(inputCode, inputPin);
      if (!student) {
        setErrorMsg('일치하는 학생 정보를 찾을 수 없습니다. 코드 또는 PIN을 확인해주세요.');
        soundFx.playError();
        return;
      }

      soundFx.playSave();
      onSelectStudent(student);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('로그인 검증 중 오류가 발생했습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectFromRoster = (student: StudentAccount) => {
    soundFx.playTap();
    onSelectStudent(student);
    onClose();
  };

  const handleRoleToggle = async () => {
    if (!currentUser) return;
    const newRole = currentUser.role === 'teacher' ? 'student' : 'teacher';
    await updateUserRole(currentUser.uid, newRole);
    currentUser.role = newRole;
    soundFx.playTap();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">account_circle</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">사용자 계정 & 학생 로그인</h3>
              <span className="text-[10px] text-slate-500 font-mono">GOOGLE AUTH & STUDENT ID</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.playTap();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Current Status Section if signed in */}
        {(currentUser || currentStudent) && (
          <div className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                현재 접속 프로필
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                {currentStudent ? '학생 모드' : currentUser?.role === 'teacher' ? '교사 모드' : '학생 모드'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentStudent
                    ? currentStudent.name.slice(0, 1)
                    : currentUser?.displayName?.slice(0, 1) || 'U'}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    {currentStudent
                      ? `${currentStudent.name} (${currentStudent.grade} ${currentStudent.classRoom} ${currentStudent.studentNumber})`
                      : currentUser?.displayName || currentUser?.email}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {currentStudent ? `ID: ${currentStudent.studentCode}` : currentUser?.email || 'Google 사용자'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {currentUser && (
                  <button
                    type="button"
                    onClick={handleRoleToggle}
                    className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    {currentUser.role === 'teacher' ? '학생으로 전환' : '교사로 전환'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    await onSignOut();
                    onSelectStudent(null);
                    soundFx.playTap();
                  }}
                  className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer ml-1"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab selection */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl my-2 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setTab('quick')}
            className={`py-1.5 rounded-lg transition-all ${
              tab === 'quick' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            학급 명부 선택
          </button>
          <button
            type="button"
            onClick={() => setTab('code')}
            className={`py-1.5 rounded-lg transition-all ${
              tab === 'code' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            학생 ID/PIN 입력
          </button>
          <button
            type="button"
            onClick={() => setTab('google')}
            className={`py-1.5 rounded-lg transition-all ${
              tab === 'google' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Google 로그인
          </button>
        </div>

        {/* Tab 1: Quick Roster Selection (Ideal for tablet/smartboard in classrooms) */}
        {tab === 'quick' && (
          <div className="my-2 space-y-2">
            <p className="text-xs text-slate-500">
              학급 명부에서 내 이름을 클릭하면 바로 감정일기를 누적 기록할 수 있습니다.
            </p>
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {studentsList.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
                  <span className="material-symbols-outlined text-3xl text-slate-300 mb-1">
                    groups
                  </span>
                  <p>등록된 학급 학생이 없습니다.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    교사용 포털에서 먼저 학생 아이디를 발급해주세요.
                  </p>
                </div>
              ) : (
                studentsList.map((st) => {
                  const isSelected = currentStudent?.id === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleSelectFromRoster(st)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {st.studentNumber ? st.studentNumber.replace('번', '') : st.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-xs">
                            {st.name}{' '}
                            <span className={`text-[10px] font-normal ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                              ({st.grade} {st.classRoom} {st.studentNumber})
                            </span>
                          </div>
                          <div className={`text-[10px] font-mono ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                            {st.studentCode} | 기록: {st.totalLogsCount || 0}건
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="material-symbols-outlined text-emerald-400 text-[18px]">
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: ID & PIN login */}
        {tab === 'code' && (
          <form onSubmit={handleCodeLogin} className="my-2 space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                학생 로그인 코드 (ID)
              </label>
              <input
                type="text"
                required
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="예: STU-32-01 또는 2026-05"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                간편 4자리 PIN (선택)
              </label>
              <input
                type="password"
                maxLength={6}
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                placeholder="선생님이 발급한 PIN 번호"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {errorMsg && (
              <div className="text-rose-600 text-xs font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isVerifying ? '확인 중...' : '학생 인증 로그인'}
            </button>
          </form>
        )}

        {/* Tab 3: Google Account Sign-In */}
        {tab === 'google' && (
          <div className="my-3 space-y-3 text-center">
            <p className="text-xs text-slate-600 leading-relaxed">
              Google Workspace 학교 계정 또는 개인 구글 계정으로 로그인하여 영구적으로 감정 데이터를 클라우드에 보관하세요.
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await onGoogleSignIn();
                  soundFx.playSave();
                  onClose();
                } catch (err) {
                  console.error(err);
                }
              }}
              className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-4 h-4"
              />
              Google 계정으로 계속하기
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={() => {
              soundFx.playTap();
              onClose();
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
