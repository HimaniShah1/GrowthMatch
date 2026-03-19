// import {
//   DarkTheme as NavDarkTheme,
//   DefaultTheme as NavLightTheme,
//   ThemeProvider,
// } from '@react-navigation/native';
// import { Stack } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import { Provider as ReduxProvider } from 'react-redux';
// import { useColorScheme } from 'react-native';

// import { AuthRedirect } from '@/src/components/AuthRedirect';
// import { store } from '@/src/store/store';

// export default function RootLayout() {
//   const scheme = useColorScheme();

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <ReduxProvider store={store}>
//         <ThemeProvider value={scheme === 'dark' ? NavDarkTheme : NavLightTheme}>
//           <Stack screenOptions={{ headerShown: false }}>
//             <Stack.Screen name="(auth)" />
//             <Stack.Screen name="onboarding" />
//             <Stack.Screen name="(tabs)" />
//           </Stack>
//           <AuthRedirect />
//           <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
//         </ThemeProvider>
//       </ReduxProvider>
//     </GestureHandlerRootView>
//   );
// }
import { AuthRedirect } from "@/src/components/AuthRedirect";
import { store } from "@/src/store/store";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Provider as ReduxProvider } from "react-redux";

export default function RootLayout() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <ReduxProvider store={store}>
      <Stack screenOptions={{ headerShown: false }} />
      {isMounted && <AuthRedirect />}
    </ReduxProvider>
  );
}
