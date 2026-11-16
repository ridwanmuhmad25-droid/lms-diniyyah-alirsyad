import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
} from 'lucide-react';
import { JilidBook } from '../../types/lms';

interface EbookReaderModalProps {
  book: JilidBook;
  initialPage?: number;
  onTrackPage?: (bookId: string, pageNumber: number, totalPages: number) => void;
  onClose: () => void;
}

export function EbookReaderModal({
  book,
  initialPage = 1,
  onTrackPage,
  onClose,
}: EbookReaderModalProps) {
  const totalPages = book.pages.length;
  const safeInitialIndex = Math.min(
    Math.max(0, initialPage - 1),
    Math.max(0, totalPages - 1)
  );

  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex);
  const [resolvedUrls, setResolvedUrls] = useState<Record<number, string>>({});
  const [loadingIndices, setLoadingIndices] = useState<Record<number, boolean>>({});
  const [errorIndices, setErrorIndices] = useState<Record<number, boolean>>({});

  // Persistent in-session cache keyed by imageUrl so flipping back never re-downloads
  const urlCacheRef = useRef<Map<string, string>>(new Map());
  const preloadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const loadAndCachePage = useCallback(
    async (index: number) => {
      if (index < 0 || index >= totalPages) return;
      const page = book.pages[index];
      if (!page) return;

      const rawUrl = page.imageUrl;

      // Return immediately from cache if already loaded
      const cached = urlCacheRef.current.get(rawUrl);
      if (cached) {
        setResolvedUrls((prev) =>
          prev[index] === cached ? prev : { ...prev, [index]: cached }
        );
        setLoadingIndices((prev) =>
          prev[index] ? { ...prev, [index]: false } : prev
        );
        return;
      }

      setLoadingIndices((prev) => ({ ...prev, [index]: true }));
      setErrorIndices((prev) => ({ ...prev, [index]: false }));

      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.referrerPolicy = 'no-referrer';
          img.onload = () => {
            preloadedImagesRef.current.set(rawUrl, img);
            resolve();
          };
          img.onerror = () => reject(new Error('Gagal memuat gambar halaman'));
          img.src = rawUrl;
        });

        urlCacheRef.current.set(rawUrl, rawUrl);
        setResolvedUrls((prev) => ({ ...prev, [index]: rawUrl }));
      } catch {
        setErrorIndices((prev) => ({ ...prev, [index]: true }));
      } finally {
        setLoadingIndices((prev) => ({ ...prev, [index]: false }));
      }
    },
    [book.pages, totalPages]
  );

  // Strict Lazy Loading: ONLY load current page and +1 next page
  useEffect(() => {
    loadAndCachePage(currentIndex);
    if (currentIndex + 1 < totalPages) {
      loadAndCachePage(currentIndex + 1);
    }
  }, [currentIndex, totalPages, loadAndCachePage]);

  // Clear in-memory image references on unmount
  useEffect(() => {
    const preloadedMap = preloadedImagesRef.current;
    return () => {
      preloadedMap.clear();
    };
  }, []);

  // Track current page automatically whenever page changes
  useEffect(() => {
    if (totalPages === 0) return;
    const currentPageNum = book.pages[currentIndex]?.pageNumber ?? currentIndex + 1;
    onTrackPage?.(book.id, currentPageNum, totalPages);
  }, [book.id, book.pages, currentIndex, totalPages, onTrackPage]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  const handleSaveAndExit = useCallback(() => {
    if (totalPages > 0) {
      const currentPageNum =
        book.pages[currentIndex]?.pageNumber ?? currentIndex + 1;
      onTrackPage?.(book.id, currentPageNum, totalPages);
    }
    onClose();
  }, [book.id, book.pages, currentIndex, totalPages, onTrackPage, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') handleSaveAndExit();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goToPrev, goToNext, handleSaveAndExit]);

  // Touch swipe detection for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Trigger horizontal swipe only if horizontal movement clearly exceeds vertical scroll
    if (Math.abs(dx) >= 44 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  const currentPage = book.pages[currentIndex];
  const currentSrc = resolvedUrls[currentIndex];
  const isCurrentLoading = loadingIndices[currentIndex] && !currentSrc;
  const isCurrentError = errorIndices[currentIndex] && !currentSrc;
  const cachedCount = Object.keys(resolvedUrls).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Pembaca E-Book ${book.judul}`}
    >
      {/* Top Reader Bar */}
      <header className="h-14 sm:h-16 px-3 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h2 className="font-display text-sm sm:text-base font-bold text-white truncate">
            {book.judul}
          </h2>
          <p className="text-[11px] sm:text-xs text-blue-200/80 font-mono tabular-nums truncate">
            Halaman {currentIndex + 1} dari {totalPages} · {cachedCount} halaman di cache
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAndExit}
          className="min-h-[42px] px-3.5 sm:px-4 py-2 rounded-xl bg-blue-800 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
        >
          <Save className="h-4 w-4 shrink-0" />
          <span>Simpan Progress & Keluar</span>
        </button>
      </header>

      {/* Center Image Slider Stage */}
      <div
        className="flex-1 min-h-0 relative flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {totalPages === 0 ? (
          <p className="text-sm text-slate-300">
            Buku jilid ini belum memiliki halaman.
          </p>
        ) : isCurrentLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-200">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <p className="text-sm font-medium">
              Memuat halaman {currentIndex + 1}...
            </p>
          </div>
        ) : isCurrentError ? (
          <div className="max-w-sm text-center space-y-3 p-6 rounded-2xl bg-slate-900 border border-slate-700">
            <p className="text-sm font-semibold text-white">
              Halaman {currentIndex + 1} gagal dimuat
            </p>
            <button
              type="button"
              onClick={() => loadAndCachePage(currentIndex)}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-800 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
            >
              Muat Ulang Halaman
            </button>
          </div>
        ) : currentSrc ? (
          <img
            key={currentPage.pageNumber}
            src={currentSrc}
            alt={`${book.judul} - Halaman ${currentIndex + 1}`}
            referrerPolicy="no-referrer"
            draggable={false}
            className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl bg-white"
          />
        ) : null}
      </div>

      {/* Bottom Large Navigation Controls */}
      <footer className="px-3 sm:px-6 py-3 sm:py-4 bg-slate-900 border-t border-slate-800 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="flex-1 sm:flex-none sm:min-w-[170px] min-h-[50px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-35 disabled:pointer-events-none text-white text-sm sm:text-base font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 shrink-0" />
            <span>Sebelumnya</span>
          </button>

          <div className="hidden sm:flex flex-col items-center text-center px-3">
            <span className="font-mono text-sm font-bold text-white tabular-nums">
              {currentIndex + 1} / {totalPages}
            </span>
            <span className="text-[11px] text-slate-400">
              Geser layar atau gunakan tombol
            </span>
          </div>

          <button
            type="button"
            onClick={goToNext}
            disabled={currentIndex >= totalPages - 1}
            className="flex-1 sm:flex-none sm:min-w-[170px] min-h-[50px] px-4 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-700 disabled:opacity-35 disabled:pointer-events-none text-white text-sm sm:text-base font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="h-5 w-5 shrink-0" />
          </button>
        </div>
      </footer>
    </div>
  );
}
