import type { ChannelEntry } from './types';

/**
 * قنوات يوتيوب المعتمدة.
 * لتفعيل قناة: ضع channelId (يبدأ بـ UC) أو handle (الاسم بعد @ في رابط القناة)، ثم اجعل active = true.
 */
export const CHANNELS: ChannelEntry[] = [
  {
    key: 'mawred',
    name: 'مورد — وزارة التربية والتعليم',
    channelId: 'UCL4a6BHJlgItAV_jjUAw4JA',
    handle: 'EduMawred',
    url: 'https://www.youtube.com/@EduMawred',
    active: true,
  },
];
