import { useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenContainer } from '@/src/components/ScreenContainer';
import { MatchListCard } from '@/src/features/matches/MatchCard';
import {
  confirmMatchCommitment,
  fetchMatches,
} from '@/src/features/matches/matchesSlice';
import type { MatchWithPartner } from '@/src/features/matches/matchesService';
import { supabase } from '@/src/lib/supabase';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

export default function MatchesScreen() {
  const dispatch = useAppDispatch();
  const { pending, active, loading, error, confirmingById } = useAppSelector(
    (state) => state.matches,
  );

  const allMatches = useMemo(
    () => [...pending, ...active],
    [pending, active],
  );

  useEffect(() => {
    dispatch(fetchMatches());

    const channel = supabase
      .channel('matches-pending-feed')
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

  const getButtonConfig = (item: MatchWithPartner) => {
    if (item.uiState === 'active') {
      return {
        label: 'Create Shared Goal',
        disabled: false,
        onPress: () => {
          // Shared goal flow will be wired in the next feature iteration.
        },
      };
    }

    if (item.uiState === 'waiting_partner') {
      return {
        label: 'Waiting for partner to confirm',
        disabled: true,
        onPress: undefined,
      };
    }

    return {
      label: 'Start Commitment',
      disabled: false,
      onPress: () => dispatch(confirmMatchCommitment({ matchId: item.match.id })),
    };
  };

  return (
    <ScreenContainer>
      <Animated.View entering={FadeInDown.duration(280)} style={styles.root}>
        <Text style={styles.title}>Matches</Text>
        <Text style={styles.subtitle}>Confirm together to activate your commitment.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading && allMatches.length === 0 ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color="#93C5FD" size="large" />
          </View>
        ) : (
          <FlatList
            data={allMatches}
            keyExtractor={(item) => item.match.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>No matches yet</Text>
                <Text style={styles.emptySubtitle}>
                  Right-swipe to connect. Mutual likes appear here.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const button = getButtonConfig(item);

              return (
                <MatchListCard
                  item={item}
                  buttonLabel={button.label}
                  buttonLoading={Boolean(confirmingById[item.match.id])}
                  buttonDisabled={button.disabled || Boolean(confirmingById[item.match.id])}
                  onPress={button.onPress}
                />
              );
            }}
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
