import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBottom } from '@/components/role-tabs';
import { Timeline } from '@/components/timeline';
import { Btn, Card, Chip, Disp, Eyebrow, ProgressBar, Row, Screen, Txt } from '@/components/ui';
import { digits } from '@/lib/format';
import { useStore } from '@/store/app';
import { C } from '@/theme';
import { STATES } from '@/types';

export default function MiCoche() {
  const tabBottom = useTabBottom();
  const { cars, reload, pendingToken, setPendingToken, linkCarByToken } = useStore();
  const insets = useSafeAreaInsets();
  // Primero los que siguen en el taller; los entregados quedan como historial.
  const mine = [...cars].sort((a, b) => Number(a.state === 5) - Number(b.state === 5));
  const [pick, setPick] = useState(mine[0]?.id);
  const [linkError, setLinkError] = useState<string | null>(null);
  const car = mine.find((c) => c.id === pick) ?? mine[0];
  const shop = car?.shop;

  useFocusEffect(
    useCallback(() => {
      reload().catch(() => undefined);
    }, [reload]),
  );
  // Si abrió el link del QR antes de entrar, el coche se liga en cuanto inicia sesión.
  useEffect(() => {
    if (!pendingToken) return;
    setPendingToken(null);
    linkCarByToken(pendingToken).then(setLinkError);
  }, [pendingToken, setPendingToken, linkCarByToken]);

  if (!car || !shop) {
    return (
      <Screen>
        <View style={{ flex: 1, backgroundColor: C.ink, paddingTop: insets.top + 40, paddingHorizontal: 24, gap: 14 }}>
          <Disp size={34} color="#fff">
            Aún no tienes un coche en la app
          </Disp>
          <Txt style={{ color: '#C9C9C9', lineHeight: 22 }}>
            Cuando dejes tu coche en un taller, te dan un QR. Escanéalo para ver aquí en qué va, sin llamar.
          </Txt>
          {linkError ? <Txt style={{ color: '#FCA5A5', fontSize: 13 }}>{linkError}</Txt> : null}
          <Btn label="Escanear mi QR" icon="qr-code-outline" onPress={() => router.navigate('/cliente/escanear')} />
        </View>
      </Screen>
    );
  }

  const ready = car.state >= 4;
  const phone = digits(shop.phone);

  return (
    <Screen>
      <View style={{ backgroundColor: C.ink, paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: 18, gap: 4 }}>
        <Txt style={{ fontSize: 13, color: C.mutedLight }}>
          En {shop.name} · Folio {car.folio}
        </Txt>
        <Disp size={30} color="#fff">
          {car.brand} {car.model} {car.year}
        </Disp>
        <Txt style={{ fontSize: 13, color: '#C9C9C9', marginTop: 10 }}>Estado actual</Txt>
        <Disp size={34} color={C.orange}>
          {STATES[car.state]}
        </Disp>
        <View style={{ marginTop: 10 }}>
          <ProgressBar state={car.state} dark />
        </View>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt style={{ fontSize: 11, color: C.mutedLight }}>Recibido</Txt>
          <Txt style={{ fontSize: 11, color: C.mutedLight }}>Listo</Txt>
        </Row>
      </View>
      <View style={{ height: 5, backgroundColor: C.orange }} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: tabBottom, gap: 12 }}>
        {mine.length > 1 ? (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {mine.map((c) => (
              <Chip key={c.id} label={`${c.brand} ${c.model}${c.state === 5 ? ' · entregado' : ''}`} on={c.id === car.id} onPress={() => setPick(c.id)} />
            ))}
          </View>
        ) : null}

        {ready ? (
          <Pressable
            onPress={() => router.push({ pathname: '/listo/[id]', params: { id: car.id } })}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.orange, padding: 14, borderRadius: 14 }}
          >
            <Ionicons name="checkmark-circle" size={28} color={C.text} />
            <View style={{ flex: 1 }}>
              <Txt b style={{ fontSize: 16 }}>
                {car.state === 4 ? 'Tu coche está listo' : 'Entregado'}
              </Txt>
              <Txt style={{ fontSize: 13 }}>Ver el total a pagar</Txt>
            </View>
            <Ionicons name="chevron-forward" size={22} color={C.text} />
          </Pressable>
        ) : null}

        <Card>
          <Eyebrow>Qué ha pasado</Eyebrow>
          <Timeline log={car.log} forClient />
        </Card>

        <Card>
          <Eyebrow>Tu taller</Eyebrow>
          <Txt b>{shop.name}</Txt>
          <Row style={{ gap: 8 }}>
            <Contact icon="call-outline" label="Llamar" onPress={() => Linking.openURL(`tel:${phone}`)} />
            <Contact icon="logo-whatsapp" label="WhatsApp" onPress={() => Linking.openURL(`https://wa.me/52${phone.slice(-10)}`)} />
          </Row>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Contact({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, borderWidth: 1.5, borderColor: C.ink }}
    >
      <Ionicons name={icon} size={18} color={C.text} />
      <Txt b style={{ fontSize: 14 }}>
        {label}
      </Txt>
    </Pressable>
  );
}
