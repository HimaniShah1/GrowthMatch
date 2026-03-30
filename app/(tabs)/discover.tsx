import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppButton } from '@/src/components/AppButton';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import {
  exploreMoreDiscoveryFeed,
  fetchInitialDiscoveryFeed,
  removeCardFromFeed,
} from '@/src/features/discovery/discoverySlice';
import { SwipeDeck } from '@/src/features/discovery/components/SwipeDeck';
import { submitSwipe } from '@/src/features/swipes/swipesSlice';
import { signOutUser } from '@/src/features/auth/authSlice';
import { fetchMatches } from '@/src/features/matches/matchesSlice';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

export default function DiscoverScreen() {
  const dispatch = useAppDispatch();

  const { cards, loading, exploring, error, initialized, hasMore } = useAppSelector(
    (state) => state.discovery,
  );
  const swipeError = useAppSelector((state) => state.swipes.error);

  useEffect(() => {
    dispatch(fetchInitialDiscoveryFeed());
    dispatch(fetchMatches());
  }, [dispatch]);

  return (
    <ScreenContainer>
      <Animated.View entering={FadeInDown.duration(280)} style={styles.root}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Discover</Text>
            <Text style={styles.subtitle}>Up to 10 recommended profiles each day.</Text>
          </View>

          <Pressable onPress={() => dispatch(signOutUser())} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {swipeError ? <Text style={styles.error}>{swipeError}</Text> : null}

        {loading && !initialized ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#93C5FD" size="large" />
            <Text style={styles.loadingText}>Loading your feed...</Text>
          </View>
        ) : (
          <SwipeDeck
            cards={cards}
            onSwipe={async (card, direction) => {
              const result = await dispatch(
                submitSwipe({
                  swipedId: card.id,
                  direction,
                }),
              );

              if (submitSwipe.fulfilled.match(result)) {
                dispatch(removeCardFromFeed(card.id));
                return true;
              }

              return false;
            }}
          />
        )}

        {initialized && cards.length === 0 ? (
          <View style={styles.footer}>
            <AppButton
              label={hasMore ? 'Explore More' : 'Refresh Feed'}
              loading={exploring}
              onPress={() => {
                if (hasMore) {
                  dispatch(exploreMoreDiscoveryFeed());
                  return;
                }

                dispatch(fetchInitialDiscoveryFeed());
              }}
            />
          </View>
        ) : null}
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },
  signOutBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signOutText: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 12,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#94A3B8',
  },
  error: {
    color: '#FCA5A5',
    fontSize: 13,
  },
  footer: {
    marginTop: 4,
  },
});
