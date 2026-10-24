import { useTabBottom } from '@/components/role-tabs';
import { AppHeader, Body, Card, Disp, Empty, Eyebrow, Row, Screen, Tag, Txt } from '@/components/ui';
import { money } from '@/lib/money';
import { useStore } from '@/store/app';
import { C } from '@/theme';
import { STATES_SHORT } from '@/types';

/** El ayudante ve solo lo suyo: nunca costos ni ganancia del taller. Los montos los manda el servidor. */
export default function MisPagos() {
  const tabBottom = useTabBottom();
  const { summary } = useStore();
  if (!summary) return <Screen>{null}</Screen>;
  const estimated = summary.inProgress.reduce((s, x) => s + x.estimated, 0);

  return (
    <Screen>
      <AppHeader title="Mis pagos" subtitle="Semana en curso" />
      <Body bottom={tabBottom}>
        <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Eyebrow>Ganado esta semana</Eyebrow>
          <Disp size={48}>{money(summary.earnedThisWeek)}</Disp>
          <Tag
            label={summary.pendingTotal ? `Pendiente de pago: ${money(summary.pendingTotal)}` : 'Todo pagado'}
            bg={summary.pendingTotal ? C.amberBg : C.greenBg}
            fg={summary.pendingTotal ? C.amber : C.green}
          />
        </Card>
        <Card>
          <Eyebrow>En curso (estimado)</Eyebrow>
          {summary.inProgress.length ? (
            summary.inProgress.map((x) => (
              <Row key={x.carId} style={{ justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EFECE8', paddingTop: 8 }}>
                <Txt b style={{ flex: 1 }}>
                  Folio {x.folio}
                  {'\n'}
                  <Txt style={{ fontSize: 12, color: C.muted }}>{STATES_SHORT[x.state]}</Txt>
                </Txt>
                <Txt b>{money(x.estimated)}</Txt>
              </Row>
            ))
          ) : (
            <Empty text="No tienes coches en curso." />
          )}
          {estimated ? <Txt style={{ fontSize: 12, color: C.muted }}>Se confirma al entregar cada coche.</Txt> : null}
        </Card>
        <Card>
          <Eyebrow>Coches entregados</Eyebrow>
          {summary.payments.length ? (
            summary.payments.map((p) => (
              <Row key={p.id} style={{ justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EFECE8', paddingTop: 8 }}>
                <Txt b style={{ flex: 1 }}>
                  Folio {p.folio}
                  {'\n'}
                  <Txt style={{ fontSize: 12, color: p.paidAt ? C.green : C.amber }}>{p.paidAt ? 'Pagado' : 'Pendiente'}</Txt>
                </Txt>
                <Txt b>{money(p.amount)}</Txt>
              </Row>
            ))
          ) : (
            <Empty text="Todavía no hay coches entregados." />
          )}
        </Card>
      </Body>
    </Screen>
  );
}
