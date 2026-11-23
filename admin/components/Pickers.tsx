'use client';

import { useEffect, useState } from 'react';

import { GRADES, SUBJECT_NAMES, supabase } from '@/lib/supabase';

export interface SubjectRow {
  id: string;
  key: string;
  grade_id: number;
}

/** اختيار الصف ثم المادة */
export function GradeSubjectPicker({
  grade,
  subject,
  onChange,
}: {
  grade: number;
  subject: string;
  onChange: (grade: number, subject: string) => void;
}) {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  useEffect(() => {
    let live = true;
    supabase
      .from('subjects')
      .select('id, key, grade_id')
      .eq('grade_id', grade)
      .order('sort')
      .then(({ data }) => live && setSubjects(data ?? []));
    return () => {
      live = false;
    };
  }, [grade]);

  return (
    <>
      <select value={grade} onChange={(e) => onChange(Number(e.target.value), '')} aria-label="الصف">
        {GRADES.map((g) => (
          <option key={g} value={g}>
            الصف {g}
          </option>
        ))}
      </select>
      <select value={subject} onChange={(e) => onChange(grade, e.target.value)} aria-label="المادة">
        <option value="">كل المواد</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {SUBJECT_NAMES[s.key] ?? s.key}
          </option>
        ))}
      </select>
    </>
  );
}
