import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import PlayerScreen from './PlayerScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchScreen from './SearchScreen';
import SearchScreen1 from './SearchScreen1';
import SearchScreen2 from './SearchScreen2';
import RecentlyPlayedScreen from './RecentlyPlayedScreen';



 const Stack = createNativeStackNavigator()


export default function Stacks() {
  const colorScheme = useColorScheme();
 
  

  return (
      <Stack.Navigator>
        <Stack.Screen name="PlayerScreen" component={PlayerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SearchScreen1" component={SearchScreen1} options={{ headerShown: false }} />
                <Stack.Screen name="SearchScreen2" component={SearchScreen2} options={{ headerShown: false }} />
                <Stack.Screen name="RecentlyPlayedScreen" component={RecentlyPlayedScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
  );
}
