import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppButton } from '@/src/components/AppButton';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { SelectableCard } from '@/src/components/SelectableCard';
import { setGoals } from '@/src/features/onboarding/onboardingSlice';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

const asRoute = (route: string) => route as never;

const GOALS = ['Fitness', 'Coding', 'Reading', 'Business', 'Meditation', 'Nutrition', 'Career'];

export default function GoalsScreen() {
  const dispatch = useAppDispatch();
  const goals = useAppSelector((state) => state.onboarding.goals);

  const toggleGoal = (goal: string) => {
    if (goals.includes(goal)) {
      dispatch(setGoals(goals.filter((item) => item !== goal)));
    } else {
      dispatch(setGoals([...goals, goal]));
    }
  };

  return (
    <ScreenContainer>
      <Animated.View entering={FadeInDown.duration(420)} style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 1 of 3</Text>
          <Text style={styles.title}>What do you want to stay accountable for?</Text>
          <Text style={styles.subtitle}>Pick one or more goals to personalize your matches.</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardList}>
          {GOALS.map((goal) => (
            <SelectableCard
              key={goal}
              label={goal}
              selected={goals.includes(goal)}
              onPress={() => toggleGoal(goal)}
            />
          ))}
        </ScrollView>

        <AppButton
          label="Continue"
          onPress={() => router.push(asRoute('/onboarding/commitment'))}
          disabled={goals.length === 0}
        />
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 16,
  },
  header: {
    gap: 8,
    marginTop: 10,
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
  cardList: {
    paddingTop: 8,
    paddingBottom: 12,
  },
});
