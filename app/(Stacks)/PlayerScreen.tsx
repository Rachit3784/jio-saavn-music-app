// import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
// import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, ActivityIndicator } from 'react-native';
// import Slider from '@react-native-community/slider';
// import { Ionicons, Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
// import { useMusicStore } from '@/store/myStore';
// import { Audio ,InterruptionModeAndroid} from 'expo-av';
// import { useNavigation } from 'expo-router';
// import { getGlobalSound, setGlobalSound, getLastLoadedId, setLastLoadedId } from '@/store/audioController';
// import { useThemeColor } from '@/hooks/use-theme-color';

// const { width } = Dimensions.get('window');

// export default function PlayerScreen() {
//   const navigation = useNavigation();
//   const { currentSong, isPlaying, position, duration, favorites, toggleFavorite, updatePlayback, nextSong, prevSong, togglePlayState } = useMusicStore();
//   const [loading, setLoading] = useState(false);
//   const loadedSongId = useRef<string | null>(null);

//   const backgroundColor = useThemeColor({}, 'background');
// const textColor = useThemeColor({}, 'text');
// const secColor = useThemeColor({}, 'secondaryText');
// const accentColor = useThemeColor({}, 'accent');

//   const onPlaybackStatusUpdate = useCallback((status: any) => {
//     if (status.isLoaded) {
//       updatePlayback(status.positionMillis, status.durationMillis || 0, status.isPlaying);
//       if (status.didJustFinish) nextSong();
//     }
//   }, [nextSong, updatePlayback]);

// const isFav = useMemo(()=>{
//   return favorites.some(f => f.id === currentSong?.id);
// }, [favorites, currentSong?.id]);

// useEffect(() => {
//   const setupAudio = async () => {
//     if (!currentSong?.id) return;

//     // --- ANDROID BACKGROUND CONFIGURATION ---
//     try {
//       await Audio.setAudioModeAsync({
//         staysActiveInBackground: true, // Key for background play
//         shouldDuckAndroid: true,       // Lowers volume during notifications
//         interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
//         playThroughEarpieceAndroid: false,
//       });
//     } catch (e) {
//       console.log("Error setting audio mode", e);
//     }

//     const existingSound = getGlobalSound();
//     const hardwareId = getLastLoadedId();

//     if (existingSound && hardwareId === currentSong.id) {
//       existingSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
//       return;
//     }

//     // New Song Logic
//     try {
//       setLoading(true);
//       if (existingSound) {
//         await existingSound.unloadAsync();
//         setGlobalSound(null);
//         setLastLoadedId(null);
//       }

//       const { sound: newSound } = await Audio.Sound.createAsync(
//         { uri: currentSong.obj.downloadUrl },
//         {
//           shouldPlay: true,
//           progressUpdateIntervalMillis: 500,
//           // Stay awake keeps the CPU from sleeping while music plays
//           stayActiveInBackground: true
//         },
//         onPlaybackStatusUpdate
//       );

//       setGlobalSound(newSound);
//       setLastLoadedId(currentSong.id);
//     } catch (error) {
//       console.error("Audio Load Error:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   setupAudio();
// }, [currentSong?.id]);

//   const togglePlay = async () => {
//     const sound = getGlobalSound();
//     if (!sound) return;
//     if (isPlaying) {
//       await sound.pauseAsync();
//       togglePlayState(false);
//     } else {
//       await sound.playAsync();
//       togglePlayState(true);
//     }
//   };

//   const seek = async (val: number) => {
//     const sound = getGlobalSound();
//     if (sound) await sound.setPositionAsync(val);
//   };

//   const jump = async (millis: number) => {
//     const sound = getGlobalSound();
//     if (sound) await sound.setPositionAsync(Math.max(0, position + millis));
//   };

//   const formatTime = (ms: number) => {
//     const totalSec = Math.floor(ms / 1000);
//     const m = Math.floor(totalSec / 60);
//     const s = totalSec % 60;
//     return `${m}:${s < 10 ? '0' : ''}${s}`;
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.topBar}>
//         <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-down" size={30} color="white" /></TouchableOpacity>
//         <Text style={styles.headerText}>NOW PLAYING</Text>
//         <Entypo name="dots-three-horizontal" size={24} color="white" />
//       </View>

//       <View style={styles.artContainer}>
//         <Image source={{ uri: currentSong?.obj.image }} style={styles.albumArt} />
//         {loading && <ActivityIndicator style={StyleSheet.absoluteFill} color="#FF8C00" />}
//       </View>

//       <View style={styles.metaContainer}>
//         <View style={{ flex: 1 }}>
//           <Text numberOfLines={1} style={styles.title}>{currentSong?.obj.name}</Text>
//           <Text style={styles.artist}>Playing from Queue</Text>
//         </View>
//        <TouchableOpacity
//   onPress={() => currentSong && toggleFavorite(currentSong)}
//   activeOpacity={0.7}
// >
//   <Ionicons
//     name={isFav ? "heart" : "heart-outline"}
//     size={28}
//     color={isFav ? "#FF8C00" : "white"}
//   />
// </TouchableOpacity>
//       </View>

//       <View style={styles.progressContainer}>
//         <Slider
//           style={styles.slider}
//           minimumValue={0}
//           maximumValue={duration || 1}
//           value={position}
//           minimumTrackTintColor="#FF8C00"
//           maximumTrackTintColor="#333"
//           thumbTintColor="#FF8C00"
//           onSlidingComplete={seek}
//         />
//         <View style={styles.timeRow}>
//           <Text style={styles.timeText}>{formatTime(position)}</Text>
//           <Text style={styles.timeText}>{formatTime(duration)}</Text>
//         </View>
//       </View>

//       <View style={styles.controlsRow}>
//         <TouchableOpacity onPress={prevSong}><Ionicons name="play-skip-back" size={32} color="white" /></TouchableOpacity>
//         <TouchableOpacity onPress={() => jump(-10000)}><MaterialCommunityIcons name="rewind-10" size={35} color="white" /></TouchableOpacity>

//         <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
//           <Ionicons name={isPlaying ? "pause" : "play"} size={45} color="white" />
//         </TouchableOpacity>

//         <TouchableOpacity onPress={() => jump(10000)}><MaterialCommunityIcons name="fast-forward-10" size={35} color="white" /></TouchableOpacity>
//         <TouchableOpacity onPress={nextSong}><Ionicons name="play-skip-forward" size={32} color="white" /></TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#000', alignItems: 'center' },
//   topBar: { flexDirection: 'row', justifyContent: 'space-between', width: '90%', marginTop: 40, alignItems: 'center' },
//   headerText: { color: 'white', fontSize: 12, letterSpacing: 2, fontWeight: 'bold' },
//   artContainer: {
//     marginTop: 30,
//     elevation: 20,
//     shadowColor: '#FF8C00',
//     shadowOpacity: 0.3,
//     shadowRadius: 30,
//     shadowOffset: { width: 0, height: 10 }
//   },
//   albumArt: { width: width * 0.85, height: width * 0.85, borderRadius: 20 },
//   metaContainer: {
//     width: '85%',
//     marginTop: 35,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between'
//   },
//   title: { color: 'white', fontSize: 24, fontWeight: 'bold' },
//   artist: { color: '#aaa', fontSize: 16, marginTop: 5 },
//   progressContainer: { width: '90%', marginTop: 25 },
//   slider: { width: '100%', height: 40 },
//   timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 5 },
//   timeText: { color: '#666', fontSize: 12 },
//   controlsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     width: '90%',
//     marginTop: 25
//   },
//   playButton: {
//     backgroundColor: '#FF8C00',
//     width: 75,
//     height: 75,
//     borderRadius: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 5
//   },
//   footer: { position: 'absolute', bottom: 30, alignItems: 'center' },
//   footerText: { color: 'white', fontSize: 12, fontWeight: 'bold', marginTop: 5 }
// });

import { useThemeColor } from "@/hooks/use-theme-color";
import {
  getGlobalSound,
  getIsChangingSong,
  getLastLoadedId,
  setGlobalSound,
  setIsChangingSong,
  setLastLoadedId,
  stopAndUnloadCurrentSound,
} from "@/store/audioController";
import { useMusicStore } from "@/store/myStore";
import { Entypo, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { Audio, InterruptionModeAndroid } from "expo-av";
import { useNavigation } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function PlayerScreen() {
  const navigation = useNavigation();
  const {
    currentSong,
    isPlaying,
    position,
    duration,
    favorites,
    toggleFavorite,
    updatePlayback,
    nextSong,
    prevSong,
    togglePlayState,
  } = useMusicStore();
  const [loading, setLoading] = useState(false);

  // --- Theme Colors ---
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const secColor = useThemeColor({}, "secondaryText");
  const accentColor = useThemeColor({}, "accent");
  const cardColor = useThemeColor({}, "card");

  const onPlaybackStatusUpdate = useCallback(
    (status: any) => {
      if (status.isLoaded) {
        updatePlayback(
          status.positionMillis,
          status.durationMillis || 0,
          status.isPlaying,
        );
        if (status.didJustFinish) nextSong();
      }
    },
    [nextSong, updatePlayback],
  );

  const isFav = useMemo(() => {
    return favorites.some((f) => f.id === currentSong?.id);
  }, [favorites, currentSong?.id]);

  useEffect(() => {
    const setupAudio = async () => {
      if (!currentSong?.id) return;

      // Prevent concurrent song changes
      if (getIsChangingSong()) {
        console.log("⏸️ Song change already in progress, skipping");
        return;
      }

      setIsChangingSong(true);
      console.log("🎵 Setting up audio for:", currentSong.obj.name);

      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        });
      } catch (e) {
        console.log("Error setting audio mode", e);
      }

      const existingSound = getGlobalSound();
      const hardwareId = getLastLoadedId();

      if (existingSound && hardwareId === currentSong.id) {
        existingSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        setIsChangingSong(false);
        return;
      }

      try {
        setLoading(true);
        // Stop and unload current sound before loading new one
        await stopAndUnloadCurrentSound();

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: currentSong.obj.downloadUrl },
          {
            shouldPlay: true,
            progressUpdateIntervalMillis: 500,
          },
          onPlaybackStatusUpdate,
        );

        setGlobalSound(newSound);
        setLastLoadedId(currentSong.id);
        console.log("✅ Audio setup complete for:", currentSong.obj.name);
      } catch (error) {
        console.error("Audio Load Error:", error);
      } finally {
        setLoading(false);
        setIsChangingSong(false);
      }
    };

    setupAudio();
  }, [currentSong?.id]);

  const togglePlay = async () => {
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

  const seek = async (val: number) => {
    const sound = getGlobalSound();
    if (sound) await sound.setPositionAsync(val);
  };

  const jump = async (millis: number) => {
    const sound = getGlobalSound();
    if (sound) await sound.setPositionAsync(Math.max(0, position + millis));
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={30} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: textColor }]}>
          NOW PLAYING
        </Text>
        <Entypo name="dots-three-horizontal" size={24} color={textColor} />
      </View>

      <View style={[styles.artContainer, { shadowColor: accentColor }]}>
        <Image
          source={{ uri: currentSong?.obj.image }}
          style={styles.albumArt}
        />
        {loading && (
          <ActivityIndicator
            style={StyleSheet.absoluteFill}
            color={accentColor}
          />
        )}
      </View>

      <View style={styles.metaContainer}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[styles.title, { color: textColor }]}>
            {currentSong?.obj.name}
          </Text>
          <Text style={[styles.artist, { color: secColor }]}>
            Playing from Queue
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => currentSong && toggleFavorite(currentSong)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFav ? "heart" : "heart-outline"}
            size={28}
            color={isFav ? accentColor : textColor}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={position}
          minimumTrackTintColor={accentColor}
          maximumTrackTintColor={cardColor} // Using cardColor for the inactive track
          thumbTintColor={accentColor}
          onSlidingComplete={seek}
        />
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: secColor }]}>
            {formatTime(position)}
          </Text>
          <Text style={[styles.timeText, { color: secColor }]}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={prevSong}>
          <Ionicons name="play-skip-back" size={32} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => jump(-10000)}>
          <MaterialCommunityIcons
            name="rewind-10"
            size={35}
            color={textColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: accentColor }]}
          onPress={togglePlay}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={45}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => jump(10000)}>
          <MaterialCommunityIcons
            name="fast-forward-10"
            size={35}
            color={textColor}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={nextSong}>
          <Ionicons name="play-skip-forward" size={32} color={textColor} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginTop: 40,
    alignItems: "center",
  },
  headerText: { fontSize: 12, letterSpacing: 2, fontWeight: "bold" },
  artContainer: {
    marginTop: 30,
    elevation: 20,
    shadowOpacity: 0.3,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
  },
  albumArt: { width: width * 0.85, height: width * 0.85, borderRadius: 20 },
  metaContainer: {
    width: "85%",
    marginTop: 35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 24, fontWeight: "bold" },
  artist: { fontSize: 16, marginTop: 5 },
  progressContainer: { width: "90%", marginTop: 25 },
  slider: { width: "100%", height: 40 },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  timeText: { fontSize: 12 },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    marginTop: 25,
  },
  playButton: {
    width: 75,
    height: 75,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
