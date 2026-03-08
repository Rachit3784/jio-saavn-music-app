import React from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMusicStore } from '@/store/myStore';
import { useThemeColor } from '@/hooks/use-theme-color';

const { width } = Dimensions.get("window");

export default function FavoritesScreen({ navigation }: any) {
  const { favorites, setSong, currentSong, isPlaying } = useMusicStore();

  // Dynamic Theme Colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secColor = useThemeColor({}, 'secondaryText');
  const accentColor = useThemeColor({}, 'accent'); // Uses #FF8216 from your config

  const renderItem = ({ item }: { item: any }) => {
    const isActive = currentSong?.id === item.id;
    return (
      <TouchableOpacity 
        style={styles.songRow} 
        onPress={() => {
          setSong(item.id, item.obj);
          navigation.navigate("Stacks", { 
            screen: 'Player', 
            params: { songId: item.id } 
          });
        }}
      >
        <Image source={{ uri: item.obj.image }} style={styles.songThumb} />
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text numberOfLines={1} style={[styles.songTitle, { color: textColor }]}>
            {item.obj.name}
          </Text>
          <Text style={{ color: secColor, fontSize: 12 }}>
            Song • {Math.floor(item.obj.duration / 60)}:{(item.obj.duration % 60).toString().padStart(2, '0')} mins
          </Text>
        </View>
        <Ionicons 
          name={isActive && isPlaying ? "pause-circle" : "play-circle"} 
          size={32} 
          color={accentColor} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Favourite Songs</Text>
      </View>

      {/* Content */}
      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={80} color={secColor} />
          <Text style={{ color: secColor, marginTop: 10 }}>No favorite songs yet!</Text>
        </View>
      ) : (
        <FlatList 
          data={favorites} 
          keyExtractor={(item) => item.id} 
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: width * 0.12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    width: '100%',
    marginTop: 40 // Safe area adjustment
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100 // Extra space for player mini-bar if needed
  },
  songRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  songThumb: { 
    width: 55, 
    height: 55, 
    borderRadius: 10 
  },
  songTitle: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  empty: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingBottom: 100
  }
});