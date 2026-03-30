import { StyleSheet, Text, View } from 'react-native';

import type { DiscoveryProfile } from '@/src/features/discovery/types';

const commitmentLabel: Record<string, string> = {
  exploring: 'Exploring',
  consistent: 'Consistent',
  serious: 'Serious',
  extreme: 'Extreme',
};

const availabilityLabel: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  flexible: 'Flexible',
};

export function DiscoveryCard({ profile }: { profile: DiscoveryProfile }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.city}>{profile.city}</Text>
        </View>
        {profile.incomingLikeBoosted ? (
          <View style={styles.boostBadge}>
            <Text style={styles.boostText}>Liked You</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Goals</Text>
        <View style={styles.chipWrap}>
          {profile.goals.length ? (
            profile.goals.map((goal) => (
              <View key={goal} style={styles.chip}>
                <Text style={styles.chipText}>{goal}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No goals shared yet</Text>
          )}
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Commitment</Text>
          <Text style={styles.metaValue}>
            {profile.commitment_level
              ? commitmentLabel[profile.commitment_level]
              : 'Not set'}
          </Text>
        </View>

        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Availability</Text>
          <Text style={styles.metaValue}>
            {profile.availability ? availabilityLabel[profile.availability] : 'Not set'}
          </Text>
        </View>
      </View>

      <View style={styles.hintRow}>
        <Text style={styles.hint}>Swipe right to connect</Text>
        <Text style={styles.score}>Score {profile.score}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 28,
    padding: 22,
    shadowColor: '#020617',
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  name: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  city: {
    color: '#94A3B8',
    fontSize: 15,
    marginTop: 4,
  },
  boostBadge: {
    backgroundColor: '#16313F',
    borderColor: '#2563EB',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  boostText: {
    color: '#BFDBFE',
    fontSize: 12,
    fontWeight: '700',
  },
  block: {
    marginTop: 20,
  },
  blockTitle: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 9,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#111B31',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  metaCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#24314A',
    backgroundColor: '#0F172A',
    padding: 12,
  },
  metaLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  metaValue: {
    color: '#F1F5F9',
    marginTop: 4,
    fontSize: 15,
    fontWeight: '700',
  },
  hintRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hint: {
    color: '#94A3B8',
    fontSize: 13,
  },
  score: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
});
