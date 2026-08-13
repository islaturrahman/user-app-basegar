import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, DeviceEventEmitter, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomMenu } from "../../../components/BottomMenu";
import { CustomerProvider } from "../../../provider/CustomerProvider";
import { Coins, Sprout, Ticket, Receipt, MapPin, CreditCard, Undo2, Info, ShieldCheck, FileText, LogOut, ChevronRight, Pencil, Sparkles, Wallet } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toRupiah } from "../../../components/Helper";

const TextShimmerLoad = () => (
  <View className="w-48 h-6 bg-gray-200 rounded animate-pulse" />
);

const MenuItem = ({ icon: Icon, iconColor, title, subtitle, onPress, isLast }) => {
  const isComingSoon = subtitle === "Segera Hadir";
  
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white"
    >
      <View className="flex-row items-center px-4 py-4">
        <View className="w-8 items-center justify-center">
          <Icon size={20} color={iconColor || "#374151"} strokeWidth={2} />
        </View>
        <View className="flex-1 ml-3">
          <View className="flex-row items-center flex-wrap">
            <Text className="text-[13px] font-poppins-medium text-gray-800">{title}</Text>
            {isComingSoon && (
              <View className="ml-2 bg-orange-100 px-1.5 py-0.5 rounded">
                <Text className="text-[8px] font-poppins-medium text-orange-600 uppercase tracking-wider">Coming Soon</Text>
              </View>
            )}
          </View>
          {subtitle && !isComingSoon && (
            <Text className="text-[11px] font-poppins-regular text-gray-500 mt-1">{subtitle}</Text>
          )}
        </View>
        <ChevronRight size={16} color="#9ca3af" strokeWidth={2} />
      </View>
      {!isLast && (
        <View className="h-[1px] bg-gray-100 ml-14 mr-4" />
      )}
    </TouchableOpacity>
  );
};

export default function Account() {
  const [user, setUser] = useState(null);
  const navigation = useNavigation();

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm("Apakah Anda yakin ingin keluar?")) {
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("user");
        DeviceEventEmitter.emit('authStateChanged', false);
        navigation.reset({ index: 0, routes: [{ name: "/login" }] });
      }
    } else {
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
              DeviceEventEmitter.emit('authStateChanged', false);
              navigation.reset({ index: 0, routes: [{ name: "/login" }] });
            }
          }
        ]
      );
    }
  };

  const getCustomerInfo = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && (parsed.id || parsed.f_name)) {
          setUser(parsed);
        }
      }

      const customerProvider = new CustomerProvider();
      const userModel = await customerProvider.getCustomer();
      if (userModel) {
        const userData = userModel.getUser();
        if (userData && (userData.id || userData.f_name)) {
          setUser(userData);
          await AsyncStorage.setItem("user", JSON.stringify(userData));
        } else if (userData && userData.status === false) {
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

  const handleComingSoon = () => {
    Alert.alert("Segera Hadir", "Fitur ini sedang dalam tahap pengembangan dan akan segera tersedia!");
  };

  const menuGroup1 = [
    {
      title: "BasegarPoin",
      subtitle: "Segera Hadir",
      icon: Coins,
      iconColor: "#eab308",
      onPress: handleComingSoon
    },
    {
      title: "BasegarKebun",
      subtitle: "Segera Hadir",
      icon: Sprout,
      iconColor: "#15803d",
      onPress: handleComingSoon
    },
    {
      title: "Voucher Aktif",
      subtitle: "Segera Hadir",
      icon: Ticket,
      iconColor: "#4b5563",
      onPress: handleComingSoon
    }
  ];

  const menuGroup2 = [
    {
      title: "Tiket Event",
      subtitle: "Segera Hadir",
      icon: Ticket,
      iconColor: "#4b5563",
      onPress: handleComingSoon
    }
  ];

  const menuGroup3 = [
    {
      title: "Daftar Pesanan",
      icon: Receipt,
      onPress: () => navigation.navigate("/orders")
    },
    {
      title: "Alamat Tersimpan",
      icon: MapPin,
      onPress: () => navigation.navigate("/address")
    },
    {
      title: "Metode Pembayaran",
      subtitle: "Segera Hadir",
      icon: CreditCard,
      onPress: handleComingSoon
    },
    {
      title: "Metode Pengembalian Dana",
      icon: Undo2,
      onPress: () => navigation.navigate("/refund-method")
    },
    {
      title: "Tentang Kami",
      icon: Info,
      onPress: () => navigation.navigate("/about-us")
    },
    {
      title: "Kebijakan Privasi",
      icon: ShieldCheck,
      onPress: () => navigation.navigate("/privacy-policy")
    },
    {
      title: "Syarat & Ketentuan",
      icon: FileText,
      onPress: () => navigation.navigate("/terms-and-conditions")
    },
    {
      title: "Logout",
      icon: LogOut,
      iconColor: "#ef4444",
      onPress: handleLogout
    }
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <View className={`bg-green-700 pb-6 px-4 ${Platform.OS === 'web' ? 'pt-4' : 'pt-12'} rounded-b-3xl shadow-sm`}>
          <View className="flex-row justify-between items-center px-1 pt-4">
            <View className="flex-1">
              {user ? (
                <Text className="text-base font-poppins-semibold text-white mb-1">
                  {user.f_name} {user.l_name}
                </Text>
              ) : (
                <View className="mb-2">
                  <TextShimmerLoad />
                </View>
              )}
              <TouchableOpacity onPress={() => navigation.navigate('/edit-profile')} className="flex-row items-center">
                <Text className="text-xs font-poppins-regular text-green-100 mr-2">Ubah Akun</Text>
                <Pencil size={12} color="#dcfce3" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View className="w-14 h-14 rounded-full bg-white items-center justify-center shadow ml-4">
              <Text className="text-lg font-poppins-semibold text-green-700">
                {user ? user.f_name.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
          </View>
        </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Wallet & Poin */}
        <View className="flex-row justify-between mb-4">
          <TouchableOpacity activeOpacity={0.8} className="bg-white rounded-2xl p-3 flex-1 mr-2 border border-gray-100 shadow-sm flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-green-50 items-center justify-center mr-2.5">
              <Wallet size={18} color="#16a34a" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-poppins-regular text-gray-500">Saldo Wallet</Text>
              <Text className="text-[13px] font-poppins-bold text-gray-800 tracking-tight">
                {user ? toRupiah(user.wallet_balance || 0) : "Rp 0"}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} className="bg-white rounded-2xl p-3 flex-1 ml-2 border border-gray-100 shadow-sm flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-yellow-50 items-center justify-center mr-2.5">
              <Coins size={18} color="#eab308" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-poppins-regular text-gray-500">BasegarPoin</Text>
              <Text className="text-[13px] font-poppins-bold text-gray-800 tracking-tight">
                {user ? (user.loyalty_point || 0) : 0} Poin
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="mb-4 bg-white rounded-2xl overflow-hidden border border-gray-100">
          <MenuItem 
            title="BasegarPlus!"
            subtitle="Segera Hadir"
            icon={Sparkles}
            iconColor="#9333ea"
            isLast={true}
            onPress={handleComingSoon}
          />
        </View>

        <View className="mb-4 bg-white rounded-2xl overflow-hidden border border-gray-100">
          {menuGroup1.map((item, index) => (
            <MenuItem 
              key={index}
              {...item}
              isLast={index === menuGroup1.length - 1}
            />
          ))}
        </View>

        <View className="mb-4 bg-white rounded-2xl overflow-hidden border border-gray-100">
          {menuGroup2.map((item, index) => (
            <MenuItem 
              key={index}
              {...item}
              isLast={index === menuGroup2.length - 1}
            />
          ))}
        </View>

        <View className="mb-4 bg-white rounded-2xl overflow-hidden border border-gray-100">
          {menuGroup3.map((item, index) => (
            <MenuItem 
              key={index}
              {...item}
              isLast={index === menuGroup3.length - 1}
            />
          ))}
        </View>

      </ScrollView>

      <BottomMenu />
    </View>
  );
}
