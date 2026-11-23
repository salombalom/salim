/**
 * إصلاح اتجاه التعابير الرياضية داخل النص العربي.
 *
 * المشكلة: في فقرة عربية (RTL) يُعرض «36 ÷ 4» معكوساً «4 ÷ 36»، و«2 : 3» يصبح «3 : 2».
 * الحل: نعزل كل تعبير رياضي بعلامتي العزل LRI … PDI فيُعرض من اليسار إلى اليمين كما كُتب.
 */
export const LRI = String.fromCharCode(0x2066);
export const PDI = String.fromCharCode(0x2069);

const SUP_SUB = '²³¹⁰-₟';
const BODY = `0-9A-Za-z()\\[\\]\\s.,'′·√πΔ^%+\\-−×÷=/<>:${SUP_SUB}`;
const MATH_RUN = new RegExp(`[-−]\\d+(?:\\.\\d+)?(?!\\s*[+\\-−×÷=/<>:^0-9A-Za-z(])|[-−(√Δ]?[0-9A-Za-z(√Δπ][${BODY}]*[0-9A-Za-z)\\]%'′${SUP_SUB}]|[0-9]`, 'g');
const OPERATOR = /[+\-−×÷=/<>:^]|\d[A-Za-z]|[A-Za-z]\d|[²³¹⁰-₟]/;
const ARABIC = /[؀-ۿ]/;
const ISOLATED = new RegExp(`(${LRI}[^${PDI}]*${PDI})`);

function fixSegment(text: string): string {
  return text.replace(MATH_RUN, (run) => (OPERATOR.test(run) ? `${LRI}${run}${PDI}` : run));
}

/**
 * يُستخدم للنصوص المعروضة داخل واجهة RTL:
 * - نص فيه عربية: نعزل كل تعبير رياضي بداخله.
 * - نص بلا عربية (مثل خيار «-3» أو «2 : 3»): نعزله كاملاً إذا كان فيه رموز رياضية.
 */
export function isolateMath(text: string): string {
  if (!ARABIC.test(text)) {
    if (text.includes(LRI)) return text;
    return OPERATOR.test(text) ? `${LRI}${text}${PDI}` : text;
  }
  return text
    .split(ISOLATED)
    .map((part) => (part.startsWith(LRI) ? part : fixSegment(part)))
    .join('');
}

export function stripIsolates(text: string): string {
  return text.replace(new RegExp(`[${LRI}${PDI}]`, 'g'), '');
}
