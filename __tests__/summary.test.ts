import { localSummaries } from '@/lib/data/summaries';
import { buildSummaryHtml } from '@/lib/summaryPdf';
import { seedDatabase } from '@/seed';
import { buildSummaryPrompt, SUMMARY_SCHEMA, summaryToPlainText, validateSummary } from '@/supabase/functions/_shared/summary';

const good = {
  overview: 'درس عن الكسور.',
  concepts: ['البسط فوق الخط.', 'المقام تحت الخط.', ''],
  definitions: [{ term: 'الكسر', meaning: 'جزء من كل.' }, { term: '', meaning: 'x' }],
  example: '',
  review: ['ما هو المقام؟'],
};

describe('summary validation', () => {
  it('normalises a valid response', () => {
    const s = validateSummary(good);
    expect(s.concepts).toHaveLength(2);
    expect(s.definitions).toHaveLength(1);
    expect(s.example).toBeUndefined();
  });

  it('rejects empty, thin or emoji content', () => {
    expect(() => validateSummary(null)).toThrow();
    expect(() => validateSummary({ ...good, overview: ' ' })).toThrow(/overview/);
    expect(() => validateSummary({ ...good, concepts: ['واحدة'] })).toThrow(/concepts/);
    expect(() => validateSummary({ ...good, review: [] })).toThrow(/review/);
    expect(() => validateSummary({ ...good, overview: 'رائع 🎉' })).toThrow(/emoji/);
  });

  it('schema requires every field and forbids extras (structured outputs)', () => {
    expect(SUMMARY_SCHEMA.additionalProperties).toBe(false);
    expect([...SUMMARY_SCHEMA.required].sort()).toEqual(Object.keys(SUMMARY_SCHEMA.properties).sort());
  });

  it('builds a prompt with the lesson context and the no-copy rule', () => {
    const { system, user } = buildSummaryPrompt({
      grade: 5,
      gradeName: 'الصف الخامس',
      subjectName: 'الرياضيات',
      english: false,
      term: 2,
      unitTitle: 'الكسور',
      lessonTitle: 'جمع الكسور',
      objectives: ['يجمع كسرين'],
      questions: [{ prompt: '1/2 + 1/2 = ', answer: '1', explanation: '' }],
    });
    expect(system).toMatch(/لا تنسخ/);
    expect(user).toMatch(/جمع الكسور/);
    expect(user).toMatch(/الثاني/);
    expect(user).toMatch(/يجمع كسرين/);
  });

  it('renders plain text and an RTL PDF page with escaped content', () => {
    const s = validateSummary({ ...good, overview: 'a < b & c' });
    expect(summaryToPlainText('عنوان', s)).toMatch(/راجع نفسك/);
    const html = buildSummaryHtml({ lessonTitle: 'جمع <الكسور>', subjectName: 'الرياضيات', gradeName: 'الصف الخامس', unitTitle: 'الوحدة 1', objectives: ['هدف'], summary: s });
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('a &lt; b &amp; c');
    expect(html).not.toContain('<الكسور>');
    expect(buildSummaryHtml({ lessonTitle: 'Greetings', subjectName: 'English', gradeName: 'G1', unitTitle: 'U1', objectives: [], summary: s, ltr: true })).toContain('dir="ltr"');
  });
});

describe('bundled summaries (seed/summaries.json)', () => {
  const lessonIds = new Set(seedDatabase.subjects.flatMap((s) => s.units.flatMap((u) => u.lessons.map((l) => l.id))));
  it('cover every lesson', () => {
    for (const id of lessonIds) expect(localSummaries[id]).toBeDefined();
  });

  it('belong to existing lessons and pass validation', () => {
    for (const [id, rec] of Object.entries(localSummaries)) {
      expect(lessonIds.has(id)).toBe(true);
      expect(['draft', 'approved']).toContain(rec.status);
      expect(() => validateSummary(rec.content)).not.toThrow();
    }
  });
});
