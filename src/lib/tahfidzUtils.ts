import {
  LearningItem,
  Student,
  TahfidzCategory,
  TahfidzRecord,
} from '../types/lms';

export const JILID_LEVEL_OPTIONS: string[] = [
  'Jilid',
  'Jilid 1',
  'Jilid 2',
  'Jilid 3',
  'Jilid 4',
  'Jilid 5',
  'Jilid 6',
];

export const JUZ_LEVEL_OPTIONS: string[] = [
  ...Array.from({ length: 30 }, (_, idx) => `Juz ${30 - idx}`),
  'Khatam 30 Juz',
];

export const TAHFIDZ_LEVEL_OPTIONS: string[] = [
  ...JILID_LEVEL_OPTIONS,
  ...JUZ_LEVEL_OPTIONS,
];

export function getLocalDateString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

export function inferCategoryFromLevel(level?: string | null): TahfidzCategory {
  const clean = (level || '').trim().toLowerCase();
  if (clean.includes('jilid')) return 'Jilid';
  return 'Tahfidz';
}

export function getNextTahfidzLevel(currentLevel?: string | null): string {
  const clean = (currentLevel || '').trim();
  if (!clean) return 'Juz 29';

  if (clean.toLowerCase() === 'jilid') {
    return 'Juz 30';
  }

  const jilidMatch = /^jilid\s*(\d+)$/i.exec(clean);
  if (jilidMatch) {
    const num = Number(jilidMatch[1]);
    if (num >= 1 && num < 6) {
      return `Jilid ${num + 1}`;
    }
    return 'Juz 30';
  }

  const juzMatch = /^juz\s*(\d+)$/i.exec(clean);
  if (juzMatch) {
    const juz = Number(juzMatch[1]);
    if (juz > 1 && juz <= 30) {
      return `Juz ${juz - 1}`;
    }
    if (juz === 1) {
      return 'Khatam 30 Juz';
    }
  }

  if (clean.toLowerCase().includes('khatam')) {
    return 'Khatam 30 Juz';
  }

  return 'Juz 30';
}

export function getStudentTahfidzProfile(
  student: Student,
  tahfidzRecords: TahfidzRecord[] = []
): { category: TahfidzCategory; level: string } {
  const explicitLevel = student.tahfidzLevel?.trim();
  const explicitCategory = student.tahfidzCategory;

  if (explicitCategory && explicitLevel) {
    return { category: explicitCategory, level: explicitLevel };
  }

  if (explicitLevel) {
    return {
      category: explicitCategory || inferCategoryFromLevel(explicitLevel),
      level: explicitLevel,
    };
  }

  if (explicitCategory) {
    return {
      category: explicitCategory,
      level: explicitCategory === 'Jilid' ? 'Jilid' : 'Juz 30',
    };
  }

  // Fallback inference for legacy student docs without explicit category/level in Firestore:
  // Default to 'Jilid' so legacy students immediately appear in the Jilid checklist until switched to 'Tahfidz'.
  const studentRecs = tahfidzRecords
    .filter((r) => r.studentNis === student.nis)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const latest = studentRecs[0];
  if (latest && latest.jenisSetoran === 'Baca (Masih Jilid)') {
    const matchJilid = /jilid\s*(\d+)/i.exec(latest.capaian);
    return {
      category: 'Jilid',
      level: matchJilid ? `Jilid ${matchJilid[1]}` : 'Jilid',
    };
  }

  return {
    category: 'Jilid',
    level: 'Jilid',
  };
}

export function isJilidOfflineTask(
  item: Pick<LearningItem, 'mapel' | 'type' | 'targetPeserta' | 'submissionMode'>
): boolean {
  return (
    item.submissionMode === 'offline_jilid' ||
    (item.mapel === 'Tahfidz/Tahsin' &&
      item.type === 'tugas' &&
      item.targetPeserta === 'Jilid')
  );
}
