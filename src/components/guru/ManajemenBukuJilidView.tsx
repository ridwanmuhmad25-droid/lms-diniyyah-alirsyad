import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Eye,
  Image as ImageIcon,
  Link2,
  ListPlus,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { ALL_CLASSES } from '../../data/mockData';
import {
  JilidBook,
  JilidPage,
  JilidReadProgress,
  Student,
} from '../../types/lms';
import { EbookReaderModal } from '../siswa/EbookReaderModal';

interface ManajemenBukuJilidViewProps {
  guruName: string;
  students: Student[];
  jilidBooks: JilidBook[];
  jilidProgress: JilidReadProgress[];
  onAddJilidBook: (book: JilidBook) => Promise<void>;
  onDeleteJilidBook: (book: JilidBook) => Promise<void>;
  onNotify: (msg: string) => void;
}

interface DraftUrlRow {
  key: string;
  url: string;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ManajemenBukuJilidView({
  guruName,
  students,
  jilidBooks,
  jilidProgress,
  onAddJilidBook,
  onDeleteJilidBook,
  onNotify,
}: ManajemenBukuJilidViewProps) {
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [urlRows, setUrlRows] = useState<DraftUrlRow[]>([
    { key: 'page-row-1', url: '' },
  ]);
  const [showBatchPaste, setShowBatchPaste] = useState(false);
  const [batchPasteText, setBatchPasteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewBook, setPreviewBook] = useState<JilidBook | null>(null);

  // Laporan Bacaan filters
  const [reportClassFilter, setReportClassFilter] = useState<string>('ALL');
  const [reportBookFilter, setReportBookFilter] = useState<string>('ALL');
  const [reportSearch, setReportSearch] = useState('');

  const addEmptyPageRow = () => {
    setFormError(null);
    setUrlRows((prev) => [
      ...prev,
      { key: `page-row-${Date.now()}-${prev.length + 1}`, url: '' },
    ]);
  };

  const updateRowUrl = (index: number, nextValue: string) => {
    setFormError(null);
    // Support pasting multiple URLs separated by newlines directly into a single row
    if (nextValue.includes('\n')) {
      const lines = nextValue
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (lines.length > 1) {
        setUrlRows((prev) => {
          const before = prev.slice(0, index);
          const after = prev.slice(index + 1);
          const inserted: DraftUrlRow[] = lines.map((line, offset) => ({
            key: `page-row-${Date.now()}-${index}-${offset}`,
            url: line,
          }));
          return [...before, ...inserted, ...after];
        });
        return;
      }
    }

    setUrlRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, url: nextValue } : row))
    );
  };

  const moveRow = (index: number, delta: -1 | 1) => {
    setUrlRows((prev) => {
      const targetIndex = index + delta;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const removeRow = (index: number) => {
    setFormError(null);
    setUrlRows((prev) => {
      if (prev.length === 1) {
        return [{ ...prev[0], url: '' }];
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleApplyBatchPaste = () => {
    const lines = batchPasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const newRows: DraftUrlRow[] = lines.map((line, idx) => ({
      key: `page-batch-${Date.now()}-${idx}`,
      url: line,
    }));

    setUrlRows((prev) => {
      const nonEmptyExisting = prev.filter((r) => r.url.trim().length > 0);
      return [...nonEmptyExisting, ...newRows];
    });
    setBatchPasteText('');
    setShowBatchPaste(false);
    setFormError(null);
  };

  const filledRowsCount = useMemo(
    () => urlRows.filter((r) => r.url.trim().length > 0).length,
    [urlRows]
  );

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setFormError(null);

    const trimmedTitle = judul.trim();
    if (!trimmedTitle) {
      setFormError('Judul Buku / Jilid wajib diisi.');
      return;
    }

    const activeRows = urlRows
      .map((r, idx) => ({ index: idx + 1, url: r.url.trim() }))
      .filter((r) => r.url.length > 0);

    if (activeRows.length === 0) {
      setFormError('Masukkan minimal 1 URL gambar untuk Halaman 1.');
      return;
    }

    if (activeRows.length > 120) {
      setFormError('Maksimal 120 halaman per buku jilid.');
      return;
    }

    const invalidRow = activeRows.find((r) => !isValidHttpUrl(r.url));
    if (invalidRow) {
      setFormError(
        `URL pada Halaman ${invalidRow.index} tidak valid. Pastikan diawali https:// atau http://.`
      );
      return;
    }

    const pages: JilidPage[] = activeRows.map((row, idx) => ({
      pageNumber: idx + 1,
      imageUrl: row.url,
    }));

    const bookId = `jilid-${Date.now()}`;
    const newBook: JilidBook = {
      id: bookId,
      judul: trimmedTitle,
      deskripsi:
        deskripsi.trim() ||
        'E-Book Jilid interaktif untuk latihan membaca Tahfidz/Tahsin.',
      pages,
      createdAt: new Date().toISOString().slice(0, 10),
      authorName: guruName,
    };

    setIsSaving(true);
    try {
      await onAddJilidBook(newBook);
      setJudul('');
      setDeskripsi('');
      setUrlRows([{ key: `page-row-${Date.now()}`, url: '' }]);
      onNotify(
        `Buku "${newBook.judul}" (${newBook.pages.length} halaman) berhasil disimpan ke Firestore.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(`Gagal menyimpan buku ke Firestore: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Rekap Laporan Bacaan
  const reportRows = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    return jilidProgress
      .map((prog) => {
        const student = students.find((s) => s.nis === prog.studentNis);
        const book = jilidBooks.find((b) => b.id === prog.bookId);
        return { prog, student, book };
      })
      .filter(({ prog, student, book }) => {
        if (!student || !book) return false;
        if (reportClassFilter !== 'ALL' && student.kelas !== reportClassFilter) {
          return false;
        }
        if (reportBookFilter !== 'ALL' && prog.bookId !== reportBookFilter) {
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
  }, [jilidProgress, students, jilidBooks, reportClassFilter, reportBookFilter, reportSearch]);

  return (
    <div className="space-y-6">
      {/* Top Grid: Form Input URL Gambar + Daftar Buku Jilid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Buat Buku/Jilid Baru via Input URL Gambar */}
        <div className="lg:col-span-6 bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white">
            <h2 className="font-display text-base font-bold text-white">
              Buat Buku / Jilid Baru
            </h2>
            <p className="text-xs text-indigo-100 mt-0.5">
              Tempelkan (paste) URL gambar halaman secara berurutan untuk Halaman 1, Halaman 2, dst.
            </p>
          </div>

          <form onSubmit={handleCreateBook} className="p-5 sm:p-6 space-y-4">
            <div>
              <label
                htmlFor="jilid-judul"
                className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
              >
                Judul Buku / Jilid
              </label>
              <input
                id="jilid-judul"
                type="text"
                required
                maxLength={150}
                disabled={isSaving}
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Jilid 4 — Waqaf & Ibtida"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="jilid-desc"
                className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
              >
                Deskripsi Singkat
              </label>
              <input
                id="jilid-desc"
                type="text"
                maxLength={500}
                disabled={isSaving}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Fokus materi tajwid atau target bacaan pada jilid ini"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            {/* Section: Input URL Gambar Per Halaman */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Input URL Gambar Halaman ({filledRowsCount} terisi)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Gunakan link gambar langsung (https://... .jpg, .png, .webp)
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setShowBatchPaste((prev) => !prev)}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-xs font-semibold text-indigo-700 dark:text-indigo-300 inline-flex items-center gap-1.5 transition-colors"
                >
                  <ListPlus className="h-3.5 w-3.5" />
                  <span>{showBatchPaste ? 'Tutup Tempel Massal' : 'Tempel Banyak URL'}</span>
                </button>
              </div>

              {showBatchPaste && (
                <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-slate-50 dark:bg-[#0B1120] space-y-2.5">
                  <label
                    htmlFor="batch-url-textarea"
                    className="block text-xs font-semibold text-slate-900 dark:text-slate-100"
                  >
                    Tempel Banyak URL Sekaligus (1 URL per baris)
                  </label>
                  <textarea
                    id="batch-url-textarea"
                    rows={4}
                    value={batchPasteText}
                    onChange={(e) => setBatchPasteText(e.target.value)}
                    placeholder={`https://contoh.com/jilid1/hal-1.webp\nhttps://contoh.com/jilid1/hal-2.webp\nhttps://contoh.com/jilid1/hal-3.webp`}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleApplyBatchPaste}
                      disabled={!batchPasteText.trim()}
                      className="min-h-[36px] px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 disabled:opacity-45 text-white text-xs font-semibold shadow-sm shadow-indigo-500/25 transition-all"
                    >
                      Masukkan ke Daftar Halaman
                    </button>
                  </div>
                </div>
              )}

              {/* Sequential Page URL Inputs */}
              <div className="max-h-72 overflow-y-auto space-y-2.5 pr-0.5">
                {urlRows.map((row, idx) => {
                  const trimmed = row.url.trim();
                  const validUrl = trimmed.length > 0 && isValidHttpUrl(trimmed);
                  return (
                    <div
                      key={row.key}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400 tabular-nums">
                          Halaman {idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0 || isSaving}
                            onClick={() => moveRow(idx, -1)}
                            aria-label={`Naikkan Halaman ${idx + 1}`}
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131C31] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === urlRows.length - 1 || isSaving}
                            onClick={() => moveRow(idx, 1)}
                            aria-label={`Turunkan Halaman ${idx + 1}`}
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131C31] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => removeRow(idx)}
                            aria-label={`Hapus Halaman ${idx + 1}`}
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131C31] text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:text-rose-700 dark:hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="h-11 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131C31] flex items-center justify-center overflow-hidden shrink-0">
                          {validUrl ? (
                            <img
                              src={trimmed}
                              alt={`Pratinjau Halaman ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                          )}
                        </div>

                        <div className="relative flex-1 min-w-0">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          <input
                            type="url"
                            disabled={isSaving}
                            value={row.url}
                            onChange={(e) => updateRowUrl(idx, e.target.value)}
                            placeholder={`Tempel URL gambar Halaman ${idx + 1} (https://...)`}
                            aria-label={`URL Gambar Halaman ${idx + 1}`}
                            className="w-full min-h-[42px] pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={isSaving || urlRows.length >= 120}
                onClick={addEmptyPageRow}
                className="w-full min-h-[42px] px-4 py-2 rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-500/40 bg-indigo-50/40 dark:bg-indigo-500/10 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Halaman {urlRows.length + 1}</span>
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300"
              >
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={!judul.trim() || filledRowsCount === 0 || isSaving}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-45 disabled:pointer-events-none text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan ke Firestore...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Simpan & Terbitkan Buku Jilid</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Daftar Buku Jilid Aktif */}
        <div className="lg:col-span-6 bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500" />
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Koleksi Buku Jilid Aktif
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Total {jilidBooks.length} buku jilid tersimpan di Firestore untuk dibaca siswa.
            </p>
          </div>

          {jilidBooks.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-600 dark:text-slate-400">
              Belum ada buku jilid di Firestore. Tambahkan buku pertama di formulir sebelah kiri.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {jilidBooks.map((book) => (
                <div
                  key={book.id}
                  className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-cyan-300 font-semibold tabular-nums">
                        {book.pages.length} Halaman
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{book.createdAt}</span>
                    </div>
                    <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      {book.judul}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {book.deskripsi}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewBook(book)}
                      className="min-h-[40px] px-4 py-2 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 whitespace-nowrap transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Pratinjau</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await onDeleteJilidBook(book);
                          onNotify(`Buku "${book.judul}" telah dihapus dari Firestore.`);
                        } catch {
                          onNotify(`Gagal menghapus buku "${book.judul}".`);
                        }
                      }}
                      aria-label={`Hapus ${book.judul}`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:border-rose-200 dark:hover:border-rose-500/40 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabel Laporan Bacaan */}
      <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Laporan Bacaan E-Book Jilid
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Rekap otomatis halaman terakhir yang dibuka siswa dari Firestore.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-semibold tabular-nums">
              {reportRows.length} catatan bacaan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="search"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="Cari nama siswa atau NIS..."
                aria-label="Cari siswa di laporan bacaan"
                className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            <select
              value={reportClassFilter}
              onChange={(e) => setReportClassFilter(e.target.value)}
              aria-label="Filter kelas laporan bacaan"
              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              <option value="ALL">Semua Kelas</option>
              {ALL_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>

            <select
              value={reportBookFilter}
              onChange={(e) => setReportBookFilter(e.target.value)}
              aria-label="Filter judul jilid"
              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              <option value="ALL">Semua Judul Jilid</option>
              {jilidBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.judul}
                </option>
              ))}
            </select>
          </div>
        </div>

        {reportRows.length === 0 ? (
          <div className="p-10 text-center space-y-1.5">
            <BookOpen className="h-6 w-6 text-slate-400 dark:text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Belum ada data laporan bacaan untuk filter ini
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Progres akan tercatat otomatis ke Firestore saat siswa membuka dan menggeser halaman buku jilid.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Nama Siswa</th>
                  <th className="py-3 px-4 font-semibold">Kelas</th>
                  <th className="py-3 px-4 font-semibold">Judul Jilid</th>
                  <th className="py-3 px-4 font-semibold">Halaman Terakhir Dibaca</th>
                  <th className="py-3 px-4 font-semibold text-right">Terakhir Diperbarui</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {reportRows.map(({ prog, student, book }) => (
                  <tr
                    key={`${prog.studentNis}-${prog.bookId}`}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {student?.nama}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        NIS {student?.nis}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">
                      {student?.kelas}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-indigo-600 dark:text-cyan-400">
                      {book?.judul}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        Halaman {prog.lastPageRead} / {book?.pages.length || prog.totalPages}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {prog.updatedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Slider Modal */}
      {previewBook && (
        <EbookReaderModal
          book={previewBook}
          initialPage={1}
          onClose={() => setPreviewBook(null)}
        />
      )}
    </div>
  );
}
