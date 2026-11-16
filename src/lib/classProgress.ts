import {
  ALL_CLASSES,
  getGradeFromClass,
  isItemForStudent,
} from '../data/mockData';
import {
  AssignmentSubmission,
  ClassName,
  GradeLevel,
  LearningItem,
  MaterialReadRecord,
  StatistikKelasItem,
  Student,
} from '../types/lms';

export type StudentContributionStatus =
  | 'Sangat Rajin'
  | 'Aktif'
  | 'Perlu Perhatian';

export interface ClassProgressSummary {
  id: string;
  kelas: ClassName;
  tingkat: GradeLevel;
  studentCount: number;
  readDone: number;
  readTotal: number;
  readPct: number;
  taskDone: number;
  taskTotal: number;
  taskPct: number;
  activityPct: number;
  rank: number;
}

export interface StudentContributionDetail {
  student: Student;
  readDone: number;
  readTotal: number;
  readPct: number;
  taskDone: number;
  taskTotal: number;
  taskPct: number;
  contributionPct: number;
  statusLabel: StudentContributionStatus;
}

export function toKelasDocId(kelas: ClassName): string {
  return kelas.replace(/\s+/g, '_');
}

export function computeCombinedScorePct(
  readDone: number,
  readTotal: number,
  taskDone: number,
  taskTotal: number
): { readPct: number; taskPct: number; combinedPct: number } {
  const readPct = readTotal > 0 ? Math.round((readDone / readTotal) * 100) : 0;
  const taskPct = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0;

  let combinedPct = 0;
  if (readTotal > 0 && taskTotal > 0) {
    combinedPct = Math.round((readPct + taskPct) / 2);
  } else if (readTotal > 0) {
    combinedPct = readPct;
  } else if (taskTotal > 0) {
    combinedPct = taskPct;
  }

  return { readPct, taskPct, combinedPct };
}

function buildLookupSets(
  readRecords: MaterialReadRecord[],
  submissions: AssignmentSubmission[]
) {
  const readSet = new Set<string>();
  for (const r of readRecords) {
    readSet.add(`${r.itemId}__${r.studentNis}`);
  }

  const doneTaskSet = new Set<string>();
  for (const s of submissions) {
    if (s.status === 'Selesai') {
      doneTaskSet.add(`${s.itemId}__${s.studentNis}`);
    }
  }

  return { readSet, doneTaskSet };
}

function evaluateStudentCounts(
  student: Student,
  learningItems: LearningItem[],
  readSet: Set<string>,
  doneTaskSet: Set<string>
): { readDone: number; readTotal: number; taskDone: number; taskTotal: number } {
  let readDone = 0;
  let readTotal = 0;
  let taskDone = 0;
  let taskTotal = 0;

  for (const item of learningItems) {
    if (!isItemForStudent(item, student)) continue;
    const key = `${item.id}__${student.nis}`;
    if (item.type === 'materi') {
      readTotal += 1;
      if (readSet.has(key)) readDone += 1;
    } else {
      taskTotal += 1;
      if (doneTaskSet.has(key)) taskDone += 1;
    }
  }

  return { readDone, readTotal, taskDone, taskTotal };
}

export function computeAllClassProgress(
  students: Student[],
  learningItems: LearningItem[],
  readRecords: MaterialReadRecord[],
  submissions: AssignmentSubmission[]
): ClassProgressSummary[] {
  const { readSet, doneTaskSet } = buildLookupSets(readRecords, submissions);

  const studentsByClass = new Map<ClassName, Student[]>();
  for (const cls of ALL_CLASSES) {
    studentsByClass.set(cls, []);
  }
  for (const st of students) {
    const bucket = studentsByClass.get(st.kelas);
    if (bucket) {
      bucket.push(st);
    }
  }

  const summaries: Omit<ClassProgressSummary, 'rank'>[] = ALL_CLASSES.map(
    (kelas) => {
      const classStudents = studentsByClass.get(kelas) || [];
      let readDone = 0;
      let readTotal = 0;
      let taskDone = 0;
      let taskTotal = 0;

      for (const st of classStudents) {
        const counts = evaluateStudentCounts(
          st,
          learningItems,
          readSet,
          doneTaskSet
        );
        readDone += counts.readDone;
        readTotal += counts.readTotal;
        taskDone += counts.taskDone;
        taskTotal += counts.taskTotal;
      }

      const { readPct, taskPct, combinedPct } = computeCombinedScorePct(
        readDone,
        readTotal,
        taskDone,
        taskTotal
      );

      return {
        id: toKelasDocId(kelas),
        kelas,
        tingkat: getGradeFromClass(kelas),
        studentCount: classStudents.length,
        readDone,
        readTotal,
        readPct,
        taskDone,
        taskTotal,
        taskPct,
        activityPct: combinedPct,
      };
    }
  );

  summaries.sort((a, b) => {
    if (b.activityPct !== a.activityPct) return b.activityPct - a.activityPct;
    const sumA = a.readPct + a.taskPct;
    const sumB = b.readPct + b.taskPct;
    if (sumB !== sumA) return sumB - sumA;
    if (b.studentCount !== a.studentCount) return b.studentCount - a.studentCount;
    return a.kelas.localeCompare(b.kelas);
  });

  return summaries.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

export function computeStudentsInClassProgress(
  kelas: ClassName,
  students: Student[],
  learningItems: LearningItem[],
  readRecords: MaterialReadRecord[],
  submissions: AssignmentSubmission[]
): StudentContributionDetail[] {
  const { readSet, doneTaskSet } = buildLookupSets(readRecords, submissions);
  const classStudents = students.filter((s) => s.kelas === kelas);

  const details: StudentContributionDetail[] = classStudents.map((student) => {
    const { readDone, readTotal, taskDone, taskTotal } = evaluateStudentCounts(
      student,
      learningItems,
      readSet,
      doneTaskSet
    );
    const { readPct, taskPct, combinedPct } = computeCombinedScorePct(
      readDone,
      readTotal,
      taskDone,
      taskTotal
    );

    const statusLabel: StudentContributionStatus =
      combinedPct >= 100
        ? 'Sangat Rajin'
        : combinedPct >= 50
        ? 'Aktif'
        : 'Perlu Perhatian';

    return {
      student,
      readDone,
      readTotal,
      readPct,
      taskDone,
      taskTotal,
      taskPct,
      contributionPct: combinedPct,
      statusLabel,
    };
  });

  details.sort((a, b) => {
    if (b.contributionPct !== a.contributionPct) {
      return b.contributionPct - a.contributionPct;
    }
    const doneB = b.readDone + b.taskDone;
    const doneA = a.readDone + a.taskDone;
    if (doneB !== doneA) return doneB - doneA;
    return a.student.nama.localeCompare(b.student.nama);
  });

  return details;
}

export function buildSiswaClassLeaderboard(
  statistikKelas: StatistikKelasItem[]
): ClassProgressSummary[] {
  const byClass = new Map<ClassName, StatistikKelasItem>();
  for (const item of statistikKelas) {
    byClass.set(item.kelas, item);
  }

  const list: Omit<ClassProgressSummary, 'rank'>[] = ALL_CLASSES.map((kelas) => {
    const existing = byClass.get(kelas);
    if (existing) {
      return {
        id: existing.id,
        kelas: existing.kelas,
        tingkat: existing.tingkat,
        studentCount: existing.studentCount,
        readDone: existing.readDone,
        readTotal: existing.readTotal,
        readPct: existing.readPct,
        taskDone: existing.taskDone,
        taskTotal: existing.taskTotal,
        taskPct: existing.taskPct,
        activityPct: existing.activityPct,
      };
    }

    return {
      id: toKelasDocId(kelas),
      kelas,
      tingkat: getGradeFromClass(kelas),
      studentCount: 0,
      readDone: 0,
      readTotal: 0,
      readPct: 0,
      taskDone: 0,
      taskTotal: 0,
      taskPct: 0,
      activityPct: 0,
    };
  });

  list.sort((a, b) => {
    if (b.activityPct !== a.activityPct) return b.activityPct - a.activityPct;
    const sumA = a.readPct + a.taskPct;
    const sumB = b.readPct + b.taskPct;
    if (sumB !== sumA) return sumB - sumA;
    if (b.studentCount !== a.studentCount) return b.studentCount - a.studentCount;
    return a.kelas.localeCompare(b.kelas);
  });

  return list.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}
