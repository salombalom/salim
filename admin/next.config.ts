import type { NextConfig } from 'next';

// لوحة ثابتة بالكامل (HTML + JS): تُرفع على أي استضافة ثابتة.
// الحماية من قاعدة البيانات نفسها (RLS + is_admin)، لا من الواجهة.
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default config;
