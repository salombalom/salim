import { CHANNELS } from './channels';
import { TEXTBOOKS } from './textbooks';
import type { VideoEntry } from './types';
import videosJson from './videos.json';

export const VIDEOS = videosJson as VideoEntry[];
export { CHANNELS, TEXTBOOKS };
export * from './types';
