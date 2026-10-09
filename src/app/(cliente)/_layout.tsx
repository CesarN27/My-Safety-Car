import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { tabIcon, useTabScreenOptions } from '@/components/tab-options';
import { useStore } from '@/store/app';

export default function ClienteLayout() {
  const { role } = useStore();
  const options = useTabScreenOptions();
  if (role !== 'cliente') return <Redirect href="/" />;
  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen name="index" options={{ title: 'Mi coche', tabBarIcon: tabIcon('car-sport') }} />
      <Tabs.Screen name="escanear" options={{ title: 'Escanear', tabBarIcon: tabIcon('qr-code-outline') }} />
      <Tabs.Screen name="mapa" options={{ title: 'Talleres', tabBarIcon: tabIcon('location') }} />
      <Tabs.Screen name="salir" options={{ title: 'Salir', tabBarIcon: tabIcon('log-out-outline') }} />
    </Tabs>
  );
}
