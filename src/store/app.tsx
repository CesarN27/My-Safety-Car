import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';

import { DEMO_HELPER_ID, OWNER_NAME, seedCars, seedHelpers, seedShops } from '@/data/seed';
import { carTotals } from '@/lib/money';
import { STATES } from '@/types';
import type { Car, CarState, CostItem, Helper, PayRule, Role, Scan, Shop, ShopStatus } from '@/types';

interface State {
  role: Role | null;
  shops: Shop[];
  helpers: Helper[];
  cars: Car[];
}

type Action =
  | { type: 'signIn'; role: Role }
  | { type: 'signOut' }
  | { type: 'addShop'; shop: Shop }
  | { type: 'shopStatus'; id: string; status: ShopStatus }
  | { type: 'addHelper'; helper: Helper }
  | { type: 'payHelper'; id: string }
  | { type: 'addCar'; car: Car }
  | { type: 'patchCar'; id: string; patch: Partial<Car> }
  | { type: 'progress'; id: string; state: CarState; who: string; note?: string; photos: string[]; visible: boolean };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'signIn':
      return { ...s, role: a.role };
    case 'signOut':
      return { ...s, role: null };
    case 'addShop':
      return { ...s, shops: [a.shop, ...s.shops] };
    case 'shopStatus':
      return { ...s, shops: s.shops.map((x) => (x.id === a.id ? { ...x, status: a.status } : x)) };
    case 'addHelper':
      return { ...s, helpers: [...s.helpers, a.helper] };
    case 'payHelper':
      return { ...s, helpers: s.helpers.map((h) => (h.id === a.id ? { ...h, paid: true } : h)) };
    case 'addCar':
      return { ...s, cars: [a.car, ...s.cars] };
    case 'patchCar':
      return { ...s, cars: s.cars.map((c) => (c.id === a.id ? { ...c, ...a.patch } : c)) };
    case 'progress':
      return {
        ...s,
        cars: s.cars.map((c) =>
          c.id === a.id
            ? {
                ...c,
                state: a.state,
                log: [
                  {
                    state: a.state,
                    who: a.who,
                    at: new Date().toISOString(),
                    note: a.note,
                    photos: a.photos,
                    visibleToClient: a.visible,
                  },
                  ...c.log,
                ],
              }
            : c,
        ),
      };
  }
}

const initial: State = { role: null, shops: seedShops, helpers: seedHelpers, cars: seedCars };

export interface Store extends State {
  signIn: (role: Role) => void;
  signOut: () => void;
  addShop: (shop: Omit<Shop, 'id' | 'verified' | 'status'>) => void;
  setShopStatus: (id: string, status: ShopStatus) => void;
  addHelper: (h: { name: string; phone: string; pay: PayRule; photo?: string }) => void;
  payHelper: (id: string) => void;
  addCar: (c: Omit<Car, 'id' | 'folio' | 'token' | 'enteredAt' | 'state' | 'log' | 'scans' | 'costs' | 'ivaOn' | 'linked'>) => string;
  setHelper: (carId: string, helperId?: string) => void;
  /** Registra un escaneo de diagnóstico en el expediente. */
  addScan: (carId: string, scan: Pick<Scan, 'codes' | 'note' | 'photo'> & { who?: string }) => void;
  /** Agrega una foto extra a la inspección de ingreso. */
  addPhoto: (carId: string, uri: string) => void;
  saveCosts: (carId: string, costs: CostItem[], ivaOn: boolean) => void;
  /** Cambia el estado y deja constancia. Devuelve un error legible si no se puede. */
  setProgress: (
    carId: string,
    state: CarState,
    opts?: { who?: string; note?: string; photos?: string[]; visible?: boolean },
  ) => string | null;
  linkCarByToken: (token: string) => Car | null;
  carById: (id: string) => Car | undefined;
  helperById: (id?: string) => Helper | undefined;
}

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [s, dispatch] = useReducer(reducer, initial);

  const carById = useCallback((id: string) => s.cars.find((c) => c.id === id), [s.cars]);
  const helperById = useCallback((id?: string) => s.helpers.find((h) => h.id === id), [s.helpers]);

  const value = useMemo<Store>(
    () => ({
      ...s,
      signIn: (role) => dispatch({ type: 'signIn', role }),
      signOut: () => dispatch({ type: 'signOut' }),
      addShop: (shop) =>
        dispatch({
          type: 'addShop',
          shop: {
            ...shop,
            id: 's' + Date.now(),
            status: 'invitado',
            verified: false,
          },
        }),
      setShopStatus: (id, status) => dispatch({ type: 'shopStatus', id, status }),
      addHelper: (h) => dispatch({ type: 'addHelper', helper: { ...h, id: 'h' + Date.now(), paid: false } }),
      payHelper: (id) => dispatch({ type: 'payHelper', id }),
      addCar: (c) => {
        const next = Math.max(0, ...s.cars.map((x) => parseInt(x.folio, 10))) + 1;
        const folio = String(next).padStart(4, '0');
        const id = 'c' + folio;
        const now = new Date().toISOString();
        dispatch({
          type: 'addCar',
          car: {
            ...c,
            id,
            folio,
            token: 'tk' + folio + Math.random().toString(36).slice(2, 8),
            enteredAt: now,
            state: 0,
            costs: [],
            scans: [],
            ivaOn: true,
            linked: false,
            log: [{ state: 0, who: OWNER_NAME, at: now, photos: [], visibleToClient: true }],
          },
        });
        return id;
      },
      addScan: (carId, scan) => {
        const car = s.cars.find((c) => c.id === carId);
        if (!car) return;
        const entry: Scan = { id: 'sc' + Date.now(), at: new Date().toISOString(), who: scan.who ?? OWNER_NAME, codes: scan.codes, note: scan.note, photo: scan.photo };
        dispatch({ type: 'patchCar', id: carId, patch: { scans: [entry, ...car.scans] } });
      },
      addPhoto: (carId, uri) => {
        const car = s.cars.find((c) => c.id === carId);
        if (car) dispatch({ type: 'patchCar', id: carId, patch: { photos: [...car.photos, uri] } });
      },
      setHelper: (carId, helperId) => dispatch({ type: 'patchCar', id: carId, patch: { helperId } }),
      saveCosts: (carId, costs, ivaOn) => dispatch({ type: 'patchCar', id: carId, patch: { costs, ivaOn } }),
      setProgress: (carId, state, opts = {}) => {
        const car = s.cars.find((c) => c.id === carId);
        if (!car) return 'No encontramos el coche.';
        if (state === 4 && carTotals(car, s.helpers).total <= 0) {
          return 'Captura los costos antes de marcarlo como listo: el cliente recibe el total en ese momento.';
        }
        const helper = s.helpers.find((h) => h.id === DEMO_HELPER_ID);
        dispatch({
          type: 'progress',
          id: carId,
          state,
          who: opts.who ?? (s.role === 'ayudante' ? (helper?.name.split(' ')[0] ?? 'Ayudante') : OWNER_NAME),
          note: opts.note?.trim() || undefined,
          photos: opts.photos ?? [],
          visible: opts.visible ?? true,
        });
        return null;
      },
      linkCarByToken: (token) => {
        const car = s.cars.find((c) => c.token === token);
        if (!car) return null;
        if (!car.linked) dispatch({ type: 'patchCar', id: car.id, patch: { linked: true } });
        return car;
      },
      carById,
      helperById,
    }),
    [s, carById, helperById],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore fuera de AppProvider');
  return v;
}

export const stateName = (s: CarState) => STATES[s];
