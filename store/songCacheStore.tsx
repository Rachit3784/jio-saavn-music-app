import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SongItem {
  id: string;
  name: string;
  duration: number;
  image: { url: string }[];
  downloadUrl: { url: string }[];
  hasLyrics: boolean;
  url: string;
  lyricsId: string;
  artists: {
    primary: { name: string }[];
  };
}

interface SongCacheState {
  cachedSongs: SongItem[];
  lastFetched: number | null;

  // Actions
  addSongs: (songs: SongItem[]) => void;
  getCachedSongs: () => SongItem[];
  clearCache: () => void;
  isCacheExpired: (maxAgeHours?: number) => boolean;
  getRandomSong: (excludeIds: string[]) => SongItem | null;
}

const MAX_CACHE_SIZE = 150;
const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

export const useSongCacheStore = create<SongCacheState>()(
  persist(
    (set, get) => ({
      cachedSongs: [],
      lastFetched: null,

      addSongs: (newSongs) => {
        const { cachedSongs } = get();

        console.log("📝 Cache addSongs called with:", newSongs.length, "songs");
        console.log("📦 Current cache size:", cachedSongs.length);

        // Filter out songs that already exist in cache (by id)
        const uniqueNewSongs = newSongs.filter(
          (newSong) =>
            !cachedSongs.some((cachedSong) => cachedSong.id === newSong.id),
        );

        console.log("🆔 Unique new songs to add:", uniqueNewSongs.length);

        // Combine existing songs with new unique songs
        let updatedSongs = [...cachedSongs, ...uniqueNewSongs];

        // If cache exceeds max size, remove oldest songs (from the beginning)
        if (updatedSongs.length > MAX_CACHE_SIZE) {
          const removedCount = updatedSongs.length - MAX_CACHE_SIZE;
          updatedSongs = updatedSongs.slice(-MAX_CACHE_SIZE);
          console.log("🗑️ Removed", removedCount, "oldest songs from cache");
        }

        set({
          cachedSongs: updatedSongs,
          lastFetched: Date.now(),
        });

        console.log("✅ Cache updated. New size:", updatedSongs.length);
      },

      getCachedSongs: () => {
        const { cachedSongs } = get();
        console.log(
          "📖 getCachedSongs called, returning:",
          cachedSongs.length,
          "songs",
        );
        return cachedSongs;
      },

      clearCache: () => {
        console.log("🗑️ Clearing cache");
        set({
          cachedSongs: [],
          lastFetched: null,
        });
      },

      isCacheExpired: (maxAgeHours = CACHE_EXPIRY_HOURS) => {
        const { lastFetched } = get();
        if (!lastFetched) {
          console.log("⏰ No lastFetched timestamp, cache is expired");
          return true;
        }

        const expiryTime = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds
        const isExpired = Date.now() - lastFetched > expiryTime;
        const ageHours = (Date.now() - lastFetched) / (60 * 60 * 1000);

        console.log(
          "⏰ Cache age:",
          ageHours.toFixed(2),
          "hours, expired:",
          isExpired,
        );
        return isExpired;
      },

      getRandomSong: (excludeIds: string[]) => {
        const { cachedSongs } = get();

        if (cachedSongs.length === 0) {
          console.log("🚫 No songs in cache to select from");
          return null;
        }

        // Filter out songs that are in the exclude list
        const availableSongs = cachedSongs.filter(
          (song) => !excludeIds.includes(song.id),
        );

        if (availableSongs.length === 0) {
          console.log(
            "🚫 All cached songs are excluded, no random selection possible",
          );
          return null;
        }

        // Select a random song
        const randomIndex = Math.floor(Math.random() * availableSongs.length);
        const selectedSong = availableSongs[randomIndex];

        console.log(
          "🎲 Selected random song from cache:",
          selectedSong.name,
          "(index:",
          randomIndex,
          "of",
          availableSongs.length,
          "available)",
        );

        return selectedSong;
      },
    }),
    {
      name: "song-cache-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cachedSongs: state.cachedSongs,
        lastFetched: state.lastFetched,
      }),
    },
  ),
);
