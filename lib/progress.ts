import { getLessonIdsForSubject } from '@/lib/data/repository';
import type { LessonBest } from '@/lib/store';

/** الدرس يُعد مُنجزاً إذا حصل الطالب فيه على نجمة واحدة على الأقل (50% فأكثر) */
export function isLessonDone(best: LessonBest | undefined): boolean {
  return !!best && best.stars >= 1;
}

export function completionFor(lessonIds: string[], lessonBest: Record<string, LessonBest>) {
  const total = lessonIds.length;
  const done = lessonIds.filter((id) => isLessonDone(lessonBest[id])).length;
  return { done, total, ratio: total ? done / total : 0 };
}

export function subjectCompletion(subjectId: string, lessonBest: Record<string, LessonBest>) {
  return completionFor(getLessonIdsForSubject(subjectId), lessonBest);
}

export function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 1) return 'أقل من دقيقة';
  if (m < 60) return `${m} دقيقة`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} س ${rest} د` : `${h} ساعة`;
}
