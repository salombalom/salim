// يولّد صورة QR لصفحة المنيو في مجلد qr/ (للطباعة على الطاولات)
// الاستخدام:
//   npm run qr                          ← يستخدم business.siteUrl من config.json
//   npm run qr -- https://mycafe.om     ← أو رابط تحدده بنفسك
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './build.mjs';
import { makeQr } from './qr-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = loadConfig();
const base = (process.argv[2] || cfg.business.siteUrl).replace(/\/$/, '');
const url = /\/menu(\?|$)/.test(base) ? base : `${base}/menu`;

const { png, svg } = await makeQr(url, { dark: cfg.theme.light.text });
mkdirSync(join(ROOT, 'qr'), { recursive: true });
writeFileSync(join(ROOT, 'qr/menu-qr.png'), png);
writeFileSync(join(ROOT, 'qr/menu-qr.svg'), svg);
console.log(`✓ QR جاهز يفتح: ${url}\n  qr/menu-qr.png  (1200×1200 للطباعة)\n  qr/menu-qr.svg`);
