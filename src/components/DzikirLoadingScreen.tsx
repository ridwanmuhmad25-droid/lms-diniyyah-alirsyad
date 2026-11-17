import React from 'react';

interface DzikirWordConfig {
  text: string;
  wordClass: string;
  dropClass: string;
}

const DZIKIR_WORDS: DzikirWordConfig[] = [
  { text: 'Subhanallah', wordClass: 'dzikir-word-1', dropClass: 'dzikir-drop-1' },
  { text: 'Alhamdulillah', wordClass: 'dzikir-word-2', dropClass: 'dzikir-drop-2' },
  { text: 'Allahuakbar', wordClass: 'dzikir-word-3', dropClass: 'dzikir-drop-3' },
];

function getDropletVector(index: number, total: number): React.CSSProperties {
  const center = (total - 1) / 2;
  const offset = index - center;
  const jitter = index % 2 === 0 ? -4 : 4;
  const dx = Math.round(offset * 7 + jitter);
  const dy = Math.round(-18 - ((index * 7) % 14) + Math.abs(offset) * 1.5);
  const rot = Math.round(offset * 7 + (index % 2 === 0 ? -14 : 14));

  return {
    '--dx': `${dx}px`,
    '--dy': `${dy}px`,
    '--rot': `${rot}deg`,
  } as React.CSSProperties;
}

export function DzikirLoadingScreen() {
  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex flex-col items-center justify-center gap-2.5 select-none overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Memuat aplikasi"
    >
      {DZIKIR_WORDS.map((word) => {
        const letters = word.text.split('');
        return (
          <span
            key={word.text}
            className={`inline-flex text-sm font-medium text-black dark:text-white tracking-wide will-change-transform ${word.wordClass}`}
          >
            {letters.map((char, idx) => (
              <span
                key={`${word.text}-${idx}`}
                aria-hidden="true"
                className={`inline-block will-change-transform ${word.dropClass}`}
                style={getDropletVector(idx, letters.length)}
              >
                {char}
              </span>
            ))}
            <span className="sr-only">{word.text}</span>
          </span>
        );
      })}
    </div>
  );
}
