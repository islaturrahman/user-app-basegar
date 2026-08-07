import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function VoucherView() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className={`bg-white border-b border-gray-100 px-4 py-3 flex-row items-center ${Platform.OS === 'web' ? 'pt-4' : 'pt-12'} z-50`}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="mr-3 p-1"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">Voucher Saya</Text>
      </View>

      {/* Coming Soon Content */}
      <View className="flex-1 items-center justify-center px-6 pb-20">
        <View className="w-24 h-24 bg-orange-50 rounded-full items-center justify-center mb-6">
          <Ionicons name="ticket-outline" size={48} color="#ea580c" />
        </View>
        <Text className="text-2xl font-black text-gray-800 text-center mb-2">Coming Soon!</Text>
        <Text className="text-sm text-gray-500 text-center leading-relaxed">
          Fitur voucher sedang dalam tahap pengembangan. Nantikan berbagai promo dan penawaran menarik yang akan segera hadir di sini!
        </Text>
        
        <TouchableOpacity 
          onPress={() => navigation.navigate("/")}
          className="mt-8 bg-green-700 px-8 py-3.5 rounded-xl flex-row items-center"
        >
          <Ionicons name="cart-outline" size={18} color="white" className="mr-2" />
          <Text className="text-white font-bold ml-2">Mulai Belanja</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
