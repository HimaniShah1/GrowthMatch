import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { RootState } from '@/src/store/store';

import {
  checkInToday,
  createSharedGoal,
  endSharedGoal,
  getGoalDashboardData,
  sendNudge as sendNudgeNotification,
  type GoalDashboardData,
  type GoalFrequency,
  type SharedGoal,
  type WeeklyTimelineDay,
} from './goalsService';

type GoalsState = {
  currentGoal: SharedGoal | null;
  checkins: WeeklyTimelineDay[];
  streak: number;
  loading: boolean;
  partnerId: string | null;
  partnerName: string | null;
  todayStatus: {
    youCompleted: boolean;
    partnerCompleted: boolean;
  };
  nudgesRemaining: number;
  checkInLoading: boolean;
  nudgeLoading: boolean;
  createLoading: boolean;
  endLoading: boolean;
  error: string | null;
};

const initialState: GoalsState = {
  currentGoal: null,
  checkins: [],
  streak: 0,
  loading: false,
  partnerId: null,
  partnerName: null,
  todayStatus: {
    youCompleted: false,
    partnerCompleted: false,
  },
  nudgesRemaining: 3,
  checkInLoading: false,
  nudgeLoading: false,
  createLoading: false,
  endLoading: false,
  error: null,
};

const applyDashboardPayload = (state: GoalsState, payload: GoalDashboardData) => {
  state.currentGoal = payload.goal;
  state.partnerId = payload.partnerId;
  state.partnerName = payload.partnerName;
  state.streak = payload.streak;
  state.checkins = payload.weekTimeline;
  state.todayStatus = payload.today;
  state.nudgesRemaining = payload.nudgesRemaining;
};

export const fetchGoal = createAsyncThunk<
  GoalDashboardData,
  { matchId: string },
  { state: RootState; rejectValue: string }
>('goals/fetchGoal', async ({ matchId }, { getState, rejectWithValue }) => {
  try {
    const currentUserId = getState().auth.user?.id;
    if (!currentUserId) {
      throw new Error('You must be logged in to view goals.');
    }

    return await getGoalDashboardData({ matchId, currentUserId });
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Unable to load goal dashboard.',
    );
  }
});

export const createGoal = createAsyncThunk<
  GoalDashboardData,
  {
    matchId: string;
    title: string;
    description?: string | null;
    frequency: GoalFrequency;
    targetPerPeriod: number;
    deadline?: string | null;
  },
  { state: RootState; rejectValue: string }
>(
  'goals/createGoal',
  async ({ matchId, title, description, frequency, targetPerPeriod, deadline }, thunkApi) => {
    try {
      const currentUserId = thunkApi.getState().auth.user?.id;
      if (!currentUserId) {
        throw new Error('You must be logged in to create a goal.');
      }

      await createSharedGoal({
        matchId,
        currentUserId,
        title,
        description,
        frequency,
        targetPerPeriod,
        deadline,
      });

      return await getGoalDashboardData({ matchId, currentUserId });
    } catch (error) {
      return thunkApi.rejectWithValue(
        error instanceof Error ? error.message : 'Unable to create goal.',
      );
    }
  },
);

export const checkIn = createAsyncThunk<
  GoalDashboardData,
  { matchId: string; goalId: string },
  { state: RootState; rejectValue: string }
>('goals/checkIn', async ({ matchId, goalId }, { getState, rejectWithValue }) => {
  try {
    const currentUserId = getState().auth.user?.id;
    if (!currentUserId) {
      throw new Error('You must be logged in to check in.');
    }

    await checkInToday({ goalId, currentUserId });
    return await getGoalDashboardData({ matchId, currentUserId });
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Check-in failed.');
  }
});

export const sendNudge = createAsyncThunk<
  GoalDashboardData,
  { matchId: string; goalId: string; partnerId: string },
  { state: RootState; rejectValue: string }
>('goals/sendNudge', async ({ matchId, goalId, partnerId }, { getState, rejectWithValue }) => {
  try {
    const currentUserId = getState().auth.user?.id;
    if (!currentUserId) {
      throw new Error('You must be logged in to send nudges.');
    }

    await sendNudgeNotification({ goalId, currentUserId, partnerId });
    return await getGoalDashboardData({ matchId, currentUserId });
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unable to send nudge.');
  }
});

export const endGoal = createAsyncThunk<
  { matchId: string },
  { matchId: string; goalId: string },
  { state: RootState; rejectValue: string }
>('goals/endGoal', async ({ matchId, goalId }, { getState, rejectWithValue }) => {
  try {
    const currentUserId = getState().auth.user?.id;
    if (!currentUserId) {
      throw new Error('You must be logged in to end a goal.');
    }

    await endSharedGoal({ goalId, currentUserId });
    return { matchId };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unable to end goal.');
  }
});

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    clearGoalsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGoal.fulfilled, (state, action) => {
        state.loading = false;
        applyDashboardPayload(state, action.payload);
      })
      .addCase(fetchGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to load goal.';
      })
      .addCase(createGoal.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createGoal.fulfilled, (state, action) => {
        state.createLoading = false;
        applyDashboardPayload(state, action.payload);
      })
      .addCase(createGoal.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload ?? 'Unable to create goal.';
      })
      .addCase(checkIn.pending, (state) => {
        state.checkInLoading = true;
        state.error = null;
      })
      .addCase(checkIn.fulfilled, (state, action) => {
        state.checkInLoading = false;
        applyDashboardPayload(state, action.payload);
      })
      .addCase(checkIn.rejected, (state, action) => {
        state.checkInLoading = false;
        state.error = action.payload ?? 'Unable to check in.';
      })
      .addCase(sendNudge.pending, (state) => {
        state.nudgeLoading = true;
        state.error = null;
      })
      .addCase(sendNudge.fulfilled, (state, action) => {
        state.nudgeLoading = false;
        applyDashboardPayload(state, action.payload);
      })
      .addCase(sendNudge.rejected, (state, action) => {
        state.nudgeLoading = false;
        state.error = action.payload ?? 'Unable to send nudge.';
      })
      .addCase(endGoal.pending, (state) => {
        state.endLoading = true;
        state.error = null;
      })
      .addCase(endGoal.fulfilled, (state) => {
        state.endLoading = false;
        state.currentGoal = null;
        state.checkins = [];
        state.streak = 0;
        state.todayStatus = {
          youCompleted: false,
          partnerCompleted: false,
        };
        state.nudgesRemaining = 3;
      })
      .addCase(endGoal.rejected, (state, action) => {
        state.endLoading = false;
        state.error = action.payload ?? 'Unable to end goal.';
      });
  },
});

export const { clearGoalsError } = goalsSlice.actions;
export default goalsSlice.reducer;
