import type { CarState } from '@/types';

export const C = {
  ink: '#0F0F0F',
  orange: '#F26A1B',
  orangeHi: '#FF7A2B',
  orangeText: '#C2410C',
  orangeSoft: '#FFE4D1',
  orangeFaint: '#FFF4EC',
  bg: '#F4F2EF',
  card: '#FFFFFF',
  line: '#E6E2DC',
  border: '#D6D1CA',
  text: '#111111',
  muted: '#5B5650',
  mutedLight: '#A3A3A3',
  green: '#166534',
  greenBg: '#DCFCE7',
  red: '#991B1B',
  redBg: '#FEE2E2',
  amberBg: '#FEF3C7',
  amber: '#78350F',
  graphite: '#262626',
};

export const F = {
  reg: 'Barlow_400Regular',
  med: 'Barlow_500Medium',
  semi: 'Barlow_600SemiBold',
  bold: 'Barlow_700Bold',
  disp: 'BarlowCondensed_800ExtraBold_Italic',
} as const;

/** Colores de la pastilla de cada estado del coche. */
export const STATE_COLORS: Record<CarState, { bg: string; fg: string }> = {
  0: { bg: '#E5E7EB', fg: '#374151' },
  1: { bg: '#DBEAFE', fg: '#1E40AF' },
  2: { bg: '#FEF3C7', fg: '#92400E' },
  3: { bg: '#EDE9FE', fg: '#5B21B6' },
  4: { bg: '#DCFCE7', fg: '#166534' },
  5: { bg: '#111111', fg: '#FFFFFF' },
};
