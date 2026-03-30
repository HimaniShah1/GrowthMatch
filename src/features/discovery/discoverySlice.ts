import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { RootState } from '@/src/store/store';

import { fetchDiscoveryBatch } from './discoveryService';
import type { DiscoveryProfile, UserProfileSummary } from './types';

type DiscoveryState = {
  cards: DiscoveryProfile[];
  loading: boolean;
  exploring: boolean;
  initialized: boolean;
  hasMore: boolean;
  error: string | null;
};

const initialState: DiscoveryState = {
  cards: [],
  loading: false,
  exploring: false,
  initialized: false,
  hasMore: true,
  error: null,
};

const toUserSummary = (profile: RootState['auth']['profile']): UserProfileSummary | null => {
  if (!profile) return null;

  return {
    id: profile.id,
    name: profile.name,
    city: profile.city,
    goals: profile.goals,
    commitment_level: profile.commitment_level,
    availability: profile.availability,
  };
};

export const fetchInitialDiscoveryFeed = createAsyncThunk<
  { cards: DiscoveryProfile[]; hasMore: boolean },
  void,
  { state: RootState; rejectValue: string }
>('discovery/fetchInitialDiscoveryFeed', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const userId = state.auth.user?.id;
    const currentProfile = toUserSummary(state.auth.profile);

    if (!userId || !currentProfile) {
      throw new Error('User profile is not ready.');
    }

    const result = await fetchDiscoveryBatch({
      currentUserId: userId,
      currentProfile,
      limit: 10,
      alreadyLoadedIds: [],
      exploreMore: false,
    });

    return {
      cards: result.profiles,
      hasMore: result.hasMore,
    };
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Could not load discovery feed.',
    );
  }
});

export const exploreMoreDiscoveryFeed = createAsyncThunk<
  { cards: DiscoveryProfile[]; hasMore: boolean },
  void,
  { state: RootState; rejectValue: string }
>('discovery/exploreMoreDiscoveryFeed', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const userId = state.auth.user?.id;
    const currentProfile = toUserSummary(state.auth.profile);

    if (!userId || !currentProfile) {
      throw new Error('User profile is not ready.');
    }

    const result = await fetchDiscoveryBatch({
      currentUserId: userId,
      currentProfile,
      limit: 10,
      alreadyLoadedIds: state.discovery.cards.map((card) => card.id),
      exploreMore: true,
    });

    return {
      cards: result.profiles,
      hasMore: result.hasMore,
    };
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Could not load more profiles.',
    );
  }
});

const discoverySlice = createSlice({
  name: 'discovery',
  initialState,
  reducers: {
    removeCardFromFeed: (state, action: { payload: string }) => {
      state.cards = state.cards.filter((card) => card.id !== action.payload);
    },
    clearDiscoveryFeed: (state) => {
      state.cards = [];
      state.loading = false;
      state.exploring = false;
      state.hasMore = true;
      state.initialized = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialDiscoveryFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInitialDiscoveryFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.cards = action.payload.cards;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchInitialDiscoveryFeed.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.cards = [];
        state.error = action.payload ?? 'Failed to load discovery feed.';
      })
      .addCase(exploreMoreDiscoveryFeed.pending, (state) => {
        state.exploring = true;
        state.error = null;
      })
      .addCase(exploreMoreDiscoveryFeed.fulfilled, (state, action) => {
        state.exploring = false;
        state.cards = [...state.cards, ...action.payload.cards];
        state.hasMore = action.payload.hasMore;
      })
      .addCase(exploreMoreDiscoveryFeed.rejected, (state, action) => {
        state.exploring = false;
        state.error = action.payload ?? 'Failed to load additional profiles.';
      });
  },
});

export const { removeCardFromFeed, clearDiscoveryFeed } = discoverySlice.actions;
export default discoverySlice.reducer;
