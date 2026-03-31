import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenContainer } from '@/src/components/ScreenContainer';
import { MatchListCard } from '@/src/features/matches/MatchCard';
import {
  confirmMatchCommitment,
  endMatchThunk,
  fetchMatches,
} from '@/src/features/matches/matchesSlice';
import type { MatchWithPartner } from '@/src/features/matches/matchesService';
import { supabase } from '@/src/lib/supabase';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

export default function MatchesScreen() {
  const dispatch = useAppDispatch();
  const { pending, loading, error, confirmingById, endingById } = useAppSelector(
    (state) => state.matches,
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

  const getActions = (item: MatchWithPartner) => {
    const isConfirming = Boolean(confirmingById[item.match.id]);
    const isEnding = Boolean(endingById[item.match.id]);

    if (item.uiState === 'waiting_partner') {
      return {
        primaryAction: {
          label: 'Cancel Commitment',
          variant: 'secondary' as const,
          loading: isEnding,
          disabled: isEnding,
          onPress: () => dispatch(endMatchThunk({ matchId: item.match.id })),
        },
        secondaryAction: undefined,
      };
    }

    return {
      primaryAction: {
        label: 'Start Commitment',
        variant: 'primary' as const,
        loading: isConfirming,
        disabled: isConfirming || isEnding,
        onPress: () => dispatch(confirmMatchCommitment({ matchId: item.match.id })),
      },
      secondaryAction: {
        label: 'Not Interested',
        variant: 'secondary' as const,
        loading: isEnding,
        disabled: isEnding || isConfirming,
        onPress: () => dispatch(endMatchThunk({ matchId: item.match.id })),
      },
    };
  };

  const isEmpty = pending.length === 0;

  return (
    <ScreenContainer>
      <Animated.View entering={FadeInDown.duration(280)} style={styles.root}>
        <Text style={styles.title}>Matches</Text>
        <Text style={styles.subtitle}>Confirm together to activate your commitment.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading && isEmpty ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color="#93C5FD" size="large" />
          </View>
        ) : isEmpty ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptySubtitle}>
              Right-swipe to connect. Mutual likes appear here.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pending Commitments</Text>
              {pending.length === 0 ? (
                <Text style={styles.sectionEmpty}>No pending commitments.</Text>
              ) : (
                pending.map((item) => {
                  const actions = getActions(item);

                  return (
                    <MatchListCard
                      key={item.match.id}
                      item={item}
                      primaryAction={actions.primaryAction}
                      secondaryAction={actions.secondaryAction}
                    />
                  );
                })
              )}
            </View>
          </ScrollView>
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
    gap: 16,
    paddingBottom: 24,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 17,
    fontWeight: '700',
  },
  sectionEmpty: {
    color: '#94A3B8',
    fontSize: 13,
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
