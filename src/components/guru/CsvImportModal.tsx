import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react';
import {
  ALL_CLASSES,
  getGradeFromClass,
  isValidClassName,
} from '../../data/mockData';
import { ClassName, Student } from '../../types/lms';

interface CsvImportModalProps {
  isOpen: boolean;
  existingNisSet: Set<string>;
  onClose: () => void;
  onImport: (newStudents: Student[]) => void;
}

interface ParsedRow {
  lineNumber: number;
  nama: string;
  nis: string;
  kelasRaw: string;
  validKelas?: ClassName;
  tahfidzCategory?: 'Jilid' | 'Tahfidz';
  tahfidzLevel?: string;
  error?: string;
}

const SAMPLE_CSV_TEXT = `Nama,NIS,Kelas
Fauzan Abdillah,241091,X RPL
Aisyah Humaira,241092,X TKJ
Rendra Kurniawan,231091,XI AK
Nabila Syakira,231092,XI TP 1
Tariq Ziyad,221091,XII RPL`;

export function CsvImportModal({
  isOpen,
  existingNisSet,
  onClose,
  onImport,
}: CsvImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rawCsv, setRawCsv] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseCsvText = (text: string): ParsedRow[] => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    const seenInBatch = new Set<string>();
    const rows: ParsedRow[] = [];

    lines.forEach((line, idx) => {
      // Skip header line if detected
      if (
        idx === 0 &&
        line.toLowerCase().includes('nama') &&
        line.toLowerCase().includes('nis') &&
        line.toLowerCase().includes('kelas')
      ) {
        return;
      }

      const separator = line.includes(';') ? ';' : ',';
      const cols = line.split(separator).map((c) => c.trim());
      const nama = cols[0] || '';
      const nis = cols[1] || '';
      const kelasRaw = cols[2] || '';
      const kategoriRaw = (cols[3] || '').toLowerCase();
      const levelRaw = (cols[4] || '').trim();

      let error: string | undefined;
      let validKelas: ClassName | undefined;

      if (!nama) {
        error = 'Nama kosong';
      } else if (!nis) {
        error = 'NIS kosong';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(nis)) {
        error = 'NIS hanya boleh huruf/angka/-/_';
      } else if (existingNisSet.has(nis)) {
        error = 'NIS sudah terdaftar';
      } else if (seenInBatch.has(nis)) {
        error = 'NIS duplikat di file';
      } else if (!isValidClassName(kelasRaw)) {
        error = `Kelas "${kelasRaw}" tidak valid`;
      } else {
        validKelas = kelasRaw.trim() as ClassName;
      }

      if (nis) {
        seenInBatch.add(nis);
      }

      const tahfidzCategory: 'Jilid' | 'Tahfidz' | undefined =
        kategoriRaw === 'jilid'
          ? 'Jilid'
          : kategoriRaw === 'tahfidz'
          ? 'Tahfidz'
          : undefined;

      rows.push({
        lineNumber: idx + 1,
        nama,
        nis,
        kelasRaw,
        validKelas,
        tahfidzCategory,
        tahfidzLevel: levelRaw || undefined,
        error,
      });
    });

    return rows;
  };

  const parsedRows = parseCsvText(rawCsv);
  const validRows = parsedRows.filter((r) => !r.error && r.validKelas);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = typeof ev.target?.result === 'string' ? ev.target.result : '';
      setRawCsv(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setSelectedFileName('template_data_siswa_diniyyah.csv');
    setRawCsv(SAMPLE_CSV_TEXT);
  };

  const handleConfirmImport = () => {
    if (validRows.length === 0) return;

    const newStudents: Student[] = validRows.map((row) => {
      const kelas = row.validKelas as ClassName;
      return {
        id: row.nis,
        nis: row.nis,
        nama: row.nama,
        kelas,
        tingkat: getGradeFromClass(kelas),
        usingDefaultPassword: true,
        ...(row.tahfidzCategory ? { tahfidzCategory: row.tahfidzCategory } : {}),
        ...(row.tahfidzLevel ? { tahfidzLevel: row.tahfidzLevel } : {}),
      };
    });

    onImport(newStudents);
    setRawCsv('');
    setSelectedFileName(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-modal-title"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500" />
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h3 id="csv-modal-title" className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Import Data Siswa (CSV)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Simulasi unggah massal kolom: Nama, NIS, Kelas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal import CSV"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Upload / Sample Toolbar */}
          <div className="p-4 rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-500/40 bg-slate-50 dark:bg-[#0B1120] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {selectedFileName ? `File dipilih: ${selectedFileName}` : 'Pilih berkas CSV atau gunakan contoh data'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Format kelas valid: {ALL_CLASSES.join(', ')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Pilih File CSV</span>
              </button>
              <button
                type="button"
                onClick={handleLoadSample}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/25 text-xs font-semibold text-indigo-700 dark:text-indigo-300 whitespace-nowrap transition-colors"
              >
                Muat Contoh CSV
              </button>
            </div>
          </div>

          {/* Editable CSV Textarea */}
          <div>
            <label htmlFor="csv-textarea" className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
              Isi Data CSV (Nama,NIS,Kelas)
            </label>
            <textarea
              id="csv-textarea"
              rows={5}
              value={rawCsv}
              onChange={(e) => setRawCsv(e.target.value)}
              placeholder={`Nama,NIS,Kelas\nFauzan Abdillah,241091,X RPL\nNabila Syakira,231092,XI TP 1`}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Pratinjau Data ({parsedRows.length} baris)
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                  {validRows.length} siap diimpor
                </span>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Nama</th>
                        <th className="py-2.5 px-3 font-semibold">NIS</th>
                        <th className="py-2.5 px-3 font-semibold">Kelas</th>
                        <th className="py-2.5 px-3 font-semibold">Validasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {parsedRows.map((row) => (
                        <tr key={`${row.lineNumber}-${row.nis}`} className="bg-white dark:bg-[#131C31]">
                          <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">
                            {row.nama || '-'}
                          </td>
                          <td className="py-2 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                            {row.nis || '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-900 dark:text-slate-200">{row.kelasRaw || '-'}</td>
                          <td className="py-2 px-3">
                            {row.error ? (
                              <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-medium">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                <span>{row.error}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                <span>Valid</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120]/70 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C31] hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={validRows.length === 0}
            onClick={handleConfirmImport}
            className="min-h-[42px] px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 disabled:opacity-45 disabled:pointer-events-none text-sm font-semibold text-white whitespace-nowrap transition-all"
          >
            Import {validRows.length > 0 ? `${validRows.length} Siswa` : 'Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
