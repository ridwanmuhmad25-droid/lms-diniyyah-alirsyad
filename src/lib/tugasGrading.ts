import {
  GradingStatus,
  GuruSoalDraft,
  KunciMenjodohkanPair,
  KunciSoalItem,
  KunciTugasDocument,
  LearningItem,
  StudentStructuredAnswerValue,
  TugasDocument,
  TugasSoalItem,
} from '../types/lms';

/**
 * Normalizes short answer text for smart matching:
 * - Strips Arabic harakat/tashkeel, Quranic annotation marks, dagger alef, and tatweel
 * - Trims leading/trailing whitespace & collapses repeated spaces
 * - Converts to lowercase
 */
export function normalizeShortAnswer(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (arr.length >= 2 && arr.every((item, idx) => item === items[idx])) {
    const first = arr.shift();
    if (first !== undefined) {
      arr.push(first);
    }
  }
  return arr;
}

export function createEmptySoalDraft(
  type: GuruSoalDraft['type'] = 'pilihan_ganda',
  seed = Date.now()
): GuruSoalDraft {
  return {
    id: `soal-${seed}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    pertanyaan: '',
    poin: type === 'essay' ? 25 : type === 'menjodohkan' ? 20 : 10,
    opsiA: '',
    opsiB: '',
    opsiC: '',
    opsiD: '',
    kunciPg: 'A',
    kunciIsianRaw: '',
    pasangan: [
      { id: `pair-${seed}-1`, kiriText: '', kananText: '' },
      { id: `pair-${seed}-2`, kiriText: '', kananText: '' },
    ],
    pedomanEssay: '',
  };
}

export function buildTugasAndKunciFromDrafts(
  item: LearningItem,
  drafts: GuruSoalDraft[],
  authorUid: string
): {
  tugasDoc: TugasDocument;
  kunciDoc: KunciTugasDocument;
  totalPoin: number;
  hasEssay: boolean;
} {
  const soalList: TugasSoalItem[] = [];
  const kunciList: KunciSoalItem[] = [];

  let totalPoin = 0;
  let hasEssay = false;

  drafts.forEach((draft) => {
    const poin = Math.max(0, Math.round(Number(draft.poin) || 0));
    totalPoin += poin;

    if (draft.type === 'pilihan_ganda') {
      soalList.push({
        id: draft.id,
        type: 'pilihan_ganda',
        pertanyaan: draft.pertanyaan.trim(),
        poin,
        opsi: {
          A: draft.opsiA.trim(),
          B: draft.opsiB.trim(),
          C: draft.opsiC.trim(),
          D: draft.opsiD.trim(),
        },
      });
      kunciList.push({
        soalId: draft.id,
        type: 'pilihan_ganda',
        poin,
        kunciPg: draft.kunciPg,
      });
      return;
    }

    if (draft.type === 'isian_singkat') {
      const variasiBenar = draft.kunciIsianRaw
        .split(/[,،]/)
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
      soalList.push({
        id: draft.id,
        type: 'isian_singkat',
        pertanyaan: draft.pertanyaan.trim(),
        poin,
      });
      kunciList.push({
        soalId: draft.id,
        type: 'isian_singkat',
        poin,
        variasiBenar,
      });
      return;
    }

    if (draft.type === 'menjodohkan') {
      const kiriList: Array<{ id: string; text: string }> = [];
      const kananPool: Array<{ id: string; text: string }> = [];
      const pasanganKunci: KunciMenjodohkanPair[] = [];

      draft.pasangan.forEach((p, idx) => {
        const kiriId = `kiri-${draft.id}-${idx + 1}`;
        const kananId = `kanan-${draft.id}-${Math.random()
          .toString(36)
          .slice(2, 7)}-${idx + 1}`;
        const kiriText = p.kiriText.trim();
        const kananText = p.kananText.trim();

        kiriList.push({ id: kiriId, text: kiriText });
        kananPool.push({ id: kananId, text: kananText });
        pasanganKunci.push({
          kiriId,
          kananId,
          kiriText,
          kananText,
        });
      });

      soalList.push({
        id: draft.id,
        type: 'menjodohkan',
        pertanyaan: draft.pertanyaan.trim(),
        poin,
        kiriList,
        kananList: shuffleArray(kananPool),
      });
      kunciList.push({
        soalId: draft.id,
        type: 'menjodohkan',
        poin,
        pasanganKunci,
      });
      return;
    }

    // Essay
    hasEssay = true;
    soalList.push({
      id: draft.id,
      type: 'essay',
      pertanyaan: draft.pertanyaan.trim(),
      poin,
    });
    kunciList.push({
      soalId: draft.id,
      type: 'essay',
      poin,
      pedomanEssay: draft.pedomanEssay.trim(),
    });
  });

  const durasiMenit = item.durasiMenit ?? 30;

  return {
    tugasDoc: {
      id: item.id,
      itemId: item.id,
      judul: item.judul,
      tingkat: item.tingkat,
      targetKelas: item.targetKelas,
      mapel: item.mapel,
      durasiMenit,
      totalPoin,
      hasEssay,
      soalList,
      authorUid,
    },
    kunciDoc: {
      id: item.id,
      itemId: item.id,
      tingkat: item.tingkat,
      mapel: item.mapel,
      kunciList,
      authorUid,
    },
    totalPoin,
    hasEssay,
  };
}

export function reconstructDraftsFromTugasAndKunci(
  tugasDoc: TugasDocument,
  kunciDoc?: KunciTugasDocument | null
): GuruSoalDraft[] {
  return tugasDoc.soalList.map((soal, index) => {
    const kunci = kunciDoc?.kunciList.find((k) => k.soalId === soal.id);

    if (soal.type === 'pilihan_ganda') {
      return {
        id: soal.id,
        type: 'pilihan_ganda',
        pertanyaan: soal.pertanyaan,
        poin: soal.poin,
        opsiA: soal.opsi?.A || '',
        opsiB: soal.opsi?.B || '',
        opsiC: soal.opsi?.C || '',
        opsiD: soal.opsi?.D || '',
        kunciPg: kunci?.kunciPg || 'A',
        kunciIsianRaw: '',
        pasangan: [
          { id: `pair-${index}-1`, kiriText: '', kananText: '' },
          { id: `pair-${index}-2`, kiriText: '', kananText: '' },
        ],
        pedomanEssay: '',
      };
    }

    if (soal.type === 'isian_singkat') {
      return {
        id: soal.id,
        type: 'isian_singkat',
        pertanyaan: soal.pertanyaan,
        poin: soal.poin,
        opsiA: '',
        opsiB: '',
        opsiC: '',
        opsiD: '',
        kunciPg: 'A',
        kunciIsianRaw: (kunci?.variasiBenar || []).join(', '),
        pasangan: [
          { id: `pair-${index}-1`, kiriText: '', kananText: '' },
          { id: `pair-${index}-2`, kiriText: '', kananText: '' },
        ],
        pedomanEssay: '',
      };
    }

    if (soal.type === 'menjodohkan') {
      const pairsFromKunci = kunci?.pasanganKunci?.map((p, pIdx) => ({
        id: `pair-${soal.id}-${pIdx + 1}`,
        kiriText: p.kiriText,
        kananText: p.kananText,
      }));
      const fallbackPairs = (soal.kiriList || []).map((k, pIdx) => ({
        id: `pair-${soal.id}-${pIdx + 1}`,
        kiriText: k.text,
        kananText: soal.kananList?.[pIdx]?.text || '',
      }));
      const pasangan =
        pairsFromKunci && pairsFromKunci.length >= 2
          ? pairsFromKunci
          : fallbackPairs.length >= 2
          ? fallbackPairs
          : [
              { id: `pair-${soal.id}-1`, kiriText: '', kananText: '' },
              { id: `pair-${soal.id}-2`, kiriText: '', kananText: '' },
            ];

      return {
        id: soal.id,
        type: 'menjodohkan',
        pertanyaan: soal.pertanyaan,
        poin: soal.poin,
        opsiA: '',
        opsiB: '',
        opsiC: '',
        opsiD: '',
        kunciPg: 'A',
        kunciIsianRaw: '',
        pasangan,
        pedomanEssay: '',
      };
    }

    return {
      id: soal.id,
      type: 'essay',
      pertanyaan: soal.pertanyaan,
      poin: soal.poin,
      opsiA: '',
      opsiB: '',
      opsiC: '',
      opsiD: '',
      kunciPg: 'A',
      kunciIsianRaw: '',
      pasangan: [
        { id: `pair-${index}-1`, kiriText: '', kananText: '' },
        { id: `pair-${index}-2`, kiriText: '', kananText: '' },
      ],
      pedomanEssay: kunci?.pedomanEssay || '',
    };
  });
}

function roundScore(val: number): number {
  return Math.round(val * 100) / 100;
}

export function gradeStructuredSubmission(
  kunciDoc: KunciTugasDocument,
  structuredAnswers: Record<string, StudentStructuredAnswerValue>
): {
  itemScores: Record<string, number>;
  autoScore: number;
  essayScore: number;
  finalScore: number;
  maxScore: number;
  gradingStatus: GradingStatus;
} {
  const itemScores: Record<string, number> = {};
  let autoScore = 0;
  let maxScore = 0;
  let hasEssay = false;

  kunciDoc.kunciList.forEach((kunci) => {
    const poin = Number(kunci.poin) || 0;
    maxScore += poin;
    const rawAns = structuredAnswers[kunci.soalId];

    if (kunci.type === 'pilihan_ganda') {
      const chosen = typeof rawAns === 'string' ? rawAns.trim() : '';
      const score = chosen && chosen === kunci.kunciPg ? poin : 0;
      itemScores[kunci.soalId] = score;
      autoScore += score;
      return;
    }

    if (kunci.type === 'isian_singkat') {
      const normalizedStudent =
        typeof rawAns === 'string' ? normalizeShortAnswer(rawAns) : '';
      const acceptedList = (kunci.variasiBenar || [])
        .map((v) => normalizeShortAnswer(v))
        .filter((v) => v.length > 0);
      const isCorrect =
        normalizedStudent.length > 0 && acceptedList.includes(normalizedStudent);
      const score = isCorrect ? poin : 0;
      itemScores[kunci.soalId] = score;
      autoScore += score;
      return;
    }

    if (kunci.type === 'menjodohkan') {
      const pairs = kunci.pasanganKunci || [];
      const totalPairs = pairs.length;
      const ansMap =
        rawAns && typeof rawAns === 'object' && !Array.isArray(rawAns)
          ? rawAns
          : {};
      let correctCount = 0;
      pairs.forEach((pair) => {
        if (ansMap[pair.kiriId] === pair.kananId) {
          correctCount += 1;
        }
      });
      const score =
        totalPairs > 0 ? roundScore((poin / totalPairs) * correctCount) : 0;
      itemScores[kunci.soalId] = score;
      autoScore += score;
      return;
    }

    // Essay: awaits teacher grading
    hasEssay = true;
    itemScores[kunci.soalId] = 0;
  });

  autoScore = roundScore(autoScore);
  maxScore = roundScore(maxScore);

  return {
    itemScores,
    autoScore,
    essayScore: 0,
    finalScore: autoScore,
    maxScore,
    gradingStatus: hasEssay ? 'waiting_essay' : 'graded',
  };
}

export function buildReadableSummaryFromStructuredAnswers(
  tugasDoc: TugasDocument,
  structuredAnswers: Record<string, StudentStructuredAnswerValue>
): string {
  return tugasDoc.soalList
    .map((soal, idx) => {
      const ans = structuredAnswers[soal.id];
      if (soal.type === 'pilihan_ganda') {
        const val = typeof ans === 'string' && ans ? ans : '-';
        return `No. ${idx + 1} (PG): ${val}`;
      }
      if (soal.type === 'isian_singkat') {
        const val = typeof ans === 'string' && ans.trim() ? ans.trim() : '-';
        return `No. ${idx + 1} (Isian): ${val}`;
      }
      if (soal.type === 'menjodohkan') {
        const mapVal =
          ans && typeof ans === 'object' ? (ans as Record<string, string>) : {};
        const pairSummary = (soal.kiriList || [])
          .map((k) => {
            const pickedId = mapVal[k.id];
            const pickedText =
              soal.kananList?.find((r) => r.id === pickedId)?.text || '-';
            return `${k.text} -> ${pickedText}`;
          })
          .join('; ');
        return `No. ${idx + 1} (Menjodohkan): ${pairSummary || '-'}`;
      }
      const essayVal = typeof ans === 'string' && ans.trim() ? ans.trim() : '-';
      return `No. ${idx + 1} (Essay): ${essayVal}`;
    })
    .join('\n');
}
