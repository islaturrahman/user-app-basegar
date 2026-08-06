import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Router from './src/config/router';
import { BottomMenu } from './src/components/BottomMenu';
import NetworkMonitor from './src/components/NetworkMonitor';

import GlobalProvider from './src/provider/GlobalProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
      <GlobalProvider>
        <View className="flex-1">
          {/* Router menangani semua layar dan logika autentikasi */}
          <Router />
          
          {/* Render Network Monitor secara global */}
          <NetworkMonitor />
          
          {/* Menampilkan BottomMenu di atas semua layar */}
          <BottomMenu />
        </View>
        </GlobalProvider>
      </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
