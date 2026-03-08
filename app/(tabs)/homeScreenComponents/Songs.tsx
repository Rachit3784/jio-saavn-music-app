import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useMusicStore } from '@/store/myStore';


const Songs = ({navigation}) => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
   const setSong = useMusicStore((state) => state.setSong);
  const textColor = useThemeColor({}, 'text');
  const secColor = useThemeColor({}, 'secondaryText');
  const accentColor = useThemeColor({}, 'accent');
 const {isPlaying, currentSong} = useMusicStore();
  const fetchSongs = useCallback(async (pageNum: number) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      const response = await fetch(
        `https://saavn.sumit.co/api/search/songs?query=Songs&page=${pageNum}&limit=10`,
        { signal: abortControllerRef.current.signal }
      );


      const json = await response.json();

      console.log("Fetched Songs:", json.data.results);

      if (json.success) {
        setData(prev => (pageNum === 1 ? json.data.results : [...prev, ...json.data.results]));
        setTotal(prev=> (pageNum === 1 ? json.data.results.length : prev + json.data.results.length));
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSongs(1);
    return () => abortControllerRef.current?.abort();
  }, []);

  const renderItem = useCallback(({ item }: any) => (
   <TouchableOpacity 
    onPress={() => {

      setSong(item.id,  { name : item.name,
  duration: item.duration,
  image : item.image[item.image.length - 1].url,
  downloadUrl: item.downloadUrl[item.downloadUrl.length - 1].url,
  hasLyrics: item.hasLyrics,
  lyricsUrl: item.url,
  lyricsId: item.lyricsId,
  songId: item.id,
  isPlaying: true
} );

      navigation.navigate("Stacks", {
        screen: 'Player',
        params: { songId: item.id }
      });

      
    }} 
    style={styles.songRow}
  >


      <Image source={{ uri: item.image[1].url }} style={styles.songThumb} />
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text numberOfLines={1} style={[styles.songTitle, { color: textColor }]}>{item.name}</Text>
        <Text numberOfLines={1} style={{ color: secColor, fontSize: 12 }}>
          {item.artists.primary[0]?.name} | {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')} mins
        </Text>
      </View>
     {isPlaying && item.id === currentSong?.id ? <Ionicons name="pause-circle-outline" size={32} color={accentColor} /> :  <Ionicons name="play-circle" size={32} color={accentColor} /> }
      <Ionicons name="ellipsis-vertical" size={20} color={secColor} style={{ marginLeft: 10 }} />
    </TouchableOpacity>
  ), [textColor, secColor, accentColor,data, navigation , isPlaying, currentSong]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.countRow}>
        <Text style={{ color: textColor, fontWeight: 'bold' }}>{total} songs</Text>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: accentColor, marginRight: 5 }}>Ascending</Text>
          <Ionicons name="swap-vertical" size={16} color={accentColor} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={data}
        keyExtractor={(item, index) => item.id + index}
        renderItem={renderItem}
        onEndReached={() => !loading && setPage(p => { fetchSongs(p + 1); return p + 1; })}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator color={accentColor} /> : null}
      />
    </View>
  );
};

export default React.memo(Songs);

const styles = StyleSheet.create({
  songRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  songThumb: { width: 60, height: 60, borderRadius: 12 },
  songTitle: { fontSize: 16, fontWeight: 'bold' },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15, alignItems: 'center' },
});