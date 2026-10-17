import { Button, Host } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, tint } from '@expo/ui/swift-ui/modifiers';

import { GlassButtonBase, type GlassButtonProps } from './glass-button-base';
import { useNativeGlass } from './use-native-glass';
import { C } from '@/theme';

/** iOS 26+: botón nativo de SwiftUI con estilo `glass`; si no, el botón normal. */
export function GlassButton(props: GlassButtonProps) {
  if (!useNativeGlass()) return <GlassButtonBase {...props} />;
  return (
    <Host matchContents>
      <Button
        label={props.label}
        systemImage={props.sf as never}
        onPress={props.onPress}
        modifiers={[buttonStyle('glass'), controlSize('large'), tint(C.orange)]}
      />
    </Host>
  );
}
