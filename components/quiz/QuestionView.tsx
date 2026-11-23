import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Chip, Icon } from '@/components/ui';
import type { PreparedQuestion } from '@/lib/quiz/prepare';
import type { QuestionResponse } from '@/lib/types';
import { borderWidth, fonts, radius, spacing, useAppTheme } from '@/lib/theme';

interface Props {
  item: PreparedQuestion;
  ltr: boolean;
  response: QuestionResponse | null;
  /** بعد التحقق: true صح، false خطأ، null لم يُتحقق بعد */
  result: boolean | null;
  onChange: (r: QuestionResponse | null) => void;
  /** للأنواع التي تُصحَّح فور الاختيار (اختيار من متعدد، صح/خطأ) */
  onSubmit: (r: QuestionResponse) => void;
}

const TYPE_LABEL = {
  mcq: { ar: 'اختر الإجابة الصحيحة', en: 'Choose the correct answer' },
  true_false: { ar: 'صواب أم خطأ', en: 'True or false' },
  fill_blank: { ar: 'أكمل الفراغ', en: 'Fill in the blank' },
  word_order: { ar: 'رتّب الكلمات', en: 'Order the words' },
} as const;

const LETTERS_AR = ['أ', 'ب', 'ج', 'د', 'هـ'];
const LETTERS_EN = ['A', 'B', 'C', 'D', 'E'];

type OptState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dim';

export function QuestionView({ item, ltr, response, result, onChange, onSubmit }: Props) {
  const { colors, fontScale } = useAppTheme();
  const q = item.question;
  const locked = result !== null;
  const dirStyle = ltr ? styles.ltr : undefined;

  const stateOf = (value: QuestionResponse): OptState => {
    if (!locked) return response === value ? 'selected' : 'idle';
    if (q.type !== 'word_order' && value === q.answer) return 'correct';
    if (response === value) return 'wrong';
    return 'dim';
  };

  const borderFor = (st: OptState) =>
    st === 'correct' ? colors.success : st === 'wrong' ? colors.danger : st === 'selected' ? colors.gold : colors.border;

  const renderOption = (text: string, value: QuestionResponse, index: number) => {
    const st = stateOf(value);
    return (
      <Pressable
        key={`${index}-${text}`}
        testID="option"
        disabled={locked}
        onPress={() => onSubmit(value)}
        accessibilityRole="button"
        accessibilityState={{ selected: response === value, disabled: locked }}
        style={({ pressed }) => [
          styles.option,
          { backgroundColor: colors.surface, borderColor: pressed ? colors.goldLine : borderFor(st) },
          st === 'dim' && { opacity: 0.5 },
          dirStyle,
        ]}>
        <View style={[styles.letter, { borderColor: st === 'idle' || st === 'dim' ? colors.borderStrong : borderFor(st) }]}>
          <AppText variant="caption" font="heading" color={st === 'correct' ? 'successText' : st === 'wrong' ? 'dangerText' : 'goldText'}>
            {(ltr ? LETTERS_EN : LETTERS_AR)[index]}
          </AppText>
        </View>
        <AppText ltr={ltr} style={{ flex: 1 }}>
          {text}
        </AppText>
        {st === 'correct' && <Icon name="Check" color="success" />}
        {st === 'wrong' && <Icon name="X" color="danger" />}
      </Pressable>
    );
  };

  const trueFalse = (v: boolean) => {
    const st = stateOf(v);
    return (
      <Pressable
        key={String(v)}
        testID="option"
        disabled={locked}
        onPress={() => onSubmit(v)}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.tf,
          { backgroundColor: colors.surface, borderColor: pressed ? colors.goldLine : borderFor(st) },
          st === 'dim' && { opacity: 0.5 },
        ]}>
        <Icon name={v ? 'Check' : 'X'} size={26} color={st === 'correct' ? 'success' : st === 'wrong' ? 'danger' : 'gold'} />
        <AppText variant="h2">{v ? (ltr ? 'True' : 'صواب') : ltr ? 'False' : 'خطأ'}</AppText>
      </Pressable>
    );
  };

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={[{ gap: spacing.md }, dirStyle]}>
        <View style={[{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }, dirStyle]}>
          <AppText variant="overline" color="goldText" ltr={ltr}>
            {TYPE_LABEL[q.type][ltr ? 'en' : 'ar']}
          </AppText>
          {!q.reviewed && <Chip label="غير مراجَع" />}
        </View>
        <AppText variant="title" ltr={ltr}>
          {q.prompt}
        </AppText>
      </View>

      {q.type === 'mcq' && <View style={{ gap: spacing.sm }}>{item.options!.map((o, i) => renderOption(o, o, i))}</View>}

      {q.type === 'true_false' && <View style={[{ flexDirection: 'row', gap: spacing.md }, dirStyle]}>{[true, false].map(trueFalse)}</View>}

      {q.type === 'fill_blank' &&
        (item.options ? (
          <View style={{ gap: spacing.sm }}>{item.options.map((o, i) => renderOption(o, o, i))}</View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <TextInput
              value={typeof response === 'string' ? response : ''}
              onChangeText={(t) => onChange(t)}
              editable={!locked}
              placeholder={ltr ? 'Type your answer' : 'اكتب إجابتك'}
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={() => typeof response === 'string' && response.trim() && onSubmit(response)}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: locked ? (result ? colors.success : colors.danger) : colors.border,
                  fontFamily: fonts.regular,
                  fontSize: 18 * fontScale,
                  textAlign: ltr ? 'left' : 'right',
                  writingDirection: ltr ? 'ltr' : 'rtl',
                },
              ]}
            />
            {!locked && (
              <Button
                title={ltr ? 'Check' : 'تحقّق'}
                disabled={typeof response !== 'string' || !response.trim()}
                onPress={() => typeof response === 'string' && onSubmit(response)}
              />
            )}
          </View>
        ))}

      {q.type === 'word_order' && <WordOrder item={item} ltr={ltr} response={response} locked={locked} result={result} onChange={onChange} onSubmit={onSubmit} />}
    </View>
  );
}

function WordOrder({
  item,
  ltr,
  response,
  locked,
  result,
  onChange,
  onSubmit,
}: {
  item: PreparedQuestion;
  ltr: boolean;
  response: QuestionResponse | null;
  locked: boolean;
  result: boolean | null;
  onChange: (r: QuestionResponse | null) => void;
  onSubmit: (r: QuestionResponse) => void;
}) {
  const { colors } = useAppTheme();
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
        { borderColor: filled ? colors.goldLine : colors.border, backgroundColor: filled ? colors.goldFaint : colors.surface },
        pressed && { opacity: 0.6 },
      ]}>
      <AppText variant="label" ltr={ltr}>
        {words[i]}
      </AppText>
    </Pressable>
  );

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={[styles.answerBox, dirStyle, { borderColor: locked ? (result ? colors.success : colors.danger) : colors.border }]}>
        {picked.length === 0 ? (
          <AppText color="textMuted" ltr={ltr}>
            {ltr ? 'Tap the words in order' : 'اختر الكلمات بالترتيب'}
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
      {!locked && <Button title={ltr ? 'Check' : 'تحقّق'} disabled={remaining.length > 0} onPress={() => onSubmit(picked.map(String))} />}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.button + 2,
    borderWidth: borderWidth.hairline,
    minHeight: 60,
  },
  letter: { width: 30, height: 30, borderRadius: 15, borderWidth: borderWidth.hairline, alignItems: 'center', justifyContent: 'center' },
  tf: { flex: 1, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, borderRadius: radius.card, borderWidth: borderWidth.hairline },
  input: { borderWidth: borderWidth.hairline, borderRadius: radius.button, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 56 },
  answerBox: {
    minHeight: 64,
    borderWidth: borderWidth.hairline,
    borderStyle: 'dashed',
    borderRadius: radius.button,
    padding: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  wordBank: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  word: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.small, borderWidth: borderWidth.hairline },
  ltr: { direction: 'ltr' },
});
