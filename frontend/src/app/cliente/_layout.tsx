import { RoleTabs } from '@/components/role-tabs';

export default function ClienteLayout() {
  return (
    <RoleTabs
      role="cliente"
      tabs={[
        { name: 'index', title: 'Mi coche', sf: { default: 'car', selected: 'car.fill' }, md: 'directions_car' },
        { name: 'escanear', title: 'Escanear', sf: { default: 'qrcode.viewfinder', selected: 'qrcode.viewfinder' }, md: 'qr_code_scanner' },
        { name: 'mapa', title: 'Talleres', sf: { default: 'mappin', selected: 'mappin' }, md: 'location_on' },
        { name: 'salir', title: 'Salir', sf: { default: 'rectangle.portrait.and.arrow.right', selected: 'rectangle.portrait.and.arrow.right' }, md: 'logout', role: 'search' },
      ]}
    />
  );
}
