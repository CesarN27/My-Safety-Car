import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PhotoSlot } from '@/components/photo-slot';
import { AppHeader, Body, Btn, Chip, Field, FooterBar, Screen, SectionTag, Txt } from '@/components/ui';
import { useStore } from '@/store/app';
import { C } from '@/theme';

/** Un código de falla OBDII: letra (P, B, C o U) y cuatro dígitos hexadecimales, como P0302. */
const DTC = /^[PBCU][0-9A-F]{4}$/;

/** Registra un escaneo de diagnóstico (OBDII) en el expediente de un coche. */
export default function Escaneo() {
  const { carId } = useLocalSearchParams<{ carId?: string }>();
  const { cars, addScan } = useStore();
  const inShop = cars.filter((c) => c.state < 5);
  const [pick, setPick] = useState<string | undefined>(carId);
  const [codesText, setCodesText] = useState('');
  const [clean, setClean] = useState(false);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string>();

  const codes = clean ? [] : codesText.split(/[\s,;]+/).map((c) => c.toUpperCase()).filter(Boolean);
  const bad = codes.filter((c) => !DTC.test(c));
  const ready = !!pick && (clean || (codes.length > 0 && bad.length === 0));

  const save = () => {
    if (!pick) return;
    addScan(pick, { codes, note: note.trim(), photo });
    router.back();
  };

  return (
    <Screen>
      <AppHeader title="Registrar escaneo" subtitle="Diagnóstico OBDII del coche" onBack />
      <Body>
        <SectionTag>Coche escaneado</SectionTag>
        {inShop.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {inShop.map((c) => (
              <Chip key={c.id} label={`${c.folio} · ${c.brand} ${c.model}`} on={pick === c.id} onPress={() => setPick(c.id)} />
            ))}
          </View>
        ) : (
          <Txt style={{ color: C.muted }}>No hay coches en el taller. Crea un expediente primero.</Txt>
        )}

        <SectionTag>Resultado</SectionTag>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Con códigos de falla" on={!clean} onPress={() => setClean(false)} grow />
          <Chip label="Sin fallas" on={clean} onPress={() => setClean(true)} grow />
        </View>
        {!clean ? (
          <>
            <Field
              label="Códigos (separados por coma o espacio)"
              value={codesText}
              onChangeText={setCodesText}
              placeholder="P0302, P0171"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {bad.length ? (
              <Txt style={{ fontSize: 12, color: C.red }}>
                {bad.join(', ')} no parece un código válido. Llevan una letra (P, B, C o U) y cuatro dígitos, por ejemplo P0302.
              </Txt>
            ) : null}
          </>
        ) : null}
        <Field label="Notas (opcional)" value={note} onChangeText={setNote} multiline placeholder="Qué se encontró, datos en vivo, siguiente paso…" />

        <SectionTag>Foto de la pantalla del escáner (opcional)</SectionTag>
        <View style={{ width: '100%' }}>
          <PhotoSlot label="Pantalla del escáner" uri={photo} onChange={setPhoto} />
        </View>
      </Body>
      <FooterBar>
        <View style={{ flex: 1 }}>
          <Btn label="Guardar escaneo" onPress={save} disabled={!ready} />
        </View>
      </FooterBar>
    </Screen>
  );
}
