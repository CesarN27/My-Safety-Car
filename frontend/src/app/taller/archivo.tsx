import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { useTabBottom } from '@/components/role-tabs';
import { AppHeader, Empty, Screen, StatePill, Txt } from '@/components/ui';
import { groupByYearMonth, matchesCar } from '@/lib/archive';
import { carTotals, money } from '@/lib/money';
import { useStore } from '@/store/app';
import { C, F } from '@/theme';

/** Archivo: todos los expedientes guardados en carpetas por año y mes de ingreso. */
export default function Archivo() {
  const tabBottom = useTabBottom();
  const { cars, helpers } = useStore();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const query = q.trim();
  const years = useMemo(() => groupByYearMonth(query ? cars.filter((c) => matchesCar(c, query)) : cars), [cars, query]);
  const latest = years[0]?.months[0]?.key;

  // Con búsqueda se abren todas las carpetas con resultados; sin ella, solo el mes más reciente.
  const isOpen = (key: string) => (query ? true : (open[key] ?? key === latest));
  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !isOpen(key) }));

  return (
    <Screen>
      <AppHeader title="Archivo" subtitle={`${cars.length} expedientes guardados por año y mes`} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Buscar por folio, placas o cliente"
          placeholderTextColor="#8A847D"
          accessibilityLabel="Buscar expediente"
          autoCorrect={false}
          style={{ minHeight: 46, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, fontSize: 15, fontFamily: F.reg, backgroundColor: '#fff' }}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: tabBottom, gap: 14 }}>
        {years.map((y) => (
          <View key={y.year} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt style={{ fontFamily: F.disp, fontSize: 26 }}>{y.year}</Txt>
              <Txt style={{ fontSize: 13, color: C.muted }}>{y.count} expedientes</Txt>
            </View>
            {y.months.map((m) => {
              const expanded = isOpen(m.key);
              const delivered = m.cars.filter((c) => c.state === 5).length;
              const billed = m.cars.reduce((s, c) => s + carTotals(c, helpers).total, 0);
              return (
                <View key={m.key} style={{ backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden' }}>
                  <Pressable
                    onPress={() => toggle(m.key)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    accessibilityLabel={`Carpeta ${m.label}, ${m.cars.length} expedientes`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 56 }}
                  >
                    <Ionicons name={expanded ? 'folder-open' : 'folder'} size={26} color={C.orange} />
                    <View style={{ flex: 1 }}>
                      <Txt b style={{ fontSize: 16 }}>
                        {m.label}
                      </Txt>
                      <Txt style={{ fontSize: 12, color: C.muted }}>
                        {m.cars.length} {m.cars.length === 1 ? 'expediente' : 'expedientes'} · {delivered} entregados
                        {billed > 0 ? ` · ${money(billed)}` : ''}
                      </Txt>
                    </View>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={C.mutedLight} />
                  </Pressable>
                  {expanded
                    ? m.cars.map((c) => (
                        <Pressable
                          key={c.id}
                          onPress={() => router.push({ pathname: '/expediente/[id]', params: { id: c.id } })}
                          accessibilityRole="button"
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            minHeight: 56,
                            borderTopWidth: 1,
                            borderColor: C.line,
                            backgroundColor: pressed ? C.orangeSoft : '#fff',
                          })}
                        >
                          <View style={{ flex: 1 }}>
                            <Txt b style={{ fontSize: 14 }}>
                              {c.folio} · {c.brand} {c.model} {c.year}
                            </Txt>
                            <Txt style={{ fontSize: 12, color: C.muted }} numberOfLines={1}>
                              {c.plates} · {c.client.name}
                            </Txt>
                          </View>
                          <StatePill state={c.state} />
                          <Pressable
                            onPress={() => router.push({ pathname: '/hoja/[id]', params: { id: c.id } })}
                            accessibilityRole="button"
                            accessibilityLabel={`Imprimir hoja del folio ${c.folio}`}
                            hitSlop={6}
                            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Ionicons name="print-outline" size={22} color={C.text} />
                          </Pressable>
                        </Pressable>
                      ))
                    : null}
                </View>
              );
            })}
          </View>
        ))}
        {years.length === 0 ? <Empty text={query ? 'Ningún expediente coincide con la búsqueda.' : 'Aún no hay expedientes guardados.'} /> : null}
      </ScrollView>
    </Screen>
  );
}
