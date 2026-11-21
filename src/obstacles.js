// obstacles.js
// العقبات: ثلاث أنواع
//   'low'   حاجز واطي          ← تقفز فوقه
//   'high'  لوحة عالية على عمودين ← تنزلق تحتها
//   'block' باص يسد الحارة كاملة ← لازم تغيّر الحارة
//
// نستخدم "إعادة التدوير" (Pool): نسوي عدد ثابت من كل نوع بالبداية،
// ونخفيها ونظهرها بدل ما ننشئ ونحذف أثناء اللعب (هذا يمنع التقطيع).

import * as THREE from 'three';
import { CONFIG, laneToX } from './config.js';

const SPAWN_Z = -105; // وين تظهر العقبات (بعيد، داخل الضباب)
const DESPAWN_Z = 10; // لما تعدي ورا الكاميرا نخفيها
const POOL_SIZE = 10; // كم وحدة من كل نوع

// ---------- رسم النقشات ----------

// خطوط مايلة (مثل حواجز الطرق)
function stripeTexture(c1, c2) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = c2;
  for (let i = -size; i < size * 2; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 16, 0);
    ctx.lineTo(i + 16 - size, size);
    ctx.lineTo(i - size, size);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ---------- تعريف كل نوع ----------

// كل نوع يرجع: mesh (الشكل) + أبعاد صندوق الاصطدام
function makeShared() {
  const w = CONFIG.laneWidth * 0.86; // عرض العقبة (أصغر من الحارة شوي)
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);

  const redStripes = stripeTexture('#ffffff', '#e63946');
  redStripes.repeat.set(3, 1);
  const yellowStripes = stripeTexture('#ffd166', '#222222');
  yellowStripes.repeat.set(3, 2);

  return {
    w,
    boxGeo,
    wheelGeo: new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14),
    redBoard: new THREE.MeshStandardMaterial({ map: redStripes, roughness: 0.6 }),
    yellowBoard: new THREE.MeshStandardMaterial({ map: yellowStripes, roughness: 0.6 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x8d99ae, roughness: 0.4, metalness: 0.5 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.8 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.15, metalness: 0.3 }),
    light: new THREE.MeshStandardMaterial({ color: 0xfff3b0, emissive: 0xffe066, emissiveIntensity: 0.8 }),
    busColors: [0xf4a261, 0x2a9d8f, 0xe76f51, 0x457b9d, 0x8338ec].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 })
    ),
  };
}

function part(geo, mat, sx, sy, sz, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// حاجز واطي: لوح مخطط أحمر وأبيض على رجلين
function buildLow(S) {
  const g = new THREE.Group();
  g.add(part(S.boxGeo, S.redBoard, S.w, 0.45, 0.18, 0, 0.6, 0));
  for (const side of [-1, 1]) {
    g.add(part(S.boxGeo, S.metal, 0.1, 0.85, 0.1, side * (S.w / 2 - 0.15), 0.42, 0));
    g.add(part(S.boxGeo, S.dark, 0.18, 0.06, 0.6, side * (S.w / 2 - 0.15), 0.03, 0));
  }
  // صندوق الاصطدام: من الأرض لين ارتفاع 0.85
  return { mesh: g, hit: { y0: 0, y1: 0.85, halfW: S.w / 2, halfD: 0.15 }, length: 0.4 };
}

// لوحة عالية: لازم تنزلق تحتها (عالية بما يكفي إنك ما تقدر تقفز فوقها)
function buildHigh(S) {
  const g = new THREE.Group();
  const bottom = 1.05;
  const top = 2.9;
  g.add(part(S.boxGeo, S.yellowBoard, S.w, top - bottom, 0.15, 0, (bottom + top) / 2, 0));
  for (const side of [-1, 1]) {
    g.add(part(S.boxGeo, S.metal, 0.12, top + 0.1, 0.12, side * (S.w / 2 + 0.02), (top + 0.1) / 2, 0));
  }
  return { mesh: g, hit: { y0: bottom, y1: top, halfW: S.w / 2, halfD: 0.1 }, length: 0.3 };
}

// باص: يسد الحارة كاملة، طوله يتغيّر
function buildBlock(S) {
  const g = new THREE.Group();
  const h = 2.8;
  const body = part(S.boxGeo, S.busColors[0], S.w, h - 0.35, 1, 0, 0.35 + (h - 0.35) / 2, 0);
  const windows = part(S.boxGeo, S.glass, S.w + 0.04, 0.7, 1, 0, 2.05, 0);
  const front = part(S.boxGeo, S.glass, S.w * 0.85, 0.9, 0.05, 0, 1.95, 0); // الزجاج الأمامي
  const lights = [-1, 1].map((s) => part(S.boxGeo, S.light, 0.3, 0.18, 0.05, s * (S.w / 2 - 0.3), 0.9, 0));
  g.add(body, windows, front, ...lights);

  // 4 عجلات (أسطوانات)
  const wheels = [];
  for (let i = 0; i < 4; i++) {
    const wheel = new THREE.Mesh(S.wheelGeo, S.dark);
    wheel.rotation.z = Math.PI / 2;
    wheel.castShadow = true;
    g.add(wheel);
    wheels.push(wheel);
  }
  g.userData = { body, windows, front, lights, wheels };
  return { mesh: g, hit: { y0: 0, y1: h, halfW: S.w / 2, halfD: 0.5 }, length: 1 };
}

// نضبط طول الباص ولونه كل مرة يظهر
function shapeBlock(S, ob, length) {
  const { body, windows, front, lights, wheels } = ob.mesh.userData;
  body.scale.z = length;
  body.material = S.busColors[Math.floor(Math.random() * S.busColors.length)];
  windows.scale.z = length - 0.6;
  front.position.z = length / 2 + 0.01;
  for (const l of lights) l.position.z = length / 2 + 0.01;
  const wz = length / 2 - 1.1;
  wheels.forEach((wheel, i) => {
    wheel.position.set((i % 2 ? 1 : -1) * (S.w / 2 - 0.1), 0.42, i < 2 ? -wz : wz);
  });
  ob.hit.halfD = length / 2;
  ob.length = length;
}

// ---------- مدير العقبات ----------

export class Obstacles {
  constructor(scene) {
    this.S = makeShared();
    this.pools = { low: [], high: [], block: [] };
    const builders = { low: buildLow, high: buildHigh, block: buildBlock };

    for (const type of Object.keys(builders)) {
      for (let i = 0; i < POOL_SIZE; i++) {
        const ob = builders[type](this.S);
        ob.type = type;
        ob.active = false;
        ob.box = new THREE.Box3();
        ob.mesh.visible = false;
        scene.add(ob.mesh);
        this.pools[type].push(ob);
      }
    }
    this.active = []; // العقبات الظاهرة حالياً
    this.reset();
  }

  reset() {
    for (const ob of this.active) {
      ob.active = false;
      ob.mesh.visible = false;
    }
    this.active.length = 0;

    // نحط كم صف من البداية عشان اللاعب ما ينتظر (أول صف على بعد 45 متر)
    let z = -45;
    while (z > SPAWN_Z) {
      const rowLength = this._spawnRow(z);
      z -= rowLength + this._gap(CONFIG.startSpeed);
    }
    // الصف الجاي يطلع لما توصل النقطة z لمكان الظهور
    this.distanceToNextRow = SPAWN_Z - z;
  }

  // المسافة الفاضية بين صف والثاني: تكبر مع السرعة عشان يلحق اللاعب يتصرف
  _gap(speed) {
    return 12 + speed * 0.55 + Math.random() * 8;
  }

  // ناخذ عقبة غير مستخدمة من المخزن
  _take(type) {
    const ob = this.pools[type].find((o) => !o.active);
    if (!ob) return null;
    ob.active = true;
    ob.mesh.visible = true;
    this.active.push(ob);
    return ob;
  }

  _place(type, lane, z) {
    const ob = this._take(type);
    if (!ob) return 0;
    if (type === 'block') shapeBlock(this.S, ob, 6 + Math.random() * 6);
    ob.lane = lane;
    ob.mesh.position.set(laneToX(lane), 0, z - ob.length / 2);
    return ob.length;
  }

  // نطلع "صف" عقبات جديد. نتأكد دايماً إن فيه حارة وحدة على الأقل ما فيها باص
  _spawnRow(z) {
    const lanes = [0, 1, 2].sort(() => Math.random() - 0.5); // نخلط الحارات
    const count = Math.random() < 0.45 ? 1 : 2; // كم حارة فيها عقبة
    let longest = 0;
    let blocks = 0;

    for (let i = 0; i < count; i++) {
      const r = Math.random();
      let type = r < 0.35 ? 'low' : r < 0.65 ? 'high' : 'block';
      // بحد أقصى حارتين فيها عقبات = دايماً فيه حارة مفتوحة.
      // ونقلل احتمال باصين جنب بعض عشان ما تصير صعبة مرة
      if (type === 'block' && blocks >= 1 && count === 2 && Math.random() < 0.5) type = 'low';
      if (type === 'block') blocks++;
      longest = Math.max(longest, this._place(type, lanes[i], z));
    }
    return longest;
  }

  // speed: سرعة اللعبة الحالية
  update(dt, speed) {
    const distance = speed * dt;

    // 1) نحرك كل العقبات باتجاه اللاعب
    for (let i = this.active.length - 1; i >= 0; i--) {
      const ob = this.active[i];
      ob.mesh.position.z += distance;
      // عدت ورا الكاميرا؟ نرجعها للمخزن
      if (ob.mesh.position.z - ob.length / 2 > DESPAWN_Z) {
        ob.active = false;
        ob.mesh.visible = false;
        this.active.splice(i, 1);
      }
    }

    // 2) وقت صف جديد؟
    this.distanceToNextRow -= distance;
    if (this.distanceToNextRow <= 0) {
      const rowLength = this._spawnRow(SPAWN_Z);
      this.distanceToNextRow = rowLength + this._gap(speed);
    }
  }

  // نشيك إذا اللاعب صدم أي عقبة. نرجع true لو فيه اصطدام
  checkCollision(playerBox) {
    for (const ob of this.active) {
      const p = ob.mesh.position;
      // نتجاهل العقبات البعيدة بسرعة بدون حسابات
      if (Math.abs(p.z) > ob.length / 2 + 2) continue;
      const h = ob.hit;
      ob.box.min.set(p.x - h.halfW, h.y0, p.z - h.halfD);
      ob.box.max.set(p.x + h.halfW, h.y1, p.z + h.halfD);
      if (ob.box.intersectsBox(playerBox)) return true;
    }
    return false;
  }
}
