import React, { useContext, useState, useCallback } from "react";
import { View, Text, ScrollView, Dimensions, ActivityIndicator, TextInput, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";

import AppBar from "../../../components/AppBar";
import { ConfigContext } from "../../../provider/ConfigProvider";
import AddressCheckoutWidget from "../widget/AddressCheckoutWidget";
import TimeSlotWidget from "../widget/TimeSlotWidget";
import VoucherCheckoutWidget from "../widget/VoucherCheckoutWidget";
import PaymentProvider from "../provider/PaymentProvider";
import PaymentWidget from "../widget/PaymentWidget";
import PlaceOrderWidget from "../widget/PlaceOrderWidget";
import OrderPlaceProvider from "../../../provider/PlaceOrderProvider";
// import CartListWidget from "../widget/CartListWidget"; // if we want to display items

const { height } = Dimensions.get("window");

const Checkout = () => {
  const { config, loading } = useContext(ConfigContext) || {};
  const [orderNote, setOrderNote] = useState("");

  return (
    <View className="flex-1 bg-gray-50 relative">
      <AppBar title="Checkout" route="/cart" />

      {loading && !config ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#15803d" />
        </View>
      ) : !config || Object.keys(config).length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-gray-500 text-center text-sm">
            Gagal memuat konfigurasi. Silakan coba lagi.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 240 }}
          >
            {/* Alamat Pengiriman Section */}
            <View className="px-4 mt-6 mb-2">
              <Text className="text-[15px] font-bold text-gray-800 mb-4">Alamat Pengiriman</Text>
              <View className="bg-white rounded-2xl p-4 border border-gray-100">
                <AddressCheckoutWidget />
                
                <View className="h-[1px] bg-gray-100 my-4" />
                
                <View className="flex-row items-center w-full">
                  <View className="w-8 items-center justify-center">
                    <Ionicons name="reader-outline" size={24} color="#374151" />
                  </View>
                  <View className="flex-1 ml-2 pr-2">
                    <Text className="font-bold text-gray-800 text-sm mb-1">Catatan Untuk Kurir</Text>
                    <TextInput
                      value={orderNote}
                      onChangeText={(val) => {
                        setOrderNote(val);
                        AsyncStorage.setItem("order_note", val).catch(() => {});
                      }}
                      placeholder="Catatan untuk kurir"
                      className="text-xs text-gray-500 p-0 m-0"
                    />
                  </View>
                  <Feather name="chevron-right" size={20} color="#9ca3af" />
                </View>
              </View>
            </View>

            {/* Delivery Time Slot Section */}
            <TimeSlotWidget />

            {/* Voucher Section */}
            <VoucherCheckoutWidget />

            {/* Payment Method Section */}
            <PaymentProvider>
              <PaymentWidget config={config} />
            </PaymentProvider>
          </ScrollView>

          {/* Place Order Sticky Bottom Bar */}
          <OrderPlaceProvider>
            <PlaceOrderWidget />
          </OrderPlaceProvider>
        </>
      )}
    </View>
  );
};

export default Checkout;
