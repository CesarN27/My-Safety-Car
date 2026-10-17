import { Button, Host } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, tint } from '@expo/ui/swift-ui/modifiers';
import { View } from 'react-native';

import { FloatingButtonBase, type FloatingButtonProps } from './floating-button-base';
import { useNativeGlass } from './use-native-glass';
import { C } from '@/theme';

/**
 * En iOS 26+ usa el botón nativo de SwiftUI con estilo `glass` (Liquid Glass del sistema);
 * en iOS anterior o con "Reducir transparencia" se queda el botón normal.
 */
export function FloatingButton(props: FloatingButtonProps) {
  if (!useNativeGlass()) return <FloatingButtonBase {...props} />;

  return (
    <View style={{ position: 'absolute', ...props.position }}>
      <Host matchContents>
        <Button
          label={props.label}
          systemImage={props.sf as never}
          onPress={props.onPress}
          modifiers={[buttonStyle('glass'), controlSize('large'), tint(C.orange)]}
        />
      </Host>
    </View>
  );
}
