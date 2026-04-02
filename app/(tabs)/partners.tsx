import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenContainer } from '@/src/components/ScreenContainer';
import { MatchListCard } from '@/src/features/matches/MatchCard';
import { endMatchThunk, fetchMatches } from '@/src/features/matches/matchesSlice';
import { supabase } from '@/src/lib/supabase';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

export default function PartnersScreen() {
  const dispatch = useAppDispatch();
  const { active, loading, error, endingById } = useAppSelector((state) => state.matches);

  useEffect(() => {
    dispatch(fetchMatches());

    const channel = supabase
      .channel('matches-active-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          dispatch(fetchMatches());
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dispatch]);

  return (
    <ScreenContainer>
      <Animated.View entering={FadeInDown.duration(280)} style={styles.root}>
        <Text style={styles.title}>Active Partners</Text>
        <Text style={styles.subtitle}>Commitments that both users have confirmed.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading && active.length === 0 ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color="#93C5FD" size="large" />
          </View>
        ) : (
          <FlatList
            data={active}
            keyExtractor={(item) => item.match.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>No active partners yet</Text>
                <Text style={styles.emptySubtitle}>
                  Move a pending match into active by confirming commitment.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <MatchListCard
                item={item}
                primaryAction={{
                  label: 'Create Shared Goal',
                  variant: 'primary',
                  onPress: () =>
                    router.push(
                      `/goals/${item.match.id}?partnerName=${encodeURIComponent(item.partner.name)}` as never,
                    ),
                }}
                secondaryAction={{
                  label: 'End Commitment',
                  variant: 'secondary',
                  loading: Boolean(endingById[item.match.id]),
                  disabled: Boolean(endingById[item.match.id]),
                  onPress: () => dispatch(endMatchThunk({ matchId: item.match.id })),
                }}
              />
            )}
          />
        )}
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 14,
    color: '#94A3B8',
    fontSize: 14,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0B1220',
    padding: 20,
    marginTop: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 8,
    color: '#94A3B8',
    textAlign: 'center',
  },
  error: {
    color: '#FCA5A5',
    fontSize: 13,
    marginBottom: 8,
  },
});
