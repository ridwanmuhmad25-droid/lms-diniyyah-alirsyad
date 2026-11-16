import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  Check,
  Copy,
  Languages,
  Loader2,
  Search,
  X,
} from 'lucide-react';

type TranslationDirection = 'id|ar' | 'ar|id';

interface MyMemoryMatch {
  id: string;
  segment: string;
  translation: string;
  quality?: number | string;
}

interface MyMemoryResponse {
  responseStatus: number;
  responseDetails?: string;
  responseData?: {
    translatedText: string;
    match?: number;
  };
  matches?: MyMemoryMatch[];
}

interface TranslationResult {
  query: string;
  direction: TranslationDirection;
  translatedText: string;
  alternatives: Array<{ source: string; translation: string }>;
}

export function KamusArabView() {
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState<TranslationDirection>('id|ar');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const isSourceArabic = direction === 'ar|id';

  const handleToggleDirection = () => {
    setDirection((prev) => (prev === 'id|ar' ? 'ar|id' : 'id|ar'));
    setErrorMsg(null);
  };

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setErrorMsg('Silakan ketik kata atau kalimat yang ingin diterjemahkan.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setCopied(false);

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        trimmed
      )}&langpair=${encodeURIComponent(direction)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server merespons dengan status ${response.status}.`);
      }

      const data = (await response.json()) as MyMemoryResponse;

      if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
        throw new Error(
          data.responseDetails ||
            'Terjemahan tidak ditemukan. Coba kata atau kalimat lain.'
        );
      }

      const mainTranslation = data.responseData.translatedText.trim();

      const seen = new Set<string>([mainTranslation.toLowerCase()]);
      const alternatives: Array<{ source: string; translation: string }> = [];

      if (Array.isArray(data.matches)) {
        for (const match of data.matches) {
          const cand = (match.translation || '').trim();
          if (!cand || seen.has(cand.toLowerCase())) continue;
          seen.add(cand.toLowerCase());
          alternatives.push({
            source: (match.segment || trimmed).trim(),
            translation: cand,
          });
          if (alternatives.length >= 4) break;
        }
      }

      setResult({
        query: trimmed,
        direction,
        translatedText: mainTranslation,
        alternatives,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Gagal terhubung ke layanan terjemahan. Periksa koneksi internet Anda.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.translatedText) return;
    try {
      await navigator.clipboard.writeText(result.translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const handleSampleClick = (sampleText: string, sampleDir: TranslationDirection) => {
    setDirection(sampleDir);
    setQuery(sampleText);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search & Translation Card */}
      <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center text-white shrink-0">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-white">
              Kamus Arab — Penerjemah Real-Time
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 mt-0.5">
              Terjemahkan kosakata atau kalimat antara Bahasa Indonesia dan Bahasa Arab secara langsung.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Direction Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-[#0B1120] rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setDirection('id|ar');
                  setErrorMsg(null);
                }}
                className={`min-h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  direction === 'id|ar'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Indonesia ke Arab
              </button>
              <button
                type="button"
                onClick={() => {
                  setDirection('ar|id');
                  setErrorMsg(null);
                }}
                className={`min-h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  direction === 'ar|id'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Arab ke Indonesia
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleDirection}
              title="Tukar arah terjemahan"
              className="min-h-[44px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors"
            >
              <ArrowLeftRight className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span>Tukar Arah</span>
            </button>
          </div>

          {/* Search Input & Translate CTA (Clean high-contrast interior) */}
          <form onSubmit={handleTranslate} className="space-y-3">
            <label htmlFor="kamus-input" className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
              {direction === 'id|ar'
                ? 'Masukkan Kata atau Kalimat (Bahasa Indonesia)'
                : 'Masukkan Kata atau Kalimat (Bahasa Arab)'}
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  id="kamus-input"
                  type="text"
                  dir={isSourceArabic ? 'rtl' : 'ltr'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    direction === 'id|ar'
                      ? 'Contoh: Sekolah, Ilmu pengetahuan, atau Selamat pagi'
                      : 'Contoh: المدرسة atau السلام عليكم'
                  }
                  className={`w-full min-h-[46px] pl-10 pr-10 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 ${
                    isSourceArabic ? 'text-right' : 'text-left'
                  }`}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setErrorMsg(null);
                    }}
                    aria-label="Hapus teks input"
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menerjemahkan...</span>
                  </>
                ) : (
                  <>
                    <Languages className="h-4 w-4" />
                    <span>Terjemahkan</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Contoh cepat:</span>
              <button
                type="button"
                onClick={() => handleSampleClick('Sekolah Islam', 'id|ar')}
                className="text-indigo-600 dark:text-cyan-400 font-medium hover:underline"
              >
                Sekolah Islam
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => handleSampleClick('Menuntut ilmu itu wajib', 'id|ar')}
                className="text-indigo-600 dark:text-cyan-400 font-medium hover:underline"
              >
                Menuntut ilmu itu wajib
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => handleSampleClick('المدرسة', 'ar|id')}
                className="text-amber-600 dark:text-amber-400 font-medium hover:underline"
              >
                المدرسة
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Loading Status Card */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-3 text-sm font-semibold text-indigo-600 dark:text-cyan-400">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>Sedang mengambil hasil terjemahan...</span>
          </div>
          <div className="space-y-2.5 animate-pulse">
            <div className="h-4 w-1/3 rounded-md bg-slate-200 dark:bg-slate-700" />
            <div className="h-8 w-2/3 rounded-md bg-slate-100 dark:bg-slate-800" />
            <div className="h-3.5 w-1/2 rounded-md bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      )}

      {/* Error Card */}
      {!isLoading && errorMsg && (
        <div
          role="alert"
          className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl p-5 flex items-start gap-3 text-sm text-rose-800 dark:text-rose-300"
        >
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Terjemahan Gagal</p>
            <p className="mt-0.5 text-xs sm:text-sm">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Translation Result Card (Clean high-contrast Arabic reading box) */}
      {!isLoading && !errorMsg && result && (
        <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-cyan-500/10">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold">
                {result.direction === 'id|ar'
                  ? 'Indonesia → Arab'
                  : 'Arab → Indonesia'}
              </span>
              <span>Hasil Terjemahan</span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[36px] px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Teks Asal</p>
              <p
                dir={result.direction === 'ar|id' ? 'rtl' : 'ltr'}
                className={`text-sm sm:text-base text-slate-700 dark:text-slate-300 ${
                  result.direction === 'ar|id' ? 'text-right font-medium' : 'text-left'
                }`}
              >
                {result.query}
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-1.5">
              <p className="text-xs font-semibold text-indigo-600 dark:text-cyan-400">Hasil Terjemahan</p>
              <p
                dir={result.direction === 'id|ar' ? 'rtl' : 'ltr'}
                className={`font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-[2.0] ${
                  result.direction === 'id|ar' ? 'text-right' : 'text-left'
                }`}
              >
                {result.translatedText}
              </p>
            </div>

            {result.alternatives.length > 0 && (
              <div className="pt-2 space-y-2.5">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Padanan &amp; Referensi Lainnya
                </p>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {result.alternatives.map((alt, idx) => (
                    <div
                      key={`${alt.translation}-${idx}`}
                      className="px-4 py-3 bg-slate-50 dark:bg-[#0B1120] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm"
                    >
                      <span className="text-slate-600 dark:text-slate-400">{alt.source}</span>
                      <span
                        dir={result.direction === 'id|ar' ? 'rtl' : 'ltr'}
                        className="font-semibold text-slate-900 dark:text-slate-100"
                      >
                        {alt.translation}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Initial Empty State */}
      {!isLoading && !errorMsg && !result && (
        <div className="bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 text-center space-y-1.5">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Siap menerjemahkan kosakata &amp; kalimat
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Pilih arah terjemahan di atas, ketik kata atau kalimat, lalu tekan tombol Terjemahkan.
          </p>
        </div>
      )}
    </div>
  );
}
