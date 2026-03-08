

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMusicStore } from '@/store/myStore';
import { useThemeColor } from '@/hooks/use-theme-color';

const TABS = [
  { id: 'songs', label: 'Songs', api: 'songs' },
  { id: 'artists', label: 'Artists', api: 'artists' },
  { id: 'albums', label: 'Albums', api: 'albums' },
];

export default function SearchScreen2({ route, navigation }: any) {
  const { searchQuery } = route.params;
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const setSong = useMusicStore((state) => state.setSong);

  // --- Theme Colors ---
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secColor = useThemeColor({}, 'secondaryText');
  const accentColor = useThemeColor({}, 'accent');
  const cardColor = useThemeColor({}, 'card');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://saavn.sumit.co/api/search/${activeTab.api}?query=${searchQuery}&limit=20`
        );
        const json = await response.json();
        if (json.success) setResults(json.data.results);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [activeTab, searchQuery]);

  const renderItem = ({ item }: any) => {
    const isArtist = activeTab.id === 'artists';
    return (
      <TouchableOpacity 
        style={styles.itemRow} 
        onPress={() => {
          if (activeTab.id === 'songs') {
            setSong(item.id, { 
              name: item.name,
              duration: item.duration,
              image: item.image[item.image.length - 1].url,
              downloadUrl: item.downloadUrl[item.downloadUrl.length - 1].url,
              hasLyrics: item.hasLyrics,
              lyricsUrl: item.url,
              lyricsId: item.lyricsId,
              songId: item.id,
              isPlaying: true
            });
            navigation.navigate('PlayerScreen', { songId: item.id });
          }
        }}
      >
        <Image 
          source={{ uri: item.image?.[1]?.url }} 
          style={[styles.image, isArtist && { borderRadius: 30 }, { backgroundColor: cardColor }]} 
        />
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text numberOfLines={1} style={[styles.itemName, { color: textColor }]}>{item.name}</Text>
          <Text style={[styles.itemSub, { color: secColor }]}>{item.type.toUpperCase()}</Text>
        </View>
        {activeTab.id === 'songs' && <Ionicons name="play-circle" size={28} color={accentColor} />}
        <Ionicons name="ellipsis-vertical" size={20} color={secColor} style={{ marginLeft: 10 }} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.titleText, { color: textColor }]}>{searchQuery}</Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab.id === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tab, 
                { borderColor: isActive ? accentColor : cardColor },
                isActive && { backgroundColor: accentColor }
              ]}
            >
              <Text style={{ 
                color: isActive ? 'white' : secColor, 
                fontWeight: 'bold' 
              }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={accentColor} style={{ marginTop: 50 }} />
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Image source={require('@/assets/images/smili.png')} style={styles.emptyImg} />
          <Text style={[styles.emptyText, { color: textColor }]}>Not Found</Text>
          <Text style={[styles.emptySub, { color: secColor }]}>
            Sorry, we couldn't find results for "{searchQuery}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }} // Space for MiniPlayer
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 20, marginTop: 50 },
  titleText: { fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
  tab: { 
    paddingVertical: 8, 
    paddingHorizontal: 20, 
    borderRadius: 20, 
    marginRight: 10, 
    borderWidth: 1 
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  image: { width: 55, height: 55, borderRadius: 8 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  itemSub: { fontSize: 12, marginTop: 4 },
  emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyImg: { width: 200, height: 200, resizeMode: 'contain' },
  emptyText: { fontSize: 22, fontWeight: 'bold', marginTop: 20 },
  emptySub: { textAlign: 'center', marginTop: 10 }
});

