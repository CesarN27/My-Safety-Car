import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { Screen } from '@/components/ui';
import { useStore } from '@/store/app';

/**
 * Pestaña "Salir": solo cierra la sesión. El regreso al inicio lo hace el
 * `<Redirect>` del layout del rol (role !== X → "/"); navegar aquí también
 * provocaba redirecciones cruzadas con Inicio (bucle de renders).
 *
 * Se ejecuta al enfocar la pestaña, no al montar: las tabs nativas montan todas
 * las pantallas de golpe y cerrarían la sesión nada más entrar.
 */
export default function SignOut() {
  const { signOut } = useStore();
  useFocusEffect(
    useCallback(() => {
      signOut();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- signOut cambia de identidad con cada estado
    }, []),
  );
  return <Screen>{null}</Screen>;
}
