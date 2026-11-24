import QRCode from 'qrcode';

/** يولّد كود QR بصيغتي PNG (للطباعة) و SVG (لأي حجم) */
export async function makeQr(url, { dark = '#21160E', light = '#FFFFFF' } = {}) {
  const opts = { errorCorrectionLevel: 'M', margin: 2, color: { dark, light } };
  const png = await QRCode.toBuffer(url, { ...opts, type: 'png', width: 1200 });
  const svg = (await QRCode.toString(url, { ...opts, type: 'svg' }))
    .replace('<svg ', `<svg role="img" aria-label="QR: ${url}" `);
  return { png, svg };
}
