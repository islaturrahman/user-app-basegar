import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";

import { OrderPlaceContext } from "../../../provider/PlaceOrderProvider";
import CartContext from "../../../context/CartContext";
import { ConfigContext } from "../../../provider/ConfigProvider";
import { DeliveryContext } from "../../delivery/provider/DeliveryProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

const toRupiah = (price) => `Rp ${Number(price || 0).toLocaleString('id-ID')}`;

const PlaceOrderWidget = () => {
  const navigation = useNavigation();
  const { deliverCharge } = useContext(DeliveryContext) || { deliverCharge: 0 };
  const { placeOrder, success, loading } = useContext(OrderPlaceContext) || {};
  const { cart, getTotalPrice, clearCart } = useContext(CartContext) || { cart: [], getTotalPrice: () => 0, clearCart: () => {} };
  const { config } = useContext(ConfigContext) || {};

  const [orderAmount, setOrderAmount] = useState(0);

  const totalItemPrice = getTotalPrice ? getTotalPrice() : 0;
  const freeDeliveryThreshold = config?.free_delivery_over_amount || 0;
  const freeDeliveryStatus = config?.free_delivery_over_amount_status;
  const isEligibleForFreeDelivery = freeDeliveryStatus && freeDeliveryThreshold > 0 && totalItemPrice >= freeDeliveryThreshold;

  let finalDeliveryCharge = deliverCharge;
  let freeDeliveryDiscount = 0;

  if (isEligibleForFreeDelivery) {
    const partialMax = parseFloat(config?.delivery_management?.partial_max_free_delivery || 0);
    if (partialMax > 0) {
      if (deliverCharge <= partialMax) {
        finalDeliveryCharge = 0;
        freeDeliveryDiscount = deliverCharge;
      } else {
        finalDeliveryCharge = deliverCharge - partialMax;
        freeDeliveryDiscount = partialMax;
      }
    } else {
      finalDeliveryCharge = 0;
      freeDeliveryDiscount = deliverCharge;
    }
  }

  useEffect(() => {
    const total = totalItemPrice + finalDeliveryCharge;
    setOrderAmount(total);
    AsyncStorage.setItem("order_amount", String(total)).catch((e) => console.log(e));
  }, [cart, finalDeliveryCharge, totalItemPrice]);

  // Show validation error from provider as Alert
  useEffect(() => {
    if (success?.status === false && success?.message) {
      Alert.alert("Perhatian", success.message, [{ text: "OK" }]);
    }
  }, [success]);

  const handlePlaceOrder = () => {
    if (placeOrder && !loading) {
      placeOrder(navigation, clearCart);
    }
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40"
      style={{ paddingBottom: Platform.OS === 'android' ? 40 : 12 }}
    >
      <View className="flex-row justify-between mb-1.5 items-center">
        <Text className="text-xs text-gray-500 font-medium">Ongkos Kirim</Text>
        {isEligibleForFreeDelivery ? (
          finalDeliveryCharge === 0 ? (
            <View className="flex-row items-center space-x-1.5">
              <Text className="text-[10px] text-gray-400 line-through">{toRupiah(deliverCharge)}</Text>
              <Text className="text-xs font-bold text-green-600 uppercase">Gratis</Text>
            </View>
          ) : (
            <View className="flex-row items-center space-x-1.5">
              <Text className="text-[10px] text-gray-400 line-through">{toRupiah(deliverCharge)}</Text>
              <Text className="text-[10px] text-green-600">-{toRupiah(freeDeliveryDiscount)}</Text>
              <Text className="text-xs font-bold text-gray-800">{toRupiah(finalDeliveryCharge)}</Text>
            </View>
          )
        ) : (
          <Text className="text-xs font-bold text-gray-800">{toRupiah(deliverCharge)}</Text>
        )}
      </View>

      <View className="flex-row justify-between mb-3 items-center">
        <Text className="text-xs text-gray-500 font-medium">Total Pesanan</Text>
        <Text className="text-base font-black text-green-700">{toRupiah(orderAmount)}</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePlaceOrder}
        className={`w-full py-3.5 rounded-2xl items-center flex-row justify-center shadow-sm ${
          loading ? "bg-green-800 opacity-80" : "bg-green-700"
        }`}
        disabled={loading}
      >
        {loading ? (
           <Text className="text-white font-bold text-sm">Memproses...</Text>
        ) : (
          <>
            <FontAwesome5 name="shopping-bag" size={14} color="#fff" />
            <Text className="text-white font-bold text-sm ml-2">Buat Pesanan</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default PlaceOrderWidget;



