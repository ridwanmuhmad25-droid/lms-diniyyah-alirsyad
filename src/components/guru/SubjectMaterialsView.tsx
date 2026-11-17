import React, { useMemo, useState } from 'react';
import { BookOpen, ClipboardCheck, FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { GRADE_CLASSES, SUBJECT_META } from '../../data/mockData';
import { getSubjectTheme } from '../../lib/themePalette';
import { GradeLevel, LearningItem, LearningItemType, TugasDocument } from '../../types/lms';
import { MaterialContentRenderer, stripHtmlTags } from '../MaterialContentRenderer';

interface SubjectMaterialsViewProps {
  subject: 'Bahasa Arab' | 'Aqidah';
  allowedGrades: GradeLevel[];
  learningItems: LearningItem[];
  tugasDocs: TugasDocument[];
  onOpenCreateModal: (
    subject: 'Bahasa Arab' | 'Aqidah',
    defaultType: LearningItemType
  ) => void;
  onOpenEditModal: (item: LearningItem) => void;
  onDeleteLearningItem: (itemId: string) => Promise<void>;
  onNotify: (msg: string) => void;
}

export function SubjectMaterialsView({
  subject,
  allowedGrades,
  learningItems,
  tugasDocs,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteLearningItem,
  onNotify,
}: SubjectMaterialsViewProps) {
  const [subTab, setSubTab] = useState<LearningItemType>('materi');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const meta = SUBJECT_META[subject];
  const theme = getSubjectTheme(subject);

  const subjectItems = useMemo(
    () => learningItems.filter((item) => item.mapel === subject),
    [learningItems, subject]
  );

  const materiCount = useMemo(
    () => subjectItems.filter((item) => item.type === 'materi').length,
    [subjectItems]
  );

  const tugasCount = useMemo(
    () => subjectItems.filter((item) => item.type === 'tugas').length,
    [subjectItems]
  );

  const availableClasses = useMemo(() => {
    if (gradeFilter !== 'ALL' && allowedGrades.includes(gradeFilter as GradeLevel)) {
      return GRADE_CLASSES[gradeFilter as GradeLevel];
    }
    return allowedGrades.flatMap((g) => GRADE_CLASSES[g]);
  }, [allowedGrades, gradeFilter]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subjectItems.filter((item) => {
      if (item.type !== subTab) return false;
      if (gradeFilter !== 'ALL' && item.tingkat !== gradeFilter) return false;
      if (
        classFilter !== 'ALL' &&
        item.targetKelas !== 'ALL' &&
        item.targetKelas !== classFilter
      ) {
        return false;
      }
      if (
        q &&
        !item.judul.toLowerCase().includes(q) &&
        !item.deskripsi.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [subjectItems, subTab, gradeFilter, classFilter, searchQuery]);

  const handleDelete = async (item: LearningItem) => {
    try {
      await onDeleteLearningItem(item.id);
      onNotify(`${item.type === 'materi' ? 'Materi' : 'Tugas'} "${item.judul}" telah dihapus dari Firestore.`);
    } catch {
      onNotify(`Gagal menghapus "${item.judul}" dari Firestore.`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Action CTA (Subject-Themed Gradient Accent) */}
      <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className={`h-1.5 w-full ${theme.gradientBar}`} />
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${theme.badgeClasses}`}>
                {subject}
              </span>
              <span aria-hidden="true">·</span>
              <span>{meta.focus}</span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              {meta.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {meta.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenCreateModal(subject, subTab)}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Tambah Materi/Tugas {subject}</span>
          </button>
        </div>
      </div>

      {/* Top 2-Tab Navigation + Filters */}
      <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* 2 Tab Navigasi: Materi & Tugas */}
          <div
            role="tablist"
            aria-label={`Tab konten ${subject}`}
            className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 w-full sm:w-auto sm:min-w-[280px]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'materi'}
              onClick={() => setSubTab('materi')}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
                subTab === 'materi'
                  ? `${theme.gradientBg} text-white ${theme.shadow}`
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>Materi</span>
              <span className="font-mono text-xs tabular-nums opacity-90">
                ({materiCount})
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'tugas'}
              onClick={() => setSubTab('tugas')}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
                subTab === 'tugas'
                  ? `${theme.gradientBg} text-white ${theme.shadow}`
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ClipboardCheck className="h-4 w-4 shrink-0" />
              <span>Tugas</span>
              <span className="font-mono text-xs tabular-nums opacity-90">
                ({tugasCount})
              </span>
            </button>
          </div>

          {/* Search & Grade/Class Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-xl lg:justify-end">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Cari ${subTab} ${subject}...`}
                aria-label={`Cari ${subTab} ${subject}`}
                className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>

            {allowedGrades.length > 1 && (
              <select
                value={gradeFilter}
                onChange={(e) => {
                  setGradeFilter(e.target.value);
                  setClassFilter('ALL');
                }}
                aria-label={`Filter tingkat ${subject}`}
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                <option value="ALL">Semua Tingkat ({allowedGrades.join(' & ')})</option>
                {allowedGrades.map((g) => (
                  <option key={g} value={g}>
                    Kelas {g}
                  </option>
                ))}
              </select>
            )}

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              aria-label={`Filter kelas ${subject}`}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            >
              <option value="ALL">Semua Kelas</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Firestore Items List */}
      <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Daftar {subTab === 'materi' ? 'Materi' : 'Tugas'} {subject}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 tabular-nums">
              Menampilkan {filteredItems.length} {subTab} dari database Firestore
            </p>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Belum ada {subTab === 'materi' ? 'materi' : 'tugas'} {subject} untuk filter ini
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Klik tombol di bawah untuk menambahkan {subTab === 'materi' ? 'materi pembelajaran' : 'penugasan'} baru yang langsung tersimpan ke Firestore.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onOpenCreateModal(subject, subTab)}
                className="min-h-[40px] px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md shadow-amber-500/25 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>
                  Tambah {subTab === 'materi' ? 'Materi' : 'Tugas'} {subject}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredItems.map((item) => {
              const isExpanded = expandedItemId === item.id;
              const matchedTugas =
                item.type === 'tugas'
                  ? tugasDocs.find((t) => t.itemId === item.id)
                  : undefined;
              const soalCount = matchedTugas?.soalList.length ?? item.soalCount ?? 0;
              const totalPoin = matchedTugas?.totalPoin ?? item.totalPoin ?? 0;

              return (
                <div
                  key={item.id}
                  className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className={`font-semibold ${theme.accentText}`}>
                        {item.type === 'materi' ? 'Materi' : 'Tugas'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {item.targetKelas === 'ALL'
                          ? `Semua Kelas ${item.tingkat}`
                          : item.targetKelas}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Dibuat {item.createdAt}
                      </span>
                      {item.tenggat && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-rose-600 dark:text-rose-400 font-semibold">
                            Tenggat {item.tenggat}
                          </span>
                        </>
                      )}
                      {item.type === 'tugas' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-medium">
                            Durasi {item.durasiMenit || 30} menit
                          </span>
                          {soalCount > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                                {soalCount} Soal · {totalPoin} Poin
                              </span>
                            </>
                          )}
                          {item.targetPeserta && item.targetPeserta !== 'Semua' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 text-[11px] font-semibold">
                                Khusus {item.targetPeserta}
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    <h4 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      {item.judul}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {stripHtmlTags(item.deskripsi)}
                    </p>

                    <div className="pt-1 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedItemId(isExpanded ? null : item.id)
                        }
                        className={`text-xs font-semibold hover:underline ${theme.accentText}`}
                      >
                        {isExpanded
                          ? 'Sembunyikan isi lengkap'
                          : 'Lihat isi lengkap'}
                      </button>

                      {item.lampiranNama && (
                        <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <FileText className={`h-3.5 w-3.5 shrink-0 ${theme.accentText}`} />
                          <span>{item.lampiranNama}</span>
                        </span>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-4">
                        <MaterialContentRenderer content={item.konten} />

                        {matchedTugas && matchedTugas.soalList.length > 0 && (
                          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              Pratinjau {matchedTugas.soalList.length} Butir Soal (Total {matchedTugas.totalPoin} Poin)
                            </p>
                            {matchedTugas.soalList.map((soal, sIdx) => (
                              <div
                                key={soal.id}
                                className="p-3.5 rounded-xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 space-y-2"
                              >
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                                  <span className={`font-semibold ${theme.accentText}`}>
                                    Soal #{sIdx + 1} ·{' '}
                                    {soal.type === 'pilihan_ganda'
                                      ? 'Pilihan Ganda'
                                      : soal.type === 'isian_singkat'
                                      ? 'Isian Singkat'
                                      : soal.type === 'menjodohkan'
                                      ? 'Menjodohkan'
                                      : 'Essay'}
                                  </span>
                                  <span>{soal.poin} poin</span>
                                </div>
                                <MaterialContentRenderer content={soal.pertanyaan} />
                                {soal.type === 'pilihan_ganda' && soal.opsi && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
                                    {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                                      <div key={opt} dir="auto" className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
                                        <span className="font-mono font-bold mr-1.5">{opt}.</span>
                                        <span>{soal.opsi?.[opt]}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {soal.type === 'menjodohkan' && soal.kiriList && (
                                  <div className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                                    {soal.kiriList.length} pasangan menjodohkan (pilihan kanan diacak untuk siswa)
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenEditModal(item)}
                      aria-label={`Edit ${item.judul}`}
                      title={`Edit ${item.judul}`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-500/15 hover:border-amber-300 dark:hover:border-amber-500/40 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      aria-label={`Hapus ${item.judul}`}
                      title={`Hapus ${item.judul}`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:border-rose-200 dark:hover:border-rose-500/40 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
