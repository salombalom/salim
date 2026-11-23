// sound.js
// الأصوات:
//   - لما يقفز اللاعب يقول "هووب!"
//   - لما يخسر يقول "وا أبوي!"
//
// كل صوت له طريقتين:
//   1) لو حطيت ملف صوت مسجّل في public/sounds/ ← نشغّله (أحلى، بصوتك أنت!)
//        hoop.mp3     صوت القفز
//        wa-aboy.mp3  صوت الخسارة
//   2) لو ما فيه ملف، المتصفح ينطق الجملة بصوت عربي جاهز (speechSynthesis)
//
// ملاحظة الآيفون: Safari ما يسمح بالأصوات إلا بعد ما يلمس اللاعب الشاشة،
// عشان كذا ننادي unlock() لما يضغط زر "ابدأ".

// تعريف الأصوات: الملف، والجملة البديلة، وسرعة ونبرة النطق
const CLIPS = {
  jump: { file: './sounds/hoop.mp3', text: 'هووب!', rate: 1.3, pitch: 1.4 },
  crash: { file: './sounds/wa-aboy.mp3', text: 'وا أبوي!', rate: 0.85, pitch: 1.2 },
};

export class Sound {
  constructor() {
    this.unlocked = false;

    // نجرب نحمّل كل ملف. اللي ما نلقاه نستخدم بداله النطق الآلي
    this.clips = {};
    for (const [name, def] of Object.entries(CLIPS)) {
      const audio = new Audio();
      audio.preload = 'auto';
      const clip = { ...def, audio, ready: false };
      audio.addEventListener('canplaythrough', () => (clip.ready = true), { once: true });
      audio.addEventListener('error', () => (clip.ready = false), { once: true });
      audio.src = def.file;
      this.clips[name] = clip;
    }

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

    // نشغّل كل ملف بدون صوت ونوقفه فوراً = "نفتح" الصوت
    for (const clip of Object.values(this.clips)) {
      const a = clip.audio;
      a.muted = true;
      a.play()
        .then(() => {
          a.pause();
          a.currentTime = 0;
          a.muted = false;
        })
        .catch(() => (a.muted = false));
    }

    // نفس الشي للنطق: جملة فاضية
    if (this.speech) {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      this.speech.speak(u);
    }
  }

  playJump() {
    this._play('jump');
  }

  playCrash() {
    this._play('crash');
  }

  _play(name) {
    const clip = this.clips[name];
    if (clip.ready) {
      clip.audio.currentTime = 0;
      clip.audio.play().catch(() => this._speak(clip));
    } else {
      this._speak(clip);
    }
  }

  _speak(clip) {
    if (!this.speech) return;
    this.speech.cancel(); // نوقف أي كلام قبله (عشان القفزات المتتالية ما تتراكم)
    const u = new SpeechSynthesisUtterance(clip.text);
    u.lang = 'ar-SA';
    if (this.voice) u.voice = this.voice;
    u.rate = clip.rate;
    u.pitch = clip.pitch;
    u.volume = 1;
    this.speech.speak(u);
  }
}
