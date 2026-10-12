import { useEffect, useMemo, useState } from 'react';
import { PanResponder, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Txt } from '@/components/ui';
import { C } from '@/theme';
import type { Signature } from '@/types';

/** Firma ya capturada, para mostrarla en la app (la hoja impresa la dibuja con los mismos trazos). */
export function SignatureView({ signature, height = 90 }: { signature: Signature; height?: number }) {
  return (
    <View style={{ height, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: C.border, overflow: 'hidden' }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${signature.w} ${signature.h}`} preserveAspectRatio="xMidYMid meet">
        {signature.strokes.map((d, i) => (
          <Path key={i} d={d} stroke="#111" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ))}
      </Svg>
    </View>
  );
}

/** Firma con el dedo. Entrega los trazos (o null si no hay) para pedirla y guardarla con el expediente. */
export function SignaturePad({ onChange }: { onChange: (signature: Signature | null) => void }) {
  // Cada trazo es un camino SVG; el último crece mientras el dedo sigue abajo.
  const [strokes, setStrokes] = useState<string[]>([]);
  const [size, setSize] = useState({ w: 300, h: 130 });

  useEffect(() => {
    onChange(strokes.length ? { w: size.w, h: size.h, strokes } : null);
  }, [strokes, size, onChange]);

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

  return (
    <View>
      <View
        {...pan.panHandlers}
        onLayout={(e) => setSize({ w: Math.round(e.nativeEvent.layout.width), h: Math.round(e.nativeEvent.layout.height) })}
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
          {strokes.map((d, i) => (
            <Path key={i} d={d} stroke="#111" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
        </Svg>
        <View pointerEvents="none" style={{ position: 'absolute', left: 14, right: 14, bottom: 26, borderTopWidth: 1, borderColor: '#A8A29E' }} />
        <Txt semi pointerEvents="none" style={{ position: 'absolute', left: 14, bottom: 6, fontSize: 11, color: C.muted }}>
          FIRMA DEL CLIENTE · acepta las cláusulas
        </Txt>
      </View>
      {strokes.length ? (
        <Pressable onPress={clear} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-end' }}>
          <Txt semi style={{ color: C.orangeText }}>
            Borrar firma
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}
