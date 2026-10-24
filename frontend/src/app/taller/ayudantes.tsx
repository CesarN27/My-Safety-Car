import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useTabBottom } from '@/components/role-tabs';
import { PhotoSlot } from '@/components/photo-slot';
import { AppHeader, Body, Btn, Card, Chip, Disp, Eyebrow, Field, Row, Screen, Tag, Txt } from '@/components/ui';
import { initials } from '@/lib/format';
import { imageSource } from '@/lib/api';
import { Image } from 'expo-image';
import { money } from '@/lib/money';
import { useStore } from '@/store/app';
import { C } from '@/theme';
import type { Helper } from '@/types';

const ruleText = (h: Helper) => (h.pay.type === 'fijo' ? `Fijo ${money(h.pay.amount)} por coche` : `${h.pay.pct}% de la mano de obra`);

export default function Ayudantes() {
  const tabBottom = useTabBottom();
  const { helpers, cars, payHelper, addHelper, pendingByHelper } = useStore();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lo que se le debe a cada ayudante: pagos que el servidor congela al entregar cada coche.
  const pending = (h: Helper) => pendingByHelper[h.id]?.total ?? 0;
  const due = helpers.reduce((s, h) => s + pending(h), 0);
  const act = (fn: () => Promise<void>) => async () => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppHeader
        title="Ayudantes"
        right={
          <Pressable
            onPress={() => setAdding((v) => !v)}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.orange, paddingHorizontal: 14, minHeight: 44, borderRadius: 10 }}
          >
            <Ionicons name={adding ? 'close' : 'add'} size={20} color={C.text} />
            <Txt b>{adding ? 'Cerrar' : 'Agregar'}</Txt>
          </Pressable>
        }
      />
      <Body bottom={tabBottom}>
        <View style={{ backgroundColor: C.ink, borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Txt b style={{ fontSize: 12, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Por pagar
            </Txt>
            <Txt style={{ fontSize: 12, color: C.mutedLight }}>Coches entregados que aún no se pagan</Txt>
          </View>
          <Disp size={30} color={C.orange}>
            {money(due)}
          </Disp>
        </View>

        {error ? (
          <Txt accessibilityRole="alert" style={{ color: C.red, fontSize: 13 }}>
            {error}
          </Txt>
        ) : null}
        {adding ? <NewHelper busy={busy} onSave={(h) => act(() => addHelper(h))()} /> : null}

        {helpers.map((h) => {
          const mine = cars.filter((c) => c.helperId === h.id && c.state < 5);
          const amt = pending(h);
          const ok = amt === 0;
          return (
            <Card key={h.id} style={{ gap: 12 }}>
              <Row style={{ gap: 14 }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#2A2A2A', borderWidth: 3, borderColor: C.orange, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {h.photo ? (
                    <Image source={imageSource(h.photo)} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel={`Foto de ${h.name}`} />
                  ) : (
                    <Txt b style={{ color: '#fff', fontSize: 18 }}>
                      {initials(h.name)}
                    </Txt>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Txt b style={{ fontSize: 16 }}>
                    {h.name}
                  </Txt>
                  <Txt style={{ fontSize: 13, color: C.muted }}>
                    {ruleText(h)} · {h.phone}
                  </Txt>
                </View>
              </Row>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {mine.length ? (
                  mine.map((c) => <Tag key={c.id} label={`${c.folio} ${c.model}`} />)
                ) : (
                  <Tag label="Sin coches asignados" />
                )}
              </View>
              <Row style={{ justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 }}>
                <View>
                  <Txt style={{ fontSize: 12, color: C.muted }}>Pendiente de pago</Txt>
                  <Disp size={22}>{money(amt)}</Disp>
                </View>
                <Pressable
                  onPress={!ok && !busy ? act(() => payHelper(h.id)) : undefined}
                  accessibilityRole="button"
                  style={{
                    minHeight: 44,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    justifyContent: 'center',
                    backgroundColor: ok ? C.greenBg : C.ink,
                  }}
                >
                  <Txt b style={{ fontSize: 14, color: ok ? C.green : '#fff' }}>
                    {ok ? 'Sin pendientes' : 'Marcar pagado'}
                  </Txt>
                </Pressable>
              </Row>
            </Card>
          );
        })}
      </Body>
    </Screen>
  );
}

function NewHelper({ onSave, busy }: { onSave: (h: { name: string; phone: string; photo?: string; pay: Helper['pay'] }) => void; busy: boolean }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<string>();
  const [type, setType] = useState<'fijo' | 'porcentaje'>('fijo');
  const [value, setValue] = useState('450');

  const n = Number(value.replace(/[^0-9.]/g, '')) || 0;
  return (
    <Card style={{ borderWidth: 1.5, borderColor: C.orange }}>
      <Eyebrow>Nuevo ayudante</Eyebrow>
      <Row style={{ gap: 12, alignItems: 'flex-start' }}>
        <PhotoSlot label="Foto" uri={photo} onChange={setPhoto} size={84} />
        <View style={{ flex: 1, gap: 10 }}>
          <Field label="Nombre" value={name} onChangeText={setName} />
          <Field label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>
      </Row>
      <Eyebrow>Tipo de pago</Eyebrow>
      <Row style={{ gap: 8 }}>
        <Chip label="Fijo por coche" on={type === 'fijo'} onPress={() => setType('fijo')} grow />
        <Chip label="% de mano de obra" on={type === 'porcentaje'} onPress={() => setType('porcentaje')} grow />
      </Row>
      <Field
        label={type === 'fijo' ? 'Monto por coche ($)' : 'Porcentaje (%)'}
        value={value}
        onChangeText={setValue}
        keyboardType="numeric"
      />
      <Btn
        label={busy ? 'Guardando…' : 'Guardar ayudante'}
        disabled={busy || !name.trim() || phone.replace(/\D/g, '').length < 10 || n <= 0}
        onPress={() =>
          onSave({
            name: name.trim(),
            phone: phone.trim(),
            photo,
            pay: type === 'fijo' ? { type: 'fijo', amount: n } : { type: 'porcentaje', pct: Math.min(100, n) },
          })
        }
      />
    </Card>
  );
}
