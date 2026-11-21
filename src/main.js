// main.js
// نقطة البداية: ننشئ العالم والشخصية والتحكم، ونشغّل "حلقة اللعبة"
// اللي تتكرر كل إطار (حوالي 60 مرة بالثانية): تحديث ← رسم ← تحديث ← رسم...

import { CONFIG } from './config.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { Obstacles } from './obstacles.js';
import { Coins } from './coins.js';

const container = document.getElementById('game');

const world = new World(container);
const player = new Player(world.scene);
const coins = new Coins(world.scene);
// كل ما يطلع صف عقبات، نبلّغ العملات عشان تنحط بالأماكن الفاضية
const obstacles = new Obstacles(world.scene, (z, length, laneTypes) => coins.onRow(z, length, laneTypes));

const coinCountEl = document.getElementById('coin-count');

// حالة اللعبة: 'running' (شغالة) أو 'dead' (صدم)
let state = 'running';
let speed = CONFIG.startSpeed;
let deadTimer = 0;
let coinCount = 0;

function restart() {
  state = 'running';
  speed = CONFIG.startSpeed;
  coinCount = 0;
  coinCountEl.textContent = '0';
  player.reset();
  coins.reset(); // لازم قبل العقبات، لأن العقبات تضيف عملات وهي تبدأ
  obstacles.reset();
}

// كل أمر من التحكم يروح للشخصية
new Input(container, (action) => {
  if (state !== 'running') return;
  if (action === 'left') player.moveLeft();
  if (action === 'right') player.moveRight();
  if (action === 'up') player.jump();
  if (action === 'down') player.slide();
});

let lastTime = performance.now();

// ---- عداد الإطارات (افتح الرابط مع ?fps عشان يظهر) ----
const fpsEl = document.getElementById('fps');
const showFps = new URLSearchParams(location.search).has('fps');
fpsEl.hidden = !showFps;
let fpsFrames = 0;
let fpsTime = 0;

function loop(now) {
  requestAnimationFrame(loop);

  // dt = الوقت بين الإطار هذا واللي قبله (بالثواني).
  // نحدّه بـ 0.05 عشان لو التبويب تجمّد شوي ما تقفز اللعبة فجأة.
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (state === 'running') {
    // السرعة تزيد شوي شوي لين توصل الحد الأقصى
    speed = Math.min(CONFIG.maxSpeed, speed + CONFIG.speedIncrease * dt);

    player.update(dt, speed);
    obstacles.update(dt, speed);
    world.update(dt, speed, player.x);

    // جمع العملات
    const got = coins.update(dt, speed, player.box);
    if (got > 0) {
      coinCount += got;
      coinCountEl.textContent = coinCount;
    }

    if (obstacles.checkCollision(player.box)) {
      state = 'dead';
      deadTimer = 0;
      player.crash();
      world.shake(0.35);
    }
  } else {
    // بعد الاصطدام: العالم يوقف والشخصية تطيح
    player.update(dt, 0);
    world.update(dt, 0, player.x);
    coins.update(dt, 0, player.box); // العملات تكمل دوران بس ما تتحرك
    deadTimer += dt;
    // مؤقتاً: نعيد اللعبة تلقائياً بعد ثانيتين (بالمرحلة 4 تصير شاشة "انتهت اللعبة")
    if (deadTimer > 2) restart();
  }

  world.render();

  if (showFps) {
    fpsFrames++;
    fpsTime += dt;
    if (fpsTime >= 0.5) {
      fpsEl.textContent = `${Math.round(fpsFrames / fpsTime)} FPS`;
      fpsFrames = 0;
      fpsTime = 0;
    }
  }
}

requestAnimationFrame(loop);

// للتجربة أثناء التطوير فقط: نقدر نوصل للعبة من أدوات المطوّر بالمتصفح
if (import.meta.env.DEV) {
  window.__game = { player, obstacles, coins, world, get coinCount() { return coinCount; }, get speed() { return speed; }, get state() { return state; } };
}
