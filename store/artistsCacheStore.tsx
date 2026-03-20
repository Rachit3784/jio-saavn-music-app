import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Artist {
  id: string;
  name: string;
  image: any[];
  url?: string;
  [key: string]: any;
}

interface ArtistsCacheState {
  artists: Artist[];
  lastFetched: number;
  addArtists: (newArtists: Artist[]) => void;
  getCachedArtists: () => Artist[];
  isCacheExpired: () => boolean;
  clearCache: () => void;
}

const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

export const useArtistsCacheStore = create<ArtistsCacheState>()(
  persist(
    (set, get) => ({
      artists: [],
      lastFetched: 0,

      addArtists: (newArtists: Artist[]) => {
        const state = get();
        const existingIds = new Set(state.artists.map(artist => artist.id));
        const uniqueNewArtists = newArtists.filter(artist => !existingIds.has(artist.id));
        
        if (uniqueNewArtists.length > 0) {
          set({
            artists: [...state.artists, ...uniqueNewArtists],
            lastFetched: Date.now(),
          });
          console.log(`📝 Added ${uniqueNewArtists.length} new artists to cache (total: ${state.artists.length + uniqueNewArtists.length})`);
        }
      },

      getCachedArtists: () => {
        const state = get();
        return state.artists;
      },

      isCacheExpired: () => {
        const state = get();
        const now = Date.now();
        const isExpired = now - state.lastFetched > CACHE_EXPIRY_TIME;
        
        if (isExpired && state.artists.length > 0) {
          console.log(`⏰ Artists cache expired (${Math.floor((now - state.lastFetched) / (60 * 60 * 1000))}h old)`);
        }
        
        return isExpired;
      },

      clearCache: () => {
        set({ artists: [], lastFetched: 0 });
        console.log('🗑️ Artists cache cleared');
      },
    }),
    {
      name: 'artists-cache-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
