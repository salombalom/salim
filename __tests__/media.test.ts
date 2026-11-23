import { GRADE_SUBJECTS, GRADES } from '@/config/curriculum';
import { useContent } from '@/lib/data/contentStore';
import { formatDuration, getLessonVideos, getSubjectVideos, getTextbooks } from '@/lib/data/media';
import { makeGateQuestion } from '@/lib/parentalGate';
import { CHANNELS, TEXTBOOKS, VIDEOS } from '@/seed/media';

afterEach(() => useContent.setState({ grades: {}, version: useContent.getState().version + 1 }));

describe('media content files', () => {
  it('are well-formed', () => {
    for (const c of CHANNELS) {
      if (c.active) expect(Boolean(c.channelId || c.handle)).toBe(true);
    }
    for (const t of TEXTBOOKS) {
      expect(t.officialUrl).toMatch(/^https:\/\//);
      expect(['link_only', 'permission_granted']).toContain(t.licenseStatus);
    }
    for (const v of VIDEOS) {
      expect(['pending', 'approved', 'rejected']).toContain(v.status);
      if (v.status === 'approved') expect(Boolean(v.lessonId || v.subjectId)).toBe(true);
    }
  });
});

describe('lesson videos', () => {
  it('shows only approved server videos for the lesson', () => {
    useContent.setState({
      grades: {
        5: {
          subjects: [],
          questions: [],
          fetchedAt: 1,
          videos: [
            { dbId: 'u1', youtubeId: 'aaa', title: 'مفهوم الكسر', lessonId: 'g5-math-u1-l1', subjectId: 'g5-math', durationSec: 600, thumbnailUrl: null, channelName: 'مورد', channelUrl: 'https://www.youtube.com/@x' },
            { dbId: 'u2', youtubeId: 'bbb', title: 'درس آخر', lessonId: 'g5-math-u1-l2', subjectId: 'g5-math', durationSec: 300, thumbnailUrl: null, channelName: 'مورد', channelUrl: '' },
          ],
        },
      },
      version: 500,
    });
    const v = getLessonVideos('g5-math-u1-l1');
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ youtubeId: 'aaa', dbId: 'u1', thumbnailUrl: 'https://i.ytimg.com/vi/aaa/mqdefault.jpg' });
  });

  it('lists subject-level videos (no lesson) separately', () => {
    useContent.setState({
      grades: {
        12: {
          subjects: [],
          questions: [],
          fetchedAt: 1,
          videos: [
            { dbId: 'u3', youtubeId: 'ccc', title: 'الأحياء 12 - التنوع', lessonId: null, subjectId: 'g12-biology', durationSec: null, thumbnailUrl: null, channelName: 'مورد', channelUrl: '' },
            { dbId: 'u4', youtubeId: 'ddd', title: 'درس مربوط', lessonId: 'g12-biology-u1-l1', subjectId: 'g12-biology', durationSec: null, thumbnailUrl: null, channelName: 'مورد', channelUrl: '' },
          ],
        },
      },
      version: 502,
    });
    const subjectIds = getSubjectVideos('g12-biology').map((v) => v.youtubeId);
    expect(subjectIds).toContain('ccc');
    expect(subjectIds).not.toContain('ddd'); // المربوط بدرس لا يتكرر في قائمة المادة
    expect(getLessonVideos('g12-biology-u1-l1').map((v) => v.youtubeId)).toEqual(['ddd']);
    expect(getSubjectVideos('g11-biology')).toHaveLength(0);
  });

  it('returns no videos when nothing is approved', () => {
    expect(getLessonVideos('g1-islamic-u1-l1').every((v) => VIDEOS.some((x) => x.youtubeId === v.youtubeId && x.status === 'approved'))).toBe(true);
  });
});

describe('textbooks', () => {
  it('has official https links for every grade/subject the app teaches', () => {
    for (const g of GRADES) for (const k of GRADE_SUBJECTS[g]) expect(TEXTBOOKS.some((t) => t.subjectId === `g${g}-${k}`)).toBe(true);
    expect(TEXTBOOKS.length).toBeGreaterThan(200);
    expect(new Set(TEXTBOOKS.map((t) => t.officialUrl)).size).toBe(TEXTBOOKS.length);
    for (const t of TEXTBOOKS) expect(t.officialUrl).toMatch(/^https:\/\/home\.moe\.gov\.om\/ar\/manaheg\/\d+\/show\/\d+$/);
  });

  it('returns the term books plus full-year books, server first', () => {
    const g1 = getTextbooks('g1-arabic', 1);
    expect(g1.length).toBeGreaterThanOrEqual(2);
    expect(g1.every((b) => /الفصل الأول/.test(b.title))).toBe(true);
    const national = getTextbooks('g11-national', 2);
    expect(national.length).toBeGreaterThan(0); // كتاب سنوي بلا فصل
    useContent.setState({
      grades: { 5: { subjects: [], questions: [], fetchedAt: 1, textbooks: [{ subjectId: 'g5-math', term: 1, title: 'رياضيات 5', officialUrl: 'https://example.om/m5', licenseStatus: 'link_only' }] } },
      version: 501,
    });
    expect(getTextbooks('g5-math', 1).map((b) => b.officialUrl)).toEqual(['https://example.om/m5']);
  });
});

describe('helpers', () => {
  it('formats durations', () => {
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(3725)).toBe('1:02:05');
    expect(formatDuration(null)).toBe('');
  });

  it('builds a parental-gate question with 4 distinct options including the answer', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeGateQuestion();
      expect(q.answer).toBe(q.a * q.b);
      expect(q.a).toBeGreaterThanOrEqual(6);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.answer);
      expect(q.options.every((o) => o > 0)).toBe(true);
    }
  });
});
