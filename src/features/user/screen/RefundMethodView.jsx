import React, { useState } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Wallet, CheckCircle2 } from "lucide-react-native";

export default function RefundMethodView() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState('wallet');

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* App Bar */}
      <View className={`bg-white border-b border-gray-100 px-4 py-3 flex-row items-center justify-between z-50 ${Platform.OS === 'web' ? 'pt-4' : 'pt-2'}`}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full"
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>
        <Text className="text-[15px] font-poppins-semibold text-gray-800 flex-1 ml-3">
          Metode Pengembalian Dana
        </Text>
      </View>

      <View className="px-4 pt-6 flex-1">
        {/* Section Info */}
        <View className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100 flex-row items-start">
          <Ionicons name="information-circle" size={20} color="#3b82f6" className="mr-2 mt-0.5" />
          <Text className="text-[12px] font-poppins-regular text-blue-800 flex-1 ml-2 leading-relaxed">
            Pengembalian dana hanya dapat dilakukan melalui metode di bawah ini. Saldo akan otomatis masuk ke Wallet Anda.
          </Text>
        </View>

        <Text className="text-[13px] font-poppins-semibold text-gray-800 mb-3 ml-1">
          Pilih Metode
        </Text>

        {/* Selection Card */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => setSelected('wallet')}
          className={`flex-row items-center bg-white p-4 rounded-2xl border-2 ${
            selected === 'wallet' ? 'border-green-600 bg-green-50' : 'border-gray-200'
          }`}
        >
          <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
            selected === 'wallet' ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <Wallet size={24} color={selected === 'wallet' ? '#16a34a' : '#6b7280'} />
          </View>
          
          <View className="flex-1">
            <Text className="text-[14px] font-poppins-semibold text-gray-800">Via Wallet</Text>
            <Text className="text-[11px] font-poppins-regular text-gray-500 mt-0.5">Saldo masuk dalam 1x24 jam</Text>
          </View>

          <View className="ml-2">
            {selected === 'wallet' ? (
              <CheckCircle2 size={24} color="#16a34a" />
            ) : (
              <View className="w-6 h-6 rounded-full border-2 border-gray-300" />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
