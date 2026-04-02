import { configureStore } from '@reduxjs/toolkit';

import authReducer from '@/src/features/auth/authSlice';
import discoveryReducer from '@/src/features/discovery/discoverySlice';
import goalsReducer from '@/src/features/goals/goalsSlice';
import matchesReducer from '@/src/features/matches/matchesSlice';
import onboardingReducer from '@/src/features/onboarding/onboardingSlice';
import swipesReducer from '@/src/features/swipes/swipesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    discovery: discoveryReducer,
    goals: goalsReducer,
    matches: matchesReducer,
    onboarding: onboardingReducer,
    swipes: swipesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
