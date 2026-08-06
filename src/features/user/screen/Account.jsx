import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppBar from "../../../components/AppBar";
import { BottomMenu } from "../../../components/BottomMenu";
import { CustomerProvider } from "../../../provider/CustomerProvider";
import { FontAwesome5 } from "@expo/vector-icons";

// Simple skeleton for text
const TextShimmerLoad = () => (
  <View className="w-1/2 h-5 bg-white/30 rounded mb-2" />
);

export default function Account() {
  const [user, setUser] = useState(null);
  const navigation = useNavigation();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Apakah Anda yakin ingin keluar?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("authToken");
            await AsyncStorage.removeItem("user");
            import('react-native').then(({ DeviceEventEmitter }) => {
              DeviceEventEmitter.emit('authStateChanged', false);
            });
            navigation.reset({ index: 0, routes: [{ name: "/login" }] });
          }
        }
      ]
    );
  };

  const getCustomerInfo = async () => {
    try {
      // 1. Coba ambil dari cache lokal agar tampil lebih cepat
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && (parsed.id || parsed.f_name)) {
          setUser(parsed);
        }
      }

      // 2. Fetch data terbaru dari API
      const customerProvider = new CustomerProvider();
      const userModel = await customerProvider.getCustomer();
      if (userModel) {
        const userData = userModel.getUser();
        
        // Pastikan bukan pesan error (kalau gagal, api.js me-return {status: false})
        if (userData && (userData.id || userData.f_name)) {
          setUser(userData);
          await AsyncStorage.setItem("user", JSON.stringify(userData));
        } else if (userData && userData.status === false) {
          // Handle token kedaluwarsa atau belum login
          console.warn("API Error / Not logged in:", userData.message);
        }
      }
    } catch (error) {
      console.error("Get customer info error:", error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const checkAuth = async () => {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          navigation.reset({
            index: 1,
            routes: [{ name: "/" }, { name: "/login" }],
          });
        } else {
          getCustomerInfo();
        }
      };
      checkAuth();
    }, [navigation])
  );

  return (
    <View className="flex-1 bg-white">
      <AppBar title="Account" />
      
      <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
        {/* User Info Header */}
        <View className="bg-green-500 p-6">
          <View className="mb-6">
            {user ? (
              <>
                <Text className="text-xl font-light text-white mb-1">
                  {user.f_name} {user.l_name}
                </Text>
                <Text className="text-sm font-light text-white">
                  {user.email}
                </Text>
              </>
            ) : (
              <>
                <TextShimmerLoad />
                <View className="w-1/3 h-4 bg-white/30 rounded" />
              </>
            )}
          </View>

          {/* Wallet & Points */}
          <View className="flex-row mt-2">
            <View className="flex-1 bg-lime-100 p-3 rounded-lg mr-2 justify-center">
              <Text className="font-medium text-gray-800 mb-2">Dompet</Text>
              <View className="flex-row items-center">
                <FontAwesome5 name="wallet" size={14} color="#166534" />
                <Text className="text-green-800 font-light ml-2">
                  Rp {user && user.wallet_balance !== undefined ? Number(user.wallet_balance).toLocaleString('id-ID') : "0"}
                </Text>
              </View>
            </View>

            <View className="flex-1 bg-orange-100 p-3 rounded-lg ml-2 justify-center">
              <Text className="font-medium text-gray-800 mb-2">Point</Text>
              <View className="flex-row items-center">
                <FontAwesome5 name="bullseye" size={14} color="#eab308" />
                <Text className="text-green-800 font-light ml-2">
                  {user && user.loyalty_point !== undefined ? user.loyalty_point : "0"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="bg-white px-6 pt-2 mt-4 pb-24">
          
          <TouchableOpacity 
            onPress={() => navigation.navigate("/orders")}
            className="flex-row items-center border-b border-gray-300 pb-3"
          >
            <View className="border border-gray-200 rounded-full p-2 items-center justify-center w-10 h-10">
              <FontAwesome5 name="clipboard" size={16} color="#15803d" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-light text-base text-gray-800">Pesanan</Text>
              <Text className="text-sm text-gray-400 font-light mt-0.5">Kelola pesanan</Text>
            </View>
            <FontAwesome5 name="arrow-right" size={16} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate("/address")}
            className="flex-row items-center border-b border-gray-300 pb-3 mt-4"
          >
            <View className="border border-gray-200 rounded-full p-2 items-center justify-center w-10 h-10">
              <FontAwesome5 name="map-marker-alt" size={16} color="#15803d" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-light text-base text-gray-800">Alamat</Text>
              <Text className="text-sm text-gray-400 font-light mt-0.5">Kelola alamat pengiriman</Text>
            </View>
            <FontAwesome5 name="arrow-right" size={16} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate("/voucher")}
            className="flex-row items-center border-b border-gray-300 pb-3 mt-4"
          >
            <View className="border border-gray-200 rounded-full p-2 items-center justify-center w-10 h-10">
              <FontAwesome5 name="gift" size={16} color="#15803d" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-light text-base text-gray-800">Voucher Saya</Text>
              <Text className="text-sm text-gray-400 font-light mt-0.5">Voucher untuk saya</Text>
            </View>
            <FontAwesome5 name="arrow-right" size={16} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleLogout}
            className="flex-row items-center pb-3 mt-4"
          >
            <View className="border border-gray-200 rounded-full p-2 items-center justify-center w-10 h-10">
              <FontAwesome5 name="sign-out-alt" size={16} color="#6b7280" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-light text-base text-gray-800">Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <BottomMenu />
    </View>
  );
}
