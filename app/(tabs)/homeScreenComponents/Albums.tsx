import { useThemeColor } from "@/hooks/use-theme-color";
import { useAlbumsCacheStore } from "@/store/albumsCacheStore";
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

const Albums = () => {
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0); // Actual total from API
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true); // Tracking if more data exists
  const [showingCached, setShowingCached] = useState(false);
  const [cacheOffset, setCacheOffset] = useState(0); // Track how many cached albums we've shown
  const abortControllerRef = useRef<AbortController | null>(null);

  const textColor = useThemeColor({}, "text");
  const secColor = useThemeColor({}, "secondaryText");
  const accentColor = useThemeColor({}, "accent");

  const { addAlbums, getCachedAlbums, isCacheExpired } = useAlbumsCacheStore();

  const fetchAlbums = useCallback(
    async (pageNum: number) => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        const response = await fetch(
          `https://saavn.sumit.co/api/search/albums?query=albums&page=${pageNum}&limit=20`,
          { signal: abortControllerRef.current.signal },
        );
        const json = await response.json();

        if (json.success) {
          const newItems = json.data.results || [];
          const newItemsCount = newItems.length;

          console.log("📡 Fetched", newItemsCount, "new albums from API");
          console.log("🔍 API Response data:", {
            success: json.success,
            totalResults: newItemsCount,
            sampleAlbum: newItems[0]
              ? {
                  id: newItems[0].id,
                  name: newItems[0].name,
                  hasImage: !!newItems[0].image,
                  imageCount: newItems[0].image?.length,
                  year: newItems[0].year,
                }
              : null,
          });

          // Add new albums to cache
          addAlbums(newItems);
          console.log("📝 Added", newItemsCount, "albums to cache");

          // 1. Data update karein
          if (pageNum === 1) {
            setData(newItems);
            setTotalCount(newItemsCount);
          } else {
            setData((prev) => [...prev, ...newItems]);
            setTotalCount((prev) => prev + newItemsCount);
          }
          setShowingCached(false);

          // 3. Check karein ki aur data hai ya nahi
          if (newItemsCount < 20) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }

          console.log("✅ Updated UI with fresh albums");
        } else {
          console.log("❌ API response was not successful:", json);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") console.error("Album Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    },
    [addAlbums],
  );

  useEffect(() => {
    console.log("🚀 Albums component mounted");

    // Check if we have cached albums and cache is not expired
    const cachedAlbums = getCachedAlbums();
    const hasValidCache = cachedAlbums.length > 0 && !isCacheExpired();

    console.log("📦 Cache status:", {
      totalCached: cachedAlbums.length,
      isExpired: isCacheExpired(),
      hasValidCache,
    });

    if (hasValidCache) {
      // Show first 20 cached albums
      const firstBatch = cachedAlbums.slice(0, 20);
      setData(firstBatch);
      setTotalCount(cachedAlbums.length);
      setShowingCached(true);
      setCacheOffset(20); // We've shown 20 albums from cache
      console.log("⚡ Showing first", firstBatch.length, "cached albums");

      // Calculate what page we should start from for pagination
      const cachedPages = Math.ceil(cachedAlbums.length / 20);
      setPage(cachedPages + 1);
      console.log(
        "📖 Set next page to:",
        cachedPages + 1,
        "based on",
        cachedAlbums.length,
        "cached albums",
      );
    } else {
      console.log("📭 No valid cache found, fetching fresh data");
      // Only fetch if no valid cache
      fetchAlbums(1);
    }

    return () => abortControllerRef.current?.abort();
  }, [fetchAlbums, getCachedAlbums, isCacheExpired]);

  const handleLoadMore = useCallback(() => {
    if (loading) return;

    if (showingCached) {
      // We're showing cached albums, check if there are more cached albums
      const cachedAlbums = getCachedAlbums();
      const remainingCachedAlbums = cachedAlbums.slice(
        cacheOffset,
        cacheOffset + 20,
      );

      if (remainingCachedAlbums.length > 0) {
        // Show next batch of cached albums
        console.log(
          "⚡ Loading next",
          remainingCachedAlbums.length,
          "albums from cache (offset:",
          cacheOffset,
          ")",
        );
        setData((prev) => [...prev, ...remainingCachedAlbums]);
        setCacheOffset((prev) => prev + remainingCachedAlbums.length);
        setTotalCount((prev) => prev + remainingCachedAlbums.length);
        console.log(
          "📖 Cache offset updated to:",
          cacheOffset + remainingCachedAlbums.length,
        );
      } else {
        // No more cached albums, switch to API fetch
        console.log(
          "🔄 Cache exhausted, switching to API fetch from page:",
          page,
        );
        setShowingCached(false);
        fetchAlbums(page);
      }
    } else {
      // We're already fetching from API, continue pagination
      if (!loading && hasMore) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchAlbums(nextPage);
      }
    }
  }, [
    loading,
    showingCached,
    cacheOffset,
    page,
    hasMore,
    fetchAlbums,
    getCachedAlbums,
  ]);

  const renderItem = useCallback(
    ({ item }: any) => (
      <View style={styles.row}>
        <Image source={{ uri: item.image[1]?.url }} style={styles.albumThumb} />
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text numberOfLines={1} style={[styles.title, { color: textColor }]}>
            {item.name}
          </Text>
          <Text numberOfLines={1} style={{ color: secColor, fontSize: 12 }}>
            {item.artists.primary
              ? item.artists.primary[0]?.name
              : "Various Artists"}{" "}
            • {item.year}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={secColor} />
      </View>
    ),
    [textColor, secColor],
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.countRow}>
        <View>
          <Text style={{ color: textColor, fontWeight: "bold" }}>
            {totalCount} total albums
          </Text>
          {showingCached && (
            <Text style={{ color: secColor, fontSize: 12 }}>From cache</Text>
          )}
        </View>
        <TouchableOpacity style={styles.sortBtn}>
          <Text style={{ color: accentColor, marginRight: 5 }}>Newest</Text>
          <Ionicons name="swap-vertical" size={16} color={accentColor} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item, index) => `${item.id}-${index}`} // Safe key
        renderItem={renderItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5} // Jab list 50% end par ho tabhi trigger ho jaye
        ListFooterComponent={
          loading ? (
            <ActivityIndicator color={accentColor} style={{ margin: 20 }} />
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }} // Extra space for miniplayer
      />
    </View>
  );
};

export default React.memo(Albums);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  albumThumb: { width: 60, height: 60, borderRadius: 10 },
  title: { fontSize: 16, fontWeight: "bold" },
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 15,
    alignItems: "center",
  },
  sortBtn: { flexDirection: "row", alignItems: "center" },
});
