import { useThemeColor } from "@/hooks/use-theme-color";
import { usePlaylistsCacheStore } from "@/store/playlistsCacheStore";
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

const Playlists = () => {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showingCached, setShowingCached] = useState(false);
  const [cacheOffset, setCacheOffset] = useState(0); // Track how many cached playlists we've shown
  const abortControllerRef = useRef<AbortController | null>(null);

  const textColor = useThemeColor({}, "text");
  const secColor = useThemeColor({}, "secondaryText");
  const accentColor = useThemeColor({}, "accent");

  const { addPlaylists, getCachedPlaylists, isCacheExpired } =
    usePlaylistsCacheStore();

  const fetchPlaylists = useCallback(
    async (pageNum: number) => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        const response = await fetch(
          `https://saavn.sumit.co/api/search/playlists?query=Playlist&page=${pageNum}&limit=20`,
          { signal: abortControllerRef.current.signal },
        );

        const json = await response.json();

        if (json.success) {
          const newPlaylists = json.data.results;
          console.log(
            "📡 Fetched",
            newPlaylists.length,
            "new playlists from API",
          );
          console.log("🔍 API Response data:", {
            success: json.success,
            totalResults: json.data.results?.length,
            samplePlaylist: newPlaylists[0]
              ? {
                  id: newPlaylists[0].id,
                  name: newPlaylists[0].name,
                  hasImage: !!newPlaylists[0].image,
                  imageCount: newPlaylists[0].image?.length,
                }
              : null,
          });
          // Add new playlists to cache
          addPlaylists(newPlaylists);
          console.log("📝 Added", newPlaylists.length, "playlists to cache");
          // Update state with new playlists
          if (pageNum === 1) {
            setData(newPlaylists);
          } else {
            setData((prev) => [...prev, ...newPlaylists]);
          }
          setShowingCached(false);
          console.log("✅ Updated UI with fresh playlists");
        } else {
          console.log("❌ API response was not successful:", json);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [addPlaylists],
  );

  useEffect(() => {
    console.log("🚀 Playlists component mounted");

    // Check if we have cached playlists and cache is not expired
    const cachedPlaylists = getCachedPlaylists();
    const hasValidCache = cachedPlaylists.length > 0 && !isCacheExpired();

    console.log("📦 Cache status:", {
      totalCached: cachedPlaylists.length,
      isExpired: isCacheExpired(),
      hasValidCache,
    });

    if (hasValidCache) {
      // Show first 10 cached playlists (note: playlists use limit=10)
      const firstBatch = cachedPlaylists.slice(0, 10);
      setData(firstBatch);
      setShowingCached(true);
      setCacheOffset(10); // We've shown 10 playlists from cache
      console.log("⚡ Showing first", firstBatch.length, "cached playlists");

      // Calculate what page we should start from for pagination
      const cachedPages = Math.ceil(cachedPlaylists.length / 10);
      setPage(cachedPages + 1);
      console.log(
        "📖 Set next page to:",
        cachedPages + 1,
        "based on",
        cachedPlaylists.length,
        "cached playlists",
      );
    } else {
      console.log("📭 No valid cache found, fetching fresh data");
      // Only fetch if no valid cache
      fetchPlaylists(1);
    }

    return () => abortControllerRef.current?.abort();
  }, [fetchPlaylists, getCachedPlaylists, isCacheExpired]);

  const renderItem = useCallback(
    ({ item }: any) => (
      <TouchableOpacity style={styles.playlistRow} activeOpacity={0.7}>
        <Image
          source={{ uri: item.image[1].url }}
          style={styles.playlistThumb}
        />
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text numberOfLines={1} style={[styles.name, { color: textColor }]}>
            {item.name}
          </Text>
          <Text style={{ color: secColor, fontSize: 13 }}>
            {item.songCount} songs • {item.language}
          </Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={20} color={secColor} />
      </TouchableOpacity>
    ),
    [textColor, secColor],
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.countRow}>
        <View>
          <Text style={{ color: textColor, fontWeight: "bold" }}>
            {data.length} playlists loaded
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
            // We're showing cached playlists, check if there are more cached playlists
            const cachedPlaylists = getCachedPlaylists();
            const remainingCachedPlaylists = cachedPlaylists.slice(
              cacheOffset,
              cacheOffset + 10, // Playlists use limit=10
            );

            if (remainingCachedPlaylists.length > 0) {
              // Show next batch of cached playlists
              console.log(
                "⚡ Loading next",
                remainingCachedPlaylists.length,
                "playlists from cache (offset:",
                cacheOffset,
                ")",
              );
              setData((prev) => [...prev, ...remainingCachedPlaylists]);
              setCacheOffset((prev) => prev + remainingCachedPlaylists.length);
              console.log(
                "📖 Cache offset updated to:",
                cacheOffset + remainingCachedPlaylists.length,
              );
            } else {
              // No more cached playlists, switch to API fetch
              console.log(
                "🔄 Cache exhausted, switching to API fetch from page:",
                page,
              );
              setShowingCached(false);
              fetchPlaylists(page);
            }
          } else {
            // We're already fetching from API, continue pagination
            console.log("📄 End reached, fetching page:", page);
            setPage((p) => {
              fetchPlaylists(p + 1);
              return p + 1;
            });
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator
              color={accentColor}
              style={{ marginVertical: 20 }}
            />
          ) : null
        }
      />
    </View>
  );
};

export default React.memo(Playlists);

const styles = StyleSheet.create({
  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
    marginTop: 0,
  },
  playlistThumb: { width: 65, height: 65, borderRadius: 8 },
  name: { fontSize: 16, fontWeight: "bold" },
  countRow: {
    paddingHorizontal: 20,
    marginVertical: 15,
    marginTop: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
