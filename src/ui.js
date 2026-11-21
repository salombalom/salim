// ui.js
// كل شي يخص الواجهة (HTML فوق اللعبة):
//   - شاشة البداية وزر "ابدأ"
//   - العدادات أعلى الشاشة (المسافة والعملات)
//   - شاشة "انتهت اللعبة" وزر "العب مرة ثانية"
//   - حفظ أعلى نتيجة في المتصفح (localStorage)

const BEST_KEY = 'runner-best-score';

// نجيب عنصر من الصفحة بالـ id
const $ = (id) => document.getElementById(id);

export class UI {
  // onStart: دالة تنادى لما يضغط اللاعب "ابدأ" أو "العب مرة ثانية"
  constructor(onStart) {
    this.el = {
      hud: $('hud'),
      distance: $('distance'),
      coins: $('coin-count'),
      menu: $('menu'),
      menuBest: $('menu-best'),
      over: $('game-over'),
      newRecord: $('new-record'),
      finalScore: $('final-score'),
      finalDistance: $('final-distance'),
      finalCoins: $('final-coins'),
      overBest: $('over-best'),
    };

    this.onStart = onStart;
    $('start-btn').addEventListener('click', () => this.onStart());
    $('restart-btn').addEventListener('click', () => this.onStart());

    // Enter أو المسافة تضغط الزر الظاهر (للكمبيوتر)
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Enter' && e.code !== 'Space') return;
      if (!this.el.menu.hidden || !this.el.over.hidden) {
        e.preventDefault();
        this.onStart();
      }
    });

    // آخر رقم عرضناه، عشان ما نحدّث الصفحة إلا إذا تغيّر الرقم (أخف على الجوال)
    this.shownDistance = -1;
    this.shownCoins = -1;

    this.showMenu();
  }

  // ---------- أعلى نتيجة ----------

  // نغلّفها بـ try لأن بعض المتصفحات (مثل التصفح الخفي) تمنع التخزين
  getBest() {
    try {
      return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {
      return 0;
    }
  }

  saveBest(score) {
    try {
      localStorage.setItem(BEST_KEY, String(score));
    } catch {
      // ما قدرنا نحفظ، عادي
    }
  }

  // ---------- الشاشات ----------

  showMenu() {
    this.el.menuBest.textContent = this.getBest();
    this.el.menu.hidden = false;
    this.el.over.hidden = true;
    this.el.hud.hidden = true;
  }

  // لما تبدأ اللعبة: نخفي الشاشات ونظهر العدادات
  showHUD() {
    this.el.menu.hidden = true;
    this.el.over.hidden = true;
    this.el.hud.hidden = false;
    this.updateHUD(0, 0);
  }

  updateHUD(distance, coins) {
    const d = Math.floor(distance);
    if (d !== this.shownDistance) {
      this.el.distance.textContent = d;
      this.shownDistance = d;
    }
    if (coins !== this.shownCoins) {
      this.el.coins.textContent = coins;
      this.shownCoins = coins;
      // حركة نبضة صغيرة لما تزيد العملات
      this.el.coins.parentElement.classList.remove('pop');
      void this.el.coins.offsetWidth; // حيلة عشان الحركة تعيد من البداية
      if (coins > 0) this.el.coins.parentElement.classList.add('pop');
    }
  }

  // النتيجة = المسافة + كل عملة بـ 10 نقاط
  static score(distance, coins) {
    return Math.floor(distance) + coins * 10;
  }

  showGameOver(distance, coins) {
    const score = UI.score(distance, coins);
    const oldBest = this.getBest();
    const isRecord = score > oldBest;
    if (isRecord) this.saveBest(score);

    this.el.finalScore.textContent = score;
    this.el.finalDistance.textContent = Math.floor(distance);
    this.el.finalCoins.textContent = coins;
    this.el.overBest.textContent = Math.max(score, oldBest);
    this.el.newRecord.hidden = !isRecord;

    this.el.hud.hidden = true;
    this.el.over.hidden = false;
  }
}
