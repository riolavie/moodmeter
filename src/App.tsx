import React, { useState, useEffect } from 'react';
import {
  QuadrantType,
  MoodLogEntry,
  StudentAccount,
  UserProfile
} from './types';
import { QUADRANT_META, PRESET_EXPRESSIONS } from './data/rulerData';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar, TabId } from './components/BottomNavBar';
import { CameraView } from './components/CameraView';
import { ScanningView } from './components/ScanningView';
import { MoodMeterGrid } from './components/MoodMeterGrid';
import { ActionsView } from './components/ActionsView';
import { HistoryModal } from './components/HistoryModal';
import { RulerGuideModal } from './components/RulerGuideModal';
import { SettingsModal } from './components/SettingsModal';
import { TeacherPortal } from './components/TeacherPortal';
import { StudentAuthModal } from './components/StudentAuthModal';
import { LoginPage } from './components/LoginPage';

import { auth, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  syncUserProfile,
  saveMoodDiaryEntry,
  subscribeStudentDiaries,
  subscribeTeacherStudents,
  subscribeTeacherDiaries,
  createStudentRoster
} from './utils/firestoreService';

export default function App() {
  // Session Authentication State (Initial first screen is Login Page)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const active = localStorage.getItem('is_authenticated_session');
      return active === 'true';
    } catch {
      return false;
    }
  });

  const [currentTab, setCurrentTab] = useState<TabId>('capture');
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [pinX, setPinX] = useState<number>(75);
  const [pinY, setPinY] = useState<number>(28);
  const [currentQuadrant, setCurrentQuadrant] = useState<QuadrantType>('YELLOW');
  const [expressionName, setExpressionName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [initialAiCoords, setInitialAiCoords] = useState<{
    x: number;
    y: number;
    quadrant: QuadrantType;
    expressionName?: string;
  } | null>(null);
  const [aiComment, setAiComment] = useState<string>(
    '환한 미소에서 반짝이는 활기와 즐거움이 느껴져요! 오늘 멋진 하루를 만들어가기에 최고의 에너지입니다.'
  );

  // Settings & Preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [mirrorCamera, setMirrorCamera] = useState<boolean>(true);

  // Auth & Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('active_teacher_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [currentStudent, setCurrentStudent] = useState<StudentAccount | null>(() => {
    try {
      const saved = localStorage.getItem('active_student_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // Storage error
    }
    return null;
  });

  const [studentsList, setStudentsList] = useState<StudentAccount[]>([]);
  const [classroomDiaries, setClassroomDiaries] = useState<MoodLogEntry[]>([]);

  // Modals
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTeacherPortalOpen, setIsTeacherPortalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Mood History Logs for currently active student/user
  const [historyEntries, setHistoryEntries] = useState<MoodLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('mood_meter_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore parsing error
    }
    return [
      {
        id: 'sample-1',
        studentId: 'default_student_1',
        studentName: '김하은',
        studentCode: 'STU-32-01',
        grade: '3학년',
        classRoom: '2반',
        studentNumber: '1번',
        timestamp: Date.now() - 3600000 * 24,
        dateString: new Date(Date.now() - 3600000 * 24).toISOString().split('T')[0],
        quadrant: 'YELLOW',
        selectedWord: '신남',
        x: 78,
        y: 25,
        pleasantness: 78,
        energy: 75,
        aiComment: '활기찬 에너지로 팀 미팅을 성공적으로 마쳤어요.',
        reflectionNote: '새로운 과학 발표 수업 준비가 너무 재미있었다!'
      },
      {
        id: 'sample-2',
        studentId: 'default_student_1',
        studentName: '김하은',
        studentCode: 'STU-32-01',
        grade: '3학년',
        classRoom: '2반',
        studentNumber: '1번',
        timestamp: Date.now() - 3600000 * 48,
        dateString: new Date(Date.now() - 3600000 * 48).toISOString().split('T')[0],
        quadrant: 'GREEN',
        selectedWord: '편안함',
        x: 72,
        y: 76,
        pleasantness: 72,
        energy: 24,
        aiComment: '마음에 잔잔한 여유와 감사가 깃들어 있습니다.',
        reflectionNote: '방과 후 도서관에서 책을 읽으며 여유로운 시간',
        teacherFeedback: '하은아, 꾸준히 마음을 잘 돌아보는 모습이 정말 멋지구나! 🌿',
        teacherFeedbackAt: Date.now() - 3600000 * 20,
        teacherFeedbackAuthor: '담임 선생님'
      }
    ];
  });

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await syncUserProfile(
            user.uid,
            user.email,
            user.displayName,
            user.photoURL,
            'teacher'
          );
          setCurrentUser(profile);

          // If user is teacher, seed initial sample students if empty
          if (profile.role === 'teacher') {
            createStudentRoster({
              studentCode: 'STU-32-01',
              name: '김하은',
              grade: '3학년',
              classRoom: '2반',
              studentNumber: '1번',
              pinCode: '1001',
              teacherUid: user.uid,
              teacherEmail: user.email || ''
            }).catch(() => {});

            createStudentRoster({
              studentCode: 'STU-32-02',
              name: '이도윤',
              grade: '3학년',
              classRoom: '2반',
              studentNumber: '2번',
              pinCode: '1002',
              teacherUid: user.uid,
              teacherEmail: user.email || ''
            }).catch(() => {});

            createStudentRoster({
              studentCode: 'STU-32-03',
              name: '박서연',
              grade: '3학년',
              classRoom: '2반',
              studentNumber: '3번',
              pinCode: '1003',
              teacherUid: user.uid,
              teacherEmail: user.email || ''
            }).catch(() => {});
          }
        } catch (err) {
          console.warn('Firebase user sync warning:', err);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to Teacher data (students roster and all classroom diaries)
  useEffect(() => {
    const teacherId = currentUser?.uid || 'teacher_default';
    const unsubStudents = subscribeTeacherStudents(teacherId, (students) => {
      if (students.length > 0) {
        setStudentsList(students);
      }
    });

    const unsubDiaries = subscribeTeacherDiaries(teacherId, (diaries) => {
      if (diaries.length > 0) {
        setClassroomDiaries(diaries);
      }
    });

    return () => {
      unsubStudents();
      unsubDiaries();
    };
  }, [currentUser?.uid]);

  // Subscribe to Current Student's individual diaries
  useEffect(() => {
    const targetId = currentStudent?.id || currentUser?.uid;
    if (!targetId) return;

    const unsub = subscribeStudentDiaries(targetId, (entries) => {
      if (entries.length > 0) {
        setHistoryEntries(entries);
        try {
          localStorage.setItem('mood_meter_history', JSON.stringify(entries));
        } catch {
          // ignore
        }
      }
    });

    return () => unsub();
  }, [currentStudent?.id, currentUser?.uid]);

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
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
      setCurrentUser(profile);
      setIsAuthenticated(true);
      try {
        localStorage.setItem('is_authenticated_session', 'true');
        localStorage.setItem('active_teacher_user', JSON.stringify(profile));
      } catch {
        // ignore
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        // User closed or cancelled the popup window, normal UI cancellation flow
        return;
      }
      console.error('Google Sign-in error:', err);
      alert('Google 로그인 중 오류가 발생했습니다.');
    }
  };

  // Student login success
  const handleStudentLoginSuccess = (student: StudentAccount) => {
    setCurrentStudent(student);
    const studentUser: UserProfile = {
      uid: student.id,
      email: null,
      displayName: student.name,
      photoURL: null,
      role: 'student',
      studentId: student.id,
      studentCode: student.studentCode,
      grade: student.grade,
      classRoom: student.classRoom,
      studentNumber: student.studentNumber,
      createdAt: student.createdAt
    };
    setCurrentUser(studentUser);
    setIsAuthenticated(true);
    setCurrentTab('capture');
    try {
      localStorage.setItem('is_authenticated_session', 'true');
      localStorage.setItem('active_student_profile', JSON.stringify(student));
      localStorage.removeItem('active_teacher_user');
    } catch {
      // ignore
    }
  };

  // Teacher login or registration success
  const handleTeacherLoginSuccess = (teacher: UserProfile) => {
    setCurrentUser(teacher);
    setCurrentStudent(null);
    setIsAuthenticated(true);
    setIsTeacherPortalOpen(true);
    try {
      localStorage.setItem('is_authenticated_session', 'true');
      localStorage.setItem('active_teacher_user', JSON.stringify(teacher));
      localStorage.removeItem('active_student_profile');
    } catch {
      // ignore
    }
  };

  // Guest mode exploration
  const handleContinueAsGuest = () => {
    setCurrentUser(null);
    setCurrentStudent(null);
    setIsAuthenticated(true);
    setCurrentTab('capture');
  };

  // Handle Sign Out (Returns directly to the first page login view)
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase sign-out notice:', err);
    }
    setCurrentUser(null);
    setCurrentStudent(null);
    setIsAuthenticated(false);
    setIsTeacherPortalOpen(false);
    try {
      localStorage.removeItem('is_authenticated_session');
      localStorage.removeItem('active_student_profile');
      localStorage.removeItem('active_teacher_user');
    } catch {
      // ignore
    }
  };

  // Handle Select Student from Modal
  const handleSelectStudent = (student: StudentAccount | null) => {
    setCurrentStudent(student);
    if (student) {
      try {
        localStorage.setItem('active_student_profile', JSON.stringify(student));
      } catch {
        // ignore
      }
    } else {
      localStorage.removeItem('active_student_profile');
    }
  };

  // Calculate quadrant from X and Y
  const calculateQuadrant = (xVal: number, yVal: number): QuadrantType => {
    if (xVal < 50 && yVal < 50) return 'RED';
    if (xVal >= 50 && yVal < 50) return 'YELLOW';
    if (xVal < 50 && yVal >= 50) return 'BLUE';
    return 'GREEN';
  };

  // Update Pin coordinates and quadrant
  const handleUpdateCoords = (newX: number, newY: number) => {
    setPinX(newX);
    setPinY(newY);
    const quad = calculateQuadrant(newX, newY);
    if (quad !== currentQuadrant) {
      setCurrentQuadrant(quad);
      setAiComment(QUADRANT_META[quad].desc);
    }
  };

  // Handle Photo Capture
  const handleCapture = async (imageDataUrl: string | null, presetId?: string) => {
    setCapturedPhotoUrl(imageDataUrl);
    setCurrentTab('analyze');
    setIsAnalyzing(true);

    // If preset is selected
    if (presetId) {
      const preset = PRESET_EXPRESSIONS.find((p) => p.id === presetId);
      if (preset) {
        setPinX(preset.x);
        setPinY(preset.y);
        setCurrentQuadrant(preset.quadrant);
        setAiComment(preset.aiComment);
        setExpressionName(preset.label);
        setInitialAiCoords({
          x: preset.x,
          y: preset.y,
          quadrant: preset.quadrant,
          expressionName: preset.label
        });
        setIsAnalyzing(false);
        return;
      }
    }

    // Call server API for Gemini AI vision analysis
    if (imageDataUrl) {
      try {
        const response = await fetch('/api/analyze-mood', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: imageDataUrl
          })
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.quadrant) {
            const finalX = result.x ?? (result.quadrant === 'YELLOW' || result.quadrant === 'GREEN' ? 72 : 28);
            const finalY = result.y ?? (result.quadrant === 'YELLOW' || result.quadrant === 'RED' ? 28 : 72);
            setPinX(finalX);
            setPinY(finalY);
            setCurrentQuadrant(result.quadrant);
            setExpressionName(result.expressionName || '표정 분석 완료');
            if (result.aiComment) {
              setAiComment(result.aiComment);
            }
            setInitialAiCoords({
              x: finalX,
              y: finalY,
              quadrant: result.quadrant,
              expressionName: result.expressionName
            });
            setIsAnalyzing(false);
            return;
          }
        }
      } catch (err) {
        console.warn('AI analysis API call failed, using default:', err);
      }
    }

    // Default neutral if no photo or error
    setPinX(65);
    setPinY(65);
    setCurrentQuadrant('GREEN');
    setExpressionName('차분한 상태');
    setAiComment('감정 4분면에서 내 마음에 가장 가까운 위치로 핀을 직접 조절해보세요.');
    setInitialAiCoords({
      x: 65,
      y: 65,
      quadrant: 'GREEN',
      expressionName: '차분한 상태'
    });
    setIsAnalyzing(false);
  };

  // When scan finishes in ScanningView
  const handleScanComplete = () => {
    setCurrentTab('grid');
  };

  // Save to Journal (Firestore + Local state)
  const handleSaveToJournal = async (entry: MoodLogEntry) => {
    // Fill in teacher UID if available
    const enriched: MoodLogEntry = {
      ...entry,
      teacherUid: currentUser?.uid || currentStudent?.teacherUid || 'teacher_default',
      studentId: currentStudent?.id || currentUser?.studentId || currentUser?.uid || 'guest_student',
      studentName: currentStudent?.name || currentUser?.displayName || '학생',
      studentCode: currentStudent?.studentCode || 'STU-LOCAL',
      grade: currentStudent?.grade || '3학년',
      classRoom: currentStudent?.classRoom || '2반',
      studentNumber: currentStudent?.studentNumber || '1번'
    };

    const updated = [enriched, ...historyEntries];
    setHistoryEntries(updated);

    try {
      localStorage.setItem('mood_meter_history', JSON.stringify(updated));
    } catch {
      // Storage error
    }

    // Save persistently to Firebase Firestore
    try {
      await saveMoodDiaryEntry(enriched);
    } catch (err) {
      console.warn('Firestore mood diary save warning (offline fallback active):', err);
    }
  };

  const handleClearHistory = () => {
    setHistoryEntries([]);
    try {
      localStorage.removeItem('mood_meter_history');
    } catch {
      // Storage error
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-0 sm:p-4 selection:bg-indigo-500/20 selection:text-indigo-900 font-sans">
      {/* High Density App Viewport Container */}
      <div className="w-full max-w-md bg-white sm:rounded-2xl shadow-sm overflow-hidden flex flex-col h-[840px] max-h-[100dvh] relative border-0 sm:border border-slate-200">
        {!isAuthenticated ? (
          /* FIRST PAGE: Dedicated Login & Role Sign-up Gate */
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col">
            <LoginPage
              studentsList={studentsList}
              onStudentLoginSuccess={handleStudentLoginSuccess}
              onTeacherLoginSuccess={handleTeacherLoginSuccess}
              onContinueAsGuest={handleContinueAsGuest}
            />
          </div>
        ) : (
          /* AUTHENTICATED APP WORKFLOW */
          <>
            {/* Top App Bar Header */}
            <TopAppBar
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenGuide={() => setIsGuideOpen(true)}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onOpenTeacherPortal={() => setIsTeacherPortalOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onSignOut={handleSignOut}
              currentUser={currentUser}
              currentStudent={currentStudent}
              historyCount={historyEntries.length}
            />

            {/* Main Content Body */}
            <main className="flex-1 overflow-y-auto px-4 py-3 relative flex flex-col pb-16">
              {currentTab === 'capture' && (
                <CameraView
                  onCapture={handleCapture}
                  mirrorCamera={mirrorCamera}
                />
              )}

              {currentTab === 'analyze' && (
                <ScanningView
                  photoUrl={capturedPhotoUrl}
                  isAnalyzing={isAnalyzing}
                  analyzedQuadrant={currentQuadrant}
                  expressionName={expressionName}
                  onScanComplete={handleScanComplete}
                />
              )}

              {currentTab === 'grid' && (
                <MoodMeterGrid
                  x={pinX}
                  y={pinY}
                  quadrant={currentQuadrant}
                  aiComment={aiComment}
                  expressionName={expressionName}
                  initialAiCoords={initialAiCoords}
                  onUpdateCoords={handleUpdateCoords}
                  onConfirm={() => setCurrentTab('activities')}
                />
              )}

              {currentTab === 'activities' && (
                <ActionsView
                  quadrant={currentQuadrant}
                  x={pinX}
                  y={pinY}
                  aiComment={aiComment}
                  photoUrl={capturedPhotoUrl}
                  currentStudent={currentStudent}
                  currentUser={currentUser}
                  onRestart={() => setCurrentTab('capture')}
                  onSaveToJournal={handleSaveToJournal}
                />
              )}
            </main>

            {/* Bottom Navigation Bar */}
            <BottomNavBar
              currentTab={currentTab}
              onSelectTab={(tab) => setCurrentTab(tab)}
            />
          </>
        )}

        {/* Modals */}
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          entries={historyEntries}
          currentStudent={currentStudent}
          onClearHistory={handleClearHistory}
        />

        <RulerGuideModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          soundEnabled={soundEnabled}
          onToggleSound={setSoundEnabled}
          mirrorCamera={mirrorCamera}
          onToggleMirror={setMirrorCamera}
        />

        <StudentAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          currentStudent={currentStudent}
          studentsList={studentsList}
          onGoogleSignIn={handleGoogleSignIn}
          onSignOut={handleSignOut}
          onSelectStudent={handleSelectStudent}
        />

        {/* Teacher Portal Full Dashboard Modal */}
        {isTeacherPortalOpen && (
          <TeacherPortal
            teacherProfile={currentUser}
            students={studentsList}
            diaries={classroomDiaries.length > 0 ? classroomDiaries : historyEntries}
            onClose={() => setIsTeacherPortalOpen(false)}
            onGoogleSignIn={handleGoogleSignIn}
          />
        )}
      </div>
    </div>
  );
}
