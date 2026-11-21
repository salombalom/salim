import { defineConfig } from 'vite';

export default defineConfig({
  // مسارات نسبية عشان تشتغل اللعبة لو رفعتها على أي استضافة
  base: './',
  server: {
    // host: true يخلي السيرفر يقبل اتصالات من أجهزة ثانية على نفس الشبكة (الجوال)
    host: true,
    port: 5173,
  },
});
