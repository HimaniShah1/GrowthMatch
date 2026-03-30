import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { fetchMatches } from '@/src/features/matches/matchesSlice';
import type { RootState } from '@/src/store/store';

import { recordSwipe, type SwipeDirection } from './swipesService';

type SwipesState = {
  inFlightByUserId: Record<string, boolean>;
  error: string | null;
};

const initialState: SwipesState = {
  inFlightByUserId: {},
  error: null,
};

export const submitSwipe = createAsyncThunk<
  { swipedId: string; direction: SwipeDirection; matchCreated: boolean },
  { swipedId: string; direction: SwipeDirection },
  { state: RootState; rejectValue: string }
>('swipes/submitSwipe', async ({ swipedId, direction }, { getState, rejectWithValue, dispatch }) => {
  try {
    const swiperId = getState().auth.user?.id;
    if (!swiperId) {
      throw new Error('You must be logged in to swipe.');
    }

    const result = await recordSwipe({
      swiperId,
      swipedId,
      direction,
    });

    if (result.matchCreated) {
      dispatch(fetchMatches());
    }

    return {
      swipedId,
      direction,
      matchCreated: result.matchCreated,
    };
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to submit swipe.',
    );
  }
});

const swipesSlice = createSlice({
  name: 'swipes',
  initialState,
  reducers: {
    clearSwipeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitSwipe.pending, (state, action) => {
        state.error = null;
        state.inFlightByUserId[action.meta.arg.swipedId] = true;
      })
      .addCase(submitSwipe.fulfilled, (state, action) => {
        delete state.inFlightByUserId[action.payload.swipedId];
      })
      .addCase(submitSwipe.rejected, (state, action) => {
        delete state.inFlightByUserId[action.meta.arg.swipedId];
        state.error = action.payload ?? 'Swipe failed. Please try again.';
      });
  },
});

export const { clearSwipeError } = swipesSlice.actions;
export default swipesSlice.reducer;
