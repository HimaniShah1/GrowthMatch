import { useMemo } from 'react';
import type { ComponentProps } from 'react';
import { HelperText, TextInput } from 'react-native-paper';

type AppInputProps = ComponentProps<typeof TextInput> & {
  errorText?: string;
};

export function AppInput({ error, errorText, ...props }: AppInputProps) {
  const hasError = useMemo(() => Boolean(error || errorText), [error, errorText]);

  return (
    <>
      <TextInput mode="outlined" error={hasError} {...props} />
      {hasError ? <HelperText type="error">{errorText ?? 'Invalid value'}</HelperText> : null}
    </>
  );
}
