/**
 * عناصر التصميم المشتركة — كل الألوان والمقاسات من theme/tokens.ts.
 */
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { ICONS, type IconName } from '@/components/icons';
import { isolateMath } from '@/lib/bidi';
import {
  alpha,
  borderWidth,
  fonts,
  iconSize,
  iconStroke,
  motion,
  progress,
  radius,
  spacing,
  typeScale,
  useAppTheme,
  type FontName,
  type ThemeColors,
} from '@/lib/theme';

export type { IconName };
type ColorProp = keyof ThemeColors;

/* ───────────── الحركة ───────────── */

/** ظهور تدريجي هادئ (fade + انزلاق خفيف) */
export function FadeIn({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: motion.normal, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/* ───────────── النص ───────────── */

export type TextVariant = keyof typeof typeScale;

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  font?: FontName;
  color?: ColorProp;
  /** عرض النص باتجاه LTR (لمحتوى اللغة الإنجليزية) */
  ltr?: boolean;
  center?: boolean;
}

/** نعزل التعابير الرياضية في النص العربي حتى لا تُعرض معكوسة (انظر lib/bidi.ts) */
function fixBidi(children: ReactNode): ReactNode {
  if (typeof children === 'string') return isolateMath(children);
  if (Array.isArray(children) && children.every((c) => typeof c === 'string' || typeof c === 'number')) {
    return isolateMath(children.join(''));
  }
  return children;
}

export function AppText({ variant = 'body', font, color = 'text', ltr, center, style, children, ...rest }: AppTextProps) {
  const { colors, fontScale } = useAppTheme();
  const v = typeScale[variant];
  const s: TextStyle = {
    fontFamily: fonts[font ?? v.font],
    fontSize: v.size * fontScale,
    lineHeight: v.line * fontScale,
    color: colors[color],
  };
  return (
    <Text {...rest} style={[s, variant === 'overline' && styles.overline, ltr && styles.ltrText, center && styles.center, style]}>
      {ltr ? children : fixBidi(children)}
    </Text>
  );
}

/** رقم بخط العناوين وباللون الذهبي */
export function Num({ children, variant = 'title', color = 'goldText' }: { children: ReactNode; variant?: TextVariant; color?: ColorProp }) {
  return (
    <AppText variant={variant} font="heading" color={color}>
      {children}
    </AppText>
  );
}

/* ───────────── الحاويات ───────────── */

export function Screen({
  children,
  scroll = true,
  edges = ['bottom'],
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.background }}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.screenContent, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <FadeIn style={{ gap: spacing.xl }}>{children}</FadeIn>
        </ScrollView>
      ) : (
        <FadeIn style={[styles.screenContent, { flex: 1 }, contentStyle]}>{children}</FadeIn>
      )}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
  accent,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** خط رفيع ملوّن على جانب البطاقة (لون المادة) */
  accent?: string;
}) {
  const { colors } = useAppTheme();
  const base = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style];
  // على الويب لا يقلب المتصفح «start» تلقائياً، فنثبّت الخط على اليمين (بداية السطر العربي)
  const strip = accent ? <View style={[styles.accent, Platform.OS === 'web' ? { right: 0 } : { start: 0 }, { backgroundColor: accent }]} /> : null;
  if (!onPress)
    return (
      <View style={base}>
        {strip}
        {children}
      </View>
    );
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && { borderColor: colors.goldLine, backgroundColor: colors.surfaceRaised }]}>
      {strip}
      {children}
    </Pressable>
  );
}

export function Row({ children, style, gap = spacing.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

/** فاصل رفيع، مع زخرفة ماسية صغيرة اختيارية في الوسط */
export function Divider({ ornament, style }: { ornament?: boolean; style?: StyleProp<ViewStyle> }) {
  const { colors } = useAppTheme();
  if (!ornament) return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }, style]} />;
  return (
    <Row gap={spacing.sm} style={[{ justifyContent: 'center' }, style]}>
      <View style={{ height: 1, width: 48, backgroundColor: colors.goldLine }} />
      <View style={[styles.diamond, { borderColor: colors.gold }]} />
      <View style={{ height: 1, width: 48, backgroundColor: colors.goldLine }} />
    </Row>
  );
}

/* ───────────── الأزرار ───────────── */

export type ButtonKind = 'primary' | 'secondary' | 'ghost';

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  loading,
  size = 'md',
  style,
  ...rest
}: {
  title: string;
  onPress?: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
} & Omit<PressableProps, 'style' | 'onPress'>) {
  const { colors } = useAppTheme();
  const off = disabled || loading;
  const fg: ColorProp = kind === 'primary' ? 'onGold' : 'goldText';
  return (
    <Pressable
      {...rest}
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      style={({ pressed }) => [
        size === 'sm' ? styles.buttonSm : styles.button,
        kind === 'primary' && { backgroundColor: pressed ? colors.goldHover : colors.gold },
        kind === 'secondary' && { borderWidth: borderWidth.hairline, borderColor: pressed ? colors.goldHover : colors.gold, backgroundColor: pressed ? colors.goldFaint : 'transparent' },
        kind === 'ghost' && pressed && { backgroundColor: colors.goldFaint },
        off && { opacity: 0.4 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors[fg]} />
      ) : (
        <Row gap={spacing.sm} style={{ justifyContent: 'center' }}>
          <AppText variant="label" font="medium" color={fg}>
            {title}
          </AppText>
          {icon && <Icon name={icon} size={iconSize.sm + 2} color={fg} />}
        </Row>
      )}
    </Pressable>
  );
}

/* ───────────── الأيقونات ───────────── */

export function Icon({ name, size = iconSize.md, color = 'gold', strokeWidth = iconStroke }: { name: IconName; size?: number; color?: ColorProp; strokeWidth?: number }) {
  const { colors } = useAppTheme();
  const C = ICONS[name];
  return <C size={size} color={colors[color]} strokeWidth={strokeWidth} absoluteStrokeWidth />;
}

/** أيقونة ذهبية داخل دائرة بحد رفيع، مع خلفية خفيفة جداً بلون اختياري */
export function IconCircle({ name, size = 44, tint, color = 'gold' }: { name: IconName; size?: number; tint?: string; color?: ColorProp }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: borderWidth.hairline,
        borderColor: tint ? alpha(tint, 0.6) : colors.goldLine,
        backgroundColor: tint ? alpha(tint, 0.16) : colors.goldFaint,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={name} size={size * 0.46} color={color} />
    </View>
  );
}

/* ───────────── عناصر صغيرة ───────────── */

export function ProgressBar({ value, style }: { value: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useAppTheme();
  const pct = Math.max(0, Math.min(1, value));
  const [w] = useState(() => new Animated.Value(pct));
  useEffect(() => {
    Animated.timing(w, { toValue: pct, duration: motion.slow, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [pct, w]);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[{ height: progress.height, borderRadius: progress.height, backgroundColor: colors.border, overflow: 'hidden', flexDirection: 'row' }, style]}>
      <Animated.View
        style={{
          height: '100%',
          borderRadius: progress.height,
          backgroundColor: colors.gold,
          width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

/** مستوى الإتقان: ثلاث ماسات صغيرة (بديل هادئ للنجوم) */
export function Mastery({ count, size = 8 }: { count: number; size?: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', gap: size * 0.7, alignItems: 'center' }} accessible accessibilityLabel={`مستوى الإتقان ${count} من 3`}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: size,
            height: size,
            transform: [{ rotate: '45deg' }],
            borderWidth: 1,
            borderColor: colors.gold,
            backgroundColor: i < count ? colors.gold : 'transparent',
          }}
        />
      ))}
    </View>
  );
}

export function Chip({ label, icon, tone = 'muted' }: { label: string; icon?: IconName; tone?: 'muted' | 'gold' | 'success' | 'danger' }) {
  const { colors } = useAppTheme();
  const fg: ColorProp = { muted: 'textMuted', gold: 'goldText', success: 'successText', danger: 'dangerText' }[tone] as ColorProp;
  const border = { muted: colors.border, gold: colors.goldLine, success: alpha(colors.success, 0.5), danger: alpha(colors.danger, 0.5) }[tone];
  return (
    <Row gap={4} style={[styles.chip, { borderColor: border }]}>
      {icon && <Icon name={icon} size={iconSize.sm - 2} color={fg} />}
      <AppText variant="caption" font="medium" color={fg}>
        {label}
      </AppText>
    </Row>
  );
}

/** تبويبات نصية بخط ذهبي رفيع تحت العنصر النشط */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.segmented, { borderColor: colors.border }]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={String(o.value)} onPress={() => onChange(o.value)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={styles.segment}>
            <Row gap={6}>
              {o.icon && <Icon name={o.icon} size={iconSize.sm} color={on ? 'gold' : 'textMuted'} />}
              <AppText variant="label" font={on ? 'medium' : 'regular'} color={on ? 'text' : 'textMuted'} numberOfLines={1}>
                {o.label}
              </AppText>
            </Row>
            <View style={[styles.segmentLine, { backgroundColor: on ? colors.gold : 'transparent' }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({ icon, title, message, children }: { icon: IconName; title: string; message?: string; children?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <IconCircle name={icon} size={72} />
      <AppText variant="h2" center>
        {title}
      </AppText>
      {message && (
        <AppText color="textMuted" center style={{ maxWidth: 320 }}>
          {message}
        </AppText>
      )}
      {children}
    </View>
  );
}

/** عنوان قسم هادئ مع خط رفيع */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <AppText variant="h2">{children}</AppText>
        {action}
      </Row>
      <View style={{ height: 1, width: 32, backgroundColor: colors.gold }} />
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
  last,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  last?: boolean;
}) {
  const { colors } = useAppTheme();
  const content = (
    <>
      {icon && <Icon name={icon} />}
      <View style={{ flex: 1 }}>
        <AppText variant="label">{title}</AppText>
        {subtitle && (
          <AppText variant="caption" color="textMuted">
            {subtitle}
          </AppText>
        )}
      </View>
      {right ?? (onPress && <Icon name="ChevronLeft" size={iconSize.md} color="textMuted" />)}
    </>
  );
  const rowStyle = [styles.listRow, { borderColor: colors.border }, last && { borderBottomWidth: 0 }];
  // بدون onPress نستخدم View حتى لا يُعطَّل أي عنصر تفاعلي بداخله (مثل Switch)
  if (!onPress) return <View style={rowStyle}>{content}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [rowStyle, pressed && { opacity: 0.6 }]}>
      {content}
    </Pressable>
  );
}

/** إشعار صغير يظهر ويختفي بهدوء (مثل نقاط الإجابة) */
export function Toast({ text, visible, style }: { text: string; visible: boolean; style?: StyleProp<ViewStyle> }) {
  const { colors } = useAppTheme();
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!visible) return;
    v.setValue(0);
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: motion.normal, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(v, { toValue: 0, duration: motion.slow, useNativeDriver: true }),
    ]).start();
  }, [visible, text, v]);
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { backgroundColor: colors.surfaceRaised, borderColor: colors.goldLine, opacity: v }, style]}>
      <AppText variant="caption" font="medium" color="goldText">
        {text}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.xl },
  card: { borderRadius: radius.card, borderWidth: borderWidth.hairline, padding: spacing.xl, gap: spacing.md, overflow: 'hidden' },
  accent: { position: 'absolute', top: spacing.xl, bottom: spacing.xl, width: 2, borderRadius: 1 },
  button: { minHeight: 52, borderRadius: radius.button, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  buttonSm: { minHeight: 38, borderRadius: radius.button, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: radius.chip, borderWidth: borderWidth.hairline, alignSelf: 'flex-start' },
  segmented: { flexDirection: 'row', borderBottomWidth: borderWidth.hairline },
  segment: { flex: 1, alignItems: 'center', paddingTop: spacing.sm, gap: spacing.sm },
  segmentLine: { height: 2, alignSelf: 'stretch', marginHorizontal: spacing.md, borderRadius: 1 },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth },
  diamond: { width: 7, height: 7, borderWidth: 1, transform: [{ rotate: '45deg' }] },
  toast: { alignSelf: 'center', paddingHorizontal: spacing.lg, paddingVertical: 6, borderRadius: radius.chip, borderWidth: borderWidth.hairline },
  overline: { letterSpacing: 0.5 },
  ltrText: { writingDirection: 'ltr', textAlign: 'left' },
  center: { textAlign: 'center' },
});
