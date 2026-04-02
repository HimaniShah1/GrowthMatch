import { supabase } from '@/src/lib/supabase';

import type { MatchRecord } from '@/src/features/matches/matchesService';

export type GoalFrequency = 'daily' | 'weekly';

export interface SharedGoal {
  id: string;
  match_id: string;
  title: string;
  description: string | null;
  frequency: GoalFrequency;
  target_per_period: number;
  deadline: string | null;
  created_by: string;
  created_at: string;
  is_active?: boolean;
  status?: string | null;
}

export interface Checkin {
  id: string;
  goal_id: string;
  user_id: string;
  completed: boolean;
  created_at: string;
}

export interface WeeklyTimelineDay {
  dateKey: string;
  dayLabel: string;
  youCompleted: boolean;
  partnerCompleted: boolean;
}

export interface WeekCheckinsResult {
  days: WeeklyTimelineDay[];
  streak: number;
  today: {
    youCompleted: boolean;
    partnerCompleted: boolean;
  };
}

export interface GoalContext {
  match: MatchRecord;
  partnerId: string;
  partnerName: string;
  goal: SharedGoal | null;
}

export interface GoalDashboardData {
  goal: SharedGoal | null;
  partnerId: string;
  partnerName: string;
  streak: number;
  today: {
    youCompleted: boolean;
    partnerCompleted: boolean;
  };
  weekTimeline: WeeklyTimelineDay[];
  nudgesRemaining: number;
  canNudgeToday: boolean;
}

const matchColumns = 'id,user1,user2,status,user1_confirmed,user2_confirmed';

const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const toDayKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const atStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const addDays = (date: Date, days: number) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return atStartOfDay(value);
};

const isGoalActive = (goal: SharedGoal) => {
  if (typeof goal.is_active === 'boolean') return goal.is_active;
  if (goal.status) {
    const normalized = goal.status.toLowerCase();
    if (normalized === 'inactive' || normalized === 'ended' || normalized === 'completed') {
      return false;
    }
  }
  return true;
};

const loadMatchForUser = async (
  matchId: string,
  currentUserId: string,
): Promise<{ match: MatchRecord; partnerId: string }> => {
  const { data: match, error } = await supabase
    .from('matches')
    .select(matchColumns)
    .eq('id', matchId)
    .maybeSingle<MatchRecord>();

  if (error) throw new Error(error.message);
  if (!match) throw new Error('Match not found.');

  const isUser1 = match.user1 === currentUserId;
  const isUser2 = match.user2 === currentUserId;

  if (!isUser1 && !isUser2) {
    throw new Error('Only match participants can access this goal.');
  }

  if (match.status !== 'active') {
    throw new Error('Goals can only be created for active matches.');
  }

  return {
    match,
    partnerId: isUser1 ? match.user2 : match.user1,
  };
};

const loadPartnerName = async (partnerId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('users')
    .select('name')
    .eq('id', partnerId)
    .maybeSingle<{ name: string | null }>();

  if (error) throw new Error(error.message);
  return data?.name?.trim() || 'Partner';
};

const loadActiveGoalForMatch = async (matchId: string): Promise<SharedGoal | null> => {
  const { data, error } = await supabase
    .from('shared_goals')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as SharedGoal[];
  return rows.find((goal) => isGoalActive(goal)) ?? null;
};

const getTodayRange = () => {
  const todayStart = atStartOfDay(new Date());
  const tomorrowStart = addDays(todayStart, 1);
  return {
    startIso: todayStart.toISOString(),
    endIso: tomorrowStart.toISOString(),
    todayStart,
  };
};

const getNudgesSentToday = async (partnerId: string, goalId: string): Promise<number> => {
  const { startIso, endIso } = getTodayRange();

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { head: true, count: 'exact' })
    .eq('user_id', partnerId)
    .eq('type', 'nudge')
    .eq('reference_id', goalId)
    .gte('created_at', startIso)
    .lt('created_at', endIso);

  if (error) throw new Error(error.message);
  return count ?? 0;
};

const loadAllCompletedCheckins = async (
  goalId: string,
  currentUserId: string,
  partnerId: string,
): Promise<Checkin[]> => {
  const { data, error } = await supabase
    .from('checkins')
    .select('id,goal_id,user_id,completed,created_at')
    .eq('goal_id', goalId)
    .eq('completed', true)
    .in('user_id', [currentUserId, partnerId])
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Checkin[];
};

const computeStreak = (bothCompletedDays: Set<string>, createdAt: string) => {
  const today = atStartOfDay(new Date());
  const todayKey = toDayKey(today);
  const anchor = bothCompletedDays.has(todayKey) ? today : addDays(today, -1);
  const minDate = atStartOfDay(new Date(createdAt));

  let streak = 0;
  let cursor = anchor;

  while (cursor.getTime() >= minDate.getTime()) {
    if (!bothCompletedDays.has(toDayKey(cursor))) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};

export const getSharedGoalForMatch = async (
  matchId: string,
  currentUserId: string,
): Promise<GoalContext> => {
  const { match, partnerId } = await loadMatchForUser(matchId, currentUserId);
  const [goal, partnerName] = await Promise.all([
    loadActiveGoalForMatch(matchId),
    loadPartnerName(partnerId),
  ]);

  return {
    match,
    partnerId,
    partnerName,
    goal,
  };
};

export const createSharedGoal = async ({
  matchId,
  currentUserId,
  title,
  description,
  frequency,
  targetPerPeriod,
  deadline,
}: {
  matchId: string;
  currentUserId: string;
  title: string;
  description?: string | null;
  frequency: GoalFrequency;
  targetPerPeriod: number;
  deadline?: string | null;
}): Promise<SharedGoal> => {
  await loadMatchForUser(matchId, currentUserId);
  const existing = await loadActiveGoalForMatch(matchId);

  if (existing) {
    throw new Error('An active shared goal already exists for this match.');
  }

  const payload = {
    match_id: matchId,
    title: title.trim(),
    description: description?.trim() || null,
    frequency,
    target_per_period: targetPerPeriod,
    deadline: deadline || null,
    created_by: currentUserId,
  };

  const { data, error } = await supabase
    .from('shared_goals')
    .insert(payload)
    .select('*')
    .maybeSingle<SharedGoal>();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Failed to create shared goal.');
  return data;
};

export const checkInToday = async ({
  goalId,
  currentUserId,
}: {
  goalId: string;
  currentUserId: string;
}): Promise<Checkin> => {
  const { startIso, endIso } = getTodayRange();

  const { data: existing, error: existingError } = await supabase
    .from('checkins')
    .select('id,goal_id,user_id,completed,created_at')
    .eq('goal_id', goalId)
    .eq('user_id', currentUserId)
    .gte('created_at', startIso)
    .lt('created_at', endIso)
    .eq('completed', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<Checkin>();

  if (existingError) throw new Error(existingError.message);
  if (existing) return existing;

  const { data: inserted, error: insertError } = await supabase
    .from('checkins')
    .insert({
      goal_id: goalId,
      user_id: currentUserId,
      completed: true,
    })
    .select('id,goal_id,user_id,completed,created_at')
    .maybeSingle<Checkin>();

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: latest, error: latestError } = await supabase
        .from('checkins')
        .select('id,goal_id,user_id,completed,created_at')
        .eq('goal_id', goalId)
        .eq('user_id', currentUserId)
        .gte('created_at', startIso)
        .lt('created_at', endIso)
        .eq('completed', true)
        .limit(1)
        .maybeSingle<Checkin>();

      if (latestError) throw new Error(latestError.message);
      if (latest) return latest;
    }

    throw new Error(insertError.message);
  }

  if (!inserted) throw new Error('Unable to check in right now.');
  return inserted;
};

export const getCheckinsForWeek = async ({
  goalId,
  currentUserId,
  partnerId,
  goalCreatedAt,
}: {
  goalId: string;
  currentUserId: string;
  partnerId: string;
  goalCreatedAt: string;
}): Promise<WeekCheckinsResult> => {
  const allCheckins = await loadAllCompletedCheckins(goalId, currentUserId, partnerId);

  const byUser = new Map<string, Set<string>>();
  byUser.set(currentUserId, new Set<string>());
  byUser.set(partnerId, new Set<string>());

  allCheckins.forEach((checkin) => {
    const dayKey = toDayKey(new Date(checkin.created_at));
    const targetSet = byUser.get(checkin.user_id);
    if (!targetSet) return;
    targetSet.add(dayKey);
  });

  const yourDays = byUser.get(currentUserId) ?? new Set<string>();
  const partnerDays = byUser.get(partnerId) ?? new Set<string>();
  const bothDays = new Set<string>();

  yourDays.forEach((dayKey) => {
    if (partnerDays.has(dayKey)) bothDays.add(dayKey);
  });

  const today = atStartOfDay(new Date());
  const timeline: WeeklyTimelineDay[] = [];

  for (let i = 6; i >= 0; i -= 1) {
    const day = addDays(today, -i);
    const dayKey = toDayKey(day);
    timeline.push({
      dateKey: dayKey,
      dayLabel: weekdayShort[day.getDay()],
      youCompleted: yourDays.has(dayKey),
      partnerCompleted: partnerDays.has(dayKey),
    });
  }

  const todayKey = toDayKey(today);

  return {
    days: timeline,
    streak: computeStreak(bothDays, goalCreatedAt),
    today: {
      youCompleted: yourDays.has(todayKey),
      partnerCompleted: partnerDays.has(todayKey),
    },
  };
};

export const sendNudge = async ({
  goalId,
  currentUserId,
  partnerId,
}: {
  goalId: string;
  currentUserId: string;
  partnerId: string;
}) => {
  if (currentUserId === partnerId) {
    throw new Error('Cannot nudge yourself.');
  }

  const nudgesSent = await getNudgesSentToday(partnerId, goalId);
  if (nudgesSent >= 3) {
    throw new Error('Daily nudge limit reached.');
  }

  const { startIso, endIso } = getTodayRange();
  const { data: partnerCheckin, error: checkinError } = await supabase
    .from('checkins')
    .select('id')
    .eq('goal_id', goalId)
    .eq('user_id', partnerId)
    .eq('completed', true)
    .gte('created_at', startIso)
    .lt('created_at', endIso)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (checkinError) throw new Error(checkinError.message);
  if (partnerCheckin) throw new Error('Partner already completed today.');

  const { error } = await supabase.from('notifications').insert({
    user_id: partnerId,
    type: 'nudge',
    reference_id: goalId,
    read: false,
  });

  if (error) throw new Error(error.message);

  return {
    remaining: Math.max(0, 3 - (nudgesSent + 1)),
  };
};

export const endSharedGoal = async ({
  goalId,
  currentUserId,
}: {
  goalId: string;
  currentUserId: string;
}) => {
  const { data: goal, error: goalError } = await supabase
    .from('shared_goals')
    .select('*')
    .eq('id', goalId)
    .maybeSingle<SharedGoal>();

  if (goalError) throw new Error(goalError.message);
  if (!goal) throw new Error('Goal not found.');

  const { match } = await loadMatchForUser(goal.match_id, currentUserId);
  const isParticipant = match.user1 === currentUserId || match.user2 === currentUserId;
  if (!isParticipant) throw new Error('Only match participants can end this goal.');

  const { error: isActiveError } = await supabase
    .from('shared_goals')
    .update({ is_active: false })
    .eq('id', goalId);

  if (!isActiveError) return;

  const missingIsActiveColumn =
    isActiveError.message.includes('is_active') && isActiveError.message.includes('column');

  if (!missingIsActiveColumn) {
    throw new Error(isActiveError.message);
  }

  const { error: statusError } = await supabase
    .from('shared_goals')
    .update({ status: 'inactive' })
    .eq('id', goalId);

  if (statusError) {
    throw new Error(
      'Unable to mark this goal inactive. Add `is_active` boolean or `status` column to `shared_goals`.',
    );
  }
};

export const getGoalDashboardData = async ({
  matchId,
  currentUserId,
}: {
  matchId: string;
  currentUserId: string;
}): Promise<GoalDashboardData> => {
  const context = await getSharedGoalForMatch(matchId, currentUserId);

  if (!context.goal) {
    return {
      goal: null,
      partnerId: context.partnerId,
      partnerName: context.partnerName,
      streak: 0,
      today: {
        youCompleted: false,
        partnerCompleted: false,
      },
      weekTimeline: [],
      nudgesRemaining: 3,
      canNudgeToday: true,
    };
  }

  const [weekly, sentToday] = await Promise.all([
    getCheckinsForWeek({
      goalId: context.goal.id,
      currentUserId,
      partnerId: context.partnerId,
      goalCreatedAt: context.goal.created_at,
    }),
    getNudgesSentToday(context.partnerId, context.goal.id),
  ]);

  const nudgesRemaining = Math.max(0, 3 - sentToday);

  return {
    goal: context.goal,
    partnerId: context.partnerId,
    partnerName: context.partnerName,
    streak: weekly.streak,
    today: weekly.today,
    weekTimeline: weekly.days,
    nudgesRemaining,
    canNudgeToday: !weekly.today.partnerCompleted && nudgesRemaining > 0,
  };
};
