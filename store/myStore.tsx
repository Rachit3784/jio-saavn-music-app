import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  setGlobalSound,
  setLastLoadedId,
  stopAndUnloadCurrentSound,
} from "./audioController";

interface SongData {
  name: string;
  duration: number;
  image: string;
  downloadUrl: string;
  hasLyrics: boolean;
  lyricsUrl: string;
  lyricsId: string;
  songId: string;
  isPlaying: boolean;
}

type QueueItem = {
  id: string;
  obj: SongData;
};

interface MusicState {
  currentSong: QueueItem | null;
  SongQueue: QueueItem[];
  favorites: QueueItem[];
  isPlaying: boolean;
  position: number;
  duration: number;
  toggleFavorite: (song: QueueItem) => void;
  isFavorite: (songId: string) => boolean;
  // Actions

  setSong: (songId: string, songData: SongData) => void;
  updatePlayback: (pos: number, dur: number, playing: boolean) => void;
  nextSong: () => void;
  prevSong: () => void;
  togglePlayState: (playing: boolean) => void;
  removeFromQueue: (songId: string) => void;
  clearQueue: () => void;
  // New cache-related actions
  playNextFromCache: () => boolean;
  getRandomSongFromCache: (excludeIds: string[]) => QueueItem | null;
  // Audio control actions
  switchToSong: (song: QueueItem) => void;
  stopCurrentPlayback: () => void;
}

// Audio loading and playback function
const loadAndPlayAudio = async (songId: string, songData: SongData) => {
  try {
    console.log("🎵 Loading audio for:", songData.name);

    // Stop and unload current sound if any
    await stopAndUnloadCurrentSound();

    // Configure audio mode for background play
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playsInSilentModeIOS: true,
    });

    // Create and load new sound
    const { sound } = await Audio.Sound.createAsync(
      { uri: songData.downloadUrl },
      {
        shouldPlay: true,
        isLooping: false,
        volume: 1.0,
      },
    );

    // Set up playback status update
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        const { updatePlayback, nextSong } = useMusicStore.getState();
        updatePlayback(
          status.positionMillis || 0,
          status.durationMillis || 0,
          status.isPlaying || false,
        );

        // Auto-play next song when current finishes
        if (status.didJustFinish && status.isPlaying === false) {
          console.log("🎵 Song finished, playing next");
          nextSong();
        }
      }
    });

    // Update global sound reference
    setGlobalSound(sound);
    setLastLoadedId(songId);

    console.log("✅ Audio loaded and playing:", songData.name);
  } catch (error) {
    console.error("❌ Error loading audio:", error);
  }
};

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      currentSong: null,
      SongQueue: [],
      favorites: [],
      isPlaying: false,
      position: 0,
      duration: 0,

      toggleFavorite: (song) => {
        const { favorites } = get();
        const isExist = favorites.find((f) => f.id === song.id);

        if (isExist) {
          // Remove from favorites
          set({ favorites: favorites.filter((f) => f.id !== song.id) });
        } else {
          // Add to favorites
          set({ favorites: [...favorites, song] });
        }
      },

      isFavorite: (songId) => {
        return get().favorites.some((f) => f.id === songId);
      },

      // Updates time and play/pause status globally
      updatePlayback: (pos, dur, playing) =>
        set({ position: pos, duration: dur, isPlaying: playing }),

      togglePlayState: (playing) => set({ isPlaying: playing }),

      setSong: (songId, songData) => {
        const state = get();

        // Prevent infinite loop - don't set the same song again
        if (state.currentSong?.id === songId && state.isPlaying) {
          console.log(" Same song already playing, skipping setSong");
          return;
        }

        // Stop any currently playing audio before starting new song
        if (state.currentSong && state.isPlaying) {
          console.log(
            " Stopping current song before playing new one:",
            state.currentSong.obj.name,
          );
        }

        // 1. Clean existing queue (set all isPlaying to false)
        const cleanedQueue = state.SongQueue.map((item) => ({
          ...item,
          obj: { ...item.obj, isPlaying: false },
        }));

        const existingIndex = cleanedQueue.findIndex((s) => s.id === songId);
        let finalQueue = [...cleanedQueue];

        if (existingIndex === -1) {
          // 2. Add NEW song if it doesn't exist
          finalQueue.push({
            id: songId,
            obj: { ...songData, isPlaying: true },
          });
        } else {
          // 3. Just update the status if it exists
          finalQueue[existingIndex].obj.isPlaying = true;
        }

        set({
          currentSong: { id: songId, obj: songData },
          SongQueue: finalQueue,
          isPlaying: true, // Start playing immediately
          position: 0, // Reset progress for new song
        });

        console.log(
          " New song loaded and playing:",
          songData.name,
          "isPlaying:",
          true,
        );
        console.log(" MiniPlayer should now show pause icon");

        // IMPORTANT: Actually load and play the audio
        loadAndPlayAudio(songId, songData);
      },

      nextSong: () => {
        const { SongQueue, currentSong } = get();
        if (!currentSong) return;

        const currentIndex = SongQueue.findIndex(
          (s) => s.id === currentSong.id,
        );

        // Check if there's a next song in the queue
        if (currentIndex !== -1 && currentIndex < SongQueue.length - 1) {
          const nextItem = SongQueue[currentIndex + 1];

          // Update queue to set all songs to not playing, then set next song to playing
          const updatedQueue = SongQueue.map((item) => ({
            ...item,
            obj: { ...item.obj, isPlaying: false },
          }));
          const nextIndex = updatedQueue.findIndex((s) => s.id === nextItem.id);
          if (nextIndex !== -1) {
            updatedQueue[nextIndex].obj.isPlaying = true;
          }

          set({
            currentSong: nextItem,
            SongQueue: updatedQueue,
            isPlaying: true, // IMPORTANT: Set playing to true for automatic playback
            position: 0,
          });
          console.log("🎵 Playing next song from queue:", nextItem.obj.name);
          console.log("🎵 MiniPlayer should now show pause icon for next song");

          // CRITICAL: Actually load and play the audio for next song
          loadAndPlayAudio(nextItem.id, nextItem.obj);
        } else {
          // No more songs in queue - try to get from cache (natural progression)
          console.log("📭 Queue ended, trying to get song from cache");
          const playedFromCache = get().playNextFromCache();
          if (!playedFromCache) {
            console.log("🚫 No songs available in cache either");
          }
        }
      },

      prevSong: () => {
        const { SongQueue, currentSong } = get();
        if (!currentSong) return;

        const currentIndex = SongQueue.findIndex(
          (s) => s.id === currentSong.id,
        );
        if (currentIndex > 0) {
          const prevItem = SongQueue[currentIndex - 1];

          // Update queue to set all songs to not playing, then set prev song to playing
          const updatedQueue = SongQueue.map((item) => ({
            ...item,
            obj: { ...item.obj, isPlaying: false },
          }));
          const prevIndex = updatedQueue.findIndex((s) => s.id === prevItem.id);
          if (prevIndex !== -1) {
            updatedQueue[prevIndex].obj.isPlaying = true;
          }

          set({
            currentSong: prevItem,
            SongQueue: updatedQueue,
            isPlaying: true, // IMPORTANT: Set playing to true for automatic playback
            position: 0,
          });
          console.log(
            "🎵 Playing previous song from queue:",
            prevItem.obj.name,
          );
          console.log(
            "🎵 MiniPlayer should now show pause icon for previous song",
          );
        }
      },

      removeFromQueue: (songId: string) => {
        const { SongQueue, currentSong } = get();
        const newQueue = SongQueue.filter((s) => s.id !== songId);

        // If the currently playing song is removed
        const isCurrentlyPlaying = currentSong?.id === songId;

        if (isCurrentlyPlaying) {
          console.log(
            "🗑️ Removing currently playing song, finding replacement",
          );

          // Try to play next song from queue first
          const currentIndex = SongQueue.findIndex((s) => s.id === songId);
          let nextSong: QueueItem | null = null;

          if (currentIndex < newQueue.length) {
            // Play the song that comes after the removed one
            nextSong = newQueue[currentIndex];
            console.log(
              "🎵 Playing next song from queue after removal:",
              nextSong.obj.name,
            );
          } else if (newQueue.length > 0) {
            // Play the last song in queue
            nextSong = newQueue[newQueue.length - 1];
            console.log(
              "🎵 Playing last song from queue after removal:",
              nextSong.obj.name,
            );
          } else {
            // No songs in queue - stop playback completely
            console.log(
              "📭 Queue empty after removal, stopping playback completely",
            );
            console.log(
              "🚫 Not playing from cache - user removed all recently played songs",
            );

            // Stop current playback and clear everything
            get().stopCurrentPlayback();

            set({
              SongQueue: [],
              currentSong: null,
              isPlaying: false,
              position: 0,
            });

            console.log("✅ Playback stopped - no more songs to play");
            return; // Early return since we've handled everything
          }

          set({
            SongQueue: newQueue,
            currentSong: nextSong,
            isPlaying: !!nextSong,
            position: 0,
          });

          // If we have a next song, immediately switch audio
          if (nextSong) {
            console.log(
              "🔄 Immediately switching to next song:",
              nextSong.obj.name,
            );
            get().switchToSong(nextSong);
          }
        } else {
          // Just remove the song from queue if it's not currently playing
          set({
            SongQueue: newQueue,
            currentSong: currentSong,
            isPlaying: get().isPlaying,
          });
        }
      },

      clearQueue: () => {
        console.log("🗑️ Clearing entire queue");
        set({
          SongQueue: [],
          currentSong: null,
          isPlaying: false,
          position: 0,
        });
      },

      // New cache-related actions
      playNextFromCache: () => {
        const { SongQueue, currentSong } = get();

        // Get all song IDs that are already in the queue to avoid duplicates
        const queueSongIds = SongQueue.map((s) => s.id);
        if (currentSong) {
          queueSongIds.push(currentSong.id);
        }

        console.log(
          "🎲 Getting random song from cache, excluding:",
          queueSongIds.length,
          "songs",
        );

        const randomSong = get().getRandomSongFromCache(queueSongIds);

        if (randomSong) {
          console.log("🎵 Found random song from cache:", randomSong.obj.name);

          // IMPORTANT: Use setSong to ensure proper loading and API calls
          // This will trigger the downloadUrl API call and proper playback
          get().setSong(randomSong.id, randomSong.obj);

          return true;
        } else {
          console.log("🚫 No suitable songs found in cache");
          return false;
        }
      },

      getRandomSongFromCache: (excludeIds: string[]) => {
        // We'll need to import and use the song cache store
        // For now, return null - we'll fix this after creating the proper structure
        console.log(
          "🔍 Looking for random song in cache, excluding:",
          excludeIds.length,
          "IDs",
        );

        try {
          // Dynamic import to avoid circular dependency
          const { useSongCacheStore } = require("./songCacheStore");
          const { getRandomSong } = useSongCacheStore.getState();

          const randomSong = getRandomSong(excludeIds);

          if (randomSong) {
            // Convert cache song format to queue item format
            const queueItem: QueueItem = {
              id: randomSong.id,
              obj: {
                name: randomSong.name,
                duration: randomSong.duration,
                image: randomSong.image[randomSong.image.length - 1].url,
                downloadUrl:
                  randomSong.downloadUrl[randomSong.downloadUrl.length - 1].url,
                hasLyrics: randomSong.hasLyrics,
                lyricsUrl: randomSong.url,
                lyricsId: randomSong.lyricsId,
                songId: randomSong.id,
                isPlaying: false,
              },
            };

            console.log(
              "✅ Converted cache song to queue item:",
              queueItem.obj.name,
            );
            return queueItem;
          }
        } catch (error) {
          console.log("❌ Error accessing song cache store:", error);
        }

        console.log("🚫 No suitable song found in cache");
        return null;
      },

      switchToSong: (song: QueueItem) => {
        console.log("🔄 Immediately switching to song:", song.obj.name);

        // Stop current playback
        try {
          const {
            stopAndUnloadCurrentSound,
            setIsChangingSong,
            getIsChangingSong,
          } = require("./audioController");

          // Prevent concurrent operations
          if (getIsChangingSong()) {
            console.log("⏸️ Song change already in progress, skipping");
            return;
          }

          setIsChangingSong(true);
          stopAndUnloadCurrentSound();
        } catch (error) {
          console.log("❌ Error stopping current sound:", error);
        }

        // Update state to new song
        set({
          currentSong: song,
          isPlaying: true,
          position: 0,
        });

        // Immediately load and play the new song
        try {
          const { Audio } = require("expo-av");
          const {
            setGlobalSound,
            setLastLoadedId,
            setIsChangingSong,
          } = require("./audioController");

          console.log(
            "🎵 Loading and playing new song immediately:",
            song.obj.name,
          );

          Audio.Sound.createAsync(
            { uri: song.obj.downloadUrl },
            {
              shouldPlay: true,
              progressUpdateIntervalMillis: 500,
            },
            (status: any) => {
              if (status.isLoaded) {
                console.log(
                  "✅ New song loaded and playing:",
                  song.obj.name,
                  "isPlaying:",
                  status.isPlaying,
                );

                // Update the store with the actual playback status
                set((state) => ({
                  ...state,
                  isPlaying: status.isPlaying,
                }));

                if (status.isPlaying) {
                  console.log("🎵 MiniPlayer should now show pause icon");
                }

                setIsChangingSong(false);
              }
            },
          )
            .then(({ sound }: any) => {
              setGlobalSound(sound);
              setLastLoadedId(song.id);
              console.log("🎵 Audio loaded and playing for:", song.obj.name);

              // Ensure playback status is updated
              set((state) => ({
                ...state,
                isPlaying: true,
              }));
            })
            .catch((error: any) => {
              console.log("❌ Error loading new song:", error);
              setIsChangingSong(false);

              // Reset playing status on error
              set((state) => ({
                ...state,
                isPlaying: false,
              }));
            });
        } catch (error) {
          console.log("❌ Error setting up new song:", error);
          try {
            const { setIsChangingSong } = require("./audioController");
            setIsChangingSong(false);
          } catch (e) {
            console.log("❌ Error resetting changing flag:", e);
          }

          // Reset playing status on error
          set((state) => ({
            ...state,
            isPlaying: false,
          }));
        }

        console.log("✅ Switched to song:", song.obj.name);
      },

      stopCurrentPlayback: () => {
        console.log("🛑 Stopping current playback");

        try {
          const { stopAndUnloadCurrentSound } = require("./audioController");
          stopAndUnloadCurrentSound();
        } catch (error) {
          console.log("❌ Error stopping current sound:", error);
        }

        set({
          currentSong: null,
          isPlaying: false,
          position: 0,
        });
      },

      clearQueue: () => {
        console.log("🗑️ Clearing entire queue");
        set({
          SongQueue: [],
          currentSong: null,
          isPlaying: false,
          position: 0,
        });
      },
    }),
    {
      name: "mume-music-v3",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentSong: state.currentSong,
        SongQueue: state.SongQueue,
        position: state.position,
        duration: state.duration,
        favorites: state.favorites,
      }),
    },
  ),
);
