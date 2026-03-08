import React from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "react-native"; // Standard RN Text
import { Ionicons } from '@expo/vector-icons'; 
import { useThemeColor } from '@/hooks/use-theme-color'; // Aapka custom hook

const { width } = Dimensions.get("window");

// ⭐ Icon mapping matched with your Tabs.Navigator Screen Names
const tabIcons: any = {
  Home: {
    label: "Home",
    activeName: "home",
    inactiveName: "home-outline",
  },
  Favourites: {
    label: "Favourites",
    activeName: "heart",
    inactiveName: "heart-outline",
  },
  Playlist: {
    label: "Playlist",
    activeName: "musical-notes",
    inactiveName: "musical-notes-outline",
  },
  Settings: {
    label: "Settings",
    activeName: "settings",
    inactiveName: "settings-outline",
  },
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  
  // 🎨 Fetching theme-based colors using your hook
  const backgroundColor = useThemeColor({}, 'background');
  const activeColor = useThemeColor({}, 'accent');
  const inactiveColor = useThemeColor({}, 'tabIconDefault');
  const borderColor = useThemeColor({}, 'border'); // theme.ts mein 'border' add kar sakte ho ya default shadow use karein

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: backgroundColor,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
        borderTopColor: borderColor || 'rgba(0,0,0,0.05)'
      }
    ]}>
      <View style={styles.bottomTabBar}>
        {state.routes.map((route: any, index: number) => {
          const tab = tabIcons[route.name];
          if (!tab) return null;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <View style={{ alignItems: 'center' }}>
                <Ionicons 
                  name={isFocused ? tab.activeName : tab.inactiveName} 
                  size={isFocused ? 24 : 26} 
                  color={isFocused ? activeColor : inactiveColor} 
                />
                
                {/* Text only visible on focused tab to look modern */}
                {isFocused && (
                  <Text style={[styles.activeLabel, { color: activeColor }]}>
                    {tab.label}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default CustomTabBar;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
    // Shadow for better depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 20, 
  },
  bottomTabBar: {
    flexDirection: "row",
    width: width,
    paddingHorizontal: 10,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    minHeight: 65,
  },
  activeLabel: {
    fontSize: 10, 
    fontWeight: '700', 
    marginTop: 4,
    letterSpacing: 0.5
  }
});