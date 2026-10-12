import type { User } from '../modules/users/user.entity.js';
import { canOperate } from './auth.service.js';

const user = (over: Partial<User>) =>
  ({ active: true, shop: null, ...over }) as User;

describe('canOperate', () => {
  it('permite cuentas activas sin taller (admin, cliente)', () => {
    expect(canOperate(user({}))).toBe(true);
  });

  it('bloquea cuentas desactivadas', () => {
    expect(canOperate(user({ active: false }))).toBe(false);
  });

  it('bloquea a quien pertenece a un taller pausado, pero no a uno invitado o activo', () => {
    expect(
      canOperate(user({ shop: { status: 'pausado' } as User['shop'] })),
    ).toBe(false);
    expect(
      canOperate(user({ shop: { status: 'invitado' } as User['shop'] })),
    ).toBe(true);
    expect(
      canOperate(user({ shop: { status: 'activo' } as User['shop'] })),
    ).toBe(true);
  });
});
