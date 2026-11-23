import {
  currentStreak,
  dayKey,
  EMPTY_STREAK,
  PERFECT_BONUS,
  registerActivity,
  scoreQuiz,
  starsForPercent,
} from '@/lib/gamification';

describe('scoreQuiz', () => {
  it('awards points by difficulty', () => {
    const s = scoreQuiz([
      { correct: true, difficulty: 'easy' },
      { correct: true, difficulty: 'medium' },
      { correct: false, difficulty: 'hard' },
    ]);
    expect(s.correct).toBe(2);
    expect(s.total).toBe(3);
    expect(s.percent).toBe(67);
    expect(s.points).toBe(25);
    expect(s.stars).toBe(1);
  });

  it('adds a perfect-score bonus', () => {
    const s = scoreQuiz([
      { correct: true, difficulty: 'hard' },
      { correct: true, difficulty: 'hard' },
    ]);
    expect(s.points).toBe(40 + PERFECT_BONUS);
    expect(s.stars).toBe(3);
  });

  it('handles an empty quiz', () => {
    expect(scoreQuiz([])).toEqual({ correct: 0, total: 0, percent: 0, stars: 0, points: 0 });
  });
});

describe('starsForPercent', () => {
  it.each([
    [100, 3],
    [90, 3],
    [89, 2],
    [70, 2],
    [69, 1],
    [50, 1],
    [49, 0],
  ])('%i%% → %i stars', (p, stars) => {
    expect(starsForPercent(p)).toBe(stars);
  });
});

describe('streak', () => {
  it('starts at 1 on first activity', () => {
    expect(registerActivity(EMPTY_STREAK, '2026-01-10')).toEqual({ count: 1, lastDay: '2026-01-10', best: 1 });
  });

  it('does not double count the same day', () => {
    const s = registerActivity(EMPTY_STREAK, '2026-01-10');
    expect(registerActivity(s, '2026-01-10')).toBe(s);
  });

  it('increments on consecutive days and across months', () => {
    let s = registerActivity(EMPTY_STREAK, '2026-01-30');
    s = registerActivity(s, '2026-01-31');
    s = registerActivity(s, '2026-02-01');
    expect(s.count).toBe(3);
    expect(s.best).toBe(3);
  });

  it('resets after a missed day but keeps the best', () => {
    let s = registerActivity(EMPTY_STREAK, '2026-03-01');
    s = registerActivity(s, '2026-03-02');
    s = registerActivity(s, '2026-03-05');
    expect(s.count).toBe(1);
    expect(s.best).toBe(2);
  });

  it('shows 0 when the streak has lapsed', () => {
    const s = registerActivity(EMPTY_STREAK, '2026-03-01');
    expect(currentStreak(s, '2026-03-02')).toBe(1);
    expect(currentStreak(s, '2026-03-03')).toBe(0);
  });

  it('uses Muscat time (UTC+4) for the day boundary', () => {
    expect(dayKey(new Date('2026-05-01T19:59:00Z'))).toBe('2026-05-01');
    expect(dayKey(new Date('2026-05-01T20:00:00Z'))).toBe('2026-05-02');
  });
});
