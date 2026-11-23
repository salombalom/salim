import type { Question, QuestionResponse } from '@/lib/types';

import { normalizeAnswer } from './normalize';

/** يصحّح إجابة واحدة ويعيد true إذا كانت صحيحة */
export function isCorrect(question: Question, response: QuestionResponse | null | undefined): boolean {
  if (response === null || response === undefined) return false;

  switch (question.type) {
    case 'mcq':
      return typeof response === 'string' && response === question.answer;

    case 'true_false':
      return typeof response === 'boolean' && response === question.answer;

    case 'fill_blank': {
      if (typeof response !== 'string') return false;
      const given = normalizeAnswer(response);
      if (!given) return false;
      return [question.answer, ...(question.accepted ?? [])].some((a) => normalizeAnswer(a) === given);
    }

    case 'word_order': {
      if (!Array.isArray(response) || response.length !== question.answer.length) return false;
      return response.every((w, i) => normalizeAnswer(w) === normalizeAnswer(question.answer[i]));
    }
  }
}

/** نص الإجابة الصحيحة لعرضه للطالب */
export function correctAnswerText(question: Question): string {
  switch (question.type) {
    case 'mcq':
    case 'fill_blank':
      return question.answer;
    case 'true_false':
      return question.answer ? 'صح' : 'خطأ';
    case 'word_order':
      return question.answer.join(' ');
  }
}

/** نص إجابة الطالب لعرضه */
export function responseText(response: QuestionResponse | null | undefined): string {
  if (response === null || response === undefined) return '—';
  if (typeof response === 'boolean') return response ? 'صح' : 'خطأ';
  if (Array.isArray(response)) return response.join(' ');
  return response;
}
