// sound.js
// الأصوات: لما يخسر اللاعب يقول "وا أبوي!"
//
// طريقتين:
//   1) لو حطيت ملف صوت مسجّل في: public/sounds/wa-aboy.mp3  ← نشغّله (أحلى، بصوتك أنت!)
//   2) لو ما فيه ملف، المتصفح ينطق الجملة بصوت عربي جاهز (speechSynthesis)
//
// ملاحظة الآيفون: Safari ما يسمح بالأصوات إلا بعد ما يلمس اللاعب الشاشة،
// عشان كذا ننادي unlock() لما يضغط زر "ابدأ".

const CRASH_TEXT = 'وا أبوي!';
const CRASH_FILE = './sounds/wa-aboy.mp3';

export class Sound {
  constructor() {
    this.unlocked = false;

    // نجرب نحمّل الملف المسجّل. لو ما لقيناه، نستخدم النطق الآلي
    this.fileReady = false;
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.addEventListener('canplaythrough', () => (this.fileReady = true), { once: true });
    this.audio.addEventListener('error', () => (this.fileReady = false), { once: true });
    this.audio.src = CRASH_FILE;

    this.speech = 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.voice = null;
    if (this.speech) {
      // قائمة الأصوات تتحمّل متأخر في بعض المتصفحات
      this._pickVoice();
      this.speech.addEventListener?.('voiceschanged', () => this._pickVoice());
    }
  }

  // نختار صوت عربي من الأصوات الموجودة بالجهاز (لو فيه)
  _pickVoice() {
    const voices = this.speech.getVoices();
    this.voice =
      voices.find((v) => v.lang === 'ar-SA') ||
      voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('ar')) ||
      null;
  }

  // لازم تنادى من ضغطة اللاعب (زر ابدأ) عشان الآيفون يسمح بالصوت بعدين
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;

    // نشغّل الملف بدون صوت ونوقفه فوراً = "نفتح" الصوت
    this.audio.muted = true;
    this.audio
      .play()
      .then(() => {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.muted = false;
      })
      .catch(() => {
        this.audio.muted = false;
      });

    // نفس الشي للنطق: جملة فاضية
    if (this.speech) {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      this.speech.speak(u);
    }
  }

  // صوت الخسارة
  playCrash() {
    if (this.fileReady) {
      this.audio.currentTime = 0;
      this.audio.play().catch(() => this._speak(CRASH_TEXT));
    } else {
      this._speak(CRASH_TEXT);
    }
  }

  _speak(text) {
    if (!this.speech) return;
    this.speech.cancel(); // نوقف أي كلام قبله
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-SA';
    if (this.voice) u.voice = this.voice;
    u.rate = 0.85; // أبطأ شوي عشان تطلع "وااا أبوي" بحسرة 😄
    u.pitch = 1.2;
    u.volume = 1;
    this.speech.speak(u);
  }
}
