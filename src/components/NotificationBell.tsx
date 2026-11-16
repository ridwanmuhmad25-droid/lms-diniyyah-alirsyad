import React, { useEffect, useRef, useState } from 'react';
import { Bell, BookOpen, CheckCheck, ClipboardCheck, Inbox, Megaphone } from 'lucide-react';
import { getSubjectTheme } from '../lib/themePalette';
import { NotifikasiItem } from '../types/lms';

interface NotificationBellProps {
  notifications: NotifikasiItem[];
  unreadCount: number;
  isNotifRead: (notif: NotifikasiItem) => boolean;
  onSelectNotification: (notif: NotifikasiItem) => void;
  onMarkAllRead?: () => void;
}

export function NotificationBell({
  notifications,
  unreadCount,
  isNotifRead,
  onSelectNotification,
  onMarkAllRead,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={
          unreadCount > 0
            ? `Notifikasi (${unreadCount} belum dibaca)`
            : 'Notifikasi'
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Notifikasi"
        className="relative min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700/90 bg-white dark:bg-[#131C31] hover:bg-indigo-50 dark:hover:bg-indigo-500/15 text-slate-700 dark:text-slate-200 transition-colors"
      >
        <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-bold font-mono tabular-nums flex items-center justify-center shadow-sm shadow-rose-500/30 ring-2 ring-white dark:ring-[#0B1120]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Daftar Notifikasi"
          className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50"
        >
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-cyan-500/10">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                Notifikasi
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {unreadCount > 0
                  ? `${unreadCount} pembaruan belum dibaca`
                  : 'Semua notifikasi telah dibaca'}
              </p>
            </div>
            {unreadCount > 0 && onMarkAllRead && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="min-h-[32px] px-2.5 py-1 rounded-full text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Tandai Dibaca</span>
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="mx-auto h-10 w-10 rounded-xl bg-slate-100 dark:bg-[#0B1120] flex items-center justify-center text-slate-400 dark:text-slate-500">
                <Inbox className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Belum ada notifikasi terbaru.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
              {notifications.map((notif) => {
                const read = isNotifRead(notif);
                const isMaterial = notif.type === 'materi';
                const isAnnouncement = notif.type === 'pengumuman' || notif.mapel === 'Umum';
                const accentText =
                  isAnnouncement || notif.mapel === 'Umum'
                    ? 'text-purple-600 dark:text-purple-400'
                    : getSubjectTheme(notif.mapel).accentText;
                const categoryLabel = isAnnouncement
                  ? 'Pengumuman Diniyyah'
                  : notif.mapel;
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onSelectNotification(notif);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      read ? 'opacity-80' : 'bg-indigo-50/40 dark:bg-indigo-500/5'
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isAnnouncement
                          ? 'bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-500/25'
                          : isMaterial
                          ? 'bg-teal-500/15 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-500/25'
                          : 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/25'
                      }`}
                    >
                      {isAnnouncement ? (
                        <Megaphone className="h-4 w-4" />
                      ) : isMaterial ? (
                        <BookOpen className="h-4 w-4" />
                      ) : (
                        <ClipboardCheck className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[11px] font-semibold truncate ${accentText}`}>
                          {categoryLabel}
                          {notif.targetKelas !== 'ALL'
                            ? ` · ${notif.targetKelas}`
                            : ''}
                        </span>
                        <span className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-slate-500 shrink-0">
                          {notif.createdAt}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {notif.judul}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {notif.pesan}
                      </p>
                    </div>

                    {!read && (
                      <span
                        aria-label="Belum dibaca"
                        className="mt-2 h-2 w-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
