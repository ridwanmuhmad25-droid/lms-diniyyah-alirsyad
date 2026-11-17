import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  GraduationCap,
  History,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { ALL_CLASSES, GURU_PROFILE } from '../../data/mockData';
import {
  TAHFIDZ_LEVEL_OPTIONS,
  getLocalDateString,
  getNextTahfidzLevel,
  getStudentTahfidzProfile,
  inferCategoryFromLevel,
} from '../../lib/tahfidzUtils';
import { PRIMARY_CTA_CLASS } from '../../lib/themePalette';
import {
  Student,
  TahfidzRecord,
  UjianTahfidzRecord,
  UjianTahfidzStatus,
} from '../../types/lms';

interface UjianKenaikanJuzViewProps {
  students: Student[];
  tahfidzRecords: TahfidzRecord[];
  ujianTahfidzList: UjianTahfidzRecord[];
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
  onNotify: (msg: string) => void;
}

export function UjianKenaikanJuzView({
  students,
  tahfidzRecords,
  ujianTahfidzList,
  onAddUjianTahfidz,
  onDeleteUjianTahfidz,
  onNotify,
}: UjianKenaikanJuzViewProps) {
  const [subTab, setSubTab] = useState<'peserta' | 'arsip'>('peserta');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [archiveStatusFilter, setArchiveStatusFilter] = useState<string>('ALL');

  // Exam Modal state
  const [examStudent, setExamStudent] = useState<Student | null>(null);
  const [examDate, setExamDate] = useState<string>(() => getLocalDateString());
  const [examPenguji, setExamPenguji] = useState<string>(GURU_PROFILE.nama);
  const [examLevelDiujikan, setExamLevelDiujikan] = useState<string>('Juz 30');
  const [examNilai, setExamNilai] = useState<string>('');
  const [examStatus, setExamStatus] = useState<UjianTahfidzStatus>('Lulus');
  const [examNaikKeLevel, setExamNaikKeLevel] = useState<string>('Juz 29');
  const [examCatatan, setExamCatatan] = useState<string>('');
  const [isSavingExam, setIsSavingExam] = useState(false);

  const enrichedStudents = useMemo(() => {
    return students
      .map((student) => {
        const profile = getStudentTahfidzProfile(student, tahfidzRecords);
        const latestExam = ujianTahfidzList.find(
          (ex) => ex.studentNis === student.nis
        );
        return {
          student,
          profile,
          latestExam,
        };
      })
      .sort((a, b) => a.student.nama.localeCompare(b.student.nama));
  }, [students, tahfidzRecords, ujianTahfidzList]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedStudents.filter(({ student, profile }) => {
      if (classFilter !== 'ALL' && student.kelas !== classFilter) return false;
      if (levelFilter === 'CAT_JILID' && profile.category !== 'Jilid')
        return false;
      if (levelFilter === 'CAT_TAHFIDZ' && profile.category !== 'Tahfidz')
        return false;
      if (
        levelFilter !== 'ALL' &&
        levelFilter !== 'CAT_JILID' &&
        levelFilter !== 'CAT_TAHFIDZ' &&
        profile.level !== levelFilter
      ) {
        return false;
      }
      if (
        q &&
        !student.nama.toLowerCase().includes(q) &&
        !student.nis.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [enrichedStudents, searchQuery, classFilter, levelFilter]);

  const filteredArchive = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ujianTahfidzList.filter((ex) => {
      if (classFilter !== 'ALL' && ex.kelas !== classFilter) return false;
      if (archiveStatusFilter !== 'ALL' && ex.status !== archiveStatusFilter)
        return false;
      if (
        q &&
        !ex.studentName.toLowerCase().includes(q) &&
        !ex.studentNis.toLowerCase().includes(q) &&
        !ex.levelDiujikan.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [ujianTahfidzList, searchQuery, classFilter, archiveStatusFilter]);

  const totalLulus = useMemo(
    () => ujianTahfidzList.filter((e) => e.status === 'Lulus').length,
    [ujianTahfidzList]
  );
  const jilidCount = useMemo(
    () => enrichedStudents.filter((s) => s.profile.category === 'Jilid').length,
    [enrichedStudents]
  );
  const tahfidzCount = enrichedStudents.length - jilidCount;

  const openExamModal = (student: Student) => {
    const profile = getStudentTahfidzProfile(student, tahfidzRecords);
    const currentLvl = profile.level;
    const nextLvl = getNextTahfidzLevel(currentLvl);

    setExamStudent(student);
    setExamDate(getLocalDateString());
    setExamPenguji(GURU_PROFILE.nama);
    setExamLevelDiujikan(currentLvl);
    setExamNilai('');
    setExamStatus('Lulus');
    setExamNaikKeLevel(nextLvl);
    setExamCatatan('');
  };

  const handleExamLevelChange = (nextLevel: string) => {
    setExamLevelDiujikan(nextLevel);
    setExamNaikKeLevel(getNextTahfidzLevel(nextLevel));
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examStudent || !examNilai.trim() || isSavingExam) return;

    setIsSavingExam(true);
    try {
      await onAddUjianTahfidz({
        student: examStudent,
        tanggalUjian: examDate,
        penguji: examPenguji.trim() || GURU_PROFILE.nama,
        levelDiujikan: examLevelDiujikan,
        nilai: examNilai.trim(),
        status: examStatus,
        naikKeLevel: examStatus === 'Lulus' ? examNaikKeLevel : undefined,
        catatan:
          examCatatan.trim() ||
          (examStatus === 'Lulus'
            ? `Lulus ujian ${examLevelDiujikan} dan naik ke ${examNaikKeLevel}.`
            : `Mengulang ujian ${examLevelDiujikan}, perlu penguatan makhraj dan kelancaran.`),
      });

      onNotify(
        examStatus === 'Lulus'
          ? `Ujian ${examStudent.nama} LULUS! Level otomatis dinaikkan ke ${examNaikKeLevel}.`
          : `Hasil ujian ${examStudent.nama} (Mengulang ${examLevelDiujikan}) tersimpan ke arsip.`
      );
      setExamStudent(null);
    } catch {
      onNotify('Gagal menyimpan hasil ujian Tahfidz ke Firestore.');
    } finally {
      setIsSavingExam(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Banner Header */}
      <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/25 flex items-center justify-center text-white shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Ujian Tahfidz &amp; Kenaikan Juz Otomatis (Skala Satu Sekolah)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Mencakup seluruh siswa dari 12 kelas (X, XI, XII). Siswa yang lulus otomatis naik tingkat Jilid/Juz di profilnya.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                Kelompok Jilid
              </p>
              <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {jilidCount}
              </p>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-center">
              <p className="text-[11px] font-medium text-teal-700 dark:text-teal-300">
                Kelompok Tahfidz
              </p>
              <p className="font-display text-lg font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                {tahfidzCount}
              </p>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
              <p className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                Total Lulus
              </p>
              <p className="font-display text-lg font-bold text-indigo-600 dark:text-indigo-300 tabular-nums">
                {totalLulus}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tab & Filter Bar */}
      <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 w-full sm:w-auto sm:min-w-[340px]">
            <button
              type="button"
              onClick={() => setSubTab('peserta')}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                subTab === 'peserta'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Award className="h-4 w-4 shrink-0" />
              <span>Daftar Peserta ({students.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('arsip')}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                subTab === 'arsip'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <History className="h-4 w-4 shrink-0" />
              <span>Arsip Ujian ({ujianTahfidzList.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 lg:max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau NIS..."
                aria-label="Cari peserta ujian tahfidz"
                className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              aria-label="Filter kelas peserta ujian"
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs sm:text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">Semua Kelas (X, XI, XII)</option>
              {ALL_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>

            {subTab === 'peserta' ? (
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                aria-label="Filter level atau kelompok tahfidz"
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs sm:text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">Semua Kelompok &amp; Juz</option>
                <option value="CAT_JILID">Hanya Kelompok Jilid</option>
                <option value="CAT_TAHFIDZ">Hanya Kelompok Tahfidz</option>
                {TAHFIDZ_LEVEL_OPTIONS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={archiveStatusFilter}
                onChange={(e) => setArchiveStatusFilter(e.target.value)}
                aria-label="Filter status kelulusan arsip ujian"
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs sm:text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">Semua Status Ujian</option>
                <option value="Lulus">Lulus</option>
                <option value="Mengulang">Mengulang</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Sub-tab 1: School-wide Participant List */}
      {subTab === 'peserta' && (
        <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {filteredStudents.length === 0 ? (
            <div className="p-10 text-center space-y-1.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Peserta tidak ditemukan
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Ubah kata kunci pencarian, filter kelas, atau level Juz/Jilid.
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
                    <th className="py-3 px-4 font-semibold">Kelompok</th>
                    <th className="py-3 px-4 font-semibold">Level / Juz Aktif</th>
                    <th className="py-3 px-4 font-semibold">Ujian Terakhir</th>
                    <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredStudents.map(({ student, profile, latestExam }) => (
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
                      <td className="py-3 px-4 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {student.kelas}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            profile.category === 'Jilid'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
                          }`}
                        >
                          {profile.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                          {profile.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {latestExam ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                latestExam.status === 'Lulus'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {latestExam.status}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                              {latestExam.levelDiujikan} ({latestExam.nilai})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">
                            Belum pernah ujian
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openExamModal(student)}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm shadow-teal-500/25 transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Input Hasil Ujian</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 2: Archive History */}
      {subTab === 'arsip' && (
        <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {filteredArchive.length === 0 ? (
            <div className="p-10 text-center space-y-1.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Belum ada riwayat ujian Tahfidz tersimpan
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pilih tab Daftar Peserta lalu klik &ldquo;Input Hasil Ujian&rdquo; pada siswa yang diuji.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredArchive.map((ex) => (
                <div
                  key={ex.id}
                  className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {ex.studentName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px]">NIS {ex.studentNis}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {ex.kelas}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{ex.tanggalUjian}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                        Ujian {ex.levelDiujikan}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          ex.status === 'Lulus'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {ex.status}
                      </span>
                      {ex.status === 'Lulus' && ex.naikKeLevel && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                          <Sparkles className="h-3 w-3" />
                          <span>Naik ke {ex.naikKeLevel}</span>
                        </span>
                      )}
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        Nilai: {ex.nilai}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Penguji ({ex.penguji}):
                      </span>{' '}
                      {ex.catatan}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await onDeleteUjianTahfidz(ex.id);
                        onNotify(`Arsip ujian ${ex.studentName} telah dihapus.`);
                      } catch {
                        onNotify('Gagal menghapus arsip ujian.');
                      }
                    }}
                    aria-label={`Hapus arsip ujian ${ex.studentName}`}
                    className="min-h-[38px] min-w-[38px] self-start sm:self-center flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-700 dark:hover:text-rose-400 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Input Hasil Ujian Tahfidz */}
      {examStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exam-modal-title"
        >
          <div className="w-full max-w-lg my-auto bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    id="exam-modal-title"
                    className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                  >
                    Input Hasil Ujian Kenaikan Juz / Jilid
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {examStudent.nama} · {examStudent.kelas} (NIS {examStudent.nis})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExamStudent(null)}
                  aria-label="Tutup modal ujian"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveExam} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="exam-date"
                      className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1"
                    >
                      Tanggal Ujian
                    </label>
                    <input
                      id="exam-date"
                      type="date"
                      required
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="exam-penguji"
                      className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1"
                    >
                      Nama Penguji
                    </label>
                    <input
                      id="exam-penguji"
                      type="text"
                      required
                      value={examPenguji}
                      onChange={(e) => setExamPenguji(e.target.value)}
                      placeholder="Ustadz Penguji"
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="exam-level"
                      className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1"
                    >
                      Level / Juz yang Diujikan
                    </label>
                    <select
                      id="exam-level"
                      value={examLevelDiujikan}
                      onChange={(e) => handleExamLevelChange(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-semibold text-slate-900 dark:text-slate-100"
                    >
                      {TAHFIDZ_LEVEL_OPTIONS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="exam-nilai"
                      className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1"
                    >
                      Nilai Ujian
                    </label>
                    <input
                      id="exam-nilai"
                      type="text"
                      required
                      value={examNilai}
                      onChange={(e) => setExamNilai(e.target.value)}
                      placeholder="Contoh: 92 / Mumtaz"
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                    Status Kelulusan
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['Lulus', 'Mengulang'] as UjianTahfidzStatus[]).map(
                      (statusOpt) => {
                        const checked = examStatus === statusOpt;
                        return (
                          <button
                            key={statusOpt}
                            type="button"
                            onClick={() => {
                              setExamStatus(statusOpt);
                              if (statusOpt === 'Lulus') {
                                setExamNaikKeLevel(
                                  getNextTahfidzLevel(examLevelDiujikan)
                                );
                              }
                            }}
                            className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                              checked
                                ? statusOpt === 'Lulus'
                                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : 'border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300'
                                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {statusOpt === 'Lulus' && checked && (
                              <CheckCircle2 className="h-4 w-4 shrink-0" />
                            )}
                            <span>{statusOpt}</span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {examStatus === 'Lulus' && (
                  <div className="p-3.5 rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/30 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="exam-next-level"
                        className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        <span>Naik ke Level / Juz Otomatis</span>
                      </label>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                        Kategori: {inferCategoryFromLevel(examNaikKeLevel)}
                      </span>
                    </div>
                    <select
                      id="exam-next-level"
                      value={examNaikKeLevel}
                      onChange={(e) => setExamNaikKeLevel(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#0B1120] text-sm font-bold text-emerald-800 dark:text-emerald-300"
                    >
                      {TAHFIDZ_LEVEL_OPTIONS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90">
                      Profil siswa akan otomatis diperbarui dari{' '}
                      <span className="font-bold">{examLevelDiujikan}</span> ke{' '}
                      <span className="font-bold">{examNaikKeLevel}</span> saat hasil ujian disimpan.
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="exam-catatan"
                    className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1"
                  >
                    Catatan Penguji
                  </label>
                  <textarea
                    id="exam-catatan"
                    rows={3}
                    value={examCatatan}
                    onChange={(e) => setExamCatatan(e.target.value)}
                    placeholder="Tuliskan catatan kelancaran, tajwid, atau rekomendasi penguji..."
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setExamStudent(null)}
                    disabled={isSavingExam}
                    className="min-h-[42px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingExam}
                    className={`min-h-[42px] px-5 py-2 text-sm disabled:opacity-60 ${PRIMARY_CTA_CLASS}`}
                  >
                    {isSavingExam ? 'Menyimpan...' : 'Simpan Hasil Ujian'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
