// coins.js
// العملات: أسطوانات ذهبية تدور.
//
// للأداء: كل العملات مرسومة بـ "InstancedMesh" = شكل واحد يترسم عدة مرات
// بأماكن مختلفة في أمر رسم واحد. 80 عملة تكلّف نفس عملة وحدة تقريباً!
//
// أماكن العملات تتحدد مع كل صف عقبات (obstacles.js يبلّغنا):
//   - خط عملات في حارة فاضية
//   - قوس عملات فوق الحاجز الواطي (تجمعها وأنت تقفز)

import * as THREE from 'three';
import { laneToX } from './config.js';

const MAX_COINS = 80;
const COIN_Y = 0.9; // ارتفاع العملة عن الأرض
const COIN_SPACING = 2; // المسافة بين كل عملة والثانية
const DESPAWN_Z = 10;
const COLLECT_TIME = 0.2; // مدة حركة الجمع (العملة تطير لفوق وتصغر)

// مسافات الالتقاط (نص عرض اللاعب + نص قطر العملة تقريباً)
const PICK_X = 0.75;
const PICK_Z = 0.7;
const PICK_Y = 0.4;

export class Coins {
  constructor(scene) {
    // نوقف الأسطوانة عشان وجهها يطالع الكاميرا
    const geo = new THREE.CylinderGeometry(0.38, 0.38, 0.1, 20);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffc83d,
      emissive: 0x8a5a00, // توهّج خفيف عشان تبين حتى بالظل
      emissiveIntensity: 0.5,
      metalness: 0.35,
      roughness: 0.3,
    });

    this.mesh = new THREE.InstancedMesh(geo, mat, MAX_COINS);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // نحدّثها كل إطار
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false; // العملات منتشرة، فنرسمها دايماً
    scene.add(this.mesh);

    // بيانات كل عملة
    this.coins = Array.from({ length: MAX_COINS }, () => ({
      active: false,
      collecting: false,
      x: 0,
      y: 0,
      z: 0,
      t: 0,
    }));

    this.dummy = new THREE.Object3D(); // نستخدمه لحساب مصفوفة كل عملة
    this.spin = 0;
    this.reset();
  }

  reset() {
    for (const c of this.coins) {
      c.active = false;
      c.collecting = false;
    }
    this._writeMatrices();
  }

  _add(x, y, z) {
    const c = this.coins.find((c) => !c.active);
    if (!c) return; // ما فيه مكان، نتجاهل
    c.active = true;
    c.collecting = false;
    c.x = x;
    c.y = y;
    c.z = z;
  }

  // خط عملات من zFrom (الأقرب) لين zTo (الأبعد)
  addLine(lane, zFrom, zTo) {
    for (let z = zFrom; z >= zTo; z -= COIN_SPACING) this._add(laneToX(lane), COIN_Y, z);
  }

  // قوس عملات فوق نقطة معينة (شكل القفزة)
  addArc(lane, zCenter) {
    for (let i = -3; i <= 3; i++) {
      const k = i / 3.5;
      this._add(laneToX(lane), COIN_Y + 2.1 * (1 - k * k), zCenter + i * 1.8);
    }
  }

  // ينادى من obstacles.js كل ما يطلع صف جديد.
  // z: بداية الصف، length: طوله، laneTypes: نوع العقبة بكل حارة (أو null لو فاضية)
  onRow(z, length, laneTypes) {
    // الحارات الفاضية (بدون عقبة)
    const free = [];
    laneTypes.forEach((type, lane) => {
      if (type === null) free.push(lane);
    });

    // خط عملات في وحدة من الحارات الفاضية (أغلب الأحيان)
    if (free.length && Math.random() < 0.75) {
      const lane = free[Math.floor(Math.random() * free.length)];
      this.addLine(lane, z + 4, z - length - 6);
    }

    // قوس عملات فوق الحاجز الواطي (نص المرات)
    laneTypes.forEach((type, lane) => {
      if (type === 'low' && Math.random() < 0.5) this.addArc(lane, z - 0.2);
    });
  }

  // يرجع عدد العملات اللي انجمعت بهالإطار
  update(dt, speed, playerBox) {
    const distance = speed * dt;
    this.spin += dt * 4;
    let collected = 0;

    // مركز اللاعب
    const px = (playerBox.min.x + playerBox.max.x) / 2;

    for (const c of this.coins) {
      if (!c.active) continue;
      c.z += distance;

      if (c.collecting) {
        // حركة الجمع: تطير لفوق وتصغر
        c.t += dt;
        c.y += dt * 6;
        if (c.t >= COLLECT_TIME) c.active = false;
        continue;
      }

      if (c.z > DESPAWN_Z) {
        c.active = false;
        continue;
      }

      // هل اللاعب لمس العملة؟ (فحص سريع بالمسافات)
      if (
        Math.abs(c.z) < PICK_Z &&
        Math.abs(c.x - px) < PICK_X &&
        c.y > playerBox.min.y - PICK_Y &&
        c.y < playerBox.max.y + PICK_Y
      ) {
        c.collecting = true;
        c.t = 0;
        collected++;
      }
    }

    this._writeMatrices();
    return collected;
  }

  // نكتب مكان ودوران وحجم كل عملة في الـ InstancedMesh
  _writeMatrices() {
    const d = this.dummy;
    for (let i = 0; i < MAX_COINS; i++) {
      const c = this.coins[i];
      if (c.active) {
        d.position.set(c.x, c.y, c.z);
        d.rotation.set(0, this.spin + c.z * 0.3, 0); // كل عملة بزاوية مختلفة شوي
        const s = c.collecting ? 1 - c.t / COLLECT_TIME : 1;
        d.scale.set(s, s, s);
      } else {
        d.scale.set(0, 0, 0); // العملة المخفية نصغّرها لصفر
      }
      d.updateMatrix();
      this.mesh.setMatrixAt(i, d.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
