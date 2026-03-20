import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Album {
  id: string;
  name: string;
  image: any[];
  year: number;
  artists?: {
    primary?: {
      name: string;
      id: string;
    }[];
  };
  url?: string;
  [key: string]: any;
}

interface AlbumsCacheState {
  albums: Album[];
  lastFetched: number;
  addAlbums: (newAlbums: Album[]) => void;
  getCachedAlbums: () => Album[];
  isCacheExpired: () => boolean;
  clearCache: () => void;
}

const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

export const useAlbumsCacheStore = create<AlbumsCacheState>()(
  persist(
    (set, get) => ({
      albums: [],
      lastFetched: 0,

      addAlbums: (newAlbums: Album[]) => {
        const state = get();
        console.log("🔍 Current album cache state before adding:", {
          existingCount: state.albums.length,
          newAlbumsCount: newAlbums.length,
          newAlbumsIds: newAlbums.map((a) => a.id).slice(0, 3),
        });

        const existingIds = new Set(state.albums.map((album) => album.id));
        const uniqueNewAlbums = newAlbums.filter(
          (album) => !existingIds.has(album.id),
        );

        console.log("🔍 Filtered albums:", {
          uniqueCount: uniqueNewAlbums.length,
          duplicateCount: newAlbums.length - uniqueNewAlbums.length,
        });

        if (uniqueNewAlbums.length > 0) {
          set({
            albums: [...state.albums, ...uniqueNewAlbums],
            lastFetched: Date.now(),
          });
          console.log(
            `📝 Added ${uniqueNewAlbums.length} new albums to cache (total: ${state.albums.length + uniqueNewAlbums.length})`,
          );
        } else {
          console.log("⚠️ No new albums to add to cache (all duplicates)");
        }
      },

      getCachedAlbums: () => {
        const state = get();
        console.log("🔍 Retrieving cached albums:", {
          totalCached: state.albums.length,
          lastFetched: state.lastFetched,
          cacheAge: state.lastFetched ? Date.now() - state.lastFetched : 0,
        });
        return state.albums;
      },

      isCacheExpired: () => {
        const state = get();
        const now = Date.now();
        const isExpired = now - state.lastFetched > CACHE_EXPIRY_TIME;

        if (isExpired && state.albums.length > 0) {
          console.log(
            `⏰ Albums cache expired (${Math.floor((now - state.lastFetched) / (60 * 60 * 1000))}h old)`,
          );
        }

        return isExpired;
      },

      clearCache: () => {
        set({ albums: [], lastFetched: 0 });
        console.log("🗑️ Albums cache cleared");
      },
    }),
    {
      name: "albums-cache-v1",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
