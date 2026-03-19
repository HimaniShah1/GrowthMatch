import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AppButton } from '@/src/components/AppButton';
import { AppInput } from '@/src/components/AppInput';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { clearAuthError, signUpUser } from '@/src/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

const asRoute = (route: string) => route as never;

export default function RegisterScreen() {
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    dispatch(clearAuthError());

    const result = await dispatch(
      signUpUser({
        email,
        password,
        name,
        city,
      }),
    );

    if (signUpUser.fulfilled.match(result)) {
      router.replace(asRoute('/onboarding/goals'));
    }

    setSubmitting(false);
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.duration(500)} style={styles.headerWrap}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start your GrowthMatch journey in under a minute.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(90).duration(500)} style={styles.formCard}>
          <View style={styles.formFields}>
            <AppInput label="Name" value={name} onChangeText={setName} placeholder="Your full name" />
            <AppInput label="City" value={city} onChangeText={setCity} placeholder="Your city" />
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
              placeholder="Choose a secure password"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.buttonWrap}>
              <AppButton
                label="Create Account"
                onPress={onSubmit}
                loading={submitting}
                disabled={!email || !password || !name || !city || submitting}
              />
            </View>
          </View>
        </Animated.View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href={'/(auth)/login' as never}>
            <Text style={styles.footerLink}>Log in</Text>
          </Link>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 28,
    paddingBottom: 24,
    gap: 20,
  },
  headerWrap: {
    gap: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 15,
    lineHeight: 22,
  },
  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF1A',
    backgroundColor: '#0B1220',
    padding: 20,
  },
  formFields: {
    gap: 14,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
  },
  buttonWrap: {
    marginTop: 8,
  },
  footerRow: {
    marginTop: 10,
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
