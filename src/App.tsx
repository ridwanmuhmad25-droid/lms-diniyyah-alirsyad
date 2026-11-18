import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  EmailAuthProvider,
  User as FirebaseUser,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  signInWithPopup,
  signOut,
  updatePassword,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { BookOpen, Loader2, LogOut, MailCheck, Moon, RefreshCw, Sun } from 'lucide-react';
import { DzikirLoadingScreen } from './components/DzikirLoadingScreen';
import { LoginView } from './components/LoginView';
import { GuruDashboard } from './components/guru/GuruDashboard';
import { LockedExamView } from './components/siswa/LockedExamView';
import { SiswaDashboard } from './components/siswa/SiswaDashboard';
import {
  DEFAULT_TAHFIDZ_TAUGHT_CLASSES,
  GURU_ADMIN_EMAIL,
  GURU_PROFILE,
  getGradeFromClass,
  isAuthorizedGuruEmail,
  isValidClassName,
} from './data/mockData';
import {
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from './lib/firebase';
import {
  buildTugasAndKunciFromDrafts,
  gradeStructuredSubmission,
} from './lib/tugasGrading';
import { computeAllClassProgress } from './lib/classProgress';
import { inferCategoryFromLevel } from './lib/tahfidzUtils';
import {
  AssignmentSubmission,
  AuthSession,
  ClassName,
  GuruSoalDraft,
  JadwalMapelItem,
  JilidBook,
  JilidLetterGrade,
  JilidReadProgress,
  KunciTugasDocument,
  LearningItem,
  MaterialReadRecord,
  NilaiHarianSession,
  NotifikasiItem,
  NotifikasiReadRecord,
  PengumumanItem,
  PengumumanTargetTingkat,
  ProtaItem,
  StatistikKelasItem,
  Student,
  StudentStructuredAnswerValue,
  TahfidzCategory,
  TahfidzRecord,
  TugasDocument,
  UjianTahfidzRecord,
  UjianTahfidzStatus,
} from './types/lms';

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function extractNisFromStudentEmail(email?: string | null): string | null {
  if (!email) return null;
  const match = /^siswa\.([a-z0-9_-]+)@diniyyah\.app$/i.exec(email.trim());
  return match ? match[1] : null;
}

function buildNotifId(nowMs: number): string {
  const inverted = String(Math.max(0, 9999999999999 - nowMs)).padStart(13, '0');
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${inverted}_${suffix}`;
}

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsGuruEmailVerification, setNeedsGuruEmailVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [needsNisLink, setNeedsNisLink] = useState(false);
  const [nisLinkInput, setNisLinkInput] = useState('');
  const [nisLinkError, setNisLinkError] = useState('');
  const [isLinkingNis, setIsLinkingNis] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggleDarkMode = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  // Live Firestore state
  const [students, setStudents] = useState<Student[]>([]);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [tugasList, setTugasList] = useState<TugasDocument[]>([]);
  const [kunciTugasList, setKunciTugasList] = useState<KunciTugasDocument[]>([]);
  const [readRecords, setReadRecords] = useState<MaterialReadRecord[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [tahfidzRecords, setTahfidzRecords] = useState<TahfidzRecord[]>([]);
  const [jilidBooks, setJilidBooks] = useState<JilidBook[]>([]);
  const [jilidProgress, setJilidProgress] = useState<JilidReadProgress[]>([]);
  const [jadwalMapel, setJadwalMapel] = useState<JadwalMapelItem[]>([]);
  const [protaList, setProtaList] = useState<ProtaItem[]>([]);
  const [notifications, setNotifications] = useState<NotifikasiItem[]>([]);
  const [notificationReads, setNotificationReads] = useState<NotifikasiReadRecord[]>([]);
  const [statistikKelas, setStatistikKelas] = useState<StatistikKelasItem[]>([]);
  const [pengumumanList, setPengumumanList] = useState<PengumumanItem[]>([]);
  const [ujianTahfidzList, setUjianTahfidzList] = useState<UjianTahfidzRecord[]>([]);
  const [nilaiHarianList, setNilaiHarianList] = useState<NilaiHarianSession[]>([]);
  const [tahfidzTaughtClasses, setTahfidzTaughtClasses] = useState<ClassName[]>(
    DEFAULT_TAHFIDZ_TAUGHT_CLASSES
  );
  const [guruStudentsLoaded, setGuruStudentsLoaded] = useState(false);
  const [guruItemsLoaded, setGuruItemsLoaded] = useState(false);
  const [guruReadsLoaded, setGuruReadsLoaded] = useState(false);
  const [guruSubmissionsLoaded, setGuruSubmissionsLoaded] = useState(false);
  const [guruStatistikLoaded, setGuruStatistikLoaded] = useState(false);
  const [siswaItemsLoaded, setSiswaItemsLoaded] = useState(false);
  const [siswaSubmissionsLoaded, setSiswaSubmissionsLoaded] = useState(false);
  const [examNotice, setExamNotice] = useState<string | null>(null);

  // Refs to avoid duplicate writes during rapid page flips / auto-grade recovery
  const lastTrackedProgressRef = useRef<Record<string, number>>({});
  const finalizingSubmissionsRef = useRef<Set<string>>(new Set());

  const resetAppData = useCallback(() => {
    setStudents([]);
    setLearningItems([]);
    setTugasList([]);
    setKunciTugasList([]);
    setReadRecords([]);
    setSubmissions([]);
    setTahfidzRecords([]);
    setJilidBooks([]);
    setJilidProgress([]);
    setJadwalMapel([]);
    setProtaList([]);
    setNotifications([]);
    setNotificationReads([]);
    setStatistikKelas([]);
    setPengumumanList([]);
    setUjianTahfidzList([]);
    setNilaiHarianList([]);
    setTahfidzTaughtClasses(DEFAULT_TAHFIDZ_TAUGHT_CLASSES);
    setGuruStudentsLoaded(false);
    setGuruItemsLoaded(false);
    setGuruReadsLoaded(false);
    setGuruSubmissionsLoaded(false);
    setGuruStatistikLoaded(false);
    setSiswaItemsLoaded(false);
    setSiswaSubmissionsLoaded(false);
    setExamNotice(null);
    finalizingSubmissionsRef.current.clear();
  }, []);

  const linkStudentProfile = useCallback(
    async (user: FirebaseUser, nis: string): Promise<Student | null> => {
      const studentPath = `students/${nis}`;
      const studentRef = doc(db, 'students', nis);
      let snap;
      try {
        snap = await getDoc(studentRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, studentPath);
      }

      if (!snap.exists()) {
        return null;
      }

      const data = snap.data() as Student;
      if (data.uid && data.uid !== user.uid) {
        throw new Error(
          `NIS ${nis} sudah ditautkan ke akun lain. Hubungi Guru jika terjadi kesalahan.`
        );
      }

      if (!data.uid) {
        try {
          await updateDoc(studentRef, {
            uid: user.uid,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, studentPath);
        }
      }

      const userPath = `users/${user.uid}`;
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          role: 'siswa',
          studentNis: data.nis,
          nama: data.nama,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, userPath);
      }

      return { ...data, uid: user.uid };
    },
    []
  );

  // Bootstrap session when Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setNeedsGuruEmailVerification(false);
      setNeedsNisLink(false);
      setVerificationSent(false);

      if (!user) {
        setSession(null);
        resetAppData();
        setAuthReady(true);
        return;
      }

      try {
        // 1. Check Guru (Admin) exclusive email
        if (isAuthorizedGuruEmail(user.email)) {
          if (!user.emailVerified) {
            setNeedsGuruEmailVerification(true);
            setSession(null);
            setAuthReady(true);
            return;
          }

          const adminRef = doc(db, 'admins', user.uid);
          try {
            const adminSnap = await getDoc(adminRef);
            if (!adminSnap.exists()) {
              await setDoc(adminRef, {
                uid: user.uid,
                email: GURU_ADMIN_EMAIL,
                nama: GURU_PROFILE.nama,
                createdAt: serverTimestamp(),
              });
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `admins/${user.uid}`);
          }

          try {
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              role: 'guru',
              nama: GURU_PROFILE.nama,
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          }

          setSession({
            role: 'guru',
            userId: user.uid,
            email: GURU_PROFILE.email,
            nama: GURU_PROFILE.nama,
          });
          setAuthReady(true);
          return;
        }

        // 2. Non-admin -> Always routed to Siswa Dashboard
        const nisFromEmail = extractNisFromStudentEmail(user.email);
        if (nisFromEmail) {
          const linked = await linkStudentProfile(user, nisFromEmail);
          if (!linked) {
            // Cleanup newly created unlinked synthetic auth user if NIS doesn't exist in Firestore
            try {
              await deleteUser(user);
            } catch {
              await signOut(auth);
            }
            setAuthError(
              `NIS "${nisFromEmail}" belum terdaftar di Firestore. Minta Guru mendaftarkan NIS tersebut di Manajemen Siswa terlebih dahulu.`
            );
            setSession(null);
            setAuthReady(true);
            return;
          }

          setSession({
            role: 'siswa',
            userId: user.uid,
            nis: linked.nis,
            email: user.email || undefined,
            nama: linked.nama,
            kelas: linked.kelas,
            tingkat: linked.tingkat,
          });
          setAuthReady(true);
          return;
        }

        // 3. Student signed in via Google or custom email: look up /users/{uid}
        let userSnap;
        try {
          userSnap = await getDoc(doc(db, 'users', user.uid));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        }

        const linkedNis = userSnap.exists()
          ? (userSnap.data()?.studentNis as string | undefined)
          : undefined;

        if (linkedNis) {
          const linked = await linkStudentProfile(user, linkedNis);
          if (linked) {
            setSession({
              role: 'siswa',
              userId: user.uid,
              nis: linked.nis,
              email: user.email || undefined,
              nama: linked.nama,
              kelas: linked.kelas,
              tingkat: linked.tingkat,
            });
            setAuthReady(true);
            return;
          }
        }

        // Authenticated non-admin user needs one-time NIS linking
        setNeedsNisLink(true);
        setSession(null);
        setAuthReady(true);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat memuat sesi akun Firebase.';
        setAuthError(message);
        await signOut(auth);
        setSession(null);
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [linkStudentProfile, resetAppData]);

  // Attach real-time Firestore listeners once authenticated and session is resolved
  useEffect(() => {
    if (!firebaseUser || !session) return;

    const unsubscribers: Array<() => void> = [];

    if (session.role === 'guru' && isAuthorizedGuruEmail(session.email)) {
      setGuruStudentsLoaded(false);
      setGuruItemsLoaded(false);
      setGuruReadsLoaded(false);
      setGuruSubmissionsLoaded(false);
      setGuruStatistikLoaded(false);

      unsubscribers.push(
        onSnapshot(
          collection(db, 'students'),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as Student);
            list.sort((a, b) => a.nis.localeCompare(b.nis));
            setStudents(list);
            setGuruStudentsLoaded(true);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'students')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'learningItems'),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as LearningItem);
            list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setLearningItems(list);
            setGuruItemsLoaded(true);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'learningItems')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'readRecords'),
          (snap) => {
            setReadRecords(snap.docs.map((d) => d.data() as MaterialReadRecord));
            setGuruReadsLoaded(true);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'readRecords')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'submissions'),
          (snap) => {
            setSubmissions(snap.docs.map((d) => d.data() as AssignmentSubmission));
            setGuruSubmissionsLoaded(true);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'submissions')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'tahfidzRecords'),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as TahfidzRecord);
            list.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
            setTahfidzRecords(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'tahfidzRecords')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'jilidBooks'),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as JilidBook);
            list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setJilidBooks(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'jilidBooks')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'jilidProgress'),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as JilidReadProgress);
            list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
            setJilidProgress(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'jilidProgress')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'tugas'),
          (snap) => {
            setTugasList(snap.docs.map((d) => d.data() as TugasDocument));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'tugas')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'kunci_tugas'),
          (snap) => {
            setKunciTugasList(snap.docs.map((d) => d.data() as KunciTugasDocument));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'kunci_tugas')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'jadwal_mapel'),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as JadwalMapelItem);
            list.sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
            setJadwalMapel(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'jadwal_mapel')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'prota'),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as ProtaItem);
            list.sort((a, b) => a.bab.localeCompare(b.bab));
            setProtaList(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'prota')
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(
            collection(db, 'notifikasi'),
            where('recipientTag', '==', 'guru'),
            limit(15)
          ),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as NotifikasiItem);
            list.sort((a, b) => b.createdAtMs - a.createdAtMs);
            setNotifications(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'notifikasi')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'statistik_kelas'),
          (snap) => {
            setStatistikKelas(snap.docs.map((d) => d.data() as StatistikKelasItem));
            setGuruStatistikLoaded(true);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'statistik_kelas')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'pengumuman'),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as PengumumanItem);
            list.sort((a, b) => b.createdAtMs - a.createdAtMs);
            setPengumumanList(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'pengumuman')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'ujian_tahfidz'),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as UjianTahfidzRecord);
            list.sort((a, b) => b.createdAtMs - a.createdAtMs);
            setUjianTahfidzList(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'ujian_tahfidz')
        )
      );

      unsubscribers.push(
        onSnapshot(
          doc(db, 'pengaturan_lms', 'tahfidz_kelas'),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() as { kelasAmpu?: unknown };
              if (Array.isArray(data.kelasAmpu)) {
                const valid = data.kelasAmpu.filter(
                  (c): c is ClassName => typeof c === 'string' && isValidClassName(c)
                );
                setTahfidzTaughtClasses(valid);
                return;
              }
            }
            setTahfidzTaughtClasses(DEFAULT_TAHFIDZ_TAUGHT_CLASSES);
          },
          (err) =>
            handleFirestoreError(err, OperationType.GET, 'pengaturan_lms/tahfidz_kelas')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'nilai_harian'),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as NilaiHarianSession);
            list.sort((a, b) => {
              const dateCmp = b.tanggal.localeCompare(a.tanggal);
              if (dateCmp !== 0) return dateCmp;
              return (b.createdAtMs || 0) - (a.createdAtMs || 0);
            });
            setNilaiHarianList(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'nilai_harian')
        )
      );
    } else if (session.role === 'siswa' && session.nis && session.tingkat && session.kelas) {
      setSiswaItemsLoaded(false);
      setSiswaSubmissionsLoaded(false);
      const studentNis = session.nis;
      const studentGrade = session.tingkat;
      const studentClass = session.kelas;
      const studentUid = firebaseUser.uid;

      unsubscribers.push(
        onSnapshot(
          doc(db, 'students', studentNis),
          (snap) => {
            if (snap.exists()) {
              setStudents([snap.data() as Student]);
            }
          },
          (err) =>
            handleFirestoreError(err, OperationType.GET, `students/${studentNis}`)
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(
            collection(db, 'learningItems'),
            where('tingkat', '==', studentGrade)
          ),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as LearningItem);
            list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setLearningItems(list);
            setSiswaItemsLoaded(true);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'learningItems')
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'readRecords'), where('uid', '==', studentUid)),
          (snap) => {
            setReadRecords(snap.docs.map((d) => d.data() as MaterialReadRecord));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'readRecords')
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'submissions'), where('uid', '==', studentUid)),
          (snap) => {
            setSubmissions(snap.docs.map((d) => d.data() as AssignmentSubmission));
            setSiswaSubmissionsLoaded(true);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'submissions')
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(
            collection(db, 'tahfidzRecords'),
            where('studentUid', '==', studentUid)
          ),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as TahfidzRecord);
            list.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
            setTahfidzRecords(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'tahfidzRecords')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'jilidBooks'),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as JilidBook);
            list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setJilidBooks(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'jilidBooks')
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(
            collection(db, 'jilidProgress'),
            where('uid', '==', studentUid)
          ),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as JilidReadProgress);
            setJilidProgress(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'jilidProgress')
        )
      );

      // SECURITY: Siswa only listens to 'tugas' (never 'kunci_tugas')
      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'tugas'), where('tingkat', '==', studentGrade)),
          (snap) => {
            setTugasList(snap.docs.map((d) => d.data() as TugasDocument));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'tugas')
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'jadwal_mapel'), where('kelas', '==', studentClass)),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as JadwalMapelItem);
            list.sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
            setJadwalMapel(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'jadwal_mapel')
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(
            collection(db, 'notifikasi'),
            where('recipientTag', '==', `siswa_${studentGrade}`),
            limit(15)
          ),
          (snap) => {
            const list = snap.docs
              .map((d) => d.data() as NotifikasiItem)
              .filter(
                (n) => n.targetKelas === 'ALL' || n.targetKelas === studentClass
              );
            list.sort((a, b) => b.createdAtMs - a.createdAtMs);
            setNotifications(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'notifikasi')
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(
            collection(db, 'notifikasi_dibaca'),
            where('uid', '==', studentUid)
          ),
          (snap) => {
            setNotificationReads(
              snap.docs.map((d) => d.data() as NotifikasiReadRecord)
            );
          },
          (err) =>
            handleFirestoreError(err, OperationType.LIST, 'notifikasi_dibaca')
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(
            collection(db, 'statistik_kelas'),
            where('tingkat', 'in', ['X', 'XI', 'XII'])
          ),
          (snap) => {
            setStatistikKelas(snap.docs.map((d) => d.data() as StatistikKelasItem));
          },
          (err) =>
            handleFirestoreError(err, OperationType.LIST, 'statistik_kelas')
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(
            collection(db, 'pengumuman'),
            where('targetTingkat', 'in', ['Semua', studentGrade])
          ),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as PengumumanItem);
            list.sort((a, b) => b.createdAtMs - a.createdAtMs);
            setPengumumanList(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'pengumuman')
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(
            collection(db, 'ujian_tahfidz'),
            where('studentUid', '==', studentUid)
          ),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as UjianTahfidzRecord);
            list.sort((a, b) => b.createdAtMs - a.createdAtMs);
            setUjianTahfidzList(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'ujian_tahfidz')
        )
      );

      unsubscribers.push(
        onSnapshot(
          doc(db, 'pengaturan_lms', 'tahfidz_kelas'),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() as { kelasAmpu?: unknown };
              if (Array.isArray(data.kelasAmpu)) {
                const valid = data.kelasAmpu.filter(
                  (c): c is ClassName => typeof c === 'string' && isValidClassName(c)
                );
                setTahfidzTaughtClasses(valid);
                return;
              }
            }
            setTahfidzTaughtClasses(DEFAULT_TAHFIDZ_TAUGHT_CLASSES);
          },
          (err) =>
            handleFirestoreError(err, OperationType.GET, 'pengaturan_lms/tahfidz_kelas')
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(
            collection(db, 'nilai_harian'),
            where('kelas', '==', studentClass)
          ),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as NilaiHarianSession);
            list.sort((a, b) => {
              const dateCmp = b.tanggal.localeCompare(a.tanggal);
              if (dateCmp !== 0) return dateCmp;
              return (b.createdAtMs || 0) - (a.createdAtMs || 0);
            });
            setNilaiHarianList(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'nilai_harian')
        )
      );
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [firebaseUser, session]);

  // Auto-sync privacy-safe aggregated class progress to statistik_kelas when Guru views/updates data
  useEffect(() => {
    if (
      !firebaseUser ||
      session?.role !== 'guru' ||
      !isAuthorizedGuruEmail(session.email) ||
      !guruStudentsLoaded ||
      !guruItemsLoaded ||
      !guruReadsLoaded ||
      !guruSubmissionsLoaded ||
      !guruStatistikLoaded
    ) {
      return;
    }

    const summaries = computeAllClassProgress(
      students,
      learningItems,
      readRecords,
      submissions,
      tahfidzRecords,
      tahfidzTaughtClasses
    );

    const existingMap = new Map(statistikKelas.map((item) => [item.id, item]));
    const changed = summaries.filter((sum) => {
      const prev = existingMap.get(sum.id);
      if (!prev) return true;
      return (
        prev.kelas !== sum.kelas ||
        prev.tingkat !== sum.tingkat ||
        prev.studentCount !== sum.studentCount ||
        prev.readDone !== sum.readDone ||
        prev.readTotal !== sum.readTotal ||
        prev.readPct !== sum.readPct ||
        prev.taskDone !== sum.taskDone ||
        prev.taskTotal !== sum.taskTotal ||
        prev.taskPct !== sum.taskPct ||
        prev.activityPct !== sum.activityPct
      );
    });

    if (changed.length === 0) return;

    const batch = writeBatch(db);
    changed.forEach((sum) => {
      const prev = existingMap.get(sum.id);
      batch.set(doc(db, 'statistik_kelas', sum.id), {
        id: sum.id,
        kelas: sum.kelas,
        tingkat: sum.tingkat,
        studentCount: sum.studentCount,
        readDone: sum.readDone,
        readTotal: sum.readTotal,
        readPct: sum.readPct,
        taskDone: sum.taskDone,
        taskTotal: sum.taskTotal,
        taskPct: sum.taskPct,
        activityPct: sum.activityPct,
        authorUid: prev?.authorUid || firebaseUser.uid,
        updatedAt: serverTimestamp(),
      });
    });

    batch.commit().catch((err) => {
      console.error('Failed to sync statistik_kelas:', err);
    });
  }, [
    firebaseUser,
    session,
    guruStudentsLoaded,
    guruItemsLoaded,
    guruReadsLoaded,
    guruSubmissionsLoaded,
    guruStatistikLoaded,
    students,
    learningItems,
    readRecords,
    submissions,
    tahfidzRecords,
    tahfidzTaughtClasses,
    statistikKelas,
  ]);

  // Keep tahfidzRecords.studentUid & ujian_tahfidz.studentUid synced when Guru views students who claimed their UID
  useEffect(() => {
    if (session?.role !== 'guru') return;
    tahfidzRecords.forEach((rec) => {
      const matchedStudent = students.find((s) => s.nis === rec.studentNis);
      if (matchedStudent?.uid && rec.studentUid !== matchedStudent.uid) {
        updateDoc(doc(db, 'tahfidzRecords', rec.id), {
          studentUid: matchedStudent.uid,
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `tahfidzRecords/${rec.id}`)
        );
      }
    });
    ujianTahfidzList.forEach((exam) => {
      const matchedStudent = students.find((s) => s.nis === exam.studentNis);
      if (matchedStudent?.uid && exam.studentUid !== matchedStudent.uid) {
        updateDoc(doc(db, 'ujian_tahfidz', exam.id), {
          studentUid: matchedStudent.uid,
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `ujian_tahfidz/${exam.id}`)
        );
      }
    });
    submissions.forEach((sub) => {
      const matchedStudent = students.find((s) => s.nis === sub.studentNis);
      if (matchedStudent?.uid && sub.uid !== matchedStudent.uid) {
        const subId = `${sub.itemId}__${sub.studentNis}`;
        updateDoc(doc(db, 'submissions', subId), {
          uid: matchedStudent.uid,
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `submissions/${subId}`)
        );
      }
    });
  }, [session?.role, students, tahfidzRecords, ujianTahfidzList, submissions]);

  // Firestore Mutations
  const handleImportStudents = async (newStudents: Student[]) => {
    const batch = writeBatch(db);
    newStudents.forEach((st) => {
      const ref = doc(db, 'students', st.nis);
      const docData: Record<string, unknown> = {
        id: st.nis,
        nis: st.nis,
        nama: st.nama,
        kelas: st.kelas,
        tingkat: st.tingkat,
        usingDefaultPassword: true,
        updatedAt: serverTimestamp(),
      };
      if (st.tahfidzCategory) docData.tahfidzCategory = st.tahfidzCategory;
      if (st.tahfidzLevel) docData.tahfidzLevel = st.tahfidzLevel;
      batch.set(ref, docData);
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'students');
    }
  };

  const handleUpdateStudentTahfidzProfile = async (
    nis: string,
    tahfidzCategory: TahfidzCategory,
    tahfidzLevel: string
  ) => {
    const path = `students/${nis}`;
    try {
      await updateDoc(doc(db, 'students', nis), {
        tahfidzCategory,
        tahfidzLevel,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleResetStudentPassword = async (nis: string) => {
    const path = `students/${nis}`;
    try {
      await updateDoc(doc(db, 'students', nis), {
        usingDefaultPassword: true,
        lastPasswordResetAt: formatTimestamp(new Date()),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    const path = `students/${student.nis}`;
    try {
      await deleteDoc(doc(db, 'students', student.nis));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleSaveTahfidzTaughtClasses = async (kelasAmpu: ClassName[]) => {
    if (!firebaseUser) return;
    const path = 'pengaturan_lms/tahfidz_kelas';
    try {
      await setDoc(doc(db, 'pengaturan_lms', 'tahfidz_kelas'), {
        id: 'tahfidz_kelas',
        kelasAmpu,
        authorUid: firebaseUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const finalizeSubmissionAutoGrading = useCallback(
    async (
      submissionId: string,
      itemId: string,
      structuredAnswers: Record<string, StudentStructuredAnswerValue>
    ) => {
      if (finalizingSubmissionsRef.current.has(submissionId)) {
        return null;
      }
      finalizingSubmissionsRef.current.add(submissionId);
      const kunciPath = `kunci_tugas/${itemId}`;
      const subPath = `submissions/${submissionId}`;

      try {
        let kunciSnap;
        try {
          kunciSnap = await getDoc(doc(db, 'kunci_tugas', itemId));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, kunciPath);
        }
        if (!kunciSnap.exists()) {
          return null;
        }
        const kunciDoc = kunciSnap.data() as KunciTugasDocument;
        const graded = gradeStructuredSubmission(kunciDoc, structuredAnswers);

        const gradeUpdate: Record<string, unknown> = {
          itemScores: graded.itemScores,
          autoScore: graded.autoScore,
          essayScore: graded.essayScore,
          finalScore: graded.finalScore,
          maxScore: graded.maxScore,
          gradingStatus: graded.gradingStatus,
          updatedAt: serverTimestamp(),
        };
        if (graded.gradingStatus === 'graded') {
          gradeUpdate.gradedAt = formatTimestamp(new Date());
        }

        try {
          await updateDoc(doc(db, 'submissions', submissionId), gradeUpdate);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, subPath);
        }

        return graded;
      } finally {
        finalizingSubmissionsRef.current.delete(submissionId);
      }
    },
    []
  );

  // Recover any completed submission stuck in 'pending_auto_grade'
  useEffect(() => {
    if (session?.role !== 'siswa' || !siswaSubmissionsLoaded) return;
    submissions.forEach((sub) => {
      if (
        sub.status === 'Selesai' &&
        sub.sessionStatus === 'completed' &&
        sub.gradingStatus === 'pending_auto_grade'
      ) {
        const subId = `${sub.itemId}__${sub.studentNis}`;
        void finalizeSubmissionAutoGrading(
          subId,
          sub.itemId,
          sub.structuredAnswers || {}
        );
      }
    });
  }, [session?.role, siswaSubmissionsLoaded, submissions, finalizeSubmissionAutoGrading]);

  const handleSaveLearningItemWithSoal = async (
    item: LearningItem,
    soalDrafts: GuruSoalDraft[],
    isEdit: boolean
  ) => {
    if (!firebaseUser) return;
    const ownerUid = item.authorUid || firebaseUser.uid;
    const path = `learningItems/${item.id}`;
    const payload: Record<string, unknown> = {
      id: item.id,
      type: item.type,
      judul: item.judul,
      tingkat: item.tingkat,
      targetKelas: item.targetKelas,
      mapel: item.mapel,
      deskripsi: item.deskripsi,
      konten: item.konten,
      createdAt: item.createdAt,
      authorName: item.authorName || GURU_PROFILE.nama,
      authorUid: ownerUid,
      updatedAt: serverTimestamp(),
    };
    if (item.lampiranNama) payload.lampiranNama = item.lampiranNama;
    if (item.tenggat) payload.tenggat = item.tenggat;
    if (typeof item.durasiMenit === 'number') {
      payload.durasiMenit = item.durasiMenit;
    }
    if (
      item.mapel === 'Tahfidz/Tahsin' &&
      item.type === 'tugas' &&
      item.targetPeserta
    ) {
      payload.targetPeserta = item.targetPeserta;
    }
    if (item.submissionMode) {
      payload.submissionMode = item.submissionMode;
    }

    const hasStructured = item.type === 'tugas' && soalDrafts.length > 0;
    const batch = writeBatch(db);

    if (hasStructured) {
      const { tugasDoc, kunciDoc, totalPoin, hasEssay } =
        buildTugasAndKunciFromDrafts(item, soalDrafts, ownerUid);
      payload.hasStructuredSoal = true;
      payload.totalPoin = totalPoin;
      payload.hasEssay = hasEssay;
      payload.soalCount = soalDrafts.length;

      batch.set(doc(db, 'learningItems', item.id), payload);
      batch.set(doc(db, 'tugas', item.id), {
        ...tugasDoc,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'kunci_tugas', item.id), {
        ...kunciDoc,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(doc(db, 'learningItems', item.id), payload);
      if (isEdit) {
        if (tugasList.some((t) => t.itemId === item.id)) {
          batch.delete(doc(db, 'tugas', item.id));
        }
        if (kunciTugasList.some((k) => k.itemId === item.id)) {
          batch.delete(doc(db, 'kunci_tugas', item.id));
        }
      }
    }

    // Create notification for target grade/class students
    const nowMs = Date.now();
    const notifId = buildNotifId(nowMs);
    const notifTitlePrefix = isEdit ? 'Pembaruan' : 'Baru';
    const typeLabel = item.type === 'materi' ? 'Materi' : 'Tugas';
    const kelasLabel =
      item.targetKelas === 'ALL' ? `Kelas ${item.tingkat}` : item.targetKelas;
    batch.set(doc(db, 'notifikasi', notifId), {
      id: notifId,
      recipientTag: `siswa_${item.tingkat}`,
      targetKelas: item.targetKelas,
      type: item.type,
      itemId: item.id,
      mapel: item.mapel,
      judul: `${notifTitlePrefix} ${typeLabel}: ${item.judul}`.slice(0, 200),
      pesan: `${item.authorName || GURU_PROFILE.nama} ${
        isEdit ? 'memperbarui' : 'mempublikasikan'
      } ${typeLabel.toLowerCase()} ${item.mapel} untuk ${kelasLabel}.`.slice(0, 500),
      createdAt: formatTimestamp(new Date(nowMs)),
      createdAtMs: nowMs,
      senderUid: firebaseUser.uid,
      isRead: false,
      updatedAt: serverTimestamp(),
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, isEdit ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleDeleteLearningItem = async (itemId: string) => {
    const path = `learningItems/${itemId}`;
    const batch = writeBatch(db);
    batch.delete(doc(db, 'learningItems', itemId));
    if (tugasList.some((t) => t.itemId === itemId)) {
      batch.delete(doc(db, 'tugas', itemId));
    }
    if (kunciTugasList.some((k) => k.itemId === itemId)) {
      batch.delete(doc(db, 'kunci_tugas', itemId));
    }

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleMarkAsRead = async (studentNis: string, itemId: string) => {
    if (!firebaseUser) return;
    const recordId = `${itemId}__${studentNis}`;
    const alreadyRead = readRecords.some(
      (r) => r.itemId === itemId && r.studentNis === studentNis
    );
    if (alreadyRead) return;

    const path = `readRecords/${recordId}`;
    try {
      await setDoc(doc(db, 'readRecords', recordId), {
        itemId,
        studentNis,
        uid: firebaseUser.uid,
        readAt: formatTimestamp(new Date()),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleStartExamSession = async (
    studentNis: string,
    item: LearningItem
  ) => {
    if (!firebaseUser) return;
    const submissionId = `${item.id}__${studentNis}`;
    const path = `submissions/${submissionId}`;
    const existing = submissions.find(
      (s) => s.itemId === item.id && s.studentNis === studentNis
    );
    if (existing?.sessionStatus === 'in_progress' || existing?.status === 'Selesai') {
      return;
    }

    const now = new Date();
    const payload = {
      itemId: item.id,
      studentNis,
      uid: firebaseUser.uid,
      status: 'Belum',
      sessionStatus: 'in_progress',
      jawaban: existing?.jawaban || '',
      startedAt: formatTimestamp(now),
      startedAtMs: now.getTime(),
      durasiMenit: item.durasiMenit ?? 30,
      violationCount: 0,
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'submissions', submissionId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleAutoSaveAssignmentDraft = async (
    studentNis: string,
    itemId: string,
    jawaban: string,
    fileNama?: string,
    structuredAnswers?: Record<string, StudentStructuredAnswerValue>
  ) => {
    if (!firebaseUser) return;
    const submissionId = `${itemId}__${studentNis}`;
    const path = `submissions/${submissionId}`;
    const payload: Record<string, unknown> = {
      jawaban,
      fileNama: fileNama ?? '',
      lastSavedAt: formatTimestamp(new Date()),
      updatedAt: serverTimestamp(),
    };
    if (structuredAnswers !== undefined) {
      payload.structuredAnswers = structuredAnswers;
    }

    try {
      await updateDoc(doc(db, 'submissions', submissionId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleIncrementAssignmentViolation = async (
    studentNis: string,
    itemId: string
  ) => {
    if (!firebaseUser) return;
    const submissionId = `${itemId}__${studentNis}`;
    const path = `submissions/${submissionId}`;
    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        violationCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleSubmitAssignment = async (
    studentNis: string,
    itemId: string,
    jawaban: string,
    fileNama?: string,
    isAutoSubmit?: boolean,
    structuredAnswers?: Record<string, StudentStructuredAnswerValue>
  ) => {
    if (!firebaseUser) return;
    const submissionId = `${itemId}__${studentNis}`;
    const path = `submissions/${submissionId}`;
    const existing = submissions.find(
      (s) => s.itemId === itemId && s.studentNis === studentNis
    );
    const hasStructured = tugasList.some((t) => t.itemId === itemId);
    const now = new Date();

    try {
      // Phase 1: Commit submission as 'Selesai' so answers are locked and kunci_tugas read unlocks
      if (existing) {
        const updatePayload: Record<string, unknown> = {
          status: 'Selesai',
          sessionStatus: 'completed',
          jawaban,
          submittedAt: formatTimestamp(now),
          submittedAtMs: now.getTime(),
          gradingStatus: hasStructured ? 'pending_auto_grade' : 'graded',
          updatedAt: serverTimestamp(),
        };
        if (structuredAnswers !== undefined) {
          updatePayload.structuredAnswers = structuredAnswers;
        }
        if (fileNama !== undefined) {
          updatePayload.fileNama = fileNama;
        }
        await updateDoc(doc(db, 'submissions', submissionId), updatePayload);
      } else {
        const createPayload: Record<string, unknown> = {
          itemId,
          studentNis,
          uid: firebaseUser.uid,
          status: 'Selesai',
          sessionStatus: 'completed',
          jawaban,
          submittedAt: formatTimestamp(now),
          submittedAtMs: now.getTime(),
          gradingStatus: hasStructured ? 'pending_auto_grade' : 'graded',
          updatedAt: serverTimestamp(),
        };
        if (structuredAnswers !== undefined) {
          createPayload.structuredAnswers = structuredAnswers;
        }
        if (fileNama) {
          createPayload.fileNama = fileNama;
        }
        await setDoc(doc(db, 'submissions', submissionId), createPayload);
      }

      // Phase 2: Fetch kunci_tugas/{itemId} ONLY AFTER submission is 'Selesai' and compute auto-grade
      let gradedResult = null;
      if (hasStructured) {
        gradedResult = await finalizeSubmissionAutoGrading(
          submissionId,
          itemId,
          structuredAnswers || existing?.structuredAnswers || {}
        );
      }

      // Phase 3: Notify Guru about student assignment submission
      const targetItem = learningItems.find((i) => i.id === itemId);
      const targetStudent = students.find((s) => s.nis === studentNis);
      const notifNowMs = Date.now();
      const notifId = buildNotifId(notifNowMs);
      const studentDisplayName =
        targetStudent?.nama || session?.nama || `NIS ${studentNis}`;
      const kelasDisplay =
        targetStudent?.kelas || session?.kelas || 'ALL';
      try {
        await setDoc(doc(db, 'notifikasi', notifId), {
          id: notifId,
          recipientTag: 'guru',
          targetKelas: kelasDisplay,
          type: 'submission',
          itemId,
          mapel: targetItem?.mapel || 'Bahasa Arab',
          judul: `${studentDisplayName} mengumpulkan tugas`.slice(0, 200),
          pesan: `${targetItem?.judul || 'Tugas'} (${kelasDisplay})${
            gradedResult?.gradingStatus === 'waiting_essay'
              ? ' — Menunggu Koreksi Essay'
              : ''
          }`.slice(0, 500),
          studentNis,
          studentName: studentDisplayName.slice(0, 120),
          createdAt: formatTimestamp(new Date(notifNowMs)),
          createdAtMs: notifNowMs,
          senderUid: firebaseUser.uid,
          isRead: false,
          updatedAt: serverTimestamp(),
        });
      } catch (notifErr) {
        handleFirestoreError(notifErr, OperationType.CREATE, `notifikasi/${notifId}`);
      }

      if (isAutoSubmit) {
        setExamNotice(
          gradedResult
            ? gradedResult.gradingStatus === 'waiting_essay'
              ? `Waktu habis & jawaban terkumpul otomatis. Status: Menunggu Koreksi Essay (Skor sementara ${gradedResult.finalScore}/${gradedResult.maxScore}).`
              : `Waktu habis & jawaban terkumpul otomatis. Nilai Akhir Anda: ${gradedResult.finalScore}/${gradedResult.maxScore}.`
            : 'Waktu pengerjaan telah habis. Draf jawaban terakhir Anda berhasil dikumpulkan otomatis ke Firestore.'
        );
      } else if (existing?.sessionStatus === 'in_progress') {
        setExamNotice(
          gradedResult
            ? gradedResult.gradingStatus === 'waiting_essay'
              ? `Jawaban berhasil dikumpulkan. Status: Menunggu Koreksi Essay Guru (Skor otomatis sementara ${gradedResult.finalScore}/${gradedResult.maxScore}).`
              : `Jawaban berhasil dikumpulkan. Nilai Akhir Anda: ${gradedResult.finalScore}/${gradedResult.maxScore}.`
            : 'Jawaban tugas berhasil dikumpulkan dan akses dashboard telah dibuka kembali.'
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleSaveTeacherGrading = async (
    submissionId: string,
    itemScores: Record<string, number>,
    autoScore: number,
    essayScore: number,
    finalScore: number,
    maxScore: number,
    catatanGuru: string
  ) => {
    const path = `submissions/${submissionId}`;
    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        itemScores,
        autoScore,
        essayScore,
        finalScore,
        maxScore,
        catatanGuru,
        gradingStatus: 'graded',
        gradedAt: formatTimestamp(new Date()),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleSaveJilidSubmissionChecklist = async ({
    item,
    student,
    checked,
    nilaiHuruf,
    catatanGuru,
  }: {
    item: LearningItem;
    student: Student;
    checked: boolean;
    nilaiHuruf?: JilidLetterGrade;
    catatanGuru?: string;
  }) => {
    if (!firebaseUser) return;
    const submissionId = `${item.id}__${student.nis}`;
    const path = `submissions/${submissionId}`;
    const existing = submissions.find(
      (s) => s.itemId === item.id && s.studentNis === student.nis
    );
    const now = new Date();
    const nowFormatted = formatTimestamp(now);
    const nowMs = now.getTime();
    const resolvedUid =
      student.uid ||
      (existing?.uid && !existing.uid.startsWith('pending__') ? existing.uid : undefined) ||
      `pending__${student.nis}`;

    const payload: Record<string, unknown> = {
      itemId: item.id,
      studentNis: student.nis,
      uid: resolvedUid,
      status: checked ? 'Selesai' : 'Belum',
      checkedByGuru: checked,
      updatedAt: serverTimestamp(),
    };

    if (checked) {
      payload.sessionStatus = 'completed';
      payload.checkedAt = existing?.checkedAt || nowFormatted;
      payload.submittedAt = existing?.submittedAt || nowFormatted;
      payload.submittedAtMs = existing?.submittedAtMs || nowMs;
      payload.gradedBy = GURU_PROFILE.nama;
      if (nilaiHuruf) {
        payload.nilaiHuruf = nilaiHuruf;
        payload.gradingStatus = 'graded';
        payload.gradedAt = nowFormatted;
      }
      if (catatanGuru && catatanGuru.trim()) {
        payload.catatanGuru = catatanGuru.trim();
      }
    }

    try {
      await setDoc(doc(db, 'submissions', submissionId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleChangeStudentPassword = async (
    studentNis: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ ok: boolean; message: string }> => {
    if (!firebaseUser || !firebaseUser.email) {
      return { ok: false, message: 'Sesi pengguna tidak ditemukan.' };
    }

    const usesPasswordProvider = firebaseUser.providerData.some(
      (p) => p.providerId === 'password'
    );
    if (!usesPasswordProvider) {
      return {
        ok: false,
        message:
          'Akun Anda masuk menggunakan Google Sign-In. Perubahan password dilakukan melalui pengaturan akun Google Anda.',
      };
    }

    try {
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);

      await updateDoc(doc(db, 'students', studentNis), {
        usingDefaultPassword: false,
        updatedAt: serverTimestamp(),
      });

      return {
        ok: true,
        message:
          'Password Firebase Auth berhasil diperbarui. Gunakan password baru pada sesi login berikutnya.',
      };
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        return { ok: false, message: 'Password saat ini tidak sesuai.' };
      }
      if (code === 'auth/weak-password') {
        return { ok: false, message: 'Password baru terlalu lemah (min. 6 karakter).' };
      }
      return {
        ok: false,
        message: 'Gagal memperbarui password. Silakan keluar lalu login ulang dan coba kembali.',
      };
    }
  };

  const handleAddTahfidzRecord = async (
    recordData: Omit<TahfidzRecord, 'id' | 'tanggal'>
  ) => {
    if (!firebaseUser) return;
    const id = `thf-${Date.now()}`;
    const path = `tahfidzRecords/${id}`;
    const matchedStudent = students.find((s) => s.nis === recordData.studentNis);
    const studentUid = recordData.studentUid || matchedStudent?.uid;

    const payload: Record<string, unknown> = {
      id,
      studentNis: recordData.studentNis,
      jenisSetoran: recordData.jenisSetoran,
      capaian: recordData.capaian,
      nilai: recordData.nilai,
      keputusan: recordData.keputusan,
      catatanGuru: recordData.catatanGuru,
      tanggal: formatTimestamp(new Date()),
      guruNama: GURU_PROFILE.nama,
      authorUid: firebaseUser.uid,
      updatedAt: serverTimestamp(),
    };
    if (studentUid) {
      payload.studentUid = studentUid;
    }

    try {
      await setDoc(doc(db, 'tahfidzRecords', id), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleDeleteTahfidzRecord = async (recordId: string) => {
    const path = `tahfidzRecords/${recordId}`;
    try {
      await deleteDoc(doc(db, 'tahfidzRecords', recordId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleAddUjianTahfidz = async (data: {
    student: Student;
    tanggalUjian: string;
    penguji: string;
    levelDiujikan: string;
    nilai: string;
    status: UjianTahfidzStatus;
    naikKeLevel?: string;
    catatan: string;
  }) => {
    if (!firebaseUser) return;
    const nowMs = Date.now();
    const id = `ujt-${nowMs}-${Math.random().toString(36).slice(2, 6)}`;
    const path = `ujian_tahfidz/${id}`;
    const batch = writeBatch(db);

    const examPayload: Record<string, unknown> = {
      id,
      studentNis: data.student.nis,
      studentName: data.student.nama,
      kelas: data.student.kelas,
      tingkat: data.student.tingkat,
      tanggalUjian: data.tanggalUjian,
      penguji: data.penguji.trim() || GURU_PROFILE.nama,
      levelDiujikan: data.levelDiujikan,
      nilai: data.nilai.trim(),
      status: data.status,
      catatan: data.catatan.trim() || 'Tetap semangat murajaah hafalan dan perbaiki tajwid.',
      authorUid: firebaseUser.uid,
      createdAtMs: nowMs,
      updatedAt: serverTimestamp(),
    };
    if (data.student.uid) {
      examPayload.studentUid = data.student.uid;
    }
    if (data.status === 'Lulus' && data.naikKeLevel) {
      examPayload.naikKeLevel = data.naikKeLevel;
    }

    batch.set(doc(db, 'ujian_tahfidz', id), examPayload);

    if (data.status === 'Lulus' && data.naikKeLevel) {
      batch.update(doc(db, 'students', data.student.nis), {
        tahfidzLevel: data.naikKeLevel,
        tahfidzCategory: inferCategoryFromLevel(data.naikKeLevel),
        updatedAt: serverTimestamp(),
      });
    } else if (!data.student.tahfidzLevel) {
      batch.update(doc(db, 'students', data.student.nis), {
        tahfidzLevel: data.levelDiujikan,
        tahfidzCategory: inferCategoryFromLevel(data.levelDiujikan),
        updatedAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleDeleteUjianTahfidz = async (examId: string) => {
    const path = `ujian_tahfidz/${examId}`;
    try {
      await deleteDoc(doc(db, 'ujian_tahfidz', examId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleSaveNilaiHarian = async (payload: {
    id?: string;
    mapel: NilaiHarianSession['mapel'];
    kelas: ClassName;
    tanggal: string;
    judul: string;
    nilaiMap: Record<string, number>;
    createdAtMs?: number;
  }): Promise<string> => {
    if (!firebaseUser) return '';
    const nowMs = Date.now();
    const id =
      payload.id ||
      `nh-${nowMs}-${Math.random().toString(36).slice(2, 7)}`;
    const existing = payload.id
      ? nilaiHarianList.find((s) => s.id === payload.id)
      : undefined;
    const cleanNilaiMap: Record<string, number> = {};
    Object.entries(payload.nilaiMap).forEach(([nis, val]) => {
      if (typeof val === 'number' && !Number.isNaN(val)) {
        cleanNilaiMap[nis] = Math.min(100, Math.max(0, Math.round(val)));
      }
    });
    const path = `nilai_harian/${id}`;
    try {
      await setDoc(doc(db, 'nilai_harian', id), {
        id,
        mapel: payload.mapel,
        kelas: payload.kelas,
        tingkat: getGradeFromClass(payload.kelas),
        tanggal: payload.tanggal,
        judul: payload.judul.trim(),
        nilaiMap: cleanNilaiMap,
        authorUid: existing?.authorUid || firebaseUser.uid,
        createdAtMs: existing?.createdAtMs || payload.createdAtMs || nowMs,
        updatedAt: serverTimestamp(),
      });
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      return id;
    }
  };

  const handleDeleteNilaiHarian = async (sessionId: string) => {
    const path = `nilai_harian/${sessionId}`;
    try {
      await deleteDoc(doc(db, 'nilai_harian', sessionId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleAddJilidBook = async (book: JilidBook) => {
    if (!firebaseUser) return;
    const path = `jilidBooks/${book.id}`;
    const cleanPages = book.pages.map((p) => {
      const pageObj: Record<string, unknown> = {
        pageNumber: p.pageNumber,
        imageUrl: p.imageUrl,
      };
      if (p.fileName) pageObj.fileName = p.fileName;
      return pageObj;
    });

    try {
      await setDoc(doc(db, 'jilidBooks', book.id), {
        id: book.id,
        judul: book.judul,
        deskripsi: book.deskripsi,
        pages: cleanPages,
        createdAt: book.createdAt,
        authorName: GURU_PROFILE.nama,
        authorUid: firebaseUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleDeleteJilidBook = async (book: JilidBook) => {
    const path = `jilidBooks/${book.id}`;
    try {
      await deleteDoc(doc(db, 'jilidBooks', book.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleUpdateJilidProgress = useCallback(
    (
      studentNis: string,
      bookId: string,
      lastPageRead: number,
      totalPages: number
    ) => {
      if (!firebaseUser) return;
      const progressId = `${bookId}__${studentNis}`;
      if (lastTrackedProgressRef.current[progressId] === lastPageRead) {
        return;
      }
      lastTrackedProgressRef.current[progressId] = lastPageRead;

      const path = `jilidProgress/${progressId}`;
      setDoc(doc(db, 'jilidProgress', progressId), {
        bookId,
        studentNis,
        uid: firebaseUser.uid,
        lastPageRead,
        totalPages,
        updatedAt: formatTimestamp(new Date()),
        serverUpdatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.WRITE, path));
    },
    [firebaseUser]
  );

  const handleAddJadwalMapel = async (
    jadwalData: Omit<JadwalMapelItem, 'id' | 'authorUid'>
  ) => {
    if (!firebaseUser) return;
    const id = `jdw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const path = `jadwal_mapel/${id}`;
    try {
      await setDoc(doc(db, 'jadwal_mapel', id), {
        id,
        hari: jadwalData.hari,
        jamMulai: jadwalData.jamMulai,
        jamSelesai: jadwalData.jamSelesai,
        mapel: jadwalData.mapel,
        tingkat: jadwalData.tingkat,
        kelas: jadwalData.kelas,
        authorUid: firebaseUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleUpdateJadwalMapel = async (
    jadwalId: string,
    jadwalData: Omit<JadwalMapelItem, 'id' | 'authorUid'>
  ) => {
    if (!firebaseUser) return;
    const path = `jadwal_mapel/${jadwalId}`;
    try {
      await updateDoc(doc(db, 'jadwal_mapel', jadwalId), {
        hari: jadwalData.hari,
        jamMulai: jadwalData.jamMulai,
        jamSelesai: jadwalData.jamSelesai,
        mapel: jadwalData.mapel,
        tingkat: jadwalData.tingkat,
        kelas: jadwalData.kelas,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDeleteJadwalMapel = async (jadwalId: string) => {
    const path = `jadwal_mapel/${jadwalId}`;
    try {
      await deleteDoc(doc(db, 'jadwal_mapel', jadwalId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleAddPengumuman = async (data: {
    judul: string;
    isi: string;
    targetTingkat: PengumumanTargetTingkat;
    penting: boolean;
  }) => {
    if (!firebaseUser) return;
    const nowMs = Date.now();
    const id = `ann-${nowMs}-${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = formatTimestamp(new Date(nowMs));
    const path = `pengumuman/${id}`;
    const batch = writeBatch(db);

    batch.set(doc(db, 'pengumuman', id), {
      id,
      judul: data.judul.trim().slice(0, 150),
      isi: data.isi.trim().slice(0, 1000),
      targetTingkat: data.targetTingkat,
      penting: data.penting,
      authorName: GURU_PROFILE.nama,
      authorUid: firebaseUser.uid,
      createdAt,
      createdAtMs: nowMs,
      updatedAt: serverTimestamp(),
    });

    const recipientTags: Array<'siswa_X' | 'siswa_XI' | 'siswa_XII'> =
      data.targetTingkat === 'Semua'
        ? ['siswa_X', 'siswa_XI', 'siswa_XII']
        : [`siswa_${data.targetTingkat}`];

    recipientTags.forEach((tag, idx) => {
      const notifId = buildNotifId(nowMs + idx);
      batch.set(doc(db, 'notifikasi', notifId), {
        id: notifId,
        recipientTag: tag,
        targetKelas: 'ALL',
        type: 'pengumuman',
        itemId: id,
        mapel: 'Umum',
        judul: `${data.penting ? '[Penting] ' : ''}${data.judul.trim()}`.slice(0, 200),
        pesan: data.isi.trim().slice(0, 500),
        createdAt,
        createdAtMs: nowMs,
        senderUid: firebaseUser.uid,
        isRead: false,
        updatedAt: serverTimestamp(),
      });
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleDeletePengumuman = async (pengumumanId: string) => {
    const path = `pengumuman/${pengumumanId}`;
    try {
      await deleteDoc(doc(db, 'pengumuman', pengumumanId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleAddProtaItem = async (
    protaData: Omit<ProtaItem, 'id' | 'authorUid'>
  ) => {
    if (!firebaseUser) return;
    const id = `prota-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const path = `prota/${id}`;
    const payload: Record<string, unknown> = {
      id,
      mapel: protaData.mapel,
      tingkat: protaData.tingkat,
      semester: protaData.semester,
      bab: protaData.bab,
      selesai: protaData.selesai,
      authorUid: firebaseUser.uid,
      updatedAt: serverTimestamp(),
    };
    if (protaData.targetBulan) {
      payload.targetBulan = protaData.targetBulan;
    }
    try {
      await setDoc(doc(db, 'prota', id), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleToggleProtaItem = async (item: ProtaItem) => {
    const path = `prota/${item.id}`;
    try {
      await updateDoc(doc(db, 'prota', item.id), {
        selesai: !item.selesai,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDeleteProtaItem = async (protaId: string) => {
    const path = `prota/${protaId}`;
    try {
      await deleteDoc(doc(db, 'prota', protaId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleMarkNotificationRead = useCallback(
    async (notif: NotifikasiItem) => {
      if (!firebaseUser || !session) return;
      if (session.role === 'guru') {
        if (notif.isRead) return;
        const path = `notifikasi/${notif.id}`;
        try {
          await updateDoc(doc(db, 'notifikasi', notif.id), {
            isRead: true,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      } else {
        const readId = `${notif.id}__${firebaseUser.uid}`;
        if (notificationReads.some((r) => r.id === readId || r.notifId === notif.id)) {
          return;
        }
        const path = `notifikasi_dibaca/${readId}`;
        try {
          await setDoc(doc(db, 'notifikasi_dibaca', readId), {
            id: readId,
            notifId: notif.id,
            uid: firebaseUser.uid,
            readAt: formatTimestamp(new Date()),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    },
    [firebaseUser, session, notificationReads]
  );

  const handleMarkAllNotificationsRead = useCallback(async () => {
    if (!firebaseUser || !session) return;
    if (session.role === 'guru') {
      const unread = notifications.filter((n) => !n.isRead);
      if (unread.length === 0) return;
      const batch = writeBatch(db);
      unread.forEach((n) => {
        batch.update(doc(db, 'notifikasi', n.id), {
          isRead: true,
          updatedAt: serverTimestamp(),
        });
      });
      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'notifikasi');
      }
    } else {
      const readSet = new Set(notificationReads.map((r) => r.notifId));
      const unread = notifications.filter((n) => !readSet.has(n.id));
      if (unread.length === 0) return;
      const batch = writeBatch(db);
      const nowStr = formatTimestamp(new Date());
      unread.forEach((n) => {
        const readId = `${n.id}__${firebaseUser.uid}`;
        batch.set(doc(db, 'notifikasi_dibaca', readId), {
          id: readId,
          notifId: n.id,
          uid: firebaseUser.uid,
          readAt: nowStr,
          updatedAt: serverTimestamp(),
        });
      });
      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'notifikasi_dibaca');
      }
    }
  }, [firebaseUser, session, notifications, notificationReads]);

  const handleLogout = async () => {
    lastTrackedProgressRef.current = {};
    await signOut(auth);
  };

  const handleLinkNisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setNisLinkError('');
    const nis = nisLinkInput.trim();
    if (!nis || !/^[a-zA-Z0-9_-]+$/.test(nis)) {
      setNisLinkError('Masukkan format NIS yang valid.');
      return;
    }

    setIsLinkingNis(true);
    try {
      const linked = await linkStudentProfile(firebaseUser, nis);
      if (!linked) {
        setNisLinkError(
          `NIS "${nis}" belum ditemukan di Firestore. Pastikan Guru sudah menambahkan data Anda.`
        );
        return;
      }
      setNeedsNisLink(false);
      setSession({
        role: 'siswa',
        userId: firebaseUser.uid,
        nis: linked.nis,
        email: firebaseUser.email || undefined,
        nama: linked.nama,
        kelas: linked.kelas,
        tingkat: linked.tingkat,
      });
    } catch (err) {
      setNisLinkError(
        err instanceof Error ? err.message : 'Gagal menautkan NIS siswa.'
      );
    } finally {
      setIsLinkingNis(false);
    }
  };

  if (!authReady) {
    return <DzikirLoadingScreen />;
  }

  if (needsGuruEmailVerification && firebaseUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
                <MailCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Verifikasi Email Guru Diperlukan
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">{firebaseUser.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={isDark ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Aturan keamanan Firestore mewajibkan akun admin (<span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{GURU_ADMIN_EMAIL}</span>) berstatus terverifikasi. Klik tombol di bawah untuk langsung masuk dengan Google atau kirim tautan verifikasi email.
          </p>

          {verificationSent && (
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-200">
              Email verifikasi telah dikirim ke {firebaseUser.email}. Periksa kotak masuk lalu klik Muat Ulang Status.
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => signInWithPopup(auth, googleProvider)}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold shadow-lg shadow-amber-500/25 transition-all"
            >
              Masuk Langsung dengan Google ({GURU_ADMIN_EMAIL})
            </button>

            <button
              type="button"
              onClick={async () => {
                await sendEmailVerification(firebaseUser);
                setVerificationSent(true);
              }}
              className="w-full min-h-[42px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 transition-colors"
            >
              Kirim Email Verifikasi
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={async () => {
                  await firebaseUser.reload();
                  if (auth.currentUser?.emailVerified) {
                    window.location.reload();
                  }
                }}
                className="min-h-[40px] px-3 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-indigo-600 dark:text-cyan-400 flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Muat Ulang</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[40px] px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-rose-50 dark:hover:bg-rose-500/15 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (needsNisLink && firebaseUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Tautkan NIS Siswa
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{firebaseUser.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={isDark ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Akun Anda masuk ke portal Siswa. Masukkan NIS yang telah didaftarkan Guru untuk membuka mata pelajaran kelas Anda.
          </p>

          <form onSubmit={handleLinkNisSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="link-nis-input"
                className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
              >
                Nomor Induk Siswa (NIS)
              </label>
              <input
                id="link-nis-input"
                type="text"
                required
                value={nisLinkInput}
                onChange={(e) => setNisLinkInput(e.target.value)}
                placeholder="Contoh: 241001"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            {nisLinkError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300"
              >
                {nisLinkError}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[42px] px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
              >
                Keluar
              </button>
              <button
                type="submit"
                disabled={isLinkingNis}
                className="min-h-[42px] px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-55 text-white text-sm font-semibold shadow-lg shadow-amber-500/25 transition-all"
              >
                {isLinkingNis ? 'Menautkan...' : 'Lanjutkan ke Dashboard'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!session || !firebaseUser) {
    return (
      <LoginView
        externalError={authError}
        onClearExternalError={() => setAuthError(null)}
        isDark={isDark}
        onToggleDark={toggleDarkMode}
      />
    );
  }

  if (session.role === 'guru' && isAuthorizedGuruEmail(session.email)) {
    return (
      <GuruDashboard
        session={{ ...session, nama: GURU_PROFILE.nama, email: GURU_PROFILE.email }}
        students={students}
        learningItems={learningItems}
        tugasList={tugasList}
        kunciTugasList={kunciTugasList}
        readRecords={readRecords}
        submissions={submissions}
        tahfidzRecords={tahfidzRecords}
        ujianTahfidzList={ujianTahfidzList}
        nilaiHarianList={nilaiHarianList}
        jilidBooks={jilidBooks}
        jilidProgress={jilidProgress}
        jadwalMapel={jadwalMapel}
        protaList={protaList}
        pengumumanList={pengumumanList}
        tahfidzTaughtClasses={tahfidzTaughtClasses}
        notifications={notifications}
        isDark={isDark}
        onToggleDark={toggleDarkMode}
        onImportStudents={handleImportStudents}
        onResetStudentPassword={handleResetStudentPassword}
        onDeleteStudent={handleDeleteStudent}
        onSaveTahfidzTaughtClasses={handleSaveTahfidzTaughtClasses}
        onUpdateStudentTahfidzProfile={handleUpdateStudentTahfidzProfile}
        onSaveLearningItemWithSoal={handleSaveLearningItemWithSoal}
        onDeleteLearningItem={handleDeleteLearningItem}
        onSaveTeacherGrading={handleSaveTeacherGrading}
        onSaveJilidSubmissionChecklist={handleSaveJilidSubmissionChecklist}
        onAddTahfidzRecord={handleAddTahfidzRecord}
        onDeleteTahfidzRecord={handleDeleteTahfidzRecord}
        onAddUjianTahfidz={handleAddUjianTahfidz}
        onDeleteUjianTahfidz={handleDeleteUjianTahfidz}
        onSaveNilaiHarian={handleSaveNilaiHarian}
        onDeleteNilaiHarian={handleDeleteNilaiHarian}
        onAddJilidBook={handleAddJilidBook}
        onDeleteJilidBook={handleDeleteJilidBook}
        onAddJadwalMapel={handleAddJadwalMapel}
        onUpdateJadwalMapel={handleUpdateJadwalMapel}
        onDeleteJadwalMapel={handleDeleteJadwalMapel}
        onAddProtaItem={handleAddProtaItem}
        onToggleProtaItem={handleToggleProtaItem}
        onDeleteProtaItem={handleDeleteProtaItem}
        onAddPengumuman={handleAddPengumuman}
        onDeletePengumuman={handleDeletePengumuman}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onLogout={handleLogout}
      />
    );
  }

  const activeStudent: Student | undefined =
    students.find((s) => s.nis === session.nis) ||
    (session.nis && session.kelas && session.tingkat
      ? {
          id: session.nis,
          nis: session.nis,
          nama: session.nama,
          kelas: session.kelas,
          tingkat: session.tingkat,
          usingDefaultPassword: true,
          uid: firebaseUser.uid,
        }
      : undefined);

  if (!activeStudent) {
    return (
      <LoginView
        externalError={authError}
        onClearExternalError={() => setAuthError(null)}
        isDark={isDark}
        onToggleDark={toggleDarkMode}
      />
    );
  }

  // Wait for Firestore items & submissions before displaying SiswaDashboard so active locked exam sessions block immediately without flashing
  if (!siswaItemsLoaded || !siswaSubmissionsLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex flex-col items-center justify-center gap-3 text-slate-900 dark:text-slate-100">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600 dark:text-cyan-400" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Memeriksa status sesi tugas aktif...
        </p>
      </div>
    );
  }

  // Global Exam Lock Gate: If student has an active "in_progress" Bahasa Arab or Aqidah task in Firestore, block entire LMS & force LockedExamView
  const activeLockedSubmission = submissions.find((sub) => {
    if (sub.studentNis !== activeStudent.nis) return false;
    if (sub.status === 'Selesai' || sub.sessionStatus !== 'in_progress') {
      return false;
    }
    return learningItems.some(
      (item) =>
        item.id === sub.itemId &&
        item.type === 'tugas' &&
        (item.mapel === 'Bahasa Arab' || item.mapel === 'Aqidah')
    );
  });

  const activeLockedItem = activeLockedSubmission
    ? learningItems.find((item) => item.id === activeLockedSubmission.itemId)
    : undefined;

  const activeLockedTugas = activeLockedItem
    ? tugasList.find((t) => t.itemId === activeLockedItem.id)
    : undefined;

  if (activeLockedSubmission && activeLockedItem) {
    return (
      <LockedExamView
        student={activeStudent}
        item={activeLockedItem}
        submission={activeLockedSubmission}
        tugasDoc={activeLockedTugas}
        onAutoSave={(itemId, jawaban, fileNama, structuredAnswers) =>
          handleAutoSaveAssignmentDraft(
            activeStudent.nis,
            itemId,
            jawaban,
            fileNama,
            structuredAnswers
          )
        }
        onRecordViolation={(itemId) =>
          handleIncrementAssignmentViolation(activeStudent.nis, itemId)
        }
        onSubmitExam={(itemId, jawaban, fileNama, isAutoSubmit, structuredAnswers) =>
          handleSubmitAssignment(
            activeStudent.nis,
            itemId,
            jawaban,
            fileNama,
            isAutoSubmit,
            structuredAnswers
          )
        }
      />
    );
  }

  return (
    <SiswaDashboard
      student={activeStudent}
      learningItems={learningItems}
      tugasList={tugasList}
      readRecords={readRecords}
      submissions={submissions}
      tahfidzRecords={tahfidzRecords}
      ujianTahfidzList={ujianTahfidzList}
      nilaiHarianList={nilaiHarianList}
      jilidBooks={jilidBooks}
      jilidProgress={jilidProgress}
      jadwalMapel={jadwalMapel}
      statistikKelas={statistikKelas}
      pengumumanList={pengumumanList}
      tahfidzTaughtClasses={tahfidzTaughtClasses}
      notifications={notifications.filter(
        (n) =>
          n.mapel !== 'Tahfidz/Tahsin' ||
          tahfidzTaughtClasses.includes(activeStudent.kelas)
      )}
      notificationReads={notificationReads}
      isDark={isDark}
      onToggleDark={toggleDarkMode}
      onMarkAsRead={(itemId) => handleMarkAsRead(activeStudent.nis, itemId)}
      onStartExamSession={(item) =>
        handleStartExamSession(activeStudent.nis, item)
      }
      onSubmitAssignment={(itemId, jawaban, fileNama) =>
        handleSubmitAssignment(activeStudent.nis, itemId, jawaban, fileNama)
      }
      onUpdateJilidProgress={(bookId, pageNumber, totalPages) =>
        handleUpdateJilidProgress(activeStudent.nis, bookId, pageNumber, totalPages)
      }
      onChangePassword={(currentPassword, newPassword) =>
        handleChangeStudentPassword(activeStudent.nis, currentPassword, newPassword)
      }
      onMarkNotificationRead={handleMarkNotificationRead}
      onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
      onLogout={handleLogout}
      examNotice={examNotice}
      onClearExamNotice={() => setExamNotice(null)}
    />
  );
}
