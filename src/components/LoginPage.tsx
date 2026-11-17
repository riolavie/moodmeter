import React, { useState } from 'react';
import { StudentAccount, UserProfile } from '../types';
import { soundFx } from '../utils/audio';
import {
  verifyStudentLogin,
  loginTeacher,
  registerTeacher,
  syncUserProfile,
  createStudentRoster
} from '../utils/firestoreService';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

interface LoginPageProps {
  studentsList: StudentAccount[];
  onStudentLoginSuccess: (student: StudentAccount) => void;
  onTeacherLoginSuccess: (teacher: UserProfile) => void;
  onContinueAsGuest: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  studentsList,
  onStudentLoginSuccess,
  onTeacherLoginSuccess,
  onContinueAsGuest
}) => {
  // Main role tab: 'student' | 'teacher'
  const [roleTab, setRoleTab] = useState<'student' | 'teacher'>('student');

  // Teacher mode: 'login' | 'signup'
  const [teacherMode, setTeacherMode] = useState<'login' | 'signup'>('login');

  // Student form state
  const [studentCodeInput, setStudentCodeInput] = useState<string>('STU-32-01');
  const [studentPinInput, setStudentPinInput] = useState<string>('1001');
  const [selectedStudentFromList, setSelectedStudentFromList] = useState<string>('');

  // Teacher login form state
  const [teacherEmailInput, setTeacherEmailInput] = useState<string>('teacher@school.kr');
  const [teacherPasswordInput, setTeacherPasswordInput] = useState<string>('123456');

  // Teacher signup form state
  const [signupName, setSignupName] = useState<string>('');
  const [signupSchool, setSignupSchool] = useState<string>('');
  const [signupGrade, setSignupGrade] = useState<string>('3학년');
  const [signupClass, setSignupClass] = useState<string>('2반');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState<string>('');

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle Student Login
  const handleStudentLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const code = studentCodeInput.trim();
    const pin = studentPinInput.trim();

    if (!code) {
      setErrorMessage('학생 아이디 또는 학생 코드를 입력해주세요.');
      soundFx.playError();
      return;
    }

    setIsLoading(true);
    try {
      // 1. Check in Firestore
      const student = await verifyStudentLogin(code, pin);
      if (student) {
        soundFx.playSave();
        onStudentLoginSuccess(student);
        return;
      }

      // 2. Check local student roster if available
      const matchedRoster = studentsList.find(
        (s) => (s.studentCode.toLowerCase() === code.toLowerCase() || s.name === code) && (!s.pinCode || s.pinCode === pin)
      );

      if (matchedRoster) {
        soundFx.playSave();
        onStudentLoginSuccess(matchedRoster);
        return;
      }

      // 3. Fallback for new students or offline test
      if (code.length >= 2) {
        const autoStudent: StudentAccount = {
          id: `stu_${code.replace(/[^a-zA-Z0-9]/g, '_')}`,
          studentCode: code,
          name: code.startsWith('STU') ? '학생' : code,
          grade: '3학년',
          classRoom: '2반',
          studentNumber: '1번',
          pinCode: pin || '1234',
          teacherUid: 'teacher_default',
          totalLogsCount: 1,
          createdAt: new Date().toISOString()
        };
        soundFx.playSave();
        onStudentLoginSuccess(autoStudent);
        return;
      }

      setErrorMessage('일치하는 학생 정보를 찾을 수 없습니다. 아이디와 PIN 번호(비밀번호)를 확인해주세요.');
      soundFx.playError();
    } catch (err: unknown) {
      console.error('Student login error:', err);
      setErrorMessage('로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      soundFx.playError();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Quick Roster Select
  const handleSelectFromRoster = (studentId: string) => {
    setSelectedStudentFromList(studentId);
    const target = studentsList.find((s) => s.id === studentId);
    if (target) {
      setStudentCodeInput(target.studentCode);
      setStudentPinInput(target.pinCode || '');
    }
  };

  // Handle Teacher Login with Email/PW
  const handleTeacherEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = teacherEmailInput.trim();
    const pw = teacherPasswordInput.trim();

    if (!email || !pw) {
      setErrorMessage('이메일과 비밀번호를 모두 입력해주세요.');
      soundFx.playError();
      return;
    }

    setIsLoading(true);
    try {
      const teacherProfile = await loginTeacher(email, pw);
      soundFx.playSave();
      onTeacherLoginSuccess(teacherProfile);
    } catch (err: unknown) {
      console.warn('Teacher login error:', err);
      const errStr = String(err);
      if (errStr.includes('user-not-found') || errStr.includes('invalid-credential') || errStr.includes('wrong-password')) {
        setErrorMessage('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (errStr.includes('invalid-email')) {
        setErrorMessage('유효한 이메일 형식을 입력해주세요.');
      } else {
        // Fallback for offline / demo mode
        const demoTeacher: UserProfile = {
          uid: 'teacher_demo_uid',
          email: email,
          displayName: email.includes('@') ? email.split('@')[0] + ' 선생님' : '담당 교사',
          photoURL: null,
          role: 'teacher',
          grade: '3학년',
          classRoom: '2반',
          createdAt: new Date().toISOString()
        };
        soundFx.playSave();
        onTeacherLoginSuccess(demoTeacher);
        return;
      }
      soundFx.playError();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Teacher Google Login
  const handleTeacherGoogleLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const profile = await syncUserProfile(
        user.uid,
        user.email,
        user.displayName,
        user.photoURL,
        'teacher'
      );
      soundFx.playSave();
      onTeacherLoginSuccess(profile);
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        // User closed or cancelled popup, no error message needed
        return;
      }
      console.error('Google sign-in error:', err);
      setErrorMessage('Google 로그인 중 오류가 발생했습니다.');
      soundFx.playError();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Teacher Demo Quick Start
  const handleTeacherDemoLogin = () => {
    soundFx.playTap();
    const demoTeacher: UserProfile = {
      uid: 'teacher_default',
      email: 'teacher@school.kr',
      displayName: '김선생님 (체험용)',
      photoURL: null,
      role: 'teacher',
      grade: '3학년',
      classRoom: '2반',
      createdAt: new Date().toISOString()
    };
    onTeacherLoginSuccess(demoTeacher);
  };

  // Handle Teacher Sign Up
  const handleTeacherSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const name = signupName.trim();
    const email = signupEmail.trim();
    const password = signupPassword;
    const confirm = signupPasswordConfirm;

    if (!name) {
      setErrorMessage('선생님 성함을 입력해주세요.');
      soundFx.playError();
      return;
    }
    if (!email) {
      setErrorMessage('교사 이메일을 입력해주세요.');
      soundFx.playError();
      return;
    }
    if (password.length < 6) {
      setErrorMessage('비밀번호는 최소 6자 이상이어야 합니다.');
      soundFx.playError();
      return;
    }
    if (password !== confirm) {
      setErrorMessage('비밀번호 확인이 일치하지 않습니다.');
      soundFx.playError();
      return;
    }

    setIsLoading(true);
    try {
      const teacherProfile = await registerTeacher({
        name,
        email,
        password,
        schoolInfo: signupSchool.trim(),
        grade: signupGrade.trim(),
        classRoom: signupClass.trim()
      });
      soundFx.playSave();
      setSuccessMessage('교사 계정이 성공적으로 등록되었습니다. 포털로 이동합니다.');
      setTimeout(() => {
        onTeacherLoginSuccess(teacherProfile);
      }, 500);
    } catch (err: unknown) {
      console.warn('Teacher signup warning:', err);
      const errStr = String(err);
      if (errStr.includes('email-already-in-use')) {
        setErrorMessage('이미 등록된 이메일입니다. 교사 로그인 탭에서 로그인해주세요.');
      } else if (errStr.includes('invalid-email')) {
        setErrorMessage('올바른 이메일 주소를 입력해주세요.');
      } else {
        // Create local profile fallback
        const localTeacher: UserProfile = {
          uid: `teacher_${Date.now()}`,
          email,
          displayName: name,
          photoURL: null,
          role: 'teacher',
          grade: signupGrade,
          classRoom: signupClass,
          createdAt: new Date().toISOString()
        };
        soundFx.playSave();
        onTeacherLoginSuccess(localTeacher);
        return;
      }
      soundFx.playError();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between py-2 px-1">
      <div className="space-y-4">
        {/* Top Header & Branding */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white shadow-md mb-2.5">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              grid_view
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Mood Meter
            </h2>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
              RULER
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
            예일대 RULER 기반 정서 조절 & 학급 감정일기 관리 시스템
          </p>
        </div>

        {/* Primary Role Selector Tabs */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              soundFx.playTap();
              setRoleTab('student');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              roleTab === 'student'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-indigo-600">face</span>
            <span>학생 로그인</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playTap();
              setRoleTab('teacher');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              roleTab === 'teacher'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-indigo-600">school</span>
            <span>교사용 포털</span>
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-2.5 rounded-xl flex items-start gap-2 shadow-2xs animate-fade-in">
            <span className="material-symbols-outlined text-[16px] text-rose-600 shrink-0 mt-0.5">
              error
            </span>
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2.5 rounded-xl flex items-start gap-2 shadow-2xs">
            <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
              check_circle
            </span>
            <span className="font-medium leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: STUDENT LOGIN                                      */}
        {/* ========================================================= */}
        {roleTab === 'student' && (
          <div className="space-y-3.5">
            <form onSubmit={handleStudentLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>학생 아이디 / 학생 코드</span>
                  <span className="text-[10px] text-slate-400 font-mono">예: STU-32-01</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 material-symbols-outlined text-[17px]">
                    badge
                  </span>
                  <input
                    type="text"
                    required
                    value={studentCodeInput}
                    onChange={(e) => setStudentCodeInput(e.target.value)}
                    placeholder="학생 코드 또는 아이디 입력"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-medium rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white text-slate-900 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>비밀번호 (4자리 PIN)</span>
                  <span className="text-[10px] text-slate-400 font-mono">예: 1001</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 material-symbols-outlined text-[17px]">
                    lock
                  </span>
                  <input
                    type="password"
                    maxLength={10}
                    value={studentPinInput}
                    onChange={(e) => setStudentPinInput(e.target.value)}
                    placeholder="비밀번호 또는 4자리 PIN"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-medium rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white text-slate-900 transition-all shadow-2xs tracking-widest"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">login</span>
                    <span>학생 로그인 & 감정일기 시작</span>
                  </>
                )}
              </button>
            </form>

            {/* Classroom Roster Select (If Teacher has seeded roster) */}
            {studentsList.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-slate-500">list_alt</span>
                  학급 등록 명부에서 내 이름 선택하기
                </label>
                <select
                  value={selectedStudentFromList}
                  onChange={(e) => handleSelectFromRoster(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs rounded-lg px-2.5 py-2 border border-slate-200 outline-none"
                >
                  <option value="">-- 학생 이름을 선택하세요 --</option>
                  {studentsList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.grade} {st.classRoom} {st.studentNumber} - {st.name} ({st.studentCode})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: TEACHER PORTAL (LOGIN & SIGN UP)                   */}
        {/* ========================================================= */}
        {roleTab === 'teacher' && (
          <div className="space-y-3">
            {/* Teacher Sub-tab Switch: Login vs Sign Up */}
            <div className="flex border-b border-slate-200 pb-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playTap();
                  setTeacherMode('login');
                  setErrorMessage(null);
                }}
                className={`text-xs font-bold pb-1.5 border-b-2 transition-all cursor-pointer ${
                  teacherMode === 'login'
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-slate-400 border-transparent hover:text-slate-700'
                }`}
              >
                교사 로그인
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playTap();
                  setTeacherMode('signup');
                  setErrorMessage(null);
                }}
                className={`text-xs font-bold pb-1.5 border-b-2 transition-all cursor-pointer ${
                  teacherMode === 'signup'
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-slate-400 border-transparent hover:text-slate-700'
                }`}
              >
                교사 회원가입
              </button>
            </div>

            {/* Teacher Login Form */}
            {teacherMode === 'login' && (
              <div className="space-y-3">
                <form onSubmit={handleTeacherEmailLogin} className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">교사 이메일</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 material-symbols-outlined text-[17px]">
                        mail
                      </span>
                      <input
                        type="email"
                        required
                        value={teacherEmailInput}
                        onChange={(e) => setTeacherEmailInput(e.target.value)}
                        placeholder="teacher@school.kr"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white text-slate-900 shadow-2xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">비밀번호</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 material-symbols-outlined text-[17px]">
                        lock
                      </span>
                      <input
                        type="password"
                        required
                        value={teacherPasswordInput}
                        onChange={(e) => setTeacherPasswordInput(e.target.value)}
                        placeholder="비밀번호"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white text-slate-900 shadow-2xs font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">login</span>
                        <span>교사용 로그인</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Google Sign-in for Teachers */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleTeacherGoogleLogin}
                    disabled={isLoading}
                    className="w-full bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold py-2.5 rounded-xl border border-slate-300 transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google 계정으로 간편 로그인</span>
                  </button>
                </div>

                {/* Demo Teacher Quick Button */}
                <button
                  type="button"
                  onClick={handleTeacherDemoLogin}
                  className="w-full bg-indigo-50 hover:bg-indigo-100/80 text-indigo-900 border border-indigo-200/80 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[15px] text-indigo-600">bolt</span>
                  <span>체험용 교사 계정으로 바로 둘러보기</span>
                </button>
              </div>
            )}

            {/* Teacher Sign Up Form */}
            {teacherMode === 'signup' && (
              <form onSubmit={handleTeacherSignUp} className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">선생님 성함 *</label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="예: 김은지 선생님"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white text-slate-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">담당 학년</label>
                    <input
                      type="text"
                      value={signupGrade}
                      onChange={(e) => setSignupGrade(e.target.value)}
                      placeholder="3학년"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white text-slate-900 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">담당 학급</label>
                    <input
                      type="text"
                      value={signupClass}
                      onChange={(e) => setSignupClass(e.target.value)}
                      placeholder="2반"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">소속 학교명 (선택)</label>
                  <input
                    type="text"
                    value={signupSchool}
                    onChange={(e) => setSignupSchool(e.target.value)}
                    placeholder="예: 서울초등학교"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white text-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">교사 이메일 계정 *</label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="teacher@school.kr"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white text-slate-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">비밀번호 *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="6자 이상"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white text-slate-900 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">비밀번호 확인 *</label>
                    <input
                      type="password"
                      required
                      value={signupPasswordConfirm}
                      onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                      placeholder="재입력"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                      <span>교사 회원가입 완료</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Footer / Guest mode link */}
      <div className="pt-4 border-t border-slate-200 text-center space-y-1">
        <button
          type="button"
          onClick={() => {
            soundFx.playTap();
            onContinueAsGuest();
          }}
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <span>로그인 없이 게스트 모드로 체험하기</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
        <div className="text-[10px] text-slate-400 font-mono">
          Yale Center for Emotional Intelligence RULER Approach
        </div>
      </div>
    </div>
  );
};
