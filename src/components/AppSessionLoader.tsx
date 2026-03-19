import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export function AppSessionLoader() {
  const pulse = useSharedValue(0);
  const float = useSharedValue(0);

  pulse.value = withRepeat(
    withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
    -1,
    true,
  );

  float.value = withRepeat(
    withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
    -1,
    true,
  );

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + pulse.value * 0.55,
    transform: [{ scale: 0.96 + pulse.value * 0.06 }],
  }));

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -6 + float.value * 12 }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbOne} />
      <View style={styles.bgOrbTwo} />

      <Animated.View entering={FadeIn.duration(300)} style={[styles.stack, floatStyle]}>
        <Animated.View style={[styles.logoRing, pulseStyle]}>
          <View style={styles.logoCore} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(420)} style={styles.textWrap}>
          <Text style={styles.title}>Restoring your momentum</Text>
          <Text style={styles.subtitle}>
            Syncing your GrowthMatch session and preparing your dashboard.
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgOrbOne: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    top: 120,
    right: -80,
  },
  bgOrbTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.10)',
    bottom: 120,
    left: -70,
  },
  stack: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 28,
  },
  logoRing: {
    width: 98,
    height: 98,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#38BDF866',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 8,
  },
  logoCore: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  textWrap: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 280,
  },
});
