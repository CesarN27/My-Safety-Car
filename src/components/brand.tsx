import { Text, View } from 'react-native';

import { Disp } from '@/components/ui';
import { C, F } from '@/theme';

export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <Disp size={size} color="#fff">
      TECNOCAR<Text style={{ color: C.orange, fontFamily: F.disp }}>-PRO</Text>
    </Disp>
  );
}

/** Franja inclinada naranja de la esquina, como en la orden. */
export function Slash({ width = 200, height = 12, right = -30 }: { width?: number; height?: number; right?: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        right,
        width,
        height,
        backgroundColor: C.orange,
        transform: [{ skewX: '-30deg' }],
      }}
    />
  );
}
