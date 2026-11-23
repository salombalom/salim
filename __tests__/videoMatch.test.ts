import { seedDatabase } from '@/seed';
import {
  detectGrade,
  detectSubject,
  detectTerm,
  detectUnit,
  matchVideo,
  parseChannelRef,
  parseIsoDuration,
  titleSimilarity,
  type LessonRef,
} from '@/supabase/functions/_shared/videoMatch';

const lessons: LessonRef[] = seedDatabase.subjects.flatMap((s) =>
  s.units.flatMap((u) =>
    u.lessons.map((l) => ({ id: l.id, title: l.title, unitTitle: u.title, unitOrder: u.order, term: u.term, grade: s.grade, subject: s.key })),
  ),
);

describe('detectors', () => {
  it.each([
    ['شرح درس الكسور للصف الخامس', 5],
    ['الرياضيات الصف الحادي عشر المعادلات التربيعية', 11],
    ['الصف الثاني عشر | قانون أوم', 12],
    ['الصف الثاني - الجمع', 2],
    ['الصف 7 الأعداد الصحيحة', 7],
    ['ص10 حل نظام معادلتين', 10],
    ['درس بدون صف', null],
  ])('grade of "%s" → %s', (t, g) => expect(detectGrade(t)).toBe(g));

  it.each([
    ['التربية الإسلامية: أركان الإسلام', 'islamic'],
    ['اللغة العربية - الفاعل', 'arabic'],
    ['English Grade 4 - Telling the time', 'english'],
    ['فيزياء الصف الحادي عشر', 'physics'],
    ['هذا وطني: المواطنة', 'national'],
    ['الدراسات الاجتماعية - موقع عمان', 'social'],
    ['العلوم - الدائرة الكهربائية', 'science'],
    ['درس عام', null],
  ])('subject of "%s" → %s', (t, s) => expect(detectSubject(t)).toBe(s));

  it('detects term and unit', () => {
    expect(detectTerm('الفصل الدراسي الثاني')).toBe(2);
    expect(detectTerm('ف1 رياضيات')).toBe(1);
    expect(detectUnit('الوحدة الثالثة: الضرب')).toBe(3);
    expect(detectUnit('Unit 2 animals')).toBe(2);
  });

  it('scores title overlap with Arabic prefixes', () => {
    expect(titleSimilarity('شرح الكسور العشرية بالتفصيل', 'الكسور العشرية')).toBe(1);
    expect(titleSimilarity('قانون نيوتن الأول', 'الكسور العشرية')).toBe(0);
  });
});

describe('matchVideo', () => {
  it.each([
    ['الرياضيات | الصف الخامس | مفهوم الكسر', 'g5-math-u1-l1'],
    ['رياضيات الصف الخامس - جمع الكسور وطرحها', 'g5-math-u1-l2'],
    ['العلوم للصف الخامس: الجهاز التنفسي', 'g5-science-u1-l2'],
    ['الصف الحادي عشر - كيمياء - الجدول الدوري', 'g11-chemistry-u1-l2'],
    ['التربية الإسلامية الصف الأول أركان الإسلام', 'g1-islamic-u1-l1'],
    ['الفيزياء الصف الثاني عشر: قانون أوم', 'g12-physics-u1-l1'],
  ])('"%s" → %s', (title, lessonId) => {
    const r = matchVideo({ title }, lessons);
    expect(r.lessonId).toBe(lessonId);
    expect(r.score).toBeGreaterThanOrEqual(0.55);
  });

  it.each([
    ['الأحياء 12 - (9-4) إدارة أعداد الأنواع - المواد الإثرائية 2024', 'g12-biology'],
    ['الرياضيات المتقدمة 11 - (11-1) النظام الإحداثي ثلاثي الأبعاد - المواد الإثرائية 2024', 'g11-math'],
    ['اللغة الإنجليزيية 10 - Grammar - المواد الإثرائية 2024', 'g10-english'],
    ['اللغة الإنجليزية 10 - Present and Past Simple - المواد الإثرائية 2024', 'g10-english'],
  ])('Mawred title "%s" → subject %s', (title, subjectId) => {
    const r = matchVideo({ title }, lessons);
    expect(r.subjectId).toBe(subjectId);
  });

  it('does not suggest when grade and subject are unknown', () => {
    const r = matchVideo({ title: 'حلقة نقاش تربوية مع المعلمين' }, lessons);
    expect(r.lessonId).toBeNull();
  });

  it('does not cross grades', () => {
    const r = matchVideo({ title: 'الصف الثالث رياضيات الكسور العشرية' }, lessons);
    expect(r.lessonId === null || r.lessonId.startsWith('g3-math')).toBe(true);
  });

  it('uses the description when the title lacks the grade', () => {
    const r = matchVideo({ title: 'الرياضيات: جمع الكسور وطرحها', description: 'درس للصف الخامس الفصل الدراسي الأول' }, lessons);
    expect(r.lessonId).toBe('g5-math-u1-l2');
  });
});

describe('youtube helpers', () => {
  it('parses ISO durations', () => {
    expect(parseIsoDuration('PT12M5S')).toBe(725);
    expect(parseIsoDuration('PT1H')).toBe(3600);
    expect(parseIsoDuration('P0D')).toBe(0);
    expect(parseIsoDuration(undefined)).toBeNull();
  });

  it('parses channel links', () => {
    expect(parseChannelRef('https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv')).toEqual({ channelId: 'UCabcdefghijklmnopqrstuv' });
    expect(parseChannelRef('https://www.youtube.com/@MawredOman')).toEqual({ handle: 'MawredOman' });
    expect(parseChannelRef('nothing')).toBeNull();
  });
});
