import React, { useState, useEffect } from 'react';
import { View, Text, DeviceEventEmitter } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Loader } from '../components/Loader';
import Home from '../features/home/screen/Home';

import CartView from "../features/cart/screen/CartView";
import ProductDetails from "../features/product/screen/ProductDetails";
import CategoryView from "../features/category/screen/CategoryView";
import Login from "../features/auth/screen/Login";
import Account from "../features/user/screen/Account";
import AddressView from "../features/address/screen/AddressView";
import AddAddressView from "../features/address/screen/AddAddressView";
import EditAddressView from "../features/address/screen/EditAddressView";
import PickAddressView from "../features/address/screen/PickAddressView";
import Checkout from "../features/checkout/screen/Checkout";
import OrdersView from "../features/orders/screen/OrdersView";
import OrderDetailView from "../features/orders/screen/OrderDetailView";
import OrderSuccessView from "../features/orders/screen/OrderSuccessView";
import ChatCsView from "../features/cs/screen/ChatCsView";
import StaticPage from "../features/user/screen/StaticPage";
import VoucherView from "../features/voucher/screen/VoucherView";
// ... dan lain-lain
const Stack = createNativeStackNavigator();

// Komponen sementara untuk layar yang belum dibuat
const PlaceholderScreen = ({ route }) => (
  <View className="flex-1 items-center justify-center bg-gray-50">
    <Text className="text-xl font-bold text-gray-700">Layar: {route.name}</Text>
    <Text className="text-sm text-gray-500 mt-2">Belum diimplementasikan</Text>
  </View>
);

export default function Router() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        setIsAuthenticated(token !== null);
      } catch (error) {
        console.error("Gagal mengecek auth token:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    const authListener = DeviceEventEmitter.addListener('authStateChanged', (status) => {
      setIsAuthenticated(status);
    });

    return () => {
      authListener.remove();
    };
  }, []);

  if (isLoading) {
    // Tampilkan loader selagi mengecek AsyncStorage
    return <Loader type="full" isLoading={true} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* 
        ========================================================
        RUTE PUBLIK (Dapat diakses siapa saja, termasuk yang belum login)
        ========================================================
      */}
      <Stack.Screen name="/" component={Home} />
      <Stack.Screen name="/cart" component={CartView} />
      {/* Route untuk detail produk dengan parameter ID. Menggunakan presentasi 'transparentModal' untuk efek bottom sheet */}
      <Stack.Screen 
        name="/p/:id" 
        component={ProductDetails} 
        options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="/login" component={Login} />
      <Stack.Screen name="/signup" component={PlaceholderScreen} />
      <Stack.Screen name="/static" component={StaticPage} />
      <Stack.Screen name="/privacy-policy" component={StaticPage} initialParams={{ type: 'privacy_policy', title: 'Kebijakan Privasi' }} />
      <Stack.Screen name="/terms-and-conditions" component={StaticPage} initialParams={{ type: 'terms_and_conditions', title: 'Syarat & Ketentuan' }} />
      <Stack.Screen name="/about-us" component={StaticPage} initialParams={{ type: 'about_us', title: 'Tentang Kami' }} />
      
      {/* Produk & Delivery */}
      <Stack.Screen name="/check-maxim" component={PlaceholderScreen} />
      
      {/* Penemuan */}
      <Stack.Screen name="/voucher" component={VoucherView} />
      <Stack.Screen name="/categories/:category_id" component={CategoryView} />
      <Stack.Screen name="/games" component={PlaceholderScreen} />
      <Stack.Screen name="/games/watermelon-game" component={PlaceholderScreen} />

      {/* Rute yang sering diakses dari BottomMenu diletakkan di public jika tidak login (akan diarahkan manual), tapi sekarang diminta pindah ke private */}
      {/* 
        ========================================================
        RUTE PRIVATE (Hanya di-render dan bisa diakses jika sudah login)
        ========================================================
      */}
      {isAuthenticated ? (
        <>
          <Stack.Screen name="/account" component={Account} />
          <Stack.Screen name="/cs" component={ChatCsView} />
          <Stack.Screen name="/address" component={AddressView} />
          <Stack.Screen name="/address/pick" component={PickAddressView} />
          <Stack.Screen name="/address/add" component={AddAddressView} />
          <Stack.Screen name="/address/edit/:id" component={EditAddressView} />
          <Stack.Screen name="/orders" component={OrdersView} />
          <Stack.Screen name="/o/:id" component={OrderDetailView} />
          <Stack.Screen name="/o/:id/success" component={OrderSuccessView} />
          <Stack.Screen name="/checkout" component={Checkout} />
          <Stack.Screen name="/help" component={PlaceholderScreen} />
        </>
      ) : null}

    </Stack.Navigator>
  );
}
