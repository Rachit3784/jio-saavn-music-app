import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Playlist {
  id: string;
  name: string;
  image: any[];
  songCount: number;
  language: string;
  url?: string;
  [key: string]: any;
}

interface PlaylistsCacheState {
  playlists: Playlist[];
  lastFetched: number;
  addPlaylists: (newPlaylists: Playlist[]) => void;
  getCachedPlaylists: () => Playlist[];
  isCacheExpired: () => boolean;
  clearCache: () => void;
}

const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

export const usePlaylistsCacheStore = create<PlaylistsCacheState>()(
  persist(
    (set, get) => ({
      playlists: [],
      lastFetched: 0,

      addPlaylists: (newPlaylists: Playlist[]) => {
        const state = get();
        console.log("🔍 Current cache state before adding:", {
          existingCount: state.playlists.length,
          newPlaylistsCount: newPlaylists.length,
          newPlaylistsIds: newPlaylists.map((p) => p.id).slice(0, 3),
        });

        const existingIds = new Set(
          state.playlists.map((playlist) => playlist.id),
        );
        const uniqueNewPlaylists = newPlaylists.filter(
          (playlist) => !existingIds.has(playlist.id),
        );

        console.log("🔍 Filtered playlists:", {
          uniqueCount: uniqueNewPlaylists.length,
          duplicateCount: newPlaylists.length - uniqueNewPlaylists.length,
        });

        if (uniqueNewPlaylists.length > 0) {
          set({
            playlists: [...state.playlists, ...uniqueNewPlaylists],
            lastFetched: Date.now(),
          });
          console.log(
            `📝 Added ${uniqueNewPlaylists.length} new playlists to cache (total: ${state.playlists.length + uniqueNewPlaylists.length})`,
          );
        } else {
          console.log("⚠️ No new playlists to add to cache (all duplicates)");
        }
      },

      getCachedPlaylists: () => {
        const state = get();
        console.log("🔍 Retrieving cached playlists:", {
          totalCached: state.playlists.length,
          lastFetched: state.lastFetched,
          cacheAge: state.lastFetched ? Date.now() - state.lastFetched : 0,
        });
        return state.playlists;
      },

      isCacheExpired: () => {
        const state = get();
        const now = Date.now();
        const isExpired = now - state.lastFetched > CACHE_EXPIRY_TIME;

        if (isExpired && state.playlists.length > 0) {
          console.log(
            `⏰ Playlists cache expired (${Math.floor((now - state.lastFetched) / (60 * 60 * 1000))}h old)`,
          );
        }

        return isExpired;
      },

      clearCache: () => {
        set({ playlists: [], lastFetched: 0 });
        console.log("🗑️ Playlists cache cleared");
      },
    }),
    {
      name: "playlists-cache-v1",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
