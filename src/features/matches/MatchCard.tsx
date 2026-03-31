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
  pending: 'Start a commitment together to stay accountable',
  waiting_partner: 'Waiting for partner to confirm',
  active: 'Commitment Active',
};

const statusIconMap: Record<MatchWithPartner['uiState'], string> = {
  pending: '🤝',
  waiting_partner: '⏳',
  active: '🔥',
};

type MatchAction = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
};

export function MatchListCard({
  item,
  primaryAction,
  secondaryAction,
}: {
  item: MatchWithPartner;
  primaryAction?: MatchAction;
  secondaryAction?: MatchAction;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.partner.name}</Text>
        <Text style={styles.city}>{item.partner.city}</Text>
      </View>

      <View style={styles.statusPill}>
        <Text style={styles.statusPillText}>
          {statusIconMap[item.uiState]} {statusLabelMap[item.uiState]}
        </Text>
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

      {primaryAction || secondaryAction ? (
        <View style={styles.buttonColumn}>
          {primaryAction ? (
            <AppButton
              label={primaryAction.label}
              loading={primaryAction.loading}
              disabled={primaryAction.disabled}
              variant={primaryAction.variant ?? 'primary'}
              onPress={primaryAction.onPress ?? (() => {})}
              style={styles.button}
            />
          ) : null}

          {secondaryAction ? (
            <AppButton
              label={secondaryAction.label}
              loading={secondaryAction.loading}
              disabled={secondaryAction.disabled}
              variant={secondaryAction.variant ?? 'secondary'}
              onPress={secondaryAction.onPress ?? (() => {})}
              style={styles.button}
            />
          ) : null}
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C3A54',
    backgroundColor: '#0F172A',
    alignSelf: 'stretch',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusPillText: {
    color: '#C7D2FE',
    fontSize: 13,
    fontWeight: '600',
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
  buttonColumn: {
    marginTop: 6,
    gap: 10,
  },
  button: {
    width: '100%',
  },
});
