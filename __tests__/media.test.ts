import { useContent } from '@/lib/data/contentStore';
import { formatDuration, getLessonVideos, getTextbook } from '@/lib/data/media';
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
      if (v.status === 'approved') expect(v.lessonId).toBeTruthy();
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
            { dbId: 'u1', youtubeId: 'aaa', title: 'مفهوم الكسر', lessonId: 'g5-math-u1-l1', durationSec: 600, thumbnailUrl: null, channelName: 'مورد', channelUrl: 'https://www.youtube.com/@x' },
            { dbId: 'u2', youtubeId: 'bbb', title: 'درس آخر', lessonId: 'g5-math-u1-l2', durationSec: 300, thumbnailUrl: null, channelName: 'مورد', channelUrl: '' },
          ],
        },
      },
      version: 500,
    });
    const v = getLessonVideos('g5-math-u1-l1');
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ youtubeId: 'aaa', dbId: 'u1', thumbnailUrl: 'https://i.ytimg.com/vi/aaa/mqdefault.jpg' });
  });

  it('returns no videos when nothing is approved', () => {
    expect(getLessonVideos('g1-islamic-u1-l1').every((v) => VIDEOS.some((x) => x.youtubeId === v.youtubeId && x.status === 'approved'))).toBe(true);
  });
});

describe('textbooks', () => {
  it('prefers the server link and falls back to local files', () => {
    useContent.setState({
      grades: { 5: { subjects: [], questions: [], fetchedAt: 1, textbooks: [{ subjectId: 'g5-math', term: 1, title: 'رياضيات 5', officialUrl: 'https://example.om/m5', licenseStatus: 'link_only' }] } },
      version: 501,
    });
    expect(getTextbook('g5-math', 1)?.officialUrl).toBe('https://example.om/m5');
    expect(getTextbook('g5-math', 2)).toBe(TEXTBOOKS.find((t) => t.subjectId === 'g5-math' && t.term === 2) ? expect.anything() : null);
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
