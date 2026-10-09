import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { Screen } from '@/components/ui';
import { useStore } from '@/store/app';

/** Pestaña "Salir": cierra la sesión y regresa al inicio. */
export default function SignOut() {
  const { signOut } = useStore();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    signOut();
    router.replace('/');
  }, [signOut]);
  return <Screen>{null}</Screen>;
}
