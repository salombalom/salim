import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Chip } from '@/components/ui';
import type { PreparedQuestion } from '@/lib/quiz/prepare';
import type { QuestionResponse } from '@/lib/types';
import { alpha, fonts, radius, spacing, useAppTheme } from '@/lib/theme';

interface Props {
  item: PreparedQuestion;
  ltr: boolean;
  /** لون المادة لتمييز الاختيار */
  accent: string;
  response: QuestionResponse | null;
  /** بعد التحقق: true صح، false خطأ، null لم يُتحقق بعد */
  result: boolean | null;
  onChange: (r: QuestionResponse | null) => void;
  /** للأنواع التي تُصحَّح فور الاختيار (اختيار من متعدد، صح/خطأ) */
  onSubmit: (r: QuestionResponse) => void;
}

const TYPE_LABEL = {
  mcq: { ar: 'اختر الإجابة الصحيحة', en: 'Choose the correct answer', icon: 'format-list-bulleted' },
  true_false: { ar: 'صح أم خطأ؟', en: 'True or false?', icon: 'scale-balance' },
  fill_blank: { ar: 'أكمل الفراغ', en: 'Fill in the blank', icon: 'form-textbox' },
  word_order: { ar: 'رتّب الكلمات', en: 'Order the words', icon: 'sort-variant' },
} as const;

const LETTERS_AR = ['أ', 'ب', 'ج', 'د', 'هـ'];
const LETTERS_EN = ['A', 'B', 'C', 'D', 'E'];

export function QuestionView({ item, ltr, accent, response, result, onChange, onSubmit }: Props) {
  const { colors, fontScale, isDark } = useAppTheme();
  const q = item.question;
  const locked = result !== null;
  const dirStyle = ltr ? styles.ltr : undefined;
  const label = TYPE_LABEL[q.type];

  const optionState = (value: QuestionResponse) => {
    if (!locked) return response === value ? 'selected' : 'idle';
    const isAnswer = q.type !== 'word_order' && value === q.answer;
    if (isAnswer) return 'correct';
    if (response === value) return 'wrong';
    return 'dim';
  };

  const palette = (state: ReturnType<typeof optionState>) => {
    switch (state) {
      case 'correct':
        return { bg: colors.successSoft, border: colors.success, edge: colors.successDeep, badge: colors.success, badgeFg: '#FFFFFF', icon: 'check-circle' as const };
      case 'wrong':
        return { bg: colors.dangerSoft, border: colors.danger, edge: colors.dangerDeep, badge: colors.danger, badgeFg: '#FFFFFF', icon: 'close-circle' as const };
      case 'selected':
        return { bg: alpha(accent, 0.1), border: accent, edge: accent, badge: accent, badgeFg: '#FFFFFF', icon: undefined };
      case 'dim':
        return { bg: colors.surface, border: colors.border, edge: colors.border, badge: colors.surfaceAlt, badgeFg: colors.textMuted, icon: undefined, dim: true };
      default:
        return { bg: colors.surface, border: colors.border, edge: isDark ? colors.border : '#DCD5F3', badge: colors.surfaceAlt, badgeFg: colors.textMuted, icon: undefined };
    }
  };

  const renderOption = (text: string, value: QuestionResponse, index: number, immediate: boolean, letter = true) => {
    const p = palette(optionState(value));
    return (
      <Pressable
        key={`${index}-${text}`}
        testID="option"
        disabled={locked}
        onPress={() => (immediate ? onSubmit(value) : onChange(value))}
        accessibilityRole="button"
        accessibilityState={{ selected: response === value, disabled: locked }}
        style={({ pressed }) => [
          styles.option,
          { backgroundColor: p.bg, borderColor: p.border, borderBottomColor: p.edge },
          pressed && { borderBottomWidth: 2, marginTop: 3 },
          'dim' in p && p.dim && { opacity: 0.55 },
          dirStyle,
        ]}>
        {letter && (
          <View style={[styles.letter, { backgroundColor: p.badge }]}>
            <AppText variant="label" weight="black" color={p.badgeFg} style={{ lineHeight: 22 }}>
              {(ltr ? LETTERS_EN : LETTERS_AR)[index]}
            </AppText>
          </View>
        )}
        <AppText variant="body" weight="semibold" ltr={ltr} style={{ flex: 1 }}>
          {text}
        </AppText>
        {p.icon && <MaterialCommunityIcons name={p.icon} size={26} color={p.border} />}
      </Pressable>
    );
  };

  const trueFalse = (v: boolean) => {
    const p = palette(optionState(v));
    const base = v ? colors.success : colors.danger;
    return (
      <Pressable
        key={String(v)}
        testID="option"
        disabled={locked}
        onPress={() => onSubmit(v)}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.tf,
          { backgroundColor: p.bg, borderColor: p.border, borderBottomColor: p.edge },
          pressed && { borderBottomWidth: 2, marginTop: 3 },
          'dim' in p && p.dim && { opacity: 0.55 },
        ]}>
        <View style={[styles.tfIcon, { backgroundColor: alpha(base, 0.14) }]}>
          <MaterialCommunityIcons name={v ? 'check-bold' : 'close-thick'} size={30} color={base} />
        </View>
        <AppText variant="h2">{v ? (ltr ? 'True' : 'صح') : ltr ? 'False' : 'خطأ'}</AppText>
      </Pressable>
    );
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={[{ gap: spacing.sm }, dirStyle]}>
        <View style={[{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }, dirStyle]}>
          <Chip label={ltr ? label.en : label.ar} icon={label.icon} color={accent} bg={alpha(accent, 0.12)} />
          {!q.reviewed && <Chip label="غير مراجَع" icon="flask-outline" color={colors.warning} bg={colors.warningSoft} />}
        </View>
        <AppText variant="title" ltr={ltr} style={{ fontSize: 24 * fontScale, lineHeight: 38 * fontScale }}>
          {q.prompt}
        </AppText>
      </View>

      {q.type === 'mcq' && <View style={{ gap: spacing.sm }}>{item.options!.map((o, i) => renderOption(o, o, i, true))}</View>}

      {q.type === 'true_false' && <View style={[{ flexDirection: 'row', gap: spacing.md }, dirStyle]}>{[true, false].map(trueFalse)}</View>}

      {q.type === 'fill_blank' &&
        (item.options ? (
          <View style={{ gap: spacing.sm }}>{item.options.map((o, i) => renderOption(o, o, i, true))}</View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <TextInput
              value={typeof response === 'string' ? response : ''}
              onChangeText={(t) => onChange(t)}
              editable={!locked}
              placeholder={ltr ? 'Type your answer' : 'اكتب إجابتك هنا ✏️'}
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={() => typeof response === 'string' && response.trim() && onSubmit(response)}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: locked ? (result ? colors.successSoft : colors.dangerSoft) : colors.surface,
                  borderColor: locked ? (result ? colors.success : colors.danger) : colors.border,
                  fontFamily: fonts.semibold,
                  fontSize: 20 * fontScale,
                  textAlign: ltr ? 'left' : 'right',
                  writingDirection: ltr ? 'ltr' : 'rtl',
                },
              ]}
            />
            {!locked && (
              <Button
                title={ltr ? 'Check' : 'تحقّق'}
                icon="check-bold"
                disabled={typeof response !== 'string' || !response.trim()}
                onPress={() => typeof response === 'string' && onSubmit(response)}
              />
            )}
          </View>
        ))}

      {q.type === 'word_order' && <WordOrder item={item} ltr={ltr} accent={accent} response={response} locked={locked} result={result} onChange={onChange} onSubmit={onSubmit} />}
    </View>
  );
}

function WordOrder({
  item,
  ltr,
  accent,
  response,
  locked,
  result,
  onChange,
  onSubmit,
}: {
  item: PreparedQuestion;
  ltr: boolean;
  accent: string;
  response: QuestionResponse | null;
  locked: boolean;
  result: boolean | null;
  onChange: (r: QuestionResponse | null) => void;
  onSubmit: (r: QuestionResponse) => void;
}) {
  const { colors, isDark } = useAppTheme();
  const words = item.words!;
  // نحفظ الترتيب كمؤشرات داخل item.words حتى تعمل الكلمات المكررة بشكل صحيح
  const picked: number[] = Array.isArray(response) ? (response as string[]).map(Number) : [];
  const remaining = words.map((_, i) => i).filter((i) => !picked.includes(i));
  const dirStyle = ltr ? styles.ltr : undefined;
  const setPicked = (next: number[]) => onChange(next.length ? next.map(String) : null);

  const chip = (i: number, onPress: () => void, filled: boolean) => (
    <Pressable
      key={i}
      disabled={locked}
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.word,
        filled
          ? { backgroundColor: accent, borderColor: accent, borderBottomColor: 'rgba(0,0,0,0.25)' }
          : { backgroundColor: colors.surface, borderColor: colors.border, borderBottomColor: isDark ? colors.border : '#DCD5F3' },
        pressed && { borderBottomWidth: 1, marginTop: 2 },
      ]}>
      <AppText variant="label" weight="bold" ltr={ltr} color={filled ? '#FFFFFF' : 'text'}>
        {words[i]}
      </AppText>
    </Pressable>
  );

  return (
    <View style={{ gap: spacing.md }}>
      <View
        style={[
          styles.answerBox,
          dirStyle,
          {
            borderColor: locked ? (result ? colors.success : colors.danger) : alpha(accent, 0.4),
            backgroundColor: locked ? (result ? colors.successSoft : colors.dangerSoft) : alpha(accent, 0.05),
          },
        ]}>
        {picked.length === 0 ? (
          <AppText color="textMuted" ltr={ltr}>
            {ltr ? 'Tap the words in order…' : 'اضغط على الكلمات بالترتيب…'}
          </AppText>
        ) : (
          picked.map((i) => chip(i, () => setPicked(picked.filter((p) => p !== i)), true))
        )}
      </View>
      {!locked && (
        <View testID="word-bank" style={[styles.wordBank, dirStyle]}>
          {remaining.map((i) => chip(i, () => setPicked([...picked, i]), false))}
        </View>
      )}
      {!locked && <Button title={ltr ? 'Check' : 'تحقّق'} icon="check-bold" disabled={remaining.length > 0} onPress={() => onSubmit(picked.map(String))} />}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderBottomWidth: 5,
    minHeight: 62,
  },
  letter: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tf: { flex: 1, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: radius.lg, borderWidth: 2, borderBottomWidth: 5 },
  tfIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 60 },
  answerBox: {
    minHeight: 72,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  wordBank: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  word: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 2, borderBottomWidth: 4 },
  ltr: { direction: 'ltr' },
});
