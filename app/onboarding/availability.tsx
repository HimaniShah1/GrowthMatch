import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppButton } from '@/src/components/AppButton';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { SelectableCard } from '@/src/components/SelectableCard';
import { fetchCurrentUser } from '@/src/features/auth/authSlice';
import {
  setAvailability,
  submitOnboarding,
} from '@/src/features/onboarding/onboardingSlice';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

const asRoute = (route: string) => route as never;
const OPTIONS = ['morning', 'afternoon', 'evening', 'flexible'] as const;

export default function AvailabilityScreen() {
  const dispatch = useAppDispatch();
  const { availability, loading, error } = useAppSelector((state) => state.onboarding);

  const onFinish = async () => {
    const result = await dispatch(submitOnboarding());
    if (submitOnboarding.fulfilled.match(result)) {
      await dispatch(fetchCurrentUser());
      router.replace(asRoute('/(tabs)/discover'));
    }
  };

  return (
    <ScreenContainer>
      <Animated.View entering={FadeInDown.duration(420)} style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 3 of 3</Text>
          <Text style={styles.title}>When are you most available?</Text>
          <Text style={styles.subtitle}>We will use this to recommend accountability timing.</Text>
        </View>

        <View style={styles.list}>
          {OPTIONS.map((option) => (
            <SelectableCard
              key={option}
              label={option}
              selected={availability === option}
              onPress={() => dispatch(setAvailability(option))}
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton
          label="Finish Onboarding"
          onPress={onFinish}
          loading={loading}
          disabled={!availability || loading}
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
  error: {
    color: '#FCA5A5',
    fontSize: 13,
    marginBottom: 2,
  },
});
