/**
 * ملخصات الدروس: من الخادم (المعتمدة) أولاً، ثم الملفات المحلية seed/summaries.json.
 * الطالب يرى المعتمد فقط؛ المسودات تظهر في الوضع المحلي أو مع خيار المطوّر.
 */
import summariesJson from '@/seed/summaries.json';
import type { SummaryContent, SummaryRecord } from '@/supabase/functions/_shared/summary';

import { useContent } from './contentStore';

const LOCAL = summariesJson as unknown as Record<string, SummaryRecord>;

export interface LessonSummary {
  content: SummaryContent;
  status: 'draft' | 'approved';
}

export function getSummary(lessonId: string, opts: { includeDrafts: boolean }): LessonSummary | null {
  for (const g of Object.values(useContent.getState().grades)) {
    const r = g?.summaries?.find((x) => x.lessonId === lessonId);
    if (r && (r.status === 'approved' || opts.includeDrafts)) return { content: r.content, status: r.status };
  }
  const l = LOCAL[lessonId];
  if (l && (l.status === 'approved' || opts.includeDrafts)) return { content: l.content, status: l.status };
  return null;
}

/** كل الملخصات المحلية (للاختبارات وأدوات المشرف) */
export const localSummaries = LOCAL;
