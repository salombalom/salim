/** صفحة PDF لتقرير ولي الأمر */
import { gradeName, type GradeNumber } from '@/config/curriculum';
import { getLessonIdsForSubject, getSubject } from '@/lib/data/repository';
import { escapeHtml, pdfPage } from '@/lib/pdf';
import { formatDuration } from '@/lib/progress';
import { activeDaysIn, lastDays, studySecondsIn, type ChildReport } from '@/lib/report';

const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function buildReportHtml({
  report,
  header,
  today,
}: {
  report: ChildReport;
  header: { name: string; grade: GradeNumber | null; points: number; streak: number };
  today: string;
}): string {
  const e = escapeHtml;
  const days = lastDays(today, 7);
  const subjects = report.subjects
    .map((s) => {
      const subj = getSubject(s.subjectId);
      const total = getLessonIdsForSubject(s.subjectId).length;
      return `<tr><td>${e(subj?.meta.nameAr ?? s.subjectId)}</td><td class="num">${s.avgPercent}%</td><td class="num">${s.lessonsDone} / ${total}</td><td class="num">${s.attempts}</td></tr>`;
    })
    .join('');
  const weak = report.weakLessons.map((w) => `<li>${e(w.title)} — ${e(getSubject(w.subjectId)?.meta.nameAr ?? '')} (أفضل نتيجة <span class="num">${w.bestPercent}%</span>)</li>`).join('');
  const body = [
    `<header><span class="brand">دَرْسي</span><span class="meta">تقرير ولي الأمر · ${e(new Date(`${today}T00:00:00Z`).toLocaleDateString('ar-OM', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }))}</span></header>`,
    `<h1>${e(header.name)}</h1>`,
    `<div class="meta">${header.grade ? e(gradeName(header.grade)) : ''}</div>`,
    `<h2>ملخص</h2><table>
      <tr><th>وقت الدراسة هذا الأسبوع</th><td class="num">${e(formatDuration(studySecondsIn(report, today, 7)))}</td></tr>
      <tr><th>وقت الدراسة آخر 30 يوماً</th><td class="num">${e(formatDuration(studySecondsIn(report, today, 30)))}</td></tr>
      <tr><th>أيام نشطة هذا الأسبوع</th><td class="num">${activeDaysIn(report, today, 7)} / 7</td></tr>
      <tr><th>النقاط</th><td class="num">${header.points}</td></tr>
      <tr><th>أيام متتالية</th><td class="num">${header.streak}</td></tr>
      <tr><th>أخطاء تنتظر المراجعة</th><td class="num">${report.openMistakes}</td></tr>
    </table>`,
    `<h2>دقائق الدراسة في آخر 7 أيام</h2><table><tr>${days.map((d) => `<th>${DAY_NAMES[new Date(`${d}T00:00:00Z`).getUTCDay()]}</th>`).join('')}</tr><tr>${days
      .map((d) => `<td class="num">${Math.round((report.study[d] ?? 0) / 60)}</td>`)
      .join('')}</tr></table>`,
    subjects
      ? `<h2>المواد</h2><table><tr><th>المادة</th><th>متوسط الدرجة</th><th>الدروس المنجزة</th><th>الاختبارات</th></tr>${subjects}</table>`
      : '<h2>المواد</h2><p>لا توجد اختبارات بعد.</p>',
    `<h2>دروس تحتاج مراجعة</h2>${weak ? `<ul>${weak}</ul>` : '<p>لا توجد دروس ضعيفة. كل النتائج 70% فأكثر.</p>'}`,
    `<footer>تقرير مجمّع من تطبيق «دَرْسي» المجاني. لا يتضمن إجابات الطالب ولا أي بيانات شخصية أخرى.</footer>`,
  ].join('\n');
  return pdfPage({ title: `تقرير ${header.name}`, body });
}
