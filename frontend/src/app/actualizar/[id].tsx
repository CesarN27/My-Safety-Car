import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { PhotoSlot } from '@/components/photo-slot';
import { AppHeader, Body, Btn, Eyebrow, Field, FooterBar, Row, Screen, Toggle, Txt } from '@/components/ui';
import { useStore } from '@/store/app';
import { C } from '@/theme';
import { STATES } from '@/types';
import type { CarState } from '@/types';

const HINT = ['Recién llegó', 'Revisando qué tiene', 'Ya se pidió la pieza', 'Manos a la obra', 'Lo marca el dueño al capturar costos'];

export default function ActualizarAvance() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { carById, setProgress } = useStore();
  const car = carById(id);
  const [sel, setSel] = useState<CarState>(car?.state ?? 1);
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!car) return <Screen><AppHeader title="Actualizar avance" onBack /></Screen>;

  const save = async () => {
    setBusy(true);
    const err = await setProgress(car.id, sel, { note, photos, visible });
    setBusy(false);
    if (err) return setError(err);
    router.back();
  };

  return (
    <Screen>
      <AppHeader title="Actualizar avance" subtitle={`Folio ${car.folio} · ${car.brand} ${car.model} ${car.year}`} onBack />
      <Body gap={10}>
        <Eyebrow>¿En qué va el coche?</Eyebrow>
        {([1, 2, 3, 4] as CarState[]).map((s) => {
          const locked = s === 4;
          const on = sel === s;
          return (
            <Pressable
              key={s}
              onPress={() => (locked ? undefined : setSel(s))}
              accessibilityRole="radio"
              accessibilityState={{ selected: on, disabled: locked }}
              style={{
                minHeight: 52,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: locked ? C.bg : on ? C.orangeFaint : '#fff',
                borderWidth: 2,
                borderColor: on ? C.orange : C.line,
              }}
            >
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: on ? 6 : 2, borderColor: on ? C.orange : '#A8A29E' }} />
              <View style={{ flex: 1 }}>
                <Txt semi style={{ color: locked ? '#8A847D' : C.text }}>
                  {STATES[s]}
                </Txt>
                <Txt style={{ fontSize: 12, color: C.muted }}>{HINT[s]}</Txt>
              </View>
            </Pressable>
          );
        })}

        <Eyebrow style={{ paddingTop: 6 }}>Nota para el cliente (opcional)</Eyebrow>
        <Field label="Qué encontraste o qué sigue" value={note} onChangeText={setNote} multiline />

        <Eyebrow style={{ paddingTop: 6 }}>Fotos del avance</Eyebrow>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {photos.map((u, i) => (
            <PhotoSlot key={u + i} label={`Foto ${i + 1}`} uri={u} size={76} onChange={(n) => setPhotos((p) => p.map((x, j) => (j === i ? n : x)))} />
          ))}
          <PhotoSlot label="Agregar" size={76} onChange={(u) => setPhotos((p) => [...p, u])} />
        </View>

        <Row style={{ justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Txt semi style={{ fontSize: 14 }}>Que el cliente vea la nota y las fotos</Txt>
            <Txt style={{ fontSize: 12, color: C.muted }}>El dueño puede cambiarlo después</Txt>
          </View>
          <Toggle value={visible} onChange={setVisible} label="Visible para el cliente" />
        </Row>
        {error ? <Txt style={{ color: C.red, fontSize: 13 }}>{error}</Txt> : null}
      </Body>
      <FooterBar>
        <View style={{ flex: 1 }}>
          <Btn label={busy ? 'Guardando…' : 'Guardar y avisar al cliente'} onPress={save} disabled={busy} />
        </View>
      </FooterBar>
    </Screen>
  );
}
