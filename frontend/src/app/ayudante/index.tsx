import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBottom } from '@/components/role-tabs';
import { Avatar, Body, Btn, Card, Disp, Empty, Eyebrow, Row, Screen, StatePill, Txt } from '@/components/ui';
import { DEMO_HELPER_ID, SHOP_NAME } from '@/data/seed';
import { initials } from '@/lib/format';
import { helperPay, money } from '@/lib/money';
import { useStore } from '@/store/app';
import { C } from '@/theme';

export default function MisCoches() {
  const tabBottom = useTabBottom();
  const { cars, helperById } = useStore();
  const insets = useSafeAreaInsets();
  const me = helperById(DEMO_HELPER_ID);
  if (!me) return <Screen>{null}</Screen>;

  const mine = cars.filter((c) => c.helperId === me.id);
  const active = mine.filter((c) => c.state < 5);
  const earned = mine.reduce((s, c) => s + helperPay(c.costs, me), 0);

  return (
    <Screen>
      <View style={{ backgroundColor: C.ink, paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Row style={{ gap: 14 }}>
          <Avatar size={54} text={initials(me.name)} />
          <View>
            <Txt style={{ fontSize: 13, color: C.mutedLight }}>{SHOP_NAME}</Txt>
            <Disp size={26} color="#fff">
              Hola, {me.name.split(' ')[0]}
            </Disp>
          </View>
        </Row>
      </View>
      <View style={{ height: 5, backgroundColor: C.orange }} />
      <Body bottom={tabBottom}>
        <View style={{ backgroundColor: C.ink, borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Eyebrow style={{ color: C.mutedLight }}>Llevas ganado esta semana</Eyebrow>
            <Txt style={{ fontSize: 12, color: C.mutedLight }}>
              {mine.length} coches · {me.pay.type === 'fijo' ? `${money(me.pay.amount)} c/u` : `${me.pay.pct}% de mano de obra`}
            </Txt>
          </View>
          <Disp size={30} color={C.orange}>
            {money(earned)}
          </Disp>
        </View>

        <Eyebrow style={{ paddingTop: 4 }}>Mis coches asignados ({active.length})</Eyebrow>
        {active.map((c) => (
          <Card key={c.id} style={{ gap: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt b style={{ fontSize: 13, color: C.orangeText }}>
                FOLIO {c.folio}
              </Txt>
              <StatePill state={c.state} />
            </Row>
            <Txt b style={{ fontSize: 17 }}>
              {c.brand} {c.model} {c.year} · {c.color}
            </Txt>
            <Txt style={{ fontSize: 14, color: '#3F3B36', lineHeight: 20 }}>{c.description}</Txt>
            {c.state < 4 ? (
              <Btn label="Actualizar avance" onPress={() => router.push({ pathname: '/actualizar/[id]', params: { id: c.id } })} />
            ) : (
              <Txt style={{ fontSize: 13, color: C.muted }}>Ya está listo: lo entrega el dueño.</Txt>
            )}
          </Card>
        ))}
        {active.length === 0 ? <Empty text="No tienes coches asignados por ahora." /> : null}
      </Body>
    </Screen>
  );
}
