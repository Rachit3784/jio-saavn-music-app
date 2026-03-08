import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';

const Albums = () => {
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0); // Actual total from API
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true); // Tracking if more data exists

  const textColor = useThemeColor({}, 'text');
  const secColor = useThemeColor({}, 'secondaryText');
  const accentColor = useThemeColor({}, 'accent');

const fetchAlbums = async (pageNum: number) => {
  if (loading) return;

  try {
    setLoading(true);
    const response = await fetch(
      `https://saavn.sumit.co/api/search/albums?query=albums&page=${pageNum}&limit=20`
    );
    const json = await response.json();
    
    if (json.success) {
      const newItems = json.data.results || [];
      const newItemsCount = newItems.length;

      // 1. Data update karein
      setData(prev => (pageNum === 1 ? newItems : [...prev, ...newItems]));

      // 2. Total count update karein (Latest state use karke)
      setTotalCount(prev => (pageNum === 1 ? newItemsCount : prev + newItemsCount));
      
      // 3. Check karein ki aur data hai ya nahi
      if (newItemsCount < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    }
  } catch (err: any) {
    console.error('Album Fetch Error:', err);
  } finally {
    setLoading(false);
  }
};

  // Initial Load
  useEffect(() => {
    fetchAlbums(1);
  }, []);

  const handleLoadMore = () => {
    // Check if we are already loading or if we reached the end
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchAlbums(nextPage);
    }
  };

  const renderItem = useCallback(({ item }: any) => (
    <View style={styles.row}>
      <Image source={{ uri: item.image[1]?.url }} style={styles.albumThumb} />
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text numberOfLines={1} style={[styles.title, { color: textColor }]}>{item.name}</Text>
        <Text numberOfLines={1} style={{ color: secColor, fontSize: 12 }}>
          {item.artists.primary ? item.artists.primary[0]?.name : 'Various Artists'} • {item.year}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={secColor} />
    </View>
  ), [textColor, secColor]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.countRow}>
        <Text style={{ color: textColor, fontWeight: 'bold' }}>{totalCount} total albums</Text>
        <TouchableOpacity style={styles.sortBtn}>
          <Text style={{ color: accentColor, marginRight: 5 }}>Newest</Text>
          <Ionicons name="swap-vertical" size={16} color={accentColor} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={data}
        keyExtractor={(item, index) => `${item.id}-${index}`} // Safe key
        renderItem={renderItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5} // Jab list 50% end par ho tabhi trigger ho jaye
        ListFooterComponent={loading ? <ActivityIndicator color={accentColor} style={{ margin: 20 }} /> : null}
        contentContainerStyle={{ paddingBottom: 100 }} // Extra space for miniplayer
      />
    </View>
  );
};

export default React.memo(Albums);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  albumThumb: { width: 60, height: 60, borderRadius: 10 },
  title: { fontSize: 16, fontWeight: 'bold' },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15, alignItems: 'center' },
  sortBtn: { flexDirection: 'row', alignItems: 'center' }
});