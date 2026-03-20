import { useThemeColor } from "@/hooks/use-theme-color";
import { useArtistsCacheStore } from "@/store/artistsCacheStore";
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

const Artists = () => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showingCached, setShowingCached] = useState(false);
  const [cacheOffset, setCacheOffset] = useState(0); // Track how many cached artists we've shown
  const abortControllerRef = useRef<AbortController | null>(null);

  const textColor = useThemeColor({}, "text");
  const secColor = useThemeColor({}, "secondaryText");
  const accentColor = useThemeColor({}, "accent");

  const { addArtists, getCachedArtists, isCacheExpired } =
    useArtistsCacheStore();

  const fetchArtists = useCallback(
    async (pageNum: number) => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        const response = await fetch(
          `https://saavn.sumit.co/api/search/artists?query=artists&page=${pageNum}&limit=20`,
          { signal: abortControllerRef.current.signal },
        );
        const json = await response.json();

        if (json.success) {
          const newArtists = json.data.results;
          console.log("📡 Fetched", newArtists.length, "new artists from API");
          // Add new artists to cache
          addArtists(newArtists);
          console.log("📝 Added", newArtists.length, "artists to cache");
          // Update state with new artists
          setData((prev) =>
            pageNum === 1 ? newArtists : [...prev, ...newArtists],
          );
          setTotal((prev) =>
            pageNum === 1 ? newArtists.length : prev + newArtists.length,
          );
          setShowingCached(false);
          console.log("✅ Updated UI with fresh artists");
        }
      } catch (err: any) {
        if (err.name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [addArtists],
  );

  useEffect(() => {
    console.log("🚀 Artists component mounted");

    // Check if we have cached artists and cache is not expired
    const cachedArtists = getCachedArtists();
    const hasValidCache = cachedArtists.length > 0 && !isCacheExpired();

    console.log("📦 Cache status:", {
      totalCached: cachedArtists.length,
      isExpired: isCacheExpired(),
      hasValidCache,
    });

    if (hasValidCache) {
      // Show first 20 cached artists
      const firstBatch = cachedArtists.slice(0, 20);
      setData(firstBatch);
      setTotal(cachedArtists.length);
      setShowingCached(true);
      setCacheOffset(20); // We've shown 20 artists from cache
      console.log("⚡ Showing first", firstBatch.length, "cached artists");

      // Calculate what page we should start from for pagination
      const cachedPages = Math.ceil(cachedArtists.length / 20);
      setPage(cachedPages + 1);
      console.log(
        "📖 Set next page to:",
        cachedPages + 1,
        "based on",
        cachedArtists.length,
        "cached artists",
      );
    } else {
      console.log("📭 No valid cache found, fetching fresh data");
      // Only fetch if no valid cache
      fetchArtists(1);
    }

    return () => abortControllerRef.current?.abort();
  }, [fetchArtists, getCachedArtists, isCacheExpired]);

  const renderItem = useCallback(
    ({ item }: any) => (
      <View style={styles.artistRow}>
        <Image source={{ uri: item.image[1].url }} style={styles.artistThumb} />
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={[styles.name, { color: textColor }]}>{item.name}</Text>
          <Text style={{ color: secColor }}>Artist</Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={20} color={secColor} />
      </View>
    ),
    [textColor, secColor],
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.countRow}>
        <View>
          <Text style={{ color: textColor, fontWeight: "bold" }}>
            {total} artists
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
            // We're showing cached artists, check if there are more cached artists
            const cachedArtists = getCachedArtists();
            const remainingCachedArtists = cachedArtists.slice(
              cacheOffset,
              cacheOffset + 20,
            );

            if (remainingCachedArtists.length > 0) {
              // Show next batch of cached artists
              console.log(
                "⚡ Loading next",
                remainingCachedArtists.length,
                "artists from cache (offset:",
                cacheOffset,
                ")",
              );
              setData((prev) => [...prev, ...remainingCachedArtists]);
              setCacheOffset((prev) => prev + remainingCachedArtists.length);
              console.log(
                "📖 Cache offset updated to:",
                cacheOffset + remainingCachedArtists.length,
              );
            } else {
              // No more cached artists, switch to API fetch
              console.log(
                "🔄 Cache exhausted, switching to API fetch from page:",
                page,
              );
              setShowingCached(false);
              fetchArtists(page);
            }
          } else {
            // We're already fetching from API, continue pagination
            console.log("📄 End reached, fetching page:", page);
            setPage((p) => {
              fetchArtists(p + 1);
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

export default React.memo(Artists);

const styles = StyleSheet.create({
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  artistThumb: { width: 60, height: 60, borderRadius: 30 },
  name: { fontSize: 16, fontWeight: "bold" },
  countRow: { paddingHorizontal: 20, marginBottom: 15 , flexDirection : 'row' , justifyContent : 'space-between' },
});
