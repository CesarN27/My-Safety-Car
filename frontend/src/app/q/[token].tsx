import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { Screen } from '@/components/ui';
import { useStore } from '@/store/app';

/**
 * Destino del link del QR (tallerapp://q/<token>). El token se guarda y el coche se liga en
 * cuanto el cliente entra con su teléfono (el servidor solo lo liga si es el teléfono que dio
 * en el taller).
 */
export default function AbrirQr() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { role, setPendingToken } = useStore();

  useEffect(() => {
    if (token) setPendingToken(token);
  }, [token, setPendingToken]);

  if (!token) return <Screen>{null}</Screen>;
  return <Redirect href={role === 'cliente' ? '/cliente' : '/'} />;
}
