import React, { useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import { OrderDetailContext } from "../provider/OrderDetailProvider";

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

  // Check if Chat feature is active for this order (active when confirmed, processing, packaging, out_for_delivery, or shopping)
  const isChatActive = ["confirmed", "processing", "packaging", "out_for_delivery", "shopping"].includes(status);

  const handleOpenChat = () => {
    if (!isChatActive) return;
    navigation.navigate("/order-chat", { 
      orderId: order?.id,
      status: statusCfg.label,
      amount: order?.order_amount || 0,
      runnerName: order?.delivery_man ? `${order.delivery_man.f_name} ${order.delivery_man.l_name}` : "Runner Basegar",
      runnerPhone: order?.delivery_man?.phone || ""
    });
  };

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
          className="rounded-2xl p-4 mb-3 flex-row items-center"
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

          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              disabled={!isChatActive}
              onPress={handleOpenChat}
              className={`w-8 h-8 rounded-full items-center justify-center mr-1 ${isChatActive ? 'bg-emerald-600' : 'bg-gray-300 opacity-50'}`}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="comment-dots" size={14} color="white" />
            </TouchableOpacity>

            <Text className="text-xs text-gray-400">
              #{order?.id || "-"}
            </Text>
          </View>
        </View>

        {/* Chat Runner & Support Pesanan Bar */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!isChatActive}
          onPress={handleOpenChat}
          className={`rounded-2xl p-3.5 flex-row items-center justify-between mb-4 border ${
            isChatActive 
              ? "bg-emerald-700 border-emerald-800 shadow-sm" 
              : "bg-gray-100 border-gray-200 opacity-70"
          }`}
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${isChatActive ? "bg-emerald-800" : "bg-gray-300"}`}>
              <FontAwesome5 name="comments" size={16} color="white" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center space-x-1.5">
                <Text className={`text-xs font-bold ${isChatActive ? "text-white" : "text-gray-700"}`}>
                  Chat Runner & Support Pesanan
                </Text>
                {isChatActive && (
                  <View className="bg-emerald-500/40 px-1.5 py-0.5 rounded">
                    <Text className="text-[9px] font-bold text-white uppercase">Aktif ●</Text>
                  </View>
                )}
              </View>
              <Text className={`text-[10px] mt-0.5 ${isChatActive ? "text-emerald-100" : "text-gray-400"}`}>
                {isChatActive 
                  ? "Tanyakan update belanja & pengiriman langsung ke Runner / CS" 
                  : "Chat aktif otomatis saat status pesanan dikonfirmasi"}
              </Text>
            </View>
          </View>
          <FontAwesome5 
            name="chevron-right" 
            size={12} 
            color={isChatActive ? "white" : "#9ca3af"} 
          />
        </TouchableOpacity>

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
            {orderDetails.map((item, idx) => {
              let variantDisplay = item.variant;
              if (typeof item.variant === "string" && item.variant.startsWith("[")) {
                try {
                  const parsed = JSON.parse(item.variant);
                  if (Array.isArray(parsed)) variantDisplay = parsed.join(", ");
                } catch (e) {}
              } else if (Array.isArray(item.variant)) {
                variantDisplay = item.variant.join(", ");
              }
              
              return (
                <View
                  key={idx}
                  className="flex-row justify-between items-center py-2"
                  style={{ borderTopWidth: idx > 0 ? 1 : 0, borderColor: "#f3f4f6" }}
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-sm font-semibold text-gray-800" numberOfLines={2}>
                      {item.product_details?.name || item.name || "Produk"}
                    </Text>
                    {variantDisplay ? (
                      <View className="self-start bg-green-50 px-1.5 py-0.5 rounded border border-green-200 mt-1">
                        <Text className="text-[10px] text-green-700 font-bold">{variantDisplay}</Text>
                      </View>
                    ) : null}
                    <Text className="text-xs text-gray-400 mt-1">x{item.quantity || 1}</Text>
                  </View>
                  <Text className="text-sm font-bold text-green-700">
                    {toRupiah(Number(item.price || 0) * Number(item.quantity || 1))}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : error ? (
          <View className="bg-red-50 rounded-2xl p-4 mb-4 border border-red-100 flex-row items-center">
             <FontAwesome5 name="exclamation-circle" size={16} color="#ef4444" />
             <Text className="text-xs text-red-600 ml-2 flex-1">Item pesanan gagal dimuat dari server, namun status pesanan Anda tetap aman.</Text>
          </View>
        ) : null}

        {/* Order Summary */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-black text-gray-700 uppercase tracking-wider">
              Ringkasan Pembayaran
            </Text>
            {/* Badge jika item diupdate admin */}
            {(() => {
              const computedSubtotal = orderDetails.reduce(
                (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0
              );
              const storedSubtotal = Number(order?.order_amount || 0) - Number(order?.delivery_charge || 0);
              const diff = Math.abs(computedSubtotal - storedSubtotal);
              if (orderDetails.length > 0 && diff > 1) {
                return (
                  <View style={{ backgroundColor: '#fef9c3', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#fde047' }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#854d0e' }}>⚡ Diperbarui Admin</Text>
                  </View>
                );
              }
              return null;
            })()}
          </View>

          {/* Total Item — hitung dari orderDetails agar selalu akurat */}
          {(() => {
            const computedSubtotal = orderDetails.reduce(
              (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0
            );
            const deliveryCharge = Number(order?.delivery_charge || 0);
            const grandTotal = computedSubtotal + deliveryCharge;

            const payments = Array.isArray(order?.payments) ? order.payments : Array.isArray(order?.partial_payment) ? order.partial_payment : [];
            const isFullWallet = order?.payment_method === "wallet_payment";
            let partialAmount = payments.reduce((acc, curr) => {
              if (curr.payment_method === 'wallet_payment' || curr.paid_with === 'wallet_payment' || curr.paid_with === 'wallet' || curr.payment_status === 'paid') {
                return acc + Number(curr.paid_amount || curr.amount || 0);
              }
              return acc;
            }, 0) || Number(order?.partially_paid_amount || 0);

            if (isFullWallet) partialAmount = grandTotal;
            const isPartial = partialAmount > 0;

            return (
              <View className="w-full">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-500">Total Item</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {toRupiah(orderDetails.length > 0 ? computedSubtotal : Number(order?.order_amount || 0) - Number(order?.delivery_charge || 0))}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-500">Ongkos Kirim</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {toRupiah(deliveryCharge)}
                  </Text>
                </View>

                {isPartial && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-sm text-gray-500">Dipotong Wallet</Text>
                    <Text className="text-sm font-semibold text-orange-600">
                      -{toRupiah(partialAmount)}
                    </Text>
                  </View>
                )}

                <View
                  className="flex-row justify-between pt-2 mt-1"
                  style={{ borderTopWidth: 1, borderColor: "#f3f4f6" }}
                >
                  <Text className="text-sm font-black text-gray-900">{isPartial ? "Sisa Tagihan" : "Total Pembayaran"}</Text>
                  <Text className="text-base font-black text-green-700">
                    {toRupiah(Math.max(0, (orderDetails.length > 0 ? grandTotal : Number(order?.order_amount || 0)) - partialAmount))}
                  </Text>
                </View>
              </View>
            );
          })()}

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
              style={{ color: (order?.payment_status === "paid" || order?.payment_method === "wallet_payment" || order?.payment_method === "wallet") ? "#16a34a" : "#f97316" }}
            >
              {(order?.payment_status === "paid" || order?.payment_method === "wallet_payment" || order?.payment_method === "wallet") ? "Lunas" : "Belum Dibayar"}
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

        {/* Customer Service Screen Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("/cs")}
          className="bg-green-50 border border-green-200 rounded-2xl py-3.5 items-center flex-row justify-center mb-3"
        >
          <FontAwesome5 name="headset" size={16} color="#16a34a" />
          <Text className="text-green-700 font-bold text-sm ml-2">Hubungi CS Basegar</Text>
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
