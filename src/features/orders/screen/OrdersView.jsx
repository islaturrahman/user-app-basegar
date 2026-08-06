import React from "react";
import { View } from "react-native";
import OrderProvider from "../provider/OrderProvider";
import OrderListWidget from "../widget/OrderListWidget";
import AppBar from "../../../components/AppBar";

export default function OrdersView() {
  return (
    <View className="flex-1 bg-gray-50">
      <AppBar title="Pesanan Saya" />
      <OrderProvider>
        <View className="flex-1">
          <OrderListWidget />
        </View>
      </OrderProvider>
    </View>
  );
}
