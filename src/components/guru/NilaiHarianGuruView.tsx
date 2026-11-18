import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  DEFAULT_TAHFIDZ_TAUGHT_CLASSES,
  GRADE_CLASSES,
  getGradeFromClass,
} from '../../data/mockData';
import { getSubjectTheme, PRIMARY_CTA_CLASS } from '../../lib/themePalette';
import {
  ClassName,
  NilaiHarianSession,
  Student,
  SubjectName,
} from '../../types/lms';

interface NilaiHarianGuruViewProps {
  students: Student[];
  nilaiHarianList: NilaiHarianSession[];
  tahfidzClasses?: ClassName[];
  onSaveNilaiHarian: (payload: {
    id?: string;
    mapel: SubjectName;
    kelas: ClassName;
    tanggal: string;
    judul: string;
    nilaiMap: Record<string, number>;
    createdAtMs?: number;
  }) => Promise<string>;
  onDeleteNilaiHarian: (sessionId: string) => Promise<void>;
  onNotify: (msg: string) => void;
}

const ALL_SUBJECT_OPTIONS: SubjectName[] = [
  'Aqidah',
  'Bahasa Arab',
  'Tahfidz/Tahsin',
];

function getTodayDateInputValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTanggalIndo(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function NilaiHarianGuruView({
  students,
  nilaiHarianList,
  tahfidzClasses = DEFAULT_TAHFIDZ_TAUGHT_CLASSES,
  onSaveNilaiHarian,
  onDeleteNilaiHarian,
  onNotify,
}: NilaiHarianGuruViewProps) {
  const getAllowedClassesForMapel = (mapel: SubjectName): ClassName[] => {
    if (mapel === 'Aqidah') {
      return [...GRADE_CLASSES.X];
    }
    if (mapel === 'Bahasa Arab') {
      return [...GRADE_CLASSES.XI, ...GRADE_CLASSES.XII];
    }
    // Tahfidz/Tahsin: kecualikan XI TKJ & XI AK (sesuai kelas ampu guru)
    const allowedTahfidz = tahfidzClasses.filter(
      (cls) => cls !== 'XI TKJ' && cls !== 'XI AK'
    );
    return allowedTahfidz.length > 0
      ? allowedTahfidz
      : DEFAULT_TAHFIDZ_TAUGHT_CLASSES.filter(
          (cls) => cls !== 'XI TKJ' && cls !== 'XI AK'
        );
  };

  // Form state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingCreatedAtMs, setEditingCreatedAtMs] = useState<number | undefined>(
    undefined
  );
  const [selectedMapel, setSelectedMapel] = useState<SubjectName>('Bahasa Arab');
  const [selectedKelas, setSelectedKelas] = useState<ClassName>('XI RPL');
  const [selectedTanggal, setSelectedTanggal] = useState<string>(
    () => getTodayDateInputValue()
  );
  const [judulPenilaian, setJudulPenilaian] = useState<string>('');
  const [nilaiDrafts, setNilaiDrafts] = useState<Record<string, string>>({});
  const [studentSearch, setStudentSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // History filter state
  const [historyFilterMapel, setHistoryFilterMapel] = useState<'ALL' | SubjectName>('ALL');
  const [historyFilterKelas, setHistoryFilterKelas] = useState<string>('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const classOptionsForSelectedMapel = useMemo(() => {
    const base = getAllowedClassesForMapel(selectedMapel);
    if (editingSessionId && !base.includes(selectedKelas)) {
      return [...base, selectedKelas];
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMapel, tahfidzClasses, editingSessionId, selectedKelas]);

  const activeKelas: ClassName = classOptionsForSelectedMapel.includes(selectedKelas)
    ? selectedKelas
    : classOptionsForSelectedMapel[0] || 'XI RPL';

  const handleMapelChange = (nextMapel: SubjectName) => {
    setSelectedMapel(nextMapel);
    setFormError('');
    const allowed = getAllowedClassesForMapel(nextMapel);
    if (!allowed.includes(selectedKelas)) {
      setSelectedKelas(allowed[0] || 'X RPL');
      if (!editingSessionId) {
        setNilaiDrafts({});
      }
    }
  };

  const handleKelasChange = (nextKelas: ClassName) => {
    setSelectedKelas(nextKelas);
    setFormError('');
    if (!editingSessionId) {
      setNilaiDrafts({});
    }
  };

  const handleResetToNewSession = () => {
    setEditingSessionId(null);
    setEditingCreatedAtMs(undefined);
    setSelectedTanggal(getTodayDateInputValue());
    setJudulPenilaian('');
    setNilaiDrafts({});
    setFormError('');
  };

  const handleLoadSessionForEdit = (session: NilaiHarianSession) => {
    setEditingSessionId(session.id);
    setEditingCreatedAtMs(session.createdAtMs);
    setSelectedMapel(session.mapel);
    setSelectedKelas(session.kelas);
    setSelectedTanggal(session.tanggal);
    setJudulPenilaian(session.judul);
    const nextDrafts: Record<string, string> = {};
    Object.entries(session.nilaiMap || {}).forEach(([nis, score]) => {
      if (typeof score === 'number' && !Number.isNaN(score)) {
        nextDrafts[nis] = String(score);
      }
    });
    setNilaiDrafts(nextDrafts);
    setFormError('');
  };

  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.kelas === activeKelas)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [students, activeKelas]);

  const filteredClassStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return classStudents;
    return classStudents.filter(
      (s) => s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q)
    );
  }, [classStudents, studentSearch]);

  const { filledCount, emptyCount } = useMemo(() => {
    let filled = 0;
    let empty = 0;
    classStudents.forEach((st) => {
      const raw = (nilaiDrafts[st.nis] ?? '').trim();
      if (raw !== '') {
        filled += 1;
      } else {
        empty += 1;
      }
    });
    return { filledCount: filled, emptyCount: empty };
  }, [classStudents, nilaiDrafts]);

  const handleScoreInputChange = (nis: string, val: string) => {
    if (val === '') {
      setNilaiDrafts((prev) => {
        const next = { ...prev };
        delete next[nis];
        return next;
      });
      return;
    }
    const parsed = Number(val);
    if (Number.isNaN(parsed)) return;
    if (parsed < 0) {
      setNilaiDrafts((prev) => ({ ...prev, [nis]: '0' }));
      return;
    }
    if (parsed > 100) {
      setNilaiDrafts((prev) => ({ ...prev, [nis]: '100' }));
      return;
    }
    setNilaiDrafts((prev) => ({ ...prev, [nis]: val }));
  };

  const handleSubmitNilaiHarian = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanJudul = judulPenilaian.trim();
    if (!selectedTanggal || !/^\d{4}-\d{2}-\d{2}$/.test(selectedTanggal)) {
      setFormError('Pilih tanggal penilaian yang valid.');
      return;
    }
    if (!cleanJudul) {
      setFormError('Judul/keterangan penilaian wajib diisi (contoh: Latihan Bab 1).');
      return;
    }

    const cleanNilaiMap: Record<string, number> = {};
    for (const st of classStudents) {
      const raw = (nilaiDrafts[st.nis] ?? '').trim();
      if (raw === '') continue;
      const num = Number(raw);
      if (Number.isNaN(num) || num < 0 || num > 100) {
        setFormError(
          `Nilai untuk ${st.nama} (${st.nis}) harus berupa angka antara 0 sampai 100.`
        );
        return;
      }
      cleanNilaiMap[st.nis] = Math.round(num * 100) / 100;
    }

    setIsSaving(true);
    try {
      const savedId = await onSaveNilaiHarian({
        id: editingSessionId || undefined,
        mapel: selectedMapel,
        kelas: activeKelas,
        tanggal: selectedTanggal,
        judul: cleanJudul,
        nilaiMap: cleanNilaiMap,
        createdAtMs: editingCreatedAtMs,
      });
      setEditingSessionId(savedId);
      onNotify(
        `Nilai Harian "${cleanJudul}" (${selectedMapel} · ${activeKelas} · ${selectedTanggal}) berhasil disimpan (${Object.keys(cleanNilaiMap).length}/${classStudents.length} siswa dinilai).`
      );
    } catch {
      setFormError('Gagal menyimpan sesi Nilai Harian ke Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSavedSessions = useMemo(() => {
    return [...nilaiHarianList]
      .filter((s) => {
        if (
          s.mapel === 'Tahfidz/Tahsin' &&
          (s.kelas === 'XI TKJ' || s.kelas === 'XI AK') &&
          !tahfidzClasses.includes(s.kelas)
        ) {
          return false;
        }
        if (historyFilterMapel !== 'ALL' && s.mapel !== historyFilterMapel) {
          return false;
        }
        if (historyFilterKelas !== 'ALL' && s.kelas !== historyFilterKelas) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateCmp = b.tanggal.localeCompare(a.tanggal);
        if (dateCmp !== 0) return dateCmp;
        return (b.createdAtMs || 0) - (a.createdAtMs || 0);
      });
  }, [nilaiHarianList, tahfidzClasses, historyFilterMapel, historyFilterKelas]);

  const allSessionClassFilterOptions = useMemo(() => {
    const set = new Set<ClassName>();
    nilaiHarianList.forEach((s) => {
      if (
        s.mapel === 'Tahfidz/Tahsin' &&
        (s.kelas === 'XI TKJ' || s.kelas === 'XI AK') &&
        !tahfidzClasses.includes(s.kelas)
      ) {
        return;
      }
      set.add(s.kelas);
    });
    return Array.from(set);
  }, [nilaiHarianList, tahfidzClasses]);

  const mapelTheme = getSubjectTheme(selectedMapel);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-indigo-500/25 flex items-center justify-center text-white shrink-0">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Nilai Harian Bertanggal Manual &amp; Input Susulan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Buat sesi penilaian harian dengan tanggal bebas, isi nilai cepat (0–100), biarkan kosong bagi siswa yang belum masuk/mengerjakan, dan pilih kembali sesi lama untuk mengisi nilai susulan.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleResetToNewSession}
          className={`min-h-[40px] px-4 py-2 text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 shrink-0 ${PRIMARY_CTA_CLASS}`}
        >
          <Plus className="h-4 w-4" />
          <span>Buat Sesi Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left/Main: Form Sesi + Tabel Input Cepat */}
        <form
          onSubmit={handleSubmitNilaiHarian}
          className="xl:col-span-8 bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className={`h-1.5 w-full ${mapelTheme.gradientBar}`} />
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    editingSessionId
                      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60'
                      : 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-300/60 dark:border-indigo-700/60'
                  }`}
                >
                  {editingSessionId
                    ? 'Mode Edit / Input Nilai Susulan'
                    : 'Mode Buat Sesi Nilai Harian Baru'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Tingkat {getGradeFromClass(activeKelas)}
                </span>
              </div>
              {editingSessionId && (
                <button
                  type="button"
                  onClick={handleResetToNewSession}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Batalkan Edit &amp; Buat Baru
                </button>
              )}
            </div>

            {/* 4 Input Konfigurasi Sesi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1) Pilih Mapel */}
              <div>
                <label
                  htmlFor="nh-mapel"
                  className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                >
                  1. Pilih Mapel
                </label>
                <select
                  id="nh-mapel"
                  value={selectedMapel}
                  onChange={(e) => handleMapelChange(e.target.value as SubjectName)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                >
                  {ALL_SUBJECT_OPTIONS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2) Pilih Kelas */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label
                    htmlFor="nh-kelas"
                    className="block text-xs font-semibold text-slate-900 dark:text-slate-100"
                  >
                    2. Pilih Kelas
                  </label>
                  {selectedMapel === 'Tahfidz/Tahsin' && (
                    <span className="text-[11px] font-medium text-teal-700 dark:text-teal-300">
                      XI TKJ &amp; XI AK dikecualikan
                    </span>
                  )}
                </div>
                <select
                  id="nh-kelas"
                  value={activeKelas}
                  onChange={(e) => handleKelasChange(e.target.value as ClassName)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                >
                  {classOptionsForSelectedMapel.map((cls) => {
                    const count = students.filter((s) => s.kelas === cls).length;
                    return (
                      <option key={cls} value={cls}>
                        {cls} ({count} siswa)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 3) Pilih Tanggal Penilaian */}
              <div>
                <label
                  htmlFor="nh-tanggal"
                  className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                >
                  3. Pilih Tanggal Penilaian
                </label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    id="nh-tanggal"
                    type="date"
                    required
                    value={selectedTanggal}
                    onChange={(e) => setSelectedTanggal(e.target.value)}
                    className="w-full min-h-[44px] pl-10 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 4) Judul/Keterangan Penilaian */}
              <div>
                <label
                  htmlFor="nh-judul"
                  className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                >
                  4. Judul / Keterangan Penilaian
                </label>
                <input
                  id="nh-judul"
                  type="text"
                  required
                  maxLength={150}
                  value={judulPenilaian}
                  onChange={(e) => setJudulPenilaian(e.target.value)}
                  placeholder='Contoh: Latihan Bab 1, Ulangan Harian'
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs sm:text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Quick Stats + Search bar */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                  <Users className="h-3.5 w-3.5" />
                  <span>{classStudents.length} Siswa</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{filledCount} Terisi</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{emptyCount} Kosong</span>
                </span>
              </div>

              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="search"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Cari nama atau NIS siswa..."
                  className="w-full min-h-[38px] pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Tabel Input Cepat Siswa */}
            {classStudents.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Belum ada siswa terdaftar di kelas {activeKelas}. Tambahkan siswa pada menu Manajemen Siswa terlebih dahulu.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold w-12">No</th>
                      <th className="py-2.5 px-3 font-semibold">NIS</th>
                      <th className="py-2.5 px-3 font-semibold">Nama Siswa</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-40">
                        Nilai (0–100)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {filteredClassStudents.map((st, idx) => {
                      const rawVal = nilaiDrafts[st.nis] ?? '';
                      const isFilled = rawVal.trim() !== '';
                      return (
                        <tr
                          key={st.nis}
                          className={
                            isFilled
                              ? 'bg-white dark:bg-[#131C31]'
                              : 'bg-amber-50/40 dark:bg-amber-950/15'
                          }
                        >
                          <td className="py-2.5 px-3 text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                            {st.nis}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                            {st.nama}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {isFilled ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Terisi</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                                <AlertCircle className="h-3 w-3" />
                                <span>Kosong</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step="any"
                                inputMode="decimal"
                                aria-label={`Nilai harian ${st.nama}`}
                                value={rawVal}
                                onChange={(e) =>
                                  handleScoreInputChange(st.nis, e.target.value)
                                }
                                placeholder="Kosong"
                                className={`w-24 min-h-[38px] px-2.5 py-1 rounded-xl border text-sm font-mono font-bold text-center tabular-nums focus:outline-none focus:ring-2 ${
                                  isFilled
                                    ? 'border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 focus:ring-emerald-500/30'
                                    : 'border-amber-300 dark:border-amber-700/70 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 placeholder:text-amber-600/70 dark:placeholder:text-amber-400/60 focus:ring-amber-500/30'
                                }`}
                              />
                              {isFilled && (
                                <button
                                  type="button"
                                  onClick={() => handleScoreInputChange(st.nis, '')}
                                  title="Kosongkan nilai siswa ini"
                                  aria-label={`Kosongkan nilai ${st.nama}`}
                                  className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Siswa dengan kolom nilai kosong otomatis menerima peringatan susulan di akun siswanya.
              </p>
              <button
                type="submit"
                disabled={isSaving || classStudents.length === 0}
                className={`min-h-[44px] px-6 py-2.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60 ${PRIMARY_CTA_CLASS}`}
              >
                <Save className="h-4 w-4" />
                <span>
                  {isSaving
                    ? 'Menyimpan...'
                    : editingSessionId
                    ? 'Simpan Perubahan Sesi'
                    : 'Simpan Nilai Harian'}
                </span>
              </button>
            </div>
          </div>
        </form>

        {/* Right: Daftar Sesi Tersimpan untuk Edit / Susulan */}
        <div className="xl:col-span-4 bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Sesi Penilaian Tersimpan
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Pilih sesi untuk mengedit atau mengisi nilai siswa yang menyusul.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={historyFilterMapel}
                onChange={(e) =>
                  setHistoryFilterMapel(e.target.value as 'ALL' | SubjectName)
                }
                aria-label="Filter mapel sesi tersimpan"
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">Semua Mapel</option>
                {ALL_SUBJECT_OPTIONS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>

              <select
                value={historyFilterKelas}
                onChange={(e) => setHistoryFilterKelas(e.target.value)}
                aria-label="Filter kelas sesi tersimpan"
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">Semua Kelas</option>
                {allSessionClassFilterOptions.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredSavedSessions.length === 0 ? (
            <div className="p-8 text-center space-y-1.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Belum ada sesi Nilai Harian
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gunakan formulir di samping untuk membuat dan menyimpan sesi penilaian pertama.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/80 dark:divide-slate-800 max-h-[640px] overflow-y-auto">
              {filteredSavedSessions.map((session) => {
                const isEditingThis = editingSessionId === session.id;
                const totalInClass = students.filter(
                  (st) => st.kelas === session.kelas
                ).length;
                const gradedInSession = students.filter(
                  (st) =>
                    st.kelas === session.kelas &&
                    typeof session.nilaiMap?.[st.nis] === 'number'
                ).length;
                const missingInSession = Math.max(0, totalInClass - gradedInSession);
                const subTheme = getSubjectTheme(session.mapel);

                return (
                  <div
                    key={session.id}
                    className={`p-4 space-y-2.5 transition-colors ${
                      isEditingThis
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className={`font-bold ${subTheme.accentText}`}>
                            {session.mapel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {session.kelas}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                            {formatTanggalIndo(session.tanggal)}
                          </span>
                        </div>
                        <p className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {session.judul}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold tabular-nums">
                          {gradedInSession}/{totalInClass} dinilai
                        </span>
                        {missingInSession > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold tabular-nums">
                            {missingInSession} kosong
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleLoadSessionForEdit(session)}
                          className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                            isEditingThis
                              ? 'bg-indigo-600 text-white'
                              : 'border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/35 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                          }`}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>{isEditingThis ? 'Sedang Diedit' : 'Edit / Susulan'}</span>
                        </button>

                        {confirmDeleteId === session.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                await onDeleteNilaiHarian(session.id);
                                if (editingSessionId === session.id) {
                                  handleResetToNewSession();
                                }
                                setConfirmDeleteId(null);
                                onNotify(`Sesi "${session.judul}" berhasil dihapus.`);
                              }}
                              className="min-h-[34px] px-2.5 py-1 rounded-xl bg-rose-600 text-white text-[11px] font-semibold"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="min-h-[34px] px-2 py-1 rounded-xl border border-slate-300 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(session.id)}
                            aria-label={`Hapus sesi ${session.judul}`}
                            className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
