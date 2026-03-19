import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/src/lib/supabase';
import type { AuthState } from '@/src/types/auth';

interface AuthCredentials {
  email: string;
  password: string;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

const parseAuthError = (message: string) => {
  if (!message) return 'Something went wrong. Please try again.';
  return message;
};

const normalizeUnknownError = (error: unknown) => {
  if (error instanceof TypeError && error.message.includes('Network request failed')) {
    return 'Unable to reach Supabase. Check internet access, EXPO_PUBLIC_SUPABASE_URL, and whether your Supabase project is active.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error. Please try again.';
};

export const signUpUser = createAsyncThunk<User | null, AuthCredentials, { rejectValue: string }>(
  'auth/signUpUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return rejectWithValue(parseAuthError(error.message));
      }

      return data.user;
    } catch (error) {
      return rejectWithValue(normalizeUnknownError(error));
    }
  },
);

export const signInUser = createAsyncThunk<User | null, AuthCredentials, { rejectValue: string }>(
  'auth/signInUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return rejectWithValue(parseAuthError(error.message));
      }

      return data.user;
    } catch (error) {
      return rejectWithValue(normalizeUnknownError(error));
    }
  },
);

export const signOutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/signOutUser',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return rejectWithValue(parseAuthError(error.message));
      }
    } catch (error) {
      return rejectWithValue(normalizeUnknownError(error));
    }
  },
);

export const fetchCurrentUser = createAsyncThunk<User | null, void, { rejectValue: string }>(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        return rejectWithValue(parseAuthError(error.message));
      }

      return user;
    } catch (error) {
      return rejectWithValue(normalizeUnknownError(error));
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signUpUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signUpUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Sign up failed.';
      })
      .addCase(signInUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signInUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(signInUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Sign in failed.';
      })
      .addCase(signOutUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signOutUser.fulfilled, (state) => {
        state.status = 'succeeded';
        state.user = null;
      })
      .addCase(signOutUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Sign out failed.';
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = 'failed';
        state.user = null;
        state.error = action.payload ?? 'Failed to load current user.';
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
