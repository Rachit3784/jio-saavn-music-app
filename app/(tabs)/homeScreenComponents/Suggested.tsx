import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  ScrollView, Text, View, FlatList, Image, 
  StyleSheet, ActivityIndicator, TouchableOpacity 
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useMusicStore } from '@/store/myStore'; 
import { useNavigation } from '@react-navigation/native';


// --- Sub-Component for Horizontal Lists ---
const HorizontalSection = ({ title, data, loading, type, onEntryPress , navigation }: any) => {
  const textColor = useThemeColor({}, 'text');
  const secColor = useThemeColor({}, 'secondaryText');

  const renderItem = ({ item }: any) => {
    const isArtist = type === 'artist';
    // API data has image array, but your Store data (SongData) has a single image string.
    // We handle both cases here:
    const imageUrl = Array.isArray(item.image) ? item.image[2]?.url : item.image;

    return (
      <TouchableOpacity 
        onPress={() => onEntryPress && onEntryPress(item)}
        style={isArtist ? styles.circleCard : styles.squareCard}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={isArtist ? styles.circleImg : styles.squareImg} 
        />
        <Text numberOfLines={1} style={[styles.cardTitle, { color: textColor }]}>
          {item.name}
        </Text>
        {!isArtist && (
          <Text numberOfLines={1} style={{ color: secColor, fontSize: 11 }}>
            {type === 'song' ? (item.artistName || 'Unknown Artist') : `${item.songCount || 0} Songs`}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
<TouchableOpacity onPress={() => {
  if(title === "Recently Played"){
navigation.navigate("Stacks", { screen: 'RecentlyPlayedScreen' }) 
  }
  } }>


    <Text style={{ color: '#FF8216' }}>See All</Text>
  </TouchableOpacity>
      </View>
      {loading && data.length === 0 ? (
        <ActivityIndicator color="#FF8216" style={{ marginVertical: 20 }} />
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={data}
          keyExtractor={(item, index) => (item.id || item.songId) + index}
          renderItem={renderItem}
          contentContainerStyle={{ paddingLeft: 20 }}
        />
      )}
    </View>
  );
};

const Suggested = () => {
  const navigation = useNavigation();
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Store Hooks ---
  const { SongQueue, setSong, currentSong } = useMusicStore();

  // --- Logic: Transform SongQueue to "Recently Played" format ---
  const recentSongs = useMemo(() => {
    return [...SongQueue]
      .reverse() // Latest first
      .slice(0, 10) // Top 10
      .map(item => ({
        ...item.obj, // Flatten the object (name, image, etc.)
        id: item.id,
        // Add artistName mapping for the UI
        artistName: item.obj.name // Note: Adjust if your SongData has an artist field
      }));
  }, [SongQueue]);

  const handlePlaySong = (item: any) => {
    // API structure mapping to your Store structure
    const songData = {
      name: item.name,
      duration: item.duration,
      image: Array.isArray(item.image) ? item.image[item.image.length - 1].url : item.image,
      downloadUrl: Array.isArray(item.downloadUrl) ? item.downloadUrl[item.downloadUrl.length - 1].url : item.downloadUrl,
      hasLyrics: item.hasLyrics || false,
      lyricsUrl: item.url || '',
      lyricsId: item.lyricsId || '',
      songId: item.id || item.songId,
      isPlaying: true
    };

    setSong(songData.songId, songData);

    navigation.navigate("Stacks", {
      screen: 'PlayerScreen',
      params: { songId: songData.songId }
    });
  };

  const fetchData = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setLoading(true);
      const [songsRes, artistsRes, playlistsRes] = await Promise.all([
        fetch('https://saavn.sumit.co/api/search/songs?query=Songs&limit=6', { signal }).then(res => res.json()),
        fetch('https://saavn.sumit.co/api/search/artists?query=Artist&limit=6', { signal }).then(res => res.json()),
        fetch('https://saavn.sumit.co/api/search/playlists?query=Playlist&limit=6', { signal }).then(res => res.json()),
      ]);

      if (songsRes.success) setSongs(songsRes.data.results);
      if (artistsRes.success) setArtists(artistsRes.data.results);
      if (playlistsRes.success) setPlaylists(playlistsRes.data.results);
    } catch (err) {
      console.log("Fetch Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => abortControllerRef.current?.abort();
  }, [fetchData]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* 1. Recently Played (From Store Queue) */}
      {recentSongs.length > 0 && (
        <HorizontalSection 
          title="Recently Played" 
          data={recentSongs} 
          loading={false} 
          type="song" 
          onEntryPress={handlePlaySong}
          navigation={navigation}
        />
      )}

      {/* 2. Fetched Data */}
      <HorizontalSection navigation={navigation} title="Top Artists" data={artists} loading={loading} type="artist" />
      <HorizontalSection navigation={navigation} title="Featured Playlists" data={playlists} loading={loading} type="playlist" />
      <HorizontalSection navigation={navigation} title="New Suggestions" data={songs} loading={loading} type="song" onEntryPress={handlePlaySong} />
      
      <View style={{ height: 120 }} /> 
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionContainer: { marginBottom: 25 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    marginBottom: 10 
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  squareCard: { width: 140, marginRight: 15 },
  squareImg: { width: 140, height: 140, borderRadius: 20, marginBottom: 8 },
  circleCard: { width: 110, marginRight: 15, alignItems: 'center' },
  circleImg: { width: 100, height: 100, borderRadius: 50, marginBottom: 8 },
  cardTitle: { fontWeight: 'bold', fontSize: 13, textAlign: 'center' }
});

export default React.memo(Suggested);