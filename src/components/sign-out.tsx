import { useEffect } from 'react';

import { Screen } from '@/components/ui';
import { useStore } from '@/store/app';

/**
 * Pestaña "Salir": solo cierra la sesión. El regreso al inicio lo hace el
 * `<Redirect>` del layout del rol (role !== X → "/"); navegar aquí también
 * provocaba redirecciones cruzadas con Inicio (bucle de renders).
 */
export default function SignOut() {
  const { signOut } = useStore();
  useEffect(() => {
    signOut();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar; signOut cambia de identidad con cada estado
  }, []);
  return <Screen>{null}</Screen>;
}
