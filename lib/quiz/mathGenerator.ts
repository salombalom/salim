/**
 * مولّد أسئلة الرياضيات التلقائي — يُنتج أسئلة جديدة في كل مرة حسب الصف.
 *
 * الصفوف 1–4: جمع وطرح وضرب وقسمة بسيطة
 * الصفوف 5–8: كسور ونسب ونسب مئوية وأعداد صحيحة
 * الصفوف 9–10: معادلات خطية وأنظمة بسيطة
 * الصفوف 11–12: معادلات تربيعية وتفاضل كثيرات الحدود
 *
 * كل سؤال مولَّد صحيح رياضياً بالبناء، لذا يُعلَّم reviewed = true و source = 'generated'.
 */
import type { GradeNumber } from '@/config/curriculum';
import type { Difficulty, McqQuestion } from '@/lib/types';
import { createRng, pick, randInt, shuffle, type Rng } from '@/lib/random';

/** عزل التعابير الرياضية باتجاه LTR داخل الجمل العربية */
const LRI = String.fromCharCode(0x2066);
const PDI = String.fromCharCode(0x2069);
export const ltr = (s: string) => `${LRI}${s}${PDI}`;

type Generated = Omit<McqQuestion, 'id' | 'lessonId'>;
type Generator = (rng: Rng) => Generated;

/* ───────────── أدوات مساعدة ───────────── */

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export interface Fraction {
  n: number;
  d: number;
}

export function simplify({ n, d }: Fraction): Fraction {
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

export function fracToString(f: Fraction): string {
  const s = simplify(f);
  return s.d === 1 ? String(s.n) : `${s.n}/${s.d}`;
}

/** يبني أربعة خيارات فريدة: الإجابة الصحيحة + مشتتات (مع توليد احتياطي عند التكرار) */
function buildOptions(rng: Rng, answer: string, distractors: string[], fallback: () => string): string[] {
  const set = new Set<string>([answer]);
  for (const d of distractors) {
    if (set.size >= 4) break;
    if (d && !set.has(d)) set.add(d);
  }
  let guard = 0;
  while (set.size < 4 && guard++ < 50) set.add(fallback());
  // آخر ملجأ (نظرياً لن نصل هنا)
  let k = 1;
  while (set.size < 4) set.add(`${answer}${'′'.repeat(k++)}`);
  return shuffle(rng, [...set]);
}

function numericQuestion(
  rng: Rng,
  prompt: string,
  answer: number,
  distractors: number[],
  explanation: string,
  difficulty: Difficulty,
  spread = 5,
): Generated {
  const ans = String(answer);
  const options = buildOptions(
    rng,
    ans,
    distractors.map(String),
    () => String(answer + pick(rng, [-1, 1]) * randInt(rng, 1, spread)),
  );
  return { type: 'mcq', prompt, options, answer: ans, explanation, difficulty, reviewed: true, source: 'generated' };
}

const SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export function superscript(n: number): string {
  return String(n)
    .split('')
    .map((c) => (c === '-' ? '⁻' : SUPERSCRIPT_DIGITS[Number(c)]))
    .join('');
}

function formatTerm(coef: number, power: number, first: boolean): string {
  if (coef === 0) return '';
  const sign = coef < 0 ? (first ? '-' : ' - ') : first ? '' : ' + ';
  const abs = Math.abs(coef);
  if (power === 0) return `${sign}${abs}`;
  const c = abs === 1 ? '' : String(abs);
  const x = power === 1 ? 'x' : `x${superscript(power)}`;
  return `${sign}${c}${x}`;
}

/** يكتب كثيرة حدود من معاملاتها: coeffs[i] معامل x^i */
export function formatPolynomial(coeffs: number[]): string {
  let out = '';
  for (let p = coeffs.length - 1; p >= 0; p--) {
    const t = formatTerm(coeffs[p], p, out === '');
    out += t;
  }
  return out || '0';
}

export function derivative(coeffs: number[]): number[] {
  const d = coeffs.slice(1).map((c, i) => c * (i + 1));
  return d.length ? d : [0];
}

/* ───────────── الصفوف 1–4 ───────────── */

const addition =
  (max: number, difficulty: Difficulty): Generator =>
  (rng) => {
    const a = randInt(rng, 1, max);
    const b = randInt(rng, 1, max);
    const ans = a + b;
    return numericQuestion(
      rng,
      `كم يساوي ${ltr(`${a} + ${b}`)} ؟`,
      ans,
      [ans + 1, ans - 1, ans + 10, Math.abs(a - b)],
      `نجمع ${a} و ${b} فيكون الناتج ${ans}.`,
      difficulty,
    );
  };

const subtraction =
  (max: number, difficulty: Difficulty): Generator =>
  (rng) => {
    const a = randInt(rng, 2, max);
    const b = randInt(rng, 1, a);
    const ans = a - b;
    return numericQuestion(
      rng,
      `كم يساوي ${ltr(`${a} - ${b}`)} ؟`,
      ans,
      [ans + 1, ans - 1 >= 0 ? ans - 1 : ans + 2, a + b, ans + 10],
      `نطرح ${b} من ${a} فيبقى ${ans}.`,
      difficulty,
    );
  };

const multiplication =
  (maxTable: number, difficulty: Difficulty): Generator =>
  (rng) => {
    const a = randInt(rng, 2, maxTable);
    const b = randInt(rng, 1, 10);
    const ans = a * b;
    return numericQuestion(
      rng,
      `كم يساوي ${ltr(`${a} × ${b}`)} ؟`,
      ans,
      [ans + a, ans - a, a + b, ans + 1],
      `${a} × ${b} تعني جمع العدد ${a} مع نفسه ${b} مرات، والناتج ${ans}.`,
      difficulty,
    );
  };

const division =
  (maxTable: number, difficulty: Difficulty): Generator =>
  (rng) => {
    const b = randInt(rng, 2, maxTable);
    const ans = randInt(rng, 1, 10);
    const a = b * ans;
    return numericQuestion(
      rng,
      `كم يساوي ${ltr(`${a} ÷ ${b}`)} ؟`,
      ans,
      [ans + 1, ans - 1 > 0 ? ans - 1 : ans + 2, a - b, ans * 2],
      `لأن ${b} × ${ans} = ${a}، فإن ${a} ÷ ${b} = ${ans}.`,
      difficulty,
    );
  };

const missingAddend: Generator = (rng) => {
  const a = randInt(rng, 2, 30);
  const ans = randInt(rng, 1, 30);
  const total = a + ans;
  return numericQuestion(
    rng,
    `ما العدد المفقود؟ ${ltr(`${a} + ? = ${total}`)}`,
    ans,
    [total + a, ans + 1, ans - 1 > 0 ? ans - 1 : ans + 3, total],
    `العدد المفقود = ${total} - ${a} = ${ans}.`,
    'medium',
  );
};

/* ───────────── الصفوف 5–8 ───────────── */

const simplifyFraction: Generator = (rng) => {
  const d0 = randInt(rng, 2, 9);
  const f = simplify({ n: randInt(rng, 1, d0 - 1), d: d0 });
  const k = randInt(rng, 2, 6);
  const n = f.n * k;
  const d = f.d * k;
  const ans = fracToString(f);
  // كل المشتتات مبسّطة حتى لا يظهر كسر مكافئ للإجابة الصحيحة
  const distractors = [
    { n: f.n + 1, d: f.d },
    { n, d: f.d },
    { n: f.d, d: f.n },
    { n: n - 1, d: d - 1 },
  ].map(fracToString);
  return {
    type: 'mcq',
    prompt: `ما أبسط صورة للكسر ${ltr(`${n}/${d}`)} ؟`,
    options: buildOptions(rng, ans, distractors, () => fracToString({ n: randInt(rng, 1, 9), d: randInt(rng, 2, 12) })),
    answer: ans,
    explanation: `نقسم البسط والمقام على ${k} (القاسم المشترك الأكبر) فنحصل على ${ans}.`,
    difficulty: 'easy',
    reviewed: true,
    source: 'generated',
  };
};

const addFractionsSameDen: Generator = (rng) => {
  const d = randInt(rng, 3, 12);
  const a = randInt(rng, 1, d - 1);
  const b = randInt(rng, 1, d - 1);
  const ans = fracToString({ n: a + b, d });
  return {
    type: 'mcq',
    prompt: `كم يساوي ${ltr(`${a}/${d} + ${b}/${d}`)} ؟`,
    options: buildOptions(rng, ans, [fracToString({ n: a + b, d: d * 2 }), fracToString({ n: a * b, d }), fracToString({ n: a + b + 1, d })], () =>
      fracToString({ n: randInt(rng, 1, 2 * d), d }),
    ),
    answer: ans,
    explanation: `عندما يتساوى المقامان نجمع البسطين فقط: ${a} + ${b} = ${a + b}، فيكون الناتج ${ans} (بأبسط صورة).`,
    difficulty: 'easy',
    reviewed: true,
    source: 'generated',
  };
};

const addFractionsDiffDen: Generator = (rng) => {
  let d1 = randInt(rng, 2, 9);
  let d2 = randInt(rng, 2, 9);
  if (d1 === d2) d2 = d1 + 1;
  const a = randInt(rng, 1, d1 - 1 || 1);
  const b = randInt(rng, 1, d2 - 1 || 1);
  const ans = fracToString({ n: a * d2 + b * d1, d: d1 * d2 });
  return {
    type: 'mcq',
    prompt: `كم يساوي ${ltr(`${a}/${d1} + ${b}/${d2}`)} ؟`,
    options: buildOptions(
      rng,
      ans,
      [fracToString({ n: a + b, d: d1 + d2 }), fracToString({ n: a + b, d: d1 * d2 }), fracToString({ n: a * d2 + b * d1 + 1, d: d1 * d2 })],
      () => fracToString({ n: randInt(rng, 1, d1 * d2), d: d1 * d2 }),
    ),
    answer: ans,
    explanation: `نوحّد المقامات: ${ltr(`${a}/${d1} = ${a * d2}/${d1 * d2}`)} و ${ltr(`${b}/${d2} = ${b * d1}/${d1 * d2}`)}، ثم نجمع البسطين فيكون الناتج ${ans}.`,
    difficulty: 'medium',
    reviewed: true,
    source: 'generated',
  };
};

const multiplyFractions: Generator = (rng) => {
  const a = { n: randInt(rng, 1, 7), d: randInt(rng, 2, 9) };
  const b = { n: randInt(rng, 1, 7), d: randInt(rng, 2, 9) };
  const ans = fracToString({ n: a.n * b.n, d: a.d * b.d });
  return {
    type: 'mcq',
    prompt: `كم يساوي ${ltr(`${a.n}/${a.d} × ${b.n}/${b.d}`)} ؟`,
    options: buildOptions(
      rng,
      ans,
      [fracToString({ n: a.n * b.d, d: a.d * b.n }), fracToString({ n: a.n + b.n, d: a.d + b.d }), fracToString({ n: a.n * b.n, d: a.d + b.d })],
      () => fracToString({ n: randInt(rng, 1, 20), d: randInt(rng, 2, 40) }),
    ),
    answer: ans,
    explanation: `نضرب البسط في البسط والمقام في المقام: ${ltr(`${a.n}×${b.n} / ${a.d}×${b.d}`)}، ثم نبسّط فيكون الناتج ${ans}.`,
    difficulty: 'medium',
    reviewed: true,
    source: 'generated',
  };
};

const percentOf: Generator = (rng) => {
  const p = pick(rng, [10, 20, 25, 50, 75, 5, 15, 40]);
  const base = pick(rng, [20, 40, 60, 80, 100, 120, 200, 400, 500]);
  const ans = (p * base) / 100;
  return numericQuestion(
    rng,
    `كم يساوي ${ltr(`${p}%`)} من ${base} ؟`,
    ans,
    [ans * 2, ans + 10, base - ans, p],
    `${p}% من ${base} = ${ltr(`${p} ÷ 100 × ${base}`)} = ${ans}.`,
    'medium',
    10,
  );
};

const ratioShare: Generator = (rng) => {
  const r1 = randInt(rng, 1, 5);
  let r2 = randInt(rng, 1, 5);
  if (r1 === r2) r2 = r1 + 1;
  const unit = randInt(rng, 2, 12);
  const total = (r1 + r2) * unit;
  const ans = r1 * unit;
  return numericQuestion(
    rng,
    `قُسّم مبلغ ${total} ريالاً بين أحمد وسارة بنسبة ${ltr(`${r1} : ${r2}`)}. كم نصيب أحمد؟`,
    ans,
    [r2 * unit, total / 2, ans + unit, total - r1],
    `مجموع الأجزاء = ${r1 + r2}، وقيمة الجزء الواحد = ${total} ÷ ${r1 + r2} = ${unit}، فنصيب أحمد = ${r1} × ${unit} = ${ans}.`,
    'hard',
    unit,
  );
};

const proportion: Generator = (rng) => {
  const price = randInt(rng, 2, 9);
  const q1 = randInt(rng, 2, 6);
  const q2 = randInt(rng, 7, 15);
  const ans = price * q2;
  return numericQuestion(
    rng,
    `إذا كان ثمن ${q1} أقلام هو ${price * q1} ريالات، فكم ثمن ${q2} قلماً؟`,
    ans,
    [price * q1 + q2, ans + price, q2 * q1, ans - price],
    `ثمن القلم الواحد = ${price * q1} ÷ ${q1} = ${price}، إذن ثمن ${q2} قلماً = ${q2} × ${price} = ${ans}.`,
    'medium',
    price,
  );
};

const integers: Generator = (rng) => {
  const a = randInt(rng, -20, 20);
  const b = randInt(rng, -20, -1);
  const op = pick(rng, ['+', '-'] as const);
  const ans = op === '+' ? a + b : a - b;
  const shown = `${a} ${op} (${b})`;
  return numericQuestion(
    rng,
    `كم يساوي ${ltr(shown)} ؟`,
    ans,
    [op === '+' ? a - b : a + b, -ans, ans + 1],
    op === '+'
      ? `جمع عدد سالب يعني الطرح: ${ltr(`${a} - ${Math.abs(b)} = ${ans}`)}.`
      : `طرح عدد سالب يعني الجمع: ${ltr(`${a} + ${Math.abs(b)} = ${ans}`)}.`,
    'medium',
  );
};

/* ───────────── الصفوف 9–10 ───────────── */

const linearEquation: Generator = (rng) => {
  const a = pick(rng, [2, 3, 4, 5, 6, 7, -2, -3]);
  const x = randInt(rng, -9, 12);
  const b = randInt(rng, -15, 15);
  const c = a * x + b;
  const lhs = formatPolynomial([b, a]);
  return numericQuestion(
    rng,
    `حُلّ المعادلة: ${ltr(`${lhs} = ${c}`)}`,
    x,
    [x + 1, -x, x + 2, c - b],
    `ننقل ${b} إلى الطرف الآخر: ${ltr(`${a}x = ${c - b}`)}، ثم نقسم على ${a}: ${ltr(`x = ${x}`)}.`,
    'medium',
  );
};

const linearBothSides: Generator = (rng) => {
  const x = randInt(rng, -6, 10);
  const a = randInt(rng, 3, 8);
  const c = randInt(rng, 1, a - 1);
  const b = randInt(rng, -10, 10);
  const d = (a - c) * x + b;
  return numericQuestion(
    rng,
    `أوجد قيمة x: ${ltr(`${formatPolynomial([b, a])} = ${formatPolynomial([d, c])}`)}`,
    x,
    [-x, x + 1, x - 1, d - b],
    `نجمع حدود x في طرف والثوابت في الطرف الآخر: ${ltr(`${a - c}x = ${d - b}`)}، إذن ${ltr(`x = ${x}`)}.`,
    'hard',
  );
};

const evaluateExpression: Generator = (rng) => {
  const a = randInt(rng, 2, 6);
  const b = randInt(rng, -9, 9);
  const x = randInt(rng, -4, 5);
  const ans = a * x * x + b;
  return numericQuestion(
    rng,
    `إذا كانت ${ltr(`x = ${x}`)}، فما قيمة ${ltr(formatPolynomial([b, 0, a]))} ؟`,
    ans,
    [a * x + b, a * 2 * x + b, ans + a, -ans],
    `نعوّض: ${ltr(`${a}(${x})² ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${a * x * x} ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${ans}`)}.`,
    'medium',
  );
};

const systemOfEquations: Generator = (rng) => {
  const x = randInt(rng, -5, 8);
  const y = randInt(rng, -5, 8);
  const s = x + y;
  const t = x - y;
  return numericQuestion(
    rng,
    `إذا كان ${ltr(`x + y = ${s}`)} و ${ltr(`x - y = ${t}`)}، فما قيمة x ؟`,
    x,
    [y, s, t, x + 1],
    `نجمع المعادلتين: ${ltr(`2x = ${s + t}`)}، إذن ${ltr(`x = ${x}`)}.`,
    'hard',
  );
};

/* ───────────── الصفوف 11–12 ───────────── */

const quadraticRoots: Generator = (rng) => {
  let r1 = randInt(rng, -7, 7);
  let r2 = randInt(rng, -7, 7);
  if (r1 === r2) r2 = r1 + 2;
  if (r1 > r2) [r1, r2] = [r2, r1];
  // (x - r1)(x - r2) = x^2 - (r1+r2)x + r1 r2
  const poly = formatPolynomial([r1 * r2, -(r1 + r2), 1]);
  const ans = `${r1} ، ${r2}`;
  const opt = (a: number, b: number) => {
    const [p, q] = a <= b ? [a, b] : [b, a];
    return `${p} ، ${q}`;
  };
  return {
    type: 'mcq',
    prompt: `ما حلول المعادلة ${ltr(`${poly} = 0`)} ؟`,
    options: buildOptions(rng, ans, [opt(-r1, -r2), opt(r1, -r2), opt(-r1, r2), opt(r1 + 1, r2 + 1)], () =>
      opt(randInt(rng, -9, 9), randInt(rng, -9, 9)),
    ),
    answer: ans,
    explanation: `نحلّل: ${ltr(`(x ${r1 < 0 ? '+' : '-'} ${Math.abs(r1)})(x ${r2 < 0 ? '+' : '-'} ${Math.abs(r2)}) = 0`)}، إذن ${ltr(`x = ${r1}`)} أو ${ltr(`x = ${r2}`)}.`,
    difficulty: 'medium',
    reviewed: true,
    source: 'generated',
  };
};

const discriminant: Generator = (rng) => {
  const a = randInt(rng, 1, 4);
  const b = randInt(rng, -8, 8);
  const c = randInt(rng, -6, 6);
  const D = b * b - 4 * a * c;
  const ans = D > 0 ? 'جذران حقيقيان مختلفان' : D === 0 ? 'جذر حقيقي مكرر' : 'لا توجد جذور حقيقية';
  return {
    type: 'mcq',
    prompt: `ما طبيعة جذور المعادلة ${ltr(`${formatPolynomial([c, b, a])} = 0`)} ؟`,
    options: shuffle(rng, ['جذران حقيقيان مختلفان', 'جذر حقيقي مكرر', 'لا توجد جذور حقيقية', 'ثلاثة جذور حقيقية']),
    answer: ans,
    explanation: `المميز ${ltr(`Δ = b² - 4ac = ${b * b} - ${4 * a * c} = ${D}`)}. ${
      D > 0 ? 'المميز موجب، إذن جذران حقيقيان مختلفان.' : D === 0 ? 'المميز صفر، إذن جذر مكرر.' : 'المميز سالب، إذن لا توجد جذور حقيقية.'
    }`,
    difficulty: 'hard',
    reviewed: true,
    source: 'generated',
  };
};

function randomPoly(rng: Rng, degree: number): number[] {
  const coeffs = Array.from({ length: degree + 1 }, () => randInt(rng, -6, 6));
  if (coeffs[degree] === 0) coeffs[degree] = randInt(rng, 1, 5);
  return coeffs;
}

const derivativePoly: Generator = (rng) => {
  const coeffs = randomPoly(rng, randInt(rng, 2, 3));
  const d = derivative(coeffs);
  const ans = formatPolynomial(d);
  // مشتتات: نسيان ضرب المعامل في الأس، إبقاء الثابت، خطأ إشارة
  const noMult = formatPolynomial(coeffs.slice(1));
  const keepConst = formatPolynomial([coeffs[0] + d[0], ...d.slice(1)]);
  const wrongPow = formatPolynomial([0, ...d]);
  return {
    type: 'mcq',
    prompt: `إذا كانت ${ltr(`f(x) = ${formatPolynomial(coeffs)}`)}، فما ${ltr("f'(x)")} ؟`,
    options: buildOptions(rng, ans, [noMult, keepConst, wrongPow].filter((s) => s !== ans), () =>
      formatPolynomial(d.map((c) => c + randInt(rng, -2, 2))),
    ),
    answer: ans,
    explanation: `نستخدم قاعدة القوة: مشتقة ${ltr('axⁿ')} هي ${ltr('n·a·xⁿ⁻¹')}، ومشتقة الثابت صفر، فتكون ${ltr(`f'(x) = ${ans}`)}.`,
    difficulty: 'medium',
    reviewed: true,
    source: 'generated',
  };
};

const derivativeAtPoint: Generator = (rng) => {
  const coeffs = randomPoly(rng, 2);
  const x0 = randInt(rng, -3, 4);
  const d = derivative(coeffs);
  const ans = d.reduce((s, c, i) => s + c * x0 ** i, 0);
  const fx0 = coeffs.reduce((s, c, i) => s + c * x0 ** i, 0);
  return numericQuestion(
    rng,
    `إذا كانت ${ltr(`f(x) = ${formatPolynomial(coeffs)}`)}، فما قيمة ${ltr(`f'(${x0})`)} ؟`,
    ans,
    [fx0, -ans, ans + coeffs[1], ans + 2],
    `${ltr(`f'(x) = ${formatPolynomial(d)}`)}، وبالتعويض ${ltr(`x = ${x0}`)} نحصل على ${ans}.`,
    'hard',
  );
};

const tangentSlope: Generator = (rng) => {
  const a = randInt(rng, 1, 4);
  const x0 = randInt(rng, -3, 3);
  const ans = 2 * a * x0;
  return numericQuestion(
    rng,
    `ما ميل المماس لمنحنى ${ltr(`y = ${formatPolynomial([0, 0, a])}`)} عند ${ltr(`x = ${x0}`)} ؟`,
    ans,
    [a * x0 * x0, a * x0, ans + 1, -ans],
    `الميل يساوي المشتقة: ${ltr(`y' = ${2 * a}x`)}، وعند ${ltr(`x = ${x0}`)} يكون الميل ${ans}.`,
    'medium',
  );
};

/* ───────────── توزيع المولدات على الصفوف ───────────── */

const GENERATORS: Record<GradeNumber, Generator[]> = {
  1: [addition(10, 'easy'), subtraction(10, 'easy'), addition(20, 'medium')],
  2: [addition(50, 'easy'), subtraction(50, 'easy'), missingAddend, addition(100, 'medium')],
  3: [addition(500, 'medium'), subtraction(500, 'medium'), multiplication(5, 'easy'), missingAddend],
  4: [multiplication(10, 'easy'), division(10, 'medium'), addition(1000, 'medium'), subtraction(1000, 'medium')],
  5: [simplifyFraction, addFractionsSameDen, multiplication(12, 'medium'), division(12, 'medium')],
  6: [simplifyFraction, addFractionsDiffDen, percentOf, proportion],
  7: [integers, addFractionsDiffDen, ratioShare, proportion, percentOf],
  8: [multiplyFractions, percentOf, ratioShare, integers, linearEquation],
  9: [linearEquation, linearBothSides, evaluateExpression, integers],
  10: [linearEquation, linearBothSides, systemOfEquations, evaluateExpression],
  11: [quadraticRoots, discriminant, derivativePoly, systemOfEquations],
  12: [derivativePoly, derivativeAtPoint, tangentSlope, quadraticRoots],
};

export interface GenerateOptions {
  grade: GradeNumber;
  count: number;
  seed: number;
  lessonId?: string;
}

/** يولّد `count` سؤالاً متنوعاً للصف المحدد. نفس البذرة = نفس الأسئلة. */
export function generateMathQuestions({ grade, count, seed, lessonId = `g${grade}-math-gen` }: GenerateOptions): McqQuestion[] {
  const rng = createRng(seed);
  const gens = GENERATORS[grade];
  const out: McqQuestion[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard++ < count * 20) {
    // أولاً سؤال من كل نوع، ثم أنواع عشوائية
    const gen = out.length < gens.length ? gens[out.length] : pick(rng, gens);
    const q = gen(rng);
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    out.push({ ...q, id: `gen-${grade}-${seed}-${out.length}`, lessonId });
  }
  return out;
}
