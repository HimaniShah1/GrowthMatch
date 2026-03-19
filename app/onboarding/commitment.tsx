import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppButton } from '@/src/components/AppButton';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { SelectableCard } from '@/src/components/SelectableCard';
import { setCommitmentLevel } from '@/src/features/onboarding/onboardingSlice';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

const asRoute = (route: string) => route as never;

const OPTIONS = [
  { value: 'exploring', subtitle: 'I might try occasionally' },
  { value: 'consistent', subtitle: '3-5x per week' },
  { value: 'serious', subtitle: 'Almost daily' },
  { value: 'extreme', subtitle: 'Never miss' },
] as const;

export default function CommitmentScreen() {
  const dispatch = useAppDispatch();
  const selected = useAppSelector((state) => state.onboarding.commitmentLevel);

  return (
    <ScreenContainer>
      <Animated.View entering={FadeInDown.duration(420)} style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 2 of 3</Text>
          <Text style={styles.title}>Choose your commitment level</Text>
          <Text style={styles.subtitle}>Set your expected consistency so we can match accordingly.</Text>
        </View>

        <View style={styles.list}>
          {OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              label={option.value}
              subtitle={option.subtitle}
              selected={selected === option.value}
              onPress={() => dispatch(setCommitmentLevel(option.value))}
            />
          ))}
        </View>

        <AppButton
          label="Continue"
          onPress={() => router.push(asRoute('/onboarding/availability'))}
          disabled={!selected}
        />
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 16,
    marginTop: 10,
  },
  header: {
    gap: 8,
  },
  step: {
    color: '#93C5FD',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    marginTop: 8,
  },
});
