import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import { HtmlView } from '@/components/html-view';
import { AppHeader, Btn, FooterBar, Screen, Txt } from '@/components/ui';
import { fetchAsDataUri } from '@/lib/api';
import { buildHojaHtml, sheetPhotos } from '@/lib/hoja-html';
import { printSheet, sharePdf } from '@/lib/print-sheet';
import { useStore } from '@/store/app';
import { C } from '@/theme';

/** Separador de la llave de fotos: un salto de línea nunca aparece dentro de una URI. */
const SEP = '\n';

/** Hoja de recepción e inspección con cláusula y firma: vista previa, imprimir y compartir en PDF. */
export default function Hoja() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { carById, shops } = useStore();
  const car = carById(id);
  const shop = shops[0];
  const [loaded, setLoaded] = useState<{ from: string; photos: (string | null)[] } | null>(null);
  const [busy, setBusy] = useState(false);

  // Llave estable de las fotos: la lista se reconstruye en cada render, la llave solo cambia si cambian las fotos.
  const key = car ? sheetPhotos(car).map((x) => x.uri).join(SEP) : '';
  const photos = loaded && loaded.from === key ? loaded.photos : null;
  useEffect(() => {
    let alive = true;
    Promise.all((key ? key.split(SEP) : []).map(fetchAsDataUri)).then((p) => alive && setLoaded({ from: key, photos: p }));
    return () => {
      alive = false;
    };
  }, [key]);

  const html = useMemo(() => (car && photos ? buildHojaHtml(car, shop, photos) : null), [car, shop, photos]);

  if (!car) return <Screen><AppHeader title="Hoja de recepción" onBack /></Screen>;

  const run = (fn: (h: string) => Promise<void>) => async () => {
    if (!html || busy) return;
    setBusy(true);
    try {
      await fn(html);
    } catch (e) {
      Alert.alert('No se pudo imprimir', e instanceof Error ? e.message : 'Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Hoja de recepción" eyebrow={`Folio ${car.folio}`} subtitle={`${car.brand} ${car.model} · ${car.plates}`} onBack />
      <View style={{ flex: 1, backgroundColor: '#E7E5E4' }}>
        {html ? (
          <HtmlView html={html} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <ActivityIndicator color={C.orange} />
            <Txt style={{ color: C.muted }}>Preparando la hoja…</Txt>
          </View>
        )}
      </View>
      <FooterBar>
        <View style={{ flex: 1 }}>
          <Btn label="Compartir PDF" kind="outline" icon="share-outline" onPress={run(sharePdf)} disabled={!html || busy} />
        </View>
        <View style={{ flex: 1 }}>
          <Btn label="Imprimir" icon="print-outline" onPress={run(printSheet)} disabled={!html || busy} />
        </View>
      </FooterBar>
    </Screen>
  );
}
