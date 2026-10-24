import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppHeader, Body, Btn, Card, Disp, Eyebrow, FooterBar, Row, Screen, Toggle, Txt } from '@/components/ui';
import { IVA_RATE, money, totals } from '@/lib/money';
import { useStore } from '@/store/app';
import { C, F } from '@/theme';
import type { CostItem, CostKind } from '@/types';

const num = (s: string) => Number(s.replace(/[^0-9.]/g, '')) || 0;

export default function Costos() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { carById, helperById, saveCosts } = useStore();
  const car = carById(id);
  const [items, setItems] = useState<CostItem[]>(car?.costs ?? []);
  const [ivaOn, setIvaOn] = useState(car?.ivaOn ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!car) return <Screen><AppHeader title="Costos" onBack /></Screen>;

  const helper = helperById(car.helperId);
  const t = totals(items, ivaOn, helper);

  const patch = (itemId: string, p: Partial<CostItem>) => setItems((xs) => xs.map((x) => (x.id === itemId ? { ...x, ...p } : x)));
  const add = (kind: CostKind) => setItems((xs) => [...xs, { id: 'n' + Date.now() + xs.length, kind, desc: '', cost: 0, price: 0 }]);
  const remove = (itemId: string) => setItems((xs) => xs.filter((x) => x.id !== itemId));

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveCosts(car.id, items.filter((i) => i.desc.trim() || i.cost || i.price), ivaOn);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar los costos.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Costos" subtitle={`Folio ${car.folio} · ${car.brand} ${car.model} ${car.year}`} onBack />
      <Body>
        <Section
          title="Refacciones"
          cols={['Costo', 'Precio']}
          kind="refaccion"
          items={items}
          onAdd={() => add('refaccion')}
          onPatch={patch}
          onRemove={remove}
          addLabel="Agregar refacción"
        />
        <Section
          title="Mano de obra y servicios"
          cols={['', 'Precio']}
          kind="mano"
          items={items}
          onAdd={() => add('mano')}
          onPatch={patch}
          onRemove={remove}
          addLabel="Agregar servicio"
        />
        <Section
          title="Gastos del taller (no los ve el cliente)"
          cols={['Costo', '']}
          kind="gasto"
          items={items}
          onAdd={() => add('gasto')}
          onPatch={patch}
          onRemove={remove}
          addLabel="Agregar gasto"
        />
        {helper ? (
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Txt>Pago a ayudante</Txt>
                <Txt style={{ fontSize: 12, color: C.muted }}>
                  {helper.name.split(' ')[0]} · {helper.pay.type === 'fijo' ? 'fijo por coche' : `${helper.pay.pct}% de la mano de obra`}
                </Txt>
              </View>
              <Txt b>{money(t.helperCost)}</Txt>
            </Row>
          </Card>
        ) : null}

        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt>Subtotal</Txt>
            <Txt b>{money(t.subtotal)}</Txt>
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Txt>IVA {Math.round(IVA_RATE * 100)}%</Txt>
              <Txt style={{ fontSize: 12, color: C.muted }}>Apágalo si este servicio no se factura</Txt>
            </View>
            <Txt b>{money(t.iva)}</Txt>
            <Toggle value={ivaOn} onChange={setIvaOn} label="Cobrar IVA" />
          </Row>
          <Row style={{ justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: C.ink, paddingTop: 10, alignItems: 'baseline' }}>
            <Disp size={20}>Total al cliente</Disp>
            <Disp size={30}>{money(t.total)}</Disp>
          </Row>
        </Card>

        <View style={{ backgroundColor: C.ink, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Eyebrow style={{ color: C.mutedLight }}>Ganancia libre</Eyebrow>
            <Txt style={{ fontSize: 12, color: C.mutedLight }}>Subtotal − refacciones − ayudante − gastos</Txt>
          </View>
          <Disp size={32} color={t.profit >= 0 ? C.orange : '#FCA5A5'}>
            {money(t.profit)}
          </Disp>
        </View>

        <Txt style={{ fontSize: 13, color: '#3F3B36', backgroundColor: C.orangeSoft, padding: 12, borderRadius: 10, lineHeight: 19 }}>
          El cliente solo ve el total de <Txt b style={{ fontSize: 13 }}>{money(t.total)}</Txt>. El desglose, tus costos y la ganancia nunca salen del taller.
        </Txt>
      </Body>
      <FooterBar>
        <View style={{ flex: 1 }}>
          {error ? (
            <Txt accessibilityRole="alert" style={{ color: C.red, fontSize: 13, marginBottom: 6 }}>
              {error}
            </Txt>
          ) : null}
          <Btn label={busy ? 'Guardando…' : 'Guardar costos'} onPress={save} disabled={busy} />
        </View>
      </FooterBar>
    </Screen>
  );
}

function Section({
  title,
  cols,
  kind,
  items,
  onAdd,
  onPatch,
  onRemove,
  addLabel,
}: {
  title: string;
  cols: [string, string];
  kind: CostKind;
  items: CostItem[];
  onAdd: () => void;
  onPatch: (id: string, p: Partial<CostItem>) => void;
  onRemove: (id: string) => void;
  addLabel: string;
}) {
  const mine = items.filter((i) => i.kind === kind);
  return (
    <Card style={{ gap: 4 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Eyebrow>{title}</Eyebrow>
      </Row>
      {mine.length ? (
        <Row style={{ gap: 6 }}>
          <View style={{ flex: 1 }} />
          <Txt style={colStyle}>{cols[0]}</Txt>
          <Txt style={colStyle}>{cols[1]}</Txt>
          <View style={{ width: 36 }} />
        </Row>
      ) : null}
      {mine.map((i) => (
        <Row key={i.id} style={{ gap: 6, borderTopWidth: 1, borderTopColor: '#EFECE8', paddingTop: 6 }}>
          <TextInput
            value={i.desc}
            onChangeText={(d) => onPatch(i.id, { desc: d })}
            placeholder="Concepto"
            placeholderTextColor="#8A847D"
            accessibilityLabel="Concepto"
            style={[input, { flex: 1 }]}
          />
          {kind !== 'mano' ? (
            <Num value={i.cost} onChange={(n) => onPatch(i.id, { cost: n })} label="Costo" />
          ) : (
            <View style={{ width: 62 }} />
          )}
          {kind !== 'gasto' ? (
            <Num value={i.price} onChange={(n) => onPatch(i.id, { price: n })} label="Precio" />
          ) : (
            <View style={{ width: 62 }} />
          )}
          <Pressable onPress={() => onRemove(i.id)} accessibilityRole="button" accessibilityLabel="Quitar concepto" style={{ width: 36, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Txt b style={{ color: C.red, fontSize: 20 }}>×</Txt>
          </Pressable>
        </Row>
      ))}
      <Pressable onPress={onAdd} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
        <Txt b style={{ color: C.orangeText, fontSize: 14 }}>+ {addLabel}</Txt>
      </Pressable>
    </Card>
  );
}

function Num({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <TextInput
      value={value ? String(value) : ''}
      onChangeText={(s) => onChange(num(s))}
      keyboardType="numeric"
      placeholder="0"
      placeholderTextColor="#8A847D"
      accessibilityLabel={label}
      style={[input, { width: 62, textAlign: 'right' }]}
    />
  );
}

const colStyle = { width: 62, fontSize: 11, color: C.muted, textAlign: 'right', fontFamily: F.semi } as const;
const input = {
  minHeight: 42,
  borderWidth: 1.5,
  borderColor: C.border,
  borderRadius: 8,
  paddingHorizontal: 8,
  fontFamily: F.reg,
  fontSize: 14,
  color: C.text,
  backgroundColor: '#fff',
} as const;
