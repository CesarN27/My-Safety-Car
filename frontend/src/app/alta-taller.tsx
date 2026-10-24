import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { OsmMap } from '@/components/osm-map';
import { AppHeader, Body, Btn, Chip, Field, FooterBar, Screen, SectionTag, Txt } from '@/components/ui';
import { SPECIALTIES } from '@/data/specialties';
import { fixed, parseCoord, splitPair, type LatLng } from '@/lib/geo';
import { useStore } from '@/store/app';
import { C } from '@/theme';

export default function AltaTaller() {
  const { addShop, shops } = useStore();
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [phone, setPhone] = useState('');
  const [rfc, setRfc] = useState('');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [hours, setHours] = useState('L–S 9:00 a 19:00');
  const [specs, setSpecs] = useState<string[]>([]);
  const [channel, setChannel] = useState<'WhatsApp' | 'Correo'>('WhatsApp');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (s: string) => setSpecs((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]));
  const latN = parseCoord(lat, 'lat');
  const lngN = parseCoord(lng, 'lng');
  const pin: LatLng | null = latN !== null && lngN !== null ? { lat: latN, lng: lngN } : null;
  const ready = name.trim() && owner.trim() && phone.trim() && address.trim() && pin;

  // Si pegan "19.35, -99.08" en cualquiera de los dos campos, se reparte solo.
  const typeCoord = (set: (v: string) => void) => (v: string) => {
    const pair = splitPair(v);
    if (pair) {
      setLat(String(pair.lat));
      setLng(String(pair.lng));
    } else set(v.replace(/\s/g, ''));
  };
  const pick = useCallback((p: LatLng) => {
    setLat(fixed(p.lat));
    setLng(fixed(p.lng));
  }, []);

  const save = async () => {
    if (!pin) return;
    setBusy(true);
    setError(null);
    try {
      await addShop({
      name: name.trim(),
      owner: owner.trim(),
      phone: phone.trim(),
      address: address.trim(),
      zone: zone.trim() || address.trim().split(',').pop()!.trim(),
      specialties: specs,
      hours,
      lat: pin.lat,
      lng: pin.lng,
    });
      Alert.alert(
        'Taller guardado',
        `${owner.trim()} ya puede entrar con el teléfono del taller. Queda como Invitado hasta que lo actives. (El envío de la invitación por ${channel} llega con el login real.)`,
      );
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el taller.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Alta de taller" onBack />
      <Body>
        <SectionTag>Datos del taller</SectionTag>
        <Field label="Nombre del taller" value={name} onChangeText={setName} placeholder="Taller Gómez" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Field style={{ flex: 1 }} label="Dueño" value={owner} onChangeText={setOwner} />
          <Field style={{ flex: 1 }} label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>
        <Field label="RFC (opcional)" value={rfc} onChangeText={setRfc} autoCapitalize="characters" />

        <SectionTag>Ubicación</SectionTag>
        <Field label="Dirección" value={address} onChangeText={setAddress} placeholder="Calle, número, colonia, alcaldía" />
        <Field label="Zona (como se verá en la lista)" value={zone} onChangeText={setZone} placeholder="Xochimilco" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Field
            style={{ flex: 1 }}
            label="Latitud"
            value={lat}
            onChangeText={typeCoord(setLat)}
            placeholder="19.358900"
            keyboardType="numbers-and-punctuation"
            autoCorrect={false}
          />
          <Field
            style={{ flex: 1 }}
            label="Longitud"
            value={lng}
            onChangeText={typeCoord(setLng)}
            placeholder="-99.084600"
            keyboardType="numbers-and-punctuation"
            autoCorrect={false}
          />
        </View>
        {(lat && latN === null) || (lng && lngN === null) ? (
          <Txt style={{ fontSize: 12, color: '#B91C1C' }}>
            Usa números con punto decimal: latitud entre -90 y 90, longitud entre -180 y 180.
          </Txt>
        ) : null}
        <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: C.border }}>
          <OsmMap shops={shops} height={220} pin={pin} onPick={pick} />
        </View>
        <Txt style={{ fontSize: 12, color: C.muted, lineHeight: 17 }}>
          Escribe las coordenadas (o pega «lat, lng» tal como las copias de Google Maps u OpenStreetMap) o toca el mapa para colocar
          el pin. Es obligatorio: sin coordenadas el taller no puede salir en el mapa del cliente.
        </Txt>

        <SectionTag>Especialidades</SectionTag>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SPECIALTIES.map((s) => (
            <Chip key={s} label={s} on={specs.includes(s)} onPress={() => toggle(s)} />
          ))}
        </View>
        <Field label="Horario" value={hours} onChangeText={setHours} />

        <SectionTag>Invitación al dueño</SectionTag>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['WhatsApp', 'Correo'] as const).map((c) => (
            <Chip key={c} label={c} on={channel === c} onPress={() => setChannel(c)} grow />
          ))}
        </View>
        <Txt style={{ fontSize: 13, color: C.muted, lineHeight: 19 }}>
          El taller queda como <Txt b style={{ fontSize: 13 }}>Invitado</Txt> y no sale en el mapa hasta que el dueño complete su
          perfil y tú lo marques como activo.
        </Txt>
      </Body>
      <FooterBar>
        <View style={{ flex: 1 }}>
          {error ? (
            <Txt accessibilityRole="alert" style={{ color: C.red, fontSize: 13, marginBottom: 6 }}>
              {error}
            </Txt>
          ) : null}
          <Btn label={busy ? 'Guardando…' : 'Guardar y enviar invitación'} onPress={save} disabled={!ready || busy} />
        </View>
      </FooterBar>
    </Screen>
  );
}
