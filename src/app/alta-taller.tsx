import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { MiniMap } from '@/components/mini-map';
import { AppHeader, Body, Btn, Chip, Field, FooterBar, Screen, SectionTag, Txt } from '@/components/ui';
import { SPECIALTIES } from '@/data/seed';
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
  const [hours, setHours] = useState('L–S 9:00 a 19:00');
  const [specs, setSpecs] = useState<string[]>([]);
  const [channel, setChannel] = useState<'WhatsApp' | 'Correo'>('WhatsApp');

  const toggle = (s: string) => setSpecs((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]));
  const ready = name.trim() && owner.trim() && phone.trim() && address.trim();

  const save = () => {
    addShop({
      name: name.trim(),
      owner: owner.trim(),
      phone: phone.trim(),
      address: address.trim(),
      zone: zone.trim() || address.trim().split(',').pop()!.trim(),
      specialties: specs,
      hours,
    });
    Alert.alert('Taller guardado', `Le mandamos la invitación a ${owner.trim()} por ${channel}. Queda como Invitado hasta que lo actives.`);
    router.back();
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
        <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: C.border }}>
          <MiniMap shops={shops} height={150} />
        </View>
        <Txt style={{ fontSize: 12, color: C.muted }}>
          El pin se ajusta con el mapa real en la fase 3; por ahora se coloca según la dirección.
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
          <Btn label="Guardar y enviar invitación" onPress={save} disabled={!ready} />
        </View>
      </FooterBar>
    </Screen>
  );
}
