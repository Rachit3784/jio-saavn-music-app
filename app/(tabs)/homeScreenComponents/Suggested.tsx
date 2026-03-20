import { useThemeColor } from "@/hooks/use-theme-color";
import { useMusicStore } from "@/store/myStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Sub-Component for Horizontal Lists ---
const HorizontalSection = ({
  setActiveTab,
  title,
  data,
  loading,
  type,
  onEntryPress,
  navigation,
}: any) => {
  const textColor = useThemeColor({}, "text");
  const secColor = useThemeColor({}, "secondaryText");

  const handleSeeAll = () => {
    console.log("See All pressed for:", title);

    if (title === "Recently Played") {
      navigation.navigate("Stacks", { screen: "RecentlyPlayedScreen" });
    } else if (title === "Top Artists") {
      // Navigate to Artists tab
      setActiveTab("Artists");
    } else if (title === "Featured Playlists") {
      // Navigate to Playlists tab
      setActiveTab("Playlists");
    } else if (title === "New Suggestions") {
      // Navigate to Songs tab
      setActiveTab("Songs");
    }
  };

  const renderItem = ({ item }: any) => {
    const isArtist = type === "artist";
    // API data has image array, but your Store data (SongData) has a single image string.
    // We handle both cases here:
    const imageUrl = Array.isArray(item.image)
      ? item.image[2]?.url
      : item.image;

    return (
      <TouchableOpacity
        onPress={() => onEntryPress && onEntryPress(item)}
        style={isArtist ? styles.circleCard : styles.squareCard}
      >
        <Image
          source={{ uri: imageUrl }}
          style={isArtist ? styles.circleImg : styles.squareImg}
        />
        <Text
          numberOfLines={1}
          style={[styles.cardTitle, { color: textColor }]}
        >
          {item.name}
        </Text>
        {!isArtist && (
          <Text numberOfLines={1} style={{ color: secColor, fontSize: 11 }}>
            {type === "song"
              ? item.artistName || "Unknown Artist"
              : `${item.songCount || 0} Songs`}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        <TouchableOpacity onPress={handleSeeAll}>
          <Text style={{ color: "#FF8216", fontWeight: "600" }}>See All</Text>
        </TouchableOpacity>
      </View>
      {loading && data.length === 0 ? (
        <ActivityIndicator color="#FF8216" style={{ marginVertical: 20 }} />
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={data}
          keyExtractor={(item, index) => (item.id || item.songId) + index}
          renderItem={renderItem}
          contentContainerStyle={{ paddingLeft: 20 }}
        />
      )}
    </View>
  );
};

const Suggested = ({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void;
}) => {
  const navigation = useNavigation();
  const [songs, setSongs] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Store Hooks ---
  const { SongQueue, setSong } = useMusicStore();

  // --- Inline Cache Functions ---
  const getCachedData = useCallback(async (key: string) => {
    try {
      const cached = await AsyncStorage.getItem(`suggested_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (age < maxAge) {
          console.log(
            `⚡ Using cached ${key} data (${(age / (60 * 60 * 1000)).toFixed(2)}h old)`,
          );
          return data;
        } else {
          console.log(`⏰ Cache expired for ${key}`);
          return null;
        }
      }
    } catch (error) {
      console.log(`❌ Error reading cache for ${key}:`, error);
    }
    return null;
  }, []);

  const setCachedData = useCallback(async (key: string, data: any[]) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(`suggested_${key}`, JSON.stringify(cacheData));
      console.log(`📝 Cached ${key} data:`, data.length, "items");
    } catch (error) {
      console.log(`❌ Error caching ${key}:`, error);
    }
  }, []);

  // --- Logic: Transform SongQueue to "Recently Played" format ---
  const recentSongs = useMemo(() => {
    return [...SongQueue]
      .reverse() // Latest first
      .slice(0, 10) // Top 10
      .map((item) => ({
        ...item.obj, // Flatten the object (name, image, etc.)
        id: item.id,
        // Add artistName mapping for the UI
        artistName: item.obj.name, // Note: Adjust if your SongData has an artist field
      }));
  }, [SongQueue]);

  const handlePlaySong = (item: any) => {
    // API structure mapping to your Store structure
    const songData = {
      name: item.name,
      duration: item.duration,
      image: Array.isArray(item.image)
        ? item.image[item.image.length - 1].url
        : item.image,
      downloadUrl: Array.isArray(item.downloadUrl)
        ? item.downloadUrl[item.downloadUrl.length - 1].url
        : item.downloadUrl,
      hasLyrics: item.hasLyrics || false,
      lyricsUrl: item.url || "",
      lyricsId: item.lyricsId || "",
      songId: item.id || item.songId,
      isPlaying: true,
    };

    setSong(songData.songId, songData);

    navigation.navigate("Stacks", {
      screen: "PlayerScreen",
      params: { songId: songData.songId },
    });
  };

  const fetchData = useCallback(async () => {
    console.log("🔄 fetchData called, loading:", loading);

    // Use a ref to track if fetch is in progress instead of loading state
    if (abortControllerRef.current) {
      console.log("🔄 Fetch already in progress, skipping");
      return;
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      console.log("🚀 Setting loading to true");
      setLoading(true);
      console.log("🚀 Fetching suggested content");

      // Simple fetch without caching for debugging
      console.log("📡 Fetching fresh data without cache");
      const [songsRes, artistsRes, playlistsRes] = await Promise.all([
        fetch("https://saavn.sumit.co/api/search/songs?query=Songs&limit=6", {
          signal,
        }).then((res) => res.json()),
        fetch(
          "https://saavn.sumit.co/api/search/artists?query=Artist&limit=6",
          { signal },
        ).then((res) => res.json()),
        fetch(
          "https://saavn.sumit.co/api/search/playlists?query=Playlist&limit=6",
          { signal },
        ).then((res) => res.json()),
      ]);

      console.log("📊 API Responses:", {
        songs: songsRes.success ? songsRes.data.results.length : "failed",
        artists: artistsRes.success ? artistsRes.data.results.length : "failed",
        playlists: playlistsRes.success
          ? playlistsRes.data.results.length
          : "failed",
      });

      // Set data directly
      if (songsRes.success) {
        console.log("📝 Setting songs data:", songsRes.data.results.length);
        setSongs(songsRes.data.results);
      }
      if (artistsRes.success) {
        console.log("📝 Setting artists data:", artistsRes.data.results.length);
        setArtists(artistsRes.data.results);
      }
      if (playlistsRes.success) {
        console.log(
          "📝 Setting playlists data:",
          playlistsRes.data.results.length,
        );
        setPlaylists(playlistsRes.data.results);
      }

      console.log("✅ Data fetched successfully");
      console.log(
        "🔍 Final state - artists:",
        artists.length,
        "playlists:",
        playlists.length,
        "songs:",
        songs.length,
      );
    } catch (err) {
      console.log("❌ Fetch Error:", err);
    } finally {
      console.log("🏁 Setting loading to false");
      setLoading(false);
      // Clear the abort controller to allow next fetch
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => abortControllerRef.current?.abort();
  }, [fetchData]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Recently Played (From Store Queue) */}
      {recentSongs.length > 0 && (
        <HorizontalSection
          setActiveTab={setActiveTab}
          title="Recently Played"
          data={recentSongs}
          loading={false}
          type="song"
          onEntryPress={handlePlaySong}
          navigation={navigation}
        />
      )}

      {/* 2. Fetched Data */}
      <HorizontalSection
        setActiveTab={setActiveTab}
        navigation={navigation}
        title="Top Artists"
        data={artists}
        loading={loading}
        type="artist"
      />
      <HorizontalSection
        setActiveTab={setActiveTab}
        navigation={navigation}
        title="Featured Playlists"
        data={playlists}
        loading={loading}
        type="playlist"
      />
      <HorizontalSection
        setActiveTab={setActiveTab}
        navigation={navigation}
        title="New Suggestions"
        data={songs}
        loading={loading}
        type="song"
        onEntryPress={handlePlaySong}
      />

      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionContainer: { marginBottom: 25 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title: { fontSize: 20, fontWeight: "bold" },
  squareCard: { width: 140, marginRight: 15 },
  squareImg: { width: 140, height: 140, borderRadius: 20, marginBottom: 8 },
  circleCard: { width: 110, marginRight: 15, alignItems: "center" },
  circleImg: { width: 100, height: 100, borderRadius: 50, marginBottom: 8 },
  cardTitle: { fontWeight: "bold", fontSize: 13, textAlign: "center" },
});

export default React.memo(Suggested);
