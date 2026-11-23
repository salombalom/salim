import { GRADES } from '@/config/curriculum';
import { isCorrect } from '@/lib/quiz/grading';
import { derivative, formatPolynomial, fracToString, generateMathQuestions, simplify } from '@/lib/quiz/mathGenerator';

/** إزالة علامات العزل الاتجاهي لتسهيل قراءة النص */
const plain = (s: string) => s.replace(/[⁦-⁩]/g, '');

describe('helpers', () => {
  it('simplifies fractions', () => {
    expect(simplify({ n: 6, d: 8 })).toEqual({ n: 3, d: 4 });
    expect(fracToString({ n: 4, d: 2 })).toBe('2');
    expect(fracToString({ n: 3, d: -6 })).toBe('-1/2');
  });

  it('formats polynomials', () => {
    expect(formatPolynomial([1, -3, 2])).toBe('2x² - 3x + 1');
    expect(formatPolynomial([0, 1])).toBe('x');
    expect(formatPolynomial([-5, 0, -1])).toBe('-x² - 5');
    expect(formatPolynomial([0])).toBe('0');
  });

  it('differentiates polynomials', () => {
    // 2x^3 - x + 4 → 6x^2 - 1
    expect(derivative([4, -1, 0, 2])).toEqual([-1, 0, 6]);
    expect(derivative([7])).toEqual([0]);
  });
});

describe('generateMathQuestions', () => {
  it.each(GRADES)('grade %i produces valid, solvable questions', (grade) => {
    for (let seed = 1; seed <= 40; seed++) {
      const qs = generateMathQuestions({ grade, count: 8, seed });
      expect(qs).toHaveLength(8);
      for (const q of qs) {
        expect(q.type).toBe('mcq');
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.options).toContain(q.answer);
        expect(isCorrect(q, q.answer)).toBe(true);
        expect(q.reviewed).toBe(true);
        expect(q.source).toBe('generated');
        expect(q.explanation.length).toBeGreaterThan(5);
        expect(plain(q.prompt)).not.toMatch(/NaN|undefined|Infinity/);
        q.options.forEach((o) => expect(o).not.toMatch(/NaN|undefined|Infinity/));
      }
      expect(new Set(qs.map((q) => q.prompt)).size).toBe(qs.length);
    }
  });

  it('never offers two equivalent fractions as options (grades 5–8)', () => {
    const value = (o: string) => {
      const m = o.match(/^(-?\d+)\/(\d+)$/);
      return m ? +m[1] / +m[2] : Number(o);
    };
    for (const grade of [5, 6, 7, 8] as const) {
      for (let seed = 1; seed <= 60; seed++) {
        for (const q of generateMathQuestions({ grade, count: 6, seed })) {
          const vals = q.options.map(value).filter((v) => !Number.isNaN(v));
          expect(new Set(vals.map((v) => v.toFixed(6))).size).toBe(vals.length);
        }
      }
    }
  });

  it('is deterministic for the same seed and varies with different seeds', () => {
    const a = generateMathQuestions({ grade: 6, count: 5, seed: 42 });
    const b = generateMathQuestions({ grade: 6, count: 5, seed: 42 });
    const c = generateMathQuestions({ grade: 6, count: 5, seed: 43 });
    expect(a).toEqual(b);
    expect(a.map((q) => q.prompt)).not.toEqual(c.map((q) => q.prompt));
  });

  it('produces arithmetic that is actually correct (grade 1)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const q of generateMathQuestions({ grade: 1, count: 3, seed })) {
        const m = plain(q.prompt).match(/(\d+) ([+-]) (\d+)/);
        if (!m) continue;
        const expected = m[2] === '+' ? +m[1] + +m[3] : +m[1] - +m[3];
        expect(q.answer).toBe(String(expected));
      }
    }
  });

  it('solves linear equations correctly (grade 9)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const q of generateMathQuestions({ grade: 9, count: 4, seed })) {
        const m = plain(q.prompt).match(/^حُلّ المعادلة: (-?\d*)x ([+-]) (\d+) = (-?\d+)$/);
        if (!m) continue;
        const a = m[1] === '' ? 1 : m[1] === '-' ? -1 : +m[1];
        const b = m[2] === '+' ? +m[3] : -m[3];
        const x = +q.answer;
        expect(a * x + b).toBe(+m[4]);
      }
    }
  });
});
