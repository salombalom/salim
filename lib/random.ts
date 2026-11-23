/** مولّد أرقام عشوائية بذرة ثابتة (mulberry32) — حتى تكون الاختبارات قابلة للتكرار */
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** عدد صحيح بين min و max (شاملين) */
export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** خلط مع ضمان أن الترتيب الناتج يختلف عن الأصلي (إن أمكن) */
export function shuffleDifferent<T>(rng: Rng, items: readonly T[]): T[] {
  if (items.length < 2) return [...items];
  for (let tries = 0; tries < 10; tries++) {
    const s = shuffle(rng, items);
    if (s.some((v, i) => v !== items[i])) return s;
  }
  return [...items].reverse();
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
