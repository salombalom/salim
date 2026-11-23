import { parseCsv } from '../tools/questions';

describe('review sheet CSV parser', () => {
  it('handles BOM, quotes, commas and newlines inside cells', () => {
    const rows = parseCsv('﻿المعرّف,السؤال,معتمد\r\ng1-a-u1-l1-q1,"أ، ب ""ج""\nد",نعم\r\n\r\n');
    expect(rows).toEqual([
      ['المعرّف', 'السؤال', 'معتمد'],
      ['g1-a-u1-l1-q1', 'أ، ب "ج"\nد', 'نعم'],
    ]);
  });

  it('accepts semicolon-separated files saved by Excel in some locales', () => {
    expect(parseCsv('id;reviewed\nx;1\n')).toEqual([['id', 'reviewed'], ['x', '1']]);
  });
});
