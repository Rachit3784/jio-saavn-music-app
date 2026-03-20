import { Audio } from "expo-av";

let globalSound: Audio.Sound | null = null;
let lastLoadedId: string | null = null; // Isko add karein
let isChangingSong = false; // Add flag to prevent concurrent operations

export const getGlobalSound = () => globalSound;
export const setGlobalSound = (sound: Audio.Sound | null) => {
  globalSound = sound;
};

export const getLastLoadedId = () => lastLoadedId;
export const setLastLoadedId = (id: string | null) => {
  lastLoadedId = id;
};

export const getIsChangingSong = () => isChangingSong;
export const setIsChangingSong = (changing: boolean) => {
  isChangingSong = changing;
};

// Helper function to safely stop and unload current sound
export const stopAndUnloadCurrentSound = async () => {
  if (globalSound) {
    try {
      await globalSound.stopAsync();
      await globalSound.unloadAsync();
      console.log("🛑 Stopped and unloaded current sound");
    } catch (error) {
      console.log("❌ Error stopping sound:", error);
    }
    globalSound = null;
    lastLoadedId = null;
  }
};
