import React, { useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import { OrderContext } from "../provider/OrderProvider";
import { path_product_img, orderDetail } from "../../../config/enpoints";
import { post } from "../../../data/api";

const statusConfig = {
  pending: { label: "Pending", color: "#f97316", bg: "#fff7ed", border: "#fed7aa", icon: "clock", iconColor: "#ea580c" },
  confirmed: { label: "Dikonfirmasi", color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", icon: "check-circle", iconColor: "#4f46e5" },
  processing: { label: "Diproses", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", icon: "box", iconColor: "#059669" },
  packaging: { label: "Packaging", color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd", icon: "box-open", iconColor: "#0284c7" },
  out_for_delivery: { label: "Diperjalanan", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", icon: "truck", iconColor: "#7c3aed" },
  delivered: { label: "Terkirim", color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", icon: "home", iconColor: "#16a34a" },
  returned: { label: "Dikembalikan", color: "#f43f5e", bg: "#fff1f2", border: "#fecdd3", icon: "undo", iconColor: "#e11d48" },
  failed: { label: "Pesanan Gagal", icon: "exclamation-circle", color: "#ef4444", bg: "#fef2f2", iconColor: "#dc2626" },
  canceled: { label: "Dibatalkan", icon: "times-circle", color: "#6b7280", bg: "#f3f4f6", iconColor: "#4b5563" },
};

// --- Komponen Skeleton untuk Loading Efek ---
const OrderSkeleton = () => {
  const fadeAnim = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <Animated.View 
      className="bg-white mx-4 mb-3 rounded-2xl p-3.5 border border-gray-100"
      style={{ opacity: fadeAnim, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className="w-8 h-8 rounded-full bg-gray-200 mr-2.5" />
          <View className="flex-1">
            <View className="w-24 h-3 bg-gray-200 rounded mb-2" />
            <View className="w-16 h-2 bg-gray-200 rounded" />
          </View>
        </View>
      </View>
      <View className="flex-row items-center mb-2.5 space-x-2">
        {[1, 2, 3].map(i => <View key={i} className="w-11 h-11 bg-gray-200 rounded-xl" />)}
      </View>
      <View className="flex-row justify-between items-center pt-2 border-t border-gray-50">
        <View className="w-16 h-2 bg-gray-200 rounded" />
        <View className="w-20 h-4 bg-gray-200 rounded" />
      </View>
    </Animated.View>
  );
};

const toRupiah = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;

const OrderCard = ({ order }) => {
  const navigation = useNavigation();
  const { orderImages, fetchOrderImages } = React.useContext(OrderContext);
  const status = order?.order_status || "pending";
  const amount = Number(order?.order_amount || 0);

  React.useEffect(() => {
    if (order?.id && !orderImages[order.id]) {
      fetchOrderImages(order.id);
    }
  }, [order?.id]);

  const date = order?.created_at
    ? new Date(order.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const cfg = statusConfig[status] || { label: status, icon: "receipt", color: "#6b7280", bg: "#f9fafb", iconColor: "#4b5563" };

  // Ambil data cache gambar untuk order ini
  const details = orderImages[order?.id] || [];

  return (
    <View
      className="bg-white mx-4 mb-3 rounded-2xl p-3.5 border border-gray-100"
      style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View 
            className="w-8 h-8 rounded-full items-center justify-center mr-2.5"
            style={{ backgroundColor: cfg.bg }}
          >
            <FontAwesome5 name={cfg.icon} size={12} color={cfg.iconColor} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-black text-gray-900 mb-0.5">{cfg.label}</Text>
            <Text className="text-[10px] text-gray-500">{cfg.label.split(' ')[0]} {date}</Text>
          </View>
        </View>
        <FontAwesome5 name="chevron-right" size={10} color="#4b5563" />
      </View>

      {/* Thumbnails (if available) */}
      {details.length > 0 && (
        <View className="flex-row items-center mb-2.5 space-x-2">
          {details.slice(0, 4).map((imgStr, idx) => {
            return (
              <View key={idx} className="w-11 h-11 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                {imgStr ? (
                  <Image source={{ uri: `${path_product_img}/${imgStr}` }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <FontAwesome5 name="image" size={10} color="#9ca3af" />
                  </View>
                )}
              </View>
            );
          })}
          {details.length > 4 && (
            <View className="w-11 h-11 bg-gray-50 rounded-xl border border-gray-100 items-center justify-center">
              <Text className="text-gray-600 font-bold text-xs">+{details.length - 4}</Text>
            </View>
          )}
        </View>
      )}

      {/* Footer / Total */}
      <Text className="text-[10px] text-gray-500 mb-3">
        Total Belanja: <Text className="font-bold text-gray-900 text-xs">{toRupiah(amount)}</Text>
      </Text>

      {/* Action Button */}
      <TouchableOpacity 
        activeOpacity={0.85}
        onPress={() => navigation.navigate("/o/:id", { id: String(order.id) })}
        className="w-full py-2.5 bg-green-700 rounded-xl items-center justify-center shadow-sm"
      >
        <Text className="text-white font-bold text-xs">Lihat Detail</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function OrderListWidget() {
  const { orders, loading, loadingMore, error, fetchOrders, loadMoreOrders } = React.useContext(OrderContext);

  if (loading && orders.length === 0) {
    return (
      <View className="flex-1 pt-3">
        {[1, 2, 3, 4].map(i => <OrderSkeleton key={i} />)}
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

  const sortedOrders = [...orders].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const handleRefresh = () => {
    fetchOrders(1, true);
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-2">
        <OrderSkeleton />
      </View>
    );
  };

  return (
    <FlatList
      data={sortedOrders}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <OrderCard order={item} />}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
      onEndReached={loadMoreOrders}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={handleRefresh}
          colors={["#16a34a"]}
          tintColor="#16a34a"
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}
