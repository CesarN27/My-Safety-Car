import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { tabIcon, useTabScreenOptions } from '@/components/tab-options';
import { useStore } from '@/store/app';

export default function AyudanteLayout() {
  const { role } = useStore();
  const options = useTabScreenOptions();
  if (role !== 'ayudante') return <Redirect href="/" />;
  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen name="index" options={{ title: 'Mis coches', tabBarIcon: tabIcon('car-sport') }} />
      <Tabs.Screen name="pagos" options={{ title: 'Mis pagos', tabBarIcon: tabIcon('cash-outline') }} />
      <Tabs.Screen name="salir" options={{ title: 'Salir', tabBarIcon: tabIcon('log-out-outline') }} />
    </Tabs>
  );
}
