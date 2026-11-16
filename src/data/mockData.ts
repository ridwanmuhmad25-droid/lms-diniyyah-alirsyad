import {
  ClassName,
  GradeLevel,
  LearningItem,
  Student,
  SubjectName,
  Teacher,
} from '../types/lms';

export const DEFAULT_STUDENT_PASSWORD = 'diniyyah123';

export const GRADE_CLASSES: Record<GradeLevel, ClassName[]> = {
  X: ['X RPL', 'X TKJ', 'X AK', 'X TP 1', 'X TP 2'],
  XI: ['XI RPL', 'XI TKJ', 'XI AK', 'XI TP 1', 'XI TP 2'],
  XII: ['XII RPL', 'XII TKJ'],
};

export const ALL_CLASSES: ClassName[] = [
  ...GRADE_CLASSES.X,
  ...GRADE_CLASSES.XI,
  ...GRADE_CLASSES.XII,
];

export const ALL_GRADES: GradeLevel[] = ['X', 'XI', 'XII'];

export const SUBJECT_META: Record<
  SubjectName,
  {
    title: SubjectName;
    subtitle: string;
    focus: string;
  }
> = {
  Aqidah: {
    title: 'Aqidah',
    subtitle: 'Tauhid, Rukun Iman & Manhaj Ahlussunnah',
    focus: 'Khusus Tingkat Kelas X',
  },
  'Tahfidz/Tahsin': {
    title: 'Tahfidz/Tahsin',
    subtitle: 'Setoran Hafalan Juz 29–30, Makharijul Huruf & Tajwid',
    focus: 'Tingkat Kelas XI & XII',
  },
  'Bahasa Arab': {
    title: 'Bahasa Arab',
    subtitle: 'Qiraah, Muhadatsah & Qawaid Nahwu Sharaf Dasar',
    focus: 'Tingkat Kelas XI & XII',
  },
};

/**
 * Rigid Business Logic:
 * - Kelas X -> Hanya Aqidah
 * - Kelas XI -> Hanya Tahfidz/Tahsin dan Bahasa Arab
 * - Kelas XII -> Hanya Tahfidz/Tahsin dan Bahasa Arab
 */
export function getSubjectsForGrade(grade: GradeLevel): SubjectName[] {
  if (grade === 'X') {
    return ['Aqidah'];
  }
  return ['Tahfidz/Tahsin', 'Bahasa Arab'];
}

export function getGradeFromClass(kelas: ClassName): GradeLevel {
  if (kelas.startsWith('XII ')) return 'XII';
  if (kelas.startsWith('XI ')) return 'XI';
  return 'X';
}

export function getSubjectsForClass(kelas: ClassName): SubjectName[] {
  return getSubjectsForGrade(getGradeFromClass(kelas));
}

export function isValidClassName(value: string): value is ClassName {
  return (ALL_CLASSES as string[]).includes(value.trim());
}

export const GURU_ADMIN_EMAIL = 'ridwanmuhmad25@gmail.com';

export const GURU_PROFILE: Teacher = {
  id: 'guru-admin',
  email: GURU_ADMIN_EMAIL,
  nama: 'Muhammad Ridwan',
  jabatan: 'Guru & Admin Mapel Diniyyah',
};

export function isAuthorizedGuruEmail(email?: string | null): boolean {
  return (email || '').trim().toLowerCase() === GURU_ADMIN_EMAIL;
}

export function toStudentAuthEmail(nis: string): string {
  const sanitized = nis.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return `siswa.${sanitized}@diniyyah.app`;
}

export function isItemForStudent(item: LearningItem, student: Student): boolean {
  const allowedSubjects = getSubjectsForClass(student.kelas);
  if (!allowedSubjects.includes(item.mapel)) return false;
  if (item.tingkat !== student.tingkat) return false;
  if (item.targetKelas !== 'ALL' && item.targetKelas !== student.kelas) return false;
  return true;
}
