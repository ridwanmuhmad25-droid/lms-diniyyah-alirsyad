import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  BookOpenCheck,
  Check,
  Search,
  Users,
} from 'lucide-react';
import {
  DEFAULT_TAHFIDZ_TAUGHT_CLASSES,
  getGradeFromClass,
  isItemForStudent,
} from '../../data/mockData';
import { getStudentTahfidzProfile, isJilidOfflineTask } from '../../lib/tahfidzUtils';
import {
  AssignmentSubmission,
  ClassName,
  JilidLetterGrade,
  LearningItem,
  Student,
  TahfidzCategory,
  TahfidzRecord,
} from '../../types/lms';

export interface SaveJilidChecklistPayload {
  item: LearningItem;
  student: Student;
  checked: boolean;
  nilaiHuruf?: JilidLetterGrade;
  catatanGuru?: string;
}

interface JilidTaskChecklistPanelProps {
  selectedClass: ClassName;
  onChangeClass?: (nextClass: ClassName) => void;
  availableClasses?: ClassName[];
  tahfidzTaughtClasses?: ClassName[];
  learningItems: LearningItem[];
  initialItemId?: string | null;
  students: Student[];
  tahfidzRecords: TahfidzRecord[];
  submissions: AssignmentSubmission[];
  onSaveChecklist: (payload: SaveJilidChecklistPayload) => Promise<void>;
  onQuickToggleCategory?: (
    student: Student,
    nextCategory: TahfidzCategory,
    nextLevel: string
  ) => Promise<void>;
  onNotify: (msg: string) => void;
}

const GRADE_OPTIONS: JilidLetterGrade[] = ['A', 'B', 'C'];

function getGradeButtonClasses(grade: JilidLetterGrade, active: boolean): string {
  if (!active) {
    return 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
  }
  if (grade === 'A') {
    return 'border-emerald-600 bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm shadow-emerald-500/25';
  }
  if (grade === 'B') {
    return 'border-blue-600 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm shadow-indigo-500/25';
  }
  return 'border-amber-600 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/25';
}

export function JilidTaskChecklistPanel({
  selectedClass,
  onChangeClass,
  availableClasses,
  tahfidzTaughtClasses = DEFAULT_TAHFIDZ_TAUGHT_CLASSES,
  learningItems,
  initialItemId = null,
  students,
  tahfidzRecords,
  submissions,
  onSaveChecklist,
  onQuickToggleCategory,
  onNotify,
}: JilidTaskChecklistPanelProps) {
  const classSelectorOptions = useMemo(() => {
    const raw = availableClasses || tahfidzTaughtClasses;
    return raw.filter((cls) => tahfidzTaughtClasses.includes(cls));
  }, [availableClasses, tahfidzTaughtClasses]);

  const effectiveClass = useMemo(() => {
    if (classSelectorOptions.includes(selectedClass)) return selectedClass;
    return classSelectorOptions[0] || selectedClass;
  }, [classSelectorOptions, selectedClass]);

  const grade = getGradeFromClass(effectiveClass);

  const classTasks = useMemo(() => {
    return learningItems.filter(
      (item) =>
        item.mapel === 'Tahfidz/Tahsin' &&
        item.type === 'tugas' &&
        item.tingkat === grade &&
        (item.targetKelas === 'ALL' || item.targetKelas === effectiveClass)
    );
  }, [learningItems, grade, effectiveClass]);

  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    initialItemId || classTasks[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [savingNisMap, setSavingNisMap] = useState<Record<string, boolean>>({});
  const [togglingCategoryMap, setTogglingCategoryMap] = useState<
    Record<string, boolean>
  >({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialItemId && classTasks.some((t) => t.id === initialItemId)) {
      setSelectedTaskId(initialItemId);
      return;
    }
    if (!classTasks.some((t) => t.id === selectedTaskId)) {
      setSelectedTaskId(classTasks[0]?.id || '');
    }
  }, [initialItemId, classTasks, selectedTaskId]);

  const activeTask = useMemo(
    () => classTasks.find((t) => t.id === selectedTaskId) || classTasks[0] || null,
    [classTasks, selectedTaskId]
  );

  const activeIsJilidTask = activeTask ? isJilidOfflineTask(activeTask) : true;

  // Students in effectiveClass matching the activeTask target (default: Jilid students if no activeTask or Jilid task)
  const targetStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students
      .filter((st) => {
        if (st.kelas !== effectiveClass) return false;
        const prof = getStudentTahfidzProfile(st, tahfidzRecords);
        if (activeTask) {
          if (
            !isItemForStudent(
              activeTask,
              st,
              tahfidzRecords,
              tahfidzTaughtClasses
            )
          ) {
            return false;
          }
        } else if (prof.category !== 'Jilid') {
          return false;
        }
        if (
          q &&
          !st.nama.toLowerCase().includes(q) &&
          !st.nis.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [
    students,
    effectiveClass,
    tahfidzRecords,
    activeTask,
    tahfidzTaughtClasses,
    searchQuery,
  ]);

  const totalJilidInClass = useMemo(() => {
    return students.filter((st) => {
      if (st.kelas !== effectiveClass) return false;
      const prof = getStudentTahfidzProfile(st, tahfidzRecords);
      return prof.category === 'Jilid';
    }).length;
  }, [students, effectiveClass, tahfidzRecords]);

  const checkedCount = useMemo(() => {
    if (!activeTask) return 0;
    return targetStudents.filter((st) =>
      submissions.some(
        (sub) =>
          sub.itemId === activeTask.id &&
          sub.studentNis === st.nis &&
          sub.status === 'Selesai'
      )
    ).length;
  }, [activeTask, targetStudents, submissions]);

  const handleToggleAndGrade = async (
    student: Student,
    checked: boolean,
    nilaiHuruf?: JilidLetterGrade,
    overrideCatatan?: string
  ) => {
    if (!activeTask) return;
    setSavingNisMap((prev) => ({ ...prev, [student.nis]: true }));
    const existingSub = submissions.find(
      (s) => s.itemId === activeTask.id && s.studentNis === student.nis
    );
    const noteToUse =
      overrideCatatan !== undefined
        ? overrideCatatan
        : noteDrafts[student.nis] !== undefined
        ? noteDrafts[student.nis]
        : existingSub?.catatanGuru;

    try {
      await onSaveChecklist({
        item: activeTask,
        student,
        checked,
        nilaiHuruf: checked ? nilaiHuruf : undefined,
        catatanGuru: checked ? noteToUse?.trim() || undefined : undefined,
      });
      if (!checked) {
        onNotify(`Ceklis pengumpulan ${student.nama} dibatalkan.`);
      } else if (nilaiHuruf) {
        onNotify(
          `${student.nama} ditandai Sudah Mengumpulkan dengan Nilai ${nilaiHuruf}.`
        );
      } else {
        onNotify(`${student.nama} ditandai Sudah Mengumpulkan.`);
      }
    } catch {
      onNotify(`Gagal menyimpan ceklis untuk ${student.nama} ke Firestore.`);
    } finally {
      setSavingNisMap((prev) => ({ ...prev, [student.nis]: false }));
    }
  };

  const handleQuickToggle = async (
    student: Student,
    currentCategory: TahfidzCategory
  ) => {
    if (!onQuickToggleCategory) return;
    const nextCategory: TahfidzCategory =
      currentCategory === 'Jilid' ? 'Tahfidz' : 'Jilid';
    const nextLevel = nextCategory === 'Tahfidz' ? 'Juz 30' : 'Jilid';

    setTogglingCategoryMap((prev) => ({ ...prev, [student.nis]: true }));
    try {
      await onQuickToggleCategory(student, nextCategory, nextLevel);
      onNotify(
        `Status ${student.nama} diubah menjadi ${nextCategory} (${nextLevel}).`
      );
    } catch {
      onNotify(`Gagal mengubah kategori ${student.nama}.`);
    } finally {
      setTogglingCategoryMap((prev) => ({ ...prev, [student.nis]: false }));
    }
  };

  if (grade === 'X' && classTasks.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="jilid-checklist-panel-title"
      className="bg-white dark:bg-[#131C31] border border-teal-200/90 dark:border-teal-800/70 rounded-2xl overflow-hidden shadow-sm"
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-amber-500" />
      <div className="p-4 sm:p-5 space-y-4">
        {/* Header & Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md shadow-teal-500/25 flex items-center justify-center text-white shrink-0">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="jilid-checklist-panel-title"
                className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Ceklis &amp; Nilai Siswa ({effectiveClass})
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Centang &ldquo;Sudah Mengumpulkan&rdquo; lalu klik nilai huruf A, B, atau C tepat di sebelahnya. Siswa lama tanpa label otomatis tampil sebagai Jilid.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/15 text-teal-800 dark:text-teal-300 text-xs font-bold tabular-nums">
              <Users className="h-3.5 w-3.5" />
              <span>{totalJilidInClass} Siswa Jilid</span>
            </span>
            {activeTask && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-bold tabular-nums">
                <Check className="h-3.5 w-3.5" />
                <span>
                  {checkedCount}/{targetStudents.length} Sudah Mengumpulkan
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Pilih Kelas, Pilih Tugas & Cari Siswa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {onChangeClass && (
            <div>
              <label
                htmlFor="jilid-checklist-class"
                className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
              >
                Pilih Kelas
              </label>
              <select
                id="jilid-checklist-class"
                value={effectiveClass}
                onChange={(e) => onChangeClass(e.target.value as ClassName)}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              >
                {classSelectorOptions.length === 0 ? (
                  <option value={effectiveClass}>Tidak ada kelas ampu</option>
                ) : (
                  classSelectorOptions.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div className={onChangeClass ? '' : 'sm:col-span-2'}>
            <label
              htmlFor="jilid-checklist-task"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
            >
              Pilih Tugas Tahfidz/Tahsin
            </label>
            <select
              id="jilid-checklist-task"
              value={activeTask?.id || ''}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              disabled={classTasks.length === 0}
              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm font-semibold text-slate-900 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            >
              {classTasks.length === 0 ? (
                <option value="">Belum ada tugas Tahfidz/Tahsin untuk {effectiveClass}</option>
              ) : (
                classTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.judul} ({task.targetPeserta || 'Semua'} · {task.targetKelas === 'ALL' ? `Semua ${task.tingkat}` : task.targetKelas})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="jilid-checklist-search"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
            >
              Cari Siswa
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                id="jilid-checklist-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama atau NIS..."
                className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Checklist Content */}
        {!activeTask ? (
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Belum ada tugas <span className="font-semibold">Tahfidz/Tahsin</span> untuk kelas {effectiveClass}.
          </div>
        ) : targetStudents.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Tidak ada siswa {activeIsJilidTask ? 'kategori Jilid ' : ''}yang cocok di kelas {effectiveClass}.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Nama Siswa &amp; Kategori</th>
                    <th className="py-3 px-4 font-semibold">Ceklis Pengumpulan &amp; Nilai (A / B / C)</th>
                    <th className="py-3 px-4 font-semibold">Catatan Singkat (Opsional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {targetStudents.map((student) => {
                    const prof = getStudentTahfidzProfile(student, tahfidzRecords);
                    const sub = submissions.find(
                      (s) => s.itemId === activeTask.id && s.studentNis === student.nis
                    );
                    const isChecked = sub?.status === 'Selesai';
                    const activeGrade = sub?.nilaiHuruf;
                    const isSaving = Boolean(savingNisMap[student.nis]);
                    const isToggling = Boolean(togglingCategoryMap[student.nis]);
                    const noteVal =
                      noteDrafts[student.nis] !== undefined
                        ? noteDrafts[student.nis]
                        : sub?.catatanGuru || '';

                    return (
                      <tr
                        key={student.nis}
                        className={`transition-colors ${
                          isChecked
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/15'
                            : 'bg-white dark:bg-[#131C31] hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {student.nama}
                            </p>
                            {onQuickToggleCategory && (
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => handleQuickToggle(student, prof.category)}
                                title={`Klik untuk ubah status dari ${prof.category} menjadi ${prof.category === 'Jilid' ? 'Tahfidz' : 'Jilid'}`}
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 border transition-colors disabled:opacity-60 ${
                                  prof.category === 'Jilid'
                                    ? 'border-amber-300 dark:border-amber-700/70 bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-teal-500/15 hover:text-teal-800 dark:hover:text-teal-300 hover:border-teal-400'
                                    : 'border-teal-300 dark:border-teal-700/70 bg-teal-500/15 text-teal-800 dark:text-teal-300 hover:bg-amber-500/15 hover:text-amber-800 dark:hover:text-amber-300 hover:border-amber-400'
                                }`}
                              >
                                <ArrowLeftRight className="h-3 w-3" />
                                <span>
                                  {isToggling
                                    ? 'Menyimpan...'
                                    : prof.category === 'Jilid'
                                    ? 'Ubah ke Tahfidz'
                                    : 'Ubah ke Jilid'}
                                </span>
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            NIS {student.nis} · {prof.category} ({prof.level})
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <label
                              className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 cursor-pointer select-none transition-all ${
                                isSaving ? 'opacity-60 pointer-events-none' : ''
                              } ${
                                isChecked
                                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isSaving}
                                onChange={(e) =>
                                  handleToggleAndGrade(
                                    student,
                                    e.target.checked,
                                    e.target.checked ? activeGrade : undefined
                                  )
                                }
                                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                              />
                              <span>Sudah Mengumpulkan</span>
                            </label>

                            <div
                              className="inline-flex items-center gap-1.5"
                              role="group"
                              aria-label={`Nilai huruf ${student.nama}`}
                            >
                              {GRADE_OPTIONS.map((g) => {
                                const isSelected = isChecked && activeGrade === g;
                                return (
                                  <button
                                    key={g}
                                    type="button"
                                    disabled={isSaving}
                                    aria-pressed={isSelected}
                                    onClick={() => handleToggleAndGrade(student, true, g)}
                                    className={`min-h-[36px] min-w-[38px] px-3 py-1 rounded-full border text-xs font-bold transition-all disabled:opacity-60 ${getGradeButtonClasses(
                                      g,
                                      isSelected
                                    )}`}
                                  >
                                    {g}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              maxLength={200}
                              value={noteVal}
                              onChange={(e) =>
                                setNoteDrafts((prev) => ({
                                  ...prev,
                                  [student.nis]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  void handleToggleAndGrade(
                                    student,
                                    true,
                                    activeGrade,
                                    noteVal
                                  );
                                }
                              }}
                              placeholder="Catatan tulisan/kerapian..."
                              aria-label={`Catatan untuk ${student.nama}`}
                              className="w-full min-w-[140px] min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                            />
                            {noteDrafts[student.nis] !== undefined &&
                              noteDrafts[student.nis] !== (sub?.catatanGuru || '') && (
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() =>
                                    handleToggleAndGrade(
                                      student,
                                      true,
                                      activeGrade,
                                      noteVal
                                    )
                                  }
                                  className="min-h-[36px] px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shrink-0"
                                >
                                  Simpan
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

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {targetStudents.map((student) => {
                const prof = getStudentTahfidzProfile(student, tahfidzRecords);
                const sub = submissions.find(
                  (s) => s.itemId === activeTask.id && s.studentNis === student.nis
                );
                const isChecked = sub?.status === 'Selesai';
                const activeGrade = sub?.nilaiHuruf;
                const isSaving = Boolean(savingNisMap[student.nis]);
                const isToggling = Boolean(togglingCategoryMap[student.nis]);
                const noteVal =
                  noteDrafts[student.nis] !== undefined
                    ? noteDrafts[student.nis]
                    : sub?.catatanGuru || '';

                return (
                  <div
                    key={student.nis}
                    className={`p-3.5 rounded-xl border space-y-3 ${
                      isChecked
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/70'
                        : 'bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {student.nama}
                          </p>
                          {onQuickToggleCategory && (
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleQuickToggle(student, prof.category)}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 border disabled:opacity-60 ${
                                prof.category === 'Jilid'
                                  ? 'border-amber-300 dark:border-amber-700/70 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                                  : 'border-teal-300 dark:border-teal-700/70 bg-teal-500/15 text-teal-800 dark:text-teal-300'
                              }`}
                            >
                              <ArrowLeftRight className="h-3 w-3" />
                              <span>
                                {isToggling
                                  ? 'Menyimpan...'
                                  : prof.category === 'Jilid'
                                  ? 'Ubah ke Tahfidz'
                                  : 'Ubah ke Jilid'}
                              </span>
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          NIS {student.nis} · {prof.category} ({prof.level})
                        </p>
                      </div>
                      {isChecked && activeGrade && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${getGradeButtonClasses(
                            activeGrade,
                            true
                          )}`}
                        >
                          Nilai {activeGrade}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 cursor-pointer select-none transition-all ${
                          isSaving ? 'opacity-60 pointer-events-none' : ''
                        } ${
                          isChecked
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isSaving}
                          onChange={(e) =>
                            handleToggleAndGrade(
                              student,
                              e.target.checked,
                              e.target.checked ? activeGrade : undefined
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                        />
                        <span>Sudah Mengumpulkan</span>
                      </label>

                      <div className="inline-flex items-center gap-1.5">
                        {GRADE_OPTIONS.map((g) => {
                          const isSelected = isChecked && activeGrade === g;
                          return (
                            <button
                              key={g}
                              type="button"
                              disabled={isSaving}
                              aria-pressed={isSelected}
                              onClick={() => handleToggleAndGrade(student, true, g)}
                              className={`min-h-[38px] min-w-[40px] px-3 py-1 rounded-full border text-xs font-bold transition-all disabled:opacity-60 ${getGradeButtonClasses(
                                g,
                                isSelected
                              )}`}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        maxLength={200}
                        value={noteVal}
                        onChange={(e) =>
                          setNoteDrafts((prev) => ({
                            ...prev,
                            [student.nis]: e.target.value,
                          }))
                        }
                        placeholder="Catatan singkat guru (opsional)..."
                        className="flex-1 min-h-[38px] px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                      />
                      {noteDrafts[student.nis] !== undefined &&
                        noteDrafts[student.nis] !== (sub?.catatanGuru || '') && (
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() =>
                              handleToggleAndGrade(
                                student,
                                true,
                                activeGrade,
                                noteVal
                              )
                            }
                            className="min-h-[38px] px-3 py-1 rounded-lg bg-teal-600 text-white text-xs font-semibold shrink-0"
                          >
                            Simpan
                          </button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
