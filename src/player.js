// player.js
// الشخصية: مبنية من مكعبات بسيطة (جسم، راس، يدين، رجلين، شنطة).
// مسؤولة عن: التنقل بين الحارات، القفز، الانزلاق، وحركة الجري.

import * as THREE from 'three';
import { CONFIG, laneToX } from './config.js';

// أبعاد صندوق الاصطدام (نستخدمه في مرحلة العقبات)
const HALF_WIDTH = 0.35;
const HALF_DEPTH = 0.3;
const STAND_HEIGHT = 1.75;
const SLIDE_HEIGHT = 0.8;

export class Player {
  constructor(scene) {
    this.mesh = this._build();
    scene.add(this.mesh);
    this.box = new THREE.Box3(); // صندوق الاصطدام
    this.reset();
  }

  // يرجع الشخصية لوضع البداية
  reset() {
    this.lane = 1; // نبدأ بالحارة الوسطى
    this.x = laneToX(this.lane);
    this.y = 0;
    this.velocityY = 0;
    this.isGrounded = true;
    this.slideTimer = 0; // > 0 يعني الشخصية تنزلق الحين
    this.slideQueued = false; // لو ضغط تحت وهو بالهوا، ينزلق أول ما يلمس الأرض
    this.runPhase = 0; // لتحريك اليدين والرجلين
    this.mesh.position.set(this.x, 0, 0);
  }

  // نبني الشخصية من مكعبات
  _build() {
    const root = new THREE.Group();

    const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const skin = mat(0xf1c27d);
    const shirt = mat(0xe63946);
    const pants = mat(0x1d3557);
    const shoes = mat(0xffffff);
    const cap = mat(0x2a9d8f);
    const bag = mat(0xffb703);

    const box = (w, h, d, material) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      m.castShadow = true;
      return m;
    };

    // "body" هو المحور اللي نميّله وقت الانزلاق (يدور حول القدمين)
    const body = new THREE.Group();
    root.add(body);

    const torso = box(0.62, 0.7, 0.36, shirt);
    torso.position.y = 1.08;
    body.add(torso);

    const head = box(0.44, 0.44, 0.42, skin);
    head.position.y = 1.68;
    body.add(head);

    // كاب: الجزء الأمامي (البروز) يطلع لقدام باتجاه -z
    const capTop = box(0.48, 0.14, 0.46, cap);
    capTop.position.y = 1.93;
    const capBrim = box(0.46, 0.05, 0.25, cap);
    capBrim.position.set(0, 1.87, -0.32);
    body.add(capTop, capBrim);

    // شنطة على الظهر (الظهر باتجاه الكاميرا +z)
    const backpack = box(0.46, 0.5, 0.2, bag);
    backpack.position.set(0, 1.1, 0.28);
    body.add(backpack);

    // نسوي طرف (يد أو رجل) معلّق من نقطة دوران عشان يتأرجح بشكل طبيعي
    const limb = (x, y, w, h, material, footMat) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, 0);
      const part = box(w, h, w, material);
      part.position.y = -h / 2;
      pivot.add(part);
      if (footMat) {
        const foot = box(w + 0.04, 0.12, w + 0.16, footMat);
        foot.position.set(0, -h + 0.02, -0.06);
        pivot.add(foot);
      }
      body.add(pivot);
      return pivot;
    };

    this.leftArm = limb(-0.42, 1.38, 0.18, 0.62, skin);
    this.rightArm = limb(0.42, 1.38, 0.18, 0.62, skin);
    this.leftLeg = limb(-0.16, 0.73, 0.24, 0.66, pants, shoes);
    this.rightLeg = limb(0.16, 0.73, 0.24, 0.66, pants, shoes);

    this.body = body;
    return root;
  }

  // ---------- الأوامر (تجي من التحكم) ----------

  moveLeft() {
    if (this.lane > 0) this.lane--;
  }

  moveRight() {
    if (this.lane < CONFIG.laneCount - 1) this.lane++;
  }

  jump() {
    if (this.isGrounded) {
      this.slideTimer = 0; // القفز يلغي الانزلاق
      this.velocityY = CONFIG.jumpVelocity;
      this.isGrounded = false;
    }
  }

  slide() {
    if (this.isGrounded) {
      this.slideTimer = CONFIG.slideDuration;
    } else {
      // بالهوا: ينزل بسرعة وينزلق أول ما يلمس الأرض
      this.velocityY = -CONFIG.jumpVelocity * 1.6;
      this.slideQueued = true;
    }
  }

  get isSliding() {
    return this.slideTimer > 0;
  }

  // ---------- التحديث كل إطار ----------

  update(dt, speed) {
    // 1) التنقل بين الحارات: نقرّب x من مكان الحارة المطلوبة بنعومة
    const targetX = laneToX(this.lane);
    const dx = targetX - this.x;
    this.x += dx * Math.min(1, dt * CONFIG.laneChangeSpeed);

    // 2) القفز والجاذبية
    if (!this.isGrounded) {
      this.velocityY -= CONFIG.gravity * dt;
      this.y += this.velocityY * dt;
      if (this.y <= 0) {
        this.y = 0;
        this.velocityY = 0;
        this.isGrounded = true;
        if (this.slideQueued) {
          this.slideQueued = false;
          this.slideTimer = CONFIG.slideDuration;
        }
      }
    }

    // 3) مؤقت الانزلاق
    if (this.slideTimer > 0) this.slideTimer -= dt;

    this.mesh.position.set(this.x, this.y, 0);

    // 4) الحركات (أنيميشن)
    this._animate(dt, speed, dx);

    // 5) نحدّث صندوق الاصطدام
    const h = this.isSliding ? SLIDE_HEIGHT : STAND_HEIGHT;
    this.box.min.set(this.x - HALF_WIDTH, this.y, -HALF_DEPTH);
    this.box.max.set(this.x + HALF_WIDTH, this.y + h, HALF_DEPTH);
  }

  _animate(dt, speed, dx) {
    // سرعة تأرجح اليدين والرجلين تزيد مع سرعة الجري
    this.runPhase += dt * speed * 0.75;
    const swing = Math.sin(this.runPhase);
    const smooth = (current, target, rate) => current + (target - current) * Math.min(1, dt * rate);

    let legL, legR, armL, armR;
    if (!this.isGrounded) {
      // وضع القفز: الرجلين مثنية واليدين فوق
      // (الدوران الموجب = الطرف يروح لقدام)
      legL = 0.9;
      legR = -0.4;
      armL = 2.6;
      armR = 2.6;
    } else if (this.isSliding) {
      // الجسم مايل لورا، فنمد الرجلين لقدام على الأرض
      legL = legR = 1.4;
      armL = armR = 1.0;
    } else {
      // الجري: كل رجل عكس اليد اللي بنفس الجهة
      legL = swing * 0.9;
      legR = -swing * 0.9;
      armL = -swing * 0.8;
      armR = swing * 0.8;
    }
    this.leftLeg.rotation.x = smooth(this.leftLeg.rotation.x, legL, 20);
    this.rightLeg.rotation.x = smooth(this.rightLeg.rotation.x, legR, 20);
    this.leftArm.rotation.x = smooth(this.leftArm.rotation.x, armL, 20);
    this.rightArm.rotation.x = smooth(this.rightArm.rotation.x, armR, 20);

    // الانزلاق: الجسم يميل لورا (نحو الكاميرا)
    const lean = this.isSliding ? 1.15 : 0;
    this.body.rotation.x = smooth(this.body.rotation.x, lean, 18);

    // نطّة خفيفة مع كل خطوة وقت الجري
    const bob = this.isGrounded && !this.isSliding ? Math.abs(swing) * 0.08 : 0;
    this.body.position.y = smooth(this.body.position.y, bob, 25);

    // ميلان بسيط باتجاه الحركة وقت تغيير الحارة
    this.mesh.rotation.z = smooth(this.mesh.rotation.z, -dx * 0.12, 12);
    this.mesh.rotation.y = smooth(this.mesh.rotation.y, -dx * 0.15, 12);
  }
}
