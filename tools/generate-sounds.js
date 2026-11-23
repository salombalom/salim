/**
 * يولّد أصوات التطبيق (صح / خطأ / انتهاء) كملفات WAV أصلية دون الحاجة لأي ملفات خارجية.
 * التشغيل: node tools/generate-sounds.js
 */
/* global Buffer, __dirname */
const fs = require('fs');
const path = require('path');

const RATE = 22050;

function tone(freq, dur, { vol = 0.35, type = 'sine', fade = 0.02 } = {}) {
  const n = Math.floor(RATE * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const ph = 2 * Math.PI * freq * t;
    let v = type === 'triangle' ? (2 / Math.PI) * Math.asin(Math.sin(ph)) : Math.sin(ph);
    const env = Math.min(1, t / fade, (dur - t) / (fade * 4)) * Math.exp(-3 * t);
    out[i] = v * vol * Math.max(0, env);
  }
  return out;
}

function concat(...parts) {
  const len = parts.reduce((s, p) => s + p.length, 0);
  const out = new Float32Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function silence(dur) {
  return new Float32Array(Math.floor(RATE * dur));
}

function writeWav(file, samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2));
  fs.writeFileSync(file, buf);
  console.log('wrote', file);
}

const dir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(dir, { recursive: true });
writeWav(path.join(dir, 'correct.wav'), concat(tone(660, 0.09), tone(880, 0.16)));
writeWav(path.join(dir, 'wrong.wav'), concat(tone(220, 0.12, { type: 'triangle' }), silence(0.03), tone(180, 0.18, { type: 'triangle' })));
writeWav(path.join(dir, 'finish.wav'), concat(tone(523, 0.1), tone(659, 0.1), tone(784, 0.1), tone(1047, 0.3)));
