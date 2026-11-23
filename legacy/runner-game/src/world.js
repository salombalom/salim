// world.js
// كل شي يخص "العالم": الرسّام (renderer)، المشهد، الكاميرا، الإضاءة، الظلال،
// الطريق، الرصيف، المباني والأشجار على الجوانب.
//
// فكرة مهمة: الشخصية ما تتحرك للأمام فعلياً! هي ثابتة عند z = 0،
// والعالم كله يتحرك باتجاهها (نحو +z). هذا أسهل وأدق من تحريك الشخصية لمسافات بعيدة.

import * as THREE from 'three';
import { CONFIG } from './config.js';

const SKY_COLOR = 0x8fd3ff;
const ROAD_LENGTH = 220; // طول الطريق المرئي
const ROAD_START_Z = 20; // الطريق يبدأ ورا الكاميرا شوي
const SCENERY_END_Z = -170; // أبعد نقطة نحط فيها مباني

export class World {
  constructor(container) {
    this.roadWidth = CONFIG.laneWidth * CONFIG.laneCount + 0.6;

    this._createRenderer(container);
    this._createScene();
    this._createLights();
    this._createRoad();
    this._createScenery();

    // نحدّث الكاميرا لما يتغير حجم الشاشة أو يتقلب الجوال
    window.addEventListener('resize', () => this._onResize());
    this._onResize();
  }

  // ---------- الإعداد ----------

  _createRenderer(container) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.maxPixelRatio));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap; // ظلال بأطراف ناعمة (فلترة PCF)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; // ألوان أحلى
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);
  }

  _createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SKY_COLOR);
    // الضباب يخفي الأشياء البعيدة لما تظهر فجأة، ويعطي عمق للمشهد
    this.scene.fog = new THREE.Fog(SKY_COLOR, 45, 120);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 150);
    this.cameraBase = new THREE.Vector3(0, 4.2, 7.5); // مكان الكاميرا ورا الشخصية وفوقها
    this.camera.position.copy(this.cameraBase);
  }

  _createLights() {
    // ضوء السماء: يعطي إضاءة عامة ناعمة (أزرق من فوق، أخضر من تحت)
    const hemi = new THREE.HemisphereLight(0xdff2ff, 0x6b8f4a, 1.4);
    this.scene.add(hemi);

    // الشمس: ضوء اتجاهي وهو الوحيد اللي يرمي ظلال (عشان الأداء)
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.6);
    sun.position.set(7, 16, 2);
    sun.target.position.set(0, 0, -10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(CONFIG.shadowMapSize, CONFIG.shadowMapSize);

    // منطقة الظل: نغطي بس المنطقة القريبة من اللاعب (أصغر = ظل أوضح)
    const cam = sun.shadow.camera;
    cam.left = -12;
    cam.right = 12;
    cam.top = 22;
    cam.bottom = -14;
    cam.near = 1;
    cam.far = 50;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;

    this.scene.add(sun);
    this.scene.add(sun.target);
    this.sun = sun;
  }

  // نرسم صورة صغيرة (canvas) ونستخدمها كـ "نسيج" للطريق فيها خطوط الحارات.
  // بعدين نحرّك النسيج بدل ما نحرك الطريق نفسه = حركة رخيصة جداً على الأداء.
  _makeRoadTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // الأسفلت
    ctx.fillStyle = '#3b3d46';
    ctx.fillRect(0, 0, size, size);
    // نقاط عشوائية تعطي ملمس للأسفلت
    for (let i = 0; i < 1400; i++) {
      const shade = 50 + Math.random() * 30;
      ctx.fillStyle = `rgb(${shade},${shade},${shade + 6})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
    }

    // نحول موقع (بالمتر) إلى بكسل في الصورة
    const toPx = (x) => ((x + this.roadWidth / 2) / this.roadWidth) * size;

    // خطوط متقطعة بين الحارات
    ctx.fillStyle = '#f5f5f5';
    for (let i = 1; i < CONFIG.laneCount; i++) {
      const x = toPx((i - CONFIG.laneCount / 2) * CONFIG.laneWidth);
      ctx.fillRect(x - 3, 0, 6, size * 0.45);
    }
    // خطوط صفراء متصلة على الأطراف
    ctx.fillStyle = '#f7c948';
    ctx.fillRect(toPx(-this.roadWidth / 2 + 0.12) - 2, 0, 5, size);
    ctx.fillRect(toPx(this.roadWidth / 2 - 0.12) - 3, 0, 5, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    return tex;
  }

  _makeSidewalkTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#c9c1b4';
    ctx.fillRect(0, 0, size, size);
    // فواصل البلاط
    ctx.fillStyle = '#a89f92';
    ctx.fillRect(0, 0, size, 3);
    ctx.fillRect(0, 0, 3, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    return tex;
  }

  _createRoad() {
    const centerZ = ROAD_START_Z - ROAD_LENGTH / 2;

    // الطريق
    this.roadTileLength = 8; // كل 8 متر يتكرر النسيج
    this.roadTexture = this._makeRoadTexture();
    this.roadTexture.repeat.set(1, ROAD_LENGTH / this.roadTileLength);
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(this.roadWidth, ROAD_LENGTH),
      new THREE.MeshStandardMaterial({ map: this.roadTexture, roughness: 0.9 })
    );
    road.rotation.x = -Math.PI / 2; // نخلي المستوى أفقي
    road.position.z = centerZ;
    road.receiveShadow = true;
    this.scene.add(road);

    // الرصيف على الجانبين
    this.sidewalkWidth = 2.4;
    this.sidewalkTileLength = 2;
    this.sidewalkTexture = this._makeSidewalkTexture();
    this.sidewalkTexture.repeat.set(this.sidewalkWidth / 2, ROAD_LENGTH / this.sidewalkTileLength);
    const sidewalkMat = new THREE.MeshStandardMaterial({ map: this.sidewalkTexture, roughness: 1 });
    const sidewalkGeo = new THREE.BoxGeometry(this.sidewalkWidth, 0.25, ROAD_LENGTH);
    for (const side of [-1, 1]) {
      const sw = new THREE.Mesh(sidewalkGeo, sidewalkMat);
      sw.position.set(side * (this.roadWidth / 2 + this.sidewalkWidth / 2), 0.125, centerZ);
      sw.receiveShadow = true;
      this.scene.add(sw);
    }

    // أرض عشب كبيرة تحت كل شي
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, ROAD_LENGTH),
      new THREE.MeshStandardMaterial({ color: 0x7cc45a, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.02, centerZ);
    this.scene.add(ground);
  }

  // المباني والأشجار: نسوي عدد ثابت منها، ولما يعدي واحد ورا الكاميرا
  // نرجعه لآخر الطريق بشكل جديد (إعادة تدوير = بدون إنشاء أشياء جديدة أثناء اللعب)
  _createScenery() {
    this.scenery = [];

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const buildingColors = [0xf2a65a, 0xe56b6f, 0x6d9dc5, 0xb5838d, 0xf6d55c, 0x9bc1bc, 0xcdb4db];
    this.buildingMats = buildingColors.map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 })
    );
    this.roofMat = new THREE.MeshStandardMaterial({ color: 0x5a5560, roughness: 0.9 });

    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.4, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const leavesGeo = new THREE.CylinderGeometry(0.0, 1.0, 2.2, 7); // مخروط بسيط
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x3f9b4a, roughness: 0.9 });

    const buildingSpacing = 11;
    const buildingCount = Math.ceil((ROAD_START_Z - SCENERY_END_Z) / buildingSpacing);
    this.sceneryLoop = buildingCount * buildingSpacing; // طول الحلقة اللي تتكرر

    const edge = this.roadWidth / 2 + this.sidewalkWidth;

    for (const side of [-1, 1]) {
      for (let i = 0; i < buildingCount; i++) {
        // مبنى = جسم + سطح
        const building = new THREE.Group();
        const body = new THREE.Mesh(boxGeo, this.buildingMats[0]);
        const roof = new THREE.Mesh(boxGeo, this.roofMat);
        building.add(body, roof);
        building.userData = { body, roof, side, edge, kind: 'building' };
        building.position.z = ROAD_START_Z - i * buildingSpacing - (side > 0 ? buildingSpacing / 2 : 0);
        this._randomizeBuilding(building);
        this.scene.add(building);
        this.scenery.push(building);

        // شجرة على الرصيف بين المباني
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 0.95;
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.y = 2.6;
        trunk.castShadow = true;
        leaves.castShadow = true;
        tree.add(trunk, leaves);
        tree.position.set(side * (this.roadWidth / 2 + this.sidewalkWidth * 0.6), 0, building.position.z - buildingSpacing / 2);
        tree.userData = { kind: 'tree' };
        this.scene.add(tree);
        this.scenery.push(tree);
      }
    }
  }

  // يعطي المبنى طول وعرض ولون عشوائي
  _randomizeBuilding(b) {
    const { body, roof, side, edge } = b.userData;
    const w = 4 + Math.random() * 4;
    const h = 5 + Math.random() * 12;
    const d = 6 + Math.random() * 3;
    body.scale.set(w, h, d);
    body.position.y = h / 2;
    body.material = this.buildingMats[Math.floor(Math.random() * this.buildingMats.length)];
    roof.scale.set(w + 0.3, 0.4, d + 0.3);
    roof.position.y = h + 0.2;
    b.position.x = side * (edge + 1 + w / 2 + Math.random() * 1.5);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    this.camera.aspect = aspect;

    // على الجوال (الشاشة طولية) نوسّع زاوية الكاميرا عشان تبين الحارات الثلاث كاملة
    const portrait = aspect < 1;
    const minVisibleWidth = portrait ? 7.4 : 8.5; // العرض اللي لازم يبان عند مكان اللاعب
    // بالوضع الطولي نخلي الكاميرا تطالع أبعد، عشان الشخصية تنزل لتحت الشاشة ونشوف قدام أكثر
    this.lookAheadZ = portrait ? -16 : -8;
    const dist = this.cameraBase.length();
    const neededFov = THREE.MathUtils.radToDeg(2 * Math.atan(minVisibleWidth / 2 / (dist * aspect)));
    this.camera.fov = THREE.MathUtils.clamp(neededFov, 60, 88);
    this.camera.updateProjectionMatrix();
  }

  // ---------- التحديث كل إطار ----------

  // speed: سرعة اللعبة، playerX: مكان الشخصية الأفقي (الكاميرا تلحقها شوي)
  update(dt, speed, playerX) {
    const distance = speed * dt;

    // نحرك نسيج الطريق والرصيف = إحساس إن الأرض تتحرك
    this.roadTexture.offset.y = (this.roadTexture.offset.y + distance / this.roadTileLength) % 1;
    this.sidewalkTexture.offset.y = (this.sidewalkTexture.offset.y + distance / this.sidewalkTileLength) % 1;

    // نحرك المباني والأشجار، واللي يعدي ورا الكاميرا نرجعه لقدام
    for (const obj of this.scenery) {
      obj.position.z += distance;
      if (obj.position.z > ROAD_START_Z) {
        obj.position.z -= this.sceneryLoop;
        if (obj.userData.kind === 'building') this._randomizeBuilding(obj);
      }
    }

    // الكاميرا تتبع الشخصية يمين ويسار بنعومة (مو بالكامل عشان ما يدوخ)
    const targetX = playerX * 0.6;
    this.camera.position.x += (targetX - this.camera.position.x) * Math.min(1, dt * 6);
    // اهتزاز الكاميرا (وقت الاصطدام): يخف تدريجياً
    this.shakeAmount = Math.max(0, (this.shakeAmount || 0) - dt * 0.8);
    const s = this.shakeAmount;
    this.camera.position.y = this.cameraBase.y + (Math.random() - 0.5) * s;
    const shakeX = (Math.random() - 0.5) * s;

    this.camera.lookAt(this.camera.position.x * 0.5 + shakeX, 1.2, this.lookAheadZ);
  }

  // نهز الكاميرا (strength: قوة الهزة)
  shake(strength) {
    this.shakeAmount = strength;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
