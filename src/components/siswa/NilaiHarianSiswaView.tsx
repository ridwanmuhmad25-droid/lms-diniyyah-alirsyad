import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Filter,
} from 'lucide-react';
import { getSubjectTheme } from '../../lib/themePalette';
import {
  NilaiHarianSession,
  Student,
  SubjectName,
} from '../../types/lms';

interface NilaiHarianSiswaViewProps {
  student: Student;
  visibleSubjects: SubjectName[];
  nilaiHarianList: NilaiHarianSession[];
}

function formatTanggalIndoFull(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function NilaiHarianSiswaView({
  student,
  visibleSubjects,
  nilaiHarianList,
}: NilaiHarianSiswaViewProps) {
  const [filterMapel, setFilterMapel] = useState<'ALL' | SubjectName>('ALL');
  const [viewMode, setViewMode] = useState<'kronologis' | 'per_mapel'>('kronologis');

  const classSessions = useMemo(() => {
    return nilaiHarianList
      .filter(
        (s) =>
          s.kelas === student.kelas &&
          visibleSubjects.includes(s.mapel)
      )
      .sort((a, b) => {
        const dateCmp = b.tanggal.localeCompare(a.tanggal);
        if (dateCmp !== 0) return dateCmp;
        return (b.createdAtMs || 0) - (a.createdAtMs || 0);
      });
  }, [nilaiHarianList, student.kelas, visibleSubjects]);

  const filteredSessions = useMemo(() => {
    if (filterMapel === 'ALL') return classSessions;
    return classSessions.filter((s) => s.mapel === filterMapel);
  }, [classSessions, filterMapel]);

  const { totalCount, gradedCount, missingCount, averageScore } = useMemo(() => {
    let graded = 0;
    let sum = 0;
    let missing = 0;
    classSessions.forEach((s) => {
      const score = s.nilaiMap?.[student.nis];
      if (typeof score === 'number' && !Number.isNaN(score)) {
        graded += 1;
        sum += score;
      } else {
        missing += 1;
      }
    });
    return {
      totalCount: classSessions.length,
      gradedCount: graded,
      missingCount: missing,
      averageScore: graded > 0 ? Math.round((sum / graded) * 10) / 10 : null,
    };
  }, [classSessions, student.nis]);

  const groupedByMapel = useMemo(() => {
    const subjectsToDisplay =
      filterMapel === 'ALL'
        ? visibleSubjects
        : visibleSubjects.filter((sub) => sub === filterMapel);
    return subjectsToDisplay.map((sub) => ({
      mapel: sub,
      sessions: filteredSessions.filter((s) => s.mapel === sub),
    }));
  }, [filteredSessions, visibleSubjects, filterMapel]);

  const renderSessionRow = (session: NilaiHarianSession) => {
    const score = session.nilaiMap?.[student.nis];
    const hasScore = typeof score === 'number' && !Number.isNaN(score);
    const theme = getSubjectTheme(session.mapel);

    return (
      <div
        key={session.id}
        className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
          hasScore
            ? 'bg-white dark:bg-[#131C31]'
            : 'bg-amber-50/70 dark:bg-rose-950/20'
        }`}
      >
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`px-2.5 py-0.5 rounded-full font-semibold ${theme.iconBoxClasses}`}
            >
              {session.mapel}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-slate-600 dark:text-slate-400 tabular-nums">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{formatTanggalIndoFull(session.tanggal)}</span>
            </span>
          </div>
          <p className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            {session.judul}
          </p>
        </div>

        <div className="shrink-0">
          {hasScore ? (
            <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-emerald-500/12 border border-emerald-300/60 dark:border-emerald-700/60">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Nilai Harian
                </p>
                <p className="font-mono text-lg font-extrabold text-emerald-800 dark:text-emerald-200 tabular-nums leading-tight">
                  {score}
                </p>
              </div>
            </div>
          ) : (
            <div
              role="alert"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 to-rose-500/15 border border-rose-300 dark:border-rose-700/70 text-rose-900 dark:text-amber-200"
            >
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-bold">
                Kosong / Belum Mengerjakan — Segera Susul ke Guru
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header + Stats */}
      <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-indigo-500/25 flex items-center justify-center text-white shrink-0">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Rekap Nilai Harian — {student.kelas}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Pantau seluruh tanggal penilaian harian kelas Anda dan pastikan tidak ada nilai yang tertinggal.
              </p>
            </div>
          </div>

          <div className="inline-grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('kronologis')}
              className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'kronologis'
                  ? 'bg-white dark:bg-[#131C31] text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Urutan Tanggal
            </button>
            <button
              type="button"
              onClick={() => setViewMode('per_mapel')}
              className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'per_mapel'
                  ? 'bg-white dark:bg-[#131C31] text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Per Mapel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200/80 dark:border-slate-800">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Total Sesi Kelas
            </p>
            <p className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {totalCount}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-800/60">
            <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              Sudah Dinilai
            </p>
            <p className="mt-1 font-display text-lg font-bold text-emerald-800 dark:text-emerald-200 tabular-nums">
              {gradedCount}
            </p>
          </div>
          <div
            className={`p-3.5 rounded-xl border ${
              missingCount > 0
                ? 'bg-rose-50/90 dark:bg-rose-950/35 border-rose-300 dark:border-rose-700/70'
                : 'bg-slate-50 dark:bg-[#0B1120] border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <p
              className={`text-[11px] font-medium ${
                missingCount > 0
                  ? 'text-rose-700 dark:text-rose-300'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Kosong / Tertinggal
            </p>
            <p
              className={`mt-1 font-display text-lg font-bold tabular-nums ${
                missingCount > 0
                  ? 'text-rose-700 dark:text-rose-200'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {missingCount}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200/80 dark:border-indigo-800/60">
            <p className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
              Rata-rata Nilai
            </p>
            <p className="mt-1 font-display text-lg font-bold text-indigo-800 dark:text-indigo-200 tabular-nums">
              {averageScore !== null ? averageScore : '-'}
            </p>
          </div>
        </div>

        {/* Alert banner if any missing dates */}
        {missingCount > 0 && (
          <div
            role="alert"
            className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 dark:from-amber-950/50 dark:via-rose-950/45 dark:to-amber-950/50 border-2 border-amber-300 dark:border-rose-600/70 flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-rose-950 dark:text-amber-100 leading-relaxed">
              <span className="font-bold">
                Perhatian: Anda memiliki {missingCount} tanggal penilaian harian yang masih kosong!
              </span>{' '}
              Periksa tanggal bertanda merah/amber di bawah ini dan segera susul penilaian ke guru pengampu.
            </div>
          </div>
        )}

        {/* Filter Mapel */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mr-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter Mapel:</span>
          </span>
          <button
            type="button"
            onClick={() => setFilterMapel('ALL')}
            className={`min-h-[34px] px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              filterMapel === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-[#0B1120] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Semua ({classSessions.length})
          </button>
          {visibleSubjects.map((sub) => {
            const count = classSessions.filter((s) => s.mapel === sub).length;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => setFilterMapel(sub)}
                className={`min-h-[34px] px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  filterMapel === sub
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-[#0B1120] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {sub} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 text-center space-y-1.5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Belum ada sesi Nilai Harian untuk filter ini
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Jika guru telah menginput sesi penilaian harian kelas {student.kelas}, daftar tanggal dan nilai akan muncul otomatis di sini.
          </p>
        </div>
      ) : viewMode === 'kronologis' ? (
        <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-200/80 dark:divide-slate-800">
          {filteredSessions.map(renderSessionRow)}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByMapel.map((group) => (
            <div
              key={group.mapel}
              className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-[#0B1120]/70">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  {group.mapel}
                </h3>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  {group.sessions.length} sesi
                </span>
              </div>
              {group.sessions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Belum ada penilaian harian pada mapel {group.mapel}.
                </div>
              ) : (
                <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {group.sessions.map(renderSessionRow)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
