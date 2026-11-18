import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Home,
  KeyRound,
  Languages,
  Library,
  Loader2,
  Lock,
  LogOut,
  Menu,
  Moon,
  Send,
  Settings,
  ShieldAlert,
  Sparkles,
  Sun,
  Trophy,
  X,
} from 'lucide-react';
import {
  DEFAULT_TAHFIDZ_TAUGHT_CLASSES,
  SUBJECT_META,
  getSubjectsForClass,
  isItemForStudent,
} from '../../data/mockData';
import {
  AssignmentSubmission,
  ClassName,
  JadwalMapelItem,
  JilidBook,
  JilidReadProgress,
  LearningItem,
  MaterialReadRecord,
  NilaiHarianSession,
  NotifikasiItem,
  NotifikasiReadRecord,
  PengumumanItem,
  StatistikKelasItem,
  Student,
  SubjectName,
  TahfidzRecord,
  TugasDocument,
  UjianTahfidzRecord,
} from '../../types/lms';
import { buildSiswaClassLeaderboard } from '../../lib/classProgress';
import {
  getStudentTahfidzProfile,
  isJilidOfflineTask,
} from '../../lib/tahfidzUtils';
import {
  DailyMahfudzotCard,
  MiniMonthlyCalendar,
  SCHEDULE_DAYS,
  getTodayDayName,
} from '../BerandaCalendarAndQuote';
import { NotificationBell } from '../NotificationBell';
import { PapanPengumumanCard } from '../PapanPengumumanCard';
import { StatusBadge } from '../StatusBadge';
import { MaterialContentRenderer, stripHtmlTags } from '../MaterialContentRenderer';
import { KamusArabView } from '../guru/KamusArabView';
import {
  getInitials,
  useCollapsibleSidebar,
} from '../../lib/useCollapsibleSidebar';
import {
  ELECTRIC_BANNER_CLASS,
  PRIMARY_CTA_CLASS,
  getRankBadgeClasses,
  getSubjectTheme,
} from '../../lib/themePalette';
import { EbookReaderModal } from './EbookReaderModal';
import { NilaiHarianSiswaView } from './NilaiHarianSiswaView';

type SiswaTab = 'beranda' | 'mapel' | 'jilid' | 'nilai_harian' | 'kamus' | 'akun';

const siswaNavIconContainers: Record<
  SiswaTab,
  { active: string; inactive: string }
> = {
  beranda: {
    active: 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30',
    inactive: 'bg-indigo-500/12 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300',
  },
  mapel: {
    active: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30',
    inactive: 'bg-amber-500/12 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
  },
  jilid: {
    active: 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md shadow-cyan-500/30',
    inactive: 'bg-cyan-500/12 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300',
  },
  nilai_harian: {
    active: 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30',
    inactive: 'bg-violet-500/12 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300',
  },
  kamus: {
    active: 'bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-md shadow-teal-500/30',
    inactive: 'bg-sky-500/12 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300',
  },
  akun: {
    active: 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/30',
    inactive: 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
};

interface SiswaDashboardProps {
  student: Student;
  learningItems: LearningItem[];
  tugasList?: TugasDocument[];
  readRecords: MaterialReadRecord[];
  submissions: AssignmentSubmission[];
  tahfidzRecords: TahfidzRecord[];
  ujianTahfidzList?: UjianTahfidzRecord[];
  nilaiHarianList?: NilaiHarianSession[];
  jilidBooks: JilidBook[];
  jilidProgress: JilidReadProgress[];
  jadwalMapel: JadwalMapelItem[];
  statistikKelas?: StatistikKelasItem[];
  pengumumanList?: PengumumanItem[];
  tahfidzTaughtClasses?: ClassName[];
  notifications: NotifikasiItem[];
  notificationReads: NotifikasiReadRecord[];
  isDark?: boolean;
  onToggleDark?: () => void;
  onMarkAsRead: (itemId: string) => void;
  onStartExamSession: (item: LearningItem) => Promise<void>;
  onSubmitAssignment: (itemId: string, jawaban: string, fileNama?: string) => void;
  onUpdateJilidProgress: (bookId: string, pageNumber: number, totalPages: number) => void;
  onChangePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ ok: boolean; message: string }>;
  onMarkNotificationRead: (notif: NotifikasiItem) => Promise<void>;
  onMarkAllNotificationsRead: () => Promise<void>;
  onLogout: () => void;
  examNotice?: string | null;
  onClearExamNotice?: () => void;
}

export function SiswaDashboard({
  student,
  learningItems,
  tugasList = [],
  readRecords,
  submissions,
  tahfidzRecords,
  ujianTahfidzList = [],
  nilaiHarianList = [],
  jilidBooks,
  jilidProgress,
  jadwalMapel,
  statistikKelas = [],
  pengumumanList = [],
  tahfidzTaughtClasses = DEFAULT_TAHFIDZ_TAUGHT_CLASSES,
  notifications,
  notificationReads,
  isDark = false,
  onToggleDark,
  onMarkAsRead,
  onStartExamSession,
  onSubmitAssignment,
  onUpdateJilidProgress,
  onChangePassword,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onLogout,
  examNotice,
  onClearExamNotice,
}: SiswaDashboardProps) {
  const allowedSubjects = useMemo(
    () => getSubjectsForClass(student.kelas),
    [student.kelas]
  );
  const isClassTaughtTahfidzByGuru = useMemo(
    () => tahfidzTaughtClasses.includes(student.kelas),
    [tahfidzTaughtClasses, student.kelas]
  );
  const visibleSubjects = useMemo(
    () =>
      allowedSubjects.filter(
        (sub) => sub !== 'Tahfidz/Tahsin' || isClassTaughtTahfidzByGuru
      ),
    [allowedSubjects, isClassTaughtTahfidzByGuru]
  );

  const [activeTab, setActiveTab] = useState<SiswaTab>('beranda');
  const {
    isSidebarOpen,
    toggleSidebar,
    closeSidebarOnTablet,
    isMobileDrawerOpen,
    openMobileDrawer,
    closeMobileDrawer,
  } = useCollapsibleSidebar('lms_siswa_sidebar_open');
  const [selectedSubject, setSelectedSubject] = useState<'ALL' | SubjectName>('ALL');
  const [jadwalViewMode, setJadwalViewMode] = useState<'hari_ini' | 'mingguan'>('hari_ini');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals
  const [readingItem, setReadingItem] = useState<LearningItem | null>(null);
  const [activeJilidBook, setActiveJilidBook] = useState<JilidBook | null>(null);
  const [taskItem, setTaskItem] = useState<LearningItem | null>(null);
  const [taskAnswer, setTaskAnswer] = useState('');
  const [taskFileName, setTaskFileName] = useState('');
  const [confirmStartExamItem, setConfirmStartExamItem] = useState<LearningItem | null>(null);
  const [isStartingExam, setIsStartingExam] = useState(false);
  const [startExamError, setStartExamError] = useState('');
  const [completedTaskModal, setCompletedTaskModal] = useState<{
    item: LearningItem;
    submission: AssignmentSubmission;
  } | null>(null);

  // Account Settings Password Form
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwdFields, setShowPwdFields] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const hasActiveLockedExam = useMemo(() => {
    return submissions.some((sub) => {
      if (sub.studentNis !== student.nis) return false;
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
  }, [submissions, learningItems, student.nis]);

  const selectTab = (nextTab: SiswaTab) => {
    setActiveTab(nextTab);
    closeSidebarOnTablet();
    closeMobileDrawer();
  };

  const studentTahfidzRecords = useMemo(() => {
    return tahfidzRecords.filter((r) => r.studentNis === student.nis);
  }, [tahfidzRecords, student.nis]);

  const studentTahfidzProfile = useMemo(
    () => getStudentTahfidzProfile(student, studentTahfidzRecords),
    [student, studentTahfidzRecords]
  );

  const studentUjianTahfidz = useMemo(
    () => ujianTahfidzList.filter((u) => u.studentNis === student.nis),
    [ujianTahfidzList, student.nis]
  );

  // Filter items strictly to student's class, allowed subjects, guru's Tahfidz taught classes & Jilid/Tahfidz group
  const studentItems = useMemo(() => {
    return learningItems.filter((item) =>
      isItemForStudent(
        item,
        student,
        studentTahfidzRecords,
        tahfidzTaughtClasses
      )
    );
  }, [learningItems, student, studentTahfidzRecords, tahfidzTaughtClasses]);

  const visibleItems = useMemo(() => {
    if (selectedSubject === 'ALL') return studentItems;
    return studentItems.filter((i) => i.mapel === selectedSubject);
  }, [studentItems, selectedSubject]);

  const materials = visibleItems.filter((i) => i.type === 'materi');
  const assignments = visibleItems.filter((i) => i.type === 'tugas');

  const studentPengumuman = useMemo(() => {
    return pengumumanList.filter(
      (p) => p.targetTingkat === 'Semua' || p.targetTingkat === student.tingkat
    );
  }, [pengumumanList, student.tingkat]);

  const showTahfidzHistory =
    isClassTaughtTahfidzByGuru &&
    allowedSubjects.includes('Tahfidz/Tahsin') &&
    (selectedSubject === 'ALL' || selectedSubject === 'Tahfidz/Tahsin');

  const readCount = useMemo(() => {
    return studentItems.filter(
      (i) =>
        i.type === 'materi' &&
        readRecords.some((r) => r.itemId === i.id && r.studentNis === student.nis)
    ).length;
  }, [studentItems, readRecords, student.nis]);

  const totalMaterialsCount = studentItems.filter((i) => i.type === 'materi').length;

  const doneTaskCount = useMemo(() => {
    return studentItems.filter(
      (i) =>
        i.type === 'tugas' &&
        submissions.some(
          (s) => s.itemId === i.id && s.studentNis === student.nis && s.status === 'Selesai'
        )
    ).length;
  }, [studentItems, submissions, student.nis]);

  const totalTasksCount = studentItems.filter((i) => i.type === 'tugas').length;

  const activeIncompleteTasks = useMemo(() => {
    return studentItems.filter(
      (i) =>
        i.type === 'tugas' &&
        !submissions.some(
          (s) => s.itemId === i.id && s.studentNis === student.nis && s.status === 'Selesai'
        )
    );
  }, [studentItems, submissions, student.nis]);

  const pendingJilidTasks = useMemo(() => {
    if (!isClassTaughtTahfidzByGuru) return [];
    return activeIncompleteTasks.filter((item) => isJilidOfflineTask(item));
  }, [activeIncompleteTasks, isClassTaughtTahfidzByGuru]);

  const renderPersistentJilidWarning = () => {
    if (pendingJilidTasks.length === 0) return null;
    return (
      <div
        role="region"
        aria-label="Pengingat Tugas Khusus Jilid"
        className="rounded-2xl border-2 border-amber-400/90 dark:border-rose-500/70 bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 dark:from-amber-950/55 dark:via-rose-950/45 dark:to-amber-950/55 p-4 sm:p-5 shadow-md shadow-amber-500/10 space-y-3"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 shadow-md shadow-rose-500/25 flex items-center justify-center text-white shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-display text-sm sm:text-base font-bold text-rose-950 dark:text-amber-100">
              Pengingat Tugas Khusus Jilid ({pendingJilidTasks.length} Belum Diceklis Guru)
            </p>
            <p className="text-xs sm:text-sm text-amber-950/90 dark:text-amber-200/90 leading-relaxed">
              Kerjakan di buku tulis, lalu serahkan langsung kepada guru untuk diceklis dan dinilai. Pemberitahuan ini akan tetap tampil sampai guru menceklis tugas Anda.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {pendingJilidTasks.map((task) => (
            <div
              key={task.id}
              className="p-3 rounded-xl bg-white/85 dark:bg-[#0B1120]/85 border border-amber-300/80 dark:border-rose-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {task.judul}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Kumpul Langsung Buku Tulis (Ceklis Guru)
                  {task.tenggat ? ` · Tenggat ${task.tenggat}` : ' · Tanpa batas durasi waktu'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openTaskModal(task)}
                className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm shrink-0"
              >
                <span>Lihat Tugas</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const missingNilaiHarianSessions = useMemo(() => {
    return nilaiHarianList.filter((s) => {
      if (s.kelas !== student.kelas) return false;
      if (!visibleSubjects.includes(s.mapel)) return false;
      const score = s.nilaiMap?.[student.nis];
      return typeof score !== 'number' || Number.isNaN(score);
    });
  }, [nilaiHarianList, student.kelas, student.nis, visibleSubjects]);

  const renderMissingNilaiHarianBanner = () => {
    if (missingNilaiHarianSessions.length === 0) return null;
    return (
      <div
        role="region"
        aria-label="Peringatan Nilai Harian Kosong"
        className="rounded-2xl border border-amber-300/90 dark:border-rose-600/60 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/50 dark:via-orange-950/40 dark:to-rose-950/45 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="font-display text-xs sm:text-sm font-bold text-rose-950 dark:text-amber-100">
              {missingNilaiHarianSessions.length} Nilai Harian Kosong / Belum Mengerjakan
            </p>
            <p className="text-xs text-amber-950/90 dark:text-amber-200/90">
              Terdapat penilaian kelas {student.kelas} yang nilainya masih kosong — segera susul ke guru agar tidak tertinggal.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => selectTab('nilai_harian')}
          className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm shrink-0"
        >
          <span>Cek Nilai Harian</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  const classLeaderboard = useMemo(
    () => buildSiswaClassLeaderboard(statistikKelas),
    [statistikKelas]
  );

  const myClassSummary = useMemo(
    () => classLeaderboard.find((c) => c.kelas === student.kelas) || null,
    [classLeaderboard, student.kelas]
  );

  const todayDayName = useMemo(() => getTodayDayName(), []);

  const studentJadwal = useMemo(() => {
    const classSchedules = jadwalMapel.filter((j) => j.kelas === student.kelas);
    if (jadwalViewMode === 'hari_ini') {
      return classSchedules.filter((j) => j.hari === todayDayName);
    }
    const dayOrder = new Map(SCHEDULE_DAYS.map((d, idx) => [d, idx]));
    return [...classSchedules].sort((a, b) => {
      const da = dayOrder.get(a.hari) ?? 99;
      const db = dayOrder.get(b.hari) ?? 99;
      if (da !== db) return da - db;
      return a.jamMulai.localeCompare(b.jamMulai);
    });
  }, [jadwalMapel, student.kelas, jadwalViewMode, todayDayName]);

  const readNotifIdSet = useMemo(
    () => new Set(notificationReads.map((r) => r.notifId)),
    [notificationReads]
  );

  const isNotifRead = (notif: NotifikasiItem) => readNotifIdSet.has(notif.id);

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !readNotifIdSet.has(n.id)).length,
    [notifications, readNotifIdSet]
  );

  const openMaterialReader = (item: LearningItem) => {
    setReadingItem(item);
    const alreadyRead = readRecords.some(
      (r) => r.itemId === item.id && r.studentNis === student.nis
    );
    if (!alreadyRead) {
      onMarkAsRead(item.id);
    }
  };

  const openTaskModal = (item: LearningItem) => {
    const existing = submissions.find(
      (s) => s.itemId === item.id && s.studentNis === student.nis
    );
    const isExamSubject =
      item.mapel === 'Bahasa Arab' || item.mapel === 'Aqidah';

    if (existing?.status === 'Selesai') {
      setCompletedTaskModal({ item, submission: existing });
      return;
    }

    if (isExamSubject) {
      setStartExamError('');
      setConfirmStartExamItem(item);
      return;
    }

    setTaskAnswer(existing?.jawaban || '');
    setTaskFileName(existing?.fileNama || '');
    setTaskItem(item);
  };

  const handleNotificationSelect = (notif: NotifikasiItem) => {
    void onMarkNotificationRead(notif);
    if (notif.type === 'pengumuman') {
      selectTab('beranda');
      showToast(`Pengumuman: ${notif.judul}`);
      return;
    }

    const matchedItem = studentItems.find((i) => i.id === notif.itemId);
    setActiveTab('mapel');
    if (
      notif.mapel !== 'Umum' &&
      allowedSubjects.includes(notif.mapel)
    ) {
      setSelectedSubject(notif.mapel);
    } else {
      setSelectedSubject('ALL');
    }
    if (!matchedItem) {
      showToast('Materi atau tugas dari notifikasi ini sudah tidak tersedia.');
      return;
    }
    if (matchedItem.type === 'materi') {
      openMaterialReader(matchedItem);
    } else {
      openTaskModal(matchedItem);
    }
  };

  const handleConfirmStartExam = async () => {
    if (!confirmStartExamItem || isStartingExam) return;
    setStartExamError('');
    setIsStartingExam(true);
    try {
      await onStartExamSession(confirmStartExamItem);
      setConfirmStartExamItem(null);
    } catch {
      setStartExamError(
        'Gagal memulai sesi ujian di Firestore. Periksa koneksi Anda lalu coba lagi.'
      );
    } finally {
      setIsStartingExam(false);
    }
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskItem || !taskAnswer.trim()) return;
    onSubmitAssignment(taskItem.id, taskAnswer.trim(), taskFileName.trim() || undefined);
    showToast(`Tugas "${taskItem.judul}" berhasil dikumpulkan.`);
    setTaskItem(null);
  };

  const handlePasswordFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);

    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdFeedback({ type: 'error', text: 'Seluruh kolom password wajib diisi.' });
      return;
    }

    if (newPwd.length < 6) {
      setPwdFeedback({
        type: 'error',
        text: 'Password baru minimal harus terdiri dari 6 karakter.',
      });
      return;
    }

    if (newPwd !== confirmPwd) {
      setPwdFeedback({
        type: 'error',
        text: 'Konfirmasi password baru tidak cocok.',
      });
      return;
    }

    const result = await onChangePassword(currentPwd, newPwd);
    if (result.ok) {
      setPwdFeedback({ type: 'success', text: result.message });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } else {
      setPwdFeedback({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex flex-col md:flex-row">
      {/* Desktop & Tablet Sidebar (Expanded w-64 <-> Mini-Sidebar Icon Rail w-20; hidden completely during locked exam) */}
      {!hasActiveLockedExam && (
        <aside
          id="siswa-desktop-sidebar"
          className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-[#131C31] border-r border-slate-200/80 dark:border-slate-800 z-30 overflow-visible transition-all duration-300 ease-out ${
            isSidebarOpen ? 'md:w-64' : 'md:w-20'
          }`}
        >
          {/* Floating Edge Toggle Button (Tablet & Desktop only; hidden during locked exam) */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={isSidebarOpen ? 'Perkecil sidebar' : 'Perluas sidebar'}
            aria-label={isSidebarOpen ? 'Perkecil sidebar' : 'Perluas sidebar'}
            aria-expanded={isSidebarOpen}
            aria-controls="siswa-desktop-sidebar"
            className="hidden md:flex items-center justify-center absolute -right-3 top-5 z-30 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md shadow-indigo-500/30 ring-2 ring-white dark:ring-[#0B1120] transition-transform active:scale-95"
          >
            {isSidebarOpen ? (
              <ChevronLeft className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Brand Header */}
          <div
            className={`h-16 border-b border-slate-200/80 dark:border-slate-800 flex items-center shrink-0 ${
              isSidebarOpen ? 'px-4 justify-start' : 'px-2 justify-center'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 shadow-md shadow-indigo-500/25 flex items-center justify-center text-white shrink-0"
                title="LMS Diniyyah"
              >
                <BookOpen className="h-4 w-4" />
              </div>
              {isSidebarOpen && (
                <span className="font-display text-base font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap truncate">
                  LMS Diniyyah
                </span>
              )}
            </div>
          </div>

          <nav
            className={`flex-1 py-4 space-y-1.5 ${
              isSidebarOpen
                ? 'px-3 overflow-y-auto overflow-x-hidden'
                : 'px-2 overflow-visible'
            }`}
            aria-label="Menu Siswa"
          >
            {isSidebarOpen && (
              <p className="px-2.5 pb-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                MENU
              </p>
            )}

            <button
              type="button"
              onClick={() => selectTab('beranda')}
              aria-label="Beranda"
              className={`group relative w-full min-h-[44px] py-2 rounded-2xl text-sm font-medium flex items-center transition-all whitespace-nowrap ${
                isSidebarOpen
                  ? 'px-2.5 justify-start gap-3'
                  : 'px-0 justify-center'
              } ${
                activeTab === 'beranda'
                  ? 'bg-indigo-50/90 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {activeTab === 'beranda' && (
                <span
                  aria-hidden="true"
                  className={`absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-indigo-500 to-purple-500 ${
                    isSidebarOpen ? '-left-3' : '-left-2'
                  }`}
                />
              )}
              <span
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  activeTab === 'beranda'
                    ? siswaNavIconContainers.beranda.active
                    : siswaNavIconContainers.beranda.inactive
                }`}
              >
                <Home className="h-4 w-4 shrink-0" />
              </span>
              {isSidebarOpen && <span>Beranda</span>}
              {!isSidebarOpen && (
                <span
                  role="tooltip"
                  className="pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700/80"
                >
                  Beranda
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => selectTab('mapel')}
              aria-label="Mapel Saya"
              className={`group relative w-full min-h-[44px] py-2 rounded-2xl text-sm font-medium flex items-center transition-all whitespace-nowrap ${
                isSidebarOpen
                  ? 'px-2.5 justify-start gap-3'
                  : 'px-0 justify-center'
              } ${
                activeTab === 'mapel'
                  ? 'bg-amber-50/90 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {activeTab === 'mapel' && (
                <span
                  aria-hidden="true"
                  className={`absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-amber-500 to-orange-500 ${
                    isSidebarOpen ? '-left-3' : '-left-2'
                  }`}
                />
              )}
              <span
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  activeTab === 'mapel'
                    ? siswaNavIconContainers.mapel.active
                    : siswaNavIconContainers.mapel.inactive
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0" />
              </span>
              {isSidebarOpen && <span>Mapel Saya</span>}
              {!isSidebarOpen && (
                <span
                  role="tooltip"
                  className="pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700/80"
                >
                  Mapel Saya
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => selectTab('jilid')}
              aria-label="Buku Jilid"
              className={`group relative w-full min-h-[44px] py-2 rounded-2xl text-sm font-medium flex items-center transition-all whitespace-nowrap ${
                isSidebarOpen
                  ? 'px-2.5 justify-start gap-3'
                  : 'px-0 justify-center'
              } ${
                activeTab === 'jilid'
                  ? 'bg-cyan-50/90 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {activeTab === 'jilid' && (
                <span
                  aria-hidden="true"
                  className={`absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-indigo-500 to-cyan-500 ${
                    isSidebarOpen ? '-left-3' : '-left-2'
                  }`}
                />
              )}
              <span
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  activeTab === 'jilid'
                    ? siswaNavIconContainers.jilid.active
                    : siswaNavIconContainers.jilid.inactive
                }`}
              >
                <Library className="h-4 w-4 shrink-0" />
              </span>
              {isSidebarOpen && <span>Buku Jilid</span>}
              {!isSidebarOpen && (
                <span
                  role="tooltip"
                  className="pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700/80"
                >
                  Buku Jilid
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => selectTab('nilai_harian')}
              aria-label="Nilai Harian"
              className={`group relative w-full min-h-[44px] py-2 rounded-2xl text-sm font-medium flex items-center transition-all whitespace-nowrap ${
                isSidebarOpen
                  ? 'px-2.5 justify-start gap-3'
                  : 'px-0 justify-center'
              } ${
                activeTab === 'nilai_harian'
                  ? 'bg-violet-50/90 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {activeTab === 'nilai_harian' && (
                <span
                  aria-hidden="true"
                  className={`absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-violet-600 to-indigo-600 ${
                    isSidebarOpen ? '-left-3' : '-left-2'
                  }`}
                />
              )}
              <span
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  activeTab === 'nilai_harian'
                    ? siswaNavIconContainers.nilai_harian.active
                    : siswaNavIconContainers.nilai_harian.inactive
                }`}
              >
                <ClipboardCheck className="h-4 w-4 shrink-0" />
              </span>
              {isSidebarOpen && (
                <span className="flex items-center gap-2 min-w-0">
                  <span>Nilai Harian</span>
                  {missingNilaiHarianSessions.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold tabular-nums">
                      {missingNilaiHarianSessions.length}
                    </span>
                  )}
                </span>
              )}
              {!isSidebarOpen && (
                <span
                  role="tooltip"
                  className="pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700/80"
                >
                  Nilai Harian{missingNilaiHarianSessions.length > 0 ? ` (${missingNilaiHarianSessions.length} Kosong)` : ''}
                </span>
              )}
            </button>

            {isSidebarOpen ? (
              <p className="px-2.5 pt-3 pb-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                LAINNYA
              </p>
            ) : (
              <div className="my-2 mx-2 border-t border-slate-200/80 dark:border-slate-800" />
            )}

            <button
              type="button"
              onClick={() => selectTab('kamus')}
              aria-label="Kamus Arab"
              className={`group relative w-full min-h-[44px] py-2 rounded-2xl text-sm font-medium flex items-center transition-all whitespace-nowrap ${
                isSidebarOpen
                  ? 'px-2.5 justify-start gap-3'
                  : 'px-0 justify-center'
              } ${
                activeTab === 'kamus'
                  ? 'bg-sky-50/90 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {activeTab === 'kamus' && (
                <span
                  aria-hidden="true"
                  className={`absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-cyan-500 to-teal-500 ${
                    isSidebarOpen ? '-left-3' : '-left-2'
                  }`}
                />
              )}
              <span
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  activeTab === 'kamus'
                    ? siswaNavIconContainers.kamus.active
                    : siswaNavIconContainers.kamus.inactive
                }`}
              >
                <Languages className="h-4 w-4 shrink-0" />
              </span>
              {isSidebarOpen && <span>Kamus Arab</span>}
              {!isSidebarOpen && (
                <span
                  role="tooltip"
                  className="pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700/80"
                >
                  Kamus Arab
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => selectTab('akun')}
              aria-label="Pengaturan Akun"
              className={`group relative w-full min-h-[44px] py-2 rounded-2xl text-sm font-medium flex items-center transition-all whitespace-nowrap ${
                isSidebarOpen
                  ? 'px-2.5 justify-start gap-3'
                  : 'px-0 justify-center'
              } ${
                activeTab === 'akun'
                  ? 'bg-emerald-50/90 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {activeTab === 'akun' && (
                <span
                  aria-hidden="true"
                  className={`absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-teal-500 to-emerald-500 ${
                    isSidebarOpen ? '-left-3' : '-left-2'
                  }`}
                />
              )}
              <span
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  activeTab === 'akun'
                    ? siswaNavIconContainers.akun.active
                    : siswaNavIconContainers.akun.inactive
                }`}
              >
                <Settings className="h-4 w-4 shrink-0" />
              </span>
              {isSidebarOpen && <span>Pengaturan Akun</span>}
              {!isSidebarOpen && (
                <span
                  role="tooltip"
                  className="pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700/80"
                >
                  Pengaturan Akun
                </span>
              )}
            </button>
          </nav>

          <div
            className={`border-t border-slate-200/80 dark:border-slate-800 shrink-0 ${
              isSidebarOpen ? 'p-4 space-y-3' : 'py-3 px-2 flex flex-col items-center gap-2.5'
            }`}
          >
            {isSidebarOpen ? (
              <>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {student.nama}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                    {student.kelas} · NIS {student.nis}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full min-h-[40px] px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-700 dark:hover:text-rose-400 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluar</span>
                </button>
              </>
            ) : (
              <>
                <div className="group relative flex items-center justify-center">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 font-display text-xs font-bold flex items-center justify-center shrink-0 select-none">
                    {getInitials(student.nama)}
                  </div>
                  <span
                    role="tooltip"
                    className="pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700/80"
                  >
                    {student.nama} ({student.kelas})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  aria-label="Keluar"
                  className="group relative min-h-[40px] w-11 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-700 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span
                    role="tooltip"
                    className="pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700/80"
                  >
                    Keluar
                  </span>
                </button>
              </>
            )}
          </div>
        </aside>
      )}

      {/* Mobile Drawer (< md; hidden during locked exam) */}
      {!hasActiveLockedExam && isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu Navigasi Siswa"
        >
          <div
            className="fixed inset-0 bg-slate-950/65"
            onClick={closeMobileDrawer}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-[#131C31] border-r border-slate-200/80 dark:border-slate-800 h-full flex flex-col z-10">
            <div className="h-16 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 shadow-md shadow-indigo-500/25 flex items-center justify-center text-white shrink-0">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="font-display text-base font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap truncate">
                  LMS Diniyyah
                </span>
              </div>
              <button
                type="button"
                onClick={closeMobileDrawer}
                aria-label="Tutup menu navigasi"
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav
              className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto"
              aria-label="Menu Mobile Siswa"
            >
              <button
                type="button"
                onClick={() => selectTab('beranda')}
                className={`w-full min-h-[44px] px-2.5 py-2 rounded-2xl text-sm font-medium flex items-center gap-3 transition-all whitespace-nowrap ${
                  activeTab === 'beranda'
                    ? 'bg-indigo-50/90 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5'
                }`}
              >
                <span
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'beranda'
                      ? siswaNavIconContainers.beranda.active
                      : siswaNavIconContainers.beranda.inactive
                  }`}
                >
                  <Home className="h-4 w-4 shrink-0" />
                </span>
                <span>Beranda</span>
              </button>

              <button
                type="button"
                onClick={() => selectTab('mapel')}
                className={`w-full min-h-[44px] px-2.5 py-2 rounded-2xl text-sm font-medium flex items-center gap-3 transition-all whitespace-nowrap ${
                  activeTab === 'mapel'
                    ? 'bg-amber-50/90 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5'
                }`}
              >
                <span
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'mapel'
                      ? siswaNavIconContainers.mapel.active
                      : siswaNavIconContainers.mapel.inactive
                  }`}
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                </span>
                <span>Mapel Saya</span>
              </button>

              <button
                type="button"
                onClick={() => selectTab('jilid')}
                className={`w-full min-h-[44px] px-2.5 py-2 rounded-2xl text-sm font-medium flex items-center gap-3 transition-all whitespace-nowrap ${
                  activeTab === 'jilid'
                    ? 'bg-cyan-50/90 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5'
                }`}
              >
                <span
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'jilid'
                      ? siswaNavIconContainers.jilid.active
                      : siswaNavIconContainers.jilid.inactive
                  }`}
                >
                  <Library className="h-4 w-4 shrink-0" />
                </span>
                <span>Buku Jilid</span>
              </button>

              <button
                type="button"
                onClick={() => selectTab('nilai_harian')}
                className={`w-full min-h-[44px] px-2.5 py-2 rounded-2xl text-sm font-medium flex items-center justify-between gap-2 transition-all whitespace-nowrap ${
                  activeTab === 'nilai_harian'
                    ? 'bg-violet-50/90 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span
                    className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                      activeTab === 'nilai_harian'
                        ? siswaNavIconContainers.nilai_harian.active
                        : siswaNavIconContainers.nilai_harian.inactive
                    }`}
                  >
                    <ClipboardCheck className="h-4 w-4 shrink-0" />
                  </span>
                  <span>Nilai Harian</span>
                </span>
                {missingNilaiHarianSessions.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold tabular-nums">
                    {missingNilaiHarianSessions.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => selectTab('kamus')}
                className={`w-full min-h-[44px] px-2.5 py-2 rounded-2xl text-sm font-medium flex items-center gap-3 transition-all whitespace-nowrap ${
                  activeTab === 'kamus'
                    ? 'bg-sky-50/90 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5'
                }`}
              >
                <span
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'kamus'
                      ? siswaNavIconContainers.kamus.active
                      : siswaNavIconContainers.kamus.inactive
                  }`}
                >
                  <Languages className="h-4 w-4 shrink-0" />
                </span>
                <span>Kamus Arab</span>
              </button>

              <button
                type="button"
                onClick={() => selectTab('akun')}
                className={`w-full min-h-[44px] px-2.5 py-2 rounded-2xl text-sm font-medium flex items-center gap-3 transition-all whitespace-nowrap ${
                  activeTab === 'akun'
                    ? 'bg-emerald-50/90 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5'
                }`}
              >
                <span
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'akun'
                      ? siswaNavIconContainers.akun.active
                      : siswaNavIconContainers.akun.inactive
                  }`}
                >
                  <Settings className="h-4 w-4 shrink-0" />
                </span>
                <span>Pengaturan Akun</span>
              </button>
            </nav>

            <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3 shrink-0">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {student.nama}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                  {student.kelas} · NIS {student.nis}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeMobileDrawer();
                  onLogout();
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-700 dark:hover:text-rose-400 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 pb-20 md:pb-8 transition-all duration-300 ease-out ${
          hasActiveLockedExam
            ? 'md:pl-0'
            : isSidebarOpen
            ? 'md:pl-64'
            : 'md:pl-20'
        }`}
      >
        {/* Top Bar (Glassmorphism strictly on Header) */}
        <header className="sticky top-0 z-20 h-14 md:h-16 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {!hasActiveLockedExam && (
              <button
                type="button"
                onClick={openMobileDrawer}
                aria-label="Buka menu navigasi"
                title="Menu Navigasi"
                className="md:hidden min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-[#131C31] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shrink-0"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
            <div className="md:hidden h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 shadow-md shadow-indigo-500/25 flex items-center justify-center text-white shrink-0">
              <BookOpen className="h-4 w-4" />
            </div>
            <h1 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {activeTab === 'beranda'
                ? `Beranda Siswa — ${student.kelas}`
                : activeTab === 'mapel'
                ? `Dashboard Mapel — ${student.kelas}`
                : activeTab === 'jilid'
                ? 'E-Book Jilid Interaktif'
                : activeTab === 'nilai_harian'
                ? `Nilai Harian — ${student.kelas}`
                : activeTab === 'kamus'
                ? 'Kamus Arab (Indonesia ↔ Arab)'
                : 'Pengaturan Akun Siswa'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <span className="hidden sm:inline text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums whitespace-nowrap">
              NIS {student.nis} · {student.kelas}
            </span>
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadNotifCount}
              isNotifRead={isNotifRead}
              onSelectNotification={handleNotificationSelect}
              onMarkAllRead={onMarkAllNotificationsRead}
            />
            {onToggleDark && (
              <button
                type="button"
                onClick={onToggleDark}
                aria-label={isDark ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
                title={isDark ? 'Mode Terang' : 'Mode Gelap'}
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-[#131C31] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="md:hidden min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-[#131C31] text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </header>

        {/* Toast & Exam Completion Notice */}
        {(toastMsg || examNotice) && (
          <div className="px-4 sm:px-6 lg:px-8 pt-4 space-y-2">
            {examNotice && (
              <div
                role="status"
                className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-xs sm:text-sm text-blue-900 dark:text-blue-200 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-700 dark:text-blue-400 shrink-0" />
                  <span>{examNotice}</span>
                </div>
                {onClearExamNotice && (
                  <button
                    type="button"
                    onClick={onClearExamNotice}
                    aria-label="Tutup pemberitahuan ujian"
                    className="text-blue-700 dark:text-blue-300 hover:text-blue-950 dark:hover:text-white p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            {toastMsg && (
              <div
                role="status"
                className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{toastMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setToastMsg(null)}
                  aria-label="Tutup notifikasi"
                  className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        <main
          className={`flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full mx-auto space-y-6 ${
            !hasActiveLockedExam && isSidebarOpen ? 'max-w-6xl' : 'max-w-none'
          }`}
        >
          {/* TAB 1: BERANDA SISWA */}
          {activeTab === 'beranda' && (
            <div className="space-y-6">
              {renderPersistentJilidWarning()}
              {renderMissingNilaiHarianBanner()}

              {/* Student Welcome & Stats Banner */}
              <div
                className={`${ELECTRIC_BANNER_CLASS} rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold text-white">
                      Kelas {student.kelas} · Tingkat {student.tingkat}
                    </p>
                    <p className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-400/25 border border-emerald-200/30 text-[11px] font-semibold text-white">
                      <Award className="h-3 w-3 shrink-0" />
                      <span>
                        {studentTahfidzProfile.category} · {studentTahfidzProfile.level}
                      </span>
                    </p>
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                    Assalamu’alaikum, {student.nama}
                  </h2>
                  <p className="text-xs sm:text-sm text-indigo-100">
                    Mata pelajaran yang tersedia untuk kelas Anda:{' '}
                    <span className="font-semibold text-white">
                      {visibleSubjects.join(' dan ')}
                    </span>
                    .
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:w-auto shrink-0">
                  <div className="px-4 py-3 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25">
                    <p className="text-[11px] font-medium text-teal-50">
                      Materi Dibaca
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-white tabular-nums">
                      {readCount}/{totalMaterialsCount}
                    </p>
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white/15 border border-white/25 text-white">
                    <p className="text-[11px] font-medium text-indigo-100">
                      Tugas Selesai
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-white tabular-nums">
                      {doneTaskCount}/{totalTasksCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Responsive Widgets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Widget 1: Tugas Aktif / Belum Selesai */}
                <div className="md:col-span-2 lg:col-span-2 bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/25 flex items-center justify-center text-white shrink-0">
                          <ClipboardCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                            Tugas Aktif / Belum Selesai
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            {activeIncompleteTasks.length} tugas menunggu dikerjakan
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('mapel')}
                        className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 shrink-0"
                      >
                        <span>Lihat Mapel</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {activeIncompleteTasks.length === 0 ? (
                      <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Alhamdulillah, semua tugas sudah diselesaikan
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Periksa menu Mapel Saya secara berkala untuk materi dan tugas terbaru.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200/80 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
                        {activeIncompleteTasks.slice(0, 5).map((item) => {
                          const isTimedSubject =
                            item.mapel === 'Bahasa Arab' || item.mapel === 'Aqidah';
                          const isOfflineJilid = isJilidOfflineTask(item);
                          const theme = getSubjectTheme(item.mapel);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => openTaskModal(item)}
                              className="w-full text-left p-3.5 sm:p-4 bg-white dark:bg-[#131C31] hover:bg-slate-50 dark:hover:bg-[#0B1120]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
                            >
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                  <span className={`font-semibold ${theme.accentText}`}>
                                    {item.mapel}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  {isOfflineJilid ? (
                                    <span className="font-semibold text-teal-700 dark:text-teal-300">
                                      Kumpul Buku Tulis (Ceklis Guru)
                                      {item.tenggat ? ` · Tenggat ${item.tenggat}` : ''}
                                    </span>
                                  ) : (
                                    <span className="font-mono tabular-nums">
                                      {item.tenggat
                                        ? `Tenggat ${item.tenggat}`
                                        : 'Tanpa tenggat'}
                                    </span>
                                  )}
                                  {isTimedSubject && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="font-mono tabular-nums">
                                        {item.durasiMenit || 30} mnt
                                      </span>
                                    </>
                                  )}
                                </div>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {item.judul}
                                </p>
                              </div>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-sm shadow-amber-500/25 shrink-0">
                                <span>{isOfflineJilid ? 'Lihat Tugas' : 'Kerjakan'}</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Widget 2: Jadwal Pelajaran Kelas */}
                <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/25 flex items-center justify-center text-white shrink-0">
                          <CalendarClock className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            Jadwal {student.kelas}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {jadwalViewMode === 'hari_ini'
                              ? `Hari ini: ${todayDayName}`
                              : 'Jadwal mingguan kelas'}
                          </p>
                        </div>
                      </div>

                      <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-[#0B1120] shrink-0">
                        <button
                          type="button"
                          onClick={() => setJadwalViewMode('hari_ini')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                            jadwalViewMode === 'hari_ini'
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Hari Ini
                        </button>
                        <button
                          type="button"
                          onClick={() => setJadwalViewMode('mingguan')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                            jadwalViewMode === 'mingguan'
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Semua
                        </button>
                      </div>
                    </div>

                    {studentJadwal.length === 0 ? (
                      <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-center space-y-1">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {jadwalViewMode === 'hari_ini'
                            ? `Tidak ada jadwal Diniyyah pada hari ${todayDayName}.`
                            : 'Jadwal pelajaran belum ditambahkan oleh Guru.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                        {studentJadwal.map((jdw) => {
                          const theme = getSubjectTheme(jdw.mapel);
                          return (
                            <div
                              key={jdw.id}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <p className={`text-xs font-bold truncate ${theme.accentText}`}>
                                  {jdw.mapel}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {jdw.hari} · {jdw.kelas}
                                </p>
                              </div>
                              <span className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-300 tabular-nums shrink-0">
                                {jdw.jamMulai}–{jdw.jamSelesai}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Widget 3: Kalender Mini */}
                <MiniMonthlyCalendar
                  learningItems={studentItems}
                  onSelectDeadlineItem={(item) => openTaskModal(item)}
                />

                {/* Widget 4: Papan Pengumuman Diniyyah (Tepat di samping Kalender) */}
                <div className="md:col-span-1 lg:col-span-2">
                  <PapanPengumumanCard announcements={studentPengumuman} />
                </div>

                {/* Widget 5: Mahfudzot Harian */}
                <div className="md:col-span-2 lg:col-span-3">
                  <DailyMahfudzotCard />
                </div>
              </div>

              {/* Widget 5: Peringkat Keaktifan Kelas (Privacy-Safe, Tanpa Data Individu Teman) */}
              <section
                aria-labelledby="peringkat-keaktifan-kelas-siswa-heading"
                className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/25 flex items-center justify-center text-white shrink-0">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3
                        id="peringkat-keaktifan-kelas-siswa-heading"
                        className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100"
                      >
                        Peringkat Keaktifan Kelas
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Persentase kolektif baca materi dan penyelesaian tugas seluruh 12 kelas
                      </p>
                    </div>
                  </div>

                  {myClassSummary && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-cyan-500/10 dark:from-indigo-500/20 dark:to-cyan-500/20 border border-indigo-500/25 shrink-0">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Kelas Anda ({student.kelas}):
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs tabular-nums ${getRankBadgeClasses(
                          myClassSummary.rank
                        )}`}
                      >
                        #{myClassSummary.rank} · {myClassSummary.activityPct}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {classLeaderboard.map((cls) => {
                    const isMyClass = cls.kelas === student.kelas;
                    const rankBadgeClass = getRankBadgeClasses(cls.rank);

                    return (
                      <div
                        key={cls.kelas}
                        className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                          isMyClass
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/35 border-indigo-500/60 dark:border-cyan-400/60 ring-1 ring-indigo-500/30 dark:ring-cyan-400/30'
                            : 'bg-slate-50/90 dark:bg-[#0B1120] border-slate-200/80 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums shrink-0 ${rankBadgeClass}`}
                            >
                              #{cls.rank}
                            </span>
                            <span className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                              {cls.kelas}
                            </span>
                          </div>
                          {isMyClass ? (
                            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold shrink-0">
                              Kelas Anda
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                              Tingkat {cls.tingkat}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-300 font-medium">
                              Keaktifan Kelas
                            </span>
                            <span className="font-mono font-bold text-indigo-700 dark:text-cyan-400 tabular-nums">
                              {cls.activityPct}%
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isMyClass
                                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500'
                                  : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                              }`}
                              style={{ width: `${cls.activityPct}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums pt-0.5">
                            <span>Baca {cls.readPct}%</span>
                            <span>Tugas {cls.taskPct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: MAPEL SAYA */}
          {activeTab === 'mapel' && (
            <div className="space-y-6">
              {/* Subject Filter Bar (strictly shows only visibleSubjects) */}
              <div className="flex flex-wrap items-center gap-2">
                {visibleSubjects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedSubject('ALL')}
                    className={`min-h-[42px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                      selectedSubject === 'ALL'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                        : 'bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Semua Mapel ({visibleSubjects.length})
                  </button>
                )}

                {visibleSubjects.map((sub) => {
                  const active =
                    visibleSubjects.length === 1 || selectedSubject === sub;
                  const subTheme = getSubjectTheme(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSelectedSubject(sub)}
                      className={`min-h-[42px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                        active
                          ? `${subTheme.gradientBg} ${subTheme.shadow} text-white`
                          : 'bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>

              {showTahfidzHistory && renderPersistentJilidWarning()}

              {/* Subject Description Cards */}
              <div
                className={`grid gap-4 ${
                  visibleSubjects.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                }`}
              >
                {visibleSubjects
                  .filter((sub) => selectedSubject === 'ALL' || selectedSubject === sub)
                  .map((sub) => {
                    const meta = SUBJECT_META[sub];
                    const subTheme = getSubjectTheme(sub);
                    const subMaterials = studentItems.filter(
                      (i) => i.mapel === sub && i.type === 'materi'
                    ).length;
                    const subTasks = studentItems.filter(
                      (i) => i.mapel === sub && i.type === 'tugas'
                    ).length;
                    return (
                      <div
                        key={sub}
                        className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
                      >
                        <div className={`h-1.5 ${subTheme.gradientBar}`} />
                        <div className="p-5 flex items-start justify-between gap-4">
                          <div>
                            <p className={`text-xs font-semibold ${subTheme.accentText}`}>
                              {meta.focus}
                            </p>
                            <h3 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                              {meta.title}
                            </h3>
                            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                              {meta.subtitle}
                            </p>
                          </div>
                          <div className="text-right text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                            <p>{subMaterials} materi</p>
                            <p>{subTasks} tugas</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Section: Tugas Siswa */}
              <section aria-labelledby="heading-tugas" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 id="heading-tugas" className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    Daftar Tugas
                  </h3>
                  <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                    {assignments.length} tugas tersedia
                  </span>
                </div>

                {assignments.length === 0 ? (
                  <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-600 dark:text-slate-400">
                    Belum ada tugas pada mata pelajaran ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignments.map((item) => {
                      const sub = submissions.find(
                        (s) => s.itemId === item.id && s.studentNis === student.nis
                      );
                      const matchedTugas = tugasList.find((t) => t.itemId === item.id);
                      const soalCount = matchedTugas?.soalList.length ?? item.soalCount ?? 0;
                      const totalPoin = matchedTugas?.totalPoin ?? item.totalPoin ?? 0;
                      const isDone = sub?.status === 'Selesai';
                      const isOfflineJilid = isJilidOfflineTask(item);
                      const itemTheme = getSubjectTheme(item.mapel);
                      return (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:-translate-y-0.5 transition-all"
                        >
                          <div className={`h-1.5 ${itemTheme.gradientBar}`} />
                          <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`text-xs font-semibold ${itemTheme.accentText}`}>
                                    {item.mapel}
                                  </span>
                                  {item.targetPeserta && item.targetPeserta !== 'Semua' && (
                                    <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 text-[10px] font-semibold">
                                      Khusus {item.targetPeserta}
                                    </span>
                                  )}
                                  {isOfflineJilid && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-semibold">
                                      Kumpul Buku Tulis
                                    </span>
                                  )}
                                </div>
                                {isDone && isOfflineJilid ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-teal-500/25 whitespace-nowrap">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-white shrink-0" />
                                    <span>Sudah Dikumpulkan</span>
                                  </span>
                                ) : (
                                  <StatusBadge variant={isDone ? 'selesai' : 'belum'} />
                                )}
                              </div>
                              <h4 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                                {item.judul}
                              </h4>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                                {item.mapel === 'Bahasa Arab' || item.mapel === 'Aqidah'
                                  ? stripHtmlTags(item.deskripsi)
                                  : item.deskripsi}
                              </p>
                              {isDone && isOfflineJilid && (
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  {sub?.nilaiHuruf && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-sm shadow-emerald-500/20">
                                      Nilai: {sub.nilaiHuruf}
                                    </span>
                                  )}
                                  {sub?.catatanGuru && (
                                    <p className="text-xs text-slate-600 dark:text-slate-300">
                                      Catatan: {sub.catatanGuru}
                                    </p>
                                  )}
                                </div>
                              )}
                              {isDone && sub?.gradingStatus === 'waiting_essay' && (
                                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                  Menunggu Koreksi Essay
                                  {typeof sub.autoScore === 'number' &&
                                    ` · Skor sementara: ${sub.autoScore}/${sub.maxScore ?? totalPoin}`}
                                </p>
                              )}
                              {isDone &&
                                !isOfflineJilid &&
                                sub?.gradingStatus === 'graded' &&
                                typeof sub.finalScore === 'number' && (
                                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                                    Nilai Akhir: {sub.finalScore} / {sub.maxScore ?? totalPoin}
                                  </p>
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums space-y-0.5">
                                {isOfflineJilid ? (
                                  <>
                                    <p className="font-sans font-semibold text-teal-700 dark:text-teal-300">
                                      Ceklis Guru (Buku Tulis)
                                    </p>
                                    <p>
                                      {item.tenggat ? `Tenggat: ${item.tenggat}` : 'Tanpa batas waktu'}
                                    </p>
                                  </>
                                ) : (
                                  <p>{item.tenggat ? `Tenggat: ${item.tenggat}` : 'Tanpa tenggat'}</p>
                                )}
                                {(item.mapel === 'Bahasa Arab' || item.mapel === 'Aqidah') && (
                                  <p className={`${itemTheme.accentText} font-semibold flex items-center gap-1`}>
                                    <Clock className="h-3 w-3 shrink-0" />
                                    <span>
                                      Durasi: {item.durasiMenit || 30} mnt
                                      {soalCount > 0 ? ` · ${soalCount} Soal (${totalPoin} poin)` : ''}
                                    </span>
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => openTaskModal(item)}
                                className={`min-h-[42px] px-4 py-2 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap ${
                                  isDone
                                    ? 'rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors'
                                    : PRIMARY_CTA_CLASS
                                }`}
                              >
                                <ClipboardCheck className="h-4 w-4" />
                                <span>
                                  {isDone
                                    ? isOfflineJilid
                                      ? 'Lihat Detail & Nilai'
                                      : 'Lihat Jawaban'
                                    : isOfflineJilid
                                    ? 'Lihat Tugas'
                                    : 'Kerjakan Tugas'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Section: Riwayat Setoran & Hafalan (Khusus Mapel Tahfidz/Tahsin) */}
              {showTahfidzHistory && (
                <section aria-labelledby="heading-riwayat-tahfidz" className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h3
                        id="heading-riwayat-tahfidz"
                        className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100"
                      >
                        Riwayat Setoran & Hafalan
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Rekam capaian Tahfidz/Tahsin, nilai, keputusan, dan catatan perbaikan dari guru.
                      </p>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                      {studentTahfidzRecords.length} riwayat setoran
                    </span>
                  </div>

                  {studentTahfidzRecords.length === 0 ? (
                    <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-600 dark:text-slate-400">
                      Belum ada riwayat setoran Tahfidz/Tahsin yang dicatat oleh guru.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studentTahfidzRecords.map((rec) => (
                        <div
                          key={rec.id}
                          className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm"
                        >
                          <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400" />
                          <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                                    {rec.jenisSetoran}
                                  </p>
                                  <h4 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                                    {rec.capaian}
                                  </h4>
                                </div>
                                <StatusBadge
                                  variant={
                                    rec.keputusan === 'Lanjut'
                                      ? 'lanjut'
                                      : 'mengulang'
                                  }
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
                                <div>
                                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    Nilai
                                  </p>
                                  <p className="mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                    {rec.nilai}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    Tanggal Setoran
                                  </p>
                                  <p className="mt-0.5 font-mono text-xs font-medium text-slate-900 dark:text-slate-200 tabular-nums">
                                    {rec.tanggal}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                  Catatan Guru
                                </p>
                                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {rec.catatanGuru}
                                </p>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                              Dinilai oleh {rec.guruNama}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Section: Riwayat Ujian Tahfidz & Kenaikan Juz */}
              {(showTahfidzHistory || studentUjianTahfidz.length > 0) && (
                <section aria-labelledby="heading-riwayat-ujian-tahfidz" className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3
                        id="heading-riwayat-ujian-tahfidz"
                        className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"
                      >
                        <GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Riwayat Ujian Tahfidz &amp; Kenaikan Juz</span>
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Level aktif saat ini:{' '}
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">
                          {studentTahfidzProfile.category} ({studentTahfidzProfile.level})
                        </span>
                      </p>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                      {studentUjianTahfidz.length} riwayat ujian
                    </span>
                  </div>

                  {studentUjianTahfidz.length === 0 ? (
                    <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      Belum ada riwayat ujian kenaikan Juz / Jilid.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studentUjianTahfidz.map((ex) => (
                        <div
                          key={ex.id}
                          className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
                        >
                          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                          <div className="p-5 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                                  {ex.tanggalUjian}
                                </p>
                                <h4 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                                  Ujian {ex.levelDiujikan}
                                </h4>
                              </div>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  ex.status === 'Lulus'
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                {ex.status}
                              </span>
                            </div>

                            {ex.status === 'Lulus' && ex.naikKeLevel && (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                                <span>Naik Level ke {ex.naikKeLevel}</span>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs">
                              <div>
                                <p className="text-slate-500 dark:text-slate-400">Nilai Ujian</p>
                                <p className="mt-0.5 font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {ex.nilai}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500 dark:text-slate-400">Penguji</p>
                                <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100 truncate">
                                  {ex.penguji}
                                </p>
                              </div>
                            </div>

                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                Catatan Penguji:{' '}
                              </span>
                              {ex.catatan}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Section: Materi Pembelajaran */}
              <section aria-labelledby="heading-materi" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 id="heading-materi" className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    Materi Pembelajaran
                  </h3>
                  <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                    {materials.length} materi tersedia
                  </span>
                </div>

                {materials.length === 0 ? (
                  <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-600 dark:text-slate-400">
                    Belum ada materi pada mata pelajaran ini.
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl divide-y divide-slate-200/80 dark:divide-slate-800 overflow-hidden shadow-sm">
                    {materials.map((item) => {
                      const readRec = readRecords.find(
                        (r) => r.itemId === item.id && r.studentNis === student.nis
                      );
                      const matTheme = getSubjectTheme(item.mapel);
                      return (
                        <div
                          key={item.id}
                          className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-[#0B1120]/50 transition-colors"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className={`font-semibold ${matTheme.accentText}`}>{item.mapel}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{item.createdAt}</span>
                              <span aria-hidden="true">·</span>
                              <StatusBadge variant={readRec ? 'dibaca' : 'belum_dibaca'} />
                            </div>
                            <h4 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                              {item.judul}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                              {item.mapel === 'Bahasa Arab' || item.mapel === 'Aqidah'
                                ? stripHtmlTags(item.deskripsi)
                                : item.deskripsi}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => openMaterialReader(item)}
                            className="min-h-[42px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0B1120] hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:border-indigo-300 dark:hover:border-indigo-700 text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors"
                          >
                            <BookOpen className="h-4 w-4" />
                            <span>{readRec ? 'Baca Ulang' : 'Baca Materi'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 2: PENGATURAN AKUN */}
          {activeTab === 'akun' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Profile Info */}
              <div className="lg:col-span-5 bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
                <div className="p-6 space-y-4">
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    Informasi Akun Siswa
                  </h2>

                  <div className="divide-y divide-slate-200/80 dark:divide-slate-800 text-sm">
                    <div className="py-3 flex items-center justify-between gap-4">
                      <span className="text-slate-600 dark:text-slate-400">Nama Lengkap</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-right">{student.nama}</span>
                    </div>
                    <div className="py-3 flex items-center justify-between gap-4">
                      <span className="text-slate-600 dark:text-slate-400">NIS (Username)</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {student.nis}
                      </span>
                    </div>
                    <div className="py-3 flex items-center justify-between gap-4">
                      <span className="text-slate-600 dark:text-slate-400">Kelas</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{student.kelas}</span>
                    </div>
                    <div className="py-3 flex items-center justify-between gap-4">
                      <span className="text-slate-600 dark:text-slate-400">Mapel Aktif</span>
                      <span className="font-semibold text-teal-600 dark:text-teal-400 text-right">
                        {allowedSubjects.join(', ')}
                      </span>
                    </div>
                    <div className="py-3 flex items-center justify-between gap-4">
                      <span className="text-slate-600 dark:text-slate-400">Level Tahfidz / Jilid</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                        {studentTahfidzProfile.category} · {studentTahfidzProfile.level}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Change Password Form */}
              <div className="lg:col-span-7 bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/25 flex items-center justify-center text-white shrink-0">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                      Ubah Password Akun
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Gunakan password yang mudah diingat namun aman. Jika lupa password, hubungi Guru untuk melakukan reset.
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePasswordFormSubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="pwd-current"
                      className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                    >
                      Password Saat Ini
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <input
                        id="pwd-current"
                        type={showPwdFields ? 'text' : 'password'}
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                        placeholder="Masukkan password saat ini"
                        className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="pwd-new"
                      className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                    >
                      Password Baru (minimal 6 karakter)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <input
                        id="pwd-new"
                        type={showPwdFields ? 'text' : 'password'}
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        placeholder="Masukkan password baru"
                        className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="pwd-confirm"
                      className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                    >
                      Konfirmasi Password Baru
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <input
                        id="pwd-confirm"
                        type={showPwdFields ? 'text' : 'password'}
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        placeholder="Ulangi password baru"
                        className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPwdFields((prev) => !prev)}
                    className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  >
                    {showPwdFields ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Sembunyikan karakter password</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span>Tampilkan karakter password</span>
                      </>
                    )}
                  </button>

                  {pwdFeedback && (
                    <div
                      role="alert"
                      className={`p-3.5 rounded-xl text-xs sm:text-sm border ${
                        pwdFeedback.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {pwdFeedback.text}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className={`min-h-[46px] px-6 py-2.5 text-sm ${PRIMARY_CTA_CLASS}`}
                    >
                      Simpan Password Baru
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: BUKU JILID (E-BOOK INTERAKTIF) */}
          {activeTab === 'jilid' && (
            <div className="space-y-6">
              <div className={`${ELECTRIC_BANNER_CLASS} rounded-2xl p-5 sm:p-6`}>
                <h2 className="font-display text-lg font-bold text-white">
                  Buku Jilid Tahfidz & Tahsin
                </h2>
                <p className="text-xs sm:text-sm text-indigo-100 mt-1">
                  Pilih buku jilid untuk membaca halaman per halaman dengan mode hemat kuota. Halaman terakhir yang Anda buka tersimpan otomatis.
                </p>
              </div>

              {jilidBooks.length === 0 ? (
                <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 text-center text-sm text-slate-600 dark:text-slate-400">
                  Belum ada buku jilid yang tersedia saat ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {jilidBooks.map((book) => {
                    const prog = jilidProgress.find(
                      (p) => p.bookId === book.id && p.studentNis === student.nis
                    );
                    const total = book.pages.length;
                    const lastPage = prog?.lastPageRead || 0;
                    const pct = total > 0 ? Math.round((lastPage / total) * 100) : 0;

                    return (
                      <div
                        key={book.id}
                        className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:-translate-y-0.5 transition-all"
                      >
                        <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500" />
                        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                {total} Halaman
                              </span>
                              <span className="font-mono tabular-nums">
                                {lastPage > 0 ? `Hal. ${lastPage}/${total}` : 'Belum dibaca'}
                              </span>
                            </div>

                            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                              {book.judul}
                            </h3>

                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                              {book.deskripsi}
                            </p>
                          </div>

                          <div className="space-y-3 pt-2">
                            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => setActiveJilidBook(book)}
                              className={`w-full min-h-[44px] px-4 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2 ${PRIMARY_CTA_CLASS}`}
                            >
                              <BookOpen className="h-4 w-4 shrink-0" />
                              <span>
                                {lastPage > 0
                                  ? `Lanjutkan Halaman ${lastPage}`
                                  : 'Mulai Membaca'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB NILAI HARIAN SISWA */}
          {activeTab === 'nilai_harian' && (
            <NilaiHarianSiswaView
              student={student}
              visibleSubjects={visibleSubjects}
              nilaiHarianList={nilaiHarianList}
            />
          )}

          {/* TAB 3: KAMUS ARAB */}
          {activeTab === 'kamus' && <KamusArabView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Glassmorphism strictly on Bottom Nav; hidden during locked exam) */}
      {!hasActiveLockedExam && (
        <nav
          aria-label="Navigasi Bawah Siswa"
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-6 h-16"
        >
          <button
            type="button"
            onClick={() => selectTab('beranda')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[44px] text-[11px] font-medium transition-colors ${
              activeTab === 'beranda'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => selectTab('mapel')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[44px] text-[11px] font-medium transition-colors ${
              activeTab === 'mapel'
                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Mapel</span>
          </button>

          <button
            type="button"
            onClick={() => selectTab('jilid')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[44px] text-[11px] font-medium transition-colors ${
              activeTab === 'jilid'
                ? 'text-cyan-600 dark:text-cyan-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Library className="h-4 w-4" />
            <span>Jilid</span>
          </button>

          <button
            type="button"
            onClick={() => selectTab('nilai_harian')}
            className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] text-[11px] font-medium transition-colors ${
              activeTab === 'nilai_harian'
                ? 'text-violet-600 dark:text-violet-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>Nilai</span>
            {missingNilaiHarianSessions.length > 0 && (
              <span className="absolute top-1.5 right-3 h-2 w-2 rounded-full bg-rose-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => selectTab('kamus')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[44px] text-[11px] font-medium transition-colors ${
              activeTab === 'kamus'
                ? 'text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Languages className="h-4 w-4" />
            <span>Kamus</span>
          </button>

          <button
            type="button"
            onClick={() => selectTab('akun')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[44px] text-[11px] font-medium transition-colors ${
              activeTab === 'akun'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Akun</span>
          </button>
        </nav>
      )}

      {/* Full-Screen E-Book Jilid Reader */}
      {activeJilidBook && (
        <EbookReaderModal
          book={activeJilidBook}
          initialPage={
            jilidProgress.find(
              (p) =>
                p.bookId === activeJilidBook.id && p.studentNis === student.nis
            )?.lastPageRead || 1
          }
          onTrackPage={(bookId, pageNumber, totalPages) =>
            onUpdateJilidProgress(bookId, pageNumber, totalPages)
          }
          onClose={() => {
            setActiveJilidBook(null);
            showToast('Progres membaca buku jilid berhasil disimpan.');
          }}
        />
      )}

      {/* Material Reader Modal */}
      {readingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reader-title"
        >
          <div className="w-full max-w-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className={`h-1.5 ${getSubjectTheme(readingItem.mapel).gradientBar} shrink-0`} />
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span className={`font-semibold ${getSubjectTheme(readingItem.mapel).accentText}`}>
                    {readingItem.mapel}
                  </span>
                  <span aria-hidden="true">·</span>
                  <StatusBadge variant="dibaca" />
                </div>
                <h3 id="reader-title" className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  {readingItem.judul}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReadingItem(null)}
                aria-label="Tutup materi"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Disusun oleh {readingItem.authorName} · Dipublikasikan {readingItem.createdAt}
              </p>
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
                {readingItem.mapel === 'Bahasa Arab' || readingItem.mapel === 'Aqidah' ? (
                  <MaterialContentRenderer content={readingItem.konten} />
                ) : (
                  <div className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-line">
                    {readingItem.konten}
                  </div>
                )}
              </div>
              {readingItem.lampiranNama && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs font-medium text-slate-900 dark:text-slate-100">
                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{readingItem.lampiranNama}</span>
                  </div>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Lampiran Modul</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120]/70 flex justify-end">
              <button
                type="button"
                onClick={() => setReadingItem(null)}
                className={`min-h-[42px] px-5 py-2 text-sm ${PRIMARY_CTA_CLASS}`}
              >
                Selesai Membaca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Submission Modal */}
      {taskItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
        >
          <div className="w-full max-w-xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className={`h-1.5 ${getSubjectTheme(taskItem.mapel).gradientBar} shrink-0`} />
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
              <div>
                <p className={`text-xs font-semibold ${getSubjectTheme(taskItem.mapel).accentText}`}>
                  {taskItem.mapel}
                </p>
                <h3 id="task-modal-title" className="mt-0.5 font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  {taskItem.judul}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTaskItem(null)}
                aria-label="Tutup form tugas"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isJilidOfflineTask(taskItem) ? (
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-800 dark:text-teal-300 font-semibold">
                    Kumpul Langsung Buku Tulis (Ceklis Guru)
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                    {taskItem.tenggat ? `Tenggat: ${taskItem.tenggat}` : 'Tanpa batas durasi waktu'}
                  </span>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {taskItem.konten}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/45 border-2 border-amber-300 dark:border-amber-700/70 space-y-1.5">
                  <p className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-100 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Petunjuk Pengumpulan</span>
                  </p>
                  <p className="text-xs sm:text-sm text-amber-950/90 dark:text-amber-200 leading-relaxed">
                    Kerjakan di buku tulis, lalu serahkan langsung kepada guru untuk diceklis dan dinilai.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setTaskItem(null)}
                    className={`min-h-[42px] px-5 py-2 text-sm ${PRIMARY_CTA_CLASS}`}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTaskSubmit} className="p-6 overflow-y-auto space-y-4">
                <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
                  {taskItem.mapel === 'Bahasa Arab' || taskItem.mapel === 'Aqidah' ? (
                    <MaterialContentRenderer content={taskItem.konten} />
                  ) : (
                    <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {taskItem.konten}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="task-answer" className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                    Jawaban / Catatan Pengumpulan Tugas
                  </label>
                  <textarea
                    id="task-answer"
                    rows={4}
                    required
                    value={taskAnswer}
                    onChange={(e) => setTaskAnswer(e.target.value)}
                    placeholder="Tuliskan ringkasan jawaban atau konfirmasi setoran hafalan Anda di sini..."
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label htmlFor="task-file" className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                    Nama File Lampiran (Opsional - Simulasi)
                  </label>
                  <input
                    id="task-file"
                    type="text"
                    value={taskFileName}
                    onChange={(e) => setTaskFileName(e.target.value)}
                    placeholder="Contoh: Tugas_Aqidah_NamaSiswa.pdf"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setTaskItem(null)}
                    className="min-h-[42px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`min-h-[42px] px-5 py-2 text-sm flex items-center gap-2 ${PRIMARY_CTA_CLASS}`}
                  >
                    <Send className="h-4 w-4" />
                    <span>Kumpulkan Tugas</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Pre-Start Warning Confirmation Modal (Locked & Timed Exam) */}
      {confirmStartExamItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-start-exam-title"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className={`h-1.5 ${getSubjectTheme(confirmStartExamItem.mapel).gradientBar}`} />
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/25 flex items-center justify-center text-white shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <p className={`text-xs font-semibold ${getSubjectTheme(confirmStartExamItem.mapel).accentText}`}>
                    {confirmStartExamItem.mapel}
                  </p>
                  <h3
                    id="confirm-start-exam-title"
                    className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                  >
                    {confirmStartExamItem.judul}
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs sm:text-sm text-amber-950 dark:text-amber-200 leading-relaxed space-y-2">
                <p className="font-semibold">
                  Perhatian: Tugas ini memiliki batas waktu{' '}
                  <span className="font-mono font-bold">
                    {confirmStartExamItem.durasiMenit || 30} menit
                  </span>{' '}
                  dan layar akan terkunci hingga Anda mengumpulkan jawaban. Apakah Anda siap memulai?
                </p>
                <p className="text-xs opacity-90">
                  Timer tetap berjalan meskipun halaman di-refresh atau ditutup, serta perpindahan tab/layar akan tercatat otomatis untuk Guru.
                </p>
              </div>

              {startExamError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300"
                >
                  {startExamError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isStartingExam}
                  onClick={() => setConfirmStartExamItem(null)}
                  className="min-h-[42px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isStartingExam}
                  onClick={handleConfirmStartExam}
                  className={`min-h-[42px] px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-60 ${PRIMARY_CTA_CLASS}`}
                >
                  {isStartingExam ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Memulai...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Mulai Kerjakan Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Completed Task Modal (Plain Text Student Answer) */}
      {completedTaskModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65"
          role="dialog"
          aria-modal="true"
          aria-labelledby="completed-task-title"
        >
          <div className="w-full max-w-xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className={`h-1.5 ${getSubjectTheme(completedTaskModal.item.mapel).gradientBar} shrink-0`} />
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`font-semibold ${getSubjectTheme(completedTaskModal.item.mapel).accentText}`}>
                    {completedTaskModal.item.mapel}
                  </span>
                  <span aria-hidden="true">·</span>
                  {isJilidOfflineTask(completedTaskModal.item) ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white shrink-0" />
                      <span>Sudah Dikumpulkan</span>
                    </span>
                  ) : (
                    <StatusBadge variant="selesai" />
                  )}
                </div>
                <h3
                  id="completed-task-title"
                  className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-slate-100"
                >
                  {completedTaskModal.item.judul}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCompletedTaskModal(null)}
                aria-label="Tutup detail tugas"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-mono tabular-nums">
                  {isJilidOfflineTask(completedTaskModal.item)
                    ? `Diceklis Guru: ${
                        completedTaskModal.submission.checkedAt ||
                        completedTaskModal.submission.submittedAt ||
                        '-'
                      }`
                    : `Dikumpulkan: ${completedTaskModal.submission.submittedAt || '-'}`}
                </span>
                {!isJilidOfflineTask(completedTaskModal.item) &&
                  typeof completedTaskModal.submission.violationCount === 'number' && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-mono font-semibold ${
                        completedTaskModal.submission.violationCount > 0
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      <ShieldAlert className="h-3 w-3" />
                      <span>{completedTaskModal.submission.violationCount}x pindah layar</span>
                    </span>
                  )}
              </div>

              {isJilidOfflineTask(completedTaskModal.item) && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold">
                      Status: Sudah Dikumpulkan (Buku Tulis)
                    </span>
                    {completedTaskModal.submission.nilaiHuruf && (
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-display text-sm font-bold shadow-xs">
                        Nilai: {completedTaskModal.submission.nilaiHuruf}
                      </span>
                    )}
                  </div>
                  {completedTaskModal.submission.gradedBy && (
                    <p className="text-xs opacity-90">
                      Dinilai oleh: {completedTaskModal.submission.gradedBy}
                    </p>
                  )}
                  {completedTaskModal.submission.catatanGuru && (
                    <p className="text-xs leading-relaxed pt-1 whitespace-pre-line">
                      Catatan Guru: {completedTaskModal.submission.catatanGuru}
                    </p>
                  )}
                </div>
              )}

              {/* Score Summary Banner */}
              {completedTaskModal.submission.gradingStatus === 'waiting_essay' && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-bold">Menunggu Koreksi Essay dari Guru</p>
                  {typeof completedTaskModal.submission.autoScore === 'number' && (
                    <p className="font-mono text-xs tabular-nums">
                      Skor soal otomatis sementara: {completedTaskModal.submission.autoScore} / {completedTaskModal.submission.maxScore ?? '-'}
                    </p>
                  )}
                </div>
              )}

              {!isJilidOfflineTask(completedTaskModal.item) &&
                completedTaskModal.submission.gradingStatus === 'graded' &&
                typeof completedTaskModal.submission.finalScore === 'number' && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">Nilai Akhir</span>
                      <span className="font-mono text-base font-bold tabular-nums">
                        {completedTaskModal.submission.finalScore} / {completedTaskModal.submission.maxScore ?? '-'}
                      </span>
                    </div>
                    {completedTaskModal.submission.catatanGuru && (
                      <p className="text-xs leading-relaxed pt-1 whitespace-pre-line">
                        Catatan Guru: {completedTaskModal.submission.catatanGuru}
                      </p>
                    )}
                  </div>
                )}

              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
                {completedTaskModal.item.mapel === 'Bahasa Arab' ||
                completedTaskModal.item.mapel === 'Aqidah' ? (
                  <MaterialContentRenderer content={completedTaskModal.item.konten} />
                ) : (
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {completedTaskModal.item.konten}
                  </div>
                )}
              </div>

              {!isJilidOfflineTask(completedTaskModal.item) &&
                (() => {
                  const matchedTugas = tugasList.find(
                    (t) => t.itemId === completedTaskModal.item.id
                  );
                  const structAns = completedTaskModal.submission.structuredAnswers;
                  const itemScores = completedTaskModal.submission.itemScores;

                  if (matchedTugas && structAns) {
                    return (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          Rincian Jawaban Terkumpul (Terkunci)
                        </p>
                        {matchedTugas.soalList.map((soal, idx) => {
                          const ans = structAns[soal.id];
                          const score = itemScores?.[soal.id];
                          return (
                            <div
                              key={soal.id}
                              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                  Soal #{idx + 1}
                                </span>
                                {typeof score === 'number' ? (
                                  <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                                    {soal.type === 'essay' &&
                                    completedTaskModal.submission.gradingStatus === 'waiting_essay'
                                      ? `Menunggu koreksi (Maks. ${soal.poin})`
                                      : `Skor: ${score} / ${soal.poin}`}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 dark:text-slate-400">
                                    {soal.poin} poin
                                  </span>
                                )}
                              </div>

                              <MaterialContentRenderer content={soal.pertanyaan} />

                              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                                {soal.type === 'pilihan_ganda' && (
                                  <p dir="auto" className="whitespace-pre-line">
                                    Jawaban Anda:{' '}
                                    {typeof ans === 'string' && ans
                                      ? `${ans}. ${soal.opsi?.[ans as 'A' | 'B' | 'C' | 'D'] || ''}`
                                      : '(Tidak dijawab)'}
                                  </p>
                                )}
                                {soal.type === 'isian_singkat' && (
                                  <p dir="auto" className="whitespace-pre-line">
                                    Jawaban Anda: {typeof ans === 'string' && ans.trim() ? ans : '(Tidak dijawab)'}
                                  </p>
                                )}
                                {soal.type === 'menjodohkan' && (
                                  <div className="space-y-1">
                                    <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                                      Pasangan yang Anda pilih:
                                    </p>
                                    {(soal.kiriList || []).map((kiri) => {
                                      const pickedId =
                                        ans && typeof ans === 'object' ? ans[kiri.id] : '';
                                      const pickedText =
                                        soal.kananList?.find((r) => r.id === pickedId)?.text ||
                                        '(Belum dipilih)';
                                      return (
                                        <p key={kiri.id} dir="auto" className="text-xs whitespace-pre-line">
                                          {kiri.text} → {pickedText}
                                        </p>
                                      );
                                    })}
                                  </div>
                                )}
                                {soal.type === 'essay' && (
                                  <p dir="auto" className="whitespace-pre-line">
                                    {typeof ans === 'string' && ans.trim() ? ans : '(Tidak dijawab)'}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Jawaban Terkumpul (Terkunci)
                      </p>
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]">
                        {completedTaskModal.submission.jawaban || 'Tidak ada catatan teks.'}
                      </p>
                    </div>
                  );
                })()}

              {completedTaskModal.submission.fileNama && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 pt-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Lampiran: {completedTaskModal.submission.fileNama}</span>
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120]/70 flex justify-end">
              <button
                type="button"
                onClick={() => setCompletedTaskModal(null)}
                className={`min-h-[42px] px-5 py-2 text-sm ${PRIMARY_CTA_CLASS}`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
