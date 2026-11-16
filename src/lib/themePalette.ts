import { SubjectName } from '../types/lms';

export interface SubjectTheme {
  gradientBg: string;
  gradientBar: string;
  shadow: string;
  badgeClasses: string;
  accentText: string;
  iconBoxClasses: string;
  borderAccent: string;
}

const SUBJECT_THEME_MAP: Record<SubjectName, SubjectTheme> = {
  'Bahasa Arab': {
    gradientBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    gradientBar: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400',
    shadow: 'shadow-lg shadow-amber-500/25',
    badgeClasses:
      'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/25',
    accentText: 'text-amber-600 dark:text-amber-400',
    iconBoxClasses:
      'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/25',
    borderAccent: 'border-amber-200/80 dark:border-amber-500/25',
  },
  Aqidah: {
    gradientBg: 'bg-gradient-to-r from-rose-500 to-orange-500',
    gradientBar: 'bg-gradient-to-r from-rose-500 via-orange-500 to-rose-400',
    shadow: 'shadow-lg shadow-rose-500/25',
    badgeClasses:
      'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-sm shadow-rose-500/25',
    accentText: 'text-rose-600 dark:text-rose-400',
    iconBoxClasses:
      'bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-500/25',
    borderAccent: 'border-rose-200/80 dark:border-rose-500/25',
  },
  'Tahfidz/Tahsin': {
    gradientBg: 'bg-gradient-to-r from-teal-500 to-emerald-500',
    gradientBar: 'bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400',
    shadow: 'shadow-lg shadow-teal-500/25',
    badgeClasses:
      'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm shadow-teal-500/25',
    accentText: 'text-teal-600 dark:text-teal-400',
    iconBoxClasses:
      'bg-teal-500/15 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-500/25',
    borderAccent: 'border-teal-200/80 dark:border-teal-500/25',
  },
};

export function getSubjectTheme(subject: SubjectName): SubjectTheme {
  return SUBJECT_THEME_MAP[subject];
}

export const PRIMARY_CTA_CLASS =
  'rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all';

export const ELECTRIC_BANNER_CLASS =
  'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25';

export const TEAL_CTA_CLASS =
  'rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-teal-500/25 active:scale-[0.99] transition-all';

export function getRankBadgeClasses(rank: number): string {
  if (rank === 1) {
    return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-sm shadow-amber-500/25';
  }
  if (rank === 2) {
    return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold shadow-sm shadow-indigo-500/25';
  }
  if (rank === 3) {
    return 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold shadow-sm shadow-teal-500/25';
  }

  const cycle = Math.max(0, rank - 4) % 3;
  if (cycle === 0) {
    return 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50 font-bold';
  }
  if (cycle === 1) {
    return 'bg-cyan-100 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-700/50 font-bold';
  }
  return 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700/50 font-bold';
}
