import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function NetworkMonitor() {
  const [isConnected, setIsConnected] = useState(true);
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Custom ping interval as fallback for netinfo
    const interval = setInterval(async () => {
      try {
        if (Platform.OS === 'web') {
          setIsConnected(window.navigator.onLine);
          return;
        }
        const response = await fetch('https://1.1.1.1', { method: 'HEAD', cache: 'no-cache' });
        setIsConnected(response.ok);
      } catch (e) {
        setIsConnected(false);
      }
    }, 5000); // Ping every 5 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isConnected ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnected, animation]);

  if (isConnected) return null; // Tidak render apapun jika online

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0], // Muncul dari atas ke bawah
  });

  return (
    <Animated.View
      style={{ transform: [{ translateY }] }}
      className="absolute top-0 left-0 right-0 bg-red-600 z-[9999] shadow-md flex-row items-center justify-center px-4"
    >
      <View style={{ paddingTop: Platform.OS === 'ios' ? 48 : 32, paddingBottom: 12 }} className="flex-row items-center justify-center">
        <FontAwesome5 name="wifi" size={14} color="#fca5a5" style={{ textDecorationLine: 'line-through' }} />
        <Text className="text-white font-bold text-xs ml-2">
          Tidak ada koneksi internet. Mohon periksa jaringan Anda.
        </Text>
      </View>
    </Animated.View>
  );
}
