import { isCorrect } from '@/lib/quiz/grading';
import { createRng, shuffle, shuffleDifferent } from '@/lib/random';
import type { Question, QuestionResponse } from '@/lib/types';

/** سؤال جاهز للعرض: خيارات مخلوطة وكلمات مخلوطة */
export interface PreparedQuestion {
  question: Question;
  options?: string[];
  /** لترتيب الكلمات: الكلمات بترتيب مخلوط */
  words?: string[];
}

export const MAX_QUIZ_QUESTIONS = 10;

export function prepareQuiz(questions: Question[], seed: number, limit = MAX_QUIZ_QUESTIONS): PreparedQuestion[] {
  const rng = createRng(seed);
  return shuffle(rng, questions)
    .slice(0, limit)
    .map((q) => {
      switch (q.type) {
        case 'mcq':
          return { question: q, options: shuffle(rng, q.options) };
        case 'fill_blank':
          return { question: q, options: q.options ? shuffle(rng, q.options) : undefined };
        case 'word_order':
          return { question: q, words: shuffleDifferent(rng, q.answer) };
        default:
          return { question: q };
      }
    });
}

/**
 * يحوّل إجابة الواجهة إلى إجابة قابلة للتصحيح.
 * ترتيب الكلمات يُحفظ في الواجهة كمؤشرات (لدعم الكلمات المكررة)، فنحوّله إلى كلمات.
 */
export function toGradableResponse(item: PreparedQuestion, response: QuestionResponse): QuestionResponse {
  if (item.question.type === 'word_order' && Array.isArray(response) && item.words) {
    return response.map((i) => item.words![Number(i)]);
  }
  return response;
}

export function gradePrepared(item: PreparedQuestion, response: QuestionResponse) {
  const gradable = toGradableResponse(item, response);
  return { gradable, correct: isCorrect(item.question, gradable) };
}
