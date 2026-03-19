import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/src/lib/supabase";

interface UserProfile {
  id: string;
  name: string;
  city: string;
  goals: string[];
  commitment_level: "exploring" | "consistent" | "serious" | "extreme" | null;
  availability: "morning" | "afternoon" | "evening" | "flexible" | null;
  onboarding_completed: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  profile: UserProfile | null;
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: false,
  error: null,
  profile: null,
};

const readProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from("users")
    .select(
      "id,name,city,goals,commitment_level,availability,onboarding_completed",
    )
    .eq("id", userId)
    .maybeSingle<UserProfile>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
};

const parseError = (error: unknown) => {
  if (!(error instanceof Error))
    return "Something went wrong. Please try again.";

  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (message.includes("user already registered")) {
    return "An account with this email already exists.";
  }

  if (message.includes("password should be at least")) {
    return "Password is too short. Use at least 6 characters.";
  }

  if (message.includes("network")) {
    return "Network issue detected. Please check your internet and try again.";
  }

  return error.message;
};

// export const signUpUser = createAsyncThunk<
//   { user: User; session: Session | null; profile: UserProfile | null },
//   { email: string; password: string; name: string; city: string },
//   { rejectValue: string }
// >(
//   "auth/signUpUser",
//   async ({ email, password, name, city }, { rejectWithValue }) => {
//     try {
//       const { data, error } = await supabase.auth.signUp({
//         email: email.trim(),
//         password,
//       });

//       if (error || !data.user) {
//         throw new Error(error?.message ?? "Could not create account.");
//       }

//       const { error: insertError } = await supabase.from("users").upsert(
//         {
//           id: data.user.id,
//           name: name.trim(),
//           city: city.trim(),
//           goals: [],
//           onboarding_completed: false,
//         },
//         { onConflict: "id" },
//       );

//       if (insertError) {
//         throw new Error(insertError.message);
//       }

//       const profile = await readProfile(data.user.id);

//       return {
//         user: data.user,
//         session: data.session,
//         profile,
//       };
//     } catch (error) {
//       return rejectWithValue(parseError(error));
//     }
//   },
// );

export const signUpUser = createAsyncThunk<
  { user: User; session: Session; profile: UserProfile | null },
  { email: string; password: string; name: string; city: string },
  { rejectValue: string }
>(
  "auth/signUpUser",
  async ({ email, password, name, city }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        throw new Error(error?.message ?? "Could not create account.");
      }

      // 🔥 IMPORTANT: wait for session
      let session = data.session;

      if (!session) {
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData.session;
      }

      if (!session) {
        throw new Error("Session not available after signup. Please login.");
      }

      // 🔥 NOW safe to insert (RLS will pass)
      const { error: insertError } = await supabase.from("users").upsert({
        id: data.user.id,
        name: name.trim(),
        city: city.trim(),
        goals: [],
        onboarding_completed: false,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      const profile = await readProfile(data.user.id);

      return {
        user: data.user,
        session,
        profile,
      };
    } catch (error) {
      return rejectWithValue(parseError(error));
    }
  },
);

export const signInUser = createAsyncThunk<
  { user: User; session: Session; profile: UserProfile | null },
  { email: string; password: string },
  { rejectValue: string }
>("auth/signInUser", async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user || !data.session) {
      throw new Error(error?.message ?? "Invalid email or password.");
    }

    const profile = await readProfile(data.user.id);

    return {
      user: data.user,
      session: data.session,
      profile,
    };
  } catch (error) {
    return rejectWithValue(parseError(error));
  }
});

export const signOutUser = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("auth/signOutUser", async (_, { rejectWithValue }) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    return rejectWithValue(parseError(error));
  }
});

export const fetchCurrentUser = createAsyncThunk<
  { user: User | null; session: Session | null; profile: UserProfile | null },
  void,
  { rejectValue: string }
>("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(sessionError.message);
    }

    // Normal logged-out state: do not treat as an error.
    if (!session) {
      return {
        user: null,
        session: null,
        profile: null,
      };
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(userError.message);
    }

    const profile = user ? await readProfile(user.id) : null;

    return {
      user,
      session,
      profile,
    };
  } catch (error) {
    return rejectWithValue(parseError(error));
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signUpUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUpUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.profile = action.payload.profile;
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Sign up failed.";
      })
      .addCase(signInUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.profile = action.payload.profile;
      })
      .addCase(signInUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Sign in failed.";
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.profile = action.payload.profile;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.session = null;
        state.profile = null;
        state.error = action.payload ?? "Unable to restore session.";
      })
      .addCase(signOutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signOutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.session = null;
        state.profile = null;
      })
      .addCase(signOutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Sign out failed.";
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
