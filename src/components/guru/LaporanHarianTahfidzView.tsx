import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Settings2,
  Users,
  XCircle,
} from 'lucide-react';
import { DEFAULT_TAHFIDZ_TAUGHT_CLASSES } from '../../data/mockData';
import {
  getLocalDateString,
  getStudentTahfidzProfile,
} from '../../lib/tahfidzUtils';
import { ClassName, Student, TahfidzRecord } from '../../types/lms';
import { StatusBadge } from '../StatusBadge';

interface LaporanHarianTahfidzViewProps {
  students: Student[];
  tahfidzRecords: TahfidzRecord[];
  tahfidzClasses?: ClassName[];
  onOpenManageClasses?: () => void;
}

export function LaporanHarianTahfidzView({
  students,
  tahfidzRecords,
  tahfidzClasses = DEFAULT_TAHFIDZ_TAUGHT_CLASSES,
  onOpenManageClasses,
}: LaporanHarianTahfidzViewProps) {
  const [selectedClass, setSelectedClass] = useState<ClassName>(
    tahfidzClasses[0] || DEFAULT_TAHFIDZ_TAUGHT_CLASSES[0]
  );
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getLocalDateString()
  );
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'SUDAH' | 'BELUM'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (tahfidzClasses.length > 0 && !tahfidzClasses.includes(selectedClass)) {
      setSelectedClass(tahfidzClasses[0]);
    }
  }, [tahfidzClasses, selectedClass]);

  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.kelas === selectedClass)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [students, selectedClass]);

  const dailyRows = useMemo(() => {
    return classStudents.map((student) => {
      const recordsForDate = tahfidzRecords.filter(
        (rec) =>
          rec.studentNis === student.nis &&
          rec.tanggal.startsWith(selectedDate)
      );
      const profile = getStudentTahfidzProfile(student, tahfidzRecords);
      return {
        student,
        profile,
        hasDeposited: recordsForDate.length > 0,
        recordsForDate,
      };
    });
  }, [classStudents, tahfidzRecords, selectedDate]);

  const depositedCount = useMemo(
    () => dailyRows.filter((r) => r.hasDeposited).length,
    [dailyRows]
  );
  const notDepositedCount = dailyRows.length - depositedCount;
  const depositedPct =
    dailyRows.length > 0
      ? Math.round((depositedCount / dailyRows.length) * 100)
      : 0;

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dailyRows.filter((row) => {
      if (statusFilter === 'SUDAH' && !row.hasDeposited) return false;
      if (statusFilter === 'BELUM' && row.hasDeposited) return false;
      if (
        q &&
        !row.student.nama.toLowerCase().includes(q) &&
        !row.student.nis.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [dailyRows, statusFilter, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Filter Header */}
      <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Laporan Harian Setoran Tahfidz/Tahsin per Kelas
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Pantau daftar siswa yang sudah setor dan belum setor pada tanggal terpilih secara otomatis.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {onOpenManageClasses && (
              <button
                type="button"
                onClick={onOpenManageClasses}
                className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
              >
                <Settings2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Atur Kelas Ampu Tahfidz</span>
              </button>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-mono font-semibold tabular-nums">
              <Calendar className="h-3.5 w-3.5" />
              <span>{selectedDate}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label
              htmlFor="daily-tahfidz-class"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
            >
              Pilih Kelas
            </label>
            <select
              id="daily-tahfidz-class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as ClassName)}
              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            >
              {tahfidzClasses.length === 0 ? (
                <option value={selectedClass}>Belum ada kelas ampu Tahfidz</option>
              ) : (
                tahfidzClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls} ({students.filter((s) => s.kelas === cls).length} siswa)
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="daily-tahfidz-date"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
            >
              Pilih Tanggal
            </label>
            <input
              id="daily-tahfidz-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
          </div>

          <div>
            <label
              htmlFor="daily-tahfidz-status"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
            >
              Filter Status
            </label>
            <select
              id="daily-tahfidz-status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'ALL' | 'SUDAH' | 'BELUM')
              }
              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            >
              <option value="ALL">Semua Siswa ({dailyRows.length})</option>
              <option value="SUDAH">Sudah Setor ({depositedCount})</option>
              <option value="BELUM">Belum Setor ({notDepositedCount})</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="daily-tahfidz-search"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
            >
              Cari Siswa
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                id="daily-tahfidz-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nama atau NIS..."
                className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-indigo-600 to-cyan-500" />
          <div className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Total Siswa {selectedClass}
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                {dailyRows.length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-emerald-500" />
          <div className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Sudah Setor ({depositedPct}%)
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {depositedCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-orange-500" />
          <div className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Belum Setor
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {notDepositedCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredRows.length === 0 ? (
          <div className="p-10 text-center space-y-1.5">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Tidak ada data siswa untuk filter ini
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Pastikan kelas {selectedClass} memiliki siswa terdaftar atau ubah filter status/pencarian.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">NIS</th>
                  <th className="py-3 px-4 font-semibold">Nama Siswa</th>
                  <th className="py-3 px-4 font-semibold">Kelompok / Level</th>
                  <th className="py-3 px-4 font-semibold">Status Harian</th>
                  <th className="py-3 px-4 font-semibold">Catatan Surah / Ayat / Jilid</th>
                  <th className="py-3 px-4 font-semibold">Nilai & Keputusan</th>
                  <th className="py-3 px-4 font-semibold text-right">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRows.map(({ student, profile, hasDeposited, recordsForDate }) => {
                  const latestRec = recordsForDate[0];
                  const timePart = latestRec?.tanggal.split(' ')[1] || '';
                  return (
                    <tr
                      key={student.nis}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {student.nis}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {student.nama}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            profile.category === 'Jilid'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
                          }`}
                        >
                          {profile.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasDeposited ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            <span>Sudah Setor</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-xs font-semibold text-rose-700 dark:text-rose-300">
                            <XCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>Belum Setor</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300">
                        {hasDeposited ? (
                          <div className="space-y-1 max-w-xs">
                            {recordsForDate.map((rec) => (
                              <div key={rec.id}>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                  {rec.capaian}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {rec.jenisSetoran}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">
                            Belum ada setoran hari ini
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {latestRec ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                              {latestRec.nilai}
                            </span>
                            <StatusBadge
                              variant={
                                latestRec.keputusan === 'Lanjut'
                                  ? 'lanjut'
                                  : 'mengulang'
                              }
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            -
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {timePart ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{timePart}</span>
                          </span>
                        ) : (
                          '-'
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
    </div>
  );
}
