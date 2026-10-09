import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { Screen } from '@/components/ui';
import { useStore } from '@/store/app';

/** Destino del link del QR (tallerapp://q/<token>): liga el coche al cliente y abre su vista. */
export default function AbrirQr() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { role, signIn, linkCarByToken } = useStore();

  useEffect(() => {
    if (role !== 'cliente') signIn('cliente');
    linkCarByToken(token);
    // Solo al abrir el link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (role !== 'cliente') return <Screen>{null}</Screen>;
  return <Redirect href="/(cliente)" />;
}
