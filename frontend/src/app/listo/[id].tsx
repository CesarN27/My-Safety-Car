import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Slash } from '@/components/brand';
import { AppHeader, Body, Btn, Card, Disp, Eyebrow, FooterBar, Row, Screen, Txt } from '@/components/ui';
import { carTotals, money } from '@/lib/money';
import { DEMO_SHOP_ID } from '@/data/seed';
import { useStore } from '@/store/app';
import { C } from '@/theme';

/** Aquí el cliente solo ve el total: ni refacciones, ni mano de obra, ni ganancia. */
export default function Listo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { carById, helpers, shops } = useStore();
  const [sent, setSent] = useState(false);
  const car = carById(id);
  const shop = shops.find((s) => s.id === DEMO_SHOP_ID) ?? shops[0];
  if (!car) return <Screen><AppHeader title="Tu coche" onBack /></Screen>;

  const { total } = carTotals(car, helpers);
  const done = car.log.find((l) => l.state === 4 && l.visibleToClient && l.note)?.note;

  return (
    <Screen>
      <View style={{ overflow: 'hidden' }}>
        <AppHeader title={car.state === 5 ? 'Tu coche fue entregado' : 'Tu coche está listo'} eyebrow={`${car.brand} ${car.model} ${car.year} · Folio ${car.folio}`} onBack />
        <Slash width={200} height={12} />
      </View>
      <Body>
        <Card style={{ alignItems: 'center', paddingVertical: 24, borderWidth: 2, borderColor: C.ink }}>
          <Eyebrow>Total a pagar</Eyebrow>
          <Disp size={56}>{money(total)}</Disp>
          <Txt style={{ fontSize: 13, color: C.muted }}>{car.ivaOn ? 'IVA incluido' : 'Sin IVA'} · pagas al recoger</Txt>
        </Card>

        {done ? (
          <Card>
            <Eyebrow>Qué se hizo</Eyebrow>
            <Txt style={{ lineHeight: 21 }}>{done}</Txt>
          </Card>
        ) : null}

        <Card>
          <Eyebrow>Recógelo en</Eyebrow>
          <Txt b>{shop.name}</Txt>
          <Txt style={{ color: '#3F3B36' }}>{shop.hours}</Txt>
          <Row style={{ gap: 8 }}>
            <Pressable
              onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`)}
              accessibilityRole="button"
              style={{ flex: 1, minHeight: 46, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: C.ink }}
            >
              <Ionicons name="navigate-outline" size={18} color={C.text} />
              <Txt b style={{ fontSize: 14 }}>Cómo llegar</Txt>
            </Pressable>
          </Row>
        </Card>
        <Txt style={{ fontSize: 13, color: C.muted, lineHeight: 19, paddingHorizontal: 4 }}>
          Garantía de 15 días en la reparación, siempre que el daño no se deba a uso inadecuado.
        </Txt>
      </Body>
      {car.state === 4 ? (
        <FooterBar>
          <View style={{ flex: 1 }}>
            {sent ? (
              <View accessibilityRole="alert" style={{ minHeight: 50, borderRadius: 10, backgroundColor: C.greenBg, alignItems: 'center', justifyContent: 'center' }}>
                <Txt b style={{ color: C.green }}>Le avisamos al taller que vas para allá</Txt>
              </View>
            ) : (
              <Btn label="Avisar que voy en camino" onPress={() => setSent(true)} />
            )}
          </View>
        </FooterBar>
      ) : null}
    </Screen>
  );
}
