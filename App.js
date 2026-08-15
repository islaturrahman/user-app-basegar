import { Platform } from 'react-native';
if (Platform.OS === 'web') {
  require('./output.css');
}
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Router from './src/config/router';
import { BottomMenu } from './src/components/BottomMenu';
import NetworkMonitor from './src/components/NetworkMonitor';

import GlobalProvider from './src/provider/GlobalProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as ImagePicker from 'expo-image-picker';


SplashScreen.preventAutoHideAsync();

import { useFonts } from 'expo-font';
import { 
  Poppins_300Light, 
  Poppins_400Regular, 
  Poppins_500Medium, 
  Poppins_600SemiBold, 
  Poppins_700Bold, 
  Poppins_800ExtraBold 
} from '@expo-google-fonts/poppins';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 2,
    },
  },
});

const linking = {
  prefixes: ['http://localhost:8081', 'https://basegar.com', 'basegar://'],
  config: {
    screens: {
      '/': '',
      '/cart': 'cart',
      '/p/:id': 'p/:id',
      '/login': 'login',
      '/privacy-policy': 'privacy-policy',
      '/terms-and-conditions': 'terms-and-conditions',
      '/about-us': 'about-us',
      '/account': 'account',
      '/edit-profile': 'edit-profile',
      '/cs': 'cs',
      '/address': 'address',
      '/checkout': 'checkout',
      '/orders': 'orders',
      '/o/:id': 'o/:id',
      '/o/:id/success': 'o/:id/success',
      '/voucher': 'voucher',
      '/categories/:category_id': 'categories/:category_id',
      '/flash-sale/:id': 'flash-sale/:id',
    }
  }
};

export default function App() {
  let [fontsLoaded, fontError] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer 
          linking={linking}
          documentTitle={{
            formatter: (options, route) => {
              return options?.title || 'Basegar - Belanja Segar';
            }
          }}
        >
          <GlobalProvider>
            <View style={styles.webContainer}>
              <View style={styles.appContainer}>
                {/* Router menangani semua layar dan logika autentikasi */}
                <Router />
                
                {/* Render Network Monitor secara global */}
                <NetworkMonitor />
                
                {/* Menampilkan BottomMenu di atas semua layar */}
                <BottomMenu />
              </View>
            </View>
          </GlobalProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: isWeb ? '#f3f4f6' : 'white', // Latar belakang abu-abu di luar frame web
    alignItems: 'center',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: isWeb ? 600 : '100%', // Batasi maksimal lebar seperti ukuran HP di Web
    backgroundColor: 'white',
    // Memberikan bayangan agar terlihat seperti bentuk HP (hanya di Web)
    ...(isWeb && {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    }),
  }
});
