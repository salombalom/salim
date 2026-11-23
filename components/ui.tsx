import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { alpha, fonts, radius, softShadow, spacing, useAppTheme, type FontWeightName, type ThemeColors } from '@/lib/theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type ColorProp = keyof ThemeColors | (string & {});

function useColor() {
  const { colors } = useAppTheme();
  return (c: ColorProp) => (colors as Record<string, string>)[c] ?? c;
}

/* ───────────── النص ───────────── */

const VARIANTS = {
  display: { size: 34, line: 50, weight: 'black' },
  title: { size: 25, line: 38, weight: 'heading' },
  h2: { size: 19, line: 30, weight: 'heading' },
  body: { size: 16, line: 26, weight: 'regular' },
  label: { size: 15, line: 23, weight: 'medium' },
  caption: { size: 13, line: 20, weight: 'regular' },
  tiny: { size: 11, line: 16, weight: 'medium' },
} as const satisfies Record<string, { size: number; line: number; weight: FontWeightName }>;

export type TextVariant = keyof typeof VARIANTS;

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  weight?: FontWeightName;
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

export function AppText({ variant = 'body', weight, color = 'text', ltr, center, style, children, ...rest }: AppTextProps) {
  const { fontScale } = useAppTheme();
  const resolve = useColor();
  const v = VARIANTS[variant];
  const s: TextStyle = {
    fontFamily: fonts[weight ?? v.weight],
    fontSize: v.size * fontScale,
    lineHeight: v.line * fontScale,
    color: resolve(color),
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
        <ScrollView contentContainerStyle={[styles.screenContent, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.screenContent, { flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Gradient({
  colors,
  style,
  children,
}: {
  colors: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  return (
    <LinearGradient colors={colors} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const { colors, isDark } = useAppTheme();
  const base = [
    styles.card,
    { backgroundColor: colors.surface, borderColor: isDark ? colors.border : 'transparent' },
    softShadow(colors.shadow, isDark),
    style,
  ];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

export function Row({ children, style, gap = spacing.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

/* ───────────── الأزرار ثلاثية الأبعاد ───────────── */

export type ButtonKind = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'white';

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
  const { colors, isDark } = useAppTheme();
  const k = {
    primary: { face: colors.primary, edge: colors.primaryDeep, fg: colors.primaryText, border: undefined },
    secondary: { face: colors.surface, edge: isDark ? colors.border : '#D8D1F5', fg: colors.primary, border: isDark ? colors.border : '#E6E1F7' },
    success: { face: colors.success, edge: colors.successDeep, fg: '#FFFFFF', border: undefined },
    danger: { face: colors.danger, edge: colors.dangerDeep, fg: '#FFFFFF', border: undefined },
    ghost: { face: 'transparent', edge: 'transparent', fg: colors.primary, border: undefined },
    white: { face: '#FFFFFF', edge: 'rgba(0,0,0,0.18)', fg: '#4B2FCF', border: undefined },
  }[kind];
  const off = disabled || loading;
  const depth = kind === 'ghost' ? 0 : size === 'sm' ? 3 : 5;
  return (
    <Pressable
      {...rest}
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      style={style}>
      {({ pressed }) => (
        <View
          style={[
            size === 'sm' ? styles.buttonSm : styles.button,
            {
              backgroundColor: k.face,
              borderBottomColor: k.edge,
              borderBottomWidth: pressed && !off ? Math.min(1, depth) : depth,
              marginTop: pressed && !off ? depth - Math.min(1, depth) : 0,
            },
            k.border ? { borderWidth: 2, borderColor: k.border, borderBottomColor: k.edge } : null,
            off && { opacity: 0.45 },
          ]}>
          {loading ? (
            <ActivityIndicator color={k.fg} />
          ) : (
            <Row gap={spacing.sm} style={{ justifyContent: 'center' }}>
              {icon && <MaterialCommunityIcons name={icon} size={size === 'sm' ? 18 : 22} color={k.fg} />}
              <AppText variant={size === 'sm' ? 'label' : 'body'} weight="bold" color={k.fg}>
                {title}
              </AppText>
            </Row>
          )}
        </View>
      )}
    </Pressable>
  );
}

/* ───────────── عناصر صغيرة ───────────── */

export function Icon({ name, size = 22, color = 'text' }: { name: IconName; size?: number; color?: ColorProp }) {
  const resolve = useColor();
  return <MaterialCommunityIcons name={name} size={size} color={resolve(color)} />;
}

/** أيقونة داخل مربع دائري ملوّن */
export function IconBadge({
  name,
  color = 'primary',
  bg,
  size = 44,
  iconSize,
  round,
}: {
  name: IconName;
  color?: ColorProp;
  bg?: string;
  size?: number;
  iconSize?: number;
  round?: boolean;
}) {
  const resolve = useColor();
  const fg = resolve(color);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: round ? size / 2 : size * 0.32,
        backgroundColor: bg ?? (fg.startsWith('#') ? alpha(fg, 0.14) : 'rgba(0,0,0,0.06)'),
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <MaterialCommunityIcons name={name} size={iconSize ?? size * 0.55} color={fg} />
    </View>
  );
}

export function ProgressBar({
  value,
  color,
  trackColor,
  height = 10,
  style,
}: {
  value: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[{ height, borderRadius: height, backgroundColor: trackColor ?? colors.surfaceAlt, overflow: 'hidden', flexDirection: 'row' }, style]}>
      <View style={{ width: `${pct * 100}%`, minWidth: pct > 0 ? height : 0, height: '100%', borderRadius: height, backgroundColor: color ?? colors.primary }}>
        {/* لمعة خفيفة */}
        <View style={{ position: 'absolute', top: height * 0.2, start: height * 0.4, end: height * 0.4, height: Math.max(2, height * 0.22), borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' }} />
      </View>
    </View>
  );
}

export function Stars({ count, size = 18, emptyColor }: { count: number; size?: number; emptyColor?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }} accessible accessibilityLabel={`${count} من 3 نجوم`}>
      {[0, 1, 2].map((i) => (
        <MaterialCommunityIcons key={i} name="star" size={size} color={i < count ? colors.star : (emptyColor ?? colors.border)} />
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
      <AppText variant="caption" weight="semibold" color={fg}>
        {label}
      </AppText>
    </Row>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  activeColor,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
  activeColor?: string;
}) {
  const { colors, isDark } = useAppTheme();
  const active = activeColor ?? colors.primary;
  return (
    <View style={[styles.segmented, { backgroundColor: colors.surfaceAlt }]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.segment, on && [{ backgroundColor: active }, softShadow(active, isDark, 0.8)]]}>
            {o.icon && <MaterialCommunityIcons name={o.icon} size={18} color={on ? '#FFFFFF' : colors.textMuted} />}
            <AppText variant="caption" weight={on ? 'bold' : 'medium'} color={on ? '#FFFFFF' : 'textMuted'} numberOfLines={1}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({ icon, title, message, children }: { icon: IconName; title: string; message?: string; children?: ReactNode }) {
  const { gradients } = useAppTheme();
  return (
    <View style={styles.empty}>
      <Gradient colors={gradients.hero} style={styles.emptyIcon}>
        <MaterialCommunityIcons name={icon} size={44} color="#FFFFFF" />
      </Gradient>
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

export function SectionTitle({ children, action, icon }: { children: ReactNode; action?: ReactNode; icon?: IconName }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: spacing.xs }}>
      <Row gap={6}>
        {icon && <Icon name={icon} color="primary" size={22} />}
        <AppText variant="h2">{children}</AppText>
      </Row>
      {action}
    </Row>
  );
}

export function ListRow({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  right,
  last,
}: {
  icon?: IconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  last?: boolean;
}) {
  const { colors } = useAppTheme();
  const content = (
    <>
      {icon && <IconBadge name={icon} color={iconColor ?? colors.primary} size={38} />}
      <View style={{ flex: 1 }}>
        <AppText variant="label" weight="semibold">
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="caption" color="textMuted">
            {subtitle}
          </AppText>
        )}
      </View>
      {right ?? (onPress && <MaterialCommunityIcons name="chevron-left" size={22} color={colors.textMuted} />)}
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

const styles = StyleSheet.create({
  screenContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl * 1.5 },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.95 },
  button: {
    minHeight: 56,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSm: {
    minHeight: 40,
    borderRadius: radius.sm + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: 5, gap: 4 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: radius.sm + 2,
  },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyIcon: { width: 96, height: 96, borderRadius: 34, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  ltrText: { writingDirection: 'ltr', textAlign: 'left' },
  center: { textAlign: 'center' },
});
