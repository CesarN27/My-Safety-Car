import { RoleTabs } from '@/components/role-tabs';

export default function AdminLayout() {
  return (
    <RoleTabs
      role="admin"
      tabs={[
        { name: 'index', title: 'Talleres', sf: { default: 'mappin', selected: 'mappin' }, md: 'location_on' },
        { name: 'mapa', title: 'Mapa', sf: { default: 'map', selected: 'map.fill' }, md: 'map' },
        { name: 'panel', title: 'Panel', sf: { default: 'chart.bar', selected: 'chart.bar.fill' }, md: 'bar_chart' },
        { name: 'salir', title: 'Salir', sf: { default: 'rectangle.portrait.and.arrow.right', selected: 'rectangle.portrait.and.arrow.right' }, md: 'logout', role: 'search' },
      ]}
    />
  );
}
