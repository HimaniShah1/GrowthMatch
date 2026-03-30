import { supabase } from '@/src/lib/supabase';

export type SwipeDirection = 'left' | 'right';

export interface SwipeResult {
  alreadySwiped: boolean;
  matchCreated: boolean;
}

type MatchRow = {
  user1: string;
  user2: string;
  status: string;
};

const toCanonicalPair = (a: string, b: string) =>
  a < b ? { user1: a, user2: b } : { user1: b, user2: a };

const loadExistingMatch = async (user1: string, user2: string) => {
  const { data, error } = await supabase
    .from('matches')
    .select('user1,user2,status')
    .eq('user1', user1)
    .eq('user2', user2)
    .maybeSingle<MatchRow>();

  if (error) throw new Error(error.message);
  return data;
};

export const recordSwipe = async ({
  swiperId,
  swipedId,
  direction,
}: {
  swiperId: string;
  swipedId: string;
  direction: SwipeDirection;
}): Promise<SwipeResult> => {
  if (swiperId === swipedId) {
    throw new Error('You cannot swipe on your own profile.');
  }

  const { data: existingSwipe, error: existingSwipeError } = await supabase
    .from('swipes')
    .select('swiper_id,swiped_id')
    .eq('swiper_id', swiperId)
    .eq('swiped_id', swipedId)
    .maybeSingle();

  if (existingSwipeError) {
    throw new Error(existingSwipeError.message);
  }

  if (existingSwipe) {
    return {
      alreadySwiped: true,
      matchCreated: false,
    };
  }

  const { error: insertSwipeError } = await supabase.from('swipes').insert({
    swiper_id: swiperId,
    swiped_id: swipedId,
    direction,
  });

  if (insertSwipeError) {
    if (insertSwipeError.code === '23505') {
      return {
        alreadySwiped: true,
        matchCreated: false,
      };
    }

    throw new Error(insertSwipeError.message);
  }

  if (direction === 'left') {
    return {
      alreadySwiped: false,
      matchCreated: false,
    };
  }

  const { data: reverseSwipe, error: reverseSwipeError } = await supabase
    .from('swipes')
    .select('swiper_id,swiped_id')
    .eq('swiper_id', swipedId)
    .eq('swiped_id', swiperId)
    .eq('direction', 'right')
    .maybeSingle();

  if (reverseSwipeError) {
    throw new Error(reverseSwipeError.message);
  }

  if (!reverseSwipe) {
    return {
      alreadySwiped: false,
      matchCreated: false,
    };
  }

  const { user1, user2 } = toCanonicalPair(swiperId, swipedId);
  const existingMatch = await loadExistingMatch(user1, user2);

  if (existingMatch) {
    return {
      alreadySwiped: false,
      matchCreated: true,
    };
  }

  const { data: insertedMatch, error: insertMatchError } = await supabase
    .from('matches')
    .insert({
      user1,
      user2,
      status: 'pending_commitment',
    })
    .select('user1,user2,status')
    .maybeSingle<MatchRow>();

  if (insertMatchError) {
    // Duplicate insert raced in parallel request; treat as match already created.
    if (insertMatchError.code === '23505') {
      return {
        alreadySwiped: false,
        matchCreated: true,
      };
    }

    throw new Error(insertMatchError.message);
  }

  return {
    alreadySwiped: false,
    matchCreated: Boolean(insertedMatch),
  };
};
