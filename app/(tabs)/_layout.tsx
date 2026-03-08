import React from 'react';
import { View, StyleSheet } from 'react-native'; // View add karein
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '.';
import CustomTabBar from '@/components/CustomTabs';
import settings from './Settings';
import MiniPlayer from '@/components/MiniPlayer';

import FavoritesScreen from './Favourites';
import Playlists from './Playlist';

const Tabs = createBottomTabNavigator();

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}> 
    
      <Tabs.Navigator 
        tabBar={(props) => <CustomTabBar {...props} />} 
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name='Home' component={HomeScreen} />
        <Tabs.Screen name='Favourites' component={FavoritesScreen} />
        <Tabs.Screen name='Playlist' component={Playlists} />
        <Tabs.Screen name='Settings' component={settings} />
      </Tabs.Navigator>

      
      <MiniPlayer />
    </View>
  );
}