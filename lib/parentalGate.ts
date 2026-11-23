/** سؤال «بوابة ولي الأمر» قبل فتح أي رابط خارجي (متطلب فئة الأطفال في App Store) */
export interface GateQuestion {
  a: number;
  b: number;
  answer: number;
  options: number[];
}

export function makeGateQuestion(rand: () => number = Math.random): GateQuestion {
  const a = 6 + Math.floor(rand() * 7); // 6..12
  const b = 6 + Math.floor(rand() * 7);
  const answer = a * b;
  const set = new Set<number>([answer]);
  const deltas = [a, b, 10, -a, -b, -10, 1, -1];
  let i = 0;
  while (set.size < 4) {
    const v = answer + deltas[Math.floor(rand() * deltas.length + i++) % deltas.length];
    if (v > 0) set.add(v);
  }
  const options = [...set].sort((x, y) => x - y);
  return { a, b, answer, options };
}
