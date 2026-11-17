import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  BookMarked,
  BookOpen,
  BookText,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Copy,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  KeyRound,
  Languages,
  Layers,
  LayoutDashboard,
  Library,
  ListChecks,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  Pencil,
  Pin,
  Plus,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import {
  ALL_CLASSES,
  ALL_GRADES,
  DEFAULT_STUDENT_PASSWORD,
  DEFAULT_TAHFIDZ_TAUGHT_CLASSES,
  GRADE_CLASSES,
  GURU_PROFILE,
  TAHFIDZ_ELIGIBLE_CLASSES,
  getGradeFromClass,
  getSubjectsForClass,
  getSubjectsForGrade,
  isItemForStudent,
} from '../../data/mockData';
import {
  AssignmentSubmission,
  AuthSession,
  ClassName,
  DayName,
  GradeLevel,
  GuruSoalDraft,
  JadwalMapelItem,
  JilidBook,
  JilidReadProgress,
  KunciTugasDocument,
  LearningItem,
  LearningItemType,
  MaterialReadRecord,
  NotifikasiItem,
  PengumumanItem,
  PengumumanTargetTingkat,
  ProtaItem,
  Student,
  SubjectName,
  TahfidzCategory,
  TahfidzDecision,
  TahfidzDepositType,
  TahfidzRecord,
  TugasDocument,
  UjianTahfidzRecord,
  UjianTahfidzStatus,
} from '../../types/lms';
import { gradeStructuredSubmission } from '../../lib/tugasGrading';
import {
  computeAllClassProgress,
  computeStudentsInClassProgress,
} from '../../lib/classProgress';
import {
  TAHFIDZ_LEVEL_OPTIONS,
  getStudentTahfidzProfile,
  inferCategoryFromLevel,
  isJilidOfflineTask,
} from '../../lib/tahfidzUtils';
import {
  getInitials,
  useCollapsibleSidebar,
} from '../../lib/useCollapsibleSidebar';
import {
  DailyMahfudzotCard,
  MiniMonthlyCalendar,
  SCHEDULE_DAYS,
  getTodayDayName,
} from '../BerandaCalendarAndQuote';
import { MaterialContentRenderer } from '../MaterialContentRenderer';
import { NotificationBell } from '../NotificationBell';
import { PapanPengumumanCard } from '../PapanPengumumanCard';
import { StatusBadge } from '../StatusBadge';
import {
  ELECTRIC_BANNER_CLASS,
  PRIMARY_CTA_CLASS,
  getRankBadgeClasses,
  getSubjectTheme,
} from '../../lib/themePalette';
import { CreateLearningItemModal } from './CreateLearningItemModal';
import { CsvImportModal } from './CsvImportModal';
import {
  JilidTaskChecklistPanel,
  SaveJilidChecklistPayload,
} from './JilidTaskChecklistPanel';
import { KamusArabView } from './KamusArabView';
import { LaporanHarianTahfidzView } from './LaporanHarianTahfidzView';
import { ManajemenBukuJilidView } from './ManajemenBukuJilidView';
import { SubjectMaterialsView } from './SubjectMaterialsView';
import { UjianKenaikanJuzView } from './UjianKenaikanJuzView';

type GuruTab =
  | 'beranda'
  | 'siswa'
  | 'bahasa_arab'
  | 'aqidah'
  | 'tahfidz'
  | 'ujian_tahfidz'
  | 'jilid'
  | 'laporan'
  | 'kamus';

interface GuruDashboardProps {
  session: AuthSession;
  students: Student[];
  learningItems: LearningItem[];
  tugasList: TugasDocument[];
  kunciTugasList: KunciTugasDocument[];
  readRecords: MaterialReadRecord[];
  submissions: AssignmentSubmission[];
  tahfidzRecords: TahfidzRecord[];
  ujianTahfidzList?: UjianTahfidzRecord[];
  jilidBooks: JilidBook[];
  jilidProgress: JilidReadProgress[];
  jadwalMapel: JadwalMapelItem[];
  protaList: ProtaItem[];
  pengumumanList?: PengumumanItem[];
  tahfidzTaughtClasses?: ClassName[];
  notifications: NotifikasiItem[];
  isDark?: boolean;
  onToggleDark?: () => void;
  onImportStudents: (newStudents: Student[]) => Promise<void>;
  onResetStudentPassword: (nis: string) => Promise<void>;
  onDeleteStudent?: (student: Student) => Promise<void>;
  onSaveTahfidzTaughtClasses?: (kelasAmpu: ClassName[]) => Promise<void>;
  onUpdateStudentTahfidzProfile: (
    nis: string,
    category: TahfidzCategory,
    level: string
  ) => Promise<void>;
  onSaveLearningItemWithSoal: (
    item: LearningItem,
    soalDrafts: GuruSoalDraft[],
    isEdit: boolean
  ) => Promise<void>;
  onDeleteLearningItem: (itemId: string) => Promise<void>;
  onSaveTeacherGrading: (
    submissionId: string,
    itemScores: Record<string, number>,
    autoScore: number,
    essayScore: number,
    finalScore: number,
    maxScore: number,
    catatanGuru: string
  ) => Promise<void>;
  onSaveJilidSubmissionChecklist?: (
    payload: SaveJilidChecklistPayload
  ) => Promise<void>;
  onAddTahfidzRecord: (record: Omit<TahfidzRecord, 'id' | 'tanggal'>) => Promise<void>;
  onDeleteTahfidzRecord: (recordId: string) => Promise<void>;
  onAddUjianTahfidz: (data: {
    student: Student;
    tanggalUjian: string;
    penguji: string;
    levelDiujikan: string;
    nilai: string;
    status: UjianTahfidzStatus;
    naikKeLevel?: string;
    catatan: string;
  }) => Promise<void>;
  onDeleteUjianTahfidz: (examId: string) => Promise<void>;
  onAddJilidBook: (book: JilidBook) => Promise<void>;
  onDeleteJilidBook: (book: JilidBook) => Promise<void>;
  onAddJadwalMapel: (jadwal: Omit<JadwalMapelItem, 'id' | 'authorUid'>) => Promise<void>;
  onUpdateJadwalMapel?: (
    jadwalId: string,
    jadwal: Omit<JadwalMapelItem, 'id' | 'authorUid'>
  ) => Promise<void>;
  onDeleteJadwalMapel: (jadwalId: string) => Promise<void>;
  onAddProtaItem: (item: Omit<ProtaItem, 'id' | 'authorUid'>) => Promise<void>;
  onToggleProtaItem: (item: ProtaItem) => Promise<void>;
  onDeleteProtaItem: (protaId: string) => Promise<void>;
  onAddPengumuman?: (data: {
    judul: string;
    isi: string;
    targetTingkat: PengumumanTargetTingkat;
    penting: boolean;
  }) => Promise<void>;
  onDeletePengumuman?: (pengumumanId: string) => Promise<void>;
  onMarkNotificationRead: (notif: NotifikasiItem) => Promise<void>;
  onMarkAllNotificationsRead: () => Promise<void>;
  onLogout: () => void;
}

export function GuruDashboard({
  session,
  students,
  learningItems,
  tugasList,
  kunciTugasList,
  readRecords,
  submissions,
  tahfidzRecords,
  ujianTahfidzList = [],
  jilidBooks,
  jilidProgress,
  jadwalMapel,
  protaList,
  pengumumanList = [],
  tahfidzTaughtClasses = DEFAULT_TAHFIDZ_TAUGHT_CLASSES,
  notifications,
  isDark = false,
  onToggleDark,
  onImportStudents,
  onResetStudentPassword,
  onDeleteStudent,
  onSaveTahfidzTaughtClasses,
  onUpdateStudentTahfidzProfile,
  onSaveLearningItemWithSoal,
  onDeleteLearningItem,
  onSaveTeacherGrading,
  onSaveJilidSubmissionChecklist,
  onAddTahfidzRecord,
  onDeleteTahfidzRecord,
  onAddUjianTahfidz,
  onDeleteUjianTahfidz,
  onAddJilidBook,
  onDeleteJilidBook,
  onAddJadwalMapel,
  onUpdateJadwalMapel,
  onDeleteJadwalMapel,
  onAddProtaItem,
  onToggleProtaItem,
  onDeleteProtaItem,
  onAddPengumuman,
  onDeletePengumuman,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onLogout,
}: GuruDashboardProps) {
  const [activeTab, setActiveTab] = useState<GuruTab>('beranda');
  const [isMapelMenuOpen, setIsMapelMenuOpen] = useState<boolean>(false);
  const {
    isSidebarOpen,
    toggleSidebar,
    expandSidebar,
    closeSidebarOnTablet,
    isMobileDrawerOpen,
    openMobileDrawer,
    closeMobileDrawer,
  } = useCollapsibleSidebar('lms_guru_sidebar_open');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Jadwal Mengajar state & quick tabs
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<DayName>(() => {
    const today = getTodayDayName();
    return today === 'Minggu' ? 'Senin' : today;
  });
  const [isWeeklyMatrixModalOpen, setIsWeeklyMatrixModalOpen] = useState(false);
  const [isJadwalModalOpen, setIsJadwalModalOpen] = useState(false);
  const [editingJadwalId, setEditingJadwalId] = useState<string | null>(null);
  const [jadwalHari, setJadwalHari] = useState<DayName>(() => {
    const today = getTodayDayName();
    return today === 'Minggu' ? 'Senin' : today;
  });
  const [jadwalKelas, setJadwalKelas] = useState<ClassName>('X RPL');
  const [jadwalMapelChoice, setJadwalMapelChoice] = useState<SubjectName>('Aqidah');
  const [jadwalJamMulai, setJadwalJamMulai] = useState('07:30');
  const [jadwalJamSelesai, setJadwalJamSelesai] = useState('09:00');
  const [isSavingJadwal, setIsSavingJadwal] = useState(false);

  // Pengumuman Modal state
  const [isPengumumanModalOpen, setIsPengumumanModalOpen] = useState(false);
  const [pengumumanJudul, setPengumumanJudul] = useState('');
  const [pengumumanIsi, setPengumumanIsi] = useState('');
  const [pengumumanTarget, setPengumumanTarget] =
    useState<PengumumanTargetTingkat>('Semua');
  const [pengumumanPenting, setPengumumanPenting] = useState(false);
  const [isSavingPengumuman, setIsSavingPengumuman] = useState(false);

  // PROTA Modal state
  const [isProtaModalOpen, setIsProtaModalOpen] = useState(false);
  const [protaMapel, setProtaMapel] = useState<SubjectName>('Bahasa Arab');
  const [protaTingkat, setProtaTingkat] = useState<GradeLevel>('XI');
  const [protaSemester, setProtaSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [protaBab, setProtaBab] = useState('');
  const [isSavingProta, setIsSavingProta] = useState(false);

  // Class Progress Detail Modal state
  const [selectedClassDetail, setSelectedClassDetail] = useState<ClassName | null>(null);
  const [copiedIncompleteClass, setCopiedIncompleteClass] = useState(false);

  // Manajemen Siswa state
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('ALL');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newStudentNis, setNewStudentNis] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClass, setNewStudentClass] = useState<ClassName>('X RPL');
  const [newStudentTahfidzLevel, setNewStudentTahfidzLevel] = useState<string>('Juz 30');
  const [addStudentError, setAddStudentError] = useState('');
  const [resetConfirmStudent, setResetConfirmStudent] = useState<Student | null>(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [isTahfidzClassesModalOpen, setIsTahfidzClassesModalOpen] = useState(false);
  const [draftTahfidzClasses, setDraftTahfidzClasses] =
    useState<ClassName[]>(tahfidzTaughtClasses);
  const [isSavingTahfidzClasses, setIsSavingTahfidzClasses] = useState(false);
  const [editingTahfidzStudent, setEditingTahfidzStudent] = useState<Student | null>(null);
  const [editStudentTahfidzCat, setEditStudentTahfidzCat] =
    useState<TahfidzCategory>('Tahfidz');
  const [editStudentTahfidzLevel, setEditStudentTahfidzLevel] = useState<string>('Juz 30');
  const [isSavingTahfidzProfile, setIsSavingTahfidzProfile] = useState(false);
  const [togglingCategoryNis, setTogglingCategoryNis] = useState<string | null>(null);

  const handleQuickToggleStudentCategory = async (
    student: Student,
    nextCategory: TahfidzCategory,
    nextLevel: string
  ) => {
    setTogglingCategoryNis(student.nis);
    try {
      await onUpdateStudentTahfidzProfile(student.nis, nextCategory, nextLevel);
      showToast(
        `Status ${student.nama} diubah menjadi ${nextCategory} (${nextLevel}).`
      );
    } catch {
      showToast(`Gagal mengubah status kategori ${student.nama}.`);
    } finally {
      setTogglingCategoryNis(null);
    }
  };

  // Create / Edit Materi & Tugas Modal state
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [modalLockedSubject, setModalLockedSubject] = useState<SubjectName | null>(null);
  const [modalDefaultType, setModalDefaultType] = useState<LearningItemType>('materi');
  const [editingLearningItem, setEditingLearningItem] = useState<LearningItem | null>(null);

  // Laporan & Grading state
  const [laporanSubTab, setLaporanSubTab] = useState<'tracking' | 'harian_tahfidz'>('tracking');
  const [reportClassFilter, setReportClassFilter] = useState<ClassName>('X RPL');
  const [reportSubjectFilter, setReportSubjectFilter] = useState<string>('ALL');
  const [reportTypeFilter, setReportTypeFilter] = useState<'ALL' | 'materi' | 'tugas'>('ALL');
  const [reportSearch, setReportSearch] = useState('');
  const [selectedSubmissionDetail, setSelectedSubmissionDetail] = useState<{
    student: Student;
    item: LearningItem;
    submission: AssignmentSubmission;
  } | null>(null);
  const [draftItemScores, setDraftItemScores] = useState<Record<string, number>>({});
  const [draftCatatanGuru, setDraftCatatanGuru] = useState('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [jilidChecklistModal, setJilidChecklistModal] = useState<{
    item: LearningItem;
    selectedClass: ClassName;
  } | null>(null);

  // Tahfidz/Tahsin Setoran state (kecualikan kelas non-ampu seperti XI TKJ & XI AK secara default)
  const tahfidzAvailableClasses = useMemo<ClassName[]>(
    () =>
      TAHFIDZ_ELIGIBLE_CLASSES.filter((cls) =>
        tahfidzTaughtClasses.includes(cls)
      ),
    [tahfidzTaughtClasses]
  );
  const [tahfidzInputClass, setTahfidzInputClass] = useState<ClassName>('XI RPL');
  const activeTahfidzInputClass: ClassName = tahfidzAvailableClasses.includes(
    tahfidzInputClass
  )
    ? tahfidzInputClass
    : tahfidzAvailableClasses[0] || 'XI RPL';
  const [tahfidzStudentSearch, setTahfidzStudentSearch] = useState('');
  const tahfidzStudents = useMemo(
    () =>
      students.filter(
        (s) =>
          getSubjectsForClass(s.kelas).includes('Tahfidz/Tahsin') &&
          tahfidzTaughtClasses.includes(s.kelas)
      ),
    [students, tahfidzTaughtClasses]
  );
  const tahfidzClassStudents = useMemo(() => {
    const q = tahfidzStudentSearch.trim().toLowerCase();
    return tahfidzStudents
      .filter((s) => {
        if (s.kelas !== activeTahfidzInputClass) return false;
        if (q && !s.nama.toLowerCase().includes(q) && !s.nis.toLowerCase().includes(q)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [tahfidzStudents, activeTahfidzInputClass, tahfidzStudentSearch]);
  const [tahfidzStudentNis, setTahfidzStudentNis] = useState<string>(
    () => tahfidzStudents[0]?.nis || ''
  );
  const [tahfidzDepositType, setTahfidzDepositType] =
    useState<TahfidzDepositType>('Setor (Hafalan Al-Quran)');
  const [tahfidzCapaian, setTahfidzCapaian] = useState('');
  const [tahfidzNilai, setTahfidzNilai] = useState('');
  const [tahfidzDecision, setTahfidzDecision] =
    useState<TahfidzDecision>('Lanjut');
  const [tahfidzNote, setTahfidzNote] = useState('');
  const [tahfidzFilterClass, setTahfidzFilterClass] = useState<string>('ALL');
  const [tahfidzFilterDecision, setTahfidzFilterDecision] =
    useState<string>('ALL');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const selectTab = (nextTab: GuruTab) => {
    setActiveTab(nextTab);
    if (
      nextTab === 'bahasa_arab' ||
      nextTab === 'aqidah' ||
      nextTab === 'tahfidz'
    ) {
      setIsMapelMenuOpen(true);
    }
    closeSidebarOnTablet();
    closeMobileDrawer();
  };

  const openCreateItemModal = (
    lockedSubject: SubjectName | null,
    defaultType: LearningItemType = 'materi'
  ) => {
    setEditingLearningItem(null);
    setModalLockedSubject(lockedSubject);
    setModalDefaultType(defaultType);
    setIsCreateItemModalOpen(true);
  };

  const openEditItemModal = (item: LearningItem) => {
    setEditingLearningItem(item);
    setModalLockedSubject(item.mapel);
    setModalDefaultType(item.type);
    setIsCreateItemModalOpen(true);
  };

  const openSubmissionGradingModal = (
    student: Student,
    item: LearningItem,
    submission: AssignmentSubmission
  ) => {
    const matchedTugas = tugasList.find((t) => t.itemId === item.id);
    const matchedKunci = kunciTugasList.find((k) => k.itemId === item.id);

    let initialScores: Record<string, number> = { ...(submission.itemScores || {}) };
    if (
      matchedTugas &&
      matchedKunci &&
      (!submission.itemScores || Object.keys(submission.itemScores).length === 0)
    ) {
      const computed = gradeStructuredSubmission(
        matchedKunci,
        submission.structuredAnswers || {}
      );
      initialScores = computed.itemScores;
    } else if (matchedTugas) {
      matchedTugas.soalList.forEach((soal) => {
        if (typeof initialScores[soal.id] !== 'number') {
          initialScores[soal.id] = 0;
        }
      });
    }

    setDraftItemScores(initialScores);
    setDraftCatatanGuru(submission.catatanGuru || '');
    setSelectedSubmissionDetail({ student, item, submission });
  };

  // Auto-sync report subject filter when report class changes
  const reportClassSubjects = getSubjectsForClass(reportClassFilter);
  const handleReportClassChange = (nextClass: ClassName) => {
    setReportClassFilter(nextClass);
    const allowed = getSubjectsForClass(nextClass);
    if (reportSubjectFilter !== 'ALL' && !allowed.includes(reportSubjectFilter as SubjectName)) {
      setReportSubjectFilter('ALL');
    }
  };

  const existingNisSet = useMemo(() => new Set(students.map((s) => s.nis)), [students]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return students.filter((s) => {
      const matchClass = studentClassFilter === 'ALL' || s.kelas === studentClassFilter;
      const matchQuery =
        !q || s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q);
      return matchClass && matchQuery;
    });
  }, [students, studentSearch, studentClassFilter]);

  // Overall stats
  const totalMaterials = learningItems.filter((i) => i.type === 'materi').length;
  const totalAssignments = learningItems.filter((i) => i.type === 'tugas').length;

  const { totalReadPossible, totalReadDone, totalTasksPossible, totalTasksDone } = useMemo(() => {
    let readPossible = 0;
    let readDone = 0;
    let tasksPossible = 0;
    let tasksDone = 0;

    students.forEach((st) => {
      learningItems.forEach((item) => {
        if (!isItemForStudent(item, st, tahfidzRecords, tahfidzTaughtClasses)) return;
        if (item.type === 'materi') {
          readPossible += 1;
          const hasRead = readRecords.some(
            (r) => r.itemId === item.id && r.studentNis === st.nis
          );
          if (hasRead) readDone += 1;
        } else {
          tasksPossible += 1;
          const sub = submissions.find(
            (subItem) => subItem.itemId === item.id && subItem.studentNis === st.nis
          );
          if (sub?.status === 'Selesai') tasksDone += 1;
        }
      });
    });

    return {
      totalReadPossible: readPossible,
      totalReadDone: readDone,
      totalTasksPossible: tasksPossible,
      totalTasksDone: tasksDone,
    };
  }, [students, learningItems, readRecords, submissions, tahfidzRecords, tahfidzTaughtClasses]);

  const waitingEssaySubmissions = useMemo(
    () => submissions.filter((s) => s.gradingStatus === 'waiting_essay'),
    [submissions]
  );

  const classProgressList = useMemo(
    () =>
      computeAllClassProgress(
        students,
        learningItems,
        readRecords,
        submissions,
        tahfidzRecords,
        tahfidzTaughtClasses
      ),
    [students, learningItems, readRecords, submissions, tahfidzRecords, tahfidzTaughtClasses]
  );

  const selectedClassSummary = useMemo(
    () =>
      selectedClassDetail
        ? classProgressList.find((c) => c.kelas === selectedClassDetail) || null
        : null,
    [classProgressList, selectedClassDetail]
  );

  const selectedClassStudentDetails = useMemo(
    () =>
      selectedClassDetail
        ? computeStudentsInClassProgress(
            selectedClassDetail,
            students,
            learningItems,
            readRecords,
            submissions,
            tahfidzRecords,
            tahfidzTaughtClasses
          )
        : [],
    [selectedClassDetail, students, learningItems, readRecords, submissions, tahfidzRecords, tahfidzTaughtClasses]
  );

  const handleCopyIncompleteStudents = async () => {
    if (!selectedClassDetail) return;
    const incomplete = selectedClassStudentDetails.filter(
      (d) => d.contributionPct < 100
    );

    if (incomplete.length === 0) {
      showToast(
        `Alhamdulillah, seluruh siswa kelas ${selectedClassDetail} sudah tuntas 100%.`
      );
      return;
    }

    const lines = incomplete.map(
      (d, idx) =>
        `${idx + 1}. ${d.student.nama} (NIS ${d.student.nis}) — Materi ${d.readDone}/${d.readTotal}, Tugas ${d.taskDone}/${d.taskTotal} (${d.contributionPct}%)`
    );

    const payload = [
      `Assalamu'alaikum. Berikut daftar siswa kelas ${selectedClassDetail} yang belum tuntas 100% materi/tugas Diniyyah:`,
      '',
      ...lines,
      '',
      'Mohon segera dilengkapi melalui LMS Diniyyah. Jazakumullahu khairan.',
    ].join('\n');

    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      const textarea = document.createElement('textarea');
      textarea.value = payload;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        copied = document.execCommand('copy');
      } catch {
        copied = false;
      }
      document.body.removeChild(textarea);
    }

    if (copied) {
      setCopiedIncompleteClass(true);
      setTimeout(() => setCopiedIncompleteClass(false), 2500);
      showToast(
        `${incomplete.length} nama siswa kelas ${selectedClassDetail} belum tuntas berhasil disalin ke clipboard.`
      );
    } else {
      showToast('Gagal menyalin otomatis. Silakan periksa izin clipboard browser.');
    }
  };

  const todayDayName = useMemo(() => getTodayDayName(), []);

  const quickDayTabs: { day: DayName; short: string }[] = useMemo(
    () => [
      { day: 'Senin', short: 'Sen' },
      { day: 'Selasa', short: 'Sel' },
      { day: 'Rabu', short: 'Rab' },
      { day: 'Kamis', short: 'Kam' },
      { day: 'Jumat', short: 'Jum' },
      { day: 'Sabtu', short: 'Sab' },
    ],
    []
  );

  const selectedDayJadwal = useMemo(() => {
    return jadwalMapel
      .filter((j) => j.hari === selectedScheduleDay)
      .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
  }, [jadwalMapel, selectedScheduleDay]);

  const jadwalByDayMap = useMemo(() => {
    const map: Record<DayName, JadwalMapelItem[]> = {
      Senin: [],
      Selasa: [],
      Rabu: [],
      Kamis: [],
      Jumat: [],
      Sabtu: [],
      Minggu: [],
    };
    for (const jdw of jadwalMapel) {
      if (map[jdw.hari]) {
        map[jdw.hari].push(jdw);
      }
    }
    for (const day of SCHEDULE_DAYS) {
      map[day].sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
    }
    return map;
  }, [jadwalMapel]);

  const sortedAllJadwal = useMemo(() => {
    const dayOrder = new Map(SCHEDULE_DAYS.map((d, idx) => [d, idx]));
    return [...jadwalMapel].sort((a, b) => {
      const da = dayOrder.get(a.hari) ?? 99;
      const db = dayOrder.get(b.hari) ?? 99;
      if (da !== db) return da - db;
      return a.jamMulai.localeCompare(b.jamMulai);
    });
  }, [jadwalMapel]);

  const protaCompletedCount = useMemo(
    () => protaList.filter((p) => p.selesai).length,
    [protaList]
  );

  const protaProgressPct = useMemo(
    () =>
      protaList.length > 0
        ? Math.round((protaCompletedCount / protaList.length) * 100)
        : 0,
    [protaList.length, protaCompletedCount]
  );

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const handleNotificationSelect = (notif: NotifikasiItem) => {
    void onMarkNotificationRead(notif);
    if (notif.type === 'pengumuman') {
      selectTab('beranda');
      showToast(`Pengumuman: ${notif.judul}`);
      return;
    }

    if (notif.type === 'submission') {
      selectTab('laporan');
      if (
        notif.targetKelas !== 'ALL' &&
        ALL_CLASSES.includes(notif.targetKelas as ClassName)
      ) {
        setReportClassFilter(notif.targetKelas as ClassName);
      }
      setReportTypeFilter('tugas');
      const matchedStudent = students.find((s) => s.nis === notif.studentNis);
      const matchedItem = learningItems.find((i) => i.id === notif.itemId);
      const matchedSubmission = submissions.find(
        (s) => s.itemId === notif.itemId && s.studentNis === notif.studentNis
      );
      if (matchedStudent && matchedItem && matchedSubmission) {
        openSubmissionGradingModal(matchedStudent, matchedItem, matchedSubmission);
      }
      return;
    }

    if (notif.mapel === 'Bahasa Arab') {
      selectTab('bahasa_arab');
    } else if (notif.mapel === 'Aqidah') {
      selectTab('aqidah');
    } else {
      selectTab('tahfidz');
    }
  };

  const openCreateJadwalModal = (presetDay?: DayName) => {
    setEditingJadwalId(null);
    const targetDay =
      presetDay && presetDay !== 'Minggu'
        ? presetDay
        : selectedScheduleDay === 'Minggu'
          ? 'Senin'
          : selectedScheduleDay;
    setJadwalHari(targetDay);
    setJadwalKelas('X RPL');
    setJadwalMapelChoice('Aqidah');
    setJadwalJamMulai('07:30');
    setJadwalJamSelesai('09:00');
    setIsJadwalModalOpen(true);
  };

  const openEditJadwalModal = (jdw: JadwalMapelItem) => {
    setEditingJadwalId(jdw.id);
    setJadwalHari(jdw.hari);
    setJadwalKelas(jdw.kelas);
    setJadwalMapelChoice(jdw.mapel);
    setJadwalJamMulai(jdw.jamMulai);
    setJadwalJamSelesai(jdw.jamSelesai);
    setIsJadwalModalOpen(true);
  };

  const handleCreateJadwalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingJadwal) return;
    setIsSavingJadwal(true);
    try {
      const tingkat = getGradeFromClass(jadwalKelas);
      const allowedForClass = getSubjectsForClass(jadwalKelas);
      const resolvedMapel = allowedForClass.includes(jadwalMapelChoice)
        ? jadwalMapelChoice
        : allowedForClass[0];
      const payload = {
        hari: jadwalHari,
        jamMulai: jadwalJamMulai,
        jamSelesai: jadwalJamSelesai,
        mapel: resolvedMapel,
        tingkat,
        kelas: jadwalKelas,
      };
      if (editingJadwalId && onUpdateJadwalMapel) {
        await onUpdateJadwalMapel(editingJadwalId, payload);
        setEditingJadwalId(null);
        setSelectedScheduleDay(jadwalHari);
        showToast(
          `Jadwal ${resolvedMapel} (${jadwalKelas}, ${jadwalHari} ${jadwalJamMulai}–${jadwalJamSelesai}) diperbarui.`
        );
      } else {
        await onAddJadwalMapel(payload);
        setSelectedScheduleDay(jadwalHari);
        showToast(
          `Jadwal ${resolvedMapel} (${jadwalKelas}, ${jadwalHari} ${jadwalJamMulai}–${jadwalJamSelesai}) ditambahkan.`
        );
      }
    } catch {
      showToast('Gagal menyimpan jadwal ke Firestore.');
    } finally {
      setIsSavingJadwal(false);
    }
  };

  const handleQuickDeleteJadwal = async (jdw: JadwalMapelItem) => {
    try {
      await onDeleteJadwalMapel(jdw.id);
      if (editingJadwalId === jdw.id) {
        setEditingJadwalId(null);
      }
      showToast(`Jadwal ${jdw.kelas} (${jdw.hari} ${jdw.jamMulai}) dihapus.`);
    } catch {
      showToast('Gagal menghapus jadwal dari Firestore.');
    }
  };

  const handleCreatePengumumanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddPengumuman || isSavingPengumuman) return;
    const judulClean = pengumumanJudul.trim();
    const isiClean = pengumumanIsi.trim();
    if (!judulClean || !isiClean) return;

    setIsSavingPengumuman(true);
    try {
      await onAddPengumuman({
        judul: judulClean,
        isi: isiClean,
        targetTingkat: pengumumanTarget,
        penting: pengumumanPenting,
      });
      setPengumumanJudul('');
      setPengumumanIsi('');
      setPengumumanTarget('Semua');
      setPengumumanPenting(false);
      setIsPengumumanModalOpen(false);
      showToast(
        'Pengumuman Diniyyah diterbitkan & notifikasi otomatis dikirim ke siswa.'
      );
    } catch {
      showToast('Gagal menerbitkan pengumuman ke Firestore.');
    } finally {
      setIsSavingPengumuman(false);
    }
  };

  const handleCreateProtaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!protaBab.trim() || isSavingProta) return;
    setIsSavingProta(true);
    try {
      await onAddProtaItem({
        mapel: protaMapel,
        tingkat: protaTingkat,
        semester: protaSemester,
        bab: protaBab.trim(),
        selesai: false,
      });
      setProtaBab('');
      showToast(`Target PROTA "${protaBab.trim()}" ditambahkan.`);
    } catch {
      showToast('Gagal menyimpan data PROTA ke Firestore.');
    } finally {
      setIsSavingProta(false);
    }
  };


  const handleConfirmResetPassword = async () => {
    if (!resetConfirmStudent) return;
    try {
      await onResetStudentPassword(resetConfirmStudent.nis);
      showToast(
        `Status password untuk ${resetConfirmStudent.nama} (NIS: ${resetConfirmStudent.nis}) diperbarui di Firestore.`
      );
    } catch {
      showToast('Gagal memperbarui status password siswa.');
    }
    setResetConfirmStudent(null);
  };

  const handleConfirmDeleteStudent = async () => {
    if (!deleteConfirmStudent || !onDeleteStudent || isDeletingStudent) return;
    setIsDeletingStudent(true);
    try {
      await onDeleteStudent(deleteConfirmStudent);
      showToast(
        `Siswa ${deleteConfirmStudent.nama} (${deleteConfirmStudent.kelas}) berhasil dihapus.`
      );
      setDeleteConfirmStudent(null);
    } catch {
      showToast('Gagal menghapus data siswa dari Firestore.');
    } finally {
      setIsDeletingStudent(false);
    }
  };

  const openTahfidzClassesModal = () => {
    setDraftTahfidzClasses(
      TAHFIDZ_ELIGIBLE_CLASSES.filter((cls) =>
        tahfidzTaughtClasses.includes(cls)
      )
    );
    setIsTahfidzClassesModalOpen(true);
  };

  const handleSaveTahfidzClassesSetting = async () => {
    if (!onSaveTahfidzTaughtClasses || isSavingTahfidzClasses) return;
    setIsSavingTahfidzClasses(true);
    try {
      const ordered = TAHFIDZ_ELIGIBLE_CLASSES.filter((cls) =>
        draftTahfidzClasses.includes(cls)
      );
      await onSaveTahfidzTaughtClasses(ordered);
      setIsTahfidzClassesModalOpen(false);
      showToast(
        `Pengaturan kelas ampu Tahfidz disimpan (${ordered.length} kelas aktif).`
      );
    } catch {
      showToast('Gagal menyimpan pengaturan kelas ampu Tahfidz.');
    } finally {
      setIsSavingTahfidzClasses(false);
    }
  };

  const handleAddSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStudentError('');
    const nis = newStudentNis.trim();
    const nama = newStudentName.trim();

    if (!nis || !nama) {
      setAddStudentError('NIS dan Nama wajib diisi.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(nis)) {
      setAddStudentError('NIS hanya boleh berisi huruf, angka, tanda hubung (-), atau garis bawah (_).');
      return;
    }
    if (existingNisSet.has(nis)) {
      setAddStudentError(`NIS "${nis}" sudah terdaftar.`);
      return;
    }

    try {
      await onImportStudents([
        {
          id: nis,
          nis,
          nama,
          kelas: newStudentClass,
          tingkat: getGradeFromClass(newStudentClass),
          usingDefaultPassword: true,
          tahfidzLevel: newStudentTahfidzLevel,
          tahfidzCategory: inferCategoryFromLevel(newStudentTahfidzLevel),
        },
      ]);
      setNewStudentNis('');
      setNewStudentName('');
      setNewStudentTahfidzLevel('Juz 30');
      setIsAddStudentModalOpen(false);
      showToast(`Siswa "${nama}" (NIS: ${nis}) berhasil ditambahkan ke Firestore.`);
    } catch {
      setAddStudentError('Gagal menyimpan data siswa ke Firestore.');
    }
  };

  // Report rows for selected class
  const reportRows = useMemo(() => {
    const classStudents = students.filter((s) => s.kelas === reportClassFilter);
    const q = reportSearch.trim().toLowerCase();

    const rows: Array<{
      student: Student;
      item: LearningItem;
      readRecord?: MaterialReadRecord;
      submission?: AssignmentSubmission;
    }> = [];

    classStudents.forEach((student) => {
      if (q && !student.nama.toLowerCase().includes(q) && !student.nis.toLowerCase().includes(q)) {
        return;
      }

      learningItems.forEach((item) => {
        if (!isItemForStudent(item, student, tahfidzRecords, tahfidzTaughtClasses)) return;
        if (reportSubjectFilter !== 'ALL' && item.mapel !== reportSubjectFilter) return;
        if (reportTypeFilter !== 'ALL' && item.type !== reportTypeFilter) return;

        const readRecord = readRecords.find(
          (r) => r.itemId === item.id && r.studentNis === student.nis
        );
        const submission = submissions.find(
          (sub) => sub.itemId === item.id && sub.studentNis === student.nis
        );

        rows.push({ student, item, readRecord, submission });
      });
    });

    return rows;
  }, [
    students,
    learningItems,
    readRecords,
    submissions,
    tahfidzRecords,
    tahfidzTaughtClasses,
    reportClassFilter,
    reportSubjectFilter,
    reportTypeFilter,
    reportSearch,
  ]);

  const mapelSubItems: Array<{
    id: Extract<GuruTab, 'bahasa_arab' | 'aqidah' | 'tahfidz'>;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'bahasa_arab',
      label: 'Bahasa Arab',
      shortLabel: 'B. Arab',
      icon: <BookText className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'aqidah',
      label: 'Aqidah',
      shortLabel: 'Aqidah',
      icon: <BookOpen className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'tahfidz',
      label: 'Tahfidz/Tahsin',
      shortLabel: 'Tahfidz',
      icon: <BookMarked className="h-4 w-4 shrink-0" />,
    },
  ];

  const isMapelChildActive =
    activeTab === 'bahasa_arab' ||
    activeTab === 'aqidah' ||
    activeTab === 'tahfidz';

  const managementAndToolNavItems: Array<{
    id: GuruTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'siswa',
      label: 'Manajemen Siswa',
      shortLabel: 'Siswa',
      icon: <Users className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'ujian_tahfidz',
      label: 'Ujian Kenaikan Juz',
      shortLabel: 'Ujian Juz',
      icon: <GraduationCap className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'jilid',
      label: 'Manajemen Buku Jilid',
      shortLabel: 'Buku Jilid',
      icon: <Library className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'laporan',
      label: 'Laporan Progres',
      shortLabel: 'Laporan',
      icon: <ClipboardList className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'kamus',
      label: 'Kamus Arab',
      shortLabel: 'Kamus',
      icon: <Languages className="h-4 w-4 shrink-0" />,
    },
  ];

  const navIconContainers: Record<
    GuruTab | 'mapel_parent',
    { active: string; inactive: string }
  > = {
    beranda: {
      active: 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30',
      inactive: 'bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300',
    },
    mapel_parent: {
      active: 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30',
      inactive: 'bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300',
    },
    bahasa_arab: {
      active: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30',
      inactive: 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
    },
    aqidah: {
      active: 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/30',
      inactive: 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300',
    },
    tahfidz: {
      active: 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/30',
      inactive: 'bg-teal-500/15 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300',
    },
    ujian_tahfidz: {
      active: 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-md shadow-emerald-500/30',
      inactive: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
    },
    siswa: {
      active: 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30',
      inactive: 'bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300',
    },
    jilid: {
      active: 'bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/30',
      inactive: 'bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300',
    },
    laporan: {
      active: 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/30',
      inactive: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
    },
    kamus: {
      active: 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30',
      inactive: 'bg-cyan-500/15 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300',
    },
  };

  const navItems: Array<{
    id: GuruTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'beranda',
      label: 'Beranda',
      shortLabel: 'Beranda',
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
    },
    ...mapelSubItems,
    ...managementAndToolNavItems,
  ];

  const tabTitles: Record<GuruTab, string> = {
    beranda: 'Beranda Akademik Diniyyah',
    siswa: 'Manajemen Pengguna Siswa',
    bahasa_arab: 'Bahasa Arab (Kelas XI & XII)',
    aqidah: 'Aqidah (Kelas X)',
    tahfidz: 'Laporan Setoran Tahfidz/Tahsin',
    ujian_tahfidz: 'Ujian Tahfidz & Kenaikan Juz Otomatis',
    jilid: 'Manajemen Buku Jilid & Laporan Bacaan',
    laporan: 'Laporan Baca, Setoran & Status Tugas',
    kamus: 'Kamus Arab (Indonesia ↔ Arab)',
  };

  const selectedTahfidzNis =
    tahfidzClassStudents.some((s) => s.nis === tahfidzStudentNis)
      ? tahfidzStudentNis
      : tahfidzClassStudents[0]?.nis || '';

  const handleTahfidzSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedTahfidzNis ||
      !tahfidzCapaian.trim() ||
      !tahfidzNilai.trim()
    ) {
      return;
    }

    const targetStudent = tahfidzStudents.find(
      (s) => s.nis === selectedTahfidzNis
    );

    try {
      await onAddTahfidzRecord({
        studentNis: selectedTahfidzNis,
        studentUid: targetStudent?.uid,
        jenisSetoran: tahfidzDepositType,
        capaian: tahfidzCapaian.trim(),
        nilai: tahfidzNilai.trim(),
        keputusan: tahfidzDecision,
        catatanGuru:
          tahfidzNote.trim() ||
          'Pertahankan kelancaran bacaan dan perhatikan makhraj huruf.',
        guruNama: session.nama,
      });

      setTahfidzCapaian('');
      setTahfidzNilai('');
      setTahfidzNote('');
      showToast(
        `Setoran Tahfidz/Tahsin untuk ${
          targetStudent?.nama || selectedTahfidzNis
        } berhasil disimpan ke Firestore (${tahfidzDecision}).`
      );
    } catch {
      showToast('Gagal menyimpan laporan setoran Tahfidz ke Firestore.');
    }
  };

  const filteredTahfidzRecords = useMemo(() => {
    return tahfidzRecords.filter((rec) => {
      const st = students.find((s) => s.nis === rec.studentNis);
      if (st && !tahfidzTaughtClasses.includes(st.kelas)) {
        return false;
      }
      if (tahfidzFilterClass !== 'ALL' && st?.kelas !== tahfidzFilterClass) {
        return false;
      }
      if (
        tahfidzFilterDecision !== 'ALL' &&
        rec.keputusan !== tahfidzFilterDecision
      ) {
        return false;
      }
      return true;
    });
  }, [
    tahfidzRecords,
    students,
    tahfidzTaughtClasses,
    tahfidzFilterClass,
    tahfidzFilterDecision,
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex flex-col md:flex-row">
      {/* Desktop & Tablet Sidebar (Expanded w-64 <-> Mini-Sidebar Icon Rail w-20) */}
      <aside
        id="guru-desktop-sidebar"
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-[#131C31] border-r border-slate-200/80 dark:border-slate-800 z-30 overflow-visible transition-all duration-300 ease-out ${
          isSidebarOpen ? 'md:w-64' : 'md:w-20'
        }`}
      >
        {/* Floating Edge Toggle Button (Tablet & Desktop only) */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={isSidebarOpen ? 'Perkecil sidebar' : 'Perluas sidebar'}
          aria-label={isSidebarOpen ? 'Perkecil sidebar' : 'Perluas sidebar'}
          aria-expanded={isSidebarOpen}
          aria-controls="guru-desktop-sidebar"
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
          aria-label="Menu Guru"
        >
          {isSidebarOpen && (
            <p className="px-2.5 pb-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
              MENU
            </p>
          )}

          {/* 1. Beranda */}
          <button
            type="button"
            onClick={() => selectTab('beranda')}
            aria-label="Beranda"
            className={`group relative w-full min-h-[44px] py-2 rounded-xl text-sm font-medium flex items-center transition-all whitespace-nowrap ${
              isSidebarOpen ? 'px-2.5 justify-start gap-3' : 'px-0 justify-center'
            } ${
              activeTab === 'beranda'
                ? 'bg-indigo-500/12 dark:bg-indigo-500/15 text-indigo-800 dark:text-white font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
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
                  ? navIconContainers.beranda.active
                  : navIconContainers.beranda.inactive
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
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

          {/* 2. Mata Pelajaran (Accordion; expands sidebar & submenu automatically if minimized) */}
          <div className="space-y-1">
            <button
              type="button"
              aria-expanded={isSidebarOpen ? isMapelMenuOpen : false}
              aria-controls="guru-sidebar-mapel-submenu"
              aria-label="Mata Pelajaran"
              onClick={() => {
                if (!isSidebarOpen) {
                  expandSidebar();
                  setIsMapelMenuOpen(true);
                } else {
                  setIsMapelMenuOpen((prev) => !prev);
                }
              }}
              className={`group relative w-full min-h-[44px] py-2 rounded-xl text-sm font-medium flex items-center transition-all whitespace-nowrap ${
                isSidebarOpen
                  ? 'px-2.5 justify-between gap-2'
                  : 'px-0 justify-center'
              } ${
                isMapelChildActive
                  ? 'bg-purple-500/10 dark:bg-purple-500/15 text-purple-800 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isMapelChildActive && (!isSidebarOpen || !isMapelMenuOpen) && (
                <span
                  aria-hidden="true"
                  className={`absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-purple-500 to-indigo-500 ${
                    isSidebarOpen ? '-left-3' : '-left-2'
                  }`}
                />
              )}
              {isSidebarOpen ? (
                <>
                  <span className="flex items-center gap-3 min-w-0">
                    <span
                      className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isMapelChildActive
                          ? navIconContainers.mapel_parent.active
                          : navIconContainers.mapel_parent.inactive
                      }`}
                    >
                      <Layers className="h-4 w-4" />
                    </span>
                    <span>Mata Pelajaran</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      isMapelMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </>
              ) : (
                <>
                  <span
                    className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isMapelChildActive
                        ? navIconContainers.mapel_parent.active
                        : navIconContainers.mapel_parent.inactive
                    }`}
                  >
                    <Layers className="h-4 w-4" />
                  </span>
                  <span
                    role="tooltip"
                    className="pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700/80"
                  >
                    Mata Pelajaran
                  </span>
                </>
              )}
            </button>

            {isSidebarOpen && isMapelMenuOpen && (
              <div
                id="guru-sidebar-mapel-submenu"
                className="space-y-1 pt-0.5 pl-3"
              >
                {mapelSubItems.map((sub) => {
                  const active = activeTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => selectTab(sub.id)}
                      className={`relative w-full min-h-[40px] px-2.5 py-1.5 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-all whitespace-nowrap ${
                        active
                          ? 'bg-slate-100 dark:bg-[#0B1120] text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-amber-500 to-orange-500"
                        />
                      )}
                      <span
                        className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          active
                            ? navIconContainers[sub.id].active
                            : navIconContainers[sub.id].inactive
                        }`}
                      >
                        {sub.icon}
                      </span>
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {isSidebarOpen ? (
            <p className="px-2.5 pt-3 pb-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
              MANAJEMEN
            </p>
          ) : (
            <div className="my-2 mx-2 border-t border-slate-200/80 dark:border-slate-800" />
          )}

          {/* 3–6. Manajemen Siswa, Manajemen Buku Jilid, Laporan Progres, Kamus Arab */}
          {managementAndToolNavItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                aria-label={item.label}
                className={`group relative w-full min-h-[44px] py-2 rounded-xl text-sm font-medium flex items-center transition-all whitespace-nowrap ${
                  isSidebarOpen
                    ? 'px-2.5 justify-start gap-3'
                    : 'px-0 justify-center'
                } ${
                  active
                    ? 'bg-slate-100 dark:bg-[#0B1120] text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className={`absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-indigo-500 to-cyan-500 ${
                      isSidebarOpen ? '-left-3' : '-left-2'
                    }`}
                  />
                )}
                <span
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    active
                      ? navIconContainers[item.id].active
                      : navIconContainers[item.id].inactive
                  }`}
                >
                  {item.icon}
                </span>
                {isSidebarOpen && <span>{item.label}</span>}
                {!isSidebarOpen && (
                  <span
                    role="tooltip"
                    className="pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700/80"
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
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
                  {GURU_PROFILE.nama}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {GURU_PROFILE.jabatan}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  {GURU_PROFILE.email}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="w-full min-h-[40px] px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </button>
            </>
          ) : (
            <>
              <div className="group relative flex items-center justify-center">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-display text-xs font-bold flex items-center justify-center shrink-0 select-none">
                  {getInitials(GURU_PROFILE.nama)}
                </div>
                <span
                  role="tooltip"
                  className="pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700/80"
                >
                  {GURU_PROFILE.nama} · {GURU_PROFILE.jabatan}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                aria-label="Keluar"
                className="group relative min-h-[40px] w-11 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-700 dark:hover:text-rose-300 text-slate-600 dark:text-slate-300 transition-colors"
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

      {/* Mobile Drawer (< md) */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu Navigasi Guru"
        >
          <div
            className="fixed inset-0 bg-slate-950/65"
            onClick={closeMobileDrawer}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-[#131C31] border-r border-slate-200 dark:border-slate-800 h-full flex flex-col z-10">
            <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
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
              aria-label="Menu Mobile Guru"
            >
              <button
                type="button"
                onClick={() => selectTab('beranda')}
                className={`w-full min-h-[44px] px-2.5 py-2 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors whitespace-nowrap ${
                  activeTab === 'beranda'
                    ? 'bg-indigo-500/12 dark:bg-indigo-500/15 text-indigo-800 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <span
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'beranda'
                      ? navIconContainers.beranda.active
                      : navIconContainers.beranda.inactive
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                </span>
                <span>Beranda</span>
              </button>

              <div className="space-y-1">
                <button
                  type="button"
                  aria-expanded={isMapelMenuOpen}
                  onClick={() => setIsMapelMenuOpen((prev) => !prev)}
                  className={`w-full min-h-[44px] px-2.5 py-2 rounded-xl text-sm font-medium flex items-center justify-between gap-2 transition-colors whitespace-nowrap ${
                    isMapelChildActive
                      ? 'bg-purple-500/10 dark:bg-purple-500/15 text-purple-800 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span
                      className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isMapelChildActive
                          ? navIconContainers.mapel_parent.active
                          : navIconContainers.mapel_parent.inactive
                      }`}
                    >
                      <Layers className="h-4 w-4" />
                    </span>
                    <span>Mata Pelajaran</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      isMapelMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isMapelMenuOpen && (
                  <div className="space-y-1 pt-0.5 pl-3">
                    {mapelSubItems.map((sub) => {
                      const active = activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => selectTab(sub.id)}
                          className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-colors whitespace-nowrap ${
                            active
                              ? 'bg-slate-100 dark:bg-[#0B1120] text-slate-900 dark:text-white font-semibold'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span
                            className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                              active
                                ? navIconContainers[sub.id].active
                                : navIconContainers[sub.id].inactive
                            }`}
                          >
                            {sub.icon}
                          </span>
                          <span>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {managementAndToolNavItems.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className={`w-full min-h-[44px] px-2.5 py-2 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-slate-100 dark:bg-[#0B1120] text-slate-900 dark:text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <span
                      className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                        active
                          ? navIconContainers[item.id].active
                          : navIconContainers[item.id].inactive
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {GURU_PROFILE.nama}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {GURU_PROFILE.jabatan}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  {GURU_PROFILE.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeMobileDrawer();
                  onLogout();
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 pb-20 md:pb-8 transition-all duration-300 ease-out ${
          isSidebarOpen ? 'md:pl-64' : 'md:pl-20'
        }`}
      >
        {/* Top Bar (Glassmorphism strictly on Header) */}
        <header className="sticky top-0 z-20 h-14 md:h-16 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={openMobileDrawer}
              aria-label="Buka menu navigasi"
              title="Menu Navigasi"
              className="md:hidden min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-[#131C31] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shrink-0"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="md:hidden h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center text-white shrink-0">
              <BookOpen className="h-4 w-4" />
            </div>
            <h1 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {tabTitles[activeTab]}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <span className="hidden sm:inline text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 whitespace-nowrap">
              Peran: Guru (Admin)
            </span>
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadNotifCount}
              isNotifRead={(n) => n.isRead}
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

        {/* Toast Notification */}
        {toastMsg && (
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <div
              role="status"
              className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25 text-xs sm:text-sm flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{toastMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMsg(null)}
                aria-label="Tutup notifikasi"
                className="text-white/90 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <main
          className={`flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full mx-auto space-y-6 ${
            isSidebarOpen ? 'max-w-7xl' : 'max-w-none'
          }`}
        >
          {/* TAB 1: BERANDA */}
          {activeTab === 'beranda' && (
            <div className="space-y-6">
              {/* Electric Gradient Welcome Banner */}
              <div className={`rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${ELECTRIC_BANNER_CLASS}`}>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/85">
                    {GURU_PROFILE.jabatan} · {ALL_CLASSES.length} Rombongan Belajar
                  </p>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                    Assalamu’alaikum, {session.nama}
                  </h2>
                  <p className="text-xs sm:text-sm text-white/90 max-w-2xl">
                    Kelola materi, penugasan 4 tipe soal, setoran Tahfidz/Tahsin, PROTA, serta pantau progres siswa secara real-time.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openCreateItemModal(null, 'materi')}
                    className={`min-h-[44px] px-5 py-2.5 text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${PRIMARY_CTA_CLASS}`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Buat Materi / Tugas</span>
                  </button>
                </div>
              </div>

              {/* 4 KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:-translate-y-0.5 transition-all">
                  <div className="h-1 w-full bg-gradient-to-r from-indigo-600 to-cyan-500" />
                  <div className="p-4 sm:p-5">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Siswa Terdaftar</p>
                    <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                      {students.length}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tersebar di {ALL_CLASSES.length} kelas</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:-translate-y-0.5 transition-all">
                  <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
                  <div className="p-4 sm:p-5">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Materi & Tugas</p>
                    <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {learningItems.length}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {totalMaterials} materi · {totalAssignments} tugas
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:-translate-y-0.5 transition-all">
                  <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-emerald-500" />
                  <div className="p-4 sm:p-5">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Progres Baca Materi</p>
                    <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {totalReadPossible > 0
                        ? `${Math.round((totalReadDone / totalReadPossible) * 100)}%`
                        : '0%'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {totalReadDone} dari {totalReadPossible} keterbacaan
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:-translate-y-0.5 transition-all">
                  <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-orange-500" />
                  <div className="p-4 sm:p-5">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Penyelesaian Tugas</p>
                    <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      {totalTasksPossible > 0
                        ? `${Math.round((totalTasksDone / totalTasksPossible) * 100)}%`
                        : '0%'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {totalTasksDone} dari {totalTasksPossible} tugas selesai
                    </p>
                  </div>
                </div>
              </div>

              {/* 12 Classes: Progres & Peringkat Kelas */}
              <section
                aria-labelledby="progres-peringkat-kelas-heading"
                className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md shadow-teal-500/25 flex items-center justify-center text-white shrink-0">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2
                        id="progres-peringkat-kelas-heading"
                        className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                      >
                        Progres Belajar Per Kelas
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Peringkat keaktifan seluruh 12 kelas · Klik kartu kelas untuk melihat rincian kontribusi setiap siswa
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" />
                      <span>Baca Materi</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                      <span>Penyelesaian Tugas</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {classProgressList.map((cls) => {
                    const isTop1 = cls.rank === 1;
                    const rankBadgeClass = getRankBadgeClasses(cls.rank);

                    return (
                      <button
                        key={cls.kelas}
                        type="button"
                        onClick={() => {
                          setCopiedIncompleteClass(false);
                          setSelectedClassDetail(cls.kelas);
                        }}
                        className={`group text-left p-4 rounded-2xl border transition-all hover:-translate-y-0.5 bg-slate-50/90 dark:bg-[#0B1120] flex flex-col justify-between gap-3 ${
                          isTop1
                            ? 'border-amber-400/60 dark:border-amber-500/40 shadow-sm shadow-amber-500/10'
                            : 'border-slate-200/90 dark:border-slate-800 hover:border-indigo-400/70 dark:hover:border-cyan-500/50'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums shrink-0 ${rankBadgeClass}`}
                                >
                                  #{cls.rank}
                                </span>
                                <span className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {cls.kelas}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                                Tingkat {cls.tingkat} · {cls.studentCount} siswa
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-display text-xl font-bold text-indigo-700 dark:text-cyan-400 tabular-nums">
                                {cls.activityPct}%
                              </span>
                              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                Keaktifan
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <div>
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                  Baca Materi
                                </span>
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                  {cls.readPct}%{' '}
                                  <span className="font-normal text-slate-400 dark:text-slate-500">
                                    ({cls.readDone}/{cls.readTotal})
                                  </span>
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
                                  style={{ width: `${cls.readPct}%` }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                  Penyelesaian Tugas
                                </span>
                                <span className="font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                                  {cls.taskPct}%{' '}
                                  <span className="font-normal text-slate-400 dark:text-slate-500">
                                    ({cls.taskDone}/{cls.taskTotal})
                                  </span>
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                                  style={{ width: `${cls.taskPct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">
                          <span>Lihat Detail Siswa</span>
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Responsive Beranda Widgets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Widget 1: Perlu Tindakan & Capaian PROTA */}
                <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:-translate-y-0.5 transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/25 flex items-center justify-center text-white shrink-0">
                        <ClipboardCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                          Perlu Tindakan & PROTA
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Antrean koreksi & target pembelajaran
                        </p>
                      </div>
                    </div>

                    {/* Action Queue: Menunggu Koreksi Essay */}
                    <button
                      type="button"
                      onClick={() => {
                        const firstSub = waitingEssaySubmissions[0];
                        if (firstSub) {
                          const st = students.find(
                            (s) => s.nis === firstSub.studentNis
                          );
                          if (st) {
                            setReportClassFilter(st.kelas);
                          }
                        }
                        setReportTypeFilter('tugas');
                        selectTab('laporan');
                      }}
                      className="w-full text-left p-3.5 rounded-2xl bg-amber-500/10 dark:bg-[#0B1120] border border-amber-500/25 hover:border-amber-500/60 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                          Menunggu Koreksi Essay
                        </p>
                        <p className="mt-0.5 font-display text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          {waitingEssaySubmissions.length} kiriman
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-sm shadow-amber-500/25 shrink-0">
                        <span>Periksa</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </button>

                    {/* PROTA Summary */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <ListChecks className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Capaian PROTA</span>
                        </span>
                        <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                          {protaCompletedCount}/{protaList.length} Bab ({protaProgressPct}%)
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 transition-all"
                          style={{ width: `${protaProgressPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {protaList.length === 0
                            ? 'Belum ada target PROTA'
                            : `${protaList.length - protaCompletedCount} bab tersisa`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsProtaModalOpen(true)}
                          className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:underline shrink-0"
                        >
                          Kelola PROTA
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Widget 2: Jadwal Mengajar dengan Tab Hari Cepat */}
                <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:-translate-y-0.5 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 shadow-md shadow-indigo-500/25 flex items-center justify-center text-white shrink-0">
                          <CalendarClock className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            Jadwal Mengajar
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {selectedScheduleDay}{' '}
                            {todayDayName === 'Minggu' &&
                              selectedScheduleDay === 'Senin' && (
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                  (Jadwal Pekan Ini)
                                </span>
                              )}{' '}
                            · {selectedDayJadwal.length} sesi
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openCreateJadwalModal(selectedScheduleDay)}
                        className="min-h-[32px] px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/25 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Kelola Jadwal</span>
                      </button>
                    </div>

                    {/* Tab Pilihan Hari Cepat (Sen - Sab) */}
                    <div
                      role="tablist"
                      aria-label="Pilih hari jadwal mengajar"
                      className="grid grid-cols-6 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0B1120] border border-slate-200/80 dark:border-slate-800"
                    >
                      {quickDayTabs.map(({ day, short }) => {
                        const isActive = selectedScheduleDay === day;
                        const dayCount = jadwalByDayMap[day]?.length ?? 0;
                        const isToday = todayDayName === day;
                        return (
                          <button
                            key={day}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setSelectedScheduleDay(day)}
                            className={`relative px-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                              isActive
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/25'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/70'
                            }`}
                          >
                            <span>{short}</span>
                            {dayCount > 0 && (
                              <span
                                className={`text-[9px] font-mono tabular-nums px-1 rounded-full ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {dayCount}
                              </span>
                            )}
                            {isToday && !isActive && (
                              <span
                                className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-indigo-500"
                                title="Hari ini"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {selectedDayJadwal.length === 0 ? (
                      <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Tidak ada jadwal mengajar pada hari {selectedScheduleDay}.
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          Total {jadwalMapel.length} sesi terdaftar dalam pekan ini.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                        {selectedDayJadwal.map((jdw) => {
                          const subTheme = getSubjectTheme(jdw.mapel);
                          return (
                            <div
                              key={jdw.id}
                              className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5"
                            >
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-mono text-[11px] font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                                    {jdw.jamMulai}–{jdw.jamSelesai}
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                                    ·
                                  </span>
                                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                    {jdw.kelas}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${subTheme.badgeClasses}`}
                                  >
                                    {jdw.mapel}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Tingkat {jdw.tingkat} · Hari {jdw.hari}
                                </p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openEditJadwalModal(jdw)}
                                  aria-label={`Edit jadwal ${jdw.kelas} ${jdw.hari}`}
                                  title="Edit Jadwal"
                                  className="min-h-[30px] min-w-[30px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131C31] text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickDeleteJadwal(jdw)}
                                  aria-label={`Hapus jadwal ${jdw.kelas} ${jdw.hari}`}
                                  title="Hapus Jadwal"
                                  className="min-h-[30px] min-w-[30px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131C31] text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="tabular-nums">Total jadwal aktif: {jadwalMapel.length} sesi</span>
                    <button
                      type="button"
                      onClick={() => setIsWeeklyMatrixModalOpen(true)}
                      className="font-semibold text-indigo-700 dark:text-indigo-400 hover:underline"
                    >
                      Lihat Mingguan
                    </button>
                  </div>
                </div>

                {/* Widget 3: Kalender Tenggat Tugas */}
                <MiniMonthlyCalendar
                  learningItems={learningItems}
                  onSelectDeadlineItem={(item) => {
                    if (item.mapel === 'Bahasa Arab') {
                      selectTab('bahasa_arab');
                    } else if (item.mapel === 'Aqidah') {
                      selectTab('aqidah');
                    } else {
                      selectTab('laporan');
                    }
                  }}
                />

                {/* Widget 4: Papan Pengumuman Diniyyah (Tepat di samping Kalender) */}
                <PapanPengumumanCard
                  announcements={pengumumanList}
                  canManage
                  onOpenCreateModal={() => setIsPengumumanModalOpen(true)}
                  onDeleteAnnouncement={async (id) => {
                    if (!onDeletePengumuman) return;
                    try {
                      await onDeletePengumuman(id);
                      showToast('Pengumuman berhasil dihapus.');
                    } catch {
                      showToast('Gagal menghapus pengumuman.');
                    }
                  }}
                />

                {/* Widget 5: Mahfudzot Harian */}
                <div className="md:col-span-2">
                  <DailyMahfudzotCard />
                </div>
              </div>

              {/* Rigid Class & Subject Mapping Overview */}
              <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                      Pemetaan Kelas & Mata Pelajaran Diniyyah
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Aturan akses mata pelajaran dikunci secara otomatis berdasarkan tingkat kelas siswa.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreateItemModal(null, 'materi')}
                    className={`min-h-[40px] px-4 py-2 text-xs flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${PRIMARY_CTA_CLASS}`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Buat Materi / Tugas</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {ALL_GRADES.map((grade) => {
                    const classes = GRADE_CLASSES[grade];
                    const subjects = getSubjectsForGrade(grade);
                    return (
                      <div key={grade} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                            <span>Tingkat Kelas {grade}</span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {subjects.map((sub) => (
                                <span
                                  key={sub}
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getSubjectTheme(sub).badgeClasses}`}
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Total siswa tingkat {grade}:{' '}
                            <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                              {students.filter((s) => s.tingkat === grade).length} siswa
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {classes.map((cls) => {
                            const count = students.filter((s) => s.kelas === cls).length;
                            return (
                              <button
                                key={cls}
                                type="button"
                                onClick={() => {
                                  setReportClassFilter(cls);
                                  setActiveTab('laporan');
                                }}
                                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:border-indigo-300 dark:hover:border-indigo-700 text-xs font-medium text-slate-900 dark:text-slate-100 transition-colors flex items-center gap-2 whitespace-nowrap"
                              >
                                <span className="font-semibold">{cls}</span>
                                <span className="text-slate-500 dark:text-slate-400 tabular-nums">{count} siswa</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAJEMEN SISWA */}
          {activeTab === 'siswa' && (
            <div className="space-y-5">
              {/* Top Action & Filter Bar */}
              <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="search"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Cari nama siswa atau NIS..."
                      aria-label="Cari nama siswa atau NIS"
                      className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>

                  <select
                    value={studentClassFilter}
                    onChange={(e) => setStudentClassFilter(e.target.value)}
                    aria-label="Filter kelas siswa"
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  >
                    <option value="ALL">Semua Kelas ({students.length})</option>
                    {ALL_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls} ({students.filter((s) => s.kelas === cls).length})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setAddStudentError('');
                      setIsAddStudentModalOpen(true);
                    }}
                    className="min-h-[44px] px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-300 text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Siswa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCsvModalOpen(true)}
                    className={`min-h-[44px] px-4 py-2.5 text-sm flex items-center justify-center gap-2 whitespace-nowrap ${PRIMARY_CTA_CLASS}`}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Import CSV</span>
                  </button>
                </div>
              </div>

              {/* Privacy Note */}
              <div className="px-4 py-3 rounded-2xl bg-indigo-500/10 dark:bg-[#131C31] border border-indigo-500/25 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                Demi keamanan privasi akun, Admin/Guru tidak dapat melihat password aktif milik siswa. Gunakan tombol <span className="font-semibold text-slate-900 dark:text-slate-100">Reset Password</span> untuk mengembalikan password siswa ke default (<span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{DEFAULT_STUDENT_PASSWORD}</span>).
              </div>

              {/* Student Table */}
              <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                {filteredStudents.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Siswa tidak ditemukan</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Ubah kata kunci pencarian atau pilih filter kelas lain.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                        <tr>
                          <th className="py-3 px-4 font-semibold">NIS</th>
                          <th className="py-3 px-4 font-semibold">Nama Siswa</th>
                          <th className="py-3 px-4 font-semibold">Kelas</th>
                          <th className="py-3 px-4 font-semibold">Kelompok Tahfidz / Jilid</th>
                          <th className="py-3 px-4 font-semibold">Akses Mapel</th>
                          <th className="py-3 px-4 font-semibold">Status Password</th>
                          <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredStudents.map((student) => {
                          const subjects = getSubjectsForClass(student.kelas);
                          const tahfidzProfile = getStudentTahfidzProfile(
                            student,
                            tahfidzRecords
                          );
                          return (
                            <tr
                              key={student.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {student.nis}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                                {student.nama}
                              </td>
                              <td className="py-3 px-4 text-xs font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">
                                {student.kelas}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                      tahfidzProfile.category === 'Jilid'
                                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                        : 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
                                    }`}
                                  >
                                    <span>{tahfidzProfile.category}</span>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-mono">{tahfidzProfile.level}</span>
                                  </span>
                                  <button
                                    type="button"
                                    disabled={togglingCategoryNis === student.nis}
                                    onClick={() => {
                                      const nextCat: TahfidzCategory =
                                        tahfidzProfile.category === 'Jilid'
                                          ? 'Tahfidz'
                                          : 'Jilid';
                                      const nextLvl =
                                        nextCat === 'Tahfidz' ? 'Juz 30' : 'Jilid';
                                      void handleQuickToggleStudentCategory(
                                        student,
                                        nextCat,
                                        nextLvl
                                      );
                                    }}
                                    title={`Klik untuk ubah dari ${tahfidzProfile.category} ke ${
                                      tahfidzProfile.category === 'Jilid' ? 'Tahfidz' : 'Jilid'
                                    }`}
                                    className="px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-400 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                                  >
                                    <ArrowLeftRight className="h-3 w-3" />
                                    <span>
                                      {togglingCategoryNis === student.nis
                                        ? '...'
                                        : tahfidzProfile.category === 'Jilid'
                                        ? 'Ubah ke Tahfidz'
                                        : 'Ubah ke Jilid'}
                                    </span>
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                                {subjects.join(', ')}
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {student.usingDefaultPassword
                                  ? 'Default Sistem'
                                  : 'Diubah oleh Siswa'}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTahfidzStudent(student);
                                      setEditStudentTahfidzCat(tahfidzProfile.category);
                                      setEditStudentTahfidzLevel(tahfidzProfile.level);
                                    }}
                                    className="min-h-[38px] px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800/80 bg-teal-50/70 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-xs font-semibold text-teal-800 dark:text-teal-300 inline-flex items-center gap-1.5 transition-colors"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span>Kelompok</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setResetConfirmStudent(student)}
                                    className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-900 dark:hover:text-amber-300 text-xs font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5 transition-colors"
                                  >
                                    <KeyRound className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    <span>Reset Password</span>
                                  </button>
                                  {onDeleteStudent && (
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmStudent(student)}
                                      className="min-h-[38px] px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50/80 dark:bg-rose-950/35 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-semibold text-rose-700 dark:text-rose-300 inline-flex items-center gap-1.5 transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span>Hapus</span>
                                    </button>
                                  )}
                                </div>
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

          {/* TAB 3: BAHASA ARAB */}
          {activeTab === 'bahasa_arab' && (
            <SubjectMaterialsView
              key="bahasa_arab"
              subject="Bahasa Arab"
              allowedGrades={['XI', 'XII']}
              learningItems={learningItems}
              tugasDocs={tugasList}
              onOpenCreateModal={(sub, type) => openCreateItemModal(sub, type)}
              onOpenEditModal={openEditItemModal}
              onDeleteLearningItem={onDeleteLearningItem}
              onNotify={showToast}
            />
          )}

          {/* TAB 4: AQIDAH */}
          {activeTab === 'aqidah' && (
            <SubjectMaterialsView
              key="aqidah"
              subject="Aqidah"
              allowedGrades={['X']}
              learningItems={learningItems}
              tugasDocs={tugasList}
              onOpenCreateModal={(sub, type) => openCreateItemModal(sub, type)}
              onOpenEditModal={openEditItemModal}
              onDeleteLearningItem={onDeleteLearningItem}
              onNotify={showToast}
            />
          )}

          {/* TAB 4: TAHFIDZ/TAHSIN - INPUT SETORAN SISWA & PENUGASAN JILID */}
          {activeTab === 'tahfidz' && (
            <div className="space-y-6">
              {/* Quick Actions Bar */}
              <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    Manajemen Tahfidz / Tahsin &amp; Penugasan Kelompok Jilid
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Catat setoran harian siswa per kelas atau buat tugas khusus kelompok Jilid (mis. tugas menulis).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openCreateItemModal('Tahfidz/Tahsin', 'tugas')}
                    className={`min-h-[40px] px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 ${PRIMARY_CTA_CLASS}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Buat Tugas Khusus Jilid / Tahfidz</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLaporanSubTab('harian_tahfidz');
                      selectTab('laporan');
                    }}
                    className="min-h-[40px] px-3.5 py-2 rounded-2xl border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-xs font-semibold text-teal-800 dark:text-teal-300 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    <span>Laporan Harian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTab('ujian_tahfidz')}
                    className="min-h-[40px] px-3.5 py-2 rounded-2xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-semibold text-indigo-800 dark:text-indigo-300 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Ujian Kenaikan Juz</span>
                  </button>
                  {onSaveTahfidzTaughtClasses && (
                    <button
                      type="button"
                      onClick={openTahfidzClassesModal}
                      className="min-h-[40px] px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Settings2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Atur Kelas Ampu Tahfidz</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Form Input Setoran Siswa */}
              <div className="lg:col-span-5 bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400" />
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md shadow-teal-500/25 flex items-center justify-center text-white shrink-0">
                      <BookMarked className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                        Input Setoran Siswa
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Pilih kelas terlebih dahulu untuk menampilkan daftar siswa di kelas tersebut.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleTahfidzSubmit} className="mt-5 space-y-4">
                    {/* Filter Pilih Kelas (Paling Atas) */}
                    <div>
                      <label
                        htmlFor="tahfidz-input-class"
                        className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                      >
                        Pilih Kelas
                      </label>
                      <select
                        id="tahfidz-input-class"
                        value={activeTahfidzInputClass}
                        onChange={(e) => {
                          setTahfidzInputClass(e.target.value as ClassName);
                          setTahfidzStudentNis('');
                        }}
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                      >
                        {tahfidzAvailableClasses.map((cls) => {
                          const countInClass = tahfidzStudents.filter(
                            (s) => s.kelas === cls
                          ).length;
                          return (
                            <option key={cls} value={cls}>
                              {cls} ({countInClass} siswa)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Pencarian Cepat Nama / NIS */}
                    <div>
                      <label
                        htmlFor="tahfidz-student-search"
                        className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                      >
                        Cari Cepat Siswa di {activeTahfidzInputClass} (Nama / NIS)
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <input
                          id="tahfidz-student-search"
                          type="search"
                          value={tahfidzStudentSearch}
                          onChange={(e) => setTahfidzStudentSearch(e.target.value)}
                          placeholder="Ketik nama atau NIS untuk filter cepat..."
                          className="w-full min-h-[42px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                        />
                      </div>
                    </div>

                    {/* Pilih Siswa */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label
                          htmlFor="tahfidz-student"
                          className="block text-xs font-semibold text-slate-900 dark:text-slate-100"
                        >
                          Pilih Siswa
                        </label>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          {tahfidzClassStudents.length} siswa tampil
                        </span>
                      </div>
                      <select
                        id="tahfidz-student"
                        value={selectedTahfidzNis}
                        onChange={(e) => setTahfidzStudentNis(e.target.value)}
                        required
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                      >
                        {tahfidzClassStudents.length === 0 ? (
                          <option value="">
                            Tidak ada siswa yang cocok di {activeTahfidzInputClass}
                          </option>
                        ) : (
                          tahfidzClassStudents.map((st) => {
                            const prof = getStudentTahfidzProfile(st, tahfidzRecords);
                            return (
                              <option key={st.nis} value={st.nis}>
                                {st.nama} (NIS {st.nis}) · {prof.level}
                              </option>
                            );
                          })
                        )}
                      </select>
                    </div>

                    {/* Jenis Setoran (Radio button) */}
                    <div>
                      <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                        Jenis Setoran
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(
                          [
                            'Baca (Masih Jilid)',
                            'Setor (Hafalan Al-Quran)',
                          ] as TahfidzDepositType[]
                        ).map((typeOption) => {
                          const checked = tahfidzDepositType === typeOption;
                          return (
                            <label
                              key={typeOption}
                              className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-colors ${
                                checked
                                  ? 'border-teal-500 bg-teal-500/15 text-teal-800 dark:text-teal-300'
                                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="jenis-setoran"
                                value={typeOption}
                                checked={checked}
                                onChange={() => setTahfidzDepositType(typeOption)}
                                className="accent-teal-600 dark:accent-teal-400 h-4 w-4 shrink-0"
                              />
                              <span>{typeOption}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Capaian & Nilai */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="tahfidz-capaian"
                          className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                        >
                          Capaian / Terakhir Baca
                        </label>
                        <input
                          id="tahfidz-capaian"
                          type="text"
                          required
                          value={tahfidzCapaian}
                          onChange={(e) => setTahfidzCapaian(e.target.value)}
                          placeholder={
                            tahfidzDepositType === 'Baca (Masih Jilid)'
                              ? 'Contoh: Jilid 4 Hal 12'
                              : 'Contoh: Surah Al-Mulk ayat 1-10'
                          }
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="tahfidz-nilai"
                          className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                        >
                          Nilai
                        </label>
                        <input
                          id="tahfidz-nilai"
                          type="text"
                          required
                          value={tahfidzNilai}
                          onChange={(e) => setTahfidzNilai(e.target.value)}
                          placeholder="90 / A"
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                        />
                      </div>
                    </div>

                    {/* Keputusan (Radio button) */}
                    <div>
                      <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                        Keputusan
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        <label
                          className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-colors ${
                            tahfidzDecision === 'Lanjut'
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="keputusan-tahfidz"
                            value="Lanjut"
                            checked={tahfidzDecision === 'Lanjut'}
                            onChange={() => setTahfidzDecision('Lanjut')}
                            className="accent-emerald-600 h-4 w-4 shrink-0"
                          />
                          <span>Lanjut</span>
                        </label>

                        <label
                          className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-colors ${
                            tahfidzDecision === 'Mengulang'
                              ? 'border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-300'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="keputusan-tahfidz"
                            value="Mengulang"
                            checked={tahfidzDecision === 'Mengulang'}
                            onChange={() => setTahfidzDecision('Mengulang')}
                            className="accent-rose-600 h-4 w-4 shrink-0"
                          />
                          <span>Mengulang</span>
                        </label>
                      </div>
                    </div>

                    {/* Catatan Guru */}
                    <div>
                      <label
                        htmlFor="tahfidz-catatan"
                        className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                      >
                        Catatan Guru (Perbaikan Tajwid / Makhraj)
                      </label>
                      <textarea
                        id="tahfidz-catatan"
                        rows={3}
                        value={tahfidzNote}
                        onChange={(e) => setTahfidzNote(e.target.value)}
                        placeholder="Tuliskan catatan perbaikan bacaan, hukum tajwid, atau makhraj huruf..."
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedTahfidzNis}
                      className={`w-full min-h-[46px] px-5 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50 ${PRIMARY_CTA_CLASS}`}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Simpan Laporan Setoran</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Riwayat Input Setoran Siswa */}
              <div className="lg:col-span-7 bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                      Riwayat Setoran Tahfidz/Tahsin
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Total {filteredTahfidzRecords.length} catatan setoran tersimpan
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={tahfidzFilterClass}
                      onChange={(e) => setTahfidzFilterClass(e.target.value)}
                      aria-label="Filter kelas setoran tahfidz"
                      className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs font-medium text-slate-900 dark:text-slate-100"
                    >
                      <option value="ALL">Semua Kelas Ampu ({tahfidzAvailableClasses.length})</option>
                      {tahfidzAvailableClasses.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>

                    <select
                      value={tahfidzFilterDecision}
                      onChange={(e) => setTahfidzFilterDecision(e.target.value)}
                      aria-label="Filter keputusan setoran tahfidz"
                      className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs font-medium text-slate-900 dark:text-slate-100"
                    >
                      <option value="ALL">Semua Keputusan</option>
                      <option value="Lanjut">Lanjut</option>
                      <option value="Mengulang">Mengulang</option>
                    </select>
                  </div>
                </div>

                {filteredTahfidzRecords.length === 0 ? (
                  <div className="p-10 text-center space-y-1.5">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Belum ada riwayat setoran untuk filter ini
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Gunakan form di samping untuk mencatat setoran baru siswa.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredTahfidzRecords.map((rec) => {
                      const st = students.find((s) => s.nis === rec.studentNis);
                      return (
                        <div
                          key={rec.id}
                          className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {st?.nama || `NIS ${rec.studentNis}`}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-semibold text-teal-600 dark:text-teal-400">
                                  {st?.kelas || '-'}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">
                                  {rec.tanggal}
                                </span>
                              </div>
                              <p className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                                {rec.capaian}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {rec.jenisSetoran} · Nilai:{' '}
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                  {rec.nilai}
                                </span>
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge
                                variant={
                                  rec.keputusan === 'Lanjut'
                                    ? 'lanjut'
                                    : 'mengulang'
                                }
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteTahfidzRecord(rec.id);
                                  showToast('Catatan setoran telah dihapus.');
                                }}
                                aria-label={`Hapus setoran ${st?.nama || rec.studentNis}`}
                                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              Catatan Guru:{' '}
                            </span>
                            {rec.catatanGuru}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              </div>

              {/* Daftar Penugasan & Materi Tahfidz/Tahsin (Khusus Kelompok Jilid / Tahfidz) */}
              {(() => {
                const tahfidzItems = learningItems.filter(
                  (i) => i.mapel === 'Tahfidz/Tahsin'
                );
                return (
                  <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                          Tugas &amp; Materi Tahfidz/Tahsin (Filter Kelompok Jilid / Tahfidz)
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          Tugas bertanda <span className="font-semibold text-amber-600 dark:text-amber-400">Khusus Jilid</span> hanya tampil untuk siswa kelompok Jilid dan tidak dihitung menunggak bagi siswa Tahfidz.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openCreateItemModal('Tahfidz/Tahsin', 'tugas')}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-800 dark:text-teal-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tambah Tugas Tahfidz/Jilid</span>
                      </button>
                    </div>
                    {tahfidzItems.length === 0 ? (
                      <div className="p-8 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        Belum ada materi atau tugas khusus Tahfidz/Tahsin. Klik tombol &ldquo;Tambah Tugas Tahfidz/Jilid&rdquo; untuk membuat tugas menulis bagi kelompok Jilid.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {tahfidzItems.map((item) => {
                          const isOfflineJilid = isJilidOfflineTask(item);
                          const targetJilidStudents = isOfflineJilid
                            ? students.filter((st) =>
                                isItemForStudent(
                                  item,
                                  st,
                                  tahfidzRecords,
                                  tahfidzTaughtClasses
                                )
                              )
                            : [];
                          const checkedJilidCount = isOfflineJilid
                            ? targetJilidStudents.filter((st) =>
                                submissions.some(
                                  (sub) =>
                                    sub.itemId === item.id &&
                                    sub.studentNis === st.nis &&
                                    sub.status === 'Selesai'
                                )
                              ).length
                            : 0;
                          const eligibleGradeClasses = GRADE_CLASSES[item.tingkat].filter(
                            (cls) => tahfidzAvailableClasses.includes(cls)
                          );
                          const defaultChecklistClass: ClassName =
                            item.targetKelas !== 'ALL'
                              ? item.targetKelas
                              : eligibleGradeClasses[0] ||
                                GRADE_CLASSES[item.tingkat][0];

                          return (
                          <div
                            key={item.id}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold">
                                  {item.type === 'materi' ? 'Materi' : 'Tugas'} · Tingkat {item.tingkat}
                                </span>
                                {item.type === 'tugas' && item.targetPeserta && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-semibold ${
                                      item.targetPeserta === 'Jilid'
                                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                        : item.targetPeserta === 'Tahfidz'
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    Target: {item.targetPeserta === 'Semua' ? 'Semua Siswa XI & XII' : `Khusus ${item.targetPeserta}`}
                                  </span>
                                )}
                                {isOfflineJilid && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold">
                                    Kumpul Buku Tulis (Ceklis Guru) · {checkedJilidCount}/{targetJilidStudents.length} selesai
                                  </span>
                                )}
                                {item.tenggat && (
                                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                    Tenggat: {item.tenggat}
                                  </span>
                                )}
                              </div>
                              <p className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                                {item.judul}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                {item.deskripsi}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              {item.type === 'tugas' && onSaveJilidSubmissionChecklist && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setJilidChecklistModal({
                                      item,
                                      selectedClass: defaultChecklistClass,
                                    })
                                  }
                                  className="min-h-[38px] px-4 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-teal-500/30 transition-all"
                                >
                                  <ClipboardCheck className="h-4 w-4" />
                                  <span>Ceklis &amp; Nilai Siswa</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditItemModal(item)}
                                className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteLearningItem(item.id);
                                  showToast(`"${item.judul}" berhasil dihapus.`);
                                }}
                                aria-label={`Hapus ${item.judul}`}
                                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 5: LAPORAN */}
          {activeTab === 'laporan' && (
            <div className="space-y-5">
              {/* Sub-tab Switcher: Tracking Materi/Tugas vs Laporan Harian Tahfidz */}
              <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2 shadow-sm inline-grid grid-cols-2 gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setLaporanSubTab('tracking')}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    laporanSubTab === 'tracking'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Tracking Baca Materi &amp; Tugas
                </button>
                <button
                  type="button"
                  onClick={() => setLaporanSubTab('harian_tahfidz')}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    laporanSubTab === 'harian_tahfidz'
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Laporan Harian Tahfidz
                </button>
              </div>

              {laporanSubTab === 'harian_tahfidz' ? (
                <LaporanHarianTahfidzView
                  students={students}
                  tahfidzRecords={tahfidzRecords}
                  tahfidzClasses={tahfidzAvailableClasses}
                  onOpenManageClasses={
                    onSaveTahfidzTaughtClasses ? openTahfidzClassesModal : undefined
                  }
                />
              ) : (
                <>
              {/* Filter Bar per Kelas */}
              <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                      Tracking Baca Materi & Status Tugas per Kelas
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Menampilkan progres kelas <span className="font-semibold text-slate-900 dark:text-slate-100">{reportClassFilter}</span> ({reportClassSubjects.join(' & ')})
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label htmlFor="report-class" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Filter Kelas
                    </label>
                    <select
                      id="report-class"
                      value={reportClassFilter}
                      onChange={(e) => handleReportClassChange(e.target.value as ClassName)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    >
                      {ALL_CLASSES.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="report-subject" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Filter Mapel
                    </label>
                    <select
                      id="report-subject"
                      value={reportSubjectFilter}
                      onChange={(e) => setReportSubjectFilter(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    >
                      <option value="ALL">Semua Mapel ({reportClassSubjects.join(', ')})</option>
                      {reportClassSubjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="report-type" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Filter Tipe
                    </label>
                    <select
                      id="report-type"
                      value={reportTypeFilter}
                      onChange={(e) =>
                        setReportTypeFilter(e.target.value as 'ALL' | 'materi' | 'tugas')
                      }
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    >
                      <option value="ALL">Materi & Tugas</option>
                      <option value="materi">Hanya Materi (Sudah Dibaca)</option>
                      <option value="tugas">Hanya Tugas (Status Tugas)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="report-search" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Cari Siswa
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <input
                        id="report-search"
                        type="search"
                        value={reportSearch}
                        onChange={(e) => setReportSearch(e.target.value)}
                        placeholder="Nama atau NIS..."
                        className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel Ceklis & Penilaian Huruf Siswa Jilid (hanya kelas ampu XI & XII) */}
              {onSaveJilidSubmissionChecklist && (
                <JilidTaskChecklistPanel
                  selectedClass={reportClassFilter}
                  onChangeClass={handleReportClassChange}
                  availableClasses={tahfidzAvailableClasses}
                  tahfidzTaughtClasses={tahfidzTaughtClasses}
                  learningItems={learningItems}
                  students={students}
                  tahfidzRecords={tahfidzRecords}
                  submissions={submissions}
                  onSaveChecklist={onSaveJilidSubmissionChecklist}
                  onQuickToggleCategory={handleQuickToggleStudentCategory}
                  onNotify={showToast}
                />
              )}

              {/* Tracking Table */}
              <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                {reportRows.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Tidak ada data tracking untuk filter ini
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Pastikan kelas ini memiliki siswa dan materi/tugas yang sesuai.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                        <tr>
                          <th className="py-3 px-4 font-semibold">NIS</th>
                          <th className="py-3 px-4 font-semibold">Nama Siswa</th>
                          <th className="py-3 px-4 font-semibold">Mapel</th>
                          <th className="py-3 px-4 font-semibold">Materi / Tugas</th>
                          <th className="py-3 px-4 font-semibold">Sudah Dibaca</th>
                          <th className="py-3 px-4 font-semibold">Status Tugas</th>
                          <th className="py-3 px-4 font-semibold text-right">Waktu / Detail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {reportRows.map(({ student, item, readRecord, submission }) => {
                          const isTimedSubject =
                            item.mapel === 'Bahasa Arab' || item.mapel === 'Aqidah';
                          const isOfflineJilid = isJilidOfflineTask(item);
                          const hasViolationField =
                            !isOfflineJilid &&
                            (typeof submission?.violationCount === 'number' ||
                              (submission?.status === 'Selesai' && isTimedSubject));
                          const violations = submission?.violationCount ?? 0;
                          const durationMs =
                            submission?.startedAtMs && submission?.submittedAtMs
                              ? Math.max(0, submission.submittedAtMs - submission.startedAtMs)
                              : null;
                          const durationLabel =
                            durationMs !== null
                              ? `${Math.floor(durationMs / 60000)} mnt ${Math.floor(
                                  (durationMs % 60000) / 1000
                                )} dtk`
                              : null;

                          return (
                            <tr
                              key={`${student.nis}-${item.id}`}
                              className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                            >
                              <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {student.nis}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                {student.nama}
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {item.mapel}
                              </td>
                              <td className="py-3 px-4">
                                <div className="max-w-xs">
                                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {item.judul}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {item.type === 'materi'
                                      ? 'Materi Bacaan'
                                      : isOfflineJilid
                                      ? 'Tugas Buku Tulis (Ceklis Guru)'
                                      : `Tugas${isTimedSubject ? ` (${item.durasiMenit || 30} mnt)` : ''}`}
                                    {item.targetPeserta && item.targetPeserta !== 'Semua'
                                      ? ` · Khusus ${item.targetPeserta}`
                                      : ''}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {item.type === 'materi' ? (
                                  <StatusBadge
                                    variant={readRecord ? 'dibaca' : 'belum_dibaca'}
                                  />
                                ) : (
                                  <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {item.type === 'tugas' ? (
                                    <>
                                      {submission?.status === 'Selesai' ? (
                                        submission.gradingStatus === 'waiting_essay' ? (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-xs font-semibold text-amber-800 dark:text-amber-300">
                                            Menunggu Koreksi Essay
                                          </span>
                                        ) : (
                                          <StatusBadge variant="selesai" />
                                        )
                                      ) : submission?.sessionStatus === 'in_progress' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-xs font-semibold text-blue-800 dark:text-blue-300">
                                          <Clock className="h-3.5 w-3.5 shrink-0" />
                                          <span>Sedang Ujian</span>
                                        </span>
                                      ) : (
                                        <StatusBadge variant="belum" />
                                      )}

                                      {submission?.status === 'Selesai' &&
                                        submission.nilaiHuruf && (
                                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-bold shadow-xs">
                                            Nilai: {submission.nilaiHuruf}
                                          </span>
                                        )}

                                      {submission?.status === 'Selesai' &&
                                        typeof submission.finalScore === 'number' && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-[11px] font-mono font-bold text-blue-900 dark:text-blue-300 tabular-nums">
                                            {submission.gradingStatus === 'waiting_essay'
                                              ? `Sementara: ${submission.finalScore}/${submission.maxScore ?? '-'}`
                                              : `Nilai: ${submission.finalScore}/${submission.maxScore ?? '-'}`}
                                          </span>
                                        )}

                                      {hasViolationField && (
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-mono font-semibold tabular-nums ${
                                            violations > 0
                                              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/80 dark:bg-red-950/60 dark:text-red-300'
                                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-300'
                                          }`}
                                        >
                                          {violations > 0 ? (
                                            <ShieldAlert className="h-3 w-3 shrink-0" />
                                          ) : (
                                            <ShieldCheck className="h-3 w-3 shrink-0" />
                                          )}
                                          <span>{violations}x pindah layar</span>
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                                {item.type === 'materi' ? (
                                  <span className="font-mono tabular-nums">
                                    {readRecord ? readRecord.readAt : 'Belum dibuka'}
                                  </span>
                                ) : isOfflineJilid && onSaveJilidSubmissionChecklist ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setJilidChecklistModal({
                                        item,
                                        selectedClass: student.kelas,
                                      })
                                    }
                                    className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                                  >
                                    {submission?.status === 'Selesai'
                                      ? 'Edit Ceklis / Nilai'
                                      : 'Ceklis & Nilai'}
                                  </button>
                                ) : submission?.status === 'Selesai' ? (
                                  <div className="inline-flex flex-col items-end gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openSubmissionGradingModal(student, item, submission)
                                      }
                                      className="text-xs font-semibold text-blue-800 dark:text-blue-400 hover:underline"
                                    >
                                      {submission.gradingStatus === 'waiting_essay'
                                        ? 'Koreksi Essay / Nilai'
                                        : tugasList.some((t) => t.itemId === item.id)
                                        ? 'Lihat / Edit Nilai'
                                        : 'Lihat Jawaban'}
                                    </button>
                                    {durationLabel && (
                                      <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                                        Durasi: {durationLabel}
                                      </span>
                                    )}
                                  </div>
                                ) : submission?.sessionStatus === 'in_progress' ? (
                                  <span className="font-mono text-[11px] text-blue-800 dark:text-blue-400">
                                    Mulai: {submission.startedAt || '-'}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500">Menunggu</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
                </>
              )}
            </div>
          )}

          {/* TAB UJIAN TAHFIDZ & KENAIKAN JUZ OTOMATIS */}
          {activeTab === 'ujian_tahfidz' && (
            <UjianKenaikanJuzView
              students={students}
              tahfidzRecords={tahfidzRecords}
              ujianTahfidzList={ujianTahfidzList}
              onAddUjianTahfidz={onAddUjianTahfidz}
              onDeleteUjianTahfidz={onDeleteUjianTahfidz}
              onNotify={showToast}
            />
          )}

          {/* TAB 5: MANAJEMEN BUKU JILID */}
          {activeTab === 'jilid' && (
            <ManajemenBukuJilidView
              guruName={GURU_PROFILE.nama}
              students={students}
              jilidBooks={jilidBooks}
              jilidProgress={jilidProgress}
              onAddJilidBook={onAddJilidBook}
              onDeleteJilidBook={onDeleteJilidBook}
              onNotify={showToast}
            />
          )}

          {/* TAB 6: KAMUS ARAB */}
          {activeTab === 'kamus' && <KamusArabView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Glassmorphism strictly on Bottom Nav) */}
      <nav
        aria-label="Navigasi Bawah Guru"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 flex items-center overflow-x-auto h-16 px-1"
      >
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTab(item.id)}
              className={`flex-1 min-w-[68px] flex flex-col items-center justify-center gap-1 min-h-[44px] text-[11px] font-medium transition-colors shrink-0 ${
                active
                  ? 'text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {item.icon}
              <span className="truncate max-w-full px-1">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Create / Edit Materi / Tugas Modal */}
      <CreateLearningItemModal
        isOpen={isCreateItemModalOpen}
        lockedSubject={modalLockedSubject}
        defaultType={modalDefaultType}
        tahfidzTaughtClasses={tahfidzAvailableClasses}
        authorName={session.nama}
        editingItem={editingLearningItem}
        editingTugas={
          editingLearningItem
            ? tugasList.find((t) => t.itemId === editingLearningItem.id) ?? null
            : null
        }
        editingKunci={
          editingLearningItem
            ? kunciTugasList.find((k) => k.itemId === editingLearningItem.id) ?? null
            : null
        }
        onClose={() => {
          setIsCreateItemModalOpen(false);
          setEditingLearningItem(null);
        }}
        onSubmit={async (savedItem, soalDrafts, isEdit) => {
          await onSaveLearningItemWithSoal(savedItem, soalDrafts, isEdit);
          const targetPageNote =
            savedItem.mapel === 'Bahasa Arab'
              ? ' pada halaman Bahasa Arab'
              : savedItem.mapel === 'Aqidah'
              ? ' pada halaman Aqidah'
              : '';
          showToast(
            `${savedItem.type === 'materi' ? 'Materi' : 'Tugas'} "${savedItem.judul}" berhasil ${
              isEdit ? 'diperbarui' : 'disimpan'
            } ke Firestore${targetPageNote}.`
          );
        }}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        existingNisSet={existingNisSet}
        onClose={() => setIsCsvModalOpen(false)}
        onImport={async (newStudents) => {
          try {
            await onImportStudents(newStudents);
            showToast(`${newStudents.length} data siswa berhasil disimpan ke Firestore.`);
          } catch {
            showToast('Gagal menyimpan data CSV siswa ke Firestore.');
          }
        }}
      />

      {/* Add Single Student Modal */}
      {isAddStudentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-student-modal-title"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500" />
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 id="add-student-modal-title" className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    Tambah Data Siswa Baru
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Siswa dapat login menggunakan NIS dengan password awal {DEFAULT_STUDENT_PASSWORD}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddSingleStudent} className="space-y-4">
                <div>
                  <label htmlFor="new-student-nis" className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                    NIS Siswa
                  </label>
                  <input
                    id="new-student-nis"
                    type="text"
                    required
                    value={newStudentNis}
                    onChange={(e) => setNewStudentNis(e.target.value)}
                    placeholder="Contoh: 241001"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="new-student-name" className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                    Nama Lengkap Siswa
                  </label>
                  <input
                    id="new-student-name"
                    type="text"
                    required
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Contoh: Ahmad Zaki Pratama"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="new-student-class" className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                    Kelas
                  </label>
                  <select
                    id="new-student-class"
                    value={newStudentClass}
                    onChange={(e) => setNewStudentClass(e.target.value as ClassName)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  >
                    {ALL_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="new-student-tahfidz-level" className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                    Kelompok &amp; Level Tahfidz / Jilid
                  </label>
                  <select
                    id="new-student-tahfidz-level"
                    value={newStudentTahfidzLevel}
                    onChange={(e) => setNewStudentTahfidzLevel(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  >
                    {TAHFIDZ_LEVEL_OPTIONS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl} ({inferCategoryFromLevel(lvl)})
                      </option>
                    ))}
                  </select>
                </div>

                {addStudentError && (
                  <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                    {addStudentError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddStudentModalOpen(false)}
                    className="min-h-[42px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`min-h-[42px] px-5 py-2 text-sm ${PRIMARY_CTA_CLASS}`}
                  >
                    Simpan Siswa
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Tahfidz / Jilid Group Modal */}
      {editingTahfidzStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-tahfidz-profile-title"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    id="edit-tahfidz-profile-title"
                    className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                  >
                    Atur Kelompok Tahfidz / Jilid
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {editingTahfidzStudent.nama} · {editingTahfidzStudent.kelas} (NIS {editingTahfidzStudent.nis})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTahfidzStudent(null)}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                    Kelompok Belajar
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['Jilid', 'Tahfidz'] as TahfidzCategory[]).map((cat) => {
                      const active = editStudentTahfidzCat === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setEditStudentTahfidzCat(cat);
                            if (cat === 'Jilid' && !editStudentTahfidzLevel.toLowerCase().includes('jilid')) {
                              setEditStudentTahfidzLevel('Jilid 1');
                            } else if (cat === 'Tahfidz' && editStudentTahfidzLevel.toLowerCase().includes('jilid')) {
                              setEditStudentTahfidzLevel('Juz 30');
                            }
                          }}
                          className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                            active
                              ? 'border-teal-600 bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="edit-student-tahfidz-level"
                    className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                  >
                    Level / Juz Aktif
                  </label>
                  <select
                    id="edit-student-tahfidz-level"
                    value={editStudentTahfidzLevel}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditStudentTahfidzLevel(val);
                      setEditStudentTahfidzCat(inferCategoryFromLevel(val));
                    }}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    {TAHFIDZ_LEVEL_OPTIONS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTahfidzStudent(null)}
                    disabled={isSavingTahfidzProfile}
                    className="min-h-[42px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSavingTahfidzProfile}
                    onClick={async () => {
                      setIsSavingTahfidzProfile(true);
                      try {
                        await onUpdateStudentTahfidzProfile(
                          editingTahfidzStudent.nis,
                          editStudentTahfidzCat,
                          editStudentTahfidzLevel
                        );
                        showToast(
                          `Kelompok ${editingTahfidzStudent.nama} diperbarui ke ${editStudentTahfidzCat} (${editStudentTahfidzLevel}).`
                        );
                        setEditingTahfidzStudent(null);
                      } catch {
                        showToast('Gagal memperbarui kelompok siswa.');
                      } finally {
                        setIsSavingTahfidzProfile(false);
                      }
                    }}
                    className={`min-h-[42px] px-5 py-2 text-sm disabled:opacity-60 ${PRIMARY_CTA_CLASS}`}
                  >
                    {isSavingTahfidzProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Confirmation Modal */}
      {resetConfirmStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/25 flex items-center justify-center text-white shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 id="reset-modal-title" className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Konfirmasi Reset Password
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Password untuk <span className="font-semibold text-slate-900 dark:text-slate-100">{resetConfirmStudent.nama}</span> (NIS: <span className="font-mono">{resetConfirmStudent.nis}</span>) akan dikembalikan ke password default <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{DEFAULT_STUDENT_PASSWORD}</span>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmStudent(null)}
                className="min-h-[42px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                className={`min-h-[42px] px-5 py-2 text-sm ${PRIMARY_CTA_CLASS}`}
              >
                Ya, Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {deleteConfirmStudent && onDeleteStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-student-modal-title"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-md shadow-rose-500/25 flex items-center justify-center text-white shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3
                  id="delete-student-modal-title"
                  className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                >
                  Konfirmasi Hapus Siswa
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus siswa{' '}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {deleteConfirmStudent.nama}
                  </span>{' '}
                  -{' '}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {deleteConfirmStudent.kelas}
                  </span>
                  ? Data yang dihapus tidak dapat dikembalikan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingStudent}
                onClick={() => setDeleteConfirmStudent(null)}
                className="min-h-[42px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-colors disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingStudent}
                onClick={handleConfirmDeleteStudent}
                className="min-h-[42px] px-5 py-2 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-sm font-semibold shadow-md shadow-rose-500/25 transition-all disabled:opacity-60"
              >
                {isDeletingStudent ? 'Menghapus...' : 'Ya, Hapus Siswa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Atur Kelas Ampu Tahfidz Modal */}
      {isTahfidzClassesModalOpen && onSaveTahfidzTaughtClasses && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="atur-kelas-tahfidz-title"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3
                    id="atur-kelas-tahfidz-title"
                    className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                  >
                    Atur Kelas Ampu Tahfidz
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Centang kelas XI &amp; XII yang Anda ampu pada mapel Tahfidz/Tahsin. Secara default XI TKJ &amp; XI AK dikecualikan (guru berbeda), sedangkan Ujian Kenaikan Juz tetap menampilkan semua kelas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTahfidzClassesModalOpen(false)}
                  aria-label="Tutup pengaturan kelas ampu Tahfidz"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {TAHFIDZ_ELIGIBLE_CLASSES.map((cls) => {
                  const checked = draftTahfidzClasses.includes(cls);
                  const isExcludedDefault = cls === 'XI TKJ' || cls === 'XI AK';
                  return (
                    <label
                      key={cls}
                      className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                        checked
                          ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/35 text-teal-900 dark:text-teal-200'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0B1120] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-xs font-bold">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDraftTahfidzClasses((prev) =>
                                prev.includes(cls) ? prev : [...prev, cls]
                              );
                            } else {
                              setDraftTahfidzClasses((prev) =>
                                prev.filter((item) => item !== cls)
                              );
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span>{cls}</span>
                      </span>
                      {isExcludedDefault && !checked && (
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          Guru lain
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Kelas X hanya mengikuti mapel Aqidah sesuai kurikulum.
              </p>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSavingTahfidzClasses}
                  onClick={() =>
                    setDraftTahfidzClasses([...DEFAULT_TAHFIDZ_TAUGHT_CLASSES])
                  }
                  className="text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline disabled:opacity-60"
                >
                  Reset Default
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSavingTahfidzClasses}
                    onClick={() => setIsTahfidzClassesModalOpen(false)}
                    className="min-h-[40px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSavingTahfidzClasses}
                    onClick={handleSaveTahfidzClassesSetting}
                    className={`min-h-[40px] px-5 py-2 text-xs sm:text-sm disabled:opacity-60 ${PRIMARY_CTA_CLASS}`}
                  >
                    {isSavingTahfidzClasses ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Detail & Teacher Grading Modal */}
      {selectedSubmissionDetail && (() => {
        const { student: subStudent, item: subItem, submission: subRecord } = selectedSubmissionDetail;
        const matchedTugas = tugasList.find((t) => t.itemId === subItem.id);
        const matchedKunci = kunciTugasList.find((k) => k.itemId === subItem.id);
        const submissionId = `${subItem.id}__${subStudent.nis}`;

        const computedAutoScore = matchedTugas
          ? Math.round(
              matchedTugas.soalList
                .filter((s) => s.type !== 'essay')
                .reduce((acc, s) => acc + (Number(draftItemScores[s.id]) || 0), 0) * 100
            ) / 100
          : 0;
        const computedEssayScore = matchedTugas
          ? Math.round(
              matchedTugas.soalList
                .filter((s) => s.type === 'essay')
                .reduce((acc, s) => acc + (Number(draftItemScores[s.id]) || 0), 0) * 100
            ) / 100
          : 0;
        const computedFinalScore =
          Math.round((computedAutoScore + computedEssayScore) * 100) / 100;
        const maxScore = matchedTugas?.totalPoin ?? subRecord.maxScore ?? 0;

        const handleSaveGradingSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!matchedTugas || isSavingGrade) return;
          setIsSavingGrade(true);
          try {
            await onSaveTeacherGrading(
              submissionId,
              draftItemScores,
              computedAutoScore,
              computedEssayScore,
              computedFinalScore,
              maxScore,
              draftCatatanGuru.trim()
            );
            showToast(
              `Nilai akhir ${subStudent.nama} (${computedFinalScore}/${maxScore}) berhasil disimpan ke Firestore.`
            );
            setSelectedSubmissionDetail(null);
          } catch {
            showToast('Gagal menyimpan koreksi nilai ke Firestore.');
          } finally {
            setIsSavingGrade(false);
          }
        };

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sub-detail-title"
          >
            <div
              className={`w-full ${
                matchedTugas ? 'max-w-3xl' : 'max-w-lg'
              } bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]`}
            >
              <div className={`h-1.5 w-full ${getSubjectTheme(subItem.mapel).gradientBar}`} />
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <h3 id="sub-detail-title" className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    {matchedTugas ? 'Detail Jawaban & Koreksi Nilai' : 'Detail Pengumpulan Tugas'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {subStudent.nama} · {subStudent.kelas} (NIS {subStudent.nis})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSubmissionDetail(null)}
                  aria-label="Tutup modal detail"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`text-xs font-semibold ${getSubjectTheme(subItem.mapel).accentText}`}>
                      {subItem.mapel}
                    </p>
                    {(typeof subRecord.violationCount === 'number' ||
                      subItem.mapel === 'Bahasa Arab' ||
                      subItem.mapel === 'Aqidah') && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-mono font-semibold tabular-nums ${
                          (subRecord.violationCount ?? 0) > 0
                            ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {(subRecord.violationCount ?? 0) > 0 ? (
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span>
                          {subRecord.violationCount ?? 0}x pindah layar
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {subItem.judul}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums pt-1">
                    <p>Mulai: {subRecord.startedAt || '-'}</p>
                    <p>Selesai: {subRecord.submittedAt || '-'}</p>
                    {subRecord.startedAtMs && subRecord.submittedAtMs && (
                      <p className="sm:col-span-2 text-indigo-700 dark:text-indigo-300 font-semibold">
                        Durasi Pengerjaan:{' '}
                        {Math.floor(
                          Math.max(0, subRecord.submittedAtMs - subRecord.startedAtMs) / 60000
                        )}{' '}
                        menit{' '}
                        {Math.floor(
                          (Math.max(0, subRecord.submittedAtMs - subRecord.startedAtMs) % 60000) /
                            1000
                        )}{' '}
                        detik (Batas: {subRecord.durasiMenit || subItem.durasiMenit || 30} mnt)
                      </p>
                    )}
                  </div>
                </div>

                {matchedTugas ? (
                  <form id="teacher-grading-form" onSubmit={handleSaveGradingSubmit} className="space-y-4">
                    {matchedTugas.soalList.map((soal, idx) => {
                      const kunci = matchedKunci?.kunciList.find((k) => k.soalId === soal.id);
                      const ans = subRecord.structuredAnswers?.[soal.id];
                      const currentScore = Number(draftItemScores[soal.id] ?? 0);
                      const isEditable =
                        soal.type === 'essay' || soal.type === 'isian_singkat';

                      return (
                        <div
                          key={soal.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                            <span className={`font-display text-xs sm:text-sm font-bold ${getSubjectTheme(subItem.mapel).accentText}`}>
                              Soal #{idx + 1} ·{' '}
                              {soal.type === 'pilihan_ganda'
                                ? 'Pilihan Ganda'
                                : soal.type === 'isian_singkat'
                                ? 'Isian Singkat'
                                : soal.type === 'menjodohkan'
                                ? 'Menjodohkan'
                                : 'Essay'}
                            </span>
                            <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                              Maks. {soal.poin} poin
                            </span>
                          </div>

                          <MaterialContentRenderer content={soal.pertanyaan} />

                          {/* Plain-Text Student Answer */}
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              Jawaban Siswa:
                            </p>
                            {soal.type === 'pilihan_ganda' && (
                              <p dir="auto" className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 whitespace-pre-line">
                                {typeof ans === 'string' && ans
                                  ? `${ans}. ${soal.opsi?.[ans as 'A' | 'B' | 'C' | 'D'] || ''}`
                                  : '(Tidak dijawab)'}
                              </p>
                            )}
                            {soal.type === 'isian_singkat' && (
                              <p dir="auto" className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 whitespace-pre-line">
                                {typeof ans === 'string' && ans.trim() ? ans : '(Tidak dijawab)'}
                              </p>
                            )}
                            {soal.type === 'menjodohkan' && (
                              <div className="space-y-1">
                                {(soal.kiriList || []).map((kiri) => {
                                  const pickedId =
                                    ans && typeof ans === 'object' ? ans[kiri.id] : '';
                                  const pickedText =
                                    soal.kananList?.find((r) => r.id === pickedId)?.text ||
                                    '(Tidak dipilih)';
                                  const correctPair = kunci?.pasanganKunci?.find(
                                    (p) => p.kiriId === kiri.id
                                  );
                                  const isMatch = Boolean(
                                    correctPair && pickedId === correctPair.kananId
                                  );
                                  return (
                                    <p
                                      key={kiri.id}
                                      dir="auto"
                                      className={`text-xs whitespace-pre-line ${
                                        isMatch
                                          ? 'text-emerald-700 dark:text-emerald-400'
                                          : 'text-red-700 dark:text-red-400'
                                      }`}
                                    >
                                      {kiri.text} → {pickedText}{' '}
                                      {!isMatch && correctPair
                                        ? `(Kunci: ${correctPair.kananText})`
                                        : ''}
                                    </p>
                                  );
                                })}
                              </div>
                            )}
                            {soal.type === 'essay' && (
                              <p dir="auto" className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 whitespace-pre-line leading-relaxed">
                                {typeof ans === 'string' && ans.trim() ? ans : '(Tidak dijawab)'}
                              </p>
                            )}
                          </div>

                          {/* Teacher Key Reference & Score Control */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                            <div className="text-xs text-slate-600 dark:text-slate-400 flex-1">
                              {soal.type === 'pilihan_ganda' && kunci?.kunciPg && (
                                <span>
                                  Kunci Jawaban:{' '}
                                  <strong className="font-mono text-slate-900 dark:text-slate-100">
                                    {kunci.kunciPg}
                                  </strong>
                                </span>
                              )}
                              {soal.type === 'isian_singkat' && kunci?.variasiBenar && (
                                <span dir="auto">
                                  Variasi Kunci:{' '}
                                  <strong className="text-slate-900 dark:text-slate-100">
                                    {kunci.variasiBenar.join(', ')}
                                  </strong>
                                </span>
                              )}
                              {soal.type === 'essay' && kunci?.pedomanEssay && (
                                <p dir="auto" className="whitespace-pre-line">
                                  Pedoman Guru:{' '}
                                  <span className="text-slate-900 dark:text-slate-100 font-medium">
                                    {kunci.pedomanEssay}
                                  </span>
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Skor:
                              </span>
                              {isEditable ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min={0}
                                    max={soal.poin}
                                    step="0.5"
                                    aria-label={`Skor Soal #${idx + 1}`}
                                    value={currentScore}
                                    onChange={(e) => {
                                      const val = Math.min(
                                        soal.poin,
                                        Math.max(0, Number(e.target.value) || 0)
                                      );
                                      setDraftItemScores((prev) => ({
                                        ...prev,
                                        [soal.id]: val,
                                      }));
                                    }}
                                    className="w-20 min-h-[38px] px-2.5 py-1 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-slate-800 text-xs font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-800/25"
                                  />
                                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                    / {soal.poin}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-mono text-xs font-bold text-blue-800 dark:text-blue-400 tabular-nums">
                                  {currentScore} / {soal.poin}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div>
                      <label
                        htmlFor="grading-catatan-guru"
                        className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                      >
                        Catatan / Umpan Balik Guru (Opsional)
                      </label>
                      <textarea
                        id="grading-catatan-guru"
                        rows={2}
                        maxLength={2000}
                        value={draftCatatanGuru}
                        onChange={(e) => setDraftCatatanGuru(e.target.value)}
                        placeholder="Tuliskan catatan apresiasi atau masukan untuk siswa..."
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-800/25"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-blue-900 dark:text-blue-200 space-y-0.5 font-mono tabular-nums">
                        <p>
                          Skor Otomatis: {computedAutoScore} · Skor Essay: {computedEssayScore}
                        </p>
                      </div>
                      <div className="text-sm font-display font-bold text-blue-900 dark:text-blue-100 tabular-nums">
                        Nilai Akhir: {computedFinalScore} / {maxScore}
                      </div>
                    </div>
                  </form>
                ) : isJilidOfflineTask(subItem) ? (
                  <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-2 text-xs">
                    <p className="font-bold text-teal-900 dark:text-teal-200">
                      Kumpul Langsung Buku Tulis (Ceklis Guru)
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      Status: <span className="font-bold">{subRecord.status === 'Selesai' ? 'Sudah Dikumpulkan' : 'Belum'}</span>
                      {subRecord.nilaiHuruf ? ` · Nilai Huruf: ${subRecord.nilaiHuruf}` : ''}
                    </p>
                    {subRecord.catatanGuru && (
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                        Catatan Guru: {subRecord.catatanGuru}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Catatan / Jawaban Siswa</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 max-h-64 overflow-y-auto">
                      {subRecord.jawaban || 'Tidak ada catatan teks.'}
                    </p>
                  </div>
                )}

                {subRecord.fileNama && (
                  <p className="text-xs text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Lampiran: {subRecord.fileNama}</span>
                  </p>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120]/70 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedSubmissionDetail(null)}
                  className="min-h-[42px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-colors"
                >
                  Tutup
                </button>
                {matchedTugas && (
                  <button
                    type="submit"
                    form="teacher-grading-form"
                    disabled={isSavingGrade}
                    className={`min-h-[42px] px-5 py-2 text-sm disabled:opacity-60 ${PRIMARY_CTA_CLASS}`}
                  >
                    {isSavingGrade ? 'Menyimpan...' : 'Simpan Koreksi & Nilai Akhir'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Kelola Jadwal Mengajar Modal */}
      {isJadwalModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kelola-jadwal-title"
        >
          <div className="w-full max-w-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500" />
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <h3
                  id="kelola-jadwal-title"
                  className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100"
                >
                  Kelola Jadwal Mengajar Diniyyah
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Jadwal ini tampil otomatis di Beranda Guru & Beranda Siswa sesuai kelasnya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsJadwalModalOpen(false);
                  setEditingJadwalId(null);
                }}
                aria-label="Tutup modal jadwal"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <form
                onSubmit={handleCreateJadwalSubmit}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {editingJadwalId
                      ? 'Edit Sesi Jadwal Mengajar'
                      : '+ Tambah Sesi Jadwal Baru'}
                  </p>
                  {editingJadwalId && (
                    <button
                      type="button"
                      onClick={() => setEditingJadwalId(null)}
                      className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 underline"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="jadwal-hari"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Hari
                    </label>
                    <select
                      id="jadwal-hari"
                      value={jadwalHari}
                      onChange={(e) => setJadwalHari(e.target.value as DayName)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] text-sm text-slate-900 dark:text-slate-100"
                    >
                      {SCHEDULE_DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="jadwal-kelas"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Kelas
                    </label>
                    <select
                      id="jadwal-kelas"
                      value={jadwalKelas}
                      onChange={(e) => {
                        const nextClass = e.target.value as ClassName;
                        setJadwalKelas(nextClass);
                        const allowed = getSubjectsForClass(nextClass);
                        if (!allowed.includes(jadwalMapelChoice)) {
                          setJadwalMapelChoice(allowed[0]);
                        }
                      }}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] text-sm text-slate-900 dark:text-slate-100"
                    >
                      {ALL_CLASSES.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="jadwal-mapel"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Mata Pelajaran
                    </label>
                    <select
                      id="jadwal-mapel"
                      value={
                        getSubjectsForClass(jadwalKelas).includes(jadwalMapelChoice)
                          ? jadwalMapelChoice
                          : getSubjectsForClass(jadwalKelas)[0]
                      }
                      onChange={(e) =>
                        setJadwalMapelChoice(e.target.value as SubjectName)
                      }
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] text-sm text-slate-900 dark:text-slate-100"
                    >
                      {getSubjectsForClass(jadwalKelas).map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="jadwal-mulai"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        Jam Mulai
                      </label>
                      <input
                        id="jadwal-mulai"
                        type="time"
                        required
                        value={jadwalJamMulai}
                        onChange={(e) => setJadwalJamMulai(e.target.value)}
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] text-sm font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="jadwal-selesai"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        Jam Selesai
                      </label>
                      <input
                        id="jadwal-selesai"
                        type="time"
                        required
                        value={jadwalJamSelesai}
                        onChange={(e) => setJadwalJamSelesai(e.target.value)}
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] text-sm font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {editingJadwalId && (
                    <button
                      type="button"
                      onClick={() => setEditingJadwalId(null)}
                      className="min-h-[40px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSavingJadwal}
                    className={`min-h-[40px] px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5 disabled:opacity-60 ${PRIMARY_CTA_CLASS}`}
                  >
                    {editingJadwalId ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>
                      {isSavingJadwal
                        ? 'Menyimpan...'
                        : editingJadwalId
                          ? 'Simpan Perubahan'
                          : 'Tambah ke Jadwal'}
                    </span>
                  </button>
                </div>
              </form>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Daftar Jadwal Mingguan ({sortedAllJadwal.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsJadwalModalOpen(false);
                      setIsWeeklyMatrixModalOpen(true);
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Buka Matriks Senin–Sabtu
                  </button>
                </div>

                {sortedAllJadwal.length === 0 ? (
                  <p className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                    Belum ada jadwal pelajaran yang ditambahkan.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {sortedAllJadwal.map((jdw) => {
                      const subTheme = getSubjectTheme(jdw.mapel);
                      return (
                        <div
                          key={jdw.id}
                          className="px-4 py-3 bg-white dark:bg-[#0B1120] flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="font-bold text-indigo-700 dark:text-indigo-400">
                                {jdw.hari}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                {jdw.jamMulai}–{jdw.jamSelesai}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {jdw.kelas}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${subTheme.badgeClasses}`}
                              >
                                {jdw.mapel}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                              Tingkat {jdw.tingkat}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditJadwalModal(jdw)}
                              aria-label={`Edit jadwal ${jdw.kelas} ${jdw.hari}`}
                              title="Edit Jadwal"
                              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickDeleteJadwal(jdw)}
                              aria-label={`Hapus jadwal ${jdw.kelas} ${jdw.hari}`}
                              title="Hapus Jadwal"
                              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matriks Jadwal Mengajar Mingguan (Senin-Sabtu) Modal */}
      {isWeeklyMatrixModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="matriks-jadwal-title"
        >
          <div className="w-full max-w-6xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500" />
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h3
                  id="matriks-jadwal-title"
                  className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100"
                >
                  Matriks Jadwal Mengajar Mingguan (Senin–Sabtu)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  Menampilkan seluruh {jadwalMapel.length} sesi mengajar aktif dalam sepekan
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsWeeklyMatrixModalOpen(false);
                    openCreateJadwalModal(selectedScheduleDay);
                  }}
                  className={`min-h-[38px] px-3.5 py-1.5 text-xs flex items-center gap-1.5 ${PRIMARY_CTA_CLASS}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Jadwal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsWeeklyMatrixModalOpen(false)}
                  aria-label="Tutup matriks jadwal"
                  className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="overflow-x-auto pb-2">
                <div className="min-w-[920px] grid grid-cols-6 gap-3">
                  {SCHEDULE_DAYS.map((day) => {
                    const dayItems = jadwalByDayMap[day] ?? [];
                    const isToday = todayDayName === day;
                    return (
                      <div
                        key={day}
                        className={`rounded-2xl border p-3 flex flex-col justify-between gap-3 ${
                          isToday
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-500/40'
                            : 'bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-200 dark:border-slate-800">
                            <div>
                              <p className="font-display text-xs font-bold text-slate-900 dark:text-slate-100">
                                {day}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                                {dayItems.length} sesi
                              </p>
                            </div>
                            {isToday && (
                              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold">
                                Hari Ini
                              </span>
                            )}
                          </div>

                          {dayItems.length === 0 ? (
                            <div className="py-6 text-center text-[11px] text-slate-400 dark:text-slate-500">
                              Kosong
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {dayItems.map((jdw) => {
                                const subTheme = getSubjectTheme(jdw.mapel);
                                return (
                                  <div
                                    key={jdw.id}
                                    className="p-2.5 rounded-xl bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-xs"
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                                        {jdw.jamMulai}–{jdw.jamSelesai}
                                      </span>
                                      <div className="flex items-center gap-0.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsWeeklyMatrixModalOpen(false);
                                            openEditJadwalModal(jdw);
                                          }}
                                          aria-label={`Edit jadwal ${jdw.kelas} ${jdw.hari}`}
                                          title="Edit"
                                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleQuickDeleteJadwal(jdw)}
                                          aria-label={`Hapus jadwal ${jdw.kelas} ${jdw.hari}`}
                                          title="Hapus"
                                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                      {jdw.kelas}
                                    </p>
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${subTheme.badgeClasses}`}
                                    >
                                      {jdw.mapel}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIsWeeklyMatrixModalOpen(false);
                            openCreateJadwalModal(day);
                          }}
                          className="w-full py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                        >
                          + Tambah {day.slice(0, 3)}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buat Pengumuman Diniyyah Modal */}
      {isPengumumanModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="buat-pengumuman-title"
        >
          <div className="w-full max-w-lg bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500" />
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-md shadow-indigo-500/25 flex items-center justify-center text-white shrink-0">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3
                    id="buat-pengumuman-title"
                    className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate"
                  >
                    Buat Pengumuman Diniyyah
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Tampil di Beranda & kirim notifikasi lonceng siswa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPengumumanModalOpen(false)}
                aria-label="Tutup modal pengumuman"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreatePengumumanSubmit}
              className="p-6 overflow-y-auto space-y-4"
            >
              <div>
                <label
                  htmlFor="pengumuman-judul"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Judul Pengumuman
                </label>
                <input
                  id="pengumuman-judul"
                  type="text"
                  required
                  maxLength={140}
                  value={pengumumanJudul}
                  onChange={(e) => setPengumumanJudul(e.target.value)}
                  placeholder="Contoh: Jadwal Setoran Hafalan Pekan UTS"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="pengumuman-target"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Target Tingkat Kelas
                </label>
                <div
                  id="pengumuman-target"
                  className="grid grid-cols-4 gap-2"
                >
                  {(['Semua', 'X', 'XI', 'XII'] as PengumumanTargetTingkat[]).map(
                    (opt) => {
                      const active = pengumumanTarget === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setPengumumanTarget(opt)}
                          className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            active
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md shadow-indigo-500/25'
                              : 'bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                          }`}
                        >
                          {opt === 'Semua' ? 'Semua' : `Kelas ${opt}`}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="pengumuman-isi"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Isi Pengumuman
                </label>
                <textarea
                  id="pengumuman-isi"
                  required
                  rows={4}
                  maxLength={1500}
                  value={pengumumanIsi}
                  onChange={(e) => setPengumumanIsi(e.target.value)}
                  placeholder="Tuliskan informasi penting untuk santri/siswa..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 resize-y"
                />
              </div>

              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] cursor-pointer">
                <input
                  type="checkbox"
                  checked={pengumumanPenting}
                  onChange={(e) => setPengumumanPenting(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Pin className="h-3.5 w-3.5 text-rose-500" />
                    <span>Sematkan sebagai Pengumuman Penting</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ditampilkan paling atas dengan penanda khusus berwarna koral.
                  </p>
                </div>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPengumumanModalOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    isSavingPengumuman ||
                    !pengumumanJudul.trim() ||
                    !pengumumanIsi.trim()
                  }
                  className={`min-h-[42px] px-5 py-2 text-xs sm:text-sm flex items-center gap-1.5 disabled:opacity-60 ${PRIMARY_CTA_CLASS}`}
                >
                  <Megaphone className="h-4 w-4" />
                  <span>
                    {isSavingPengumuman
                      ? 'Menerbitkan...'
                      : 'Terbitkan Pengumuman'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kelola PROTA Modal */}
      {isProtaModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kelola-prota-title"
        >
          <div className="w-full max-w-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500" />
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <h3
                  id="kelola-prota-title"
                  className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100"
                >
                  Program Tahunan (PROTA)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  Capaian saat ini: {protaCompletedCount} dari {protaList.length} bab selesai ({protaProgressPct}%)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProtaModalOpen(false)}
                aria-label="Tutup modal PROTA"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <form
                onSubmit={handleCreateProtaSubmit}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  + Tambah Target Bab PROTA
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="prota-mapel"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Mata Pelajaran
                    </label>
                    <select
                      id="prota-mapel"
                      value={protaMapel}
                      onChange={(e) => setProtaMapel(e.target.value as SubjectName)}
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] text-sm text-slate-900 dark:text-slate-100"
                    >
                      <option value="Bahasa Arab">Bahasa Arab</option>
                      <option value="Aqidah">Aqidah</option>
                      <option value="Tahfidz/Tahsin">Tahfidz/Tahsin</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="prota-tingkat"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Tingkat
                    </label>
                    <select
                      id="prota-tingkat"
                      value={protaTingkat}
                      onChange={(e) => setProtaTingkat(e.target.value as GradeLevel)}
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] text-sm text-slate-900 dark:text-slate-100"
                    >
                      {ALL_GRADES.map((g) => (
                        <option key={g} value={g}>
                          Kelas {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="prota-semester"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Semester
                    </label>
                    <select
                      id="prota-semester"
                      value={protaSemester}
                      onChange={(e) =>
                        setProtaSemester(e.target.value as 'Ganjil' | 'Genap')
                      }
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] text-sm text-slate-900 dark:text-slate-100"
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    required
                    maxLength={200}
                    value={protaBab}
                    onChange={(e) => setProtaBab(e.target.value)}
                    placeholder="Contoh: Bab 1 — Fi'il Madhi & Mudhari'"
                    aria-label="Judul Bab PROTA"
                    className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] text-sm text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={isSavingProta}
                    className={`min-h-[42px] px-4 py-2 text-xs sm:text-sm flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-60 ${PRIMARY_CTA_CLASS}`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>{isSavingProta ? 'Menyimpan...' : 'Tambah'}</span>
                  </button>
                </div>
              </form>

              {protaList.length === 0 ? (
                <p className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                  Belum ada daftar target bab PROTA di Firestore.
                </p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {protaList.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 bg-white dark:bg-[#0B1120] flex items-center justify-between gap-3"
                    >
                      <label className="flex items-start gap-3 cursor-pointer min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={item.selesai}
                          onChange={() => onToggleProtaItem(item)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold ${
                              item.selesai
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {item.bab}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.mapel} · Kelas {item.tingkat} · Semester {item.semester}
                          </p>
                        </div>
                      </label>

                      <button
                        type="button"
                        onClick={() => onDeleteProtaItem(item.id)}
                        aria-label={`Hapus PROTA ${item.bab}`}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-400 transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail Kontribusi Siswa Per Kelas Modal */}
      {selectedClassDetail && selectedClassSummary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-kontribusi-kelas-title"
        >
          <div className="w-full max-w-4xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-indigo-600 to-amber-500" />
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] tabular-nums ${getRankBadgeClasses(
                      selectedClassSummary.rank
                    )}`}
                  >
                    Peringkat #{selectedClassSummary.rank}
                  </span>
                  <h3
                    id="detail-kontribusi-kelas-title"
                    className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100"
                  >
                    Detail Kontribusi Siswa — {selectedClassDetail}
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {selectedClassSummary.studentCount} siswa · Skor Keaktifan Kelas {selectedClassSummary.activityPct}% (Baca {selectedClassSummary.readPct}% · Tugas {selectedClassSummary.taskPct}%)
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleCopyIncompleteStudents}
                  className="min-h-[40px] px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold shadow-md shadow-amber-500/25 flex items-center gap-1.5 whitespace-nowrap transition-all"
                >
                  {copiedIncompleteClass ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Tersalin ke Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin Nama Belum Tuntas</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClassDetail(null)}
                  aria-label="Tutup modal detail kontribusi kelas"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {/* Summary Status Pills */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/25">
                  <p className="text-[11px] font-semibold text-teal-800 dark:text-teal-300">
                    Sangat Rajin (100%)
                  </p>
                  <p className="mt-0.5 font-display text-lg font-bold text-teal-700 dark:text-teal-300 tabular-nums">
                    {selectedClassStudentDetails.filter((d) => d.statusLabel === 'Sangat Rajin').length} siswa
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25">
                  <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                    Aktif (50–99%)
                  </p>
                  <p className="mt-0.5 font-display text-lg font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                    {selectedClassStudentDetails.filter((d) => d.statusLabel === 'Aktif').length} siswa
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/25">
                  <p className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                    Perlu Perhatian (&lt;50%)
                  </p>
                  <p className="mt-0.5 font-display text-lg font-bold text-rose-700 dark:text-rose-300 tabular-nums">
                    {selectedClassStudentDetails.filter((d) => d.statusLabel === 'Perlu Perhatian').length} siswa
                  </p>
                </div>
              </div>

              {selectedClassStudentDetails.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-center space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Belum ada siswa terdaftar di kelas {selectedClassDetail}.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tambahkan atau impor data siswa melalui menu Manajemen Siswa.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden sm:block border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          <th className="py-3 px-4 w-12">No</th>
                          <th className="py-3 px-4">Nama Siswa & NIS</th>
                          <th className="py-3 px-4 text-center">Baca Materi</th>
                          <th className="py-3 px-4 text-center">Tugas Selesai</th>
                          <th className="py-3 px-4 w-44">Kontribusi</th>
                          <th className="py-3 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                        {selectedClassStudentDetails.map((row, index) => {
                          const badgeClass =
                            row.statusLabel === 'Sangat Rajin'
                              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm shadow-teal-500/20'
                              : row.statusLabel === 'Aktif'
                              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30';
                          const barClass =
                            row.statusLabel === 'Sangat Rajin'
                              ? 'from-teal-500 to-emerald-500'
                              : row.statusLabel === 'Aktif'
                              ? 'from-amber-500 to-orange-500'
                              : 'from-rose-500 to-orange-500';

                          return (
                            <tr
                              key={row.student.nis}
                              className="bg-white dark:bg-[#131C31] hover:bg-slate-50/80 dark:hover:bg-[#0B1120]/60"
                            >
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums ${getRankBadgeClasses(
                                    index + 1
                                  )}`}
                                >
                                  #{index + 1}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                  {row.student.nama}
                                </p>
                                <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                  NIS {row.student.nis}
                                </p>
                              </td>
                              <td className="py-3 px-4 text-center font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                {row.readDone}/{row.readTotal}
                              </td>
                              <td className="py-3 px-4 text-center font-mono font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                                {row.taskDone}/{row.taskTotal}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full bg-gradient-to-r ${barClass}`}
                                      style={{ width: `${row.contributionPct}%` }}
                                    />
                                  </div>
                                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums w-10 text-right">
                                    {row.contributionPct}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${badgeClass}`}
                                >
                                  {row.statusLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stacked Cards */}
                  <div className="sm:hidden space-y-2.5">
                    {selectedClassStudentDetails.map((row, index) => {
                      const badgeClass =
                        row.statusLabel === 'Sangat Rajin'
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white'
                          : row.statusLabel === 'Aktif'
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30';
                      const barClass =
                        row.statusLabel === 'Sangat Rajin'
                          ? 'from-teal-500 to-emerald-500'
                          : row.statusLabel === 'Aktif'
                          ? 'from-amber-500 to-orange-500'
                          : 'from-rose-500 to-orange-500';

                      return (
                        <div
                          key={row.student.nis}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <span
                                className={`mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums shrink-0 ${getRankBadgeClasses(
                                  index + 1
                                )}`}
                              >
                                #{index + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {row.student.nama}
                                </p>
                                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                  NIS {row.student.nis}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 ${badgeClass}`}
                            >
                              {row.statusLabel}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-slate-500 dark:text-slate-400">Materi</span>
                              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                {row.readDone}/{row.readTotal}
                              </span>
                            </div>
                            <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-slate-500 dark:text-slate-400">Tugas</span>
                              <span className="font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                                {row.taskDone}/{row.taskTotal}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${barClass}`}
                                style={{ width: `${row.contributionPct}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                              {row.contributionPct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal Ceklis & Nilai Huruf Siswa Jilid */}
      {jilidChecklistModal && onSaveJilidSubmissionChecklist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="jilid-checklist-modal-title"
        >
          <div className="w-full max-w-4xl my-auto bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-teal-700 dark:text-teal-300">
                  Tahfidz/Tahsin · Ceklis &amp; Nilai Siswa
                </p>
                <h3
                  id="jilid-checklist-modal-title"
                  className="font-display text-base font-bold text-slate-900 dark:text-slate-100 truncate"
                >
                  {jilidChecklistModal.item.judul}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setJilidChecklistModal(null)}
                aria-label="Tutup panel ceklis siswa Jilid"
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto">
              <JilidTaskChecklistPanel
                selectedClass={jilidChecklistModal.selectedClass}
                onChangeClass={(nextClass) =>
                  setJilidChecklistModal((prev) =>
                    prev ? { ...prev, selectedClass: nextClass } : null
                  )
                }
                availableClasses={(() => {
                  if (jilidChecklistModal.item.targetKelas !== 'ALL') {
                    return [jilidChecklistModal.item.targetKelas];
                  }
                  const filtered = GRADE_CLASSES[jilidChecklistModal.item.tingkat].filter(
                    (cls) => tahfidzAvailableClasses.includes(cls)
                  );
                  return filtered.length > 0
                    ? filtered
                    : GRADE_CLASSES[jilidChecklistModal.item.tingkat];
                })()}
                tahfidzTaughtClasses={tahfidzTaughtClasses}
                learningItems={learningItems}
                initialItemId={jilidChecklistModal.item.id}
                students={students}
                tahfidzRecords={tahfidzRecords}
                submissions={submissions}
                onSaveChecklist={onSaveJilidSubmissionChecklist}
                onQuickToggleCategory={handleQuickToggleStudentCategory}
                onNotify={showToast}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
