# Home Player 🎵

A beautiful, modern music player app built with **Expo**, **TypeScript**, **Zustand** and **Expo AV** — powered by **JioSaavn API**.

Dark / Light mode • Background playback • Mini player • Smart queue • Local favorites & recents

https://github.com/yourusername/home-player

## ✨ Features

### Playback & Controls
- Full-featured player with seek bar, forward/rewind
- Background playback support
- Persistent mini-player (bottom bar) synced with full player
- Play / Pause / Next / Previous

### Queue Management
- Add / Remove / Reorder songs in queue
- Queue persists locally (AsyncStorage)
- Auto-generated "Recently Played" queue
- Ability to remove individual recent songs or clear all

### Library & Favorites
- Mark songs as **favorites** (stored locally)
- View and manage recently played songs

### Screens
- Home / Suggestions
- Search (with recent search history)
- Search Results
- Albums / Playlists / Artists fetching screens
- Music fetching / loading states
- Recent Played screen (with remove & clear options)

### UI/UX
- Beautiful dark & light mode support
- Smooth animations & modern design
- Responsive across devices

## 🛠 Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **State Management**: Zustand
- **Storage**: AsyncStorage
- **Audio**: Expo AV
- **API**: JioSaavn API (online music metadata & streaming)

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/home-player.git
cd home-player

# 2. Install dependencies
npm install

# 3. Start the app (clear cache recommended first time)
npx expo start -c


a → run on Android emulator/device

