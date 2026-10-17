import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** true en iOS 26+ con Liquid Glass disponible y sin "Reducir transparencia". */
export function useNativeGlass() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduce);
  }, []);
  return !reduce && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
}
