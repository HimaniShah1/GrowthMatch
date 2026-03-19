import { configureStore } from '@reduxjs/toolkit';

import authReducer from '@/src/features/auth/authSlice';
import onboardingReducer from '@/src/features/onboarding/onboardingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    onboarding: onboardingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
