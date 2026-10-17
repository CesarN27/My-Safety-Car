import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useTabBottom } from '@/components/role-tabs';
import { PhotoSlot } from '@/components/photo-slot';
import { AppHeader, Body, Btn, Card, Chip, Disp, Eyebrow, Field, Row, Screen, Tag, Txt } from '@/components/ui';
import { initials } from '@/lib/format';
import { helperPay, money } from '@/lib/money';
import { useStore } from '@/store/app';
import { C } from '@/theme';
import type { Helper } from '@/types';

const ruleText = (h: Helper) => (h.pay.type === 'fijo' ? `Fijo ${money(h.pay.amount)} por coche` : `${h.pay.pct}% de la mano de obra`);

export default function Ayudantes() {
  const tabBottom = useTabBottom();
  const { helpers, cars, payHelper, addHelper } = useStore();
  const [adding, setAdding] = useState(false);

  const earned = (h: Helper) =>
    cars.filter((c) => c.helperId === h.id).reduce((sum, c) => sum + helperPay(c.costs, h), 0);
  const due = helpers.filter((h) => !h.paid).reduce((s, h) => s + earned(h), 0);

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
              Por pagar esta semana
            </Txt>
            <Txt style={{ fontSize: 12, color: C.mutedLight }}>Suma de lo que ganó cada ayudante</Txt>
          </View>
          <Disp size={30} color={C.orange}>
            {money(due)}
          </Disp>
        </View>

        {adding ? (
          <NewHelper
            onSave={(h) => {
              addHelper(h);
              setAdding(false);
            }}
          />
        ) : null}

        {helpers.map((h) => {
          const mine = cars.filter((c) => c.helperId === h.id);
          const amt = earned(h);
          const ok = h.paid || amt === 0;
          return (
            <Card key={h.id} style={{ gap: 12 }}>
              <Row style={{ gap: 14 }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#2A2A2A', borderWidth: 3, borderColor: C.orange, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt b style={{ color: '#fff', fontSize: 18 }}>
                    {initials(h.name)}
                  </Txt>
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
                  <Txt style={{ fontSize: 12, color: C.muted }}>Ganado esta semana</Txt>
                  <Disp size={22}>{money(amt)}</Disp>
                </View>
                <Pressable
                  onPress={() => (!ok ? payHelper(h.id) : undefined)}
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
                    {h.paid ? 'Pagado' : amt === 0 ? 'Sin pendientes' : 'Marcar pagado'}
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

function NewHelper({ onSave }: { onSave: (h: { name: string; phone: string; photo?: string; pay: Helper['pay'] }) => void }) {
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
        label="Guardar ayudante"
        disabled={!name.trim() || n <= 0}
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
