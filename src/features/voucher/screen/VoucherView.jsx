import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  DeviceEventEmitter,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import {
  ArrowLeft,
  Ticket,
  Copy,
  Check,
  Search,
  Sparkles,
  ShoppingBag,
  Tag,
  AlertCircle,
  Clock,
  LogIn,
  ChevronRight,
} from "lucide-react-native";

import { toRupiah } from "../../../components/Helper";
import { get } from "../../../data/api";
import { coupon_list, coupon_apply } from "../../../config/enpoints";

export default function VoucherView() {
  const navigation = useNavigation();
  const route = useRoute();

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Input code state
  const [inputCode, setInputCode] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchVouchers = async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setIsLoggedIn(false);
        setVouchers([]);
        return;
      }

      setIsLoggedIn(true);
      const res = await get(coupon_list);

      // Check if response is an array or has status false
      if (Array.isArray(res)) {
        setVouchers(res);
      } else if (res && res.status === false) {
        console.warn("Fetch vouchers warning:", res.message);
        setVouchers([]);
      } else {
        setVouchers([]);
      }
    } catch (err) {
      console.error("Error fetching vouchers:", err);
      setVouchers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleRefresh = useCallback(() => {
    fetchVouchers(true);
  }, []);

  const handleApplyCode = async () => {
    const cleanCode = inputCode.trim();
    if (!cleanCode) {
      setClaimMessage({
        type: "error",
        text: "Silakan masukkan kode voucher terlebih dahulu.",
      });
      return;
    }

    setClaiming(true);
    setClaimMessage(null);

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setClaimMessage({
          type: "error",
          text: "Silakan login terlebih dahulu untuk menggunakan voucher.",
        });
        return;
      }

      const res = await get(`${coupon_apply}?code=${encodeURIComponent(cleanCode)}`);

      if (res && res.code) {
        // Valid coupon returned
        const discountText =
          res.discount_type === "percent"
            ? `${res.discount}%`
            : toRupiah(res.discount);

        setClaimMessage({
          type: "success",
          text: `Voucher "${res.title || res.code}" valid! Diskon ${discountText}`,
        });

        // Refetch list in case new vouchers unlocked
        fetchVouchers();
      } else {
        const errorMsg =
          res?.message || "Kode voucher tidak valid atau sudah tidak berlaku.";
        setClaimMessage({ type: "error", text: errorMsg });
      }
    } catch (err) {
      setClaimMessage({
        type: "error",
        text: err.message || "Gagal mengklaim voucher. Coba lagi nanti.",
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleCopyCode = async (code) => {
    try {
      await Clipboard.setStringAsync(code);
      setCopiedCode(code);
      setTimeout(() => {
        setCopiedCode(null);
      }, 3000);

      if (Platform.OS === "web") {
        alert(`Kode voucher ${code} telah disalin!`);
      } else {
        Alert.alert("Sukses", `Kode voucher ${code} berhasil disalin!`);
      }
    } catch (error) {
      console.error("Gagal menyalin kode:", error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  const handleUseVoucher = async (item) => {
    try {
      // Calculate estimated discount or amount
      let discountAmount = item.discount || 0;
      if (item.discount_type === "percent") {
        // Assume default estimation or use percent rule
        discountAmount = item.discount || 0; 
      }

      await AsyncStorage.setItem("selected_coupon_code", item.code || "");
      await AsyncStorage.setItem("selected_coupon_discount", String(discountAmount));
      await AsyncStorage.setItem("selected_coupon_title", item.title || item.code || "");

      DeviceEventEmitter.emit("voucherChanged", {
        code: item.code,
        discount: discountAmount,
        coupon: item,
      });

      if (Platform.OS === "web") {
        alert(`Voucher ${item.code} berhasil dipasang!`);
      } else {
        Alert.alert("Sukses", `Voucher ${item.code} berhasil dipasang!`);
      }

      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (e) {
      console.error("Gagal memilih voucher:", e);
    }
  };

  const renderVoucherCard = ({ item }) => {
    const isPercent = item.discount_type === "percent";
    const discountBadge = isPercent
      ? `${item.discount}%`
      : toRupiah(item.discount);

    const isCopied = copiedCode === item.code;

    return (
      <View className="mb-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <View className="flex-row">
          {/* Left Ribbon / Badge Banner */}
          <View className="w-28 bg-green-700 p-3 items-center justify-center relative">
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mb-1">
              <Tag size={20} color="white" strokeWidth={2.5} />
            </View>
            <Text className="text-white text-xs font-poppins-medium text-center">
              DISKON
            </Text>
            <Text className="text-white text-lg font-poppins-black text-center tracking-tight">
              {discountBadge}
            </Text>

            {/* Decorative Notch circles for coupon cut look */}
            <View className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-gray-50" />
            <View className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-gray-50" />
          </View>

          {/* Right Main Details */}
          <View className="flex-1 p-4 justify-between">
            <View>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-poppins-semibold text-gray-800 flex-1 mr-2">
                  {item.title || "Voucher Promo Special"}
                </Text>
                <View className="bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  <Text className="text-[10px] font-poppins-bold text-green-700">
                    AKTIF
                  </Text>
                </View>
              </View>

              {/* Terms */}
              <View className="mt-1 space-y-0.5">
                {item.min_purchase > 0 && (
                  <Text className="text-[11px] font-poppins-regular text-gray-500">
                    • Min. belanja {toRupiah(item.min_purchase)}
                  </Text>
                )}
                {item.max_discount > 0 && isPercent && (
                  <Text className="text-[11px] font-poppins-regular text-gray-500">
                    • Maks. diskon {toRupiah(item.max_discount)}
                  </Text>
                )}
              </View>
            </View>

            {/* Footer Date & Actions (Gunakan) */}
            <View className="flex-row items-center justify-between pt-3 mt-2 border-t border-gray-100">
              <View className="flex-row items-center flex-1 mr-1">
                <Clock size={12} color="#6b7280" />
                <Text className="text-[10px] font-poppins-regular text-gray-500 ml-1">
                  s.d. {formatDate(item.expire_date)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleUseVoucher(item)}
                activeOpacity={0.8}
                className="px-4 py-1.5 rounded-lg bg-green-700 flex-row items-center shadow-sm"
              >
                <Text className="text-[11px] font-poppins-bold text-white">
                  Gunakan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Top Header */}
      <View
        className={`bg-white border-b border-gray-100 px-4 py-3 flex-row items-center ${
          Platform.OS === "web" ? "pt-4" : "pt-12"
        } z-50 shadow-sm`}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-3 p-1 rounded-full active:bg-gray-100"
        >
          <ArrowLeft size={22} color="#374151" strokeWidth={2} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-poppins-bold text-gray-800">
            Voucher & Promo
          </Text>
          <Text className="text-[11px] font-poppins-regular text-gray-500">
            Gunakan voucher untuk belanja lebih hemat
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#15803d"]}
            tintColor="#15803d"
          />
        }
      >
        {/* Input Claim Voucher Card */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-2">
            <Sparkles size={18} color="#15803d" />
            <Text className="text-xs font-poppins-semibold text-gray-800 ml-2">
              Punya Kode Promo / Voucher?
            </Text>
          </View>

          <View className="flex-row items-center">
            <View className="flex-1 bg-gray-50 border border-gray-200 rounded-xl flex-row items-center px-3 py-2 mr-2">
              <Ticket size={16} color="#9ca3af" />
              <TextInput
                value={inputCode}
                onChangeText={(text) => {
                  setInputCode(text.toUpperCase());
                  if (claimMessage) setClaimMessage(null);
                }}
                placeholder="Masukkan kode promo"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
                className="flex-1 ml-2 text-xs font-poppins-semibold text-gray-800 py-1"
              />
            </View>

            <TouchableOpacity
              onPress={handleApplyCode}
              disabled={claiming}
              activeOpacity={0.8}
              className="bg-green-700 px-4 py-3 rounded-xl flex-row items-center justify-center min-w-[80px]"
            >
              {claiming ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-xs font-poppins-bold text-white">
                  Gunakan
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Feedback Message */}
          {claimMessage && (
            <View
              className={`mt-3 p-3 rounded-xl flex-row items-center ${
                claimMessage.type === "success"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {claimMessage.type === "success" ? (
                <Check size={16} color="#15803d" />
              ) : (
                <AlertCircle size={16} color="#dc2626" />
              )}
              <Text
                className={`text-xs font-poppins-medium ml-2 flex-1 ${
                  claimMessage.type === "success"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {claimMessage.text}
              </Text>
            </View>
          )}
        </View>

        {/* Section Title */}
        <View className="flex-row items-center justify-between mb-3 px-1">
          <Text className="text-sm font-poppins-bold text-gray-800">
            Voucher Saya Tersedia
          </Text>
          <Text className="text-xs font-poppins-medium text-green-700">
            {vouchers.length} Voucher
          </Text>
        </View>

        {/* Main Content Area */}
        {!isLoggedIn ? (
          /* Not Logged In State */
          <View className="bg-white rounded-2xl p-6 items-center justify-center border border-gray-100 my-4 shadow-sm">
            <View className="w-16 h-16 bg-green-50 rounded-full items-center justify-center mb-4">
              <LogIn size={32} color="#15803d" />
            </View>
            <Text className="text-base font-poppins-bold text-gray-800 text-center mb-1">
              Login untuk Melihat Voucher
            </Text>
            <Text className="text-xs font-poppins-regular text-gray-500 text-center mb-5 leading-relaxed px-4">
              Dapatkan berbagai penawaran dan diskon eksklusif dengan masuk ke akun Basegar Anda.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("/login")}
              activeOpacity={0.8}
              className="bg-green-700 px-6 py-3 rounded-xl flex-row items-center"
            >
              <Text className="text-xs font-poppins-bold text-white mr-2">
                Login Sekarang
              </Text>
              <ChevronRight size={16} color="white" />
            </TouchableOpacity>
          </View>
        ) : loading ? (
          /* Loading State */
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#15803d" />
            <Text className="text-xs font-poppins-medium text-gray-500 mt-3">
              Memuat voucher Anda...
            </Text>
          </View>
        ) : vouchers.length === 0 ? (
          /* Empty Voucher State */
          <View className="bg-white rounded-2xl p-8 items-center justify-center border border-gray-100 my-2 shadow-sm">
            <View className="w-20 h-20 bg-orange-50 rounded-full items-center justify-center mb-4">
              <Ticket size={40} color="#ea580c" />
            </View>
            <Text className="text-lg font-poppins-bold text-gray-800 text-center mb-1">
              Belum Ada Voucher Active
            </Text>
            <Text className="text-xs font-poppins-regular text-gray-500 text-center leading-relaxed mb-6 px-4">
              Saat ini belum ada voucher aktif yang tersedia. Pantau terus halaman ini untuk promo menarik mendatang!
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("/")}
              activeOpacity={0.8}
              className="bg-green-700 px-6 py-3 rounded-xl flex-row items-center"
            >
              <ShoppingBag size={16} color="white" className="mr-2" />
              <Text className="text-xs font-poppins-bold text-white ml-2">
                Mulai Belanja
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Voucher List */
          <FlatList
            data={vouchers}
            keyExtractor={(item, index) => item.id ? String(item.id) : String(index)}
            renderItem={renderVoucherCard}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </View>
  );
}
