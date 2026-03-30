import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { DiscoveryProfile } from '@/src/features/discovery/types';

import { DiscoveryCard } from './DiscoveryCard';

const SWIPE_THRESHOLD = 110;
const SCREEN_WIDTH = Dimensions.get('window').width;

type SwipeDirection = 'left' | 'right';

type SwipeDeckProps = {
  cards: DiscoveryProfile[];
  onSwipe: (card: DiscoveryProfile, direction: SwipeDirection) => Promise<boolean>;
};

export function SwipeDeck({ cards, onSwipe }: SwipeDeckProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isLocked = useSharedValue(false);

  const topCard = cards[0] ?? null;
  const nextCard = cards[1] ?? null;

  const animateBack = () => {
    translateX.value = withSpring(0, { damping: 16, stiffness: 160 });
    translateY.value = withSpring(0, { damping: 16, stiffness: 160 });
  };

  const settleSwipe = async (card: DiscoveryProfile, direction: SwipeDirection) => {
    if (isLocked.value) return;

    isLocked.value = true;
    const accepted = await onSwipe(card, direction);

    if (!accepted) {
      animateBack();
      isLocked.value = false;
      return;
    }

    const toX = direction === 'right' ? SCREEN_WIDTH * 1.3 : -SCREEN_WIDTH * 1.3;

    translateX.value = withTiming(toX, { duration: 180 }, () => {
      translateX.value = 0;
      translateY.value = 0;
      isLocked.value = false;
    });
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (isLocked.value || !topCard) return;

      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.35;
    })
    .onEnd(() => {
      if (!topCard || isLocked.value) return;

      if (Math.abs(translateX.value) < SWIPE_THRESHOLD) {
        animateBack();
        return;
      }

      const direction: SwipeDirection =
        translateX.value > 0 ? 'right' : 'left';

      runOnJS(settleSwipe)(topCard, direction);
    });

  const topCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-16, 0, 16],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const nextCardStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);

    const scale = interpolate(progress, [0, 1], [0.95, 1]);
    const opacity = interpolate(progress, [0, 1], [0.65, 1]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  if (!topCard) {
    return (
      <View style={styles.emptyDeck}>
        <Text style={styles.emptyTitle}>No profiles left</Text>
        <Text style={styles.emptySubtitle}>
          Try Explore More to load additional profiles.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.deck}>
      {nextCard ? (
        <Animated.View style={[styles.cardLayer, styles.nextLayer, nextCardStyle]}>
          <DiscoveryCard profile={nextCard} />
        </Animated.View>
      ) : null}

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.cardLayer, topCardStyle]}>
          <DiscoveryCard profile={topCard} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  deck: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLayer: {
    width: '100%',
    maxWidth: 430,
    height: '82%',
    position: 'absolute',
  },
  nextLayer: {
    top: 10,
  },
  emptyDeck: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0B1220',
    padding: 20,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 8,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
