// main.js
// نقطة البداية: ننشئ العالم والشخصية والتحكم، ونشغّل "حلقة اللعبة"
// اللي تتكرر كل إطار (حوالي 60 مرة بالثانية): تحديث ← رسم ← تحديث ← رسم...

import { CONFIG } from './config.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Input } from './input.js';

const container = document.getElementById('game');

const world = new World(container);
const player = new Player(world.scene);

// كل أمر من التحكم يروح للشخصية
new Input(container, (action) => {
  if (action === 'left') player.moveLeft();
  if (action === 'right') player.moveRight();
  if (action === 'up') player.jump();
  if (action === 'down') player.slide();
});

let speed = CONFIG.startSpeed;
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

  player.update(dt, speed);
  world.update(dt, speed, player.x);
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
