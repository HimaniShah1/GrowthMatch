import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

type AppButtonProps = ComponentProps<typeof Button>;

export function AppButton({ mode = 'contained', contentStyle, style, ...props }: AppButtonProps) {
  return (
    <Button
      mode={mode}
      contentStyle={[styles.content, contentStyle]}
      style={[styles.button, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
  },
  content: {
    minHeight: 46,
  },
});
