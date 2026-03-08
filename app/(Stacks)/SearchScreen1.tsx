import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSearchStore } from '@/store/useSearchStore';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SearchScreen1({ navigation }: any) {
  const [query, setQuery] = useState('');
  const { recentSearches, addSearch, removeSearch, clearAll } = useSearchStore();

  // --- Theme Colors ---
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secColor = useThemeColor({}, 'secondaryText');
  const accentColor = useThemeColor({}, 'accent');
  const cardColor = useThemeColor({}, 'card');

  const handleSearchAction = (text: string) => {
    if (!text.trim()) return;
    addSearch(text); // Store in history
    navigation.navigate('SearchScreen2', { searchQuery: text }); // Go to results
  };

  const renderRecentItem = ({ item }: { item: string }) => (
    <View style={[styles.recentRow, { borderBottomColor: `${secColor}33` }]}>
      <TouchableOpacity 
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} 
        onPress={() => handleSearchAction(item)}
      >
        <Ionicons name="time-outline" size={20} color={secColor} />
        <Text style={[styles.recentText, { color: textColor }]}>{item}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => removeSearch(item)}>
        <Ionicons name="close" size={20} color={secColor} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <View style={[styles.searchBar, { backgroundColor: cardColor, borderColor: accentColor }]}>
          <Ionicons name="search" size={18} color={secColor} />
          <TextInput
            placeholder="Search songs, albums..."
            placeholderTextColor={secColor}
            style={[styles.input, { color: textColor }]}
            numberOfLines={1}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearchAction(query)}
            autoFocus
          />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Searches</Text>
        <TouchableOpacity onPress={clearAll}>
          <Text style={[styles.clearAllText, { color: accentColor }]}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={recentSearches}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderRecentItem}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        // Added this to handle empty state text color if needed later
        ListEmptyComponent={() => (
          <Text style={{ color: secColor, textAlign: 'center', marginTop: 20 }}>
            No recent searches
          </Text>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginVertical: 20, 
    marginTop: 50 
  },
  searchBar: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginLeft: 15, 
    paddingHorizontal: 15, 
    borderRadius: 12, 
    height: 48, 
    borderWidth: 1 
  },
  input: { flex: 1, height: 48, marginLeft: 10, fontSize: 16 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    marginBottom: 15, 
    alignItems: 'center' 
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  clearAllText: { fontWeight: '600' },
  recentRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15, 
    borderBottomWidth: 0.5 
  },
  recentText: { fontSize: 16, marginLeft: 15 }
});