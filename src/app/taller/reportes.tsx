import { View } from 'react-native';

import { AppHeader, Body, Card, Disp, Eyebrow, PhaseBadge, Row, Screen, Txt } from '@/components/ui';
import { carTotals, money } from '@/lib/money';
import { useStore } from '@/store/app';
import { C } from '@/theme';

/** Resumen sencillo con lo capturado. Reportes por semana o mes y exportar llegan en la fase 4. */
export default function Reportes() {
  const { cars, helpers } = useStore();
  const withMoney = cars.filter((c) => c.state >= 2).map((c) => carTotals(c, helpers));
  const sum = (k: 'subtotal' | 'parts' | 'helperCost' | 'expenses' | 'profit') =>
    withMoney.reduce((s, t) => s + t[k], 0);

  return (
    <Screen>
      <AppHeader title="Reportes" subtitle="Coches con costos capturados" />
      <Body>
        <View style={{ backgroundColor: C.ink, borderRadius: 14, padding: 16 }}>
          <Eyebrow style={{ color: C.mutedLight }}>Ganancia libre</Eyebrow>
          <Disp size={48} color={C.orange}>
            {money(sum('profit'))}
          </Disp>
          <Txt style={{ color: C.mutedLight, fontSize: 13 }}>Ingresos − refacciones − ayudantes − gastos</Txt>
        </View>
        <Card>
          <Line k="Ingresos (sin IVA)" v={money(sum('subtotal'))} />
          <Line k="Refacciones" v={money(sum('parts'))} />
          <Line k="Pagos a ayudantes" v={money(sum('helperCost'))} />
          <Line k="Otros gastos" v={money(sum('expenses'))} />
        </Card>
        <Card>
          <Row>
            <Eyebrow>Por semana o mes</Eyebrow>
            <PhaseBadge phase={4} />
          </Row>
          <Txt style={{ color: C.muted, lineHeight: 21 }}>Filtros por periodo, comparativos y exportar a PDF.</Txt>
        </Card>
      </Body>
    </Screen>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Txt style={{ color: C.muted }}>{k}</Txt>
      <Txt b>{v}</Txt>
    </Row>
  );
}
