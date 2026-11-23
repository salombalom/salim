/** أصوات واهتزاز خفيف عند الإجابة */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useSettings } from '@/lib/store';

const SOURCES = {
  correct: require('@/assets/sounds/correct.wav'),
  wrong: require('@/assets/sounds/wrong.wav'),
  finish: require('@/assets/sounds/finish.wav'),
} as const;

type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let audioModeSet = false;

function player(name: SoundName): AudioPlayer | null {
  try {
    if (!audioModeSet) {
      audioModeSet = true;
      // لا نقاطع موسيقى المستخدم، ونحترم وضع الصامت في iOS
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    }
    players[name] ??= createAudioPlayer(SOURCES[name]);
    return players[name]!;
  } catch {
    return null;
  }
}

export function playSound(name: SoundName) {
  if (!useSettings.getState().soundOn) return;
  const p = player(name);
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {
    // تجاهل أخطاء الصوت — ليست ضرورية لعمل التطبيق
  }
}

export function haptic(kind: 'success' | 'error' | 'tap') {
  if (!useSettings.getState().hapticsOn || Platform.OS === 'web') return;
  const run =
    kind === 'tap'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
  run.catch(() => {});
}

export function answerFeedback(correct: boolean) {
  playSound(correct ? 'correct' : 'wrong');
  haptic(correct ? 'success' : 'error');
}
