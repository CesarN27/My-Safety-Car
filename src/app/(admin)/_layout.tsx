import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { tabIcon, useTabScreenOptions } from '@/components/tab-options';
import { useStore } from '@/store/app';

export default function AdminLayout() {
  const { role } = useStore();
  const options = useTabScreenOptions();
  if (role !== 'admin') return <Redirect href="/" />;
  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen name="index" options={{ title: 'Talleres', tabBarIcon: tabIcon('location') }} />
      <Tabs.Screen name="panel" options={{ title: 'Panel', tabBarIcon: tabIcon('stats-chart') }} />
      <Tabs.Screen name="salir" options={{ title: 'Salir', tabBarIcon: tabIcon('log-out-outline') }} />
    </Tabs>
  );
}
