import { supabase } from '@/src/lib/supabase';

import type {
  CommitmentLevel,
  DiscoveryBatchResult,
  DiscoveryProfile,
  UserProfileSummary,
} from './types';

type SwipeDirection = 'left' | 'right';

type SwipeRow = {
  swiper_id: string;
  swiped_id: string;
  direction: SwipeDirection;
  created_at: string;
};

type MatchRow = {
  user1: string;
  user2: string;
  status: string;
};

type FetchDiscoveryOptions = {
  currentUserId: string;
  currentProfile: UserProfileSummary;
  limit: number;
  alreadyLoadedIds?: string[];
  exploreMore?: boolean;
};

const profileColumns =
  'id,name,city,goals,commitment_level,availability';

const commitmentOrder: CommitmentLevel[] = [
  'exploring',
  'consistent',
  'serious',
  'extreme',
];

const normalizeGoals = (goals: string[] | null | undefined) =>
  (goals ?? []).map((goal) => goal.trim().toLowerCase()).filter(Boolean);

const getCommitmentSimilarity = (
  current: CommitmentLevel | null,
  target: CommitmentLevel | null,
) => {
  if (!current || !target) return 0;

  const currentIndex = commitmentOrder.indexOf(current);
  const targetIndex = commitmentOrder.indexOf(target);
  if (currentIndex < 0 || targetIndex < 0) return 0;

  const delta = Math.abs(currentIndex - targetIndex);
  if (delta === 0) return 3;
  if (delta === 1) return 1;
  return 0;
};

export const computeDiscoveryScore = (
  currentProfile: UserProfileSummary,
  candidate: UserProfileSummary,
) => {
  const currentGoals = new Set(normalizeGoals(currentProfile.goals));
  const candidateGoals = normalizeGoals(candidate.goals);
  const goalOverlap = candidateGoals.reduce(
    (count, goal) => (currentGoals.has(goal) ? count + 1 : count),
    0,
  );

  const commitmentSimilarity = getCommitmentSimilarity(
    currentProfile.commitment_level,
    candidate.commitment_level,
  );

  const availabilityOverlap =
    currentProfile.availability &&
    candidate.availability &&
    currentProfile.availability === candidate.availability
      ? 1
      : 0;

  const sameCity =
    currentProfile.city.trim().toLowerCase() ===
    candidate.city.trim().toLowerCase();

  return (
    goalOverlap * 5 +
    commitmentSimilarity * 3 +
    availabilityOverlap * 2 +
    (sameCity ? 2 : 0)
  );
};

const statusIsMatch = (status: string) =>
  status === 'active' || status.startsWith('pending_commitment');

const loadExclusionSets = async (currentUserId: string) => {
  const [swipeResult, likedMeResult, matchesUser1Result, matchesUser2Result] =
    await Promise.all([
      supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', currentUserId),
      supabase
        .from('swipes')
        .select('swiper_id,created_at')
        .eq('swiped_id', currentUserId)
        .eq('direction', 'right')
        .order('created_at', { ascending: false })
        .limit(250),
      supabase
        .from('matches')
        .select('user1,user2,status')
        .eq('user1', currentUserId),
      supabase
        .from('matches')
        .select('user1,user2,status')
        .eq('user2', currentUserId),
    ]);

  if (swipeResult.error) throw new Error(swipeResult.error.message);
  if (likedMeResult.error) throw new Error(likedMeResult.error.message);
  if (matchesUser1Result.error) throw new Error(matchesUser1Result.error.message);
  if (matchesUser2Result.error) throw new Error(matchesUser2Result.error.message);

  const swipedIds = (swipeResult.data ?? []).map((row) => row.swiped_id);

  const matches = [
    ...((matchesUser1Result.data as MatchRow[] | null) ?? []),
    ...((matchesUser2Result.data as MatchRow[] | null) ?? []),
  ].filter((match) => statusIsMatch(match.status));

  const matchedPartnerIds = matches.map((match) =>
    match.user1 === currentUserId ? match.user2 : match.user1,
  );

  const incomingLikeIds = ((likedMeResult.data as SwipeRow[] | null) ?? [])
    .map((row) => row.swiper_id)
    .filter((id): id is string => Boolean(id));

  return {
    swipedIds,
    matchedPartnerIds,
    incomingLikeIds,
  };
};

const loadProfilesByIds = async (ids: string[]) => {
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('users')
    .select(profileColumns)
    .in('id', ids);

  if (error) throw new Error(error.message);

  return (data ?? []) as UserProfileSummary[];
};

const loadGeneralPool = async ({
  currentUserId,
  excludedIds,
  poolSize,
}: {
  currentUserId: string;
  excludedIds: string[];
  poolSize: number;
}) => {
  const query = supabase
    .from('users')
    .select(profileColumns)
    .neq('id', currentUserId)
    .order('id', { ascending: true })
    .limit(Math.max(poolSize * 3, 60));

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  const excludedSet = new Set(excludedIds);

  return ((data ?? []) as UserProfileSummary[])
    .filter((profile) => !excludedSet.has(profile.id))
    .slice(0, poolSize);
};

export const fetchDiscoveryBatch = async ({
  currentUserId,
  currentProfile,
  limit,
  alreadyLoadedIds = [],
  exploreMore = false,
}: FetchDiscoveryOptions): Promise<DiscoveryBatchResult> => {
  const { swipedIds, matchedPartnerIds, incomingLikeIds } =
    await loadExclusionSets(currentUserId);

  const excluded = new Set<string>([
    currentUserId,
    ...swipedIds,
    ...matchedPartnerIds,
    ...alreadyLoadedIds,
  ]);

  const orderedIncomingIds = incomingLikeIds.filter((id) => !excluded.has(id));

  const priorityProfiles = await loadProfilesByIds(orderedIncomingIds);
  const priorityById = new Map(priorityProfiles.map((profile) => [profile.id, profile]));

  const boostedProfiles = orderedIncomingIds
    .map((id) => priorityById.get(id))
    .filter((profile): profile is UserProfileSummary => Boolean(profile))
    .map((profile) => ({
      ...profile,
      score: computeDiscoveryScore(currentProfile, profile),
      incomingLikeBoosted: true,
    } satisfies DiscoveryProfile));

  boostedProfiles.forEach((profile) => excluded.add(profile.id));

  const poolSize = exploreMore ? 140 : 80;
  const generalPool = await loadGeneralPool({
    currentUserId,
    excludedIds: Array.from(excluded),
    poolSize,
  });

  const rankedGeneral = generalPool
    .map((profile) => ({
      ...profile,
      score: computeDiscoveryScore(currentProfile, profile),
      incomingLikeBoosted: false,
    }))
    .sort((a, b) => b.score - a.score);

  const combined = [...boostedProfiles, ...rankedGeneral];
  const profiles = combined.slice(0, limit);

  return {
    profiles,
    hasMore: combined.length > limit,
  };
};
