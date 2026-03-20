import React from 'react';
import { 
  View, Text, FlatList, Image, StyleSheet, 
  TouchableOpacity, SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMusicStore } from '@/store/myStore';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useNavigation } from 'expo-router';

const RecentlyPlayedScreen = () => {
  const navigation = useNavigation<any>();
  
  // --- Theme Colors ---
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secColor = useThemeColor({}, 'secondaryText');
  const accentColor = useThemeColor({}, 'accent');
  const cardColor = useThemeColor({}, 'card');

  const { SongQueue, setSong, removeFromQueue, clearQueue } = useMusicStore();

  const data = [...SongQueue].reverse();

  const handlePlay = (item: any) => {
    setSong(item.id, item.obj);
    navigation.navigate("Stacks", {
      screen: 'PlayerScreen',
      params: { songId: item.id }
    });
  };

  const renderItem = ({ item }: any) => (
    <View style={[styles.songRow, { backgroundColor: backgroundColor }]}>
      <TouchableOpacity 
        style={styles.songInfo} 
        onPress={() => handlePlay(item)}
      >
        <Image source={{ uri: item.obj.image }} style={[styles.thumb, { backgroundColor: cardColor }]} />
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text numberOfLines={1} style={[styles.songName, { color: textColor }]}>
            {item.obj.name}
          </Text>
          <Text style={{ color: secColor, fontSize: 12 }}>Song</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.deleteBtn} 
        onPress={() => removeFromQueue(item.id)}
      >
        <Ionicons name="close-circle-outline" size={24} color={secColor} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Recently Played</Text>
        
        {data.length > 0 ? (
          <TouchableOpacity onPress={clearQueue}>
            <Text style={[styles.clearText, { color: accentColor }]}>Clear All</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} /> // Space maintainer
        )}
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes-outline" size={80} color={secColor} />
          <Text style={[styles.emptyText, { color: secColor }]}>No recently played songs</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 30
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  clearText: { fontWeight: 'bold' },
  songRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20,
    paddingHorizontal: 3,
    paddingVertical: 5,
    borderRadius: 15
  },
  songInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 55, height: 55, borderRadius: 10 },
  songName: { fontSize: 16, fontWeight: '600' },
  deleteBtn: { padding: 5 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 15, fontSize: 16 }
});

export default RecentlyPlayedScreen;