import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, F, STATE_COLORS } from '@/theme';
import { STATES, STATES_SHORT } from '@/types';
import type { CarState } from '@/types';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/* ---------- Texto ---------- */

export function Txt({ b, semi, med, style, ...p }: TextProps & { b?: boolean; semi?: boolean; med?: boolean }) {
  return (
    <Text
      {...p}
      style={[{ fontFamily: b ? F.bold : semi ? F.semi : med ? F.med : F.reg, fontSize: 15, color: C.text }, style]}
    />
  );
}

/** Titular de la marca: condensada, cursiva y en mayúsculas. */
export function Disp({ size = 28, color = C.text, style, ...p }: TextProps & { size?: number; color?: string }) {
  return (
    <Text
      {...p}
      style={[
        { fontFamily: F.disp, fontSize: size, lineHeight: size * 1.05, color, textTransform: 'uppercase', letterSpacing: 0.3 },
        style,
      ]}
    />
  );
}

export const Eyebrow = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
  <Txt b style={[{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6 }, style]}>
    {children}
  </Txt>
);

/* ---------- Estructura ---------- */

export function AppHeader({
  title,
  subtitle,
  eyebrow,
  onBack,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  onBack?: boolean | (() => void);
  right?: ReactNode;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const back = typeof onBack === 'function' ? onBack : () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <View>
      <View style={{ backgroundColor: C.ink, paddingTop: insets.top + 8, paddingBottom: 14, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {onBack ? (
            <Pressable
              onPress={back}
              accessibilityRole="button"
              accessibilityLabel="Regresar"
              hitSlop={6}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -12 }}
            >
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </Pressable>
          ) : null}
          <View style={{ flex: 1 }}>
            {eyebrow ? (
              <Txt b style={{ fontSize: 12, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                {eyebrow}
              </Txt>
            ) : null}
            <Disp size={onBack ? 26 : 30} color="#fff">
              {title}
            </Disp>
            {subtitle ? <Txt style={{ color: C.mutedLight, fontSize: 13, marginTop: 2 }}>{subtitle}</Txt> : null}
          </View>
          {right}
        </View>
        {children}
      </View>
      <View style={{ height: 5, backgroundColor: C.orange }} />
    </View>
  );
}

export function Body({
  children,
  gap = 12,
  scroll = true,
  pad = 16,
  bottom = 24,
}: {
  children: ReactNode;
  gap?: number;
  scroll?: boolean;
  pad?: number;
  bottom?: number;
}) {
  if (!scroll) return <View style={{ flex: 1, padding: pad, gap }}>{children}</View>;
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: pad, paddingBottom: bottom, gap }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      {children}
    </ScrollView>
  );
}

export function FooterBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: C.line,
        paddingTop: 12,
        paddingHorizontal: 16,
        paddingBottom: Math.max(insets.bottom, 12),
      }}
    >
      {children}
    </View>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1, backgroundColor: C.bg }}>{children}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: C.card, borderRadius: 14, padding: 14, gap: 10 }, style]}>{children}</View>;
}

/** Etiqueta de sección, como las de la orden en papel: cuadro naranja y barra negra. */
export function SectionTag({ children }: { children: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, alignSelf: 'flex-start' }}>
      <View style={{ width: 30, height: 30, backgroundColor: C.orange, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }} />
      <View
        style={{
          height: 30,
          backgroundColor: C.ink,
          justifyContent: 'center',
          paddingLeft: 12,
          paddingRight: 22,
          borderTopRightRadius: 12,
        }}
      >
        <Txt b style={{ color: '#fff', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {children}
        </Txt>
      </View>
    </View>
  );
}

/* ---------- Controles ---------- */

export function Btn({
  label,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  flex,
}: {
  label: string;
  onPress?: () => void;
  kind?: 'primary' | 'outline' | 'dark';
  icon?: IconName;
  disabled?: boolean;
  flex?: boolean;
}) {
  const bg = disabled ? C.line : kind === 'primary' ? C.orange : kind === 'dark' ? C.ink : '#fff';
  const fg = disabled ? C.muted : kind === 'dark' ? '#fff' : C.text;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => ({
        flex: flex ? 1 : undefined,
        minHeight: 50,
        borderRadius: 10,
        paddingHorizontal: 18,
        backgroundColor: pressed && !disabled && kind === 'primary' ? C.orangeHi : bg,
        borderWidth: kind === 'outline' ? 1.5 : 0,
        borderColor: C.ink,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      })}
    >
      {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
      <Txt b style={{ color: fg, fontSize: 16 }}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function Chip({
  label,
  on,
  onPress,
  grow,
}: {
  label: string;
  on?: boolean;
  onPress?: () => void;
  grow?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      style={{
        flexGrow: grow ? 1 : 0,
        minHeight: 38,
        paddingHorizontal: 14,
        borderRadius: 19,
        borderWidth: 1.5,
        borderColor: on ? C.ink : C.border,
        backgroundColor: on ? C.ink : '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt semi style={{ color: on ? '#fff' : C.text, fontSize: 14 }}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function StatePill({ state }: { state: CarState }) {
  const c = STATE_COLORS[state];
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 }}>
      <Txt b style={{ color: c.fg, fontSize: 12 }}>
        {STATES_SHORT[state]}
      </Txt>
    </View>
  );
}

export function Tag({ label, bg = C.bg, fg = C.text, dashed }: { label: string; bg?: string; fg?: string; dashed?: boolean }) {
  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: dashed ? 1.5 : 0,
        borderStyle: 'dashed',
        borderColor: C.ink,
      }}
    >
      <Txt b style={{ color: fg, fontSize: 12 }}>
        {label}
      </Txt>
    </View>
  );
}

/** Marca de lo que no entra en el MVP. */
export function PhaseBadge({ phase }: { phase: number }) {
  return (
    <View style={{ backgroundColor: C.orange, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 }}>
      <Txt b style={{ color: C.text, fontSize: 10 }}>{`F${phase}`}</Txt>
    </View>
  );
}

export function Field({
  label,
  style,
  multiline,
  ...p
}: TextInputProps & { label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ gap: 5 }, style]}>
      <Txt semi style={{ fontSize: 13, color: '#3F3B36' }}>
        {label}
      </Txt>
      <TextInput
        {...p}
        multiline={multiline}
        accessibilityLabel={label}
        placeholderTextColor="#8A847D"
        style={{
          minHeight: multiline ? 96 : 46,
          borderWidth: 1.5,
          borderColor: C.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 0,
          fontSize: 15,
          fontFamily: F.reg,
          color: C.text,
          backgroundColor: '#fff',
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      style={{
        width: 52,
        height: 30,
        borderRadius: 15,
        backgroundColor: value ? C.ink : C.border,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: value ? 25 : 3,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: value ? C.orange : '#fff',
        }}
      />
    </Pressable>
  );
}

export function Row({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>{children}</View>;
}

export function Avatar({ text, size = 48, uri }: { text: string; size?: number; uri?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: C.orange,
        borderWidth: 2,
        borderColor: C.ink,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Txt b style={{ fontSize: size * 0.34 }}>
        {text}
      </Txt>
    </View>
  );
}

/** Barra de avance de seis tramos. */
export function ProgressBar({ state, dark }: { state: CarState; dark?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {STATES.map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 8,
            borderRadius: 4,
            backgroundColor: i < state ? (dark ? '#fff' : C.ink) : i === state ? C.orange : dark ? '#3A3A3A' : C.line,
          }}
        />
      ))}
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <View style={{ alignItems: 'center', padding: 32 }}>
      <Txt style={{ color: C.muted, textAlign: 'center' }}>{text}</Txt>
    </View>
  );
}
