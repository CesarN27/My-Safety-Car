import { Image } from 'expo-image';
import { View } from 'react-native';

import { Txt } from '@/components/ui';
import { imageSource } from '@/lib/api';
import { when } from '@/lib/format';
import { C } from '@/theme';
import { STATES } from '@/types';
import type { LogEntry } from '@/types';

/** Línea de tiempo de cambios de estado. El cliente solo ve lo que el taller marcó como visible. */
export function Timeline({ log, forClient }: { log: LogEntry[]; forClient?: boolean }) {
  return (
    <View>
      {log.map((l, i) => {
        const first = i === 0;
        const last = i === log.length - 1;
        const showMedia = !forClient || l.visibleToClient;
        return (
          <View key={l.at + i} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ alignItems: 'center', width: 14 }}>
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  marginTop: 3,
                  backgroundColor: first ? C.orange : C.ink,
                  borderWidth: first ? 3 : 0,
                  borderColor: C.ink,
                }}
              />
              {!last ? <View style={{ flex: 1, width: 2, backgroundColor: C.border, marginVertical: 2 }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: last ? 0 : 14 }}>
              <Txt b>{STATES[l.state]}</Txt>
              <Txt style={{ fontSize: 12, color: C.muted }}>
                {forClient ? when(l.at) : `${l.who} · ${when(l.at)}`}
              </Txt>
              {showMedia && l.note ? <Txt style={{ fontSize: 14, marginTop: 4, lineHeight: 20 }}>{l.note}</Txt> : null}
              {showMedia && l.photos.length ? (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {l.photos.map((u) => (
                    <Image key={u} source={imageSource(u)} style={{ width: 84, height: 64, borderRadius: 8 }} contentFit="cover" />
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
