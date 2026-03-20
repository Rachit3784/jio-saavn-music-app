import { useThemeColor } from "@/hooks/use-theme-color";
import { useMusicStore } from "@/store/myStore";
import { useSongCacheStore } from "@/store/songCacheStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Songs = ({ navigation }) => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showingCached, setShowingCached] = useState(false);
  const [cacheOffset, setCacheOffset] = useState(0); // Track how many cached songs we've shown
  const abortControllerRef = useRef<AbortController | null>(null);
  const setSong = useMusicStore((state) => state.setSong);
  const textColor = useThemeColor({}, "text");
  const secColor = useThemeColor({}, "secondaryText");
  const accentColor = useThemeColor({}, "accent");
  const { isPlaying, currentSong } = useMusicStore();
  const { addSongs, getCachedSongs, isCacheExpired } = useSongCacheStore();
  const fetchSongs = useCallback(
    async (pageNum: number) => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        const response = await fetch(
          `https://saavn.sumit.co/api/search/songs?query=Songs&page=${pageNum}&limit=20`,
          { signal: abortControllerRef.current.signal },
        );

        const json = await response.json();

        if (json.success) {
          const newSongs = json.data.results;
          console.log(" Fetched", newSongs.length, "new songs from API");
          // Add new songs to cache
          addSongs(newSongs);
          console.log(" Added", newSongs.length, "songs to cache");
          // Update state with new songs
          setData((prev) =>
            pageNum === 1 ? newSongs : [...prev, ...newSongs],
          );
          setTotal((prev) =>
            pageNum === 1 ? newSongs.length : prev + newSongs.length,
          );
          setShowingCached(false);
          console.log(" Updated UI with fresh songs");
        }
      } catch (err: any) {
        if (err.name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [addSongs],
  );

  useEffect(() => {
    console.log("🚀 Songs component mounted");

    // Check if we have cached songs and cache is not expired
    const cachedSongs = getCachedSongs();
    const hasValidCache = cachedSongs.length > 0 && !isCacheExpired();

    console.log("📦 Cache status:", {
      totalCached: cachedSongs.length,
      isExpired: isCacheExpired(),
      hasValidCache,
    });

    if (hasValidCache) {
      // Show first 20 cached songs
      const firstBatch = cachedSongs.slice(0, 20);
      setData(firstBatch);
      setTotal(cachedSongs.length);
      setShowingCached(true);
      setCacheOffset(20); // We've shown 20 songs from cache
      console.log("⚡ Showing first", firstBatch.length, "cached songs");

      // Calculate what page we should start from for pagination
      const cachedPages = Math.ceil(cachedSongs.length / 20);
      setPage(cachedPages + 1);
      console.log(
        "📖 Set next page to:",
        cachedPages + 1,
        "based on",
        cachedSongs.length,
        "cached songs",
      );
    } else {
      console.log("📭 No valid cache found, fetching fresh data");
      // Only fetch if no valid cache
      fetchSongs(1);
    }

    return () => abortControllerRef.current?.abort();
  }, [fetchSongs, getCachedSongs, isCacheExpired]);

  const renderItem = useCallback(
    ({ item }: any) => (
      <TouchableOpacity
        onPress={() => {
          setSong(item.id, {
            name: item.name,
            duration: item.duration,
            image: item.image[item.image.length - 1].url,
            downloadUrl: item.downloadUrl[item.downloadUrl.length - 1].url,
            hasLyrics: item.hasLyrics,
            lyricsUrl: item.url,
            lyricsId: item.lyricsId,
            songId: item.id,
            isPlaying: true,
          });

          navigation.navigate("Stacks", {
            screen: "Player",
            params: { songId: item.id },
          });
        }}
        style={styles.songRow}
      >
        <Image source={{ uri: item.image[1].url }} style={styles.songThumb} />
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text
            numberOfLines={1}
            style={[styles.songTitle, { color: textColor }]}
          >
            {item.name}
          </Text>
          <Text numberOfLines={1} style={{ color: secColor, fontSize: 12 }}>
            {item.artists.primary[0]?.name} | {Math.floor(item.duration / 60)}:
            {(item.duration % 60).toString().padStart(2, "0")} mins
          </Text>
        </View>
        {isPlaying && item.id === currentSong?.id ? (
          <Ionicons name="pause-circle-outline" size={32} color={accentColor} />
        ) : (
          <Ionicons name="play-circle" size={32} color={accentColor} />
        )}
        <Ionicons
          name="ellipsis-vertical"
          size={20}
          color={secColor}
          style={{ marginLeft: 10 }}
        />
      </TouchableOpacity>
    ),
    [
      textColor,
      secColor,
      accentColor,
      data,
      navigation,
      isPlaying,
      currentSong,
    ],
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.countRow}>
        <View>
          <Text style={{ color: textColor, fontWeight: "bold" }}>
            {total} songs
          </Text>
          {showingCached && (
            <Text style={{ color: secColor, fontSize: 12 }}>From cache</Text>
          )}
        </View>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <Text style={{ color: accentColor, marginRight: 5 }}>Ascending</Text>
          <Ionicons name="swap-vertical" size={16} color={accentColor} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={data}
        keyExtractor={(item, index) => item.id + index}
        renderItem={renderItem}
        onEndReached={() => {
          if (loading) return;

          if (showingCached) {
            // We're showing cached songs, check if there are more cached songs
            const cachedSongs = getCachedSongs();
            const remainingCachedSongs = cachedSongs.slice(
              cacheOffset,
              cacheOffset + 20,
            );

            if (remainingCachedSongs.length > 0) {
              // Show next batch of cached songs
              console.log(
                "� Loading next",
                remainingCachedSongs.length,
                "songs from cache (offset:",
                cacheOffset,
                ")",
              );
              setData((prev) => [...prev, ...remainingCachedSongs]);
              setCacheOffset((prev) => prev + remainingCachedSongs.length);
              console.log(
                "📖 Cache offset updated to:",
                cacheOffset + remainingCachedSongs.length,
              );
            } else {
              // No more cached songs, switch to API fetch
              console.log(
                "🔄 Cache exhausted, switching to API fetch from page:",
                page,
              );
              setShowingCached(false);
              fetchSongs(page);
            }
          } else {
            // We're already fetching from API, continue pagination
            console.log("📄 End reached, fetching page:", page);
            setPage((p) => {
              fetchSongs(p + 1);
              return p + 1;
            });
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? <ActivityIndicator color={accentColor} /> : null
        }
      />
    </View>
  );
};

export default React.memo(Songs);

const styles = StyleSheet.create({
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  songThumb: { width: 60, height: 60, borderRadius: 12 },
  songTitle: { fontSize: 16, fontWeight: "bold" },
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 15,
    alignItems: "center",
  },
});
