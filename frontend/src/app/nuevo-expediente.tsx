import { router } from 'expo-router';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { PhotoSlot } from '@/components/photo-slot';
import { SignaturePad } from '@/components/signature-pad';
import { AppHeader, Body, Btn, Card, Chip, Field, FooterBar, Screen, SectionTag, Txt } from '@/components/ui';
import { CLAUSULA } from '@/data/clausula';
import { SHOP_NAME } from '@/data/seed';
import { useStore } from '@/store/app';
import { C, F } from '@/theme';
import { ENTRY_PHOTO_LABELS, INSPECTION_POINTS } from '@/types';
import type { Damage, InspState, Signature } from '@/types';

const STEPS = ['Vehículo y cliente', 'Inspección', 'Fotos y daños', 'Servicio y firma'];
const INSP_LABEL = ['Bien', 'Dañado', 'N/A'] as const;
const INSP_COLOR = [
  { bg: C.greenBg, fg: C.green },
  { bg: C.redBg, fg: C.red },
  { bg: '#E5E7EB', fg: '#374151' },
] as const;

export default function NuevoExpediente() {
  const { addCar, helpers } = useStore();
  const [step, setStep] = useState(0);

  const [v, setV] = useState({ brand: '', model: '', year: '', color: '', plates: '', km: '', vin: '' });
  const [cl, setCl] = useState({ name: '', phone: '', address: '' });
  const [insp, setInsp] = useState<Record<string, InspState>>(() => Object.fromEntries(INSPECTION_POINTS.map((p) => [p, 0 as InspState])));
  const [fuel, setFuel] = useState(3);
  const [dash, setDash] = useState<string>();
  const [photos, setPhotos] = useState<(string | undefined)[]>([undefined, undefined, undefined, undefined]);
  const [damages, setDamages] = useState<Damage[]>([]);
  const [desc, setDesc] = useState('');
  const [helperId, setHelperId] = useState<string>();
  const [signature, setSignature] = useState<Signature | null>(null);

  const setVF = (k: keyof typeof v) => (t: string) => setV((x) => ({ ...x, [k]: t }));
  const setCF = (k: keyof typeof cl) => (t: string) => setCl((x) => ({ ...x, [k]: t }));

  const ok = [
    !!(v.brand.trim() && v.model.trim() && v.plates.trim() && cl.name.trim() && cl.phone.trim() && dash),
    true,
    photos.every(Boolean),
    !!(desc.trim() && signature),
  ][step];

  const create = () => {
    const id = addCar({
      brand: v.brand.trim(),
      model: v.model.trim(),
      year: v.year.trim(),
      color: v.color.trim(),
      plates: v.plates.trim().toUpperCase(),
      km: v.km.trim(),
      dashboardPhoto: dash,
      vin: v.vin.trim().toUpperCase(),
      client: { name: cl.name.trim(), phone: cl.phone.trim(), address: cl.address.trim() },
      description: desc.trim(),
      inspection: insp,
      fuel,
      damages,
      photos: photos.filter((p): p is string => !!p),
      signed: true,
      signature: signature ?? undefined,
      helperId,
    });
    router.replace({ pathname: '/qr/[id]', params: { id } });
  };

  return (
    <Screen>
      <AppHeader title="Nuevo expediente" subtitle={`${SHOP_NAME} · paso ${step + 1} de 4 · ${STEPS[step]}`} onBack={() => router.back()}>
        <View style={{ flexDirection: 'row', gap: 6, paddingTop: 12 }}>
          {STEPS.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= step ? C.orange : '#3A3A3A' }} />
          ))}
        </View>
      </AppHeader>

      <Body>
        {step === 0 ? (
          <>
            <SectionTag>Datos del vehículo</SectionTag>
            <Row2>
              <Field label="Marca" value={v.brand} onChangeText={setVF('brand')} placeholder="Honda" />
              <Field label="Modelo" value={v.model} onChangeText={setVF('model')} placeholder="CR-V" />
              <Field label="Año" value={v.year} onChangeText={setVF('year')} keyboardType="number-pad" maxLength={4} />
              <Field label="Color" value={v.color} onChangeText={setVF('color')} />
              <Field label="Placas" value={v.plates} onChangeText={setVF('plates')} autoCapitalize="characters" />
              <Field label="Odómetro (km)" value={v.km} onChangeText={setVF('km')} keyboardType="number-pad" />
            </Row2>
            <Field label="N. de serie (VIN)" value={v.vin} onChangeText={setVF('vin')} autoCapitalize="characters" />
            <SectionTag>Foto del tablero</SectionTag>
            <Txt style={{ fontSize: 13, color: C.muted }}>
              Toma una foto de todo el tablero con el coche encendido: se ve el odómetro, la gasolina y los testigos. Es obligatoria.
            </Txt>
            <View style={{ width: '100%' }}>
              <PhotoSlot label="Tablero completo (odómetro)" uri={dash} onChange={setDash} />
            </View>
            <SectionTag>Datos del cliente</SectionTag>
            <Field label="Nombre" value={cl.name} onChangeText={setCF('name')} />
            <Field label="Teléfono (le llega el QR por WhatsApp)" value={cl.phone} onChangeText={setCF('phone')} keyboardType="phone-pad" />
            <Field label="Domicilio" value={cl.address} onChangeText={setCF('address')} />
            <Txt style={{ fontSize: 12, color: C.muted }}>El INE no se pide en la app: si lo necesitas, guárdalo en tu copia en papel.</Txt>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <SectionTag>Observaciones del auto</SectionTag>
            <Txt style={{ fontSize: 13, color: C.muted }}>Toca cada punto para cambiar: Bien → Dañado → No aplica.</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {INSPECTION_POINTS.map((p) => {
                const s = insp[p];
                return (
                  <Pressable
                    key={p}
                    onPress={() => setInsp((x) => ({ ...x, [p]: ((x[p] + 1) % 3) as InspState }))}
                    accessibilityRole="button"
                    accessibilityLabel={`${p}: ${INSP_LABEL[s]}`}
                    style={{
                      width: '48%',
                      flexGrow: 1,
                      minHeight: 44,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                      paddingHorizontal: 10,
                      borderRadius: 10,
                      backgroundColor: '#fff',
                      borderWidth: 1.5,
                      borderColor: C.line,
                    }}
                  >
                    <Txt semi style={{ fontSize: 14 }}>
                      {p}
                    </Txt>
                    <View style={{ backgroundColor: INSP_COLOR[s].bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 }}>
                      <Txt b style={{ fontSize: 11, color: INSP_COLOR[s].fg }}>
                        {INSP_LABEL[s]}
                      </Txt>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <SectionTag>Gasolina</SectionTag>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', padding: 12, borderRadius: 12 }}>
              <Txt b>E</Txt>
              <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
                {Array.from({ length: 8 }, (_, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setFuel(i)}
                    accessibilityRole="button"
                    accessibilityLabel={`Gasolina ${i + 1} de 8`}
                    style={{ flex: 1, height: 28, justifyContent: 'center' }}
                  >
                    <View style={{ height: 14, borderRadius: 4, backgroundColor: i <= fuel ? C.ink : C.line }} />
                  </Pressable>
                ))}
              </View>
              <Txt b>F</Txt>
            </View>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <SectionTag>Fotos de entrada</SectionTag>
            <Txt style={{ fontSize: 13, color: C.muted }}>
              Cuatro fotos obligatorias. Protegen al taller si hay reclamos por golpes o rayones.
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {ENTRY_PHOTO_LABELS.map((l, i) => (
                <View key={l} style={{ width: '48%', flexGrow: 1 }}>
                  <PhotoSlot label={l} uri={photos[i]} onChange={(u) => setPhotos((p) => p.map((x, j) => (j === i ? u : x)))} />
                </View>
              ))}
            </View>
            <SectionTag>Marcar golpes</SectionTag>
            <DamageMap damages={damages} onChange={setDamages} />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <SectionTag>Descripción del servicio</SectionTag>
            <Field label="¿Qué hay que hacerle?" value={desc} onChangeText={setDesc} multiline />
            <SectionTag>Asignar a ayudante (opcional)</SectionTag>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip label="Sin asignar" on={!helperId} onPress={() => setHelperId(undefined)} />
              {helpers.map((h) => (
                <Chip key={h.id} label={h.name} on={helperId === h.id} onPress={() => setHelperId(h.id)} />
              ))}
            </View>
            <SectionTag>Cláusulas y firma</SectionTag>
            <Card>
              <Txt style={{ fontSize: 12, color: '#3F3B36', lineHeight: 18 }}>{CLAUSULA}</Txt>
            </Card>
            <SignaturePad onChange={setSignature} />
          </>
        ) : null}
      </Body>

      <FooterBar>
        {step > 0 ? <Btn label="Atrás" kind="outline" onPress={() => setStep(step - 1)} /> : null}
        <View style={{ flex: 1 }}>
          {step < 3 ? (
            <Btn label="Siguiente" onPress={() => setStep(step + 1)} disabled={!ok} />
          ) : (
            <Btn label="Crear expediente y QR" onPress={create} disabled={!ok} />
          )}
        </View>
      </FooterBar>
    </Screen>
  );
}

function Row2({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, rowGap: 12 }}>{Array.isArray(children) ? children.map((c, i) => <View key={i} style={{ width: '47.5%', flexGrow: 1 }}>{c}</View>) : children}</View>;
}

function DamageMap({ damages, onChange }: { damages: Damage[]; onChange: (d: Damage[]) => void }) {
  const W = 140;
  const H = 240;
  return (
    <Card style={{ alignItems: 'center' }}>
      <Txt style={{ fontSize: 13, color: C.muted, alignSelf: 'flex-start' }}>Toca el dibujo donde hay un golpe o rayón.</Txt>
      <Pressable
        onPress={(e) => {
          const { locationX, locationY } = e.nativeEvent;
          onChange([...damages, { id: (damages.at(-1)?.id ?? 0) + 1, x: locationX / W, y: locationY / H, note: '' }]);
        }}
        accessibilityRole="button"
        accessibilityLabel="Dibujo del coche, toca para marcar un daño"
        style={{ width: W, height: H, borderWidth: 3, borderColor: C.ink, borderRadius: 52, backgroundColor: '#fff' }}
      >
        <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, top: 46, height: 40, borderWidth: 2, borderColor: C.ink, borderRadius: 12 }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: 38, height: 34, borderWidth: 2, borderColor: C.ink, borderRadius: 12 }} />
        {damages.map((d) => (
          <View
            key={d.id}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: d.x * W - 11,
              top: d.y * H - 11,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#DC2626',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt b style={{ color: '#fff', fontSize: 12 }}>
              {d.id}
            </Txt>
          </View>
        ))}
      </Pressable>
      {damages.map((d) => (
        <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch' }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' }}>
            <Txt b style={{ color: '#fff', fontSize: 12 }}>
              {d.id}
            </Txt>
          </View>
          <TextInput
            value={d.note}
            onChangeText={(t) => onChange(damages.map((x) => (x.id === d.id ? { ...x, note: t } : x)))}
            placeholder="Qué tiene (golpe, rayón…)"
            placeholderTextColor="#8A847D"
            accessibilityLabel={`Nota del daño ${d.id}`}
            style={{ flex: 1, minHeight: 44, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 10, fontFamily: F.reg, fontSize: 14 }}
          />
          <Pressable onPress={() => onChange(damages.filter((x) => x.id !== d.id))} accessibilityRole="button" accessibilityLabel={`Quitar daño ${d.id}`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Txt b style={{ color: C.red, fontSize: 18 }}>×</Txt>
          </Pressable>
        </View>
      ))}
    </Card>
  );
}
