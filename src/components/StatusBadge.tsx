import { BookCheck, CheckCircle2, Clock, RotateCcw } from 'lucide-react';

interface StatusBadgeProps {
  variant:
    | 'selesai'
    | 'belum'
    | 'dibaca'
    | 'belum_dibaca'
    | 'lanjut'
    | 'mengulang';
  size?: 'sm' | 'md';
}

export function StatusBadge({ variant, size = 'sm' }: StatusBadgeProps) {
  const paddingClass =
    size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs';

  if (variant === 'lanjut') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 font-semibold text-white shadow-sm shadow-teal-500/25 whitespace-nowrap shrink-0 ${paddingClass}`}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-white shrink-0" aria-hidden="true" />
        <span>Lanjut</span>
      </span>
    );
  }

  if (variant === 'mengulang') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 font-semibold text-white shadow-sm shadow-rose-500/25 whitespace-nowrap shrink-0 ${paddingClass}`}
      >
        <RotateCcw className="h-3.5 w-3.5 text-white shrink-0" aria-hidden="true" />
        <span>Mengulang</span>
      </span>
    );
  }

  if (variant === 'selesai') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 font-semibold text-white shadow-sm shadow-teal-500/25 whitespace-nowrap shrink-0 ${paddingClass}`}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-white shrink-0" aria-hidden="true" />
        <span>Selesai</span>
      </span>
    );
  }

  if (variant === 'belum') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-50 font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 whitespace-nowrap shrink-0 ${paddingClass}`}
      >
        <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
        <span>Belum</span>
      </span>
    );
  }

  if (variant === 'dibaca') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 font-semibold text-white shadow-sm shadow-teal-500/25 whitespace-nowrap shrink-0 ${paddingClass}`}
      >
        <BookCheck className="h-3.5 w-3.5 text-white shrink-0" aria-hidden="true" />
        <span>Sudah Dibaca</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap shrink-0 ${paddingClass}`}
    >
      <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
      <span>Belum Dibaca</span>
    </span>
  );
}
