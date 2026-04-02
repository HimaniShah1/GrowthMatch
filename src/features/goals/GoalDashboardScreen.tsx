import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppButton } from '@/src/components/AppButton';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { checkIn, endGoal, fetchGoal, sendNudge } from '@/src/features/goals/goalsSlice';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

const asRoute = (route: string) => route as never;

const statusText = (done: boolean) => (done ? '✔ Completed' : '⏳ Pending');
const weeklyMark = (done: boolean) => (done ? '✔' : '❌');

export default function GoalDashboardScreen() {
  const dispatch = useAppDispatch();
  const { matchId: rawMatchId } = useLocalSearchParams<{ matchId?: string }>();
  const matchId = Array.isArray(rawMatchId) ? rawMatchId[0] : rawMatchId;

  const {
    currentGoal,
    checkins,
    streak,
    loading,
    error,
    partnerName,
    partnerId,
    todayStatus,
    nudgesRemaining,
    checkInLoading,
    nudgeLoading,
    endLoading,
  } = useAppSelector((state) => state.goals);

  useEffect(() => {
    if (!matchId) return;
    dispatch(fetchGoal({ matchId }));
  }, [dispatch, matchId]);

  const onCheckIn = async () => {
    if (!matchId || !currentGoal) return;
    await dispatch(checkIn({ matchId, goalId: currentGoal.id }));
  };

  const onSendNudge = async () => {
    if (!matchId || !currentGoal || !partnerId) return;
    await dispatch(
      sendNudge({
        matchId,
        goalId: currentGoal.id,
        partnerId,
      }),
    );
  };

  const onEndGoal = () => {
    if (!matchId || !currentGoal) return;

    Alert.alert(
      'End Goal',
      'This will mark the goal as inactive. You can create a new one later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Goal',
          style: 'destructive',
          onPress: async () => {
            const result = await dispatch(endGoal({ matchId, goalId: currentGoal.id }));
            if (endGoal.fulfilled.match(result)) {
              router.replace(asRoute('/partners'));
            }
          },
        },
      ],
    );
  };

  if (!matchId) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={styles.error}>Unable to load goal dashboard. Missing match id.</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (loading && !currentGoal) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color="#93C5FD" size="large" />
        </View>
      </ScreenContainer>
    );
  }

  if (!currentGoal) {
    return (
      <ScreenContainer>
        <Animated.View entering={FadeInDown.duration(250)} style={styles.emptyRoot}>
          <Text style={styles.title}>No Active Shared Goal</Text>
          <Text style={styles.subtitle}>
            Start one now with {partnerName || 'your partner'} and begin daily accountability.
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton
            label="Create Shared Goal"
            onPress={() =>
              router.push(
                asRoute(
                  `/goals/${matchId}/create?partnerName=${encodeURIComponent(
                    partnerName || 'Partner',
                  )}`,
                ),
              )
            }
          />
        </Animated.View>
      </ScreenContainer>
    );
  }

  const checkInStatusMessage = todayStatus.youCompleted
    ? 'Great consistency. You have completed your check-in today.'
    : 'Your check-in for today is still pending.';

  const nudgeStatusMessage = todayStatus.partnerCompleted
    ? `${partnerName || 'Partner'} has completed today.`
    : nudgesRemaining > 0
      ? `${nudgesRemaining} nudges left for today.`
      : 'Nudge limit reached for today.';

  const details = [
    `Frequency: ${currentGoal.frequency === 'daily' ? 'Daily' : 'Weekly'}`,
    `Target: ${currentGoal.target_per_period} per ${currentGoal.frequency === 'daily' ? 'day' : 'week'}`,
    `Deadline: ${currentGoal.deadline || 'Not set'}`,
  ];

  return (
    <ScreenContainer>
      <Animated.View entering={FadeInDown.duration(280)} style={styles.root}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.goalTitle}>{currentGoal.title}</Text>
            <Text style={styles.partnerLine}>with {partnerName || 'Partner'}</Text>
          </View>

          <View style={styles.streakCard}>
            <Text style={styles.streakValue}>🔥 {streak} Day Streak</Text>
          </View>

          <View style={styles.todayCard}>
            <Text style={styles.sectionTitle}>Today</Text>
            <View style={styles.todayGrid}>
              <View style={styles.todayCell}>
                <Text style={styles.todayHeader}>You</Text>
                <Text style={styles.todayValue}>{statusText(todayStatus.youCompleted)}</Text>
              </View>
              <View style={styles.todayCell}>
                <Text style={styles.todayHeader}>{partnerName || 'Partner'}</Text>
                <Text style={styles.todayValue}>{statusText(todayStatus.partnerCompleted)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.timelineCard}>
            <Text style={styles.sectionTitle}>Weekly Progress Timeline</Text>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineColHeader}>Day</Text>
              <Text style={styles.timelineColHeader}>You</Text>
              <Text style={styles.timelineColHeader}>{partnerName || 'Partner'}</Text>
            </View>
            {checkins.map((day) => (
              <View key={day.dateKey} style={styles.timelineRow}>
                <Text style={styles.timelineDay}>{day.dayLabel}</Text>
                <Text style={styles.timelineMark}>{weeklyMark(day.youCompleted)}</Text>
                <Text style={styles.timelineMark}>{weeklyMark(day.partnerCompleted)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Goal Details</Text>
            {currentGoal.description ? (
              <Text style={styles.description}>{currentGoal.description}</Text>
            ) : null}
            {details.map((line) => (
              <Text key={line} style={styles.detailLine}>
                {line}
              </Text>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.actionColumn}>
          <Text style={styles.statusMessage}>{checkInStatusMessage}</Text>
          <AppButton
            label={todayStatus.youCompleted ? '✔ Completed today' : 'Check In Today'}
            onPress={onCheckIn}
            disabled={todayStatus.youCompleted || checkInLoading}
            loading={checkInLoading}
            style={styles.fullButton}
          />

          <Text style={styles.statusMessage}>{nudgeStatusMessage}</Text>
          <AppButton
            label={todayStatus.partnerCompleted ? 'Partner completed today' : 'Nudge Partner'}
            onPress={onSendNudge}
            disabled={todayStatus.partnerCompleted || nudgesRemaining <= 0 || nudgeLoading}
            loading={nudgeLoading}
            variant="secondary"
            style={styles.fullButton}
          />

          <AppButton
            label="End Goal"
            onPress={onEndGoal}
            loading={endLoading}
            disabled={endLoading}
            variant="secondary"
            style={styles.fullButton}
          />
        </View>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyRoot: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 10,
  },
  header: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0B1220',
    padding: 16,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  goalTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  partnerLine: {
    marginTop: 4,
    color: '#93C5FD',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
  streakCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#78350F',
    backgroundColor: '#1C1917',
    padding: 20,
    alignItems: 'center',
  },
  streakValue: {
    color: '#FDBA74',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  todayCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0B1325',
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '700',
  },
  todayGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  todayCell: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#0F172A',
    gap: 8,
  },
  todayHeader: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  todayValue: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  timelineCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0B1220',
    padding: 16,
    gap: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  timelineColHeader: {
    color: '#94A3B8',
    fontSize: 12,
    width: '33%',
    textAlign: 'center',
    fontWeight: '700',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  timelineDay: {
    width: '33%',
    color: '#E2E8F0',
    textAlign: 'center',
    fontWeight: '700',
  },
  timelineMark: {
    width: '33%',
    color: '#F8FAFC',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  detailsCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0B1220',
    padding: 16,
    gap: 8,
  },
  description: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
  },
  detailLine: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  actionColumn: {
    gap: 8,
    paddingBottom: 2,
  },
  statusMessage: {
    color: '#94A3B8',
    fontSize: 13,
  },
  fullButton: {
    width: '100%',
  },
  error: {
    color: '#FCA5A5',
    fontSize: 13,
  },
});
