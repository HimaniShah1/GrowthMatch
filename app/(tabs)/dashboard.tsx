import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppButton } from '@/src/components/AppButton';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { signOutUser } from '@/src/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

export default function DashboardScreen() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.auth.profile);

  return (
    <ScreenContainer>
      <Animated.View entering={FadeInDown.duration(320)} className="flex-1">
        <Text className="mb-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          GrowthMatch
        </Text>
        <Text className="mb-6 text-base text-neutral-600 dark:text-neutral-300">
          {profile?.name ? `Hi ${profile.name}, your accountability dashboard is ready.` : 'Your accountability dashboard is ready.'}
        </Text>

        <View className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">No matches yet</Text>
          <Text className="mt-1 text-neutral-600 dark:text-neutral-300">
            Discovery and swiping will be available soon.
          </Text>
        </View>

        <View className="mt-6">
          <AppButton label="Sign out" variant="secondary" onPress={() => dispatch(signOutUser())} />
        </View>
      </Animated.View>
    </ScreenContainer>
  );
}
