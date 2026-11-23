/**
 * توحيد النص قبل مقارنة إجابات "أكمل الفراغ":
 * - إزالة التشكيل والتطويل
 * - توحيد أشكال الألف (أ إ آ ٱ ← ا) والياء (ى ← ي) والتاء المربوطة (ة ← ه)
 * - تحويل الأرقام العربية-الهندية والفارسية إلى أرقام لاتينية
 * - تحويل الحروف الإنجليزية إلى صغيرة وإزالة علامات الترقيم والمسافات الزائدة
 */
const TASHKEEL = /[ً-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;
const PUNCTUATION = /[.,!?;:"'()\[\]{}،؛؟«»]/g;

export function normalizeAnswer(input: string): string {
  return input
    .replace(TASHKEEL, '')
    .replace(TATWEEL, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, '.')
    .replace(/(\d)\.(?=\d)/g, '$1\u0000') // احفظ الفاصلة العشرية قبل حذف الترقيم
    .replace(PUNCTUATION, ' ')
    .replace(/\u0000/g, '.')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
