import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { supabase } from '@/src/lib/supabase';
import type { RootState } from '@/src/store/store';

type CommitmentLevel = 'exploring' | 'consistent' | 'serious' | 'extreme';
type Availability = 'morning' | 'afternoon' | 'evening' | 'flexible';

interface OnboardingState {
  goals: string[];
  commitmentLevel: CommitmentLevel | null;
  availability: Availability | null;
  loading: boolean;
  error: string | null;
}

const initialState: OnboardingState = {
  goals: [],
  commitmentLevel: null,
  availability: null,
  loading: false,
  error: null,
};

const parseError = (error: unknown) => {
  if (!(error instanceof Error)) return 'Could not save onboarding. Please try again.';
  return error.message;
};

export const submitOnboarding = createAsyncThunk<
  void,
  void,
  { state: RootState; rejectValue: string }
>('onboarding/submitOnboarding', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const userId = state.auth.user?.id;

    if (!userId) {
      throw new Error('No authenticated user found.');
    }

    if (
      state.onboarding.goals.length === 0 ||
      !state.onboarding.commitmentLevel ||
      !state.onboarding.availability
    ) {
      throw new Error('Please complete all onboarding steps.');
    }

    const { error } = await supabase
      .from('users')
      .update({
        goals: state.onboarding.goals,
        commitment_level: state.onboarding.commitmentLevel,
        availability: state.onboarding.availability,
        onboarding_completed: true,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    return rejectWithValue(parseError(error));
  }
});

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setGoals: (state, action: PayloadAction<string[]>) => {
      state.goals = action.payload;
    },
    setCommitmentLevel: (state, action: PayloadAction<CommitmentLevel>) => {
      state.commitmentLevel = action.payload;
    },
    setAvailability: (state, action: PayloadAction<Availability>) => {
      state.availability = action.payload;
    },
    resetOnboarding: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitOnboarding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitOnboarding.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(submitOnboarding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to save onboarding.';
      });
  },
});

export const { setGoals, setCommitmentLevel, setAvailability, resetOnboarding } =
  onboardingSlice.actions;

export default onboardingSlice.reducer;
