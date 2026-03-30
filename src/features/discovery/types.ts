export type CommitmentLevel = 'exploring' | 'consistent' | 'serious' | 'extreme';
export type Availability = 'morning' | 'afternoon' | 'evening' | 'flexible';

export interface UserProfileSummary {
  id: string;
  name: string;
  city: string;
  goals: string[];
  commitment_level: CommitmentLevel | null;
  availability: Availability | null;
}

export interface DiscoveryProfile extends UserProfileSummary {
  score: number;
  incomingLikeBoosted: boolean;
}

export interface DiscoveryBatchResult {
  profiles: DiscoveryProfile[];
  hasMore: boolean;
}
