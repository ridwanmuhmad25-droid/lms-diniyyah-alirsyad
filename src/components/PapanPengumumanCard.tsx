import React from 'react';
import { Megaphone, Pin, Plus, Trash2 } from 'lucide-react';
import { PengumumanItem } from '../types/lms';

interface PapanPengumumanCardProps {
  announcements: PengumumanItem[];
  canManage?: boolean;
  onOpenCreateModal?: () => void;
  onDeleteAnnouncement?: (id: string) => Promise<void> | void;
}

export function PapanPengumumanCard({
  announcements,
  canManage = false,
  onOpenCreateModal,
  onDeleteAnnouncement,
}: PapanPengumumanCardProps) {
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.penting !== b.penting) return a.penting ? -1 : 1;
    return b.createdAtMs - a.createdAtMs;
  });

  const visibleAnnouncements = sortedAnnouncements.slice(0, 4);

  return (
    <div className="h-full bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:-translate-y-0.5 transition-all">
      <div className="space-y-3.5 flex-1 flex flex-col min-h-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-md shadow-indigo-500/25 flex items-center justify-center text-white shrink-0">
              <Megaphone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                Papan Pengumuman Diniyyah
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {canManage
                  ? 'Siaran informasi resmi untuk siswa'
                  : 'Informasi & pengumuman terbaru dari Guru'}
              </p>
            </div>
          </div>

          {canManage && onOpenCreateModal && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="min-h-[32px] px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/25 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Buat Pengumuman</span>
            </button>
          )}
        </div>

        {visibleAnnouncements.length === 0 ? (
          <div className="flex-1 min-h-[210px] p-5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-1.5">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Megaphone className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Belum ada pengumuman aktif saat ini.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
              {canManage
                ? 'Klik "+ Buat Pengumuman" untuk menyampaikan info penting kepada siswa.'
                : 'Pengumuman dari Guru akan muncul otomatis di papan ini.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[270px] overflow-y-auto pr-0.5 flex-1">
            {visibleAnnouncements.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-colors space-y-1.5 ${
                  item.penting
                    ? 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-200 dark:border-rose-500/35'
                    : 'bg-slate-50 dark:bg-[#0B1120] border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    {item.penting && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-bold shadow-xs shrink-0">
                        <Pin className="h-2.5 w-2.5" />
                        <span>Penting</span>
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                        item.targetTingkat === 'Semua'
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700/50'
                          : 'bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700/50'
                      }`}
                    >
                      {item.targetTingkat === 'Semua'
                        ? 'Semua Tingkat'
                        : `Kelas ${item.targetTingkat}`}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
                      {item.createdAt}
                    </span>
                  </div>

                  {canManage && onDeleteAnnouncement && (
                    <button
                      type="button"
                      onClick={() => onDeleteAnnouncement(item.id)}
                      aria-label={`Hapus pengumuman ${item.judul}`}
                      title="Hapus Pengumuman"
                      className="min-h-[28px] min-w-[28px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131C31] text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-700 dark:hover:text-rose-400 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {item.judul}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {item.isi}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="tabular-nums">
          Menampilkan {visibleAnnouncements.length} dari {announcements.length} pengumuman
        </span>
        <span className="text-purple-700 dark:text-purple-400 font-semibold">
          {announcements.some((a) => a.penting)
            ? 'Pengumuman penting disematkan'
            : 'Info Diniyyah'}
        </span>
      </div>
    </div>
  );
}
