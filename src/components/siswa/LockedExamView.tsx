import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Lock,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { buildReadableSummaryFromStructuredAnswers } from '../../lib/tugasGrading';
import { getSubjectTheme, PRIMARY_CTA_CLASS } from '../../lib/themePalette';
import {
  AssignmentSubmission,
  LearningItem,
  SoalType,
  Student,
  StudentStructuredAnswerValue,
  TugasDocument,
  TugasSoalItem,
} from '../../types/lms';
import { MaterialContentRenderer } from '../MaterialContentRenderer';

interface LockedExamViewProps {
  student: Student;
  item: LearningItem;
  submission: AssignmentSubmission;
  tugasDoc?: TugasDocument;
  onAutoSave: (
    itemId: string,
    jawaban: string,
    fileNama?: string,
    structuredAnswers?: Record<string, StudentStructuredAnswerValue>
  ) => Promise<void>;
  onRecordViolation: (itemId: string) => Promise<void>;
  onSubmitExam: (
    itemId: string,
    jawaban: string,
    fileNama: string | undefined,
    isAutoSubmit: boolean,
    structuredAnswers?: Record<string, StudentStructuredAnswerValue>
  ) => Promise<void>;
}

const SOAL_TYPE_LABELS: Record<SoalType, string> = {
  pilihan_ganda: 'Pilihan Ganda',
  isian_singkat: 'Isian Singkat',
  menjodohkan: 'Menjodohkan',
  essay: 'Essay',
};

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

function isSoalAnswered(
  soal: TugasSoalItem,
  val: StudentStructuredAnswerValue | undefined
): boolean {
  if (!val) return false;
  if (soal.type === 'menjodohkan') {
    if (typeof val !== 'object') return false;
    const kiriList = soal.kiriList || [];
    return kiriList.length > 0 && kiriList.every((k) => Boolean(val[k.id]));
  }
  return typeof val === 'string' && val.trim().length > 0;
}

export function LockedExamView({
  student,
  item,
  submission,
  tugasDoc,
  onAutoSave,
  onRecordViolation,
  onSubmitExam,
}: LockedExamViewProps) {
  const isStructured = Boolean(tugasDoc && tugasDoc.soalList.length > 0);
  const durationMinutes =
    submission.durasiMenit ?? tugasDoc?.durasiMenit ?? item.durasiMenit ?? 30;
  const startedAtMs = submission.startedAtMs ?? Date.now();
  const deadlineMs = useMemo(
    () => startedAtMs + durationMinutes * 60_000,
    [startedAtMs, durationMinutes]
  );

  const [answer, setAnswer] = useState(submission.jawaban || '');
  const [structuredAnswers, setStructuredAnswers] = useState<
    Record<string, StudentStructuredAnswerValue>
  >(() => submission.structuredAnswers || {});
  const [fileName, setFileName] = useState(submission.fileNama || '');
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, deadlineMs - Date.now())
  );
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    submission.lastSavedAt ? 'saved' : 'idle'
  );
  const [recentViolationBanner, setRecentViolationBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const initializedItemIdRef = useRef<string | null>(null);
  const hasSubmittedRef = useRef(false);
  const latestAnswerRef = useRef(answer);
  const latestStructuredRef = useRef(structuredAnswers);
  const latestFileRef = useRef(fileName);
  const isDirtyRef = useRef(false);
  const lastViolationAtRef = useRef(0);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync refs synchronously
  latestAnswerRef.current = answer;
  latestStructuredRef.current = structuredAnswers;
  latestFileRef.current = fileName;

  // Hydrate initial draft only once per itemId so snapshot updates don't overwrite active input
  useEffect(() => {
    if (initializedItemIdRef.current !== item.id) {
      initializedItemIdRef.current = item.id;
      const initAns = submission.jawaban || '';
      const initStruct = submission.structuredAnswers || {};
      const initFile = submission.fileNama || '';
      setAnswer(initAns);
      setStructuredAnswers(initStruct);
      setFileName(initFile);
      latestAnswerRef.current = initAns;
      latestStructuredRef.current = initStruct;
      latestFileRef.current = initFile;
      isDirtyRef.current = false;
      hasSubmittedRef.current = false;
    }
  }, [item.id, submission.jawaban, submission.structuredAnswers, submission.fileNama]);

  const computeCurrentPayload = (
    rawAnswer: string,
    rawStruct: Record<string, StudentStructuredAnswerValue>
  ): { jawabanText: string; structPayload?: Record<string, StudentStructuredAnswerValue> } => {
    if (isStructured && tugasDoc) {
      return {
        jawabanText: buildReadableSummaryFromStructuredAnswers(tugasDoc, rawStruct),
        structPayload: rawStruct,
      };
    }
    return {
      jawabanText: rawAnswer,
      structPayload: undefined,
    };
  };

  const flushAutoSave = async (
    nextAnswer: string,
    nextStruct: Record<string, StudentStructuredAnswerValue>,
    nextFile: string
  ) => {
    if (hasSubmittedRef.current || !isDirtyRef.current) return;
    setSaveState('saving');
    const { jawabanText, structPayload } = computeCurrentPayload(nextAnswer, nextStruct);
    try {
      await onAutoSave(item.id, jawabanText, nextFile.trim() || undefined, structPayload);
      isDirtyRef.current = false;
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  // Debounced auto-save to Firestore whenever student types or selects an option
  useEffect(() => {
    if (!isDirtyRef.current || hasSubmittedRef.current) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setSaveState('saving');
    autoSaveTimerRef.current = setTimeout(() => {
      void flushAutoSave(answer, structuredAnswers, fileName);
    }, 650);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer, structuredAnswers, fileName, item.id]);

  // Real-time countdown & automatic submission on timeout
  useEffect(() => {
    const triggerAutoSubmit = async () => {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      setShowConfirmSubmit(false);
      setIsAutoSubmitting(true);
      setIsSubmitting(true);
      const { jawabanText, structPayload } = computeCurrentPayload(
        latestAnswerRef.current,
        latestStructuredRef.current
      );
      try {
        await onSubmitExam(
          item.id,
          jawabanText,
          latestFileRef.current.trim() || undefined,
          true,
          structPayload
        );
      } catch {
        hasSubmittedRef.current = false;
        setIsAutoSubmitting(false);
        setIsSubmitting(false);
        setSubmitError(
          'Gagal mengumpulkan jawaban otomatis. Periksa koneksi internet Anda lalu tekan Kumpulkan Jawaban.'
        );
      }
    };

    const tick = () => {
      const rem = Math.max(0, deadlineMs - Date.now());
      setRemainingMs(rem);
      if (rem <= 0 && !hasSubmittedRef.current) {
        void triggerAutoSubmit();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineMs, item.id, isStructured]);

  // Tab / App Switch Detection via visibilitychange
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden || hasSubmittedRef.current) return;
      const now = Date.now();
      if (now - lastViolationAtRef.current < 600) return;
      lastViolationAtRef.current = now;

      setRecentViolationBanner(true);
      if (isDirtyRef.current) {
        void flushAutoSave(
          latestAnswerRef.current,
          latestStructuredRef.current,
          latestFileRef.current
        );
      }
      void onRecordViolation(item.id);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const updateStructuredAnswer = (
    soalId: string,
    value: StudentStructuredAnswerValue
  ) => {
    isDirtyRef.current = true;
    const next = { ...latestStructuredRef.current, [soalId]: value };
    latestStructuredRef.current = next;
    setStructuredAnswers(next);
    if (submitError) setSubmitError('');
  };

  const answeredCount = useMemo(() => {
    if (!isStructured || !tugasDoc) return 0;
    return tugasDoc.soalList.filter((s) =>
      isSoalAnswered(s, structuredAnswers[s.id])
    ).length;
  }, [isStructured, tugasDoc, structuredAnswers]);

  const totalSoalCount = tugasDoc?.soalList.length ?? 0;

  const handleManualSubmit = async () => {
    if (hasSubmittedRef.current || isSubmitting) return;
    if (!isStructured && !answer.trim()) {
      setSubmitError('Tuliskan jawaban Anda terlebih dahulu sebelum mengumpulkan.');
      setShowConfirmSubmit(false);
      return;
    }

    setSubmitError('');
    hasSubmittedRef.current = true;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setIsSubmitting(true);
    const { jawabanText, structPayload } = computeCurrentPayload(
      latestAnswerRef.current.trim(),
      latestStructuredRef.current
    );

    try {
      await onSubmitExam(
        item.id,
        jawabanText,
        fileName.trim() || undefined,
        false,
        structPayload
      );
    } catch {
      hasSubmittedRef.current = false;
      setIsSubmitting(false);
      setShowConfirmSubmit(false);
      setSubmitError('Gagal mengumpulkan tugas ke Firestore. Silakan coba lagi.');
    }
  };

  const violationCount = submission.violationCount ?? 0;
  const isCriticalTime = remainingMs <= 60_000;
  const isWarningTime = remainingMs > 60_000 && remainingMs <= 300_000;
  const subjectTheme = getSubjectTheme(item.mapel);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex flex-col">
      {/* Locked Exam Top Bar (No sidebar, no exit/navigation) */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#131C31]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`h-10 w-10 rounded-xl ${subjectTheme.gradientBg} ${subjectTheme.shadow} flex items-center justify-center text-white shrink-0 mt-0.5`}>
              <Lock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`font-semibold ${subjectTheme.accentText}`}>
                  Mode Ujian Terkunci · {item.mapel}
                </span>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span className="text-slate-600 dark:text-slate-400 font-mono">
                  {student.nama} ({student.kelas})
                </span>
              </div>
              <h1 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {item.judul}
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
            {violationCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 whitespace-nowrap">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span className="font-mono tabular-nums">{violationCount}x pindah layar</span>
              </div>
            )}

            <div
              role="timer"
              aria-live="polite"
              aria-label="Sisa waktu pengerjaan"
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border font-mono tabular-nums text-sm sm:text-base font-bold whitespace-nowrap ${
                isCriticalTime
                  ? 'bg-gradient-to-r from-rose-500 to-orange-500 border-rose-400 text-white shadow-lg shadow-rose-500/25 animate-pulse'
                  : isWarningTime
                  ? 'bg-amber-500/15 border-amber-500/35 text-amber-700 dark:text-amber-300'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span>{formatCountdown(remainingMs)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Exam Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Auto-submit status banner */}
        {isAutoSubmitting && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 flex items-center gap-3"
          >
            <Loader2 className="h-5 w-5 animate-spin shrink-0" />
            <div className="text-xs sm:text-sm font-medium">
              Waktu pengerjaan telah habis! Draf jawaban Anda sedang dikumpulkan secara otomatis ke database Guru...
            </div>
          </div>
        )}

        {/* Anti-cheat warning banner */}
        {(recentViolationBanner || violationCount > 0) && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-bold">
                Peringatan: Aktivitas Keluar Layar / Pindah Tab Terdeteksi ({violationCount}x)
              </p>
              <p className="leading-relaxed opacity-90">
                Tetaplah berada di halaman pengerjaan ini hingga tugas dikumpulkan. Setiap perpindahan tab atau aplikasi tercatat otomatis di Laporan Progres Guru.
              </p>
            </div>
          </div>
        )}

        {/* Lock Info Strip */}
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 dark:bg-[#131C31] border border-indigo-500/25 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">
            Navigasi LMS dikunci selama tugas berlangsung. Batas waktu: <strong className="font-mono">{durationMinutes} menit</strong> (dimulai {submission.startedAt || '-'}).
            {isStructured && tugasDoc && (
              <>
                {' '}· Progres: <strong className="font-mono">{answeredCount}/{totalSoalCount} soal</strong>
              </>
            )}
          </span>
          <span className="font-mono text-[11px] text-teal-700 dark:text-teal-400 font-semibold">
            {saveState === 'saving'
              ? 'Menyimpan otomatis...'
              : saveState === 'saved'
              ? `Tersimpan otomatis${submission.lastSavedAt ? ` (${submission.lastSavedAt.slice(11)})` : ''}`
              : saveState === 'error'
              ? 'Gagal auto-save (cek koneksi)'
              : 'Auto-save aktif'}
          </span>
        </div>

        {/* Question / Instructions Card (HTML Rendered) */}
        <section
          aria-labelledby="exam-question-heading"
          className="bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className={`h-1.5 w-full ${subjectTheme.gradientBar}`} />
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2
                id="exam-question-heading"
                className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100"
              >
                {isStructured ? 'Petunjuk Pengerjaan' : 'Soal & Instruksi Tugas'}
              </h2>
              {item.tenggat && (
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Tenggat {item.tenggat}
                </span>
              )}
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
              <MaterialContentRenderer content={item.konten} />
            </div>

            {item.lampiranNama && (
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <FileText className={`h-4 w-4 shrink-0 ${subjectTheme.accentText}`} />
                <span>Lampiran soal: {item.lampiranNama}</span>
              </div>
            )}
          </div>
        </section>

        {/* STRUCTURED 4-TYPE QUESTIONS OR LEGACY FREE-TEXT SHEET */}
        {isStructured && tugasDoc ? (
          <section aria-label="Daftar Butir Soal Ujian" className="space-y-4">
            {tugasDoc.soalList.map((soal, idx) => {
              const currentVal = structuredAnswers[soal.id];
              const isAnswered = isSoalAnswered(soal, currentVal);
              const matchingMap =
                currentVal && typeof currentVal === 'object'
                  ? (currentVal as Record<string, string>)
                  : {};

              return (
                <article
                  key={soal.id}
                  className="bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
                >
                  <div className={`h-1 w-full ${subjectTheme.gradientBar}`} />
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Question Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`font-display font-bold ${subjectTheme.accentText}`}>
                          Soal {idx + 1}
                        </span>
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {SOAL_TYPE_LABELS[soal.type]}
                        </span>
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                          {soal.poin} poin
                        </span>
                      </div>

                      <span
                        className={`text-xs font-semibold flex items-center gap-1 px-2.5 py-0.5 rounded-full ${
                          isAnswered
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{isAnswered ? 'Terjawab' : 'Belum dijawab'}</span>
                      </span>
                    </div>

                    {/* Question Content (HTML & RTL safe) */}
                    <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
                      <MaterialContentRenderer content={soal.pertanyaan} />
                    </div>

                    {/* TYPE 1: PILIHAN GANDA */}
                    {soal.type === 'pilihan_ganda' && soal.opsi && (
                      <div className="grid grid-cols-1 gap-2.5">
                        {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                          const selected = currentVal === letter;
                          const optText = soal.opsi?.[letter] || '';
                          return (
                            <button
                              key={letter}
                              type="button"
                              disabled={isSubmitting || isAutoSubmitting}
                              onClick={() => updateStructuredAnswer(soal.id, letter)}
                              aria-pressed={selected}
                              className={`w-full min-h-[48px] px-4 py-3 rounded-xl border text-left flex items-start gap-3 transition-all disabled:opacity-60 ${
                                selected
                                  ? 'border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/15 text-slate-900 dark:text-white shadow-sm'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <span
                                className={`h-6 w-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                  selected
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                                }`}
                              >
                                {letter}
                              </span>
                              <span dir="auto" className="text-sm sm:text-base leading-relaxed flex-1">
                                {optText}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* TYPE 2: ISIAN SINGKAT */}
                    {soal.type === 'isian_singkat' && (
                      <div>
                        <label
                          htmlFor={`isian-${soal.id}`}
                          className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                        >
                          Ketik Jawaban Singkat Anda (Mendukung Keyboard Arab / Latin)
                        </label>
                        <input
                          id={`isian-${soal.id}`}
                          type="text"
                          dir="auto"
                          maxLength={300}
                          disabled={isSubmitting || isAutoSubmitting}
                          value={typeof currentVal === 'string' ? currentVal : ''}
                          onChange={(e) => updateStructuredAnswer(soal.id, e.target.value)}
                          placeholder="Ketik jawaban singkat di sini..."
                          className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                        />
                      </div>
                    )}

                    {/* TYPE 3: MENJODOHKAN (Touch-Friendly Dropdowns, Zero Drag-and-Drop) */}
                    {soal.type === 'menjodohkan' && soal.kiriList && soal.kananList && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Pilih pasangan yang paling tepat untuk setiap pernyataan di bawah ini:
                        </p>
                        <div className="space-y-2.5">
                          {soal.kiriList.map((kiri, kIdx) => {
                            const pickedKananId = matchingMap[kiri.id] || '';
                            return (
                              <div
                                key={kiri.id}
                                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  <span className={`font-mono text-xs font-bold mt-0.5 shrink-0 ${subjectTheme.accentText}`}>
                                    {kIdx + 1}.
                                  </span>
                                  <span
                                    dir="auto"
                                    className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed"
                                  >
                                    {kiri.text}
                                  </span>
                                </div>

                                <select
                                  aria-label={`Pasangan untuk ${kiri.text}`}
                                  dir="auto"
                                  disabled={isSubmitting || isAutoSubmitting}
                                  value={pickedKananId}
                                  onChange={(e) =>
                                    updateStructuredAnswer(soal.id, {
                                      ...matchingMap,
                                      [kiri.id]: e.target.value,
                                    })
                                  }
                                  className="w-full sm:w-72 min-h-[48px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] text-sm text-slate-900 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                                >
                                  <option value="">-- Pilih Pasangan --</option>
                                  {(soal.kananList || []).map((kanan) => (
                                    <option key={kanan.id} value={kanan.id}>
                                      {kanan.text}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* TYPE 4: ESSAY */}
                    {soal.type === 'essay' && (
                      <div>
                        <label
                          htmlFor={`essay-${soal.id}`}
                          className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                        >
                          Jawaban Essay (Tersimpan Otomatis)
                        </label>
                        <textarea
                          id={`essay-${soal.id}`}
                          rows={5}
                          dir="auto"
                          maxLength={5000}
                          disabled={isSubmitting || isAutoSubmitting}
                          value={typeof currentVal === 'string' ? currentVal : ''}
                          onChange={(e) => updateStructuredAnswer(soal.id, e.target.value)}
                          placeholder="Tuliskan uraian jawaban essay Anda di sini..."
                          className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 leading-relaxed"
                        />
                      </div>
                    )}
                  </div>
                </article>
              );
            })}

            {/* Optional Attachment + Final Submit Bar */}
            <section className="bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Pengumpulan Tugas
                </h2>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Tersimpan otomatis saat mengerjakan</span>
                </span>
              </div>

              <div>
                <label
                  htmlFor="locked-exam-file-structured"
                  className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
                >
                  Nama Berkas / Catatan Tambahan (Opsional)
                </label>
                <input
                  id="locked-exam-file-structured"
                  type="text"
                  maxLength={200}
                  disabled={isSubmitting || isAutoSubmitting}
                  value={fileName}
                  onChange={(e) => {
                    isDirtyRef.current = true;
                    setFileName(e.target.value);
                  }}
                  placeholder="Contoh: Lembar_Coretan_Siswa.pdf"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300"
                >
                  {submitError}
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Terjawab <strong className="font-mono text-slate-900 dark:text-slate-100">{answeredCount}/{totalSoalCount}</strong> butir soal. Setelah dikumpulkan, nilai otomatis akan langsung dihitung.
                </p>
                <button
                  type="button"
                  disabled={isSubmitting || isAutoSubmitting}
                  onClick={() => setShowConfirmSubmit(true)}
                  className={`min-h-[46px] px-6 py-2.5 text-sm flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60 ${PRIMARY_CTA_CLASS}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Mengumpulkan &amp; Menilai...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Kumpulkan Jawaban</span>
                    </>
                  )}
                </button>
              </div>
            </section>
          </section>
        ) : (
          /* LEGACY FREE-TEXT ANSWER SHEET */
          <section
            aria-labelledby="exam-answer-heading"
            className="bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="exam-answer-heading"
                className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Lembar Jawaban Anda
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Tersimpan otomatis saat mengetik</span>
              </span>
            </div>

            <div>
              <label
                htmlFor="locked-exam-answer"
                className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
              >
                Jawaban Tugas
              </label>
              <textarea
                id="locked-exam-answer"
                rows={8}
                dir="auto"
                maxLength={5000}
                disabled={isSubmitting || isAutoSubmitting}
                value={answer}
                onChange={(e) => {
                  isDirtyRef.current = true;
                  setAnswer(e.target.value);
                  if (submitError) setSubmitError('');
                }}
                placeholder="Tuliskan jawaban lengkap Anda di sini. Draf jawaban tersimpan otomatis ke database agar aman jika koneksi terputus..."
                className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 leading-relaxed"
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 text-right font-mono tabular-nums">
                {answer.length}/5000 karakter
              </p>
            </div>

            <div>
              <label
                htmlFor="locked-exam-file"
                className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
              >
                Nama Berkas / Catatan Lampiran (Opsional)
              </label>
              <input
                id="locked-exam-file"
                type="text"
                maxLength={200}
                disabled={isSubmitting || isAutoSubmitting}
                value={fileName}
                onChange={(e) => {
                  isDirtyRef.current = true;
                  setFileName(e.target.value);
                }}
                placeholder="Contoh: Lembar_Jawaban_Siswa.pdf"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            {submitError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300"
              >
                {submitError}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Setelah dikumpulkan, sesi akan berakhir dan akses dashboard kembali terbuka.
              </p>
              <button
                type="button"
                disabled={isSubmitting || isAutoSubmitting}
                onClick={() => {
                  if (!answer.trim()) {
                    setSubmitError('Tuliskan jawaban Anda terlebih dahulu sebelum mengumpulkan.');
                    return;
                  }
                  setShowConfirmSubmit(true);
                }}
                className={`min-h-[46px] px-6 py-2.5 text-sm flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60 ${PRIMARY_CTA_CLASS}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mengumpulkan...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Kumpulkan Jawaban</span>
                  </>
                )}
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Final Submit Confirmation Modal */}
      {showConfirmSubmit && !isAutoSubmitting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-finish-exam-title"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="space-y-1.5">
              <h3
                id="confirm-finish-exam-title"
                className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Kumpulkan Jawaban Sekarang?
              </h3>
              {isStructured && answeredCount < totalSoalCount ? (
                <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                  Anda baru menjawab <strong className="font-mono">{answeredCount} dari {totalSoalCount}</strong> butir soal. Soal yang belum dijawab akan mendapat nilai 0. Yakin ingin mengumpulkan sekarang?
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Pastikan seluruh jawaban Anda sudah lengkap. Setelah dikumpulkan, jawaban terkunci dan tidak dapat diubah kembali.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmSubmit(false)}
                className="min-h-[42px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-colors"
              >
                Periksa Lagi
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleManualSubmit}
                className={`min-h-[42px] px-5 py-2 text-sm flex items-center gap-2 ${PRIMARY_CTA_CLASS}`}
              >
                <Send className="h-4 w-4" />
                <span>Ya, Kumpulkan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
