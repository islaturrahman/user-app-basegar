import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Platform, Dimensions } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import CartContext from "../../../context/CartContext";
import { ConfigContext } from "../../../provider/ConfigProvider";
import { useNavigation } from "@react-navigation/native";
import { toRupiah } from "../../../components/Helper";
import { DeliveryContext } from "../../delivery/provider/DeliveryProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ConfettiCannon from "react-native-confetti-cannon";

const { width } = Dimensions.get('window');

const BottomCartView = () => {
  const getCart = useContext(CartContext);
  const { config } = useContext(ConfigContext) || {};
  const { deliverCharge } = useContext(DeliveryContext) || { deliverCharge: 0 };
  const navigation = useNavigation();

  const selectedCartItems = getCart?.cart?.filter(item => item.is_selected !== false) || [];
  const cartTotal = selectedCartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const freeDeliveryThreshold = config?.free_delivery_over_amount || 0;
  const progress = freeDeliveryThreshold > 0 ? (cartTotal / freeDeliveryThreshold) * 100 : 100;
  const progressPercent = progress > 100 ? 100 : progress;
  const remainingAmount = freeDeliveryThreshold - cartTotal;

  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const checkCelebratedStatus = async () => {
      const status = await AsyncStorage.getItem("hasCelebratedFreeShipping");
      if (status === "true") setHasCelebrated(true);
    };
    checkCelebratedStatus();
  }, []);

  useEffect(() => {
    if (freeDeliveryThreshold > 0) {
      if (cartTotal >= freeDeliveryThreshold && !hasCelebrated) {
        setShowConfetti(true);
        setHasCelebrated(true);
        AsyncStorage.setItem("hasCelebratedFreeShipping", "true");
      } else if (cartTotal < freeDeliveryThreshold && hasCelebrated) {
        setHasCelebrated(false);
        AsyncStorage.removeItem("hasCelebratedFreeShipping");
      }
    }
  }, [cartTotal, freeDeliveryThreshold, hasCelebrated]);

  return (
    <View
      className="absolute bottom-0 left-0 w-full bg-white shadow flex flex-col z-50"
      style={{ paddingBottom: Platform.OS === 'android' ? 30 : 0 }}
    >
      {/* Free Delivery Progress Bar */}
      {freeDeliveryThreshold > 0 && (
        <View className="w-full bg-lime-50 py-2 px-4 border-b border-gray-100 shadow-sm">
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-gray-700 font-regular">
              {remainingAmount > 0 ? (
                config?.delivery_management?.partial_max_free_delivery > 0 && deliverCharge > parseFloat(config.delivery_management.partial_max_free_delivery) ? (
                  `Belanja ${toRupiah(remainingAmount)} lagi untuk POTONGAN ONGKIR ${parseFloat(config.delivery_management.partial_max_free_delivery) >= 1000 ? `${parseFloat(config.delivery_management.partial_max_free_delivery) / 1000}RB` : toRupiah(config.delivery_management.partial_max_free_delivery)}!`
                ) : (
                  `Belanja ${toRupiah(remainingAmount)} lagi untuk GRATIS ONGKIR!`
                )
              ) : (
                config?.delivery_management?.partial_max_free_delivery > 0 && deliverCharge > parseFloat(config.delivery_management.partial_max_free_delivery) ? (
                  `Hore! Kamu mendapatkan potongan Ongkir ${parseFloat(config.delivery_management.partial_max_free_delivery) >= 1000 ? `${parseFloat(config.delivery_management.partial_max_free_delivery) / 1000}RB` : toRupiah(config.delivery_management.partial_max_free_delivery)}!`
                ) : (
                  "Hore! Kamu mendapatkan GRATIS ONGKIR!"
                )
              )}
            </Text>
          </View>
          <View className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <View 
              className="bg-lime-500 h-1.5 rounded-full" 
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>
      )}

      {/* Checkout Bar */}
      <View className="flex-row justify-between items-center px-4 py-4">
        <View className="flex-col">
          <Text className="text-gray-600 text-sm">Total Belanja</Text>
          <Text className="text-xl font-bold text-lime-700">
            {toRupiah(cartTotal)}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.9}
          className={`py-3.5 px-8 rounded-2xl shadow-sm flex flex-row items-center justify-center ${
            selectedCartItems.length === 0
              ? "bg-gray-300"
              : "bg-green-700"
          }`}
          onPress={async () => {
            // Hapus data jadwal pengiriman lama agar user diwajibkan memilih ulang di layar Checkout
            await AsyncStorage.multiRemove(["dateslot", "dateslotId", "dateslotIndex", "timeslotId"]);
            navigation.navigate("/checkout");
          }}
          disabled={selectedCartItems.length === 0}
        >
          <FontAwesome5 
            name="shopping-cart" 
            size={14} 
            color={selectedCartItems.length === 0 ? "#6b7280" : "#fff"} 
          />
          <Text className={`font-bold text-sm ml-2 ${selectedCartItems.length === 0 ? "text-gray-500" : "text-white"}`}>
            Checkout
          </Text>
        </TouchableOpacity>
      </View>

      {showConfetti && (
        <View style={{ position: 'absolute', top: -Dimensions.get('window').height, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
          <ConfettiCannon
            count={Platform.OS === 'android' ? 45 : 80}
            origin={{ x: width / 2, y: 0 }}
            autoStart={true}
            fadeOut={true}
            fallSpeed={2500}
            onAnimationEnd={() => setShowConfetti(false)}
          />
        </View>
      )}
    </View>
  );
};

export default BottomCartView;
