// input.js
// التحكم: الكيبورد (الأسهم أو WASD) + السحب على الجوال (أو بالماوس على الكمبيوتر).
// يحوّل أي حركة إلى أمر واحد من: 'left' | 'right' | 'up' | 'down'

const SWIPE_THRESHOLD = 30; // أقل مسافة سحب بالبكسل عشان تنحسب

export class Input {
  // element: العنصر اللي نسمع فيه للسحب
  // onAction: دالة تنادى مع اسم الأمر
  constructor(element, onAction) {
    this.onAction = onAction;
    this._setupKeyboard();
    this._setupSwipe(element);
  }

  _setupKeyboard() {
    const keys = {
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right',
      ArrowUp: 'up',
      KeyW: 'up',
      Space: 'up',
      ArrowDown: 'down',
      KeyS: 'down',
    };
    window.addEventListener('keydown', (e) => {
      const action = keys[e.code];
      if (!action) return;
      e.preventDefault(); // يمنع الأسهم من تمرير الصفحة
      if (e.repeat) return; // نتجاهل التكرار لو الزر مضغوط مطوّل
      this.onAction(action);
    });
  }

  _setupSwipe(element) {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    element.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      startY = e.clientY;
      tracking = true;
    });

    // نحسب السحب أثناء الحركة (مو عند رفع الإصبع) عشان الاستجابة تكون فورية
    element.addEventListener('pointermove', (e) => {
      if (!tracking) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

      // الاتجاه الأكبر هو اللي يفوز
      if (Math.abs(dx) > Math.abs(dy)) {
        this.onAction(dx > 0 ? 'right' : 'left');
      } else {
        this.onAction(dy > 0 ? 'down' : 'up');
      }
      tracking = false; // سحبة وحدة = أمر واحد، لازم يرفع إصبعه ويسحب من جديد
    });

    const stop = () => (tracking = false);
    element.addEventListener('pointerup', stop);
    element.addEventListener('pointercancel', stop);
  }
}
