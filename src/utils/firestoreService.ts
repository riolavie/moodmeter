import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  limit
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { MoodLogEntry, StudentAccount, UserProfile, UserRole } from '../types';

// Collection references
const USERS_COL = 'users';
const STUDENTS_COL = 'students';
const DIARIES_COL = 'moodDiaries';

/**
 * Register Teacher with Email & Password
 */
export async function registerTeacher(params: {
  name: string;
  email: string;
  password: string;
  schoolInfo?: string;
  grade?: string;
  classRoom?: string;
}): Promise<UserProfile> {
  // 1. Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    params.email.trim(),
    params.password
  );
  const user = userCredential.user;

  // 2. Update display name in Firebase Auth
  try {
    await updateProfile(user, {
      displayName: params.name.trim()
    });
  } catch (e) {
    console.warn('Failed to update auth profile display name:', e);
  }

  // 3. Create teacher profile in Firestore
  const teacherProfile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: params.name.trim(),
    photoURL: null,
    role: 'teacher',
    grade: params.grade || '3학년',
    classRoom: params.classRoom || '2반',
    createdAt: new Date().toISOString()
  };

  const userRef = doc(db, USERS_COL, user.uid);
  await setDoc(userRef, teacherProfile, { merge: true });

  // 4. Seed initial default student roster for this new teacher's class
  const grade = params.grade || '3학년';
  const classRoom = params.classRoom || '2반';
  const initialNames = ['김하은', '이도윤', '박서연', '최민준', '정수아'];
  
  for (let i = 0; i < initialNames.length; i++) {
    const num = `${i + 1}번`;
    const code = `STU-${grade.replace(/[^0-9]/g, '') || '3'}${classRoom.replace(/[^0-9]/g, '') || '2'}-${String(i + 1).padStart(2, '0')}`;
    await createStudentRoster({
      studentCode: code,
      name: initialNames[i],
      grade,
      classRoom,
      studentNumber: num,
      pinCode: String(1000 + i + 1).slice(-4),
      teacherUid: user.uid,
      teacherEmail: user.email || ''
    }).catch(() => {});
  }

  return teacherProfile;
}

/**
 * Login Teacher with Email & Password
 */
export async function loginTeacher(email: string, password: string): Promise<UserProfile> {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const user = userCredential.user;
  return await syncUserProfile(user.uid, user.email, user.displayName, user.photoURL, 'teacher');
}

/**
 * Sync or retrieve User Profile
 */
export async function syncUserProfile(
  uid: string,
  email: string | null,
  displayName: string | null,
  photoURL: string | null,
  defaultRole: UserRole = 'student'
): Promise<UserProfile> {
  const userRef = doc(db, USERS_COL, uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    return data;
  }

  // Create new profile
  const newProfile: UserProfile = {
    uid,
    email,
    displayName: displayName || (email ? email.split('@')[0] : '선생님'),
    photoURL,
    role: defaultRole,
    createdAt: new Date().toISOString()
  };

  await setDoc(userRef, newProfile);
  return newProfile;
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const userRef = doc(db, USERS_COL, uid);
  await updateDoc(userRef, { role });
}

/**
 * Teacher: Add a single student with generated ID code
 */
export async function createStudentRoster(params: {
  studentCode: string;
  name: string;
  grade: string;
  classRoom: string;
  studentNumber: string;
  pinCode?: string;
  teacherUid: string;
  teacherEmail?: string;
}): Promise<StudentAccount> {
  const docId = `${params.teacherUid}_${params.studentCode.replace(/\s+/g, '_')}`;
  const studentRef = doc(db, STUDENTS_COL, docId);

  const studentData: StudentAccount = {
    id: docId,
    studentCode: params.studentCode.trim(),
    name: params.name.trim(),
    grade: params.grade.trim() || '1학년',
    classRoom: params.classRoom.trim() || '1반',
    studentNumber: params.studentNumber.trim() || '1번',
    pinCode: params.pinCode?.trim() || '1234',
    teacherUid: params.teacherUid,
    teacherEmail: params.teacherEmail || '',
    totalLogsCount: 0,
    createdAt: new Date().toISOString()
  };

  await setDoc(studentRef, studentData, { merge: true });
  return studentData;
}

/**
 * Teacher: Batch create multiple students for a class
 */
export async function batchCreateStudents(
  teacherUid: string,
  teacherEmail: string,
  grade: string,
  classRoom: string,
  studentNames: string[]
): Promise<StudentAccount[]> {
  const created: StudentAccount[] = [];
  for (let i = 0; i < studentNames.length; i++) {
    const name = studentNames[i].trim();
    if (!name) continue;
    const num = `${i + 1}번`;
    const code = `STU-${grade.replace(/[^0-9]/g, '') || '1'}${classRoom.replace(/[^0-9]/g, '') || '1'}-${String(i + 1).padStart(2, '0')}`;
    const student = await createStudentRoster({
      studentCode: code,
      name,
      grade,
      classRoom,
      studentNumber: num,
      pinCode: String(1000 + i + 1).slice(-4),
      teacherUid,
      teacherEmail
    });
    created.push(student);
  }
  return created;
}

/**
 * Teacher: Delete a student
 */
export async function deleteStudent(studentId: string): Promise<void> {
  await deleteDoc(doc(db, STUDENTS_COL, studentId));
}

/**
 * Student / Teacher: Look up student by studentCode & pinCode
 */
export async function verifyStudentLogin(
  studentCode: string,
  pinCode?: string
): Promise<StudentAccount | null> {
  const q = query(
    collection(db, STUDENTS_COL),
    where('studentCode', '==', studentCode.trim())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const student = snap.docs[0].data() as StudentAccount;
  if (pinCode && student.pinCode && student.pinCode !== pinCode.trim()) {
    return null;
  }
  return student;
}

/**
 * Save Mood Diary entry to Firestore
 */
export async function saveMoodDiaryEntry(entry: MoodLogEntry): Promise<void> {
  const diaryRef = doc(db, DIARIES_COL, entry.id);
  const dateStr = entry.dateString || new Date(entry.timestamp).toISOString().split('T')[0];

  const payload: MoodLogEntry = {
    ...entry,
    dateString: dateStr,
    pleasantness: entry.x,
    energy: 100 - entry.y
  };

  await setDoc(diaryRef, payload, { merge: true });

  // If entry is attached to a student, update student's stats
  if (entry.studentId) {
    try {
      const studentRef = doc(db, STUDENTS_COL, entry.studentId);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        const studentData = studentSnap.data() as StudentAccount;
        await updateDoc(studentRef, {
          totalLogsCount: (studentData.totalLogsCount || 0) + 1,
          lastLogAt: entry.timestamp,
          lastQuadrant: entry.quadrant,
          lastWord: entry.selectedWord
        });
      }
    } catch (e) {
      console.warn('Failed to update student summary count:', e);
    }
  }
}

/**
 * Teacher: Add feedback comment to student's mood diary
 */
export async function addTeacherFeedback(
  diaryId: string,
  feedback: string,
  authorName: string
): Promise<void> {
  const diaryRef = doc(db, DIARIES_COL, diaryId);
  await updateDoc(diaryRef, {
    teacherFeedback: feedback.trim(),
    teacherFeedbackAt: Date.now(),
    teacherFeedbackAuthor: authorName
  });
}

/**
 * Real-time listener for a student's diary entries
 */
export function subscribeStudentDiaries(
  studentIdOrUid: string,
  onData: (entries: MoodLogEntry[]) => void
) {
  // Query diaries by studentId or userUid
  const q = query(
    collection(db, DIARIES_COL),
    where('studentId', '==', studentIdOrUid),
    orderBy('timestamp', 'desc'),
    limit(100)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as MoodLogEntry);
      onData(list);
    },
    (err) => {
      console.error('Error subscribing to student diaries:', err);
      // Fallback query without orderBy if index is building
      const fallbackQuery = query(
        collection(db, DIARIES_COL),
        where('studentId', '==', studentIdOrUid),
        limit(100)
      );
      onSnapshot(fallbackQuery, (snap) => {
        const list = snap.docs
          .map((d) => d.data() as MoodLogEntry)
          .sort((a, b) => b.timestamp - a.timestamp);
        onData(list);
      });
    }
  );
}

/**
 * Real-time listener for teacher's student roster
 */
export function subscribeTeacherStudents(
  teacherUid: string,
  onData: (students: StudentAccount[]) => void
) {
  const q = query(
    collection(db, STUDENTS_COL),
    where('teacherUid', '==', teacherUid)
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => d.data() as StudentAccount);
    // Sort by grade, class, number
    list.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
      if (a.classRoom !== b.classRoom) return a.classRoom.localeCompare(b.classRoom);
      return a.studentNumber.localeCompare(b.studentNumber, undefined, { numeric: true });
    });
    onData(list);
  });
}

/**
 * Real-time listener for all diaries in a teacher's classroom
 */
export function subscribeTeacherDiaries(
  teacherUid: string,
  onData: (entries: MoodLogEntry[]) => void
) {
  const q = query(
    collection(db, DIARIES_COL),
    where('teacherUid', '==', teacherUid),
    orderBy('timestamp', 'desc'),
    limit(300)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as MoodLogEntry);
      onData(list);
    },
    (err) => {
      console.error('Error subscribing to teacher classroom diaries:', err);
      // Fallback without composite index
      const fallbackQ = query(
        collection(db, DIARIES_COL),
        where('teacherUid', '==', teacherUid),
        limit(300)
      );
      onSnapshot(fallbackQ, (snap) => {
        const list = snap.docs
          .map((d) => d.data() as MoodLogEntry)
          .sort((a, b) => b.timestamp - a.timestamp);
        onData(list);
      });
    }
  );
}
