import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Stacks from './(Stacks)/_layout';
import TabLayout from './(tabs)/_layout';
import ModalScreen from './modal';

export const unstable_settings = {
  anchor: '(tabs)',
};

const Stack = createNativeStackNavigator();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="tabs" component={TabLayout} options={{ headerShown: false }} />
        <Stack.Screen name="Stacks" component={Stacks} options={{ headerShown: false }} />
        <Stack.Screen name="modal" component={ModalScreen} options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
