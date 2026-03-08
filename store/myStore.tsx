import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isPlaying } from "react-native-track-player";

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
}

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
        
        // 1. Clean existing queue (set all isPlaying to false)
        const cleanedQueue = state.SongQueue.map(item => ({
          ...item,
          obj: { ...item.obj, isPlaying: false }
        }));

        const existingIndex = cleanedQueue.findIndex((s) => s.id === songId);
        let finalQueue = [...cleanedQueue];

        if (existingIndex === -1) {
          // 2. Add NEW song if it doesn't exist
          finalQueue.push({ id: songId, obj: { ...songData, isPlaying: true } });
        } else {
          // 3. Just update the status if it exists
          finalQueue[existingIndex].obj.isPlaying = true;
        }

        set({ 
          currentSong: { id: songId, obj: songData }, 
          SongQueue: finalQueue,
          isPlaying: true, // Start playing immediately
          position: 0      // Reset progress for new song
        });
      },

      nextSong: () => {
        const { SongQueue, currentSong } = get();
        if (!currentSong) return;
        
        const currentIndex = SongQueue.findIndex(s => s.id === currentSong.id);
        if (currentIndex !== -1 && currentIndex < SongQueue.length - 1) {
          const nextItem = SongQueue[currentIndex + 1];
          set({ currentSong: nextItem, position: 0 });
        }
      },

      prevSong: () => {
        const { SongQueue, currentSong } = get();
        if (!currentSong) return;

        const currentIndex = SongQueue.findIndex(s => s.id === currentSong.id);
        if (currentIndex > 0) {
          const prevItem = SongQueue[currentIndex - 1];
          set({ currentSong: prevItem, position: 0 });
        }
      },



// persist ke andar actions mein ye implement karein:
removeFromQueue: (songId : string) => {
  const { SongQueue, currentSong } = get();
  const newQueue = SongQueue.filter((s) => s.id !== songId);
  
  // Agar wahi song delete ho raha hai jo abhi baj raha hai, toh currentSong null kar do
  const isCurrentlyPlaying = currentSong?.id === songId;
  
  set({ 
    SongQueue: newQueue,
    currentSong: isCurrentlyPlaying ? null : currentSong,
    isPlaying: isCurrentlyPlaying ? false : get().isPlaying
  });
},

clearQueue: () => set({ SongQueue: [], currentSong: null, isPlaying: false, position: 0 }),



    }
  
  ),
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
    }
  )
);