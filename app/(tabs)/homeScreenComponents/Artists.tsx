import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';

const Artists = () => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const textColor = useThemeColor({}, 'text');
  const secColor = useThemeColor({}, 'secondaryText');
  const accentColor = useThemeColor({}, 'accent');

  const fetchArtists = useCallback(async (pageNum: number) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      const response = await fetch(`https://saavn.sumit.co/api/search/artists?query=artists&page=${pageNum}&limit=10`, { signal: abortControllerRef.current.signal });
      const json = await response.json();
      if (json.success) {
        setData(prev => pageNum === 1 ? json.data.results : [...prev, ...json.data.results]);
        setTotal(prev=> pageNum === 1 ? json.data.results.length : prev + json.data.results.length);
      }
    } catch (err) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchArtists(1); return () => abortControllerRef.current?.abort(); }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.countRow}><Text style={{ color: textColor, fontWeight: 'bold' }}>{total} artists</Text></View>
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <View style={styles.artistRow}>
            <Image source={{ uri: item.image[1].url }} style={styles.artistThumb} />
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={[styles.name, { color: textColor }]}>{item.name}</Text>
              <Text style={{ color: secColor }}>Artist</Text>
            </View>
            <Ionicons name="ellipsis-vertical" size={20} color={secColor} />
          </View>
        )}
        onEndReached={() => !loading && fetchArtists(data.length / 10 + 1)}
      />
    </View>
  );
};

export default React.memo(Artists);

const styles = StyleSheet.create({
  artistRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  artistThumb: { width: 60, height: 60, borderRadius: 30 },
  name: { fontSize: 16, fontWeight: 'bold' },
  countRow: { paddingHorizontal: 20, marginBottom: 15 },
});