// خادم تطوير محلي: يبني الموقع، ويعيد البناء تلقائياً عند تعديل config.json أو src/
// الاستخدام: npm run dev   ثم افتح http://localhost:3000
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

const safeBuild = () => build().catch((e) => console.error(e.message));
await safeBuild();

let timer;
const rebuild = () => { clearTimeout(timer); timer = setTimeout(safeBuild, 120); };
watch(join(ROOT, 'config.json'), rebuild);
watch(join(ROOT, 'src'), { recursive: true }, rebuild);
watch(join(ROOT, 'scripts'), { recursive: true }, () => console.log('  ↻ عدّلت سكربت البناء، أعد تشغيل npm run dev'));

async function resolveFile(urlPath) {
  const p = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  for (const c of [p, `${p}.html`, join(p, 'index.html')]) {
    const f = join(DIST, c);
    if (!f.startsWith(DIST)) continue;
    try { if ((await stat(f)).isFile()) return f; } catch {}
  }
  return null;
}

createServer(async (req, res) => {
  const f = await resolveFile(req.url === '/' ? '/index.html' : req.url);
  if (!f) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('404'); }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(await readFile(f));
}).listen(PORT, () => {
  const lan = Object.values(networkInterfaces()).flat().find((i) => i?.family === 'IPv4' && !i.internal)?.address;
  console.log(`\n  ☕ الموقع شغّال:\n     الكمبيوتر:  http://localhost:${PORT}\n     المنيو:     http://localhost:${PORT}/menu\n     بطاقة QR:   http://localhost:${PORT}/qr${lan ? `\n     الجوال:     http://${lan}:${PORT}  (نفس شبكة الواي فاي)` : ''}\n`);
});
