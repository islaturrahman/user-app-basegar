import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";

const WA_NUMBER = "6285298197900";

const toRupiah = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;

export default function OrderSuccessView() {
  const navigation = useNavigation();
  const route = useRoute();

  const orderId    = route.params?.order_id;
  const orderAmount = route.params?.order_amount;
  const paymentMethod = route.params?.payment_method;
  const errorMessage  = route.params?.error_message;
  const isError       = route.params?.is_error === true;

  // Bounce animation for icon
  const bounceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -10, duration: 600, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0,   duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [bounceAnim]);

  if (isError) {
    // ── ERROR STATE ────────────────────────────────────────────
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 items-center justify-center p-6" style={{ minHeight: 600 }}>
            {/* Error Icon */}
            <Animated.View
              className="w-24 h-24 bg-red-100 rounded-full items-center justify-center mb-6"
              style={{ transform: [{ translateY: bounceAnim }] }}
            >
              <View className="w-16 h-16 bg-red-500 rounded-full items-center justify-center shadow-lg">
                <FontAwesome5 name="times" size={32} color="#fff" />
              </View>
            </Animated.View>

            <Text className="text-2xl font-black text-gray-900 mb-2 text-center">
              Pesanan Gagal 😔
            </Text>
            <Text className="text-gray-500 text-center text-sm leading-relaxed mb-6 px-4">
              Terjadi masalah saat memproses pesanan Anda.
            </Text>

            {/* Error Detail */}
            {errorMessage && (
              <View className="w-full bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                <View className="flex-row items-center mb-2">
                  <FontAwesome5 name="exclamation-circle" size={14} color="#ef4444" />
                  <Text className="text-xs font-bold text-red-700 ml-2 uppercase tracking-wider">
                    Detail Kesalahan
                  </Text>
                </View>
                <Text className="text-sm text-red-600 leading-relaxed">{errorMessage}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View className="w-full space-y-3">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate("/checkout")}
                className="w-full bg-green-700 py-4 rounded-2xl items-center shadow-sm"
              >
                <Text className="text-white font-bold text-sm">Coba Lagi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate("/")}
                className="w-full bg-white border border-gray-200 py-3.5 rounded-2xl items-center"
              >
                <Text className="text-gray-700 font-bold text-sm">Kembali ke Beranda</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── SUCCESS STATE ──────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 items-center justify-center p-6" style={{ minHeight: 600 }}>

          {/* Success Icon */}
          <Animated.View
            className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6"
            style={{ transform: [{ translateY: bounceAnim }] }}
          >
            <View className="w-16 h-16 bg-green-600 rounded-full items-center justify-center shadow-lg">
              <FontAwesome5 name="check" size={32} color="#fff" />
            </View>
          </Animated.View>

          {/* Title */}
          <Text className="text-2xl font-black text-gray-900 mb-2 text-center">
            Pesanan Berhasil! 🎉
          </Text>
          <Text className="text-gray-500 text-center text-sm leading-relaxed mb-6 px-4">
            Terima kasih telah berbelanja. Pesanan Anda telah dikonfirmasi dan sedang diproses.
          </Text>

          {/* Order Info Card */}
          {(orderId || orderAmount || paymentMethod) && (
            <View className="w-full bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
              <View className="flex-row items-center mb-3">
                <FontAwesome5 name="receipt" size={13} color="#15803d" />
                <Text className="text-xs font-black text-green-700 uppercase tracking-wider ml-2">
                  Detail Transaksi
                </Text>
              </View>

              <View className="space-y-2.5">
                {orderId && (
                  <View className="flex-row justify-between items-center py-2 border-b border-gray-50">
                    <Text className="text-xs text-gray-500">ID Pesanan</Text>
                    <Text className="text-xs font-bold text-gray-800">#{orderId}</Text>
                  </View>
                )}
                {paymentMethod && (
                  <View className="flex-row justify-between items-center py-2 border-b border-gray-50">
                    <Text className="text-xs text-gray-500">Metode Pembayaran</Text>
                    <Text className="text-xs font-bold text-gray-800 uppercase">{paymentMethod}</Text>
                  </View>
                )}
                {orderAmount && (
                  <View className="flex-row justify-between items-center py-2 border-b border-gray-50">
                    <Text className="text-xs text-gray-500">Total Pembayaran</Text>
                    <Text className="text-sm font-black text-green-700">{toRupiah(orderAmount)}</Text>
                  </View>
                )}
                <View className="flex-row justify-between items-center py-2">
                  <Text className="text-xs text-gray-500">Status</Text>
                  <View className="bg-green-100 border border-green-200 px-3 py-1 rounded-full">
                    <Text className="text-xs font-bold text-green-700">Dikonfirmasi</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View className="w-full space-y-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (orderId) {
                  navigation.navigate("/o/:id", { id: String(orderId) });
                } else {
                  navigation.navigate("/orders");
                }
              }}
              className="w-full bg-green-700 py-4 rounded-2xl items-center flex-row justify-center shadow-sm"
            >
              <FontAwesome5 name="shopping-bag" size={14} color="#fff" />
              <Text className="text-white font-bold text-sm ml-2">Lihat Detail Pesanan</Text>
            </TouchableOpacity>

            {/* WhatsApp Konfirmasi Pembayaran */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                const msg = orderId
                  ? `Halo, saya ingin konfirmasi pesanan #${orderId} dengan total ${toRupiah(orderAmount)}`
                  : `Halo, saya ingin konfirmasi pesanan saya`;
                Linking.openURL(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`);
              }}
              className="w-full bg-green-50 border border-green-200 py-3.5 rounded-2xl items-center flex-row justify-center"
            >
              <FontAwesome5 name="whatsapp" size={16} color="#16a34a" />
              <Text className="text-green-700 font-bold text-sm ml-2">Konfirmasi via WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate("/")}
              className="w-full bg-white border border-gray-200 py-3.5 rounded-2xl items-center flex-row justify-center"
            >
              <FontAwesome5 name="home" size={13} color="#374151" />
              <Text className="text-gray-700 font-bold text-sm ml-2">Kembali ke Beranda</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-[11px] text-gray-400 text-center mt-5 px-4 leading-relaxed">
            Pesanan Anda akan segera diproses oleh tim kami. Pantau status pesanan melalui menu Pesanan.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
