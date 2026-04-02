import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppButton } from '@/src/components/AppButton';
import { AppInput } from '@/src/components/AppInput';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { createGoal, fetchGoal } from '@/src/features/goals/goalsSlice';
import type { GoalFrequency } from '@/src/features/goals/goalsService';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

const asRoute = (route: string) => route as never;

const frequencyOptions: { label: string; value: GoalFrequency }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
];

export default function GoalCreationScreen() {
  const dispatch = useAppDispatch();
  const { matchId: rawMatchId, partnerName: rawPartnerName } = useLocalSearchParams<{
    matchId?: string;
    partnerName?: string;
  }>();

  const matchId = Array.isArray(rawMatchId) ? rawMatchId[0] : rawMatchId;
  const partnerName = Array.isArray(rawPartnerName) ? rawPartnerName[0] : rawPartnerName;

  const { currentGoal, loading, createLoading, error } = useAppSelector((state) => state.goals);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<GoalFrequency>('daily');
  const [targetInput, setTargetInput] = useState('1');
  const [deadlineInput, setDeadlineInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;
    dispatch(fetchGoal({ matchId }));
  }, [dispatch, matchId]);

  useEffect(() => {
    if (matchId && currentGoal?.match_id === matchId) {
      router.replace(asRoute(`/goals/${matchId}`));
    }
  }, [currentGoal, matchId]);

  const targetPerPeriod = useMemo(() => Number.parseInt(targetInput, 10), [targetInput]);

  const submit = async () => {
    if (!matchId) {
      setValidationError('Invalid match. Please reopen this screen.');
      return;
    }

    if (!title.trim()) {
      setValidationError('Goal title is required.');
      return;
    }

    if (!Number.isFinite(targetPerPeriod) || targetPerPeriod <= 0) {
      setValidationError('Target per period must be a number greater than 0.');
      return;
    }

    if (deadlineInput.trim()) {
      const validDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!validDateRegex.test(deadlineInput.trim())) {
        setValidationError('Deadline must use YYYY-MM-DD format.');
        return;
      }
    }

    setValidationError(null);

    const result = await dispatch(
      createGoal({
        matchId,
        title,
        description,
        frequency,
        targetPerPeriod,
        deadline: deadlineInput.trim() || null,
      }),
    );

    if (createGoal.fulfilled.match(result)) {
      router.replace(asRoute(`/goals/${matchId}`));
    }
  };

  if (!matchId) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={styles.error}>Unable to load goal creation. Missing match id.</Text>
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

  return (
    <ScreenContainer>
      <Animated.View entering={FadeInDown.duration(300)} style={styles.root}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Shared Goal</Text>
            <Text style={styles.subtitle}>
              Build a clear, motivating target with {partnerName || 'your partner'}.
            </Text>
          </View>

          <View style={styles.form}>
            <AppInput
              label="Goal Title"
              placeholder="Study DSA Daily"
              value={title}
              onChangeText={setTitle}
              autoCapitalize="sentences"
            />

            <AppInput
              label="Description (Optional)"
              placeholder="3 problems together every day"
              value={description}
              onChangeText={setDescription}
              autoCapitalize="sentences"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.block}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.frequencyRow}>
                {frequencyOptions.map((option) => {
                  const selected = frequency === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setFrequency(option.value)}
                      style={[styles.frequencyCard, selected && styles.frequencyCardSelected]}>
                      <Text
                        style={[
                          styles.frequencyLabel,
                          selected && styles.frequencyLabelSelected,
                        ]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <AppInput
              label="Target Per Period"
              placeholder="3"
              value={targetInput}
              onChangeText={setTargetInput}
              keyboardType="number-pad"
            />

            <AppInput
              label="Deadline (Optional)"
              placeholder="YYYY-MM-DD"
              value={deadlineInput}
              onChangeText={setDeadlineInput}
              autoCapitalize="none"
            />
          </View>

          {validationError ? <Text style={styles.error}>{validationError}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <AppButton
          label="Create Shared Goal"
          onPress={submit}
          loading={createLoading}
          disabled={createLoading}
          style={styles.button}
        />
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 10,
  },
  scrollContent: {
    paddingBottom: 16,
    gap: 18,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    gap: 8,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 31,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  block: {
    gap: 8,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '600',
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  frequencyCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    paddingVertical: 14,
    alignItems: 'center',
  },
  frequencyCardSelected: {
    borderColor: '#93C5FD',
    backgroundColor: '#172554',
  },
  frequencyLabel: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '600',
  },
  frequencyLabelSelected: {
    color: '#DBEAFE',
  },
  button: {
    width: '100%',
  },
  error: {
    color: '#FCA5A5',
    fontSize: 13,
  },
});
