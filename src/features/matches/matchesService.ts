import { supabase } from '@/src/lib/supabase';

import type { Availability, CommitmentLevel } from '@/src/features/discovery/types';

export type MatchStatus = 'pending_commitment' | 'active' | 'ended';

export interface MatchRecord {
  id: string;
  user1: string;
  user2: string;
  status: MatchStatus;
  user1_confirmed: boolean;
  user2_confirmed: boolean;
}

export interface MatchPartner {
  id: string;
  name: string;
  city: string;
  goals: string[];
  commitment_level: CommitmentLevel | null;
  availability: Availability | null;
}

export type MatchUiState = 'pending' | 'waiting_partner' | 'active';

export interface MatchWithPartner {
  match: MatchRecord;
  partner: MatchPartner;
  currentUserConfirmed: boolean;
  partnerConfirmed: boolean;
  canConfirm: boolean;
  uiState: MatchUiState;
}

export interface MatchesResult {
  pending: MatchWithPartner[];
  active: MatchWithPartner[];
}

const profileColumns = 'id,name,city,goals,commitment_level,availability';
const matchColumns = 'id,user1,user2,status,user1_confirmed,user2_confirmed';

const getPartnerId = (match: MatchRecord, currentUserId: string) =>
  match.user1 === currentUserId ? match.user2 : match.user1;

const buildMatchView = (
  match: MatchRecord,
  partner: MatchPartner,
  currentUserId: string,
): MatchWithPartner => {
  const isUser1 = match.user1 === currentUserId;
  const currentUserConfirmed = isUser1
    ? Boolean(match.user1_confirmed)
    : Boolean(match.user2_confirmed);
  const partnerConfirmed = isUser1
    ? Boolean(match.user2_confirmed)
    : Boolean(match.user1_confirmed);

  const uiState: MatchUiState =
    match.status === 'active'
      ? 'active'
      : currentUserConfirmed
        ? 'waiting_partner'
        : 'pending';

  return {
    match,
    partner,
    currentUserConfirmed,
    partnerConfirmed,
    canConfirm: match.status === 'pending_commitment' && !currentUserConfirmed,
    uiState,
  };
};

export const loadMatchesForUser = async (
  currentUserId: string,
): Promise<MatchesResult> => {
  const { data, error } = await supabase
    .from('matches')
    .select(matchColumns)
    .or(`user1.eq.${currentUserId},user2.eq.${currentUserId}`);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as MatchRecord[];
  const scoped = rows.filter(
    (row) => row.status === 'active' || row.status === 'pending_commitment',
  );

  const partnerIds = Array.from(
    new Set(scoped.map((match) => getPartnerId(match, currentUserId))),
  );

  if (!partnerIds.length) {
    return { pending: [], active: [] };
  }

  const { data: partnerProfiles, error: partnersError } = await supabase
    .from('users')
    .select(profileColumns)
    .in('id', partnerIds);

  if (partnersError) throw new Error(partnersError.message);

  const partnerById = new Map(
    ((partnerProfiles ?? []) as MatchPartner[]).map((profile) => [profile.id, profile]),
  );

  const pending: MatchWithPartner[] = [];
  const active: MatchWithPartner[] = [];

  scoped.forEach((match) => {
    const partnerId = getPartnerId(match, currentUserId);
    const partner = partnerById.get(partnerId);
    if (!partner) return;

    const value = buildMatchView(match, partner, currentUserId);

    if (match.status === 'active') {
      active.push(value);
      return;
    }

    pending.push(value);
  });

  return {
    pending,
    active,
  };
};

export const confirmCommitment = async (
  matchId: string,
  currentUserId: string,
): Promise<MatchRecord> => {
  const { data: existingMatch, error: existingError } = await supabase
    .from('matches')
    .select(matchColumns)
    .eq('id', matchId)
    .maybeSingle<MatchRecord>();

  if (existingError) throw new Error(existingError.message);
  if (!existingMatch) throw new Error('Match not found.');

  const isUser1 = existingMatch.user1 === currentUserId;
  const isUser2 = existingMatch.user2 === currentUserId;

  if (!isUser1 && !isUser2) {
    throw new Error('Only match participants can confirm commitment.');
  }

  if (existingMatch.status === 'ended') {
    throw new Error('This match has already ended.');
  }

  if (existingMatch.status === 'active') {
    return existingMatch;
  }

  const alreadyConfirmed = isUser1
    ? existingMatch.user1_confirmed
    : existingMatch.user2_confirmed;

  let updatedMatch = existingMatch;

  if (!alreadyConfirmed) {
    const payload = isUser1
      ? { user1_confirmed: true }
      : { user2_confirmed: true };

    const updateQuery = supabase
      .from('matches')
      .update(payload)
      .eq('id', matchId)
      .eq(isUser1 ? 'user1_confirmed' : 'user2_confirmed', false)
      .select(matchColumns)
      .maybeSingle<MatchRecord>();

    const { data: firstUpdate, error: updateError } = await updateQuery;

    if (updateError) throw new Error(updateError.message);

    if (firstUpdate) {
      updatedMatch = firstUpdate;
    } else {
      const { data: latestAfterNoop, error: latestError } = await supabase
        .from('matches')
        .select(matchColumns)
        .eq('id', matchId)
        .maybeSingle<MatchRecord>();

      if (latestError) throw new Error(latestError.message);
      if (!latestAfterNoop) throw new Error('Match not found after confirmation.');

      updatedMatch = latestAfterNoop;
    }
  }

  if (
    updatedMatch.status === 'pending_commitment' &&
    updatedMatch.user1_confirmed &&
    updatedMatch.user2_confirmed
  ) {
    const { data: activated, error: activateError } = await supabase
      .from('matches')
      .update({ status: 'active' })
      .eq('id', matchId)
      .eq('status', 'pending_commitment')
      .select(matchColumns)
      .maybeSingle<MatchRecord>();

    if (activateError) throw new Error(activateError.message);

    if (activated) {
      return activated;
    }

    const { data: finalRow, error: finalError } = await supabase
      .from('matches')
      .select(matchColumns)
      .eq('id', matchId)
      .maybeSingle<MatchRecord>();

    if (finalError) throw new Error(finalError.message);
    if (!finalRow) throw new Error('Match not found after activation.');

    return finalRow;
  }

  return updatedMatch;
};
