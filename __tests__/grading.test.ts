import { correctAnswerText, isCorrect } from '@/lib/quiz/grading';
import { normalizeAnswer } from '@/lib/quiz/normalize';
import type { Question } from '@/lib/types';

const base = { id: 'q', lessonId: 'l', explanation: '', difficulty: 'easy' as const, reviewed: true, source: 'seed' as const };

describe('normalizeAnswer', () => {
  it('removes tashkeel and unifies alef forms', () => {
    expect(normalizeAnswer('إِلَى')).toBe(normalizeAnswer('الى'));
    expect(normalizeAnswer('آمنة')).toBe(normalizeAnswer('امنه'));
  });
  it('converts Arabic-Indic digits', () => {
    expect(normalizeAnswer('١٤')).toBe('14');
    expect(normalizeAnswer('٣٫٨')).toBe('3.8');
  });
  it('keeps the minus sign and decimal point', () => {
    expect(normalizeAnswer('-3')).toBe('-3');
    expect(normalizeAnswer('2.5')).toBe('2.5');
  });
  it('ignores case, punctuation and extra spaces', () => {
    expect(normalizeAnswer('  Three. ')).toBe('three');
  });
});

describe('isCorrect', () => {
  const mcq: Question = { ...base, type: 'mcq', prompt: '', options: ['a', 'b', 'c', 'd'], answer: 'c' };
  const tf: Question = { ...base, type: 'true_false', prompt: '', answer: false };
  const fill: Question = { ...base, type: 'fill_blank', prompt: '', answer: 'الحج', accepted: ['حج'] };
  const order: Question = { ...base, type: 'word_order', prompt: '', answer: ['My', 'name', 'is', 'Ali'] };

  it('grades multiple choice', () => {
    expect(isCorrect(mcq, 'c')).toBe(true);
    expect(isCorrect(mcq, 'a')).toBe(false);
    expect(isCorrect(mcq, true)).toBe(false);
  });

  it('grades true/false', () => {
    expect(isCorrect(tf, false)).toBe(true);
    expect(isCorrect(tf, true)).toBe(false);
    expect(isCorrect(tf, 'false')).toBe(false);
  });

  it('grades fill in the blank with normalization and alternatives', () => {
    expect(isCorrect(fill, 'الحَجّ')).toBe(true);
    expect(isCorrect(fill, ' حج ')).toBe(true);
    expect(isCorrect(fill, 'الصوم')).toBe(false);
    expect(isCorrect(fill, '')).toBe(false);
  });

  it('grades word order', () => {
    expect(isCorrect(order, ['My', 'name', 'is', 'Ali'])).toBe(true);
    expect(isCorrect(order, ['my', 'name', 'is', 'ali'])).toBe(true);
    expect(isCorrect(order, ['name', 'My', 'is', 'Ali'])).toBe(false);
    expect(isCorrect(order, ['My', 'name', 'is'])).toBe(false);
  });

  it('treats missing answers as wrong', () => {
    expect(isCorrect(mcq, null)).toBe(false);
    expect(isCorrect(tf, undefined)).toBe(false);
  });

  it('formats the correct answer', () => {
    expect(correctAnswerText(tf)).toBe('خطأ');
    expect(correctAnswerText(order)).toBe('My name is Ali');
  });
});
