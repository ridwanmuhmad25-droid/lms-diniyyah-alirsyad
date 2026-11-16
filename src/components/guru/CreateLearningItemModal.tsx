import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Languages,
  Lock,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { GRADE_CLASSES, getSubjectsForGrade } from '../../data/mockData';
import { createEmptySoalDraft, reconstructDraftsFromTugasAndKunci } from '../../lib/tugasGrading';
import { getSubjectTheme, PRIMARY_CTA_CLASS } from '../../lib/themePalette';
import {
  ClassName,
  GradeLevel,
  GuruSoalDraft,
  KunciTugasDocument,
  LearningItem,
  LearningItemType,
  SoalType,
  SubjectName,
  TugasDocument,
} from '../../types/lms';

interface CreateLearningItemModalProps {
  isOpen: boolean;
  lockedSubject: SubjectName | null;
  defaultType?: LearningItemType;
  authorName: string;
  editingItem?: LearningItem | null;
  editingTugas?: TugasDocument | null;
  editingKunci?: KunciTugasDocument | null;
  onClose: () => void;
  onSubmit: (
    item: LearningItem,
    soalDrafts: GuruSoalDraft[],
    isEdit: boolean
  ) => Promise<void>;
}

const SOAL_TYPE_LABELS: Record<SoalType, string> = {
  pilihan_ganda: 'Pilihan Ganda',
  isian_singkat: 'Isian Singkat',
  menjodohkan: 'Menjodohkan',
  essay: 'Essay',
};

export function CreateLearningItemModal({
  isOpen,
  lockedSubject,
  defaultType = 'materi',
  authorName,
  editingItem = null,
  editingTugas = null,
  editingKunci = null,
  onClose,
  onSubmit,
}: CreateLearningItemModalProps) {
  const isEditMode = Boolean(editingItem);

  const [formType, setFormType] = useState<LearningItemType>(defaultType);
  const [formGrade, setFormGrade] = useState<GradeLevel>('X');
  const [formTargetClass, setFormTargetClass] = useState<ClassName | 'ALL'>('ALL');
  const [formSubject, setFormSubject] = useState<SubjectName>('Aqidah');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formDeadline, setFormDeadline] = useState('2026-11-25');
  const [formDurationMinutes, setFormDurationMinutes] = useState('30');
  const [formAttachment, setFormAttachment] = useState('');
  const [soalDrafts, setSoalDrafts] = useState<GuruSoalDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSubmitError('');

    if (editingItem) {
      setFormType(editingItem.type);
      setFormGrade(editingItem.tingkat);
      setFormTargetClass(editingItem.targetKelas);
      setFormSubject(editingItem.mapel);
      setFormTitle(editingItem.judul);
      setFormDesc(editingItem.deskripsi);
      setFormContent(editingItem.konten);
      setFormDeadline(editingItem.tenggat || '2026-11-25');
      setFormDurationMinutes(String(editingItem.durasiMenit || 30));
      setFormAttachment(editingItem.lampiranNama || '');

      if (editingItem.type === 'tugas' && editingTugas) {
        setSoalDrafts(reconstructDraftsFromTugasAndKunci(editingTugas, editingKunci));
      } else {
        setSoalDrafts([]);
      }
      return;
    }

    setFormType(defaultType);
    setFormTargetClass('ALL');
    setFormTitle('');
    setFormDesc('');
    setFormContent('');
    setFormDeadline('2026-11-25');
    setFormDurationMinutes('30');
    setFormAttachment('');

    const resolvedSubject: SubjectName =
      lockedSubject === 'Bahasa Arab'
        ? 'Bahasa Arab'
        : lockedSubject === 'Aqidah'
        ? 'Aqidah'
        : lockedSubject === 'Tahfidz/Tahsin'
        ? 'Tahfidz/Tahsin'
        : 'Aqidah';

    if (lockedSubject === 'Bahasa Arab' || lockedSubject === 'Tahfidz/Tahsin') {
      setFormGrade('XI');
    } else {
      setFormGrade('X');
    }
    setFormSubject(resolvedSubject);

    if (
      defaultType === 'tugas' &&
      (resolvedSubject === 'Bahasa Arab' || resolvedSubject === 'Aqidah')
    ) {
      setSoalDrafts([createEmptySoalDraft('pilihan_ganda', Date.now())]);
    } else {
      setSoalDrafts([]);
    }
  }, [isOpen, lockedSubject, defaultType, editingItem, editingTugas, editingKunci]);

  if (!isOpen) return null;

  const effectiveSubject = lockedSubject || formSubject;
  const subjectTheme = getSubjectTheme(effectiveSubject);
  const supportsStructuredSoal =
    formType === 'tugas' &&
    (effectiveSubject === 'Bahasa Arab' || effectiveSubject === 'Aqidah');

  const allowedGrades: GradeLevel[] =
    lockedSubject === 'Bahasa Arab' || lockedSubject === 'Tahfidz/Tahsin'
      ? ['XI', 'XII']
      : lockedSubject === 'Aqidah'
      ? ['X']
      : ['X', 'XI', 'XII'];

  const availableSubjects: SubjectName[] = lockedSubject
    ? [lockedSubject]
    : getSubjectsForGrade(formGrade);

  const handleGradeChange = (nextGrade: GradeLevel) => {
    setFormGrade(nextGrade);
    setFormTargetClass('ALL');
    if (!lockedSubject) {
      const allowed = getSubjectsForGrade(nextGrade);
      if (!allowed.includes(formSubject)) {
        const nextSub = allowed[0];
        setFormSubject(nextSub);
        if (
          formType === 'tugas' &&
          (nextSub === 'Bahasa Arab' || nextSub === 'Aqidah') &&
          soalDrafts.length === 0
        ) {
          setSoalDrafts([createEmptySoalDraft('pilihan_ganda', Date.now())]);
        }
      }
    }
  };

  const handleTypeSwitch = (nextType: LearningItemType) => {
    setFormType(nextType);
    if (
      nextType === 'tugas' &&
      (effectiveSubject === 'Bahasa Arab' || effectiveSubject === 'Aqidah') &&
      soalDrafts.length === 0
    ) {
      setSoalDrafts([createEmptySoalDraft('pilihan_ganda', Date.now())]);
    }
  };

  const handleAddSoal = (type: SoalType = 'pilihan_ganda') => {
    setSoalDrafts((prev) => [...prev, createEmptySoalDraft(type, Date.now() + prev.length)]);
  };

  const handleUpdateSoal = (soalId: string, updater: (prev: GuruSoalDraft) => GuruSoalDraft) => {
    setSoalDrafts((prev) => prev.map((s) => (s.id === soalId ? updater(s) : s)));
  };

  const handleRemoveSoal = (soalId: string) => {
    setSoalDrafts((prev) => prev.filter((s) => s.id !== soalId));
  };

  const handleMoveSoal = (index: number, direction: -1 | 1) => {
    setSoalDrafts((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(target, 0, moved);
      return copy;
    });
  };

  const handleAddPair = (soalId: string) => {
    handleUpdateSoal(soalId, (s) => ({
      ...s,
      pasangan: [
        ...s.pasangan,
        {
          id: `pair-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          kiriText: '',
          kananText: '',
        },
      ],
    }));
  };

  const handleRemovePair = (soalId: string, pairId: string) => {
    handleUpdateSoal(soalId, (s) => {
      if (s.pasangan.length <= 2) return s;
      return {
        ...s,
        pasangan: s.pasangan.filter((p) => p.id !== pairId),
      };
    });
  };

  const handleInsertRtlBlock = (soalId: string) => {
    handleUpdateSoal(soalId, (s) => {
      const snippet = '<p dir="rtl">اكتب النص العربي هنا</p>';
      const nextText = s.pertanyaan.trim()
        ? `${s.pertanyaan}\n${snippet}`
        : snippet;
      return { ...s, pertanyaan: nextText };
    });
  };

  const totalPoin = soalDrafts.reduce(
    (sum, d) => sum + (Number.isFinite(Number(d.poin)) ? Math.max(0, Math.round(Number(d.poin))) : 0),
    0
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeDrafts = supportsStructuredSoal ? soalDrafts : [];

    if (!formTitle.trim() || !formDesc.trim()) {
      setSubmitError('Judul dan ringkasan singkat wajib diisi.');
      return;
    }

    if (activeDrafts.length === 0 && !formContent.trim()) {
      setSubmitError(
        formType === 'materi'
          ? 'Isi materi bacaan wajib diisi.'
          : 'Instruksi tugas wajib diisi atau tambahkan minimal 1 butir soal.'
      );
      return;
    }

    const parsedDuration = Number(formDurationMinutes);
    if (
      formType === 'tugas' &&
      (!Number.isFinite(parsedDuration) || parsedDuration < 1 || parsedDuration > 600)
    ) {
      setSubmitError('Durasi pengerjaan tugas harus antara 1 sampai 600 menit.');
      return;
    }

    // Validate structured questions if present
    for (let i = 0; i < activeDrafts.length; i++) {
      const soal = activeDrafts[i];
      const no = i + 1;
      if (!soal.pertanyaan.trim()) {
        setSubmitError(`Pertanyaan / instruksi pada Soal #${no} wajib diisi.`);
        return;
      }
      const poinNum = Number(soal.poin);
      if (!Number.isFinite(poinNum) || poinNum < 1 || poinNum > 1000) {
        setSubmitError(`Poin pada Soal #${no} harus berupa angka antara 1 sampai 1000.`);
        return;
      }
      if (soal.type === 'pilihan_ganda') {
        if (
          !soal.opsiA.trim() ||
          !soal.opsiB.trim() ||
          !soal.opsiC.trim() ||
          !soal.opsiD.trim()
        ) {
          setSubmitError(`Pilihan A, B, C, dan D pada Soal #${no} (Pilihan Ganda) wajib diisi semua.`);
          return;
        }
      } else if (soal.type === 'isian_singkat') {
        const keys = soal.kunciIsianRaw
          .split(/[,،]/)
          .map((k) => k.trim())
          .filter(Boolean);
        if (keys.length === 0) {
          setSubmitError(`Kunci jawaban benar pada Soal #${no} (Isian Singkat) wajib diisi.`);
          return;
        }
      } else if (soal.type === 'menjodohkan') {
        if (soal.pasangan.length < 2) {
          setSubmitError(`Soal #${no} (Menjodohkan) minimal memiliki 2 pasangan.`);
          return;
        }
        const hasBlankPair = soal.pasangan.some(
          (p) => !p.kiriText.trim() || !p.kananText.trim()
        );
        if (hasBlankPair) {
          setSubmitError(`Seluruh kolom kiri dan kanan pada Soal #${no} (Menjodohkan) wajib diisi.`);
          return;
        }
      }
    }

    setSubmitError('');
    setIsSubmitting(true);

    const hasStructured = activeDrafts.length > 0;
    const hasEssay = activeDrafts.some((d) => d.type === 'essay');
    const finalContent =
      formContent.trim() ||
      `Kerjakan ${activeDrafts.length} butir soal di bawah ini dengan jujur dan teliti.`;

    const savedItem: LearningItem = {
      id: editingItem ? editingItem.id : `item-${Date.now()}`,
      type: formType,
      judul: formTitle.trim(),
      tingkat: formGrade,
      targetKelas: formTargetClass,
      mapel: effectiveSubject,
      deskripsi: formDesc.trim(),
      konten: finalContent,
      lampiranNama: formAttachment.trim() || undefined,
      tenggat: formType === 'tugas' ? formDeadline : undefined,
      durasiMenit: formType === 'tugas' ? Math.round(parsedDuration) : undefined,
      hasStructuredSoal: formType === 'tugas' ? hasStructured : undefined,
      totalPoin: formType === 'tugas' && hasStructured ? totalPoin : undefined,
      hasEssay: formType === 'tugas' && hasStructured ? hasEssay : undefined,
      soalCount: formType === 'tugas' && hasStructured ? activeDrafts.length : undefined,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString().slice(0, 10),
      authorName: editingItem ? editingItem.authorName : authorName,
      authorUid: editingItem?.authorUid,
    };

    try {
      await onSubmit(savedItem, activeDrafts, isEditMode);
      onClose();
    } catch {
      setSubmitError('Gagal menyimpan materi/tugas ke Firestore. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-learning-item-title"
    >
      <div className="w-full max-w-3xl my-auto bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className={`h-1.5 w-full ${subjectTheme.gradientBar}`} />
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <h3
              id="create-learning-item-title"
              className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
            >
              {isEditMode
                ? `Edit ${formType === 'materi' ? 'Materi' : 'Tugas'} ${effectiveSubject}`
                : lockedSubject
                ? `Tambah Materi / Tugas ${lockedSubject}`
                : 'Buat Materi / Tugas Baru'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {lockedSubject === 'Bahasa Arab'
                ? 'Mata pelajaran dikunci ke Bahasa Arab (khusus tingkat kelas XI & XII).'
                : lockedSubject === 'Aqidah'
                ? 'Mata pelajaran dikunci ke Aqidah (khusus tingkat kelas X).'
                : 'Data tersimpan ke Firestore dan otomatis masuk ke halaman mapel terkait.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-5 max-h-[84vh] overflow-y-auto">
          {/* Jenis Konten */}
          <div>
            <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
              Jenis Konten
            </span>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={isEditMode}
                onClick={() => handleTypeSwitch('materi')}
                className={`min-h-[40px] rounded-xl text-xs font-semibold transition-all disabled:cursor-not-allowed ${
                  formType === 'materi'
                    ? `${subjectTheme.gradientBg} text-white shadow-sm`
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Materi Pembelajaran
              </button>
              <button
                type="button"
                disabled={isEditMode}
                onClick={() => handleTypeSwitch('tugas')}
                className={`min-h-[40px] rounded-xl text-xs font-semibold transition-all disabled:cursor-not-allowed ${
                  formType === 'tugas'
                    ? `${subjectTheme.gradientBg} text-white shadow-sm`
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Penugasan Siswa
              </button>
            </div>
          </div>

          {/* Tingkat Kelas & Mata Pelajaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="modal-upload-grade"
                className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
              >
                Tingkat Kelas
              </label>
              <select
                id="modal-upload-grade"
                value={formGrade}
                disabled={allowedGrades.length === 1}
                onChange={(e) => handleGradeChange(e.target.value as GradeLevel)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 disabled:opacity-75 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              >
                {allowedGrades.map((grade) => (
                  <option key={grade} value={grade}>
                    Kelas {grade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="modal-upload-subject"
                className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
              >
                Mata Pelajaran
              </label>
              {lockedSubject ? (
                <div
                  id="modal-upload-subject"
                  aria-readonly="true"
                  className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-sm font-semibold flex items-center justify-between gap-2 ${subjectTheme.iconBoxClasses}`}
                >
                  <span>{lockedSubject}</span>
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                </div>
              ) : (
                <select
                  id="modal-upload-subject"
                  value={formSubject}
                  onChange={(e) => {
                    const nextSub = e.target.value as SubjectName;
                    setFormSubject(nextSub);
                    if (
                      formType === 'tugas' &&
                      (nextSub === 'Bahasa Arab' || nextSub === 'Aqidah') &&
                      soalDrafts.length === 0
                    ) {
                      setSoalDrafts([createEmptySoalDraft('pilihan_ganda', Date.now())]);
                    }
                  }}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Distribusi Kelas */}
          <div>
            <label
              htmlFor="modal-upload-target-class"
              className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
            >
              Distribusi Kelas
            </label>
            <select
              id="modal-upload-target-class"
              value={formTargetClass}
              onChange={(e) => setFormTargetClass(e.target.value as ClassName | 'ALL')}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              <option value="ALL">
                Semua Kelas {formGrade} ({GRADE_CLASSES[formGrade].join(', ')})
              </option>
              {GRADE_CLASSES[formGrade].map((cls) => (
                <option key={cls} value={cls}>
                  Khusus {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Judul */}
          <div>
            <label
              htmlFor="modal-upload-title"
              className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
            >
              Judul {formType === 'materi' ? 'Materi' : 'Tugas'}
            </label>
            <input
              id="modal-upload-title"
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={
                effectiveSubject === 'Bahasa Arab'
                  ? formType === 'materi'
                    ? 'Contoh: Hiwar Tentang Kegiatan Sehari-hari'
                    : 'Contoh: Evaluasi Mufradat & Qawaid Bab 2'
                  : formType === 'materi'
                  ? 'Contoh: Dalil Tauhid Uluhiyah'
                  : 'Contoh: Ujian Pemahaman Aqidah Islamiyah'
              }
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          {/* Ringkasan Singkat */}
          <div>
            <label
              htmlFor="modal-upload-desc"
              className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
            >
              Ringkasan Singkat
            </label>
            <input
              id="modal-upload-desc"
              type="text"
              required
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Gambaran singkat tujuan belajar / instruksi"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          {/* Konten / Petunjuk Umum */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="modal-upload-content"
                className="block text-xs font-semibold text-slate-900 dark:text-slate-100"
              >
                {formType === 'materi'
                  ? 'Isi Materi Bacaan'
                  : supportsStructuredSoal
                  ? 'Petunjuk Umum / Pengantar Tugas (Opsional jika pakai butir soal)'
                  : 'Instruksi / Soal Tugas Lengkap'}
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Mendukung kode HTML &amp; dir="rtl"
              </span>
            </div>
            <textarea
              id="modal-upload-content"
              rows={formType === 'materi' ? 10 : supportsStructuredSoal ? 4 : 10}
              maxLength={15000}
              required={!supportsStructuredSoal || soalDrafts.length === 0}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder={
                formType === 'materi'
                  ? 'Tuliskan penjelasan materi atau tempel (paste) kode HTML materi (<div>, <table>, <h3>, <ul>, <p dir="rtl">)...'
                  : supportsStructuredSoal
                  ? 'Tuliskan petunjuk pengerjaan umum (misal: Bacalah basmalah sebelum mengerjakan)...'
                  : 'Tuliskan instruksi/soal tugas atau tempel (paste) kode HTML soal...'
              }
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          {/* Durasi, Tenggat & Lampiran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formType === 'tugas' && (
              <>
                <div>
                  <label
                    htmlFor="modal-upload-duration"
                    className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                  >
                    Durasi Pengerjaan (Menit)
                  </label>
                  <input
                    id="modal-upload-duration"
                    type="number"
                    min={1}
                    max={600}
                    required
                    value={formDurationMinutes}
                    onChange={(e) => setFormDurationMinutes(e.target.value)}
                    placeholder="30"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Mengaktifkan Mode Ujian Terkunci &amp; timer hitung mundur.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="modal-upload-deadline"
                    className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                  >
                    Tenggat Waktu
                  </label>
                  <input
                    id="modal-upload-deadline"
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <label
                htmlFor="modal-upload-attachment"
                className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
              >
                Nama Berkas / Tautan Lampiran (Opsional)
              </label>
              <input
                id="modal-upload-attachment"
                type="text"
                value={formAttachment}
                onChange={(e) => setFormAttachment(e.target.value)}
                placeholder="Contoh: Modul_Bab2.pdf"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* PEMBUAT BUTIR SOAL DINAMIS (4 TIPE SOAL SEKALIGUS) */}
          {supportsStructuredSoal && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                    Pembuat Butir Soal Dinamis (4 Tipe Soal)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Gabungkan Pilihan Ganda, Isian Singkat, Menjodohkan, dan Essay dalam satu tugas. Kunci jawaban disimpan terpisah &amp; aman.
                  </p>
                </div>
                <div className={`text-xs font-mono font-semibold tabular-nums shrink-0 px-3 py-1 rounded-full ${subjectTheme.iconBoxClasses}`}>
                  {soalDrafts.length} Soal · Total {totalPoin} Poin
                </div>
              </div>

              {soalDrafts.length === 0 ? (
                <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] text-center space-y-2.5">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Belum ada butir soal terstruktur. Anda bisa menambahkan butir soal atau menggunakan instruksi tugas teks di atas saja.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAddSoal('pilihan_ganda')}
                    className={`min-h-[40px] px-5 py-2 text-xs inline-flex items-center gap-1.5 ${PRIMARY_CTA_CLASS}`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Butir Soal Pertama</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {soalDrafts.map((soal, idx) => (
                    <div
                      key={soal.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0B1120]/70 space-y-3.5"
                    >
                      {/* Soal Header Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                        <span className={`font-display text-xs sm:text-sm font-bold ${subjectTheme.accentText}`}>
                          Soal #{idx + 1} · {SOAL_TYPE_LABELS[soal.type]}
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            aria-label={`Tipe Soal #${idx + 1}`}
                            value={soal.type}
                            onChange={(e) => {
                              const nextType = e.target.value as SoalType;
                              handleUpdateSoal(soal.id, (prev) => ({
                                ...prev,
                                type: nextType,
                                poin:
                                  prev.poin ||
                                  (nextType === 'essay'
                                    ? 25
                                    : nextType === 'menjodohkan'
                                    ? 20
                                    : 10),
                              }));
                            }}
                            className="min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-800/25"
                          >
                            <option value="pilihan_ganda">Pilihan Ganda</option>
                            <option value="isian_singkat">Isian Singkat</option>
                            <option value="menjodohkan">Menjodohkan</option>
                            <option value="essay">Essay</option>
                          </select>

                          <div className="flex items-center gap-1.5">
                            <label
                              htmlFor={`poin-${soal.id}`}
                              className="text-xs font-medium text-slate-600 dark:text-slate-400"
                            >
                              Poin:
                            </label>
                            <input
                              id={`poin-${soal.id}`}
                              type="number"
                              min={1}
                              max={1000}
                              value={soal.poin}
                              onChange={(e) =>
                                handleUpdateSoal(soal.id, (prev) => ({
                                  ...prev,
                                  poin: Number(e.target.value),
                                }))
                              }
                              className="w-20 min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-800/25"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveSoal(idx, -1)}
                              aria-label={`Pindahkan Soal #${idx + 1} ke atas`}
                              className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === soalDrafts.length - 1}
                              onClick={() => handleMoveSoal(idx, 1)}
                              aria-label={`Pindahkan Soal #${idx + 1} ke bawah`}
                              className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSoal(soal.id)}
                              aria-label={`Hapus Soal #${idx + 1}`}
                              className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Question Prompt (HTML & dir="rtl") */}
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <label
                            htmlFor={`pertanyaan-${soal.id}`}
                            className="text-xs font-semibold text-slate-900 dark:text-slate-100"
                          >
                            {soal.type === 'menjodohkan'
                              ? 'Instruksi Soal Menjodohkan (HTML & dir="rtl")'
                              : 'Pertanyaan / Teks Soal (HTML & dir="rtl")'}
                          </label>
                          <button
                            type="button"
                            onClick={() => handleInsertRtlBlock(soal.id)}
                            className="px-2.5 py-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 inline-flex items-center gap-1 transition-colors"
                          >
                            <Languages className="h-3 w-3" />
                            <span>Sisipkan Blok Arab (RTL)</span>
                          </button>
                        </div>
                        <textarea
                          id={`pertanyaan-${soal.id}`}
                          rows={3}
                          dir="auto"
                          value={soal.pertanyaan}
                          onChange={(e) =>
                            handleUpdateSoal(soal.id, (prev) => ({
                              ...prev,
                              pertanyaan: e.target.value,
                            }))
                          }
                          placeholder={
                            soal.type === 'menjodohkan'
                              ? 'Contoh: Jodohkan kosakata bahasa Arab di sebelah kiri dengan arti yang tepat di sebelah kanan.'
                              : 'Tuliskan pertanyaan atau tempel HTML dengan <p dir="rtl">...</p>...'
                          }
                          className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                        />
                      </div>

                      {/* TYPE A: PILIHAN GANDA */}
                      {soal.type === 'pilihan_ganda' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {(
                              [
                                ['A', 'opsiA'],
                                ['B', 'opsiB'],
                                ['C', 'opsiC'],
                                ['D', 'opsiD'],
                              ] as const
                            ).map(([letter, fieldKey]) => (
                              <div key={letter}>
                                <label
                                  htmlFor={`${soal.id}-${fieldKey}`}
                                  className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1"
                                >
                                  Opsi {letter}
                                </label>
                                <input
                                  id={`${soal.id}-${fieldKey}`}
                                  type="text"
                                  dir="auto"
                                  value={soal[fieldKey]}
                                  onChange={(e) =>
                                    handleUpdateSoal(soal.id, (prev) => ({
                                      ...prev,
                                      [fieldKey]: e.target.value,
                                    }))
                                  }
                                  placeholder={`Pilihan ${letter}...`}
                                  className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-800/25"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="max-w-xs">
                            <label
                              htmlFor={`kunci-pg-${soal.id}`}
                              className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1"
                            >
                              Kunci Jawaban Benar
                            </label>
                            <select
                              id={`kunci-pg-${soal.id}`}
                              value={soal.kunciPg}
                              onChange={(e) =>
                                handleUpdateSoal(soal.id, (prev) => ({
                                  ...prev,
                                  kunciPg: e.target.value as 'A' | 'B' | 'C' | 'D',
                                }))
                              }
                              className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/40 text-sm font-semibold text-blue-900 dark:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-800/25"
                            >
                              <option value="A">Opsi A</option>
                              <option value="B">Opsi B</option>
                              <option value="C">Opsi C</option>
                              <option value="D">Opsi D</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* TYPE B: ISIAN SINGKAT */}
                      {soal.type === 'isian_singkat' && (
                        <div>
                          <label
                            htmlFor={`kunci-isian-${soal.id}`}
                            className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1"
                          >
                            Kunci Jawaban Benar (pisahkan beberapa variasi dengan koma)
                          </label>
                          <input
                            id={`kunci-isian-${soal.id}`}
                            type="text"
                            dir="auto"
                            value={soal.kunciIsianRaw}
                            onChange={(e) =>
                              handleUpdateSoal(soal.id, (prev) => ({
                                ...prev,
                                kunciIsianRaw: e.target.value,
                              }))
                            }
                            placeholder="Contoh: مَدْرَسَةٌ, مدرسة, sekolah"
                            className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800/25"
                          />
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Koreksi otomatis menormalisasi harakat/tashkeel Arab, spasi berlebih, serta huruf kapital/kecil.
                          </p>
                        </div>
                      )}

                      {/* TYPE C: MENJODOHKAN */}
                      {soal.type === 'menjodohkan' && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              Daftar Pasangan (Minimal 2 Pasangan · Poin dibagi rata otomatis)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddPair(soal.id)}
                              className="px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-semibold text-blue-800 dark:text-blue-300 inline-flex items-center gap-1 transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Tambah Pasangan</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {soal.pasangan.map((pair, pIdx) => (
                              <div
                                key={pair.id}
                                className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              >
                                <div className="sm:col-span-5">
                                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                                    Kolom Kiri #{pIdx + 1} (Pernyataan)
                                  </label>
                                  <input
                                    type="text"
                                    dir="auto"
                                    value={pair.kiriText}
                                    onChange={(e) =>
                                      handleUpdateSoal(soal.id, (prev) => ({
                                        ...prev,
                                        pasangan: prev.pasangan.map((p) =>
                                          p.id === pair.id
                                            ? { ...p, kiriText: e.target.value }
                                            : p
                                        ),
                                      }))
                                    }
                                    placeholder="Contoh: كِتَابٌ"
                                    className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-800/25"
                                  />
                                </div>

                                <div className="sm:col-span-5">
                                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                                    Kolom Kanan #{pIdx + 1} (Pasangan Benar)
                                  </label>
                                  <input
                                    type="text"
                                    dir="auto"
                                    value={pair.kananText}
                                    onChange={(e) =>
                                      handleUpdateSoal(soal.id, (prev) => ({
                                        ...prev,
                                        pasangan: prev.pasangan.map((p) =>
                                          p.id === pair.id
                                            ? { ...p, kananText: e.target.value }
                                            : p
                                        ),
                                      }))
                                    }
                                    placeholder="Contoh: Buku"
                                    className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-800/25"
                                  />
                                </div>

                                <div className="sm:col-span-1 flex justify-end">
                                  <button
                                    type="button"
                                    disabled={soal.pasangan.length <= 2}
                                    onClick={() => handleRemovePair(soal.id, pair.id)}
                                    aria-label={`Hapus pasangan #${pIdx + 1}`}
                                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 disabled:opacity-35"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TYPE D: ESSAY */}
                      {soal.type === 'essay' && (
                        <div>
                          <label
                            htmlFor={`pedoman-essay-${soal.id}`}
                            className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1"
                          >
                            Pedoman Kunci Jawaban Essay (Khusus Guru, Opsional)
                          </label>
                          <textarea
                            id={`pedoman-essay-${soal.id}`}
                            rows={2}
                            dir="auto"
                            value={soal.pedomanEssay}
                            onChange={(e) =>
                              handleUpdateSoal(soal.id, (prev) => ({
                                ...prev,
                                pedomanEssay: e.target.value,
                              }))
                            }
                            placeholder="Tuliskan poin-poin penilaian / acuan jawaban benar sebagai referensi saat Anda mengoreksi..."
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800/25"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add another question buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAddSoal('pilihan_ganda')}
                      className={`min-h-[42px] px-4 py-2 rounded-2xl border text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors ${subjectTheme.iconBoxClasses}`}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Tambah Butir Soal</span>
                    </button>

                    <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                      Total: {soalDrafts.length} Soal · {totalPoin} Poin
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {submitError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300"
            >
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[42px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`min-h-[42px] px-5 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-60 ${PRIMARY_CTA_CLASS}`}
            >
              {isEditMode ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : isEditMode
                  ? `Simpan Perubahan ${formType === 'materi' ? 'Materi' : 'Tugas'}`
                  : `Publikasikan ${formType === 'materi' ? 'Materi' : 'Tugas'}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
