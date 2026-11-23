/**
 * يجمع محتوى كل الصفوف في شكل موحّد (SubjectContent + Questions) مع معرّفات ثابتة.
 * المعرّفات بصيغة: g5-math-u1-l2 للدرس، و g5-math-u1-l2-q3 للسؤال.
 */
import { GRADE_SUBJECTS, GRADES, subjectId, type GradeNumber } from '@/config/curriculum';
import type { Question, SubjectContent } from '@/lib/types';

import type { GradeSeed } from './builder';
import grade1 from './content/grade01';
import grade2 from './content/grade02';
import grade3 from './content/grade03';
import grade4 from './content/grade04';
import grade5 from './content/grade05';
import grade6 from './content/grade06';
import grade7 from './content/grade07';
import grade8 from './content/grade08';
import grade9 from './content/grade09';
import grade10 from './content/grade10';
import grade11 from './content/grade11';
import grade12 from './content/grade12';
import grade1t2 from './content/term2/grade01';
import grade2t2 from './content/term2/grade02';
import grade3t2 from './content/term2/grade03';
import grade4t2 from './content/term2/grade04';
import grade5t2 from './content/term2/grade05';
import grade6t2 from './content/term2/grade06';
import grade7t2 from './content/term2/grade07';
import grade8t2 from './content/term2/grade08';
import grade9t2 from './content/term2/grade09';
import grade10t2 from './content/term2/grade10';
import grade11t2 from './content/term2/grade11';
import grade12t2 from './content/term2/grade12';
import reviewedIds from './reviewed.json';

const TERM1: Record<GradeNumber, GradeSeed> = {
  1: grade1,
  2: grade2,
  3: grade3,
  4: grade4,
  5: grade5,
  6: grade6,
  7: grade7,
  8: grade8,
  9: grade9,
  10: grade10,
  11: grade11,
  12: grade12,
};

const TERM2: Record<GradeNumber, GradeSeed> = {
  1: grade1t2,
  2: grade2t2,
  3: grade3t2,
  4: grade4t2,
  5: grade5t2,
  6: grade6t2,
  7: grade7t2,
  8: grade8t2,
  9: grade9t2,
  10: grade10t2,
  11: grade11t2,
  12: grade12t2,
};

/** معرّفات الأسئلة التي راجعها المعلم (تُحدَّث عبر `npm run questions -- import`). */
const REVIEWED = new Set<string>(reviewedIds as string[]);

export interface SeedDatabase {
  subjects: SubjectContent[];
  questions: Question[];
}

function build(): SeedDatabase {
  const subjects: SubjectContent[] = [];
  const questions: Question[] = [];

  for (const grade of GRADES) {
    for (const key of GRADE_SUBJECTS[grade]) {
      const sid = subjectId(grade, key);
      const units = [...(TERM1[grade][key] ?? []), ...(TERM2[grade][key] ?? [])].map((u, ui) => {
        const unitId = `${sid}-u${ui + 1}`;
        return {
          id: unitId,
          subjectId: sid,
          term: u.term,
          title: u.title,
          order: ui + 1,
          lessons: u.lessons.map((l, li) => {
            const lessonId = `${unitId}-l${li + 1}`;
            l.questions.forEach((q, qi) => {
              const id = `${lessonId}-q${qi + 1}`;
              questions.push({ ...q, id, lessonId, reviewed: q.reviewed || REVIEWED.has(id) } as Question);
            });
            return { id: lessonId, unitId, title: l.title, order: li + 1, objectives: l.objectives };
          }),
        };
      });
      subjects.push({ id: sid, grade, key, units });
    }
  }
  return { subjects, questions };
}

export const seedDatabase: SeedDatabase = build();
