import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Disp, Screen, Txt } from '@/components/ui';
import { useStore } from '@/store/app';
import { C } from '@/theme';

export default function Escanear() {
  const { linkCarByToken, cars } = useStore();
  const insets = useSafeAreaInsets();
  const [perm, ask] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = (token: string) => {
    const car = linkCarByToken(token);
    if (!car) {
      setError('Ese QR no es de un servicio activo. Pídele al taller que te muestre el de tu coche.');
      setScanned(false);
      return;
    }
    router.replace('/cliente');
  };

  const onScan = ({ data }: { data: string }) => {
    setScanned(true);
    setError(null);
    open(data.match(/q\/([\w-]+)/)?.[1] ?? data);
  };

  // Atajo del prototipo mientras no hay un QR real a la mano.
  const demo = cars.find((c) => !c.linked && c.state < 5);

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: C.ink, paddingTop: insets.top + 16, paddingBottom: insets.bottom, paddingHorizontal: 24, gap: 14 }}>
        <View>
          <Disp size={30} color="#fff">
            Escanea tu QR
          </Disp>
          <Txt style={{ color: '#C9C9C9', marginTop: 8, lineHeight: 21 }}>
            Te lo da el taller al dejar tu coche. Con él ves en qué va tu coche sin llamar.
          </Txt>
        </View>

        <View style={{ flex: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: C.graphite, alignItems: 'center', justifyContent: 'center' }}>
          {perm?.granted ? (
            <>
              <CameraView
                style={{ position: 'absolute', inset: 0 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : onScan}
              />
              <Frame />
              <Txt style={{ position: 'absolute', bottom: 14, color: '#fff', fontSize: 13 }}>Apunta la cámara al código</Txt>
            </>
          ) : (
            <View style={{ padding: 24, gap: 12, alignItems: 'center' }}>
              <Txt style={{ color: '#C9C9C9', textAlign: 'center', lineHeight: 21 }}>
                Necesitamos la cámara solo para leer el QR de tu coche.
              </Txt>
              <Btn label="Permitir cámara" onPress={ask} />
            </View>
          )}
        </View>

        {error ? <Txt style={{ color: '#FCA5A5', fontSize: 13, textAlign: 'center' }}>{error}</Txt> : null}
        <View style={{ gap: 8, paddingBottom: 16 }}>
          {demo ? <Btn label="Prototipo: usar un QR de ejemplo" kind="outline" onPress={() => open(demo.token)} /> : null}
          <Txt style={{ fontSize: 13, color: C.mutedLight, textAlign: 'center', lineHeight: 19 }}>
            ¿Escaneaste con la cámara del teléfono? El QR abre la app y liga tu coche solo.
          </Txt>
        </View>
      </View>
    </Screen>
  );
}

function Frame() {
  const arm = { position: 'absolute', width: 44, height: 44, borderColor: C.orange } as const;
  return (
    <View style={{ width: 230, height: 230 }} pointerEvents="none">
      <View style={[arm, { left: 0, top: 0, borderLeftWidth: 5, borderTopWidth: 5, borderTopLeftRadius: 14 }]} />
      <View style={[arm, { right: 0, top: 0, borderRightWidth: 5, borderTopWidth: 5, borderTopRightRadius: 14 }]} />
      <View style={[arm, { left: 0, bottom: 0, borderLeftWidth: 5, borderBottomWidth: 5, borderBottomLeftRadius: 14 }]} />
      <View style={[arm, { right: 0, bottom: 0, borderRightWidth: 5, borderBottomWidth: 5, borderBottomRightRadius: 14 }]} />
    </View>
  );
}
