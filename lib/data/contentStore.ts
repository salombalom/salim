/**
 * نسخة محلية (cache) من المحتوى المنزَّل من Supabase لكل صف.
 * تُحفظ على الجهاز حتى يعمل التطبيق دون إنترنت، وتُحدَّث عند فتح التطبيق.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SUBJECTS, type GradeNumber, type SubjectKey, type TermNumber } from '@/config/curriculum';
import { supabase } from '@/lib/supabase';
import type { Question, SubjectContent } from '@/lib/types';
import type { SummaryContent } from '@/supabase/functions/_shared/summary';

export interface RemoteVideo {
  /** معرّف الصف في قاعدة البيانات (لتقييمات الطلاب) */
  dbId: string;
  youtubeId: string;
  title: string;
  lessonId: string | null;
  subjectId: string | null;
  durationSec: number | null;
  thumbnailUrl: string | null;
  channelName: string;
  channelUrl: string;
}

export interface RemoteTextbook {
  subjectId: string;
  term: number | null;
  title: string;
  officialUrl: string;
  licenseStatus: 'link_only' | 'permission_granted';
}

export interface RemoteSummary {
  lessonId: string;
  status: 'draft' | 'approved';
  content: SummaryContent;
}

interface GradeContent {
  subjects: SubjectContent[];
  questions: Question[];
  videos?: RemoteVideo[];
  summaries?: RemoteSummary[];
  textbooks?: RemoteTextbook[];
  fetchedAt: number;
}

interface ContentState {
  grades: Partial<Record<GradeNumber, GradeContent>>;
  /** يزيد عند كل تحديث حتى تعيد الشاشات بناء الفهارس */
  version: number;
  status: 'idle' | 'loading' | 'error';
}

export const useContent = create<ContentState>()(
  persist((): ContentState => ({ grades: {}, version: 0, status: 'idle' }), {
    name: 'darsi.content.v1',
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (s) => ({ grades: s.grades, version: s.version }),
  }),
);

type Row = any;

function mapQuestion(r: Row): Question | null {
  const base = {
    id: r.id,
    lessonId: r.lesson_id,
    prompt: r.prompt,
    explanation: r.explanation ?? '',
    difficulty: r.difficulty,
    reviewed: r.reviewed,
    source: r.source,
  };
  switch (r.type) {
    case 'mcq':
      return { ...base, type: 'mcq', options: r.options, answer: r.answer };
    case 'true_false':
      return { ...base, type: 'true_false', answer: r.answer };
    case 'fill_blank':
      return { ...base, type: 'fill_blank', answer: r.answer, accepted: r.accepted ?? undefined, options: r.options ?? undefined };
    case 'word_order':
      return { ...base, type: 'word_order', answer: r.answer };
    default:
      return null;
  }
}

export function mapSubjects(rows: Row[], grade: GradeNumber): SubjectContent[] {
  return rows
    .filter((s) => s.key in SUBJECTS)
    .sort((a, b) => a.sort - b.sort)
    .map((s) => ({
      id: s.id,
      grade,
      key: s.key as SubjectKey,
      units: (s.terms ?? [])
        .flatMap((t: Row) => (t.units ?? []).map((u: Row) => ({ ...u, term: t.number as TermNumber })))
        .sort((a: Row, b: Row) => a.term - b.term || a.sort - b.sort)
        .map((u: Row) => ({
          id: u.id,
          subjectId: s.id,
          term: u.term,
          title: u.title,
          order: u.sort,
          lessons: (u.lessons ?? [])
            .sort((a: Row, b: Row) => a.sort - b.sort)
            .map((l: Row) => ({
              id: l.id,
              unitId: u.id,
              title: l.title,
              order: l.sort,
              objectives: (l.lesson_objectives ?? []).sort((a: Row, b: Row) => a.sort - b.sort).map((o: Row) => o.text),
            })),
        })),
    }));
}

/** ينزّل محتوى صف من Supabase (يتجاهل الأخطاء ويبقي النسخة المحفوظة) */
export async function refreshGradeContent(grade: GradeNumber): Promise<void> {
  if (!supabase) return;
  useContent.setState({ status: 'loading' });
  try {
    const { data: rows, error } = await supabase
      .from('subjects')
      .select('id, key, sort, terms(number, units(id, title, sort, lessons(id, title, sort, lesson_objectives(text, sort))))')
      .eq('grade_id', grade);
    if (error || !rows) throw error ?? new Error('no data');
    const subjects = mapSubjects(rows, grade);
    if (subjects.length === 0) throw new Error('empty'); // قاعدة بيانات فارغة: نبقي المحتوى المضمَّن
    const lessonIds = subjects.flatMap((s) => s.units.flatMap((u) => u.lessons.map((l) => l.id)));
    const { data: qrows, error: qerr } = await supabase
      .from('questions')
      .select('id, lesson_id, type, prompt, options, answer, accepted, explanation, difficulty, reviewed, source')
      .in('lesson_id', lessonIds);
    if (qerr) throw qerr;
    const questions = (qrows ?? []).map(mapQuestion).filter((q): q is Question => !!q);

    // الفيديوهات المعتمدة فقط (RLS) وروابط الكتب
    const [{ data: vrows }, { data: trows }, { data: srows }] = await Promise.all([
      supabase
        .from('videos')
        .select('id, youtube_id, title, lesson_id, subject_id, duration_sec, thumbnail_url, channels(name, url)')
        .eq('status', 'approved')
        .in('subject_id', subjects.map((s) => s.id)),
      supabase.from('textbooks').select('subject_id, term, title, official_url, license_status').eq('grade_id', grade).order('sort'),
      // الملخصات المعتمدة فقط (RLS)
      supabase.from('summaries').select('lesson_id, status, content').in('lesson_id', lessonIds),
    ]);
    const summaries: RemoteSummary[] = (srows ?? []).map((r: Row) => ({ lessonId: r.lesson_id, status: r.status, content: r.content }));
    const videos: RemoteVideo[] = (vrows ?? []).map((v: Row) => ({
      dbId: v.id,
      youtubeId: v.youtube_id,
      title: v.title,
      lessonId: v.lesson_id,
      subjectId: v.subject_id,
      durationSec: v.duration_sec,
      thumbnailUrl: v.thumbnail_url,
      channelName: v.channels?.name ?? '',
      channelUrl: v.channels?.url ?? '',
    }));
    const textbooks: RemoteTextbook[] = (trows ?? []).map((t: Row) => ({
      subjectId: t.subject_id,
      term: t.term,
      title: t.title,
      officialUrl: t.official_url,
      licenseStatus: t.license_status,
    }));

    useContent.setState((s) => ({
      grades: { ...s.grades, [grade]: { subjects, questions, videos, textbooks, summaries, fetchedAt: Date.now() } },
      version: s.version + 1,
      status: 'idle',
    }));
  } catch {
    useContent.setState({ status: 'error' });
  }
}
