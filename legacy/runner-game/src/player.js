// player.js
// الشخصية: رجّال لابس لبس عماني (دشداشة بيضاء، كمّة مطرّزة، فراخة، نعال)
// مبنية من مكعبات وأسطوانة بسيطة.
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
    this.isDead = false;
    this.body.rotation.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.position.set(this.x, 0, 0);
  }

  // نبني الشخصية من مكعبات
  _build() {
    const root = new THREE.Group();

    const mat = (color, extra = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra });
    const skin = mat(0xd9a066);
    const dishdasha = mat(0xf3f1ea); // الدشداشة البيضاء
    const sandals = mat(0x6b3e1f); // نعال جلد بني
    const hair = mat(0x1a1a1a);
    const tassel = mat(0xc9a96e); // الفراخة (الكشكوشة)

    const box = (w, h, d, material) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      m.castShadow = true;
      return m;
    };

    // "body" هو المحور اللي نميّله وقت الانزلاق (يدور حول القدمين)
    const body = new THREE.Group();
    root.add(body);

    // ---- الدشداشة: الجزء العلوي ----
    const torso = box(0.62, 0.72, 0.36, dishdasha);
    torso.position.y = 1.07;
    body.add(torso);

    // ---- الدشداشة: الجزء السفلي (أعرض شوي عشان يبين إنها ثوب طويل) ----
    const skirt = box(0.68, 0.42, 0.42, dishdasha);
    skirt.position.y = 0.56;
    body.add(skirt);

    // ---- الفراخة: الحبل اللي ينزل من رقبة الدشداشة (قدّام) ----
    const rope = box(0.03, 0.32, 0.03, tassel);
    rope.position.set(0, 1.26, -0.2);
    const tasselEnd = box(0.07, 0.1, 0.07, tassel);
    tasselEnd.position.set(0, 1.07, -0.2);
    body.add(rope, tasselEnd);

    // ---- الراس ----
    const head = box(0.44, 0.44, 0.42, skin);
    head.position.y = 1.68;
    body.add(head);

    // شعر أسود يبين من ورا تحت الكمّة
    const hairBack = box(0.45, 0.14, 0.06, hair);
    hairBack.position.set(0, 1.8, 0.2);
    body.add(hairBack);

    // ---- الكمّة العمانية: أسطوانة بيضاء عليها تطريز ملوّن ----
    const kummaSide = mat(0xffffff, { map: this._makeKummaTexture() });
    const kummaTop = mat(0xf7f5ef);
    // الأسطوانة لها 3 أوجه مواد: الجانب، الغطا فوق، الغطا تحت
    const kumma = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.26, 0.2, 20), [
      kummaSide,
      kummaTop,
      kummaTop,
    ]);
    kumma.position.y = 1.97;
    kumma.castShadow = true;
    body.add(kumma);

    // نسوي طرف (يد أو رجل) معلّق من نقطة دوران عشان يتأرجح بشكل طبيعي.
    // tipMat/tipH: قطعة في آخر الطرف (الكف أو النعال)
    const limb = (x, y, w, h, material, tipMat, tipH, isFoot) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, 0);
      const part = box(w, h, w, material);
      part.position.y = -h / 2;
      pivot.add(part);
      if (isFoot) {
        const foot = box(w + 0.02, tipH, w + 0.14, tipMat);
        foot.position.set(0, -h - tipH / 2 + 0.02, -0.06);
        pivot.add(foot);
      } else {
        const hand = box(w * 0.85, tipH, w * 0.85, tipMat);
        hand.position.y = -h - tipH / 2;
        pivot.add(hand);
      }
      body.add(pivot);
      return pivot;
    };

    // اليدين: كم أبيض طويل + كف
    this.leftArm = limb(-0.42, 1.38, 0.19, 0.52, dishdasha, skin, 0.13);
    this.rightArm = limb(0.42, 1.38, 0.19, 0.52, dishdasha, skin, 0.13);
    // الرجلين: الدشداشة نازلة لين الكعب + نعال
    this.leftLeg = limb(-0.16, 0.73, 0.25, 0.64, dishdasha, sandals, 0.07, true);
    this.rightLeg = limb(0.16, 0.73, 0.25, 0.64, dishdasha, sandals, 0.07, true);

    this.body = body;
    return root;
  }

  // نرسم نقشة تطريز الكمّة على صورة صغيرة ونلفّها حول الأسطوانة
  _makeKummaTexture() {
    const w = 256;
    const h = 32;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const colors = ['#c0392b', '#1f6f8b', '#2e8b57', '#d4a017'];
    // خطين رفيعين فوق وتحت
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(0, 2, w, 3);
    ctx.fillRect(0, h - 5, w, 3);
    // معيّنات (أشكال ماسية) ملونة بالوسط
    for (let i = 0; i < 16; i++) {
      const cx = i * 16 + 8;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.moveTo(cx, 8);
      ctx.lineTo(cx + 6, h / 2);
      ctx.lineTo(cx, h - 8);
      ctx.lineTo(cx - 6, h / 2);
      ctx.closePath();
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ---------- الأوامر (تجي من التحكم) ----------

  moveLeft() {
    if (this.lane > 0) this.lane--;
  }

  moveRight() {
    if (this.lane < CONFIG.laneCount - 1) this.lane++;
  }

  // يرجع true لو قفز فعلاً (عشان نشغّل صوت "هووب" بس وقت القفزة الحقيقية)
  jump() {
    if (!this.isGrounded) return false;
    this.slideTimer = 0; // القفز يلغي الانزلاق
    this.velocityY = CONFIG.jumpVelocity;
    this.isGrounded = false;
    return true;
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

  // لما يصطدم: يطيح على ظهره
  crash() {
    this.isDead = true;
    this.slideTimer = 0;
  }

  get isSliding() {
    return this.slideTimer > 0;
  }

  // ---------- التحديث كل إطار ----------

  update(dt, speed) {
    if (this.isDead) {
      this._animateCrash(dt);
      return;
    }

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

  _animateCrash(dt) {
    const smooth = (current, target) => current + (target - current) * Math.min(1, dt * 10);
    // يطيح لورا، وينزل للأرض لو كان بالهوا
    this.body.rotation.x = smooth(this.body.rotation.x, 1.45);
    this.y = Math.max(0, this.y - 8 * dt);
    this.mesh.position.y = this.y;
    this.leftArm.rotation.x = smooth(this.leftArm.rotation.x, 2.8);
    this.rightArm.rotation.x = smooth(this.rightArm.rotation.x, 2.2);
    this.leftLeg.rotation.x = smooth(this.leftLeg.rotation.x, 1.6);
    this.rightLeg.rotation.x = smooth(this.rightLeg.rotation.x, 1.2);
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
    } else if (speed === 0) {
      // واقف (في شاشة البداية)
      legL = legR = armL = armR = 0;
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
    const bob = this.isGrounded && !this.isSliding && speed > 0 ? Math.abs(swing) * 0.08 : 0;
    this.body.position.y = smooth(this.body.position.y, bob, 25);

    // ميلان بسيط باتجاه الحركة وقت تغيير الحارة
    this.mesh.rotation.z = smooth(this.mesh.rotation.z, -dx * 0.12, 12);
    this.mesh.rotation.y = smooth(this.mesh.rotation.y, -dx * 0.15, 12);
  }
}
