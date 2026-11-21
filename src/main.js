// main.js
// نقطة البداية: ننشئ كل أجزاء اللعبة ونربطها ببعض، ونشغّل "حلقة اللعبة"
// اللي تتكرر كل إطار (حوالي 60 مرة بالثانية): تحديث ← رسم ← تحديث ← رسم...
//
// حالات اللعبة:
//   'menu'    شاشة البداية (الشخصية واقفة)
//   'running' اللعب
//   'dead'    صدم للتو (نعرض حركة الطيحة ثانية)
//   'over'    شاشة "انتهت اللعبة"

import { CONFIG } from './config.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { Obstacles } from './obstacles.js';
import { Coins } from './coins.js';
import { UI } from './ui.js';
import { Sound } from './sound.js';

const container = document.getElementById('game');

const world = new World(container);
const player = new Player(world.scene);
const coins = new Coins(world.scene);
// كل ما يطلع صف عقبات، نبلّغ العملات عشان تنحط بالأماكن الفاضية
const obstacles = new Obstacles(world.scene, (z, length, laneTypes) => coins.onRow(z, length, laneTypes));
const ui = new UI(startGame);
const sound = new Sound();

let state = 'menu';
let speed = 0;
let distance = 0; // المسافة المقطوعة بالمتر
let coinCount = 0;
let deadTimer = 0;
let level = 1;

// الصعوبة من 0 (البداية) لين 1 (أقصى سرعة): كل ما زادت السرعة زادت الصعوبة
function difficulty() {
  return (speed - CONFIG.startSpeed) / (CONFIG.maxSpeed - CONFIG.startSpeed);
}

// نبدأ (أو نعيد) اللعبة من الصفر
function startGame() {
  if (state === 'running' || state === 'dead') return;
  sound.unlock(); // أول ضغطة تفتح الصوت (مهم للآيفون)
  state = 'running';
  speed = CONFIG.startSpeed;
  distance = 0;
  coinCount = 0;
  level = 1;
  player.reset();
  coins.reset(); // لازم قبل العقبات، لأن العقبات تضيف عملات وهي تبدأ
  obstacles.reset();
  ui.showHUD();
}

// كل أمر من التحكم يروح للشخصية (بس وقت اللعب)
new Input(container, (action) => {
  if (state !== 'running') return;
  if (action === 'left') player.moveLeft();
  if (action === 'right') player.moveRight();
  if (action === 'up' && player.jump()) sound.playJump(); // هووب!
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
    // السرعة تزيد مع الوقت: بسرعة بالبداية، وتخف الزيادة كل ما قربنا من الأقصى
    const d = difficulty();
    const rate = CONFIG.speedIncrease * (1 - 0.75 * d);
    speed = Math.min(CONFIG.maxSpeed, speed + rate * dt);
    distance += speed * dt;

    // مستوى جديد كل مسافة معينة: نعرض رسالة للاعب
    const newLevel = 1 + Math.floor(distance / CONFIG.levelDistance);
    if (newLevel > level) {
      level = newLevel;
      ui.showToast(`المستوى ${level} 🔥`);
    }

    player.update(dt, speed);
    obstacles.update(dt, speed, d);
    world.update(dt, speed, player.x);
    coinCount += coins.update(dt, speed, player.box);
    ui.updateHUD(distance, coinCount);

    if (obstacles.checkCollision(player.box)) {
      state = 'dead';
      deadTimer = 0;
      player.crash();
      world.shake(0.35);
      sound.playCrash(); // وا أبوي!
    }
  } else {
    // في القائمة أو بعد الاصطدام: العالم واقف، والشخصية والعملات تتحرك بمكانها
    player.update(dt, 0);
    world.update(dt, 0, player.x);
    coins.update(dt, 0, player.box);

    // بعد ثانية من الطيحة نعرض شاشة "انتهت اللعبة"
    if (state === 'dead') {
      deadTimer += dt;
      if (deadTimer > 1) {
        state = 'over';
        ui.showGameOver(distance, coinCount);
      }
    }
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
  window.__game = {
    player,
    obstacles,
    coins,
    world,
    sound,
    ui,
    get coinCount() { return coinCount; },
    get distance() { return distance; },
    get speed() { return speed; },
    get level() { return level; },
    get state() { return state; },
  };
}
