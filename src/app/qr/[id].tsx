import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Disp, Screen, Txt, type IconName } from '@/components/ui';
import { SHOP_NAME } from '@/data/seed';
import { digits } from '@/lib/format';
import { useStore } from '@/store/app';
import { C } from '@/theme';

export default function QrServicio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { carById } = useStore();
  const insets = useSafeAreaInsets();
  const car = carById(id);
  if (!car) return <Screen>{null}</Screen>;

  // Por ahora el QR abre la app por su esquema. Con el servidor será un link web
  // que muestra el estado aunque el cliente no tenga la app.
  const link = Linking.createURL(`q/${car.token}`, { scheme: 'tallerapp' });
  const msg = `Hola ${car.client.name.split(' ')[0]}, sigue tu ${car.brand} ${car.model} en ${SHOP_NAME} aquí: ${link}`;

  const whatsapp = () => {
    const phone = digits(car.client.phone);
    Linking.openURL(`https://wa.me/${phone.length === 10 ? '52' + phone : phone}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: C.ink, paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16), paddingHorizontal: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} accessibilityRole="button" accessibilityLabel="Regresar" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -12 }}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
          <Disp size={26} color="#fff">
            QR del servicio
          </Disp>
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' }}>
          <View style={{ backgroundColor: C.orange, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Disp size={18}>{SHOP_NAME}</Disp>
            <Txt b style={{ fontSize: 14 }}>FOLIO {car.folio}</Txt>
          </View>
          <View style={{ alignItems: 'center', padding: 20, gap: 12 }}>
            <View style={{ padding: 10, borderWidth: 2, borderColor: C.ink, borderRadius: 10 }}>
              <QRCode value={link} size={200} />
            </View>
            <View style={{ alignItems: 'center' }}>
              <Txt b style={{ fontSize: 17 }}>
                {car.brand} {car.model} {car.year} · {car.plates}
              </Txt>
              <Txt style={{ fontSize: 14, color: C.muted, textAlign: 'center' }}>Escanéalo con la cámara para seguir tu coche</Txt>
            </View>
          </View>
          <View style={{ borderTopWidth: 2, borderStyle: 'dashed', borderTopColor: C.border, padding: 10 }}>
            <Txt style={{ fontSize: 12, color: C.muted, textAlign: 'center' }}>Válido solo para este servicio. Caduca al entregar el coche.</Txt>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Action icon="logo-whatsapp" label="WhatsApp" onPress={whatsapp} />
          <Action icon="share-outline" label="Compartir" onPress={() => Share.share({ message: msg })} />
        </View>
        <Txt style={{ color: '#C9C9C9', fontSize: 13, textAlign: 'center' }}>
          Se manda a {car.client.name} · {car.client.phone}
        </Txt>
        <View style={{ flex: 1 }} />
        <Btn label="Ir al expediente" onPress={() => router.replace({ pathname: '/expediente/[id]', params: { id: car.id } })} />
      </View>
    </Screen>
  );
}

function Action({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 76,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: pressed ? C.orange : C.line,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      })}
    >
      <Ionicons name={icon} size={24} color={C.text} />
      <Txt b style={{ fontSize: 13 }}>
        {label}
      </Txt>
    </Pressable>
  );
}
