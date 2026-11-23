import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Chip } from '@/components/ui';
import type { PreparedQuestion } from '@/lib/quiz/prepare';
import type { QuestionResponse } from '@/lib/types';
import { fonts, radius, spacing, useAppTheme } from '@/lib/theme';

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
  true_false: { ar: 'صح أم خطأ؟', en: 'True or false?' },
  fill_blank: { ar: 'أكمل الفراغ', en: 'Fill in the blank' },
  word_order: { ar: 'رتّب الكلمات', en: 'Order the words' },
} as const;

export function QuestionView({ item, ltr, response, result, onChange, onSubmit }: Props) {
  const { colors, fontScale } = useAppTheme();
  const q = item.question;
  const locked = result !== null;
  const dirStyle = ltr ? styles.ltr : undefined;

  /** لون خيار بعد التحقق */
  const optionState = (value: QuestionResponse) => {
    if (!locked) return response === value ? 'selected' : 'idle';
    const isAnswer = q.type === 'mcq' ? value === q.answer : q.type === 'true_false' ? value === q.answer : q.type === 'fill_blank' ? value === q.answer : false;
    if (isAnswer) return 'correct';
    if (response === value) return 'wrong';
    return 'idle';
  };

  const optionColors = (state: ReturnType<typeof optionState>) => {
    switch (state) {
      case 'correct':
        return { bg: colors.successSoft, border: colors.success, icon: 'check-circle' as const, iconColor: colors.success };
      case 'wrong':
        return { bg: colors.dangerSoft, border: colors.danger, icon: 'close-circle' as const, iconColor: colors.danger };
      case 'selected':
        return { bg: colors.primarySoft, border: colors.primary, icon: undefined, iconColor: colors.primary };
      default:
        return { bg: colors.surface, border: colors.border, icon: undefined, iconColor: colors.textMuted };
    }
  };

  const renderOption = (label: string, value: QuestionResponse, key: string, immediate: boolean) => {
    const st = optionState(value);
    const c = optionColors(st);
    return (
      <Pressable
        key={key}
        testID="option"
        disabled={locked}
        onPress={() => (immediate ? onSubmit(value) : onChange(value))}
        accessibilityRole="button"
        accessibilityState={{ selected: response === value, disabled: locked }}
        style={({ pressed }) => [styles.option, { backgroundColor: c.bg, borderColor: c.border }, dirStyle, pressed && { opacity: 0.8 }]}>
        <AppText variant="body" weight="medium" ltr={ltr} style={{ flex: 1 }}>
          {label}
        </AppText>
        {c.icon && <MaterialCommunityIcons name={c.icon} size={22} color={c.iconColor} />}
      </Pressable>
    );
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={[{ gap: spacing.sm }, dirStyle]}>
        <View style={[{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }, dirStyle]}>
          <Chip label={TYPE_LABEL[q.type][ltr ? 'en' : 'ar']} />
          {!q.reviewed && <Chip label="غير مراجَع" icon="flask-outline" color={colors.warning} bg={colors.warningSoft} />}
        </View>
        <AppText variant="title" ltr={ltr}>
          {q.prompt}
        </AppText>
      </View>

      {q.type === 'mcq' && <View style={{ gap: spacing.sm }}>{item.options!.map((o, i) => renderOption(o, o, `${i}`, true))}</View>}

      {q.type === 'true_false' && (
        <View style={[{ flexDirection: 'row', gap: spacing.sm }, dirStyle]}>
          {[true, false].map((v) => (
            <View key={String(v)} style={{ flex: 1 }}>
              {renderOption(v ? (ltr ? 'True' : 'صح') : ltr ? 'False' : 'خطأ', v, String(v), true)}
            </View>
          ))}
        </View>
      )}

      {q.type === 'fill_blank' &&
        (item.options ? (
          <View style={{ gap: spacing.sm }}>{item.options.map((o, i) => renderOption(o, o, `${i}`, true))}</View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <TextInput
              value={typeof response === 'string' ? response : ''}
              onChangeText={(t) => onChange(t)}
              editable={!locked}
              placeholder={ltr ? 'Type your answer' : 'اكتب إجابتك هنا'}
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
                  fontFamily: fonts.medium,
                  fontSize: 18 * fontScale,
                  textAlign: ltr ? 'left' : 'right',
                  writingDirection: ltr ? 'ltr' : 'rtl',
                },
              ]}
            />
            {!locked && (
              <Button
                title={ltr ? 'Check' : 'تحقّق'}
                icon="check"
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
        { backgroundColor: filled ? colors.primarySoft : colors.surface, borderColor: filled ? colors.primary : colors.border },
        pressed && { opacity: 0.7 },
      ]}>
      <AppText variant="label" weight="semibold" ltr={ltr}>
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
            borderColor: locked ? (result ? colors.success : colors.danger) : colors.border,
            backgroundColor: locked ? (result ? colors.successSoft : colors.dangerSoft) : colors.surfaceAlt,
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
      {!locked && <View testID="word-bank" style={[styles.wordBank, dirStyle]}>{remaining.map((i) => chip(i, () => setPicked([...picked, i]), false))}</View>}
      {!locked && (
        <Button
          title={ltr ? 'Check' : 'تحقّق'}
          icon="check"
          disabled={remaining.length > 0}
          onPress={() => onSubmit(picked.map(String))}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    minHeight: 56,
  },
  input: { borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 56 },
  answerBox: {
    minHeight: 64,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  wordBank: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  word: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, borderWidth: 1 },
  ltr: { direction: 'ltr' },
});
