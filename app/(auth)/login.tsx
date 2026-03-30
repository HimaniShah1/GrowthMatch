import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AppButton } from '@/src/components/AppButton';
import { AppInput } from '@/src/components/AppInput';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { clearAuthError, signInUser } from '@/src/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

const asRoute = (route: string) => route as never;

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    dispatch(clearAuthError());
    const result = await dispatch(signInUser({ email, password }));

    if (signInUser.fulfilled.match(result)) {
      if (result.payload.profile?.onboarding_completed) {
        router.replace(asRoute('/(tabs)/discover'));
      } else {
        router.replace(asRoute('/onboarding/goals'));
      }
    }

    setSubmitting(false);
  };

  return (
    <ScreenContainer>
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />

      <View style={styles.root}>
        <Animated.View entering={FadeInUp.duration(500)} style={styles.headerWrap}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Log in to stay accountable and keep your streak moving.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(90).duration(500)} style={styles.formCard}>
          <View style={styles.formFields}>
            <AppInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
            />

            <AppInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Enter your password"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.buttonWrap}>
              <AppButton
                label="Log In"
                onPress={onSubmit}
                loading={submitting}
                disabled={!email || !password || submitting}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(170).duration(460)} style={styles.footerRow}>
          <Text style={styles.footerText}>New to GrowthMatch?</Text>
          <Link href={'/(auth)/register' as never}>
            <Text style={styles.footerLink}>Create account</Text>
          </Link>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
  },
  bgOrbTop: {
    position: 'absolute',
    top: -120,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  bgOrbBottom: {
    position: 'absolute',
    right: -70,
    top: 180,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  headerWrap: {
    marginBottom: 28,
    gap: 10,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#9CA3AF',
  },
  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF1A',
    backgroundColor: '#0B1220',
    padding: 20,
  },
  formFields: {
    gap: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
  },
  buttonWrap: {
    marginTop: 4,
  },
  footerRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  footerLink: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
  },
});
