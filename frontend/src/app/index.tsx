import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Slash, Wordmark } from '@/components/brand';
import { Btn, Screen, Txt } from '@/components/ui';
import { useStore } from '@/store/app';
import { C, F } from '@/theme';
import type { Role } from '@/types';

const HOME: Record<Role, '/admin' | '/taller' | '/ayudante' | '/cliente'> = {
  admin: '/admin',
  taller: '/taller',
  ayudante: '/ayudante',
  cliente: '/cliente',
};

export default function Inicio() {
  const { role, requestCode, verifyCode, loading } = useStore();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya hay sesión, directo a su vista (al volver con "atrás" desde un rol).
  if (role) return <Redirect href={HOME[role]} />;

  const run = (fn: () => Promise<void>) => async () => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar.');
    } finally {
      setBusy(false);
    }
  };
  const ask = run(async () => {
    await requestCode(phone);
    setSent(true);
  });
  const enter = run(async () => {
    const r = await verifyCode(phone, code);
    router.replace(HOME[r]);
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: C.ink, paddingTop: insets.top + 28, paddingHorizontal: 24, paddingBottom: 28, overflow: 'hidden' }}>
          <Slash width={220} height={14} right={-40} />
          <Wordmark size={44} />
          <View style={{ alignSelf: 'flex-start', marginTop: 10, backgroundColor: C.orange, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}>
            <Txt b style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Tu taller, conectado con tu cliente
            </Txt>
          </View>
          <Txt style={{ color: '#C9C9C9', marginTop: 18, lineHeight: 22 }}>
            Expedientes, costos y ayudantes para el taller. Estado del coche en tiempo real para el cliente.
          </Txt>
        </View>
        <View style={{ height: 6, backgroundColor: C.orange }} />

        <View style={{ padding: 20, gap: 12 }}>
          <Txt semi style={{ fontSize: 14 }}>
            Entra con tu número de celular
          </Txt>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.border, borderRadius: 10 }}>
              <Txt b>+52</Txt>
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="55 1234 5678"
              placeholderTextColor="#8A847D"
              accessibilityLabel="Número de celular"
              style={{ flex: 1, minHeight: 48, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, fontSize: 16, fontFamily: F.reg, backgroundColor: '#fff' }}
            />
          </View>
          {sent ? (
            <>
              <TextInput
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="Código de 6 dígitos"
                placeholderTextColor="#8A847D"
                accessibilityLabel="Código de acceso"
                style={{ minHeight: 48, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, fontSize: 18, letterSpacing: 4, fontFamily: F.reg, backgroundColor: '#fff' }}
              />
              <Btn label={busy || loading ? 'Entrando…' : 'Entrar'} onPress={enter} disabled={busy || code.length < 4} />
              <Pressable onPress={() => setSent(false)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
                <Txt semi style={{ textAlign: 'center', color: C.muted }}>Cambiar número</Txt>
              </Pressable>
            </>
          ) : (
            <Btn label={busy ? 'Enviando…' : 'Recibir código'} onPress={ask} disabled={busy || phone.replace(/\D/g, '').length < 10} />
          )}
          {error ? (
            <Txt style={{ fontSize: 13, color: C.red, textAlign: 'center' }} accessibilityRole="alert">
              {error}
            </Txt>
          ) : null}
          <Txt style={{ fontSize: 12, color: C.muted, textAlign: 'center' }}>
            {sent
              ? 'Demo: el código llega por un canal simulado; usa el código de prueba del servidor (DEV_OTP_CODE).'
              : 'Tu rol (taller, ayudante, cliente o admin) depende de la cuenta ligada a tu número.'}
          </Txt>
        </View>
      </ScrollView>
    </Screen>
  );
}
