import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useSegments } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useMusicStore } from '@/store/myStore';
import { getGlobalSound } from '@/store/audioController';

export default function MiniPlayer() {
  const { currentSong, isPlaying, position, duration, togglePlayState } = useMusicStore();
  const segments = useSegments();
  const navigation = useNavigation();

  // --- Theme Colors ---
  // Yahan 'background' use kar rahe hain jo light mode mein '#fff' hai
  const playerBg = useThemeColor({}, 'background'); 
  const textColor = useThemeColor({}, 'text');
  const secColor = useThemeColor({}, 'secondaryText');
  const accentColor = useThemeColor({}, 'accent');
  const borderColor = useThemeColor({}, 'icon'); 

  const isPlayerScreen = segments.includes('PlayerScreen') || segments.includes('(stack)/PlayerScreen');
  
  if (!currentSong || isPlayerScreen) return null;

  const progress = (position / duration) * 100 || 0;

  const handleTogglePlay = async () => {
    const sound = getGlobalSound();
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      togglePlayState(false);
    } else {
      await sound.playAsync();
      togglePlayState(true);
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => navigation.navigate("Stacks", { screen: 'PlayerScreen' })} 
      style={[
        styles.container, 
        { 
          backgroundColor: playerBg, // Ab ye white dikhega light mode mein
          borderColor: `${borderColor}33` 
        }
      ]}
    >
      <View style={[styles.progressBackground, { backgroundColor: `${secColor}22` }]}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: accentColor }]} />
      </View>
      
      <View style={styles.content}>
        <Image source={{ uri: currentSong?.obj?.image }} style={styles.img} />
        <View style={styles.info}>
          <Text numberOfLines={1} style={[styles.title, { color: textColor }]}>
            {currentSong?.obj?.name}
          </Text>
          <Text numberOfLines={1} style={[styles.artist, { color: secColor }]}>
            {isPlaying ? "Now Playing" : "Paused"}
          </Text>
        </View>

        <TouchableOpacity 
          onPress={handleTogglePlay} 
          style={[styles.playBtn, { backgroundColor: `${accentColor}15` }]}
        >
          <Ionicons name={isPlaying ? "pause" : "play"} size={26} color={accentColor} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { 
    position: 'absolute', 
    bottom: Platform.OS === 'ios' ? 100 : 75, 
    left: 0, 
    right: 0, 
    borderRadius: 15, 
    height: 70, 
    
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1000,
    
   
  },
  progressBackground: { height: 3, width: '100%' },
  progressFill: { height: 3 },
  content: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, flex: 1 },
  img: { width: 48, height: 48, borderRadius: 10 },
  info: { flex: 1, marginLeft: 12 },
  title: { fontSize: 15, fontWeight: 'bold' },
  artist: { fontSize: 12, marginTop: 2 },
  playBtn: { 
    borderRadius: 25, 
    width: 45, 
    height: 45, 
    justifyContent: 'center', 
    alignItems: 'center' 
  }
});