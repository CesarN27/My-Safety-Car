import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { pickPhoto } from '@/components/photo-slot';
import { Timeline } from '@/components/timeline';
import { AppHeader, Body, Btn, Card, Chip, Disp, Eyebrow, Row, Screen, Tag, Txt } from '@/components/ui';
import { longDate, sheetPhotos } from '@/lib/hoja-html';
import { when } from '@/lib/format';
import { carTotals, money } from '@/lib/money';
import { useStore } from '@/store/app';
import { C } from '@/theme';
import { INSPECTION_POINTS, STATES } from '@/types';
import type { CarState } from '@/types';

export default function Expediente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { carById, helpers, helperById, setProgress, setHelper, addPhoto } = useStore();
  const [error, setError] = useState<string | null>(null);
  const car = carById(id);
  if (!car) return <Screen><AppHeader title="Expediente" onBack /></Screen>;

  const t = carTotals(car, helpers);
  const helper = helperById(car.helperId);
  const next = car.state < 5 ? ((car.state + 1) as CarState) : null;
  const needsCosts = next === 4 && t.total <= 0;
  const damaged = INSPECTION_POINTS.filter((p) => car.inspection[p] === 1);
  const okCount = INSPECTION_POINTS.filter((p) => car.inspection[p] === 0).length;

  return (
    <Screen>
      <AppHeader
        title={`${car.brand} ${car.model} ${car.year}`}
        eyebrow={`Folio ${car.folio}`}
        subtitle={[car.color, car.plates, car.km && `Odómetro ${car.km} km`].filter(Boolean).join(' · ')}
        onBack
        right={
          <Link href={{ pathname: '/qr/[id]', params: { id: car.id } }} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Ver QR" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 8 }}>
              <Ionicons name="qr-code-outline" size={22} color="#fff" />
              <Txt semi style={{ color: '#fff', fontSize: 14 }}>QR</Txt>
            </Pressable>
          </Link>
        }
      />
      <Body>
        <Card>
          <Eyebrow>Estado del coche</Eyebrow>
          <View style={{ flexDirection: 'row' }}>
            {STATES.map((label, i) => {
              const done = i < car.state;
              const now = i === car.state;
              return (
                <View key={label} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: done ? C.ink : now ? C.orange : '#fff',
                      borderWidth: now ? 3 : 2,
                      borderColor: done ? C.ink : now ? C.ink : C.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {done ? <Ionicons name="checkmark" size={14} color={C.orange} /> : null}
                  </View>
                  <Txt b style={{ fontSize: 10, textAlign: 'center', lineHeight: 11, color: done ? C.text : now ? C.orangeText : '#8A847D' }}>
                    {label}
                  </Txt>
                </View>
              );
            })}
          </View>
          {needsCosts ? (
            <View style={{ backgroundColor: C.amberBg, padding: 10, borderRadius: 10, gap: 8 }}>
              <Txt style={{ fontSize: 13, color: C.amber }}>
                Para marcar <Txt b style={{ fontSize: 13, color: C.amber }}>Listo</Txt> captura primero los costos: el cliente recibe el total en ese momento.
              </Txt>
              <Btn label="Capturar costos" kind="dark" onPress={() => router.push({ pathname: '/costos/[id]', params: { id: car.id } })} />
            </View>
          ) : null}
          {error ? <Txt style={{ color: C.red, fontSize: 13 }}>{error}</Txt> : null}
          {next !== null && !needsCosts ? (
            <Btn
              label={`Pasar a ${STATES[next]}`}
              onPress={() => setError(setProgress(car.id, next))}
            />
          ) : null}
          <Txt style={{ fontSize: 12, color: C.muted }}>El cliente recibe un aviso en cada cambio.</Txt>
        </Card>

        <Card>
          <Eyebrow>Ayudante asignado</Eyebrow>
          {helper ? (
            <Txt b style={{ fontSize: 16 }}>
              {helper.name}
            </Txt>
          ) : (
            <Txt style={{ color: C.muted }}>Sin asignar</Txt>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip label="Sin asignar" on={!car.helperId} onPress={() => setHelper(car.id, undefined)} />
            {helpers.map((h) => (
              <Chip key={h.id} label={h.name.split(' ')[0]} on={car.helperId === h.id} onPress={() => setHelper(car.id, h.id)} />
            ))}
          </View>
        </Card>

        <Card>
          <Eyebrow>Costos</Eyebrow>
          <Row style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 12, color: C.muted }}>Total al cliente</Txt>
              <Disp size={26}>{money(t.total)}</Disp>
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 12, color: C.muted }}>Ganancia libre</Txt>
              <Disp size={26} color={t.profit >= 0 ? C.green : C.red}>
                {money(t.profit)}
              </Disp>
            </View>
          </Row>
          <Link href={{ pathname: '/costos/[id]', params: { id: car.id } }} asChild>
            <Pressable accessibilityRole="button" style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt semi>Ver y editar desglose</Txt>
              <Ionicons name="chevron-forward" size={20} color={C.text} />
            </Pressable>
          </Link>
        </Card>

        <Card>
          <Eyebrow>Cliente</Eyebrow>
          <Row style={{ justifyContent: 'space-between' }}>
            <View>
              <Txt b>{car.client.name}</Txt>
              <Txt style={{ fontSize: 13, color: C.muted }}>{car.client.phone}</Txt>
            </View>
            <Tag label={car.linked ? 'Ligado a la app' : 'Aún sin escanear'} bg={car.linked ? C.greenBg : '#E5E7EB'} fg={car.linked ? C.green : '#374151'} />
          </Row>
        </Card>

        <Card>
          <Eyebrow>Servicio</Eyebrow>
          <Txt style={{ lineHeight: 21 }}>{car.description || 'Sin descripción.'}</Txt>
        </Card>

        <Card>
          <Eyebrow>Inspección de ingreso</Eyebrow>
          <Txt style={{ fontSize: 13, color: C.muted }}>
            {okCount} de {INSPECTION_POINTS.length} puntos bien
            {damaged.length ? ` · ${damaged.length} con daño` : ''} · Gasolina {car.fuel + 1}/8
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {INSPECTION_POINTS.map((p) => {
              const st = car.inspection[p];
              if (st === 0) return null;
              return <Tag key={p} label={`${p}: ${st === 1 ? 'dañado' : 'N/A'}`} bg={st === 1 ? C.redBg : '#E5E7EB'} fg={st === 1 ? C.red : '#374151'} />;
            })}
          </View>
          {car.damages.length ? (
            <Txt style={{ fontSize: 13, color: C.muted }}>
              Golpes marcados: {car.damages.map((d) => `${d.id}${d.note ? ` ${d.note}` : ''}`).join(' · ')}
            </Txt>
          ) : null}
          {sheetPhotos(car).length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {sheetPhotos(car).map(({ uri: u, label }) => (
                <View key={u} style={{ width: '48%', flexGrow: 1 }}>
                  <Image source={{ uri: u }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 8 }} contentFit="cover" accessibilityLabel={label} />
                  <Txt semi style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 2 }}>
                    {label}
                  </Txt>
                </View>
              ))}
            </View>
          ) : (
            <Txt style={{ color: C.muted }}>Todavía no hay fotos de ingreso.</Txt>
          )}
          <Btn
            label="Agregar foto de inspección"
            kind="outline"
            icon="camera-outline"
            onPress={async () => {
              const u = await pickPhoto();
              if (u) addPhoto(car.id, u);
            }}
          />
        </Card>

        <Card>
          <Eyebrow>Escaneos</Eyebrow>
          {car.scans.length ? (
            car.scans.map((sc) => (
              <View key={sc.id} style={{ gap: 6, paddingBottom: 10, borderBottomWidth: 1, borderColor: C.line }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt semi style={{ fontSize: 13 }}>
                    {when(sc.at)} · {sc.who}
                  </Txt>
                  <Tag label={sc.codes.length ? `${sc.codes.length} ${sc.codes.length === 1 ? 'falla' : 'fallas'}` : 'Sin fallas'} bg={sc.codes.length ? C.redBg : C.greenBg} fg={sc.codes.length ? C.red : C.green} />
                </Row>
                {sc.codes.length ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {sc.codes.map((c) => (
                      <Tag key={c} label={c} bg="#fff" fg={C.text} dashed />
                    ))}
                  </View>
                ) : null}
                {sc.note ? <Txt style={{ fontSize: 13, color: '#3F3B36', lineHeight: 19 }}>{sc.note}</Txt> : null}
                {sc.photo ? <Image source={{ uri: sc.photo }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 8 }} contentFit="cover" accessibilityLabel="Pantalla del escáner" /> : null}
              </View>
            ))
          ) : (
            <Txt style={{ color: C.muted }}>Todavía no se ha registrado ningún escaneo.</Txt>
          )}
          <Btn label="Registrar escaneo" kind="outline" icon="scan-outline" onPress={() => router.push({ pathname: '/escaneo', params: { carId: car.id } })} />
        </Card>

        <Card>
          <Eyebrow>Hoja de recepción</Eyebrow>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt style={{ flex: 1, fontSize: 13, color: C.muted, lineHeight: 19 }}>
              {car.signed ? `Cláusula aceptada y firmada por el cliente · ${longDate(car.enteredAt)}` : 'Sin firma del cliente.'}
            </Txt>
            <Tag label={car.signed ? 'Firmada' : 'Sin firma'} bg={car.signed ? C.greenBg : C.amberBg} fg={car.signed ? C.green : C.amber} />
          </Row>
          <Btn label="Ver e imprimir hoja" icon="print-outline" onPress={() => router.push({ pathname: '/hoja/[id]', params: { id: car.id } })} />
        </Card>

        <Card>
          <Eyebrow>Historial</Eyebrow>
          <Timeline log={car.log} />
        </Card>
      </Body>
    </Screen>
  );
}
