import React, { useState } from 'react';
import {
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import {
  DEFAULT_STUDENT_PASSWORD,
  GURU_PROFILE,
  toStudentAuthEmail,
} from '../data/mockData';
import { auth, googleProvider } from '../lib/firebase';

interface LoginViewProps {
  externalError?: string | null;
  onClearExternalError?: () => void;
  isDark?: boolean;
  onToggleDark?: () => void;
}

export function LoginView({
  externalError,
  onClearExternalError,
  isDark = false,
  onToggleDark,
}: LoginViewProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const displayedError = errorMsg || externalError || '';

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    onClearExternalError?.();
    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Login Google dibatalkan sebelum selesai.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('Popup login diblokir oleh browser. Izinkan popup lalu coba lagi.');
      } else {
        setErrorMsg('Gagal masuk menggunakan akun Google. Silakan coba lagi.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    onClearExternalError?.();

    const trimmedId = identifier.trim();
    if (!trimmedId || !password) {
      setErrorMsg('Mohon masukkan NIS atau Email beserta password Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isEmailInput = trimmedId.includes('@');
      const authEmail = isEmailInput
        ? trimmedId.toLowerCase()
        : toStudentAuthEmail(trimmedId);

      try {
        await signInWithEmailAndPassword(auth, authEmail, password);
      } catch (err) {
        const code = (err as { code?: string })?.code || '';

        // First-time student activation when logging in with NIS and default password
        if (
          !isEmailInput &&
          password === DEFAULT_STUDENT_PASSWORD &&
          (code === 'auth/user-not-found' || code === 'auth/invalid-credential')
        ) {
          try {
            await createUserWithEmailAndPassword(
              auth,
              authEmail,
              DEFAULT_STUDENT_PASSWORD
            );
            return;
          } catch (createErr) {
            const createCode = (createErr as { code?: string })?.code || '';
            if (createCode === 'auth/email-already-in-use') {
              setErrorMsg('NIS atau password yang Anda masukkan salah.');
              return;
            }
            if (createCode === 'auth/operation-not-allowed') {
              setErrorMsg(
                'Login Email/Password belum diaktifkan di Firebase Console. Aktifkan provider Email/Password atau gunakan tombol Masuk dengan Google.'
              );
              return;
            }
            throw createErr;
          }
        }

        if (
          code === 'auth/invalid-credential' ||
          code === 'auth/wrong-password' ||
          code === 'auth/user-not-found'
        ) {
          setErrorMsg('NIS/Email atau password tidak sesuai.');
        } else if (code === 'auth/operation-not-allowed') {
          setErrorMsg(
            'Metode login Email/Password belum diaktifkan di Firebase Authentication. Gunakan tombol Masuk dengan Google atau aktifkan Email/Password di Firebase Console.'
          );
        } else if (code === 'auth/too-many-requests') {
          setErrorMsg(
            'Terlalu banyak percobaan login. Silakan tunggu beberapa saat lalu coba lagi.'
          );
        } else {
          setErrorMsg('Gagal masuk ke Firebase Authentication. Periksa kembali kredensial Anda.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex flex-col justify-between">
      {onToggleDark && (
        <div className="w-full max-w-5xl mx-auto px-4 pt-4 sm:px-6 lg:px-8 flex justify-end">
          <button
            type="button"
            onClick={onToggleDark}
            aria-label={isDark ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
            className="min-h-[40px] min-w-[40px] px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C31] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 text-xs font-semibold shadow-xs transition-colors"
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                <span>Mode Terang</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-indigo-600" />
                <span>Mode Gelap</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#131C31] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Left Panel: Electric Indigo-Purple-Cyan Academic Overview */}
          <div className="lg:col-span-5 bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap">
                  LMS Mapel Diniyyah
                </span>
              </div>

              <h1 className="mt-8 font-display text-2xl sm:text-3xl font-bold leading-tight text-balance">
                Portal Pembelajaran Terpadu Aqidah, Tahfidz & Bahasa Arab
              </h1>
              <p className="mt-3 text-sm text-blue-100/90 leading-relaxed">
                Akses materi pembelajaran, E-Book Jilid interaktif, setoran hafalan, dan pengumpulan tugas secara real-time melalui Firebase.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/15 space-y-3 text-xs sm:text-sm text-blue-50">
              <div className="flex items-start justify-between gap-4">
                <span className="font-semibold text-white whitespace-nowrap">Kelas X</span>
                <span className="text-right text-blue-100">Aqidah (5 Kelas)</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="font-semibold text-white whitespace-nowrap">Kelas XI</span>
                <span className="text-right text-blue-100">Tahfidz/Tahsin & Bahasa Arab (5 Kelas)</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="font-semibold text-white whitespace-nowrap">Kelas XII</span>
                <span className="text-right text-blue-100">Tahfidz/Tahsin & Bahasa Arab (2 Kelas)</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Firebase Auth Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Masuk ke Akun Anda
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Gunakan akun Google atau <span className="font-semibold text-slate-900 dark:text-slate-100">NIS / Email</span> yang terdaftar di Firebase Authentication.
              </p>

              {/* Google Sign-In Button */}
              <div className="mt-5">
                <button
                  type="button"
                  disabled={isGoogleLoading || isSubmitting}
                  onClick={handleGoogleSignIn}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-55 text-slate-900 dark:text-slate-100 font-semibold text-sm flex items-center justify-center gap-2.5 transition-colors"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  <span>Masuk dengan Google</span>
                </button>
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  atau NIS / Email
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-identifier"
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-1.5"
                  >
                    NIS atau Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      id="login-identifier"
                      type="text"
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Masukkan NIS siswa atau email"
                      className="w-full min-h-[44px] pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-[#0B1120] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full min-h-[44px] pl-10 pr-11 py-2.5 text-sm bg-white dark:bg-[#0B1120] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {displayedError && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs sm:text-sm text-rose-700 dark:text-rose-300"
                  >
                    {displayedError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full min-h-[46px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-55 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  <span>{isSubmitting ? 'Memproses...' : 'Masuk'}</span>
                </button>
              </form>

              {/* Student Default Password Info */}
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Password default aktivasi awal siswa: <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{DEFAULT_STUDENT_PASSWORD}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
        LMS Mapel Diniyyah · Guru Pengampu: {GURU_PROFILE.nama}
      </footer>
    </div>
  );
}
