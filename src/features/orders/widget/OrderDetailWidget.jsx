import React, { useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import { OrderDetailContext } from "../provider/OrderDetailProvider";

const WA_NUMBER = "6285298197900";


const toRupiah = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;

const statusConfig = {
  pending:          { label: "Pending",          color: "#f97316", bg: "#fff7ed", border: "#fed7aa", icon: "clock" },
  confirmed:        { label: "Dikonfirmasi",      color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", icon: "check-circle" },
  processing:       { label: "Diproses",          color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", icon: "cog" },
  packaging:        { label: "Packaging",         color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd", icon: "box" },
  out_for_delivery: { label: "Dalam Pengiriman",  color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", icon: "truck" },
  completed:        { label: "Selesai",           color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: "check-double" },
  delivered:        { label: "Terkirim",          color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: "check-double" },
  canceled:         { label: "Dibatalkan",        color: "#ef4444", bg: "#fef2f2", border: "#fecaca", icon: "times-circle" },
};

const TimelineStep = ({ label, desc, isActive, isCompleted }) => (
  <View className="flex-row mb-5">
    <View className="items-center mr-4">
      <View
        className="w-6 h-6 rounded-full items-center justify-center"
        style={{
          backgroundColor: isCompleted ? "#16a34a" : isActive ? "#fff" : "#f3f4f6",
          borderWidth: 2,
          borderColor: isCompleted ? "#16a34a" : isActive ? "#16a34a" : "#d1d5db",
        }}
      >
        {isCompleted ? (
          <FontAwesome5 name="check" size={10} color="#fff" />
        ) : (
          <View
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: isActive ? "#16a34a" : "#d1d5db" }}
          />
        )}
      </View>
    </View>
    <View className="flex-1 pb-5" style={{ borderLeftWidth: 0 }}>
      <Text
        className="text-[13px] font-bold"
        style={{ color: isActive || isCompleted ? "#111827" : "#9ca3af" }}
      >
        {label}
      </Text>
      <Text className="text-[10px] mt-0.5" style={{ color: "#9ca3af" }}>
        {desc}
      </Text>
    </View>
  </View>
);

export default function OrderDetailWidget() {
  const navigation = useNavigation();
  const { orderDetails, orderInfo, loading, refreshing, error, fetchDetails } = useContext(OrderDetailContext);

  const onRefresh = () => {
    if (fetchDetails) {
      fetchDetails(true);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="text-gray-400 text-sm mt-3">Memuat detail pesanan...</Text>
      </View>
    );
  }

  if (error && !orderInfo) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <FontAwesome5 name="exclamation-triangle" size={40} color="#ef4444" />
        <Text className="text-gray-700 font-bold text-base text-center mt-4 mb-2">Gagal Memuat Detail</Text>
        <Text className="text-gray-400 text-sm text-center">{error}</Text>
      </View>
    );
  }

  const order = orderInfo;
  const status = order?.order_status || "pending";
  const statusCfg = statusConfig[status] || statusConfig["pending"];

  // Parse delivery address
  const rawAddr = order?.delivery_address;
  const deliveryAddress = (() => {
    if (!rawAddr) return null;
    if (typeof rawAddr === "string") {
      try { return JSON.parse(rawAddr); } catch { return null; }
    }
    return rawAddr;
  })();

  // Timeline steps
  const isStep1Completed = ["processing", "out_for_delivery", "delivered", "completed"].includes(status);
  const isStep1Active    = status === "confirmed";
  const isStep2Completed = ["out_for_delivery", "delivered", "completed"].includes(status);
  const isStep2Active    = status === "processing" || status === "packaging";
  const isStep3Completed = ["delivered", "completed"].includes(status);
  const isStep3Active    = status === "out_for_delivery";
  const isStep4Completed = status === "delivered" || status === "completed";

  return (
    <ScrollView 
      className="flex-1 bg-gray-50" 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || false}
          onRefresh={onRefresh}
          colors={["#16a34a"]}
        />
      }
    >
      <View className="p-4">

        {/* Status Header */}
        <View
          className="rounded-2xl p-4 mb-4 flex-row items-center"
          style={{ backgroundColor: statusCfg.bg, borderWidth: 1, borderColor: statusCfg.border }}
        >
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: statusCfg.color + "20" }}
          >
            <FontAwesome5 name={statusCfg.icon} size={18} color={statusCfg.color} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold" style={{ color: statusCfg.color }}>
              STATUS PESANAN
            </Text>
            <Text className="text-base font-black text-gray-900 mt-0.5">
              {statusCfg.label}
            </Text>
          </View>
          <Text className="text-xs text-gray-400">
            #{order?.id || "-"}
          </Text>
        </View>

        {/* Delivery Address */}
        {deliveryAddress && (
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
            <View className="flex-row items-center mb-2">
              <FontAwesome5 name="map-marker-alt" size={14} color="#eab308" />
              <Text className="text-xs font-black text-gray-700 uppercase tracking-wider ml-2">
                Alamat Pengiriman
              </Text>
            </View>
            <Text className="text-sm font-bold text-gray-800">
              {deliveryAddress.contact_person_name || "-"} | {deliveryAddress.contact_person_number || "-"}
            </Text>
            <Text className="text-xs text-gray-500 mt-1 leading-relaxed">
              {deliveryAddress.address || "-"}
            </Text>
          </View>
        )}

        {/* Order Items */}
        {orderDetails.length > 0 ? (
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
            <Text className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3">
              Item Pesanan
            </Text>
            {orderDetails.map((item, idx) => (
              <View
                key={idx}
                className="flex-row justify-between items-center py-2"
                style={{ borderTopWidth: idx > 0 ? 1 : 0, borderColor: "#f3f4f6" }}
              >
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-semibold text-gray-800" numberOfLines={2}>
                    {item.product_details?.name || item.name || "Produk"}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-0.5">x{item.quantity || 1}</Text>
                </View>
                <Text className="text-sm font-bold text-green-700">
                  {toRupiah(Number(item.price || 0) * Number(item.quantity || 1))}
                </Text>
              </View>
            ))}
          </View>
        ) : error ? (
          <View className="bg-red-50 rounded-2xl p-4 mb-4 border border-red-100 flex-row items-center">
             <FontAwesome5 name="exclamation-circle" size={16} color="#ef4444" />
             <Text className="text-xs text-red-600 ml-2 flex-1">Item pesanan gagal dimuat dari server, namun status pesanan Anda tetap aman.</Text>
          </View>
        ) : null}

        {/* Order Summary */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <Text className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3">
            Ringkasan Pembayaran
          </Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-500">Total Item</Text>
            <Text className="text-sm font-semibold text-gray-800">
              {toRupiah(Number(order?.order_amount || 0) - Number(order?.delivery_charge || 0))}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-500">Ongkos Kirim</Text>
            <Text className="text-sm font-semibold text-gray-800">
              {toRupiah(order?.delivery_charge || 0)}
            </Text>
          </View>
          <View
            className="flex-row justify-between pt-2 mt-1"
            style={{ borderTopWidth: 1, borderColor: "#f3f4f6" }}
          >
            <Text className="text-sm font-black text-gray-900">Total Pembayaran</Text>
            <Text className="text-base font-black text-green-700">
              {toRupiah(order?.order_amount || 0)}
            </Text>
          </View>
          <View className="flex-row justify-between mt-2">
            <Text className="text-xs text-gray-400">Metode Pembayaran</Text>
            <Text className="text-xs font-bold text-gray-700 uppercase">
              {order?.payment_method || "-"}
            </Text>
          </View>
          <View className="flex-row justify-between mt-1">
            <Text className="text-xs text-gray-400">Status Pembayaran</Text>
            <Text
              className="text-xs font-bold"
              style={{ color: order?.payment_status === "paid" ? "#16a34a" : "#f97316" }}
            >
              {order?.payment_status === "paid" ? "Lunas" : "Belum Dibayar"}
            </Text>
          </View>
        </View>

        {/* Delivery Timeline */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <Text className="text-xs font-black text-gray-700 uppercase tracking-wider mb-4">
            Status Pengiriman
          </Text>
          <TimelineStep
            label="Pesanan Dikonfirmasi"
            desc="Toko telah menerima dan mengkonfirmasi pesanan Anda"
            isActive={isStep1Active}
            isCompleted={isStep1Completed}
          />
          <TimelineStep
            label="Sedang Diproses"
            desc="Produk sedang disiapkan oleh tim Torufarm"
            isActive={isStep2Active}
            isCompleted={isStep2Completed}
          />
          <TimelineStep
            label="Dalam Pengiriman"
            desc="Pesanan dalam perjalanan menuju alamat Anda"
            isActive={isStep3Active}
            isCompleted={isStep3Completed}
          />
          <TimelineStep
            label="Pesanan Tiba"
            desc="Pesanan telah berhasil diterima"
            isActive={false}
            isCompleted={isStep4Completed}
          />
        </View>

        {/* WhatsApp CS Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            const msg = order?.id
              ? `Halo, saya ingin bertanya tentang pesanan #${order.id}`
              : `Halo, saya ingin bertanya tentang pesanan saya`;
            Linking.openURL(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`);
          }}
          className="bg-green-50 border border-green-200 rounded-2xl py-3.5 items-center flex-row justify-center mb-3"
        >
          <FontAwesome5 name="whatsapp" size={16} color="#16a34a" />
          <Text className="text-green-700 font-bold text-sm ml-2">Hubungi CS via WhatsApp</Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("/orders")}
          className="bg-white border border-gray-200 rounded-2xl py-3.5 items-center mb-4"
        >
          <Text className="text-gray-700 font-bold text-sm">Kembali ke Daftar Pesanan</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}
