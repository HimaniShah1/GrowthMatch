import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

export const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#4F46E5",
    secondary: "#6366F1",
    background: "#F8FAFC",
  },
};

export const DarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#818CF8",
    secondary: "#6366F1",
    background: "#0F172A",
  },
};
