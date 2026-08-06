import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SearchProducts from "../screen/SearchProducts";

const HeroWidget = ({ deliveryDate, setDeliveryDate }) => {
  const navigation = useNavigation();
  const [searchTrigger, setSearchTrigger] = useState(false);
  const [displayAddress, setDisplayAddress] = useState("Lokasi Saya");
  
  useFocusEffect(
    useCallback(() => {
      const loadAddress = async () => {
        try {
          const rawAddress = await AsyncStorage.getItem("selectAddress");
          if (rawAddress) {
            const address = JSON.parse(rawAddress);
            if (address?.address) {
              // Ambil nama jalan - bagian pertama sebelum koma
              const streetName = address.address.split(",")[0].trim();
              setDisplayAddress(streetName || address.address_type || "Lokasi Saya");
            }
          }
        } catch (e) {
          console.error("Failed to parse selectAddress from AsyncStorage", e);
        }
      };
      loadAddress();
    }, [])
  );

  const handleAddressPress = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        navigation.navigate("/address");
      } else {
        navigation.navigate("/login");
      }
    } catch (e) {
      console.log("Error checking auth for address route", e);
      navigation.navigate("/login");
    }
  };

  // Today's date formatted nicely for delivery estimation
  const today = new Date();
  const options = { day: 'numeric', month: 'short' };
  const formattedDate = today.toLocaleDateString('id-ID', options);

  return (
    <>
      {/* Container Background (Sticky header, flat bottom) */}
      <View className="relative overflow-hidden pt-12 pb-3 px-3 bg-[#0461b4] shadow-sm z-50">
        
        {/* Top Location & Wishlist bar */}
        <View className="flex-row justify-between items-center mb-[2px] relative z-10">
          <View className="flex-row items-center space-x-2">
            {/* Map Pin icon */}
            <View className="items-center justify-center w-7 h-7 rounded-full bg-black/10">
              <Text className="text-red-500 text-xs">📍</Text>
            </View>
            
            {/* Location Address Details */}
            <TouchableOpacity 
              onPress={handleAddressPress}
              className="flex-col active:scale-95 transition-transform"
            >
              <View className="flex-row items-center space-x-1">
                <Text className="text-[13px] font-semibold text-white tracking-wide" numberOfLines={1}>
                  Ke <Text className="underline">{displayAddress}</Text>
                </Text>
              </View>
              <Text className="text-[9.5px] text-blue-100 font-light mt-0.5">
                {formattedDate} • 1 Jam Tiba
              </Text>
            </TouchableOpacity>
          </View>

          {/* Heart icon at the right */}
          <TouchableOpacity className="items-center justify-center w-7 h-7 rounded-full bg-black/15 active:scale-95">
             <Text className="text-red-500 text-xs">❤️</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar section */}
        <TouchableOpacity 
           className="relative z-10 mt-2.5" 
           activeOpacity={0.9} 
           onPress={() => setSearchTrigger(true)}
        >
          <View className="flex-row items-center bg-white rounded-full py-1.5 pl-3 pr-8 shadow-lg border border-white">
            {/* Orange/Tangerine Icon */}
            <Text className="text-lg mr-2">🍊</Text>
            
            {/* Text Placeholder */}
            <Text className="text-gray-400 text-[11px] flex-1">
              Cari beragam kebutuhan harian
            </Text>

            {/* Search Icon at far right */}
            {/* Search Icon at far right */}
            <View className="absolute right-3">
               <Text className="text-gray-500 text-sm">🔍</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* BlankBottomSheet conversion using standard Modal for now */}
      <Modal visible={searchTrigger} animationType="slide" onRequestClose={() => setSearchTrigger(false)}>
        <SearchProducts onClose={() => setSearchTrigger(false)} />
      </Modal>
    </>
  );
};

export default HeroWidget;
