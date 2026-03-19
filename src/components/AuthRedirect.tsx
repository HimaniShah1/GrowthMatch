import { usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { fetchCurrentUser } from '@/src/features/auth/authSlice';
import { supabase } from '@/src/lib/supabase';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { AppSessionLoader } from '@/src/components/AppSessionLoader';

const asRoute = (route: string) => route as never;

export function AuthRedirect() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const rootNavigationState = useRootNavigationState();
  const { user, profile, loading } = useAppSelector((state) => state.auth);

  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      await dispatch(fetchCurrentUser());
      if (active) setBootstrapping(false);
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      dispatch(fetchCurrentUser());
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (bootstrapping || loading) return;

    const inAuth = pathname.startsWith('/(auth)') || pathname === '/login' || pathname === '/register';
    const inOnboarding = pathname.startsWith('/onboarding');
    const inTabs = pathname.startsWith('/(tabs)') || pathname === '/dashboard';

    if (!user) {
      if (!inAuth) {
        router.replace(asRoute('/(auth)/login'));
      }
      return;
    }

    if (!profile) {
      return;
    }

    const onboardingComplete = Boolean(profile.onboarding_completed);

    if (!onboardingComplete) {
      if (!inOnboarding) {
        router.replace(asRoute('/onboarding/goals'));
      }
      return;
    }

    if (!inTabs) {
      router.replace(asRoute('/(tabs)/dashboard'));
    }
  }, [bootstrapping, loading, pathname, profile, rootNavigationState?.key, router, user]);

  if (bootstrapping) {
    return <AppSessionLoader />;
  }

  return null;
}
