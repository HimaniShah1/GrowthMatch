import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { RootState } from '@/src/store/store';

import {
  confirmCommitment,
  loadMatchesForUser,
  type MatchWithPartner,
} from './matchesService';

type MatchesState = {
  pending: MatchWithPartner[];
  active: MatchWithPartner[];
  loading: boolean;
  confirmingById: Record<string, boolean>;
  error: string | null;
};

const initialState: MatchesState = {
  pending: [],
  active: [],
  loading: false,
  confirmingById: {},
  error: null,
};

export const fetchMatches = createAsyncThunk<
  { pending: MatchWithPartner[]; active: MatchWithPartner[] },
  void,
  { state: RootState; rejectValue: string }
>('matches/fetchMatches', async (_, { getState, rejectWithValue }) => {
  try {
    const currentUserId = getState().auth.user?.id;
    if (!currentUserId) {
      throw new Error('You must be logged in to view matches.');
    }

    return await loadMatchesForUser(currentUserId);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to load matches.',
    );
  }
});

export const confirmMatchCommitment = createAsyncThunk<
  void,
  { matchId: string },
  { state: RootState; rejectValue: string }
>('matches/confirmMatchCommitment', async ({ matchId }, { getState, rejectWithValue, dispatch }) => {
  try {
    const currentUserId = getState().auth.user?.id;
    if (!currentUserId) {
      throw new Error('You must be logged in to start commitment.');
    }

    await confirmCommitment(matchId, currentUserId);
    await dispatch(fetchMatches());
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to update commitment status.',
    );
  }
});

const matchesSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    clearMatchesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading = false;
        state.pending = action.payload.pending;
        state.active = action.payload.active;
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to fetch matches.';
      })
      .addCase(confirmMatchCommitment.pending, (state, action) => {
        state.error = null;
        state.confirmingById[action.meta.arg.matchId] = true;
      })
      .addCase(confirmMatchCommitment.fulfilled, (state, action) => {
        delete state.confirmingById[action.meta.arg.matchId];
      })
      .addCase(confirmMatchCommitment.rejected, (state, action) => {
        delete state.confirmingById[action.meta.arg.matchId];
        state.error = action.payload ?? 'Unable to start commitment.';
      });
  },
});

export const { clearMatchesError } = matchesSlice.actions;
export default matchesSlice.reducer;
