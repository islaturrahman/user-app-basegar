import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";

import AddressContext from "../../../context/AddressContext";
import { ConfigContext } from "../../../provider/ConfigProvider";
import { DeliveryContext } from "../../delivery/provider/DeliveryProvider";

const AddressCheckoutWidget = () => {
  const { lastAddress, getSelectAddress } = useContext(AddressContext);
  const { config } = useContext(ConfigContext);
  const { setDeliveryChargeBySelectionAddress } = useContext(DeliveryContext);
  const navigation = useNavigation();
  
  const [selectedAddress, setSelectedAddress] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchAddress = async () => {
        if (getSelectAddress) {
          const addr = await getSelectAddress();
          setSelectedAddress(addr);
        }
      };
      fetchAddress();
    }, [getSelectAddress])
  );

  useEffect(() => {
    if (selectedAddress && setDeliveryChargeBySelectionAddress) {
      setDeliveryChargeBySelectionAddress(selectedAddress);
    }
  }, [selectedAddress, config]);

  return (
    <View className="w-full">
      {selectedAddress != null && Object.keys(selectedAddress).length !== 0 ? (
        <TouchableOpacity 
          onPress={() => navigation.navigate("/address")}
          className="flex-row items-center w-full"
        >
          <View className="w-8 items-center justify-center">
            <Ionicons name="location-outline" size={24} color="#374151" />
          </View>
          <View className="flex-1 ml-2 pr-2">
            <Text className="font-bold text-gray-800 text-sm mb-1">
              {selectedAddress?.address_type || "Alamat"}
              {selectedAddress?.contact_person_name ? ` • ${selectedAddress.contact_person_name}` : ""}
            </Text>
            <Text className="text-xs text-gray-500 leading-relaxed" numberOfLines={2}>
              {selectedAddress?.address ? selectedAddress.address : "No address"}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>
      ) : (
        <View className="w-full py-2 items-center justify-center">
          {selectedAddress != null && Object.keys(selectedAddress).length === 0 ? (
            <TouchableOpacity 
              onPress={() => navigation.navigate("/address")}
              className="px-4 py-2 border border-green-700 rounded-full"
            >
              <Text className="text-green-700 font-bold text-xs">Tambah Alamat Pengiriman</Text>
            </TouchableOpacity>
          ) : (
            <View className="w-full h-12 bg-gray-200 rounded-lg animate-pulse" />
          )}
        </View>
      )}
    </View>
  );
};

export default AddressCheckoutWidget;
