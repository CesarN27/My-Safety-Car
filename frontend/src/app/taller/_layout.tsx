import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { tabIcon, useTabScreenOptions } from '@/components/tab-options';
import { useStore } from '@/store/app';

export default function TallerLayout() {
  const { role } = useStore();
  const options = useTabScreenOptions();
  if (role !== 'taller') return <Redirect href="/" />;
  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen name="index" options={{ title: 'Coches', tabBarIcon: tabIcon('car-sport') }} />
      <Tabs.Screen name="ayudantes" options={{ title: 'Ayudantes', tabBarIcon: tabIcon('people') }} />
      <Tabs.Screen name="reportes" options={{ title: 'Reportes', tabBarIcon: tabIcon('stats-chart') }} />
      <Tabs.Screen name="salir" options={{ title: 'Salir', tabBarIcon: tabIcon('log-out-outline') }} />
    </Tabs>
  );
}
