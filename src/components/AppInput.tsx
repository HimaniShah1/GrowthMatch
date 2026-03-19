import { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

type AppInputProps = TextInputProps & {
  label: string;
  error?: string | null;
};

export function AppInput({ label, error, style, onFocus, onBlur, ...props }: AppInputProps) {
  const [focused, setFocused] = useState(false);

  const inputStyle = useMemo(() => {
    if (error) return [styles.input, styles.errorInput, style];
    if (focused) return [styles.input, styles.focusedInput, style];
    return [styles.input, style];
  }, [error, focused, style]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        style={inputStyle}
        placeholderTextColor="#6B7280"
        selectionColor="#FFFFFF"
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 8,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFFFFF1A',
    backgroundColor: '#111827',
    color: '#F9FAFB',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  focusedInput: {
    borderColor: '#FFFFFF99',
    backgroundColor: '#1F2937',
  },
  errorInput: {
    borderColor: '#F87171',
  },
  error: {
    color: '#FCA5A5',
    fontSize: 12,
  },
});
