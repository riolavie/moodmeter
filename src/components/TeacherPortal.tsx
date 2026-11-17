import React, { useState, useMemo } from 'react';
import {
  StudentAccount,
  MoodLogEntry,
  QuadrantType,
  UserProfile
} from '../types';
import {
  createStudentRoster,
  batchCreateStudents,
  deleteStudent,
  addTeacherFeedback
} from '../utils/firestoreService';
import { QUADRANT_META } from '../data/rulerData';
import { soundFx } from '../utils/audio';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface TeacherPortalProps {
  teacherProfile: UserProfile | null;
  students: StudentAccount[];
  diaries: MoodLogEntry[];
  onClose: () => void;
  onGoogleSignIn?: () => void;
}

const QUADRANT_COLORS: Record<QuadrantType, string> = {
  RED: '#ef4444',
  YELLOW: '#f59e0b',
  BLUE: '#38bdf8',
  GREEN: '#10b981'
};

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  teacherProfile,
  students,
  diaries,
  onClose,
  onGoogleSignIn
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'analytics' | 'roster' | 'diaries'>('today');
  const [selectedStudentId, setSelectedStudentId] = useState<string | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'7days' | '30days' | 'all'>('7days');
  const [todayQuadrantFilter, setTodayQuadrantFilter] = useState<QuadrantType | 'ALL'>('ALL');

  // Modal for new student creation
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [newGrade, setNewGrade] = useState('3학년');
  const [newClassRoom, setNewClassRoom] = useState('2반');
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('1번');
  const [newCustomCode, setNewCustomCode] = useState('');
  const [batchNamesText, setBatchNamesText] = useState('');
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);

  // Teacher feedback input modal / state
  const [selectedDiaryForFeedback, setSelectedDiaryForFeedback] = useState<MoodLogEntry | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Today's Date Calculation & Daily Filter
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]}요일)`;
  }, []);

  const todayStartTimestamp = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  // Today's Diaries
  const todayDiaries = useMemo(() => {
    return diaries.filter((d) => d.timestamp >= todayStartTimestamp);
  }, [diaries, todayStartTimestamp]);

  // Today's Class Mood Analysis Metrics
  const todayAnalysis = useMemo(() => {
    // If today has entries, analyze today's entries.
    // If today has 0 entries yet, fall back to recent diaries to show preview.
    const sourceList = todayDiaries.length > 0 ? todayDiaries : diaries.slice(0, 20);
    const isMockPreview = todayDiaries.length === 0 && diaries.length > 0;

    const checkedInCount = todayDiaries.length;
    const totalStudents = students.length || 24;
    const checkInRate = Math.min(100, Math.round((checkedInCount / totalStudents) * 100));

    const qCounts: Record<QuadrantType, number> = { RED: 0, YELLOW: 0, BLUE: 0, GREEN: 0 };
    let sumPleasant = 0;
    let sumEnergy = 0;
    const wordMap: Record<string, number> = {};

    sourceList.forEach((d) => {
      if (qCounts[d.quadrant] !== undefined) {
        qCounts[d.quadrant]++;
      }
      sumPleasant += d.pleasantness ?? d.x ?? 50;
      sumEnergy += d.energy ?? (100 - d.y) ?? 50;
      if (d.selectedWord) {
        wordMap[d.selectedWord] = (wordMap[d.selectedWord] || 0) + 1;
      }
    });

    const totalLogs = sourceList.length;
    const avgPleasant = totalLogs > 0 ? Math.round(sumPleasant / totalLogs) : 58;
    const avgEnergy = totalLogs > 0 ? Math.round(sumEnergy / totalLogs) : 62;

    // Top words
    const topWords = Object.entries(wordMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));

    // Determine Dominant Quadrant & Classroom Climate
    const dominantQuadrant: QuadrantType = (['RED', 'YELLOW', 'BLUE', 'GREEN'] as QuadrantType[]).reduce((best, q) => {
      return (qCounts[q] ?? 0) > (qCounts[best] ?? 0) ? q : best;
    }, 'YELLOW' as QuadrantType);

    // Dominant Climate Profile
    let climateTitle = '활기차고 긍정적인 탐구 분위기 ☀️';
    let climateSummary = '학생들의 에너지가 높고 기분이 유쾌하여 모둠 활동과 적극적인 질문에 최적화된 날입니다.';
    let lessonRecommendation = '팀별 브레인스토밍, 창의적 토의·토론, 도전적인 미션 해결 활동을 진행하기에 매우 좋습니다.';
    let teacherAlertNote = '에너지가 과열되어 사소한 장난이나 충동적인 실수가 일어나지 않도록 중간에 3초 호흡으로 템포를 조절해주세요.';

    if (dominantQuadrant === 'GREEN') {
      climateTitle = '차분하고 안정된 집중 분위기 🌿';
      climateSummary = '학급 전반이 편안하고 평온한 상태로, 깊이 있는 경청과 안정적인 자기주도 학습이 가능합니다.';
      lessonRecommendation = '독서, 정돈된 글쓰기, 개념 탐구 및 짝꿍과의 따뜻한 상호 피드백 활동을 추천합니다.';
      teacherAlertNote = '지금의 안정된 정서 흐름을 유지하며 학생들의 성실한 참여 태도를 구체적으로 칭찬해주세요.';
    } else if (dominantQuadrant === 'RED') {
      climateTitle = '긴장감과 에너지가 다소 고조된 상태 ⚡';
      climateSummary = '시험, 평가, 또는 교우 관계에서의 긴장이나 불안·짜증이 감지되므로 정서적 안정화가 먼저 필요합니다.';
      lessonRecommendation = '수업 전 5분간 마음 안정 호흡(4-4-4)을 진행하고, 명확하고 차분한 안내로 심리적 안전감을 부여해주세요.';
      teacherAlertNote = '날카로운 반응을 보이는 학생에게 개별적인 배려와 온화한 어조로 접근해주세요.';
    } else if (dominantQuadrant === 'BLUE') {
      climateTitle = '피로감이 누적되어 충전이 필요한 상태 🌧️';
      climateSummary = '전반적으로 학생들의 에너지 수준이 낮고 지친 기색이 있어 무리한 과제보다 따뜻한 격려가 효과적입니다.';
      lessonRecommendation = '가벼운 스트레칭과 수분 섭취, 부담이 적은 퀴즈나 칭찬 릴레이로 부드럽게 활력을 불어넣어 주세요.';
      teacherAlertNote = '지치거나 위축된 학생이 소외되지 않도록 따뜻한 눈맞춤과 개별 위로를 건네주세요.';
    }

    // High priority students today (RED or BLUE)
    const alertStudents = sourceList
      .filter((d) => d.quadrant === 'RED' || d.quadrant === 'BLUE')
      .slice(0, 6);

    return {
      isMockPreview,
      checkedInCount,
      totalStudents,
      checkInRate,
      qCounts,
      avgPleasant,
      avgEnergy,
      topWords,
      dominantQuadrant,
      climateTitle,
      climateSummary,
      lessonRecommendation,
      teacherAlertNote,
      alertStudents,
      sourceList
    };
  }, [todayDiaries, diaries, students.length]);

  // Filtered Diaries
  const filteredDiaries = useMemo(() => {
    let list = diaries;
    if (selectedStudentId !== 'ALL') {
      list = list.filter((d) => d.studentId === selectedStudentId || d.userUid === selectedStudentId);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (d) =>
          d.studentName?.toLowerCase().includes(term) ||
          d.selectedWord?.toLowerCase().includes(term) ||
          d.studentCode?.toLowerCase().includes(term) ||
          d.reflectionNote?.toLowerCase().includes(term)
      );
    }

    const now = Date.now();
    if (dateFilter === '7days') {
      const cutoff = now - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((d) => d.timestamp >= cutoff);
    } else if (dateFilter === '30days') {
      const cutoff = now - 30 * 24 * 60 * 60 * 1000;
      list = list.filter((d) => d.timestamp >= cutoff);
    }

    return list;
  }, [diaries, selectedStudentId, searchTerm, dateFilter]);

  // Statistics & Metrics
  const metrics = useMemo(() => {
    const total = filteredDiaries.length;
    const qCounts: Record<QuadrantType, number> = { RED: 0, YELLOW: 0, BLUE: 0, GREEN: 0 };
    let sumPleasant = 0;
    let sumEnergy = 0;

    filteredDiaries.forEach((d) => {
      if (qCounts[d.quadrant] !== undefined) {
        qCounts[d.quadrant]++;
      }
      sumPleasant += d.pleasantness ?? d.x ?? 50;
      sumEnergy += d.energy ?? (100 - d.y) ?? 50;
    });

    const avgPleasant = total > 0 ? Math.round(sumPleasant / total) : 50;
    const avgEnergy = total > 0 ? Math.round(sumEnergy / total) : 50;

    // Word frequencies
    const wordFreq: Record<string, number> = {};
    filteredDiaries.forEach((d) => {
      if (d.selectedWord) {
        wordFreq[d.selectedWord] = (wordFreq[d.selectedWord] || 0) + 1;
      }
    });

    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([word, count]) => ({ word, count }));

    // Attention alerts: students with high frequency of RED or BLUE in recent entries
    const studentRecentMoods: Record<string, { name: string; redBlueCount: number; lastLog: MoodLogEntry }> = {};
    diaries.slice(0, 100).forEach((d) => {
      const key = d.studentId || d.studentName || 'unknown';
      if (!studentRecentMoods[key]) {
        studentRecentMoods[key] = {
          name: d.studentName || '학생',
          redBlueCount: 0,
          lastLog: d
        };
      }
      if (d.quadrant === 'RED' || d.quadrant === 'BLUE') {
        studentRecentMoods[key].redBlueCount++;
      }
    });

    const attentionNeededStudents = Object.values(studentRecentMoods)
      .filter((s) => s.redBlueCount >= 2)
      .slice(0, 5);

    return {
      total,
      qCounts,
      avgPleasant,
      avgEnergy,
      topWords,
      attentionNeededStudents
    };
  }, [filteredDiaries, diaries]);

  // Chart Data: Time-series Emotional Trajectory
  const timeSeriesData = useMemo(() => {
    // Group diaries chronologically
    const sorted = [...filteredDiaries].sort((a, b) => a.timestamp - b.timestamp);
    return sorted.map((d) => {
      const date = new Date(d.timestamp);
      const label = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      return {
        timestamp: d.timestamp,
        dateLabel: label,
        pleasantness: Math.round(d.pleasantness ?? d.x ?? 50),
        energy: Math.round(d.energy ?? (100 - d.y) ?? 50),
        word: d.selectedWord,
        studentName: d.studentName || '학생',
        quadrant: d.quadrant
      };
    });
  }, [filteredDiaries]);

  // Chart Data: Quadrant Distribution Pie Chart
  const pieChartData = useMemo(() => {
    return [
      { name: 'RED (불안·분노)', value: metrics.qCounts.RED, color: '#ef4444' },
      { name: 'YELLOW (열정·신남)', value: metrics.qCounts.YELLOW, color: '#f59e0b' },
      { name: 'BLUE (피로·슬픔)', value: metrics.qCounts.BLUE, color: '#0284c7' },
      { name: 'GREEN (편안·차분)', value: metrics.qCounts.GREEN, color: '#10b981' }
    ].filter((item) => item.value > 0);
  }, [metrics.qCounts]);

  // Handle single student registration
  const handleAddSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (!teacherProfile?.uid) {
      alert('교사 계정으로 구글 로그인이 필요합니다.');
      return;
    }

    setIsSubmittingStudent(true);
    try {
      const autoCode =
        newCustomCode.trim() ||
        `STU-${newGrade.replace(/[^0-9]/g, '') || '3'}${newClassRoom.replace(/[^0-9]/g, '') || '1'}-${String(Date.now()).slice(-4)}`;

      await createStudentRoster({
        studentCode: autoCode,
        name: newName.trim(),
        grade: newGrade,
        classRoom: newClassRoom,
        studentNumber: newNumber,
        pinCode: String(1000 + Math.floor(Math.random() * 9000)),
        teacherUid: teacherProfile.uid,
        teacherEmail: teacherProfile.email || ''
      });

      setNewName('');
      setNewCustomCode('');
      setIsAddStudentModalOpen(false);
      soundFx.playSave();
    } catch (err) {
      console.error(err);
      alert('학생 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  // Handle batch student registration
  const handleBatchAddStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNamesText.trim()) return;
    if (!teacherProfile?.uid) {
      alert('교사 계정으로 로그인이 필요합니다.');
      return;
    }

    setIsSubmittingStudent(true);
    try {
      const names = batchNamesText
        .split(/[\n,]+/)
        .map((n) => n.trim())
        .filter(Boolean);

      await batchCreateStudents(
        teacherProfile.uid,
        teacherProfile.email || '',
        newGrade,
        newClassRoom,
        names
      );

      setBatchNamesText('');
      setIsAddStudentModalOpen(false);
      soundFx.playSave();
    } catch (err) {
      console.error(err);
      alert('일괄 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  // Handle Delete Student
  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`${studentName} 학생의 등록 정보를 삭제하시겠습니까?`)) return;
    try {
      await deleteStudent(studentId);
      soundFx.playTap();
    } catch (err) {
      console.error(err);
      alert('학생 삭제에 실패했습니다.');
    }
  };

  // Handle teacher feedback submission
  const handleSubmitFeedback = async () => {
    if (!selectedDiaryForFeedback || !feedbackText.trim()) return;
    setIsSubmittingFeedback(true);
    try {
      await addTeacherFeedback(
        selectedDiaryForFeedback.id,
        feedbackText.trim(),
        teacherProfile?.displayName || '선생님'
      );
      soundFx.playSave();
      setSelectedDiaryForFeedback(null);
      setFeedbackText('');
    } catch (err) {
      console.error(err);
      alert('피드백 저장에 실패했습니다.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl mx-auto my-auto rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">school</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg tracking-tight">
                  교사용 감정 포털 (Teacher Portal)
                </h2>
                <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-indigo-400/30">
                  RULER EDU
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                {teacherProfile?.displayName || '교사'} 선생님 | 학급 감정일기 누적 모니터링 & AI 진단 분석
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!teacherProfile && onGoogleSignIn && (
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-3.5 h-3.5"
                />
                구글 교사 로그인
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                soundFx.playTap();
                onClose();
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              학생 모드로 돌아가기
            </button>
          </div>
        </header>

        {/* Portal Navigation Tabs & Filter Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                soundFx.playTap();
                setActiveTab('today');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">wb_sunny</span>
              오늘 학급 분위기 분석 (Today)
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playTap();
                setActiveTab('analytics');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">monitoring</span>
              감정 변화 그래프 & 분석
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playTap();
                setActiveTab('diaries');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'diaries'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              학생별 감정일기 열람 ({filteredDiaries.length})
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playTap();
                setActiveTab('roster');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">badge</span>
              학생 아이디 발급 & 명부 ({students.length})
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            {/* Student Dropdown Filter */}
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-white text-slate-800 text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">전체 학생 보기 ({students.length}명)</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.grade} {s.classRoom} {s.studentNumber} {s.name} ({s.studentCode})
                </option>
              ))}
            </select>

            {/* Date range filter */}
            {activeTab !== 'today' && (
              <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setDateFilter('7days')}
                  className={`px-2 py-1 rounded-md transition-colors ${dateFilter === '7days' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'}`}
                >
                  7일
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('30days')}
                  className={`px-2 py-1 rounded-md transition-colors ${dateFilter === '30days' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'}`}
                >
                  30일
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('all')}
                  className={`px-2 py-1 rounded-md transition-colors ${dateFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'}`}
                >
                  전체
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60">
          {/* TAB 0: TODAY'S CLASSROOM ATMOSPHERE ANALYSIS */}
          {activeTab === 'today' && (
            <div className="space-y-5 animate-fade-in">
              {/* Today Date & Live Participation Banner */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-200/80">
                      DAILY ATMOSPHERE REPORT
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {todayDateStr}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>오늘 우리 반 감정 기상도 & 분위기 진단</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    실시간 RULER 감정 좌표계를 기반으로 학급 전체의 정서 상태와 수업 지도 가이드를 제공합니다.
                  </p>
                </div>

                {/* Check-in Progress Tracker */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:w-72 shrink-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-indigo-600">checklist</span>
                      오늘 체크인 참여율
                    </span>
                    <span className="font-mono font-bold text-indigo-700">
                      {todayAnalysis.checkedInCount} / {todayAnalysis.totalStudents}명 ({todayAnalysis.checkInRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, todayAnalysis.checkInRate)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>미체크인 {Math.max(0, todayAnalysis.totalStudents - todayAnalysis.checkedInCount)}명</span>
                    <span>{todayAnalysis.isMockPreview ? '(최근 누적 데이터 기준 브리핑)' : '실시간 집계 완료'}</span>
                  </div>
                </div>
              </div>

              {/* Main AI Classroom Climate Card & Teaching Recommendation */}
              <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-indigo-900/50 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-indigo-800/40">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-amber-300 flex items-center justify-center border border-indigo-400/30">
                      <span className="material-symbols-outlined text-[20px]">psychology</span>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-indigo-300 tracking-wider uppercase">
                        AI Classroom Mood Briefing
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-white">
                        {todayAnalysis.climateTitle}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-slate-800/90 border border-slate-700 px-3 py-1 rounded-lg text-center">
                      <div className="text-[10px] text-slate-400">학급 평균 유쾌도</div>
                      <div className="text-sm font-black text-indigo-300 font-mono">
                        {todayAnalysis.avgPleasant} <span className="text-[10px] text-slate-400 font-normal">/100</span>
                      </div>
                    </div>
                    <div className="bg-slate-800/90 border border-slate-700 px-3 py-1 rounded-lg text-center">
                      <div className="text-[10px] text-slate-400">학급 평균 에너지</div>
                      <div className="text-sm font-black text-amber-300 font-mono">
                        {todayAnalysis.avgEnergy} <span className="text-[10px] text-slate-400 font-normal">/100</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {todayAnalysis.climateSummary}
                </p>

                {/* 2-Column Teaching & SEL Action Plan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1.5">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">menu_book</span>
                      오늘 추천 수업 & 모둠 활동
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {todayAnalysis.lessonRecommendation}
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1.5">
                    <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">volunteer_activism</span>
                      오늘 학급 정서 지도 교사 팁
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {todayAnalysis.teacherAlertNote}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Quadrants Live Distribution & Top Words */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* RED */}
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playTap();
                    setTodayQuadrantFilter((prev) => (prev === 'RED' ? 'ALL' : 'RED'));
                  }}
                  className={`p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                    todayQuadrantFilter === 'RED'
                      ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/40 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">
                      RED (불안·분노)
                    </span>
                    <span className="text-xs font-bold text-slate-400 font-mono">
                      {todayAnalysis.sourceList.length > 0
                        ? `${Math.round((todayAnalysis.qCounts.RED / todayAnalysis.sourceList.length) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-rose-600 mt-2">
                    {todayAnalysis.qCounts.RED} <span className="text-xs font-medium text-slate-500">명</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">높은 에너지 · 불쾌감</div>
                </button>

                {/* YELLOW */}
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playTap();
                    setTodayQuadrantFilter((prev) => (prev === 'YELLOW' ? 'ALL' : 'YELLOW'));
                  }}
                  className={`p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                    todayQuadrantFilter === 'YELLOW'
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                      YELLOW (신남·열정)
                    </span>
                    <span className="text-xs font-bold text-slate-400 font-mono">
                      {todayAnalysis.sourceList.length > 0
                        ? `${Math.round((todayAnalysis.qCounts.YELLOW / todayAnalysis.sourceList.length) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-amber-600 mt-2">
                    {todayAnalysis.qCounts.YELLOW} <span className="text-xs font-medium text-slate-500">명</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">높은 에너지 · 유쾌함</div>
                </button>

                {/* BLUE */}
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playTap();
                    setTodayQuadrantFilter((prev) => (prev === 'BLUE' ? 'ALL' : 'BLUE'));
                  }}
                  className={`p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                    todayQuadrantFilter === 'BLUE'
                      ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-400/40 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded">
                      BLUE (피로·슬픔)
                    </span>
                    <span className="text-xs font-bold text-slate-400 font-mono">
                      {todayAnalysis.sourceList.length > 0
                        ? `${Math.round((todayAnalysis.qCounts.BLUE / todayAnalysis.sourceList.length) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-sky-600 mt-2">
                    {todayAnalysis.qCounts.BLUE} <span className="text-xs font-medium text-slate-500">명</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">낮은 에너지 · 불쾌감</div>
                </button>

                {/* GREEN */}
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playTap();
                    setTodayQuadrantFilter((prev) => (prev === 'GREEN' ? 'ALL' : 'GREEN'));
                  }}
                  className={`p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                    todayQuadrantFilter === 'GREEN'
                      ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                      GREEN (편안·차분)
                    </span>
                    <span className="text-xs font-bold text-slate-400 font-mono">
                      {todayAnalysis.sourceList.length > 0
                        ? `${Math.round((todayAnalysis.qCounts.GREEN / todayAnalysis.sourceList.length) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-emerald-600 mt-2">
                    {todayAnalysis.qCounts.GREEN} <span className="text-xs font-medium text-slate-500">명</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">낮은 에너지 · 유쾌함</div>
                </button>
              </div>

              {/* Top Selected Emotion Words Today */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-indigo-600">sell</span>
                  <span className="text-xs font-bold text-slate-900">오늘 학생들이 가장 많이 선택한 감정 단어 TOP 5:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {todayAnalysis.topWords.map((item, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5"
                    >
                      <span className="text-indigo-600">#{item.word}</span>
                      <span className="bg-white text-slate-500 text-[10px] px-1.5 py-0.2 rounded font-mono">
                        {item.count}회
                      </span>
                    </span>
                  ))}
                  {todayAnalysis.topWords.length === 0 && (
                    <span className="text-xs text-slate-400">아직 선택된 단어가 없습니다.</span>
                  )}
                </div>
              </div>

              {/* Priority Care Student Alerts */}
              {todayAnalysis.alertStudents.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">priority_high</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-rose-950">
                          오늘 따뜻한 상담과 지지가 필요한 학생 ({todayAnalysis.alertStudents.length}명)
                        </h4>
                        <p className="text-[11px] text-rose-700">
                          불안·분노(RED) 또는 피로·슬픔(BLUE)을 기록하여 선생님의 관심이 필요한 학생들입니다.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {todayAnalysis.alertStudents.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-white border border-rose-200 rounded-xl p-3 space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">
                            {entry.studentName} 학생
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              entry.quadrant === 'RED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            #{entry.selectedWord}
                          </span>
                        </div>
                        {entry.reflectionNote ? (
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic line-clamp-2">
                            "{entry.reflectionNote}"
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">
                            (작성된 한 줄 일기 없음)
                          </p>
                        )}
                        <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-[10px] text-slate-400">
                          <span>쾌적 {entry.pleasantness ?? entry.x}% · 에너지 {entry.energy ?? (100 - entry.y)}%</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDiaryForFeedback(entry);
                              setFeedbackText(entry.teacherFeedback || '');
                            }}
                            className="text-indigo-600 font-bold hover:underline cursor-pointer"
                          >
                            피드백 작성
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Today's Student Mood Board Grid */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-indigo-600">grid_view</span>
                      오늘 학생별 감정 체크인 실시간 현황판
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {todayQuadrantFilter === 'ALL'
                        ? '학급 전체 학생의 오늘 감정 체크인 결과입니다.'
                        : `${todayQuadrantFilter} 분면을 선택한 학생들만 표시 중입니다.`}
                    </p>
                  </div>

                  {todayQuadrantFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setTodayQuadrantFilter('ALL')}
                      className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">clear</span>
                      필터 해제 (전체 보기)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {todayAnalysis.sourceList
                    .filter((d) => todayQuadrantFilter === 'ALL' || d.quadrant === todayQuadrantFilter)
                    .map((d) => {
                      const meta = QUADRANT_META[d.quadrant];
                      const timeStr = new Date(d.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      return (
                        <div
                          key={d.id}
                          className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-2.5 transition-all space-y-1.5 shadow-2xs group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {d.studentName}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${meta.pinColorClass}`}
                              title={d.quadrant}
                            />
                          </div>

                          <div
                            className={`text-[11px] font-bold px-2 py-0.5 rounded text-center truncate ${meta.bgClass} ${meta.textColor} ${meta.borderClass}`}
                          >
                            #{d.selectedWord}
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5 border-t border-slate-200/60 font-mono">
                            <span>{timeStr}</span>
                            <span className="text-slate-500 font-bold">{d.quadrant}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {todayAnalysis.sourceList.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                    <span className="material-symbols-outlined text-3xl text-slate-300 block">mood</span>
                    <p>오늘 아직 감정을 체크인한 학생이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: GRAPH & EMOTION ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    누적 감정일기 수
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                    {metrics.total} <span className="text-xs font-medium text-slate-500">건</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    등록 학생 {students.length}명 기준
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    평균 유쾌도 (Pleasantness)
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 mt-1">
                    {metrics.avgPleasant} <span className="text-xs font-medium text-slate-500">/ 100</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {metrics.avgPleasant >= 50 ? '긍정적 정서 상태' : '불쾌감 케어 필요'}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    평균 에너지 (Energy)
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-1">
                    {metrics.avgEnergy} <span className="text-xs font-medium text-slate-500">/ 100</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {metrics.avgEnergy >= 50 ? '높은 활력 수준' : '이완 및 피로감 상태'}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    가장 많이 선택한 감정
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate">
                    {metrics.topWords[0] ? `#${metrics.topWords[0].word}` : '기록 없음'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {metrics.topWords[0] ? `${metrics.topWords[0].count}회 선택됨` : '-'}
                  </div>
                </div>
              </div>

              {/* Attention Alerts Section */}
              {metrics.attentionNeededStudents.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">emergency</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-rose-950">
                        선생님의 따뜻한 대화가 필요한 학생이 있습니다
                      </div>
                      <div className="text-[11px] text-rose-700">
                        최근 RED(불안/분노) 또는 BLUE(피로/슬픔) 감정을 2회 이상 연속 기록한 학생:
                        {' '}
                        {metrics.attentionNeededStudents.map((s, idx) => (
                          <strong key={idx} className="font-bold underline mr-1.5">
                            {s.name}
                          </strong>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('diaries')}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition-colors shadow-xs cursor-pointer"
                  >
                    일기 및 피드백 작성
                  </button>
                </div>
              )}

              {/* Main Graphs: Time Series & Quadrant Pie Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. Time Series Emotional Trajectory */}
                <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-indigo-600">show_chart</span>
                        시계열 감정 변화 궤적 (Pleasantness & Energy Trajectory)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        시간에 따른 유쾌도(0~100)와 에너지(0~100)의 상호작용 추이
                      </p>
                    </div>
                  </div>

                  {timeSeriesData.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <span className="material-symbols-outlined text-4xl text-slate-300 mb-1">trending_up</span>
                      선택한 기간의 감정 데이터가 없습니다.
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timeSeriesData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis
                            dataKey="dateLabel"
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                          />
                          <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg border border-slate-800 space-y-1 font-sans">
                                    <div className="font-bold text-slate-200 border-b border-slate-700 pb-1">
                                      {data.studentName} ({data.dateLabel})
                                    </div>
                                    <div className="text-emerald-400">
                                      유쾌도: {data.pleasantness} / 100
                                    </div>
                                    <div className="text-amber-400">
                                      에너지: {data.energy} / 100
                                    </div>
                                    <div className="text-indigo-300 font-bold">
                                      감정 단어: #{data.word} ({data.quadrant})
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                          <Line
                            type="monotone"
                            dataKey="pleasantness"
                            name="유쾌도 (Pleasantness)"
                            stroke="#4f46e5"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: '#4f46e5' }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="energy"
                            name="에너지 (Energy)"
                            stroke="#f59e0b"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: '#f59e0b' }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* 2. Quadrant Proportion Pie */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-indigo-600">pie_chart</span>
                      4분면 감정 분포 비율
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      RULER 4색 감정 존의 점유율
                    </p>
                  </div>

                  {pieChartData.length === 0 ? (
                    <div className="h-52 flex flex-col items-center justify-center text-slate-400 text-xs">
                      데이터가 없습니다.
                    </div>
                  ) : (
                    <div className="h-52 w-full my-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any, name: any) => [`${value}건`, name]}
                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Color tags footer */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-semibold mt-2">
                    <div className="bg-rose-50 text-rose-800 p-1.5 rounded border border-rose-200 text-center">
                      RED: {metrics.qCounts.RED}건 ({metrics.total ? Math.round((metrics.qCounts.RED / metrics.total) * 100) : 0}%)
                    </div>
                    <div className="bg-amber-50 text-amber-800 p-1.5 rounded border border-amber-200 text-center">
                      YELLOW: {metrics.qCounts.YELLOW}건 ({metrics.total ? Math.round((metrics.qCounts.YELLOW / metrics.total) * 100) : 0}%)
                    </div>
                    <div className="bg-sky-50 text-sky-800 p-1.5 rounded border border-sky-200 text-center">
                      BLUE: {metrics.qCounts.BLUE}건 ({metrics.total ? Math.round((metrics.qCounts.BLUE / metrics.total) * 100) : 0}%)
                    </div>
                    <div className="bg-emerald-50 text-emerald-800 p-1.5 rounded border border-emerald-200 text-center">
                      GREEN: {metrics.qCounts.GREEN}건 ({metrics.total ? Math.round((metrics.qCounts.GREEN / metrics.total) * 100) : 0}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Emotion Words Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-[18px] text-indigo-600">sell</span>
                  가장 빈번하게 표현된 감정 단어 랭킹
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {metrics.topWords.length === 0 ? (
                    <span className="text-xs text-slate-400">아직 선택된 감정 단어가 없습니다.</span>
                  ) : (
                    metrics.topWords.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs shadow-2xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">#{item.word}</span>
                        <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
                          {item.count}회
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENT ROSTER & ID ISSUANCE */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              {/* Header Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    학생 아이디 발급 & 학급 명부 관리
                  </h3>
                  <p className="text-xs text-slate-500">
                    학생들에게 발급된 고유 코드 및 4자리 간편 PIN으로 태블릿/PC에서 로그인할 수 있습니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBatchMode(false);
                      setIsAddStudentModalOpen(true);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                    새 학생 아이디 발급
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBatchMode(true);
                      setIsAddStudentModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">group_add</span>
                    학급 일괄 발급
                  </button>
                </div>
              </div>

              {/* Student Table Roster */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                {students.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">
                      badge
                    </span>
                    <p className="text-sm font-semibold text-slate-700">등록된 학생 아이디가 없습니다.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      ‘새 학생 아이디 발급’ 또는 ‘학급 일괄 발급’ 버튼을 눌러 학생을 등록하세요.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="px-4 py-3">학급 / 번호</th>
                          <th className="px-4 py-3">학생 이름</th>
                          <th className="px-4 py-3">로그인 아이디 (코드)</th>
                          <th className="px-4 py-3">간편 PIN</th>
                          <th className="px-4 py-3">누적 일기 수</th>
                          <th className="px-4 py-3">최근 상태</th>
                          <th className="px-4 py-3 text-right">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {students.map((student) => {
                          const meta = student.lastQuadrant ? QUADRANT_META[student.lastQuadrant] : null;
                          return (
                            <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 font-semibold text-slate-900">
                                {student.grade} {student.classRoom} {student.studentNumber}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                                  {student.name.slice(0, 1)}
                                </div>
                                {student.name}
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                                <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                                  {student.studentCode}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-600">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {student.pinCode || '1234'}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-800">
                                {student.totalLogsCount || 0}회
                              </td>
                              <td className="px-4 py-3">
                                {meta ? (
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${meta.bgClass} ${meta.borderClass}`}>
                                    <span className={`w-2 h-2 rounded-full ${meta.pinColorClass}`} />
                                    {meta.koreanName} {student.lastWord ? `(#${student.lastWord})` : ''}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">기록 없음</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudentId(student.id);
                                    setActiveTab('diaries');
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900 font-semibold mr-3 hover:underline"
                                >
                                  일기 열람
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudent(student.id, student.name)}
                                  className="text-rose-500 hover:text-rose-700 font-medium"
                                  title="학생 삭제"
                                >
                                  삭제
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STUDENT DIARY JOURNAL & TEACHER FEEDBACK */}
          {activeTab === 'diaries' && (
            <div className="space-y-4">
              {/* Filter / Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="학생 이름, 감정 단어(#뿌듯함), 일기 내용 검색..."
                    className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  총 <strong>{filteredDiaries.length}</strong>개의 감정 일기
                </div>
              </div>

              {/* Diary List Grid */}
              {filteredDiaries.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center text-slate-400 border border-slate-200">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">
                    menu_book
                  </span>
                  <p className="text-sm font-semibold text-slate-700">해당 조건의 감정 일기가 없습니다.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    학생이 Mood Meter에서 감정을 기록하면 실시간으로 여기에 누적됩니다.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredDiaries.map((diary) => {
                    const meta = QUADRANT_META[diary.quadrant];
                    const dateObj = new Date(diary.timestamp);
                    const formattedDate = `${dateObj.getFullYear()}.${dateObj.getMonth() + 1}.${dateObj.getDate()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

                    return (
                      <div
                        key={diary.id}
                        className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Top Author & Badge */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                                {diary.studentName ? diary.studentName.slice(0, 1) : '학'}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-slate-900">
                                  {diary.studentName || '학생'}
                                  {diary.grade && (
                                    <span className="ml-1 text-[10px] font-normal text-slate-500">
                                      ({diary.grade} {diary.classRoom} {diary.studentNumber})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {formattedDate}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${meta.bgClass} ${meta.borderClass}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${meta.pinColorClass}`} />
                              {meta.koreanName} (#{diary.selectedWord})
                            </span>
                          </div>

                          {/* Coordinates and AI Analysis */}
                          <div className="my-2.5 space-y-2 text-xs">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200/60">
                              <span>유쾌도: {Math.round(diary.pleasantness ?? diary.x ?? 50)}%</span>
                              <span>에너지: {Math.round(diary.energy ?? (100 - diary.y) ?? 50)}%</span>
                            </div>

                            {/* Reflection Note */}
                            {diary.reflectionNote ? (
                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                                <div className="text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px] text-indigo-600">edit_note</span>
                                  학생의 한 줄 감정 일기
                                </div>
                                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                                  &ldquo;{diary.reflectionNote}&rdquo;
                                </p>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic bg-slate-50/50 p-2 rounded">
                                작성된 메모 일기가 없습니다.
                              </div>
                            )}

                            {/* AI Comment */}
                            {diary.aiComment && (
                              <div className="text-[11px] text-slate-600 flex items-start gap-1">
                                <span className="material-symbols-outlined text-[14px] text-indigo-600 shrink-0 mt-0.5">auto_awesome</span>
                                <span className="line-clamp-2">{diary.aiComment}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Teacher Feedback Box */}
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          {diary.teacherFeedback ? (
                            <div className="bg-indigo-50 border border-indigo-200/80 rounded-lg p-2.5">
                              <div className="flex items-center justify-between text-[10px] font-bold text-indigo-900 mb-0.5">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px] text-indigo-600">favorite</span>
                                  선생님의 응원 피드백 ({diary.teacherFeedbackAuthor || '선생님'})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDiaryForFeedback(diary);
                                    setFeedbackText(diary.teacherFeedback || '');
                                  }}
                                  className="text-indigo-600 hover:underline"
                                >
                                  수정
                                </button>
                              </div>
                              <p className="text-xs text-indigo-950 font-medium">
                                {diary.teacherFeedback}
                              </p>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDiaryForFeedback(diary);
                                setFeedbackText('');
                              }}
                              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <span className="material-symbols-outlined text-[15px] text-indigo-600">chat</span>
                              따뜻한 응원 피드백 남기기
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD STUDENT (SINGLE / BATCH) */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">
                    {isBatchMode ? 'group_add' : 'person_add'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  {isBatchMode ? '학급 전체 학생 일괄 발급' : '새 학생 아이디 발급'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="my-3 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">학년</label>
                  <input
                    type="text"
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    placeholder="예: 3학년"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">학급 (반)</label>
                  <input
                    type="text"
                    value={newClassRoom}
                    onChange={(e) => setNewClassRoom(e.target.value)}
                    placeholder="예: 2반"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {!isBatchMode ? (
                <form onSubmit={handleAddSingleStudent} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">학생 이름 *</label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="예: 김하은"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">출석 번호</label>
                      <input
                        type="text"
                        value={newNumber}
                        onChange={(e) => setNewNumber(e.target.value)}
                        placeholder="예: 5번"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">아이디 코드 (선택)</label>
                      <input
                        type="text"
                        value={newCustomCode}
                        onChange={(e) => setNewCustomCode(e.target.value)}
                        placeholder="미입력시 자동생성"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddStudentModalOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingStudent}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingStudent ? '발급 중...' : '학생 아이디 발급하기'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleBatchAddStudents} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      학생 명단 (줄바꿈 또는 쉼표로 구분) *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={batchNamesText}
                      onChange={(e) => setBatchNamesText(e.target.value)}
                      placeholder="김민준&#10;이서연&#10;박도윤&#10;최지우&#10;정예준"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500 leading-relaxed font-sans"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      각 이름마다 순서대로 번호(1번, 2번...)와 로그인 코드가 자동 발급됩니다.
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddStudentModalOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingStudent}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingStudent ? '일괄 발급 중...' : '학급 전체 발급하기'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TEACHER FEEDBACK */}
      {selectedDiaryForFeedback && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">favorite</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {selectedDiaryForFeedback.studentName || '학생'}에게 응원 피드백 보내기
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    선생님의 피드백은 학생의 감정 일기에 실시간으로 전달됩니다.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDiaryForFeedback(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="my-3 space-y-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                <div className="font-bold text-[11px] text-slate-500 mb-0.5">
                  학생 기록: #{selectedDiaryForFeedback.selectedWord} ({selectedDiaryForFeedback.quadrant})
                </div>
                <p className="italic font-normal">
                  &ldquo;{selectedDiaryForFeedback.reflectionNote || '작성된 메모 없음'}&rdquo;
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  선생님 피드백 메시지
                </label>
                <textarea
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="예: 오늘 발표 준비하느라 정말 고생 많았어! 언제든 힘들면 선생님한테 말해줘."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Quick suggestion tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {[
                  '오늘도 정말 수고 많았어요! 👏',
                  '언제든 선생님한테 편하게 이야기해줘요. 💙',
                  '너의 노력은 늘 빛나고 있어! ✨',
                  '충분히 쉬어가며 힘내자! 🌿'
                ].map((tag, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFeedbackText(tag)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDiaryForFeedback(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={isSubmittingFeedback || !feedbackText.trim()}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingFeedback ? '전송 중...' : '피드백 저장 및 전달'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
