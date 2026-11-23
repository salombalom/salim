import { normalizeEmail, normalizePhone } from '@/lib/auth';

describe('normalizePhone', () => {
  it.each([
    ['91234567', '+96891234567'],
    ['7123 4567', '+96871234567'],
    ['٩١٢٣٤٥٦٧', '+96891234567'],
    ['+968 9123 4567', '+96891234567'],
    ['0096891234567', '+96891234567'],
    ['96891234567', '+96891234567'],
    ['+971501234567', '+971501234567'],
  ])('%s → %s', (input, out) => expect(normalizePhone(input)).toBe(out));

  it.each(['1234', '81234567', 'abc', ''])('rejects %s', (input) => expect(normalizePhone(input)).toBeNull());
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => expect(normalizeEmail('  Salim@Mail.COM ')).toBe('salim@mail.com'));
  it.each(['no-at', 'a@b', 'a b@c.com', ''])('rejects %s', (input) => expect(normalizeEmail(input)).toBeNull());
});
