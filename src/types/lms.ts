export type UserRole = 'guru' | 'siswa';

export type GradeLevel = 'X' | 'XI' | 'XII';

export type ClassName =
  | 'X RPL'
  | 'X TKJ'
  | 'X AK'
  | 'X TP 1'
  | 'X TP 2'
  | 'XI RPL'
  | 'XI TKJ'
  | 'XI AK'
  | 'XI TP 1'
  | 'XI TP 2'
  | 'XII RPL'
  | 'XII TKJ';

export type SubjectName = 'Aqidah' | 'Tahfidz/Tahsin' | 'Bahasa Arab';

export interface Student {
  id: string;
  nis: string;
  email?: string;
  uid?: string;
  nama: string;
  kelas: ClassName;
  tingkat: GradeLevel;
  usingDefaultPassword: boolean;
  lastPasswordResetAt?: string;
}

export interface Teacher {
  id: string;
  email: string;
  nama: string;
  jabatan: string;
}

export type LearningItemType = 'materi' | 'tugas';

export type SoalType =
  | 'pilihan_ganda'
  | 'isian_singkat'
  | 'menjodohkan'
  | 'essay';

export interface MenjodohkanKiriItem {
  id: string;
  text: string;
}

export interface MenjodohkanKananItem {
  id: string;
  text: string;
}

export interface TugasSoalItem {
  id: string;
  type: SoalType;
  pertanyaan: string;
  poin: number;
  opsi?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  kiriList?: MenjodohkanKiriItem[];
  kananList?: MenjodohkanKananItem[];
}

export interface TugasDocument {
  id: string;
  itemId: string;
  judul: string;
  tingkat: GradeLevel;
  targetKelas: ClassName | 'ALL';
  mapel: SubjectName;
  durasiMenit: number;
  totalPoin: number;
  hasEssay: boolean;
  soalList: TugasSoalItem[];
  authorUid?: string;
}

export interface KunciMenjodohkanPair {
  kiriId: string;
  kananId: string;
  kiriText: string;
  kananText: string;
}

export interface KunciSoalItem {
  soalId: string;
  type: SoalType;
  poin: number;
  kunciPg?: 'A' | 'B' | 'C' | 'D';
  variasiBenar?: string[];
  pasanganKunci?: KunciMenjodohkanPair[];
  pedomanEssay?: string;
}

export interface KunciTugasDocument {
  id: string;
  itemId: string;
  tingkat: GradeLevel;
  mapel: SubjectName;
  kunciList: KunciSoalItem[];
  authorUid?: string;
}

export interface GuruSoalDraft {
  id: string;
  type: SoalType;
  pertanyaan: string;
  poin: number;
  opsiA: string;
  opsiB: string;
  opsiC: string;
  opsiD: string;
  kunciPg: 'A' | 'B' | 'C' | 'D';
  kunciIsianRaw: string;
  pasangan: Array<{
    id: string;
    kiriText: string;
    kananText: string;
  }>;
  pedomanEssay: string;
}

export type StudentStructuredAnswerValue = string | Record<string, string>;

export type GradingStatus =
  | 'pending_auto_grade'
  | 'waiting_essay'
  | 'graded';

export interface LearningItem {
  id: string;
  type: LearningItemType;
  judul: string;
  tingkat: GradeLevel;
  /** Jika 'ALL', berlaku untuk seluruh kelas pada tingkat tersebut */
  targetKelas: ClassName | 'ALL';
  mapel: SubjectName;
  deskripsi: string;
  konten: string;
  lampiranNama?: string;
  tenggat?: string;
  durasiMenit?: number;
  hasStructuredSoal?: boolean;
  totalPoin?: number;
  hasEssay?: boolean;
  soalCount?: number;
  createdAt: string;
  authorName: string;
  authorUid?: string;
}

export interface MaterialReadRecord {
  itemId: string;
  studentNis: string;
  uid?: string;
  readAt: string;
}

export type AssignmentSessionStatus = 'in_progress' | 'completed';

export interface AssignmentSubmission {
  itemId: string;
  studentNis: string;
  uid?: string;
  status: 'Selesai' | 'Belum';
  sessionStatus?: AssignmentSessionStatus;
  startedAt?: string;
  startedAtMs?: number;
  durasiMenit?: number;
  violationCount?: number;
  lastSavedAt?: string;
  jawaban?: string;
  structuredAnswers?: Record<string, StudentStructuredAnswerValue>;
  itemScores?: Record<string, number>;
  autoScore?: number;
  essayScore?: number;
  finalScore?: number;
  maxScore?: number;
  gradingStatus?: GradingStatus;
  catatanGuru?: string;
  gradedAt?: string;
  fileNama?: string;
  submittedAt?: string;
  submittedAtMs?: number;
}

export type TahfidzDepositType =
  | 'Baca (Masih Jilid)'
  | 'Setor (Hafalan Al-Quran)';

export type TahfidzDecision = 'Lanjut' | 'Mengulang';

export interface TahfidzRecord {
  id: string;
  studentNis: string;
  studentUid?: string;
  jenisSetoran: TahfidzDepositType;
  capaian: string;
  nilai: string;
  keputusan: TahfidzDecision;
  catatanGuru: string;
  tanggal: string;
  guruNama: string;
  authorUid?: string;
}

export interface JilidPage {
  pageNumber: number;
  imageUrl: string;
  fileName?: string;
}

export interface JilidBook {
  id: string;
  judul: string;
  deskripsi: string;
  pages: JilidPage[];
  createdAt: string;
  authorName: string;
  authorUid?: string;
}

export interface JilidReadProgress {
  bookId: string;
  studentNis: string;
  uid?: string;
  lastPageRead: number;
  totalPages: number;
  updatedAt: string;
}

export interface AuthSession {
  role: UserRole;
  userId: string;
  nis?: string;
  email?: string;
  nama: string;
  kelas?: ClassName;
  tingkat?: GradeLevel;
}

export type DayName =
  | 'Senin'
  | 'Selasa'
  | 'Rabu'
  | 'Kamis'
  | 'Jumat'
  | 'Sabtu'
  | 'Minggu';

export interface JadwalMapelItem {
  id: string;
  hari: DayName;
  jamMulai: string;
  jamSelesai: string;
  mapel: SubjectName;
  tingkat: GradeLevel;
  kelas: ClassName;
  authorUid?: string;
}

export interface ProtaItem {
  id: string;
  mapel: SubjectName;
  tingkat: GradeLevel;
  semester: 'Ganjil' | 'Genap';
  bab: string;
  targetBulan?: string;
  selesai: boolean;
  authorUid?: string;
}

export type NotifikasiRecipientTag =
  | 'guru'
  | 'siswa_X'
  | 'siswa_XI'
  | 'siswa_XII';

export type PengumumanTargetTingkat = 'Semua' | GradeLevel;

export interface PengumumanItem {
  id: string;
  judul: string;
  isi: string;
  targetTingkat: PengumumanTargetTingkat;
  penting: boolean;
  authorName: string;
  authorUid: string;
  createdAt: string;
  createdAtMs: number;
}

export interface NotifikasiItem {
  id: string;
  recipientTag: NotifikasiRecipientTag;
  targetKelas: ClassName | 'ALL';
  type: 'materi' | 'tugas' | 'submission' | 'pengumuman';
  itemId: string;
  mapel: SubjectName | 'Umum';
  judul: string;
  pesan: string;
  studentNis?: string;
  studentName?: string;
  createdAt: string;
  createdAtMs: number;
  senderUid: string;
  isRead: boolean;
}

export interface NotifikasiReadRecord {
  id: string;
  notifId: string;
  uid: string;
  readAt: string;
}

export interface StatistikKelasItem {
  id: string;
  kelas: ClassName;
  tingkat: GradeLevel;
  studentCount: number;
  readDone: number;
  readTotal: number;
  readPct: number;
  taskDone: number;
  taskTotal: number;
  taskPct: number;
  activityPct: number;
  authorUid: string;
}

export interface LmsState {
  students: Student[];
  learningItems: LearningItem[];
  readRecords: MaterialReadRecord[];
  submissions: AssignmentSubmission[];
  tahfidzRecords: TahfidzRecord[];
  jilidBooks: JilidBook[];
  jilidProgress: JilidReadProgress[];
}

