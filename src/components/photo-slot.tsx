import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, View } from 'react-native';

import { Txt } from '@/components/ui';
import { C } from '@/theme';

/** Abre la cámara; si no hay (web) o se negó el permiso, ofrece la galería. */
export async function pickPhoto(): Promise<string | null> {
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6 };
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.granted) {
      const r = await ImagePicker.launchCameraAsync(opts);
      return r.canceled ? null : (r.assets[0]?.uri ?? null);
    }
  } catch {
    // Sin cámara disponible: seguimos con la galería.
  }
  try {
    const r = await ImagePicker.launchImageLibraryAsync(opts);
    return r.canceled ? null : (r.assets[0]?.uri ?? null);
  } catch {
    Alert.alert('No pudimos abrir la cámara', 'Revisa los permisos de la app en los ajustes del teléfono.');
    return null;
  }
}

export function PhotoSlot({
  label,
  uri,
  onChange,
  size,
}: {
  label: string;
  uri?: string;
  onChange: (uri: string) => void;
  size?: number;
}) {
  const dim = size ? { width: size, height: size } : { aspectRatio: 4 / 3, flex: 1 };
  return (
    <Pressable
      onPress={async () => {
        const u = await pickPhoto();
        if (u) onChange(u);
      }}
      accessibilityRole="button"
      accessibilityLabel={uri ? `Cambiar foto: ${label}` : `Tomar foto: ${label}`}
      style={[
        dim,
        {
          borderRadius: 10,
          borderWidth: 1.5,
          borderStyle: uri ? 'solid' : 'dashed',
          borderColor: uri ? C.ink : '#A8A29E',
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
      ]}
    >
      {uri ? (
        <>
          <Image source={{ uri }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,.55)', padding: 4 }}>
            <Txt semi style={{ color: '#fff', fontSize: 11, textAlign: 'center' }}>
              {label}
            </Txt>
          </View>
        </>
      ) : (
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Ionicons name="camera-outline" size={26} color={C.muted} />
          {size && size < 90 ? null : (
            <Txt semi style={{ fontSize: 12, color: C.muted }}>
              {label}
            </Txt>
          )}
        </View>
      )}
    </Pressable>
  );
}
