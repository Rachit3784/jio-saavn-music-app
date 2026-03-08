import { Audio } from 'expo-av';

let globalSound: Audio.Sound | null = null;
let lastLoadedId: string | null = null; // Isko add karein

export const getGlobalSound = () => globalSound;
export const setGlobalSound = (sound: Audio.Sound | null) => {
  globalSound = sound;
};

export const getLastLoadedId = () => lastLoadedId;
export const setLastLoadedId = (id: string | null) => {
  lastLoadedId = id;
};