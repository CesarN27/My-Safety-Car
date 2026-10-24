import { useLocalSearchParams } from 'expo-router';
import { Alert, View } from 'react-native';

import { OsmMap } from '@/components/osm-map';
import { fixed } from '@/lib/geo';
import { AppHeader, Body, Btn, Card, Disp, Eyebrow, Row, Screen, Tag, Txt } from '@/components/ui';
import { useStore } from '@/store/app';
import { C } from '@/theme';
import type { ShopStatus } from '@/types';

const LABEL = { activo: 'Activo', pausado: 'Pausado', invitado: 'Invitado' } as const;

export default function AdminTaller() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { shops, setShopStatus } = useStore();
  const shop = shops.find((s) => s.id === id);
  if (!shop) return <Screen><AppHeader title="Taller" onBack /></Screen>;

  const set = (s: ShopStatus) => () =>
    setShopStatus(shop.id, s).catch((e: unknown) => Alert.alert('No se pudo cambiar', e instanceof Error ? e.message : ''));

  return (
    <Screen>
      <AppHeader title={shop.name} subtitle={`${shop.zone} · dueño: ${shop.owner}`} onBack />
      <Body>
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Eyebrow>Estado en el mapa</Eyebrow>
            <Tag label={LABEL[shop.status]} bg={shop.status === 'activo' ? C.orangeSoft : '#E5E7EB'} fg={C.text} />
          </Row>
          <Txt style={{ color: C.muted, lineHeight: 21 }}>
            {shop.status === 'activo'
              ? 'Los clientes cercanos ven este taller en el mapa.'
              : 'Este taller no aparece en el mapa de los clientes.'}
          </Txt>
          {shop.status !== 'activo' ? <Btn label="Activar taller" icon="checkmark-circle" onPress={set('activo')} /> : null}
          {shop.status === 'activo' ? <Btn label="Pausar (quitar del mapa)" kind="outline" icon="pause" onPress={set('pausado')} /> : null}
        </Card>
        <Card>
          <Eyebrow>Datos</Eyebrow>
          <Line k="Teléfono" v={shop.phone} />
          <Line k="Dirección" v={shop.address} />
          <Line k="Coordenadas" v={`${fixed(shop.lat)}, ${fixed(shop.lng)}`} />
          <Line k="Horario" v={shop.hours} />
          <Line k="Especialidades" v={shop.specialties.join(', ') || 'Sin definir'} />
          <Line k="Verificado" v={shop.verified ? 'Sí, lo visitamos' : 'Todavía no'} />
        </Card>
        <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: C.border }}>
          <OsmMap shops={[shop]} selectedId={shop.id} height={220} />
        </View>
        <View style={{ height: 4 }} />
        <Disp size={14} color={C.muted}>
          La ganancia y los costos del taller no se muestran aquí
        </Disp>
      </Body>
    </Screen>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Txt style={{ width: 110, color: C.muted, fontSize: 14 }}>{k}</Txt>
      <Txt semi style={{ flex: 1, fontSize: 14 }}>
        {v}
      </Txt>
    </View>
  );
}
