import { useTabBottom } from '@/components/role-tabs';
import { AppHeader, Body, Card, Disp, Eyebrow, Row, Screen, Tag, Txt } from '@/components/ui';
import { DEMO_HELPER_ID } from '@/data/seed';
import { helperPay, money } from '@/lib/money';
import { useStore } from '@/store/app';
import { C } from '@/theme';

/** El ayudante ve solo lo suyo: nunca costos ni ganancia del taller. */
export default function MisPagos() {
  const tabBottom = useTabBottom();
  const { cars, helperById } = useStore();
  const me = helperById(DEMO_HELPER_ID);
  if (!me) return <Screen>{null}</Screen>;
  const mine = cars.filter((c) => c.helperId === me.id);
  const total = mine.reduce((s, c) => s + helperPay(c.costs, me), 0);

  return (
    <Screen>
      <AppHeader title="Mis pagos" subtitle="Semana en curso" />
      <Body bottom={tabBottom}>
        <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Eyebrow>Total de la semana</Eyebrow>
          <Disp size={48}>{money(total)}</Disp>
          <Tag label={me.paid ? 'Pagado' : 'Pendiente de pago'} bg={me.paid ? C.greenBg : C.amberBg} fg={me.paid ? C.green : C.amber} />
        </Card>
        <Card>
          <Eyebrow>Por coche</Eyebrow>
          {mine.map((c) => (
            <Row key={c.id} style={{ justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EFECE8', paddingTop: 8 }}>
              <Txt b style={{ flex: 1 }}>
                {c.brand} {c.model}
                {'\n'}
                <Txt style={{ fontSize: 12, color: C.muted }}>Folio {c.folio}</Txt>
              </Txt>
              <Txt b>{money(helperPay(c.costs, me))}</Txt>
            </Row>
          ))}
        </Card>
      </Body>
    </Screen>
  );
}
