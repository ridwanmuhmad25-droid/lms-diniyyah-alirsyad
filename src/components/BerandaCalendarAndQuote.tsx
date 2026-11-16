import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { getSubjectTheme } from '../lib/themePalette';
import { DayName, LearningItem } from '../types/lms';

export const INDONESIAN_DAYS: DayName[] = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export const SCHEDULE_DAYS: DayName[] = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export function getTodayDayName(): DayName {
  return INDONESIAN_DAYS[new Date().getDay()];
}

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const WEEKDAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeDeadlineDateKey(tenggat?: string): string | null {
  if (!tenggat) return null;
  const trimmed = tenggat.trim();
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  return match ? match[1] : null;
}

interface MiniMonthlyCalendarProps {
  learningItems: LearningItem[];
  onSelectDeadlineItem?: (item: LearningItem) => void;
}

export function MiniMonthlyCalendar({
  learningItems,
  onSelectDeadlineItem,
}: MiniMonthlyCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);

  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, LearningItem[]>();
    learningItems.forEach((item) => {
      if (item.type !== 'tugas') return;
      const key = normalizeDeadlineDateKey(item.tenggat);
      if (!key) return;
      const existing = map.get(key) || [];
      existing.push(item);
      map.set(key, existing);
    });
    return map;
  }, [learningItems]);

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstDayOfMonth.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: Array<{
      day: number | null;
      dateKey: string | null;
    }> = [];

    for (let i = 0; i < startWeekday; i += 1) {
      cells.push({ day: null, dateKey: null });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const m = String(viewMonth + 1).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      cells.push({ day, dateKey: `${viewYear}-${m}-${d}` });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateKey: null });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDateKey(todayKey);
  };

  const selectedDeadlines = deadlinesByDate.get(selectedDateKey) || [];

  return (
    <div className="h-full bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xs hover:-translate-y-0.5 transition-all">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-md shadow-rose-500/25 flex items-center justify-center text-white shrink-0">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {MONTH_NAMES_ID[viewMonth]} {viewYear}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Kalender Tenggat Tugas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={goToday}
              className="min-h-[30px] px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/15 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 transition-colors"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Bulan sebelumnya"
              className="min-h-[30px] min-w-[30px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Bulan berikutnya"
              className="min-h-[30px] min-w-[30px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 7-column calendar grid */}
        <div>
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_SHORT.map((dayName) => (
              <div
                key={dayName}
                className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 py-1"
              >
                {dayName}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              if (!cell.day || !cell.dateKey) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }
              const isToday = cell.dateKey === todayKey;
              const isSelected = cell.dateKey === selectedDateKey;
              const hasDeadline = deadlinesByDate.has(cell.dateKey);

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(cell.dateKey!)}
                  aria-label={`${cell.day} ${MONTH_NAMES_ID[viewMonth]} ${viewYear}${
                    hasDeadline ? ', ada tenggat tugas' : ''
                  }`}
                  className={`h-8 rounded-xl flex flex-col items-center justify-center text-xs font-mono tabular-nums transition-all relative ${
                    isToday
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-sm shadow-indigo-500/30'
                      : isSelected
                      ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cell.day}</span>
                  {hasDeadline && (
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full mt-0.5 ${
                        isToday
                          ? 'bg-amber-300'
                          : 'bg-gradient-to-r from-rose-500 to-orange-500'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected date deadlines summary */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-mono tabular-nums">
            Tanggal dipilih: {selectedDateKey}
          </span>
          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500" />
            <span>Tenggat tugas</span>
          </span>
        </div>

        {selectedDeadlines.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tidak ada tenggat tugas pada tanggal ini.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-24 overflow-y-auto">
            {selectedDeadlines.map((item) => {
              const subTheme = getSubjectTheme(item.mapel);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectDeadlineItem?.(item)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs ${
                    onSelectDeadlineItem
                      ? 'hover:border-rose-400 dark:hover:border-rose-500/50 transition-colors cursor-pointer'
                      : 'cursor-default'
                  }`}
                >
                  <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {item.judul}
                  </span>
                  <span className={`text-[11px] font-semibold shrink-0 ${subTheme.accentText}`}>
                    {item.mapel}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface DailyQuote {
  arabic: string;
  translation: string;
  source: string;
}

const DAILY_QUOTES: DailyQuote[] = [
  {
    arabic: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ',
    translation: 'Menuntut ilmu adalah kewajiban atas setiap muslim.',
    source: 'HR. Ibnu Majah',
  },
  {
    arabic: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ',
    translation:
      'Barang siapa menempuh jalan untuk mencari ilmu, Allah akan memudahkan baginya jalan menuju surga.',
    source: 'HR. Muslim',
  },
  {
    arabic: 'مَنْ جَدَّ وَجَدَ',
    translation: 'Barang siapa bersungguh-sungguh, maka ia akan mendapatkannya.',
    source: 'Mahfudzot',
  },
  {
    arabic: 'مَنْ صَبَرَ ظَفِرَ',
    translation: 'Barang siapa bersabar, maka ia akan beruntung dan berhasil.',
    source: 'Mahfudzot',
  },
  {
    arabic: 'الْعِلْمُ بِلَا عَمَلٍ كَالشَّجَرِ بِلَا ثَمَرٍ',
    translation: 'Ilmu tanpa diamalkan bagaikan pohon yang tidak berbuah.',
    source: 'Mahfudzot',
  },
  {
    arabic: 'لَيْسَ الْيَتِيمُ الَّذِي قَدْ مَاتَ وَالِدُهُ، إِنَّ الْيَتِيمَ يَتِيمُ الْعِلْمِ وَالْأَدَبِ',
    translation:
      'Bukanlah anak yatim itu yang telah tiada orang tuanya, sesungguhnya yatim sejati adalah yatim ilmu dan adab.',
    source: 'Mahfudzot',
  },
  {
    arabic: 'التَّعَلُّمُ فِي الصِّغَرِ كَالنَّقْشِ عَلَى الْحَجَرِ',
    translation:
      'Belajar di waktu muda bagaikan mengukir di atas batu (kuat melekatnya).',
    source: 'Mahfudzot',
  },
  {
    arabic: 'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ',
    translation:
      'Sebaik-baik manusia adalah yang paling bermanfaat bagi sesama manusia.',
    source: 'HR. Ahmad & Thabrani',
  },
  {
    arabic: 'الْوَقْتُ أَثْمَنُ مِنَ الذَّهَبِ',
    translation: 'Waktu itu lebih berharga daripada emas.',
    source: 'Mahfudzot',
  },
  {
    arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    translation:
      'Sebaik-baik kalian adalah orang yang mempelajari Al-Qur’an dan mengajarkannya.',
    source: 'HR. Bukhari',
  },
];

export function DailyMahfudzotCard() {
  const quote = useMemo(() => {
    const now = new Date();
    const localDays = Math.floor(
      (now.getTime() - now.getTimezoneOffset() * 60000) / 86400000
    );
    const index = Math.abs(localDays) % DAILY_QUOTES.length;
    return DAILY_QUOTES[index];
  }, []);

  return (
    <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:-translate-y-0.5 transition-all flex flex-col justify-between">
      {/* Electric Indigo-Purple-Cyan Colored Header Frame */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center text-white shrink-0">
            <Quote className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-white">
              Mahfudzot Harian
            </h3>
            <p className="text-[11px] text-indigo-100">
              Hikmah &amp; Motivasi Menuntut Ilmu
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-white/20 border border-white/25 text-[11px] font-semibold text-white shrink-0">
          {quote.source}
        </span>
      </div>

      {/* Clean High-Contrast Interior Reading Box for Arabic Harakat */}
      <div className="p-5 space-y-3">
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-2.5">
          <p
            dir="rtl"
            lang="ar"
            className="text-right text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-[2.2]"
          >
            {quote.arabic}
          </p>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            “{quote.translation}”
          </p>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Berganti otomatis setiap hari sebagai pengingat adab dan semangat belajar.
        </p>
      </div>
    </div>
  );
}
