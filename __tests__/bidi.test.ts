import { formatMixedTitle, isolateMath, LRI, PDI, stripIsolates } from '@/lib/bidi';

const iso = (s: string) => `${LRI}${s}${PDI}`;

describe('isolateMath', () => {
  it('isolates arithmetic inside Arabic text', () => {
    expect(isolateMath('كم يساوي 36 ÷ 4 ؟')).toBe(`كم يساوي ${iso('36 ÷ 4')} ؟`);
    expect(isolateMath('نجمع: 3 + 1 = 4.')).toBe(`نجمع: ${iso('3 + 1 = 4')}.`);
  });

  it('isolates ratios, fractions and equations', () => {
    expect(isolateMath('النسبة 10 : 15 هي')).toBe(`النسبة ${iso('10 : 15')} هي`);
    expect(isolateMath('حل المعادلة 3x + 2 = x + 10 هو')).toBe(`حل المعادلة ${iso('3x + 2 = x + 10')} هو`);
    expect(isolateMath('الكسر 3/4 أكبر')).toBe(`الكسر ${iso('3/4')} أكبر`);
    expect(isolateMath('مشتقة x⁵ هي')).toBe(`مشتقة ${iso('x⁵')} هي`);
  });

  it('leaves plain numbers and words alone', () => {
    expect(isolateMath('في الصف 5 طلاب')).toBe('في الصف 5 طلاب');
    expect(isolateMath('يحمل DNA المعلومات')).toBe('يحمل DNA المعلومات');
  });

  it('isolates negative numbers', () => {
    expect(isolateMath('أصبحت الحرارة -2 درجة')).toBe(`أصبحت الحرارة ${iso('-2')} درجة`);
    expect(isolateMath('-5 + 3 = ؟')).toBe(`${iso('-5 + 3')} = ؟`);
  });

  it('wraps whole non-Arabic strings that contain math (e.g. answer options)', () => {
    expect(isolateMath('-3')).toBe(iso('-3'));
    expect(isolateMath('2 : 3')).toBe(iso('2 : 3'));
    expect(isolateMath('42')).toBe('42');
    expect(isolateMath('pencil')).toBe('pencil');
  });

  it('does not double-isolate', () => {
    const once = isolateMath('كم يساوي 2 + 3 ؟');
    expect(isolateMath(once)).toBe(once);
    const mixed = `إذا كانت ${iso('x = 4')} فما 2 + x ؟`;
    expect(stripIsolates(isolateMath(mixed))).toBe(stripIsolates(mixed));
    expect(isolateMath(mixed).startsWith(`إذا كانت ${iso('x = 4')}`)).toBe(true);
  });
});

describe('formatMixedTitle', () => {
  it.each([
    ['الرياضيات المتقدمة 11 - (11 - 4) - المواد الإثرائية 2024', `الرياضيات المتقدمة 11 · ${LRI}(11-4)${PDI} · المواد الإثرائية 2024`],
    ['الرياضيات المتقدمة 11- (11 - 2) - المواد الإثرائية 2024', `الرياضيات المتقدمة 11 · ${LRI}(11-2)${PDI} · المواد الإثرائية 2024`],
    ['الرياضيات المتقدمة 12 - (8 - 2 ) الجزء الثالث - المواد الإثرائية 2024', `الرياضيات المتقدمة 12 · ${LRI}(8-2)${PDI} الجزء الثالث · المواد الإثرائية 2024`],
    ['الأحياء 12 - (9-4) إدارة أعداد الأنواع - المواد الإثرائية 2024', `الأحياء 12 · ${LRI}(9-4)${PDI} إدارة أعداد الأنواع · المواد الإثرائية 2024`],
  ])('%s', (input, out) => expect(formatMixedTitle(input)).toBe(out));

  it('leaves English titles alone', () => expect(formatMixedTitle('Unit 2 - Animals')).toBe('Unit 2 - Animals'));
});
