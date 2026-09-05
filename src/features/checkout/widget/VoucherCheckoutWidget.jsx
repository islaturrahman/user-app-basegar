import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  DeviceEventEmitter,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Sparkles,
  ChevronRight,
  X,
  Tag,
} from "lucide-react-native";

import { toRupiah } from "../../../components/Helper";
import CartContext from "../../../context/CartContext";

export default function VoucherCheckoutWidget() {
  const navigation = useNavigation();
  const { getTotalPrice } = useContext(CartContext) || { getTotalPrice: () => 0 };

  // Applied Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [appliedDiscountAmount, setAppliedDiscountAmount] = useState(0);

  const totalItemPrice = getTotalPrice ? getTotalPrice() : 0;
  const isSelfEmittingRef = useRef(false);

  // Restore saved voucher on mount & listen to changes from VoucherView
  useEffect(() => {
    const restoreSavedCoupon = async () => {
      try {
        const savedCode = await AsyncStorage.getItem("selected_coupon_code");
        const savedDiscount = await AsyncStorage.getItem("selected_coupon_discount");
        const savedTitle = await AsyncStorage.getItem("selected_coupon_title");

        if (savedCode && savedDiscount) {
          const discountVal = parseFloat(savedDiscount) || 0;
          setAppliedCoupon({
            code: savedCode,
            title: savedTitle || savedCode,
          });
          setAppliedDiscountAmount(discountVal);
        } else {
          setAppliedCoupon(null);
          setAppliedDiscountAmount(0);
        }
      } catch (err) {
        console.error("Error restoring saved coupon:", err);
      }
    };

    restoreSavedCoupon();

    const voucherListener = DeviceEventEmitter.addListener(
      "voucherChanged",
      (data) => {
        if (isSelfEmittingRef.current) {
          isSelfEmittingRef.current = false;
          return;
        }

        if (data?.code && data?.discount > 0) {
          setAppliedCoupon({
            code: data.code,
            title: data.coupon?.title || data.code,
            ...data.coupon,
          });
          setAppliedDiscountAmount(parseFloat(data.discount) || 0);
        } else {
          setAppliedCoupon(null);
          setAppliedDiscountAmount(0);
        }
      }
    );

    return () => voucherListener.remove();
  }, []);

  // Remove applied coupon
  const handleRemoveCoupon = async () => {
    setAppliedCoupon(null);
    setAppliedDiscountAmount(0);

    try {
      await AsyncStorage.removeItem("selected_coupon_code");
      await AsyncStorage.removeItem("selected_coupon_discount");
      await AsyncStorage.removeItem("selected_coupon_title");
    } catch (e) {
      console.error("Error removing coupon storage:", e);
    }

    isSelfEmittingRef.current = true;
    DeviceEventEmitter.emit("voucherChanged", {
      code: "",
      discount: 0,
      coupon: null,
    });
  };

  return (
    <View className="w-full bg-white px-4 py-4 mt-4 border-y border-gray-100">
      {appliedCoupon ? (
        /* Applied Active Voucher Banner Card (Orange Theme) */
        <View className="bg-orange-50 border border-orange-200 rounded-2xl p-3.5 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.navigate("/voucher")}
            activeOpacity={0.8}
            className="flex-row items-center flex-1 mr-2"
          >
            <View className="w-10 h-10 rounded-xl bg-orange-600 items-center justify-center mr-3">
              <Tag size={20} color="white" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center flex-wrap">
                <Text className="text-xs font-poppins-bold text-orange-950 mr-2">
                  {appliedCoupon.title || "Voucher Promo"}
                </Text>
                <View className="bg-orange-600 px-1.5 py-0.5 rounded">
                  <Text className="text-[9px] font-poppins-bold text-white uppercase">
                    Terpasang
                  </Text>
                </View>
              </View>
              <Text className="text-xs font-poppins-semibold text-orange-700 mt-0.5">
                Hemat {toRupiah(appliedDiscountAmount)}
              </Text>
              <Text className="text-[10px] font-poppins-regular text-orange-600 mt-0.5">
                Tekan untuk ubah voucher
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRemoveCoupon}
            className="w-7 h-7 rounded-full bg-orange-200 items-center justify-center ml-1"
          >
            <X size={16} color="#c2410c" />
          </TouchableOpacity>
        </View>
      ) : (
        /* Unapplied Banner Card (Orange Theme) - Click to navigate to /voucher */
        <TouchableOpacity
          onPress={() => navigation.navigate("/voucher")}
          activeOpacity={0.8}
          className="flex-row items-center justify-between bg-orange-50/60 border border-orange-200 rounded-2xl p-3.5"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-10 h-10 rounded-xl bg-orange-100 items-center justify-center mr-3 border border-orange-200">
              <Sparkles size={20} color="#ea580c" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-poppins-bold text-gray-800">
                Gunakan Voucher / Kode Promo
              </Text>
              <Text className="text-[11px] font-poppins-regular text-gray-500 mt-0.5">
                Pilih voucher untuk dapatkan potongan diskon
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <Text className="text-xs font-poppins-bold text-orange-600 mr-1">
              Pilih
            </Text>
            <ChevronRight size={18} color="#ea580c" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
