import { RoleTabs } from '@/components/role-tabs';

export default function AyudanteLayout() {
  return (
    <RoleTabs
      role="ayudante"
      tabs={[
        { name: 'index', title: 'Mis coches', sf: { default: 'car', selected: 'car.fill' }, md: 'directions_car' },
        { name: 'pagos', title: 'Mis pagos', sf: { default: 'banknote', selected: 'banknote.fill' }, md: 'payments' },
        { name: 'salir', title: 'Salir', sf: { default: 'rectangle.portrait.and.arrow.right', selected: 'rectangle.portrait.and.arrow.right' }, md: 'logout', role: 'search' },
      ]}
    />
  );
}
