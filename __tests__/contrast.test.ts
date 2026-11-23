import { darkColors, lightColors, type ThemeColors } from '@/theme/tokens';

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const TEXT_PAIRS: [keyof ThemeColors, keyof ThemeColors][] = [
  ['text', 'background'],
  ['text', 'surface'],
  ['textMuted', 'background'],
  ['textMuted', 'surface'],
  ['goldText', 'background'],
  ['goldText', 'surface'],
  ['successText', 'surface'],
  ['dangerText', 'surface'],
  ['onGold', 'gold'],
];

describe.each([
  ['dark', darkColors],
  ['light', lightColors],
] as const)('%s theme meets WCAG AA', (_name, colors) => {
  it.each(TEXT_PAIRS)('%s on %s ≥ 4.5:1 (normal text)', (fg, bg) => {
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['gold', 'background'],
    ['gold', 'surface'],
    ['success', 'surface'],
    ['danger', 'surface'],
  ] as const)('%s on %s ≥ 3:1 (icons, borders, large text)', (fg, bg) => {
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(3);
  });
});
