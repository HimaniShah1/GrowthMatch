import { Pressable, StyleSheet, Text, View } from 'react-native';

type SelectableCardProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  subtitle?: string;
};

export function SelectableCard({ label, selected, onPress, subtitle }: SelectableCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected ? styles.cardSelected : styles.cardDefault]}>
      <View style={styles.row}>
        <View style={[styles.dot, selected ? styles.dotSelected : styles.dotDefault]} />
        <View style={styles.textWrap}>
          <Text style={[styles.title, selected ? styles.titleSelected : styles.titleDefault]}>
            {label}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, selected ? styles.subtitleSelected : styles.subtitleDefault]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  cardDefault: {
    borderColor: '#1F2937',
    backgroundColor: '#111827',
  },
  cardSelected: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    marginTop: 2,
    borderWidth: 2,
  },
  dotDefault: {
    borderColor: '#6B7280',
    backgroundColor: 'transparent',
  },
  dotSelected: {
    borderColor: '#0F172A',
    backgroundColor: '#0F172A',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  titleDefault: {
    color: '#F9FAFB',
  },
  titleSelected: {
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
  },
  subtitleDefault: {
    color: '#9CA3AF',
  },
  subtitleSelected: {
    color: '#475569',
  },
});
