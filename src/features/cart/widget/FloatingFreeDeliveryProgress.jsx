import React, { useContext, useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Dimensions, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import CartContext from "../../../context/CartContext";
import { ConfigContext } from "../../../provider/ConfigProvider";
import { toRupiah } from "../../../components/Helper";
import { DeliveryContext } from "../../delivery/provider/DeliveryProvider";
import ConfettiCannon from "react-native-confetti-cannon";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome5 } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

const FloatingFreeDeliveryProgress = ({ isCart = false, isCategory = false }) => {
  const { cart } = useContext(CartContext) || { cart: [] };
  const { config } = useContext(ConfigContext) || {};
  const { deliverCharge } = useContext(DeliveryContext) || { deliverCharge: 0 };
  const navigation = useNavigation();
  const confettiRef = useRef(null);

  const cartTotal = cart?.reduce(
    (total, item) => {
      if (item.is_selected === false) return total;
      return total + (item.price * item.quantity);
    },
    0
  ) || 0;

  const freeDeliveryThreshold = config?.free_delivery_over_amount || 0;
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const loadCelebrationState = async () => {
      try {
        const val = await AsyncStorage.getItem("hasCelebratedFreeShipping");
        if (val === "true") {
          setHasCelebrated(true);
        }
      } catch (e) {}
    };
    loadCelebrationState();
  }, []);

  useEffect(() => {
    const handleCelebration = async () => {
      if (freeDeliveryThreshold > 0) {
        if (cartTotal >= freeDeliveryThreshold && !hasCelebrated) {
          setShowConfetti(true);
          setHasCelebrated(true);
          await AsyncStorage.setItem("hasCelebratedFreeShipping", "true");
        } else if (cartTotal < freeDeliveryThreshold && hasCelebrated) {
          setHasCelebrated(false);
          await AsyncStorage.removeItem("hasCelebratedFreeShipping");
        }
      }
    };
    handleCelebration();
  }, [cartTotal, freeDeliveryThreshold, hasCelebrated]);

  if (freeDeliveryThreshold === 0 || cartTotal === 0) {
    return null;
  }

  const progress = (cartTotal / freeDeliveryThreshold) * 100;
  const progressPercent = progress > 100 ? 100 : progress;
  const remainingAmount = freeDeliveryThreshold - cartTotal;
  const isFree = remainingAmount <= 0;

  const partialMax = parseFloat(config?.delivery_management?.partial_max_free_delivery || 0);
  const isPartialDiscount = partialMax > 0 && deliverCharge > partialMax;

  return (
    <View
      className="absolute left-0 right-0 z-50 px-4 items-center w-full"
      style={{ 
        bottom: Platform.OS === 'android' 
          ? (isCart ? 140 : (isCategory ? 40 : 110)) 
          : (isCart ? 100 : (isCategory ? 30 : 80)) 
      }}
      pointerEvents="box-none"
    >
      <TouchableOpacity 
        activeOpacity={0.95}
        onPress={() => navigation.navigate("/cart")}
        className={`bg-white w-full max-w-lg rounded-2xl p-3 flex-col shadow-xl border ${isFree ? 'border-lime-500' : 'border-gray-200'}`}
      >
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center flex-1">
            <View className={`w-7 h-7 rounded-full flex items-center justify-center mr-2 ${isFree ? 'bg-lime-100' : 'bg-green-50'}`}>
              <FontAwesome5 name="shipping-fast" size={12} color={isFree ? '#65a30d' : '#16a34a'} />
            </View>
            <View className="flex-col justify-center flex-1 pr-2">
              <Text className="text-[11px] font-bold text-gray-800 flex-wrap">
                {isFree ? (
                  isPartialDiscount ? (
                    `Yeay! Kamu dapat potongan Ongkir ${partialMax >= 1000 ? `${partialMax / 1000}RB` : toRupiah(partialMax)}!`
                  ) : (
                    "Yeay! Kamu dapat GRATIS ONGKIR!"
                  )
                ) : (
                  isPartialDiscount ? (
                    `Kejar POTONGAN ONGKIR ${partialMax >= 1000 ? `${partialMax / 1000}RB` : toRupiah(partialMax)}!`
                  ) : (
                    "Kejar GRATIS ONGKIR!"
                  )
                )}
              </Text>
              {!isFree && (
                <Text className="text-[10px] text-gray-500 font-medium mt-0.5">
                  Belanja <Text className="text-green-600 font-bold">{toRupiah(remainingAmount)}</Text> lagi
                </Text>
              )}
            </View>
          </View>
          <FontAwesome5 name="chevron-right" size={12} color="#9ca3af" />
        </View>
        
        <View className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <View 
            className={`${isFree ? 'bg-lime-500' : 'bg-green-500'} h-1.5 rounded-full`} 
            style={{ width: `${progressPercent}%` }}
          />
        </View>
      </TouchableOpacity>
      
      {isCart && showConfetti && (
        <ConfettiCannon
          count={Platform.OS === 'android' ? 45 : 80}
          origin={{ x: width / 2, y: 0 }}
          autoStart={true}
          fadeOut={true}
          fallSpeed={2500}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      )}
    </View>
  );
};

export default FloatingFreeDeliveryProgress;
