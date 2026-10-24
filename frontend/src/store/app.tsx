import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import {
  barsToFuel,
  carFromClient,
  carFromHelper,
  carFromShop,
  helperFromApi,
  type ClientCarApi,
  type HelperApi,
  type HelperCarApi,
  type ShopCarApi,
} from '@/lib/adapt';
import { api, ApiError, getSession, onSessionExpired, setSession, type Session } from '@/lib/api';
import { ENTRY_PHOTO_LABELS, STATES } from '@/types';
import type { Car, CarState, CostItem, Damage, Helper, InspState, PayRule, Role, Scan, Shop, ShopStatus, Signature } from '@/types';

/** Lo que el ayudante sabe de sí mismo (GET /helper/me). */
export interface HelperMe {
  id: string;
  name: string;
  phone: string;
  pay: PayRule;
  shopName: string;
}

/** "Mis pagos" del ayudante (GET /helper/payments). */
export interface HelperSummary {
  earnedThisWeek: number;
  pendingTotal: number;
  inProgress: { carId: string; folio: string; state: CarState; estimated: number }[];
  payments: { id: string; carId: string; folio: string; amount: number; paidAt: string | null; createdAt: string }[];
}

export interface AdminStats {
  shops: Partial<Record<ShopStatus, number>>;
  clients: number;
  carsByMonth: { month: string; count: number }[];
}

export interface NewCar {
  brand: string;
  model: string;
  year: string;
  color: string;
  plates: string;
  vin: string;
  km: string;
  dashboardPhoto?: string;
  client: { name: string; phone: string; address: string };
  description: string;
  inspection: Record<string, InspState>;
  fuel: number;
  damages: Damage[];
  photos: string[];
  signature?: Signature;
  helperId?: string;
}

interface Data {
  role: Role | null;
  userName: string;
  shops: Shop[];
  helpers: Helper[];
  cars: Car[];
  me: HelperMe | null;
  summary: HelperSummary | null;
  stats: AdminStats | null;
  /** Taller: lo pendiente de pagar a cada ayudante (pagos congelados al entregar). */
  pendingByHelper: Record<string, { total: number; ids: string[] }>;
}

const EMPTY: Data = {
  role: null,
  userName: '',
  shops: [],
  helpers: [],
  cars: [],
  me: null,
  summary: null,
  stats: null,
  pendingByHelper: {},
};

export interface Store extends Data {
  /** Cargando datos del servidor (al entrar o al recargar). */
  loading: boolean;
  requestCode: (phone: string) => Promise<void>;
  /** Entra con el código; devuelve el rol de la cuenta. */
  verifyCode: (phone: string, code: string) => Promise<Role>;
  signOut: () => void;
  reload: () => Promise<void>;
  addShop: (shop: Omit<Shop, 'id' | 'verified' | 'status'>) => Promise<void>;
  setShopStatus: (id: string, status: ShopStatus) => Promise<void>;
  addHelper: (h: { name: string; phone: string; pay: PayRule; photo?: string }) => Promise<void>;
  payHelper: (id: string) => Promise<void>;
  addCar: (c: NewCar) => Promise<string>;
  setHelper: (carId: string, helperId?: string) => Promise<void>;
  /** Escaneo OBD: el backend aún no los guarda, así que viven solo en esta sesión. */
  addScan: (carId: string, scan: Pick<Scan, 'codes' | 'note' | 'photo'> & { who?: string }) => void;
  addPhoto: (carId: string, uri: string) => Promise<void>;
  saveCosts: (carId: string, costs: CostItem[], ivaOn: boolean) => Promise<void>;
  /** Cambia la etapa (o agrega una nota si es la misma) con fotos. Devuelve un error legible o null. */
  setProgress: (
    carId: string,
    state: CarState,
    opts?: { note?: string; photos?: string[]; visible?: boolean },
  ) => Promise<string | null>;
  /** Liga el coche del QR a la cuenta del cliente. Devuelve el error legible o null. */
  linkCarByToken: (token: string) => Promise<string | null>;
  /** Token de un QR abierto sin sesión: se liga al entrar como cliente. */
  pendingToken: string | null;
  setPendingToken: (t: string | null) => void;
  carById: (id: string) => Car | undefined;
  helperById: (id?: string) => Helper | undefined;
}

const Ctx = createContext<Store | null>(null);

const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Algo salió mal. Intenta de nuevo.');
/** Rol de la sesión activa (se lee de la sesión, no del estado, para usarlo dentro de callbacks). */
const sessionRole = () => getSession()?.user.role ?? null;
const surfaceOf = (role: Role | null) => (role === 'ayudante' ? 'helper' : role === 'cliente' ? 'client' : 'shop');

/** Expedientes con detalle completo: la lista trae solo el resumen. */
async function details<T>(path: string, ids: string[]) {
  return Promise.all(ids.map((id) => api.get<T>(`${path}/${id}`)));
}

async function loadFor(role: Role): Promise<Partial<Data>> {
  switch (role) {
    case 'admin': {
      const [shops, stats] = await Promise.all([api.get<Shop[]>('/admin/shops'), api.get<AdminStats>('/admin/stats')]);
      return { shops, stats };
    }
    case 'taller': {
      const [settings, helpers, open, delivered, pending] = await Promise.all([
        api.get<Shop>('/shop/settings'),
        api.get<HelperApi[]>('/shop/helpers'),
        api.get<{ id: string }[]>('/shop/cars'),
        api.get<{ id: string }[]>('/shop/cars?state=5'),
        api.get<{ id: string; amount: number; helper: { id: string } }[]>('/shop/payments?pending=true'),
      ]);
      const cars = await details<ShopCarApi>('/shop/cars', [...open, ...delivered].map((c) => c.id));
      const pendingByHelper: Data['pendingByHelper'] = {};
      for (const p of pending) {
        const cur = (pendingByHelper[p.helper.id] ??= { total: 0, ids: [] });
        cur.total = Math.round((cur.total + p.amount) * 100) / 100;
        cur.ids.push(p.id);
      }
      return {
        shops: [settings],
        helpers: helpers.filter((h) => h.active !== false).map(helperFromApi),
        cars: cars.map(carFromShop),
        pendingByHelper,
      };
    }
    case 'ayudante': {
      const [me, list, summary] = await Promise.all([
        api.get<HelperApi & { shop: { name: string } }>('/helper/me'),
        api.get<{ id: string }[]>('/helper/cars'),
        api.get<HelperSummary>('/helper/payments'),
      ]);
      const cars = await details<HelperCarApi>('/helper/cars', list.map((c) => c.id));
      const h = helperFromApi(me);
      return {
        me: { id: h.id, name: h.name, phone: h.phone, pay: h.pay, shopName: me.shop.name },
        helpers: [h],
        cars: cars.map((c) => ({ ...carFromHelper(c), helperId: h.id })),
        summary,
      };
    }
    case 'cliente': {
      const [shops, list] = await Promise.all([
        api.get<Shop[]>('/public/shops'),
        api.get<{ id: string }[]>('/client/cars'),
      ]);
      const cars = await details<ClientCarApi>('/client/cars', list.map((c) => c.id));
      return { shops: shops.map((s) => ({ ...s, owner: '', status: 'activo' as const })), cars: cars.map(carFromClient) };
    }
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [scans, setScans] = useState<Record<string, Scan[]>>({});
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  const signOut = useCallback(() => {
    const s = getSession();
    if (s) api.post('/auth/logout', { refreshToken: s.refreshToken }).catch(() => undefined);
    setSession(null);
    setData(EMPTY);
    setScans({});
  }, []);

  useEffect(() => onSessionExpired(() => setData(EMPTY)), []);

  const reload = useCallback(async () => {
    const role = sessionRole();
    if (!role) return;
    setLoading(true);
    try {
      const next = await loadFor(role);
      setData((d) => ({ ...d, ...next }));
    } finally {
      setLoading(false);
    }
  }, []);

  /** Vuelve a pedir un expediente y lo reemplaza en la lista. */
  const refreshCar = useCallback(async (id: string) => {
    const role = sessionRole();
    const car =
      role === 'ayudante'
        ? carFromHelper(await api.get<HelperCarApi>(`/helper/cars/${id}`))
        : role === 'cliente'
          ? carFromClient(await api.get<ClientCarApi>(`/client/cars/${id}`))
          : carFromShop(await api.get<ShopCarApi>(`/shop/cars/${id}`));
    setData((d) => {
      const merged = role === 'ayudante' ? { ...car, helperId: d.me?.id } : car;
      const exists = d.cars.some((c) => c.id === id);
      return { ...d, cars: exists ? d.cars.map((c) => (c.id === id ? merged : c)) : [merged, ...d.cars] };
    });
  }, []);

  const value = useMemo<Store>(() => {
    const cars = data.cars.map((c) => (scans[c.id] ? { ...c, scans: scans[c.id] } : c));
    const surface = surfaceOf(data.role);
    return {
      ...data,
      cars,
      loading,
      pendingToken,
      setPendingToken,

      requestCode: async (phone) => {
        await api.post('/auth/request-code', { phone });
      },
      verifyCode: async (phone, code) => {
        const s = await api.post<Session>('/auth/verify', { phone, code });
        setSession(s);
        setLoading(true);
        try {
          const next = await loadFor(s.user.role);
          setData({ ...EMPTY, ...next, role: s.user.role, userName: s.user.name });
        } finally {
          setLoading(false);
        }
        return s.user.role;
      },
      signOut,
      reload,

      addShop: async (shop) => {
        await api.post('/admin/shops', {
          name: shop.name,
          owner: shop.owner,
          phone: shop.phone,
          zone: shop.zone,
          address: shop.address,
          specialties: shop.specialties,
          hours: shop.hours,
          lat: shop.lat,
          lng: shop.lng,
        });
        await reload();
      },
      setShopStatus: async (id, status) => {
        await api.patch(`/admin/shops/${id}/status`, { status });
        await reload();
      },

      addHelper: async (h) => {
        const created = await api.post<HelperApi>('/shop/helpers', {
          name: h.name,
          phone: h.phone,
          payType: h.pay.type,
          ...(h.pay.type === 'fijo' ? { payAmount: h.pay.amount } : { payPct: h.pay.pct }),
        });
        if (h.photo) await api.upload(`/shop/helpers/${created.id}/photo`, h.photo);
        await reload();
      },
      payHelper: async (id) => {
        for (const paymentId of data.pendingByHelper[id]?.ids ?? []) await api.post(`/shop/payments/${paymentId}/pay`);
        await reload();
      },

      addCar: async (c) => {
        const created = await api.post<ShopCarApi>('/shop/cars', {
          client: { name: c.client.name, phone: c.client.phone, address: c.client.address },
          vehicle: { brand: c.brand, model: c.model, year: c.year, color: c.color, plates: c.plates, vin: c.vin },
          km: c.km,
          fuel: barsToFuel(c.fuel),
          inspection: c.inspection,
          damages: c.damages,
          description: c.description,
          clientDescription: c.description,
          ...(c.helperId ? { helperId: c.helperId } : {}),
        });
        const id = created.id;
        if (c.signature) await api.put(`/shop/cars/${id}/signature`, c.signature);
        if (c.dashboardPhoto) await api.upload(`/shop/cars/${id}/files`, c.dashboardPhoto, { kind: 'entrada', label: 'Tablero' });
        for (const [i, uri] of c.photos.entries())
          await api.upload(`/shop/cars/${id}/files`, uri, {
            kind: 'entrada',
            label: ENTRY_PHOTO_LABELS[i] ?? 'Extra',
            visibleToClient: 'true',
          });
        await refreshCar(id);
        return id;
      },
      setHelper: async (carId, helperId) => {
        await api.patch(`/shop/cars/${carId}`, { helperId: helperId ?? null });
        await refreshCar(carId);
      },
      addScan: (carId, scan) => {
        const entry: Scan = {
          id: 'sc' + Date.now(),
          at: new Date().toISOString(),
          who: scan.who ?? data.userName,
          codes: scan.codes,
          note: scan.note,
          photo: scan.photo,
        };
        setScans((s) => ({ ...s, [carId]: [entry, ...(s[carId] ?? [])] }));
      },
      addPhoto: async (carId, uri) => {
        await api.upload(`/shop/cars/${carId}/files`, uri, { kind: 'entrada', label: 'Extra' });
        await refreshCar(carId);
      },
      saveCosts: async (carId, costs, ivaOn) => {
        await api.put(`/shop/cars/${carId}/costs`, {
          ivaOn,
          items: costs.map((i) => ({
            kind: i.kind,
            desc: i.desc.trim() || 'Concepto',
            qty: i.qty ?? 1,
            cost: i.kind === 'mano' ? 0 : i.cost,
            price: i.kind === 'gasto' ? 0 : i.price,
            ...(i.supplier ? { supplier: i.supplier } : {}),
          })),
        });
        await refreshCar(carId);
      },
      setProgress: async (carId, state, opts = {}) => {
        const car = data.cars.find((c) => c.id === carId);
        if (!car) return 'No encontramos el coche.';
        try {
          const body = { note: opts.note?.trim() || undefined, visibleToClient: opts.visible ?? true };
          const res = await (state === car.state
            ? api.post<{ log: { id: string }[] }>(`/${surface}/cars/${carId}/notes`, body)
            : api.post<{ log: { id: string }[] }>(`/${surface}/cars/${carId}/state`, { ...body, state }));
          const logId = res.log.at(-1)?.id;
          if (logId)
            for (const uri of opts.photos ?? [])
              await api.upload(`/${surface}/cars/${carId}/files`, uri, {
                kind: 'avance',
                logId,
                visibleToClient: String(opts.visible ?? true),
              });
          await refreshCar(carId);
          if (sessionRole() === 'ayudante') await reload();
          return null;
        } catch (e) {
          return errorText(e);
        }
      },
      linkCarByToken: async (token) => {
        try {
          await api.post('/client/cars/link', { token });
          await reload();
          return null;
        } catch (e) {
          return e instanceof ApiError && e.status === 404
            ? 'Ese QR no es de un servicio activo. Pídele al taller que te muestre el de tu coche.'
            : errorText(e);
        }
      },
      carById: (id) => cars.find((c) => c.id === id),
      helperById: (id) => data.helpers.find((h) => h.id === id),
    };
  }, [data, loading, scans, pendingToken, signOut, reload, refreshCar]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore fuera de AppProvider');
  return v;
}

export const stateName = (s: CarState) => STATES[s];
