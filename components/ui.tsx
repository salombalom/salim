import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
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

import { isolateMath } from '@/lib/bidi';
import { fonts, radius, spacing, useAppTheme, type FontWeightName, type ThemeColors } from '@/lib/theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/* ───────────── النص ───────────── */

const VARIANTS = {
  display: { size: 30, line: 42, weight: 'bold' },
  title: { size: 22, line: 32, weight: 'bold' },
  h2: { size: 18, line: 28, weight: 'semibold' },
  body: { size: 16, line: 26, weight: 'regular' },
  label: { size: 15, line: 22, weight: 'medium' },
  caption: { size: 13, line: 20, weight: 'regular' },
} as const satisfies Record<string, { size: number; line: number; weight: FontWeightName }>;

export type TextVariant = keyof typeof VARIANTS;

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  weight?: FontWeightName;
  color?: keyof ThemeColors | (string & {});
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

export function AppText({ variant = 'body', weight, color = 'text', ltr, center, style, children, ...rest }: AppTextProps) {
  const { colors, fontScale } = useAppTheme();
  const v = VARIANTS[variant];
  const resolved = (colors as Record<string, string>)[color] ?? color;
  const s: TextStyle = {
    fontFamily: fonts[weight ?? v.weight],
    fontSize: v.size * fontScale,
    lineHeight: v.line * fontScale,
    color: resolved,
  };
  return (
    <Text {...rest} style={[s, ltr && styles.ltrText, center && styles.center, style]}>
      {ltr ? children : fixBidi(children)}
    </Text>
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
        <ScrollView contentContainerStyle={[styles.screenContent, contentStyle]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.screenContent, { flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style, onPress, accessibilityLabel }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; accessibilityLabel?: string }) {
  const { colors } = useAppTheme();
  const base = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
      {children}
    </Pressable>
  );
}

export function Row({ children, style, gap = spacing.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

/* ───────────── الأزرار ───────────── */

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  loading,
  style,
  ...rest
}: {
  title: string;
  onPress?: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
} & Omit<PressableProps, 'style' | 'onPress'>) {
  const { colors } = useAppTheme();
  const bg = { primary: colors.primary, secondary: colors.primarySoft, ghost: 'transparent', danger: colors.dangerSoft }[kind];
  const fg = { primary: colors.primaryText, secondary: colors.primary, ghost: colors.primary, danger: colors.danger }[kind];
  return (
    <Pressable
      {...rest}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading) }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: kind === 'ghost' ? colors.border : bg },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Row gap={spacing.sm} style={{ justifyContent: 'center' }}>
          {icon && <MaterialCommunityIcons name={icon} size={20} color={fg} />}
          <AppText variant="label" weight="semibold" color={fg}>
            {title}
          </AppText>
        </Row>
      )}
    </Pressable>
  );
}

/* ───────────── عناصر صغيرة ───────────── */

export function Icon({ name, size = 22, color = 'text' }: { name: IconName; size?: number; color?: keyof ThemeColors | (string & {}) }) {
  const { colors } = useAppTheme();
  return <MaterialCommunityIcons name={name} size={size} color={(colors as Record<string, string>)[color] ?? color} />;
}

export function ProgressBar({ value, color, height = 8, style }: { value: number; color?: string; height?: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useAppTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[{ height, borderRadius: height, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }, style]}>
      <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: height, backgroundColor: color ?? colors.primary }} />
    </View>
  );
}

export function Stars({ count, size = 18 }: { count: number; size?: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }} accessible accessibilityLabel={`${count} من 3 نجوم`}>
      {[0, 1, 2].map((i) => (
        <MaterialCommunityIcons key={i} name={i < count ? 'star' : 'star-outline'} size={size} color={i < count ? colors.star : colors.textMuted} />
      ))}
    </View>
  );
}

export function Chip({ label, color, bg, icon }: { label: string; color?: string; bg?: string; icon?: IconName }) {
  const { colors } = useAppTheme();
  const fg = color ?? colors.textMuted;
  return (
    <Row gap={4} style={[styles.chip, { backgroundColor: bg ?? colors.surfaceAlt }]}>
      {icon && <MaterialCommunityIcons name={icon} size={14} color={fg} />}
      <AppText variant="caption" weight="medium" color={fg}>
        {label}
      </AppText>
    </Row>
  );
}

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
    <View style={[styles.segmented, { backgroundColor: colors.surfaceAlt }]} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {o.icon && <MaterialCommunityIcons name={o.icon} size={18} color={active ? colors.primary : colors.textMuted} />}
            <AppText variant="caption" weight={active ? 'semibold' : 'medium'} color={active ? 'primary' : 'textMuted'} numberOfLines={1}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({ icon, title, message, children }: { icon: IconName; title: string; message?: string; children?: ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
        <MaterialCommunityIcons name={icon} size={36} color={colors.primary} />
      </View>
      <AppText variant="h2" center>
        {title}
      </AppText>
      {message && (
        <AppText color="textMuted" center>
          {message}
        </AppText>
      )}
      {children}
    </View>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: spacing.sm }}>
      <AppText variant="h2">{children}</AppText>
      {action}
    </Row>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  const { colors } = useAppTheme();
  const content = (
    <>
      {icon && <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />}
      <View style={{ flex: 1 }}>
        <AppText variant="label">{title}</AppText>
        {subtitle && (
          <AppText variant="caption" color="textMuted">
            {subtitle}
          </AppText>
        )}
      </View>
      {right ?? (onPress && <MaterialCommunityIcons name="chevron-left" size={22} color={colors.textMuted} />)}
    </>
  );
  // بدون onPress نستخدم View حتى لا يُعطَّل أي عنصر تفاعلي بداخله (مثل Switch)
  if (!onPress) return <View style={[styles.listRow, { borderColor: colors.border }]}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.listRow, { borderColor: colors.border }, pressed && { opacity: 0.7 }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg, gap: spacing.sm },
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: 4, gap: 4 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  ltrText: { writingDirection: 'ltr', textAlign: 'left' },
  center: { textAlign: 'center' },
});
