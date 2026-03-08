import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';

// Import separated components
import Suggested from './homeScreenComponents/Suggested';
import Songs from './homeScreenComponents/Songs';
import Artists from './homeScreenComponents/Artists';
import Albums from './homeScreenComponents/Albums';
import Playlists from './homeScreenComponents/Playlists';
import { useNavigation } from '@react-navigation/native';

const TABS = ['Suggested', 'Songs', 'Artists', 'Albums', 'Playlists'];

export default function HomeScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Songs');
  const bgColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'accent');
  const secondaryText = useThemeColor({}, 'secondaryText');

  const ActiveComponent = useMemo(() => {
    switch (activeTab) {
      case 'Suggested': return <Suggested />;
      case 'Songs': return <Songs navigation = {navigation} />;
      case 'Artists': return <Artists />;
      case 'Albums': return <Albums />;
      case 'Playlists': return <Playlists />;
      default: return <Suggested />;
    }
  }, [activeTab]);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="musical-notes" size={28} color={accentColor} />
          <Text style={[styles.brandText, { color: textColor }]}>Mume</Text>
        </View>
        <TouchableOpacity onPress={
          ()=>{
            navigation.navigate("Stacks", {
        screen: 'SearchScreen1'
       
      })

          }
        }>

          <Ionicons name="search-outline" size={26} color={textColor} />

        </TouchableOpacity>
   
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabButton}>
              <Text style={[styles.tabText, { color: activeTab === tab ? accentColor : secondaryText }]}>
                {tab}
              </Text>
              {activeTab === tab && <View style={[styles.indicator, { backgroundColor: accentColor }]} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {ActiveComponent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  brandText: { fontSize: 24, fontWeight: 'bold', marginLeft: 8 },
  tabContainer: { marginVertical: 20 },
  tabButton: { paddingHorizontal: 15, alignItems: 'center' },
  tabText: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
  indicator: { height: 3, width: '100%', borderRadius: 2 }
});