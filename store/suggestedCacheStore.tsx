import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface CacheItem {
  id: string;
  name: string;
  image: string;
  [key: string]: any;
}

interface SuggestedCacheState {
  topArtists: CacheItem[];
  featuredPlaylists: CacheItem[];
  newSuggestions: CacheItem[];
  lastFetched: {
    topArtists: number | null;
    featuredPlaylists: number | null;
    newSuggestions: number | null;
  };

  // Actions
  setTopArtists: (artists: CacheItem[]) => void;
  setFeaturedPlaylists: (playlists: CacheItem[]) => void;
  setNewSuggestions: (songs: CacheItem[]) => void;
  getTopArtists: () => CacheItem[];
  getFeaturedPlaylists: () => CacheItem[];
  getNewSuggestions: () => CacheItem[];
  clearCache: () => void;
  isCacheExpired: (
    section: "topArtists" | "featuredPlaylists" | "newSuggestions",
    maxAgeHours?: number,
  ) => boolean;
}

const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

export const useSuggestedCacheStore = create<SuggestedCacheState>()(
  persist(
    (set, get) => ({
      topArtists: [],
      featuredPlaylists: [],
      newSuggestions: [],
      lastFetched: {
        topArtists: null,
        featuredPlaylists: null,
        newSuggestions: null,
      },

      setTopArtists: (artists) => {
        console.log("📝 Caching top artists:", artists.length, "items");
        set((state) => ({
          ...state,
          topArtists: artists,
          lastFetched: {
            ...state.lastFetched,
            topArtists: Date.now(),
          },
        }));
      },

      setFeaturedPlaylists: (playlists) => {
        console.log(
          "📝 Caching featured playlists:",
          playlists.length,
          "items",
        );
        set((state) => ({
          ...state,
          featuredPlaylists: playlists,
          lastFetched: {
            ...state.lastFetched,
            featuredPlaylists: Date.now(),
          },
        }));
      },

      setNewSuggestions: (songs) => {
        console.log("📝 Caching new suggestions:", songs.length, "items");
        set((state) => ({
          ...state,
          newSuggestions: songs,
          lastFetched: {
            ...state.lastFetched,
            newSuggestions: Date.now(),
          },
        }));
      },

      getTopArtists: () => {
        const { topArtists } = get();
        console.log(
          "📖 Getting cached top artists:",
          topArtists.length,
          "items",
        );
        return topArtists;
      },

      getFeaturedPlaylists: () => {
        const { featuredPlaylists } = get();
        console.log(
          "📖 Getting cached featured playlists:",
          featuredPlaylists.length,
          "items",
        );
        return featuredPlaylists;
      },

      getNewSuggestions: () => {
        const { newSuggestions } = get();
        console.log(
          "📖 Getting cached new suggestions:",
          newSuggestions.length,
          "items",
        );
        return newSuggestions;
      },

      clearCache: () => {
        console.log("🗑️ Clearing suggested cache");
        set({
          topArtists: [],
          featuredPlaylists: [],
          newSuggestions: [],
          lastFetched: {
            topArtists: null,
            featuredPlaylists: null,
            newSuggestions: null,
          },
        });
      },

      isCacheExpired: (section, maxAgeHours = CACHE_EXPIRY_HOURS) => {
        const state = get();
        const timestamp = state.lastFetched[section];

        if (!timestamp) {
          console.log(`⏰ No timestamp for ${section}, cache is expired`);
          return true;
        }

        const expiryTime = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds
        const isExpired = Date.now() - timestamp > expiryTime;
        const ageHours = (Date.now() - timestamp) / (60 * 60 * 1000);

        console.log(
          `⏰ ${section} cache age:`,
          ageHours.toFixed(2),
          "hours, expired:",
          isExpired,
        );
        return isExpired;
      },
    }),
    {
      name: "suggested-cache-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        topArtists: state.topArtists,
        featuredPlaylists: state.featuredPlaylists,
        newSuggestions: state.newSuggestions,
        lastFetched: state.lastFetched,
      }),
    },
  ),
);
