import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get("window");

const Playlists = () => {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const navigation = useNavigation();

  // Theme Hooks
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secColor = useThemeColor({}, 'secondaryText');
  const accentColor = useThemeColor({}, 'accent');

  const fetchPlaylists = useCallback(async (pageNum: number) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      const response = await fetch(
        `https://saavn.sumit.co/api/search/playlists?query=Playlist&page=${pageNum}&limit=10`, 
        { signal: abortControllerRef.current.signal }
      );
      
      const json = await response.json();
      
      if (json.success) {
        setData(prev => (pageNum === 1 ? json.data.results : [...prev, ...json.data.results]));
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists(1);
    return () => abortControllerRef.current?.abort();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.playlistRow} activeOpacity={0.7}>
      <Image source={{ uri: item.image[1].url }} style={styles.playlistThumb} />
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text numberOfLines={1} style={[styles.name, { color: textColor }]}>
          {item.name}
        </Text>
        <Text style={{ color: secColor, fontSize: 13 }}>
          {item.songCount} songs • {item.language.charAt(0).toUpperCase() + item.language.slice(1)}
        </Text>
      </View>
      <Ionicons name="ellipsis-vertical" size={20} color={secColor} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Playlists</Text>
      </View>

      {/* Count Section */}
      <View style={styles.countRow}>
        <Text style={{ color: textColor, fontWeight: 'bold' }}>
          {data.length} playlists loaded
        </Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item, index) => item.id + index}
        renderItem={renderItem}
        onEndReached={() => {
          if (!loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchPlaylists(nextPage);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? (
          <ActivityIndicator color={accentColor} style={{ marginVertical: 20 }} />
        ) : null}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default React.memo(Playlists);

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: width * 0.15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    width: '100%',
    marginTop: 40 // Status bar adjustment
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  countRow: { 
    paddingHorizontal: 20, 
    marginBottom: 15 
  },
  playlistRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 20 
  },
  playlistThumb: { 
    width: 65, 
    height: 65, 
    borderRadius: 8 
  },
  name: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});