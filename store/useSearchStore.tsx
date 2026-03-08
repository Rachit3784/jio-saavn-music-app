import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchState {
  recentSearches: string[];
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearAll: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      recentSearches: [],
      addSearch: (query) => set((state) => {
        if (!query.trim()) return state;
        const filtered = state.recentSearches.filter((s) => s !== query);
        return { recentSearches: [query, ...filtered].slice(0, 10) };
      }),
      removeSearch: (query) => set((state) => ({
        recentSearches: state.recentSearches.filter((s) => s !== query),
      })),
      clearAll: () => set({ recentSearches: [] }),
    }),
    { name: 'search-history', storage: createJSONStorage(() => AsyncStorage) }
  )
);