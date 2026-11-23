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

const SEEDS: Record<GradeNumber, GradeSeed> = {
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
      const units = (SEEDS[grade][key] ?? []).map((u, ui) => {
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
              questions.push({ ...q, id: `${lessonId}-q${qi + 1}`, lessonId } as Question);
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
