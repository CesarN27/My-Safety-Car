import { useEffect, useMemo, useState } from 'react';
import { PanResponder, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Txt } from '@/components/ui';
import { C } from '@/theme';

/** Firma con el dedo. Avisa si hay trazo para poder pedirla antes de crear el expediente. */
export function SignaturePad({ onChange }: { onChange: (signed: boolean) => void }) {
  // Cada trazo es un camino SVG; el último crece mientras el dedo sigue abajo.
  const [strokes, setStrokes] = useState<string[]>([]);

  useEffect(() => {
    onChange(strokes.length > 0);
  }, [strokes.length, onChange]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Que el ScrollView de la pantalla no le quite el trazo.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          setStrokes((s) => [...s, `M${x.toFixed(1)},${y.toFixed(1)}`]);
        },
        onPanResponderMove: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          setStrokes((s) => s.map((d, i) => (i === s.length - 1 ? `${d} L${x.toFixed(1)},${y.toFixed(1)}` : d)));
        },
      }),
    [],
  );

  const clear = () => setStrokes([]);
  const all = strokes;
  const paths = strokes;

  return (
    <View>
      <View
        {...pan.panHandlers}
        accessibilityLabel="Área para la firma del cliente"
        style={{
          height: 130,
          backgroundColor: '#fff',
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: C.border,
          overflow: 'hidden',
        }}
      >
        <Svg width="100%" height="100%" pointerEvents="none">
          {all.map((d, i) => (
            <Path key={i} d={d} stroke="#111" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
        </Svg>
        <View pointerEvents="none" style={{ position: 'absolute', left: 14, right: 14, bottom: 26, borderTopWidth: 1, borderColor: '#A8A29E' }} />
        <Txt semi pointerEvents="none" style={{ position: 'absolute', left: 14, bottom: 6, fontSize: 11, color: C.muted }}>
          FIRMA DEL CLIENTE · acepta las cláusulas
        </Txt>
      </View>
      {paths.length ? (
        <Pressable onPress={clear} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-end' }}>
          <Txt semi style={{ color: C.orangeText }}>
            Borrar firma
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}
