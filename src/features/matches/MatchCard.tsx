import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/src/components/AppButton';

import type { MatchWithPartner } from './matchesService';

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

const statusLabelMap: Record<MatchWithPartner['uiState'], string> = {
  pending: 'Pending Confirmation',
  waiting_partner: 'Waiting for partner to confirm',
  active: 'Commitment Active',
};

export function MatchListCard({
  item,
  buttonLabel,
  buttonLoading,
  buttonDisabled,
  onPress,
}: {
  item: MatchWithPartner;
  buttonLabel?: string;
  buttonLoading?: boolean;
  buttonDisabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.partner.name}</Text>
        <Text style={styles.city}>{item.partner.city}</Text>
      </View>

      <View style={styles.statusPill}>
        <Text style={styles.statusPillText}>{statusLabelMap[item.uiState]}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Commitment:</Text>
        <Text style={styles.detailValue}>
          {item.partner.commitment_level
            ? commitmentLabel[item.partner.commitment_level]
            : 'Not set'}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Availability:</Text>
        <Text style={styles.detailValue}>
          {item.partner.availability
            ? availabilityLabel[item.partner.availability]
            : 'Not set'}
        </Text>
      </View>

      <Text style={styles.goals}>{item.partner.goals.join(' • ') || 'No goals listed yet'}</Text>

      {onPress ? (
        <View style={styles.buttonWrap}>
          <AppButton
            label={buttonLabel ?? 'Start Commitment'}
            loading={buttonLoading}
            disabled={buttonDisabled}
            onPress={onPress}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0B1220',
    padding: 16,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: '#F8FAFC',
    fontSize: 21,
    fontWeight: '700',
  },
  city: {
    color: '#94A3B8',
    fontSize: 14,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    color: '#C7D2FE',
    fontSize: 12,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 6,
  },
  detailLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  detailValue: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  goals: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
  },
  buttonWrap: {
    marginTop: 6,
  },
});
