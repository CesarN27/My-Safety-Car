import { View } from 'react-native';

import { useTabBottom } from '@/components/role-tabs';
import { AppHeader, Body, Card, Disp, Eyebrow, PhaseBadge, Row, Screen, Txt } from '@/components/ui';
import { useStore } from '@/store/app';
import { C } from '@/theme';

export default function AdminPanel() {
  const tabBottom = useTabBottom();
  const { shops, cars } = useStore();
  const active = cars.filter((c) => c.state < 5).length;
  return (
    <Screen>
      <AppHeader eyebrow="Admin master" title="Panel" subtitle="Solo conteos: no se ven los números de cada taller" />
      <Body bottom={tabBottom}>
        <Row style={{ gap: 8, alignItems: 'stretch' }}>
          <Big n={shops.filter((s) => s.status === 'activo').length} label="Talleres activos" />
          <Big n={shops.filter((s) => s.status === 'invitado').length} label="Invitados sin activar" />
        </Row>
        <Row style={{ gap: 8, alignItems: 'stretch' }}>
          <Big n={cars.length} label="Coches ingresados" />
          <Big n={active} label="En el taller ahora" />
        </Row>
        <Card>
          <Row>
            <Eyebrow>Soporte</Eyebrow>
            <PhaseBadge phase={4} />
          </Row>
          <Txt style={{ color: C.muted, lineHeight: 21 }}>
            Aquí llegarán los reportes y quejas de clientes sobre un taller, para que ustedes los atiendan.
          </Txt>
        </Card>
      </Body>
    </Screen>
  );
}

function Big({ n, label }: { n: number; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.ink, borderRadius: 14, padding: 14 }}>
      <Disp size={40} color={C.orange}>
        {String(n)}
      </Disp>
      <Txt style={{ color: '#C9C9C9', fontSize: 13 }}>{label}</Txt>
    </View>
  );
}
