/**
 * لقطات شاشة للمتاجر (1290×2796، iPhone 6.7") من نسخة الويب.
 * التشغيل: EXPO_OFFLINE=1 npx expo export --platform web && node tools/store-screenshots.js
 * يملأ تقدّماً تجريبياً على المتصفح فقط (لا يمس أي بيانات حقيقية).
 */
/* global __dirname */
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const DIST = path.join(__dirname, '..', 'dist');
const OUT = path.join(__dirname, '..', 'store', 'screenshots');
const PORT = 8097;

function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.json': 'application/json', '.wav': 'audio/wav', '.ico': 'image/x-icon' };
  return http
    .createServer((req, res) => {
      let f = path.join(DIST, decodeURIComponent(req.url.split('?')[0]));
      if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html');
      res.writeHead(200, { 'Content-Type': types[path.extname(f)] ?? 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    })
    .listen(PORT);
}

const today = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.parse(`${today}T00:00:00Z`) - n * 864e5).toISOString().slice(0, 10);
const attempt = (lessonId, percent, n) => ({
  id: `${lessonId}-${n}`,
  lessonId,
  subjectId: lessonId.replace(/-u\d+-l\d+$/, ''),
  mode: 'lesson',
  score: { correct: Math.round(percent / 10), total: 10, percent, stars: percent >= 90 ? 3 : percent >= 70 ? 2 : percent >= 50 ? 1 : 0, points: percent },
  durationSec: 240,
  at: Date.parse(`${daysAgo(n)}T10:00:00Z`),
});
const attempts = [attempt('g5-math-u1-l1', 90, 0), attempt('g5-arabic-u1-l1', 80, 1), attempt('g5-science-u1-l1', 60, 2), attempt('g5-english-u1-l1', 100, 3), attempt('g5-islamic-u1-l2', 40, 4)];
const SETTINGS = { state: { onboarded: true, role: 'student', grade: 5, displayName: 'مريم', themeMode: 'dark', fontScale: 'md', soundOn: false, hapticsOn: false, showUnreviewed: true }, version: 3 };
const PROGRESS = {
  state: {
    points: 385,
    streak: { count: 5, lastDay: today, best: 9 },
    lessonBest: Object.fromEntries(attempts.map((a) => [a.lessonId, { percent: a.score.percent, stars: a.score.stars, attempts: 1 }])),
    attempts,
    mistakes: {},
    favorites: [],
    studySeconds: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((n) => [daysAgo(n), [1500, 900, 1200, 0, 2100, 600, 1800][n]])),
    videoRatings: {},
    pendingAttempts: [],
    pendingStudySeconds: 0,
  },
  version: 0,
};

const SHOTS = [
  ['01-home', '/home'],
  ['02-subject', '/subject/g5-math'],
  ['03-lesson', '/lesson/g5-science-u1-l1'],
  ['04-quiz', '/quiz?lessonId=g5-math-u1-l1'],
  ['05-summary', '/lesson/g8-math-u2-l1'],
  ['06-parent', '/parent'],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = serve();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, locale: 'ar-OM', colorScheme: 'dark' });
  await ctx.addInitScript(
    ([s, p]) => {
      localStorage.setItem('darsi.settings.v1', s);
      localStorage.setItem('darsi.progress.v1', p);
    },
    [JSON.stringify(SETTINGS), JSON.stringify(PROGRESS)],
  );
  const page = await ctx.newPage();
  for (const [name, url] of SHOTS) {
    await page.goto(`http://localhost:${PORT}${url}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log('✓', name);
  }
  await browser.close();
  server.close();
})();
