import { RoleTabs } from '@/components/role-tabs';

export default function TallerLayout() {
  return (
    <RoleTabs
      role="taller"
      tabs={[
        { name: 'index', title: 'Coches', sf: { default: 'car', selected: 'car.fill' }, md: 'directions_car' },
        { name: 'archivo', title: 'Archivo', sf: { default: 'folder', selected: 'folder.fill' }, md: 'folder_open' },
        { name: 'ayudantes', title: 'Ayudantes', sf: { default: 'person.2', selected: 'person.2.fill' }, md: 'group' },
        { name: 'reportes', title: 'Reportes', sf: { default: 'chart.bar', selected: 'chart.bar.fill' }, md: 'bar_chart' },
        { name: 'salir', title: 'Salir', sf: { default: 'rectangle.portrait.and.arrow.right', selected: 'rectangle.portrait.and.arrow.right' }, md: 'logout', role: 'search' },
      ]}
    />
  );
}
