import React, { useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import { OrderContext } from "../provider/OrderProvider";

const statusConfig = {
  pending: { label: "Pending", color: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
  confirmed: { label: "Dikonfirmasi", color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
  processing: { label: "Diproses", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  packaging: { label: "Packaging", color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
  out_for_delivery: { label: "Dalam Pengiriman", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  completed: { label: "Selesai", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  delivered: { label: "Terkirim", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  canceled: { label: "Dibatalkan", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
};

const toRupiah = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || { label: status, color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" };
  return (
    <View
      style={{
        backgroundColor: cfg.bg,
        borderColor: cfg.border,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
      }}
    >
      <Text style={{ color: cfg.color, fontSize: 10, fontWeight: "700" }}>
        {cfg.label}
      </Text>
    </View>
  );
};

const OrderCard = ({ order }) => {
  const navigation = useNavigation();
  const status = order?.order_status || "pending";
  const amount = Number(order?.order_amount || 0);
  const date = order?.created_at
    ? new Date(order.created_at).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "-";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate("/o/:id", { id: String(order.id) })}
      className="bg-white mx-4 mb-3 rounded-2xl p-4 border border-gray-100"
      style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-sm font-black text-gray-900">Order #{order.id}</Text>
          <Text className="text-xs text-gray-400 mt-0.5">{date}</Text>
        </View>
        <StatusBadge status={status} />
      </View>

      <View className="flex-row justify-between items-center pt-3 border-t border-gray-50">
        <Text className="text-base font-black text-green-700">{toRupiah(amount)}</Text>
        <View className="flex-row items-center">
          <Text className="text-xs text-green-700 font-semibold mr-1">Lihat Detail</Text>
          <FontAwesome5 name="chevron-right" size={10} color="#15803d" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function OrderListWidget() {
  const { orders, loading, error, fetchOrders } = useContext(OrderContext);

  if (loading && orders.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="text-gray-400 text-sm mt-3">Memuat pesanan...</Text>
      </View>
    );
  }

  if (error && orders.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
          <FontAwesome5 name="exclamation-triangle" size={28} color="#ef4444" />
        </View>
        <Text className="text-gray-700 font-bold text-base text-center mb-1">Gagal Memuat</Text>
        <Text className="text-gray-400 text-sm text-center mb-5">{error}</Text>
        <TouchableOpacity
          onPress={fetchOrders}
          className="bg-green-700 px-6 py-2.5 rounded-xl"
        >
          <Text className="text-white font-bold text-sm">Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loading && orders.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4">
          <FontAwesome5 name="shopping-bag" size={32} color="#9ca3af" />
        </View>
        <Text className="text-gray-700 font-bold text-base text-center mb-1">Belum Ada Pesanan</Text>
        <Text className="text-gray-400 text-sm text-center">
          Yuk mulai belanja produk segar dari Torufarm!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <OrderCard order={item} />}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={fetchOrders}
          colors={["#16a34a"]}
          tintColor="#16a34a"
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}
